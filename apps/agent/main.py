"""
GitGuard Agent Service - SpoonOS-powered Git Analysis
Uses SpoonOS Graph System for multi-stage AI pipeline
"""
import os
import time
import json
from typing import Optional, TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# SpoonOS imports
from spoon_ai.graph import StateGraph, END
from spoon_ai.chat import ChatBot
from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.tools import ToolManager
from spoon_ai.tools.base import BaseTool

load_dotenv()

app = FastAPI(
    title="GitGuard Agent",
    description="SpoonOS-powered Git incident analysis service with graph-based AI pipeline",
    version="2.0.0",
)

# CORS for web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SpoonOS LLM
MODEL = os.getenv("MODEL_NAME", "claude-sonnet-4-20250514")
llm = ChatBot(
    llm_provider="anthropic",
    model_name=MODEL,
)


# ==========================================
# SpoonOS Graph State Definition
# ==========================================

class GitAnalysisState(TypedDict):
    """State that flows through the SpoonOS graph pipeline."""
    # Input
    snapshot: dict
    options: dict

    # Stage outputs
    issue_type: str
    risk_level: str
    repo_graph: dict
    conflicts: list
    signals: dict

    # AI-generated outputs
    summary: str
    conflict_explanations: dict
    plan_steps: list

    # Metadata
    stage_traces: list
    error: str


# ==========================================
# SpoonOS Tools
# ==========================================

class DetectIssueTool(BaseTool):
    """Tool to detect the primary issue type from a git snapshot."""
    name: str = "detect_issue"
    description: str = "Analyze git snapshot to detect the primary issue (merge_conflict, detached_head, rebase_in_progress, clean)"
    parameters: dict = {
        "type": "object",
        "properties": {
            "snapshot": {"type": "object", "description": "Git repository snapshot"}
        },
        "required": ["snapshot"]
    }

    async def execute(self, snapshot: dict) -> dict:
        unmerged = snapshot.get("unmergedFiles", [])
        is_detached = snapshot.get("isDetachedHead", False)
        rebase_state = snapshot.get("rebaseState", {})

        if unmerged and len(unmerged) > 0:
            issue_type = "merge_conflict"
            risk = "high" if len(unmerged) > 3 else "medium"
        elif rebase_state.get("inProgress", False):
            issue_type = "rebase_in_progress"
            risk = "medium"
        elif is_detached:
            issue_type = "detached_head"
            risk = "medium"
        else:
            staged = snapshot.get("stagedFiles", [])
            modified = snapshot.get("modifiedFiles", [])
            if not staged and not modified:
                issue_type = "clean"
                risk = "low"
            else:
                issue_type = "unknown"
                risk = "low"

        return {"issue_type": issue_type, "risk_level": risk}


class BuildGraphTool(BaseTool):
    """Tool to build repository visualization graph."""
    name: str = "build_graph"
    description: str = "Build a visual graph representation of the repository state"
    parameters: dict = {
        "type": "object",
        "properties": {
            "snapshot": {"type": "object", "description": "Git repository snapshot"}
        },
        "required": ["snapshot"]
    }

    async def execute(self, snapshot: dict) -> dict:
        nodes = []
        edges = []

        branch = snapshot.get("branch", {})
        head_oid = branch.get("oid", "")[:7]
        head_name = branch.get("head", "HEAD")
        is_detached = snapshot.get("isDetachedHead", False)

        # Add HEAD node
        nodes.append({
            "id": "head",
            "type": "head",
            "label": "HEAD",
            "sha": head_oid,
            "isCurrent": True,
            "isDetached": is_detached,
            "x": 400, "y": 50  # Position for visualization
        })

        # Add current branch
        if not is_detached and head_name:
            nodes.append({
                "id": f"branch-{head_name}",
                "type": "branch",
                "label": head_name,
                "sha": head_oid,
                "isCurrent": True,
                "x": 550, "y": 50
            })
            edges.append({"from": "head", "to": f"branch-{head_name}", "type": "ref"})

        # Add commits from log
        recent_log = snapshot.get("recentLog", [])[:8]
        for i, entry in enumerate(recent_log):
            commit_id = f"commit-{i}"
            sha = entry.get("hash", "")[:7]
            message = entry.get("message", "")[:40]
            refs = entry.get("refs", [])

            nodes.append({
                "id": commit_id,
                "type": "commit",
                "label": message,
                "sha": sha,
                "isCurrent": (i == 0),
                "x": 400,
                "y": 120 + (i * 80)
            })

            # Add refs
            for j, ref in enumerate(refs):
                if ref and not ref.startswith("HEAD"):
                    ref_id = f"ref-{ref.replace('/', '-')}"
                    ref_type = "remote" if "/" in ref else "branch"
                    nodes.append({
                        "id": ref_id,
                        "type": ref_type,
                        "label": ref,
                        "sha": sha,
                        "x": 550 + (j * 100),
                        "y": 120 + (i * 80)
                    })
                    edges.append({"from": ref_id, "to": commit_id, "type": "ref"})

            # Connect to previous commit
            if i > 0:
                edges.append({"from": f"commit-{i-1}", "to": commit_id, "type": "parent"})

        # Connect HEAD to first commit
        if recent_log:
            edges.append({"from": "head", "to": "commit-0", "type": "pointer"})

        # Add merge head if exists
        merge_head = snapshot.get("mergeHead")
        if merge_head:
            nodes.append({
                "id": "merge-head",
                "type": "merge",
                "label": "MERGE_HEAD",
                "sha": merge_head[:7],
                "x": 250, "y": 50
            })
            edges.append({"from": "merge-head", "to": "commit-0", "type": "merge"})

        return {
            "nodes": nodes,
            "edges": edges,
            "headRef": head_oid,
            "mergeHeadRef": merge_head[:7] if merge_head else None
        }


class ExtractConflictsTool(BaseTool):
    """Tool to extract and structure conflict information."""
    name: str = "extract_conflicts"
    description: str = "Extract conflict files and hunks from snapshot"
    parameters: dict = {
        "type": "object",
        "properties": {
            "snapshot": {"type": "object"},
            "max_files": {"type": "integer", "default": 10},
            "max_hunks": {"type": "integer", "default": 5}
        },
        "required": ["snapshot"]
    }

    async def execute(self, snapshot: dict, max_files: int = 10, max_hunks: int = 5) -> list:
        conflicts = []
        unmerged = snapshot.get("unmergedFiles", [])[:max_files]

        for file_data in unmerged:
            path = file_data.get("path", "unknown")
            blocks = file_data.get("conflictBlocks", [])[:max_hunks]

            hunks = []
            for i, block in enumerate(blocks):
                hunks.append({
                    "index": i,
                    "startLine": block.get("startLine"),
                    "endLine": block.get("endLine"),
                    "baseText": block.get("context", ""),
                    "oursText": block.get("oursContent", ""),
                    "theirsText": block.get("theirsContent", ""),
                    "linesAdded": len(block.get("oursContent", "").split("\n")),
                    "linesRemoved": len(block.get("theirsContent", "").split("\n")),
                })

            conflicts.append({
                "path": path,
                "hunks": hunks,
                "hunkCount": len(hunks),
                "severity": "high" if len(hunks) > 2 else "medium" if len(hunks) > 1 else "low"
            })

        return conflicts


# ==========================================
# SpoonOS Graph Nodes
# ==========================================

async def detect_issue_node(state: GitAnalysisState) -> dict:
    """Stage 1: Detect issue type and risk level."""
    start = time.time()
    snapshot = state["snapshot"]

    tool = DetectIssueTool()
    result = await tool.execute(snapshot)

    trace = {
        "stage": "detect_issue",
        "duration_ms": int((time.time() - start) * 1000),
        "output": result
    }

    return {
        "issue_type": result["issue_type"],
        "risk_level": result["risk_level"],
        "stage_traces": state.get("stage_traces", []) + [trace]
    }


async def build_graph_node(state: GitAnalysisState) -> dict:
    """Stage 2: Build repository visualization graph."""
    start = time.time()

    tool = BuildGraphTool()
    graph = await tool.execute(state["snapshot"])

    trace = {
        "stage": "build_graph",
        "duration_ms": int((time.time() - start) * 1000),
        "output": {"nodes": len(graph["nodes"]), "edges": len(graph["edges"])}
    }

    return {
        "repo_graph": graph,
        "stage_traces": state.get("stage_traces", []) + [trace]
    }


async def extract_conflicts_node(state: GitAnalysisState) -> dict:
    """Stage 3: Extract conflict information."""
    start = time.time()

    if state["issue_type"] != "merge_conflict":
        return {"conflicts": [], "stage_traces": state.get("stage_traces", [])}

    tool = ExtractConflictsTool()
    options = state.get("options", {})
    conflicts = await tool.execute(
        state["snapshot"],
        max_files=options.get("maxConflictFiles", 10),
        max_hunks=options.get("maxHunksPerFile", 5)
    )

    trace = {
        "stage": "extract_conflicts",
        "duration_ms": int((time.time() - start) * 1000),
        "output": {"conflict_count": len(conflicts)}
    }

    return {
        "conflicts": conflicts,
        "stage_traces": state.get("stage_traces", []) + [trace]
    }


async def collect_signals_node(state: GitAnalysisState) -> dict:
    """Stage 4: Collect normalized signals for AI analysis."""
    start = time.time()
    snapshot = state["snapshot"]

    signals = {
        "primaryIssue": state["issue_type"],
        "riskLevel": state["risk_level"],
        "conflictCount": len(state.get("conflicts", [])),
        "isDetachedHead": snapshot.get("isDetachedHead", False),
        "isRebaseInProgress": snapshot.get("rebaseState", {}).get("inProgress", False),
        "currentBranch": snapshot.get("branch", {}).get("head", "unknown"),
        "hasStagedChanges": len(snapshot.get("stagedFiles", [])) > 0,
        "hasUnstagedChanges": len(snapshot.get("modifiedFiles", [])) > 0,
        "hasUntrackedFiles": len(snapshot.get("untrackedFiles", [])) > 0,
        "recentActions": [
            entry.get("action", "") for entry in snapshot.get("recentReflog", [])[:5]
        ],
    }

    trace = {
        "stage": "collect_signals",
        "duration_ms": int((time.time() - start) * 1000),
        "output": signals
    }

    return {
        "signals": signals,
        "stage_traces": state.get("stage_traces", []) + [trace]
    }


async def generate_analysis_node(state: GitAnalysisState) -> dict:
    """Stage 5: Use LLM to generate analysis, explanations, and plan."""
    start = time.time()

    snapshot = state["snapshot"]
    signals = state["signals"]
    conflicts = state.get("conflicts", [])

    # Build detailed context for LLM
    context = f"""You are GitGuard, an expert Git recovery assistant. Analyze this repository state and provide specific, actionable guidance.

## Current Situation
- **Issue Type**: {signals["primaryIssue"].replace("_", " ").title()}
- **Risk Level**: {signals["riskLevel"].upper()}
- **Branch**: {signals["currentBranch"]}
- **Conflicts**: {signals["conflictCount"]} file(s)
- **Detached HEAD**: {"Yes" if signals["isDetachedHead"] else "No"}
- **Rebase in Progress**: {"Yes" if signals["isRebaseInProgress"] else "No"}

## Repository State
- Staged files: {len(snapshot.get("stagedFiles", []))}
- Modified files: {len(snapshot.get("modifiedFiles", []))}
- Untracked files: {len(snapshot.get("untrackedFiles", []))}

## Recent Git Actions
{chr(10).join(f"- {action}" for action in signals["recentActions"]) if signals["recentActions"] else "No recent actions recorded"}
"""

    if conflicts:
        context += "\n## Conflict Details\n"
        for cf in conflicts[:5]:
            context += f"\n### {cf['path']} ({cf['hunkCount']} hunks, {cf['severity']} severity)\n"
            for hunk in cf["hunks"][:2]:
                context += f"""
**Hunk {hunk['index'] + 1}** (lines {hunk.get('startLine', '?')}-{hunk.get('endLine', '?')}):
- OURS ({hunk['linesAdded']} lines):
```
{hunk['oursText'][:300]}{'...' if len(hunk['oursText']) > 300 else ''}
```
- THEIRS ({hunk['linesRemoved']} lines):
```
{hunk['theirsText'][:300]}{'...' if len(hunk['theirsText']) > 300 else ''}
```
"""

    prompt = f"""{context}

## Your Task
Provide a comprehensive analysis in JSON format with these fields:

1. **summary**: A clear 2-3 sentence explanation of what happened and why (be specific to THIS situation, not generic)

2. **conflictExplanations**: For each conflict file, provide:
   - "path": file path
   - "whatHappened": Specific explanation of what each side changed
   - "whyConflict": Why these changes conflict
   - "recommendation": Specific resolution strategy (keep ours, keep theirs, or how to combine)
   - "priority": "high", "medium", or "low"

3. **planSteps**: Array of specific recovery steps, each with:
   - "title": Clear action title
   - "description": Detailed explanation of what this step does and why
   - "commands": Exact git commands to run (with actual file names from the conflicts)
   - "expectedOutput": What user should see after running
   - "verify": Commands to verify success
   - "undo": Commands to undo if something goes wrong
   - "dangerLevel": "safe", "caution", or "dangerous"
   - "estimatedTime": "quick" (< 1 min), "moderate" (1-5 min), or "careful" (> 5 min)

4. **quickActions**: Array of 2-3 one-click actions for common resolutions:
   - "label": Button label
   - "command": Single git command
   - "description": What it does

Be SPECIFIC to this user's actual situation. Reference actual file names and branch names. Focus on SAFE, REVERSIBLE solutions.

Respond with ONLY valid JSON, no markdown code blocks."""

    try:
        response = await llm.chat(prompt)
        content = response if isinstance(response, str) else response.content

        # Parse JSON response
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            # Try to extract from markdown
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0]
                result = json.loads(json_str)
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0]
                result = json.loads(json_str)
            else:
                raise

        trace = {
            "stage": "generate_analysis",
            "duration_ms": int((time.time() - start) * 1000),
            "output": {"has_summary": "summary" in result, "plan_steps": len(result.get("planSteps", []))}
        }

        return {
            "summary": result.get("summary", "Analysis complete."),
            "conflict_explanations": {
                exp["path"]: exp for exp in result.get("conflictExplanations", [])
            },
            "plan_steps": result.get("planSteps", []),
            "stage_traces": state.get("stage_traces", []) + [trace]
        }

    except Exception as e:
        trace = {
            "stage": "generate_analysis",
            "duration_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }

        # Fallback plan
        return {
            "summary": f"Detected {signals['primaryIssue'].replace('_', ' ')} in your repository.",
            "conflict_explanations": {},
            "plan_steps": generate_fallback_plan(signals["primaryIssue"], snapshot, conflicts),
            "stage_traces": state.get("stage_traces", []) + [trace]
        }


def generate_fallback_plan(issue_type: str, snapshot: dict, conflicts: list) -> list:
    """Generate fallback plan without AI."""
    branch = snapshot.get("branch", {}).get("head", "main")

    if issue_type == "merge_conflict":
        conflict_files = [c["path"] for c in conflicts]
        return [
            {
                "title": "Review Conflict Files",
                "description": f"You have conflicts in {len(conflicts)} file(s): {', '.join(conflict_files[:3])}. Review each to understand what changed.",
                "commands": ["git status", "git diff --name-only --diff-filter=U"],
                "expectedOutput": "List of files with UU (unmerged) status",
                "verify": ["git status"],
                "undo": [],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            },
            {
                "title": "Resolve Conflicts",
                "description": "Open each conflicted file and resolve the conflict markers (<<<<<<, ======, >>>>>>).",
                "commands": [f"# Edit {f}" for f in conflict_files[:3]],
                "expectedOutput": "Files no longer contain conflict markers",
                "verify": ["git diff"],
                "undo": ["git checkout --conflict=merge <file>"],
                "dangerLevel": "safe",
                "estimatedTime": "careful"
            },
            {
                "title": "Stage Resolved Files",
                "description": "Mark conflicts as resolved by staging the files.",
                "commands": [f"git add {f}" for f in conflict_files[:3]],
                "expectedOutput": "Files moved from 'Unmerged' to 'Staged'",
                "verify": ["git status"],
                "undo": ["git reset HEAD <file>"],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            },
            {
                "title": "Complete Merge",
                "description": "Commit the merge resolution.",
                "commands": ["git commit -m 'Resolve merge conflicts'"],
                "expectedOutput": "Merge commit created",
                "verify": ["git log -1"],
                "undo": ["git reset --soft HEAD~1"],
                "dangerLevel": "caution",
                "estimatedTime": "quick"
            }
        ]
    elif issue_type == "detached_head":
        return [
            {
                "title": "Check Current Position",
                "description": "See where HEAD is pointing and what branches exist.",
                "commands": ["git log --oneline -5", "git branch -a"],
                "expectedOutput": "Current commit history and available branches",
                "verify": ["git status"],
                "undo": [],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            },
            {
                "title": "Save Your Work",
                "description": "Create a branch to preserve current commits before moving.",
                "commands": ["git branch temp-save-work"],
                "expectedOutput": "New branch 'temp-save-work' created at current commit",
                "verify": ["git branch"],
                "undo": ["git branch -d temp-save-work"],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            },
            {
                "title": f"Return to {branch}",
                "description": f"Switch back to your main working branch '{branch}'.",
                "commands": [f"git checkout {branch}"],
                "expectedOutput": f"Switched to branch '{branch}'",
                "verify": ["git status"],
                "undo": ["git checkout temp-save-work"],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            }
        ]
    elif issue_type == "rebase_in_progress":
        return [
            {
                "title": "Check Rebase Status",
                "description": "Understand where you are in the rebase process.",
                "commands": ["git status", "git rebase --show-current-patch"],
                "expectedOutput": "Current rebase step and conflict details",
                "verify": [],
                "undo": [],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            },
            {
                "title": "Option A: Continue Rebase",
                "description": "If you've resolved conflicts, continue the rebase.",
                "commands": ["git add .", "git rebase --continue"],
                "expectedOutput": "Rebase continues to next commit or completes",
                "verify": ["git status"],
                "undo": ["git rebase --abort"],
                "dangerLevel": "caution",
                "estimatedTime": "moderate"
            },
            {
                "title": "Option B: Abort Rebase",
                "description": "Cancel the rebase and return to the original state.",
                "commands": ["git rebase --abort"],
                "expectedOutput": "Returns to state before rebase started",
                "verify": ["git status", "git log -3"],
                "undo": [],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            }
        ]
    else:
        return [
            {
                "title": "Check Status",
                "description": "Review the current repository state.",
                "commands": ["git status", "git log --oneline -5"],
                "expectedOutput": "Current branch and recent commits",
                "verify": [],
                "undo": [],
                "dangerLevel": "safe",
                "estimatedTime": "quick"
            }
        ]


# ==========================================
# Build SpoonOS Graph
# ==========================================

def create_analysis_graph() -> StateGraph:
    """Create the SpoonOS graph for git analysis pipeline."""
    graph = StateGraph(GitAnalysisState)

    # Add nodes
    graph.add_node("detect_issue", detect_issue_node)
    graph.add_node("build_graph", build_graph_node)
    graph.add_node("extract_conflicts", extract_conflicts_node)
    graph.add_node("collect_signals", collect_signals_node)
    graph.add_node("generate_analysis", generate_analysis_node)

    # Set entry point
    graph.set_entry_point("detect_issue")

    # Define edges (sequential pipeline)
    graph.add_edge("detect_issue", "build_graph")
    graph.add_edge("build_graph", "extract_conflicts")
    graph.add_edge("extract_conflicts", "collect_signals")
    graph.add_edge("collect_signals", "generate_analysis")
    graph.add_edge("generate_analysis", END)

    return graph.compile()


# Create the compiled graph
analysis_pipeline = create_analysis_graph()


# ==========================================
# Request/Response Models
# ==========================================

class AnalyzeOptions(BaseModel):
    includeGraph: bool = True
    maxConflictFiles: int = 10
    maxHunksPerFile: int = 5


class AnalyzeRequest(BaseModel):
    snapshot: dict
    options: Optional[AnalyzeOptions] = None


class AnalyzeResponse(BaseModel):
    success: bool
    analysis: Optional[dict] = None
    error: Optional[str] = None
    durationMs: Optional[int] = None
    pipelineTraces: Optional[list] = None


# ==========================================
# API Endpoints
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "gitguard-agent",
        "version": "2.0.0",
        "framework": "SpoonOS"
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_snapshot(request: AnalyzeRequest):
    """Analyze a git snapshot using SpoonOS graph pipeline."""
    start_time = time.time()

    try:
        # Initialize state
        initial_state: GitAnalysisState = {
            "snapshot": request.snapshot,
            "options": request.options.model_dump() if request.options else {},
            "issue_type": "",
            "risk_level": "",
            "repo_graph": {},
            "conflicts": [],
            "signals": {},
            "summary": "",
            "conflict_explanations": {},
            "plan_steps": [],
            "stage_traces": [],
            "error": ""
        }

        # Run the SpoonOS pipeline
        result = await analysis_pipeline.invoke(initial_state)

        duration_ms = int((time.time() - start_time) * 1000)

        # Enhance conflicts with explanations
        conflicts_with_explanations = []
        for conflict in result.get("conflicts", []):
            explanation = result.get("conflict_explanations", {}).get(conflict["path"], {})
            conflicts_with_explanations.append({
                **conflict,
                "whatHappened": explanation.get("whatHappened"),
                "whyConflict": explanation.get("whyConflict"),
                "recommendation": explanation.get("recommendation"),
                "priority": explanation.get("priority", "medium")
            })

        return AnalyzeResponse(
            success=True,
            analysis={
                "issueType": result["issue_type"],
                "riskLevel": result["risk_level"],
                "summary": result["summary"],
                "repoGraph": result["repo_graph"],
                "conflicts": conflicts_with_explanations,
                "planSteps": result["plan_steps"],
                "signals": result["signals"]
            },
            durationMs=duration_ms,
            pipelineTraces=result.get("stage_traces", [])
        )

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        return AnalyzeResponse(
            success=False,
            error=str(e),
            durationMs=duration_ms
        )


@app.post("/explain/conflict")
async def explain_conflict(file_path: str, hunk_index: int, ours: str, theirs: str):
    """Get detailed AI explanation for a specific conflict hunk."""
    prompt = f"""Analyze this specific git merge conflict and provide guidance:

**File**: {file_path}
**Hunk**: #{hunk_index + 1}

**OURS (your current branch)**:
```
{ours}
```

**THEIRS (incoming changes)**:
```
{theirs}
```

Provide a JSON response with:
1. "oursIntent": What your code is trying to do
2. "theirsIntent": What the incoming code is trying to do
3. "conflictReason": Why these changes conflict
4. "recommendation": "keep_ours", "keep_theirs", "combine", or "needs_review"
5. "combinedCode": If recommend combine, provide the merged code
6. "explanation": Human-readable explanation of your recommendation

Be specific and reference the actual code."""

    try:
        response = await llm.chat(prompt)
        content = response if isinstance(response, str) else response.content

        try:
            result = json.loads(content)
        except:
            if "```json" in content:
                result = json.loads(content.split("```json")[1].split("```")[0])
            else:
                result = {"explanation": content}

        return {"success": True, "explanation": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting GitGuard Agent with SpoonOS on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
