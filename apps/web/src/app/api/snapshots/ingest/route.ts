import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema } from '@gitguard/schema';
import { createSession, createSnapshot, updateSessionStatus, saveTrace, createAnalysis, createConflictFile, createConflictHunk, createPlanStep } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createHash } from 'crypto';

const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8000';

interface AgentAnalysis {
  issueType: string;
  summary: string;
  repoGraph?: {
    nodes: Array<{ id: string; type: string; label: string; sha?: string; isCurrent?: boolean }>;
    edges: Array<{ from: string; to: string; type?: string }>;
  };
  conflicts?: Array<{
    path: string;
    highLevelSummary?: string;
    hunks: Array<{
      index: number;
      startLine?: number;
      endLine?: number;
      baseText: string;
      oursText: string;
      theirsText: string;
      explanation?: string;
      suggestedChoice?: string;
      suggestedContent?: string;
    }>;
  }>;
  plan: Array<{
    index: number;
    title: string;
    rationale?: string;
    commands: string[];
    verify: string[];
    undo: string[];
    dangerLevel: string;
  }>;
}

/**
 * POST /api/snapshots/ingest
 *
 * Ingest a snapshot from CLI, analyze with SpoonOS agent, and return session URL.
 * This is the main entry point for the CLI `gitguard send` command.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { snapshot: rawSnapshot } = body;

    // Validate snapshot
    const snapshot = SnapshotV1Schema.parse(rawSnapshot);

    // Get current user (optional - uploads can be anonymous)
    const session = await auth();
    const userId = session?.user?.id || null;

    // Create hash of repo root for deduplication
    const repoRootHash = createHash('sha256')
      .update(snapshot.repoRoot)
      .digest('hex')
      .slice(0, 16);

    // Generate title from branch and issue
    const title = generateTitle(snapshot);

    // Create session in database
    const gitSession = await createSession({
      title,
      os: snapshot.platform,
      repoRootHash,
      userId,
      status: 'analyzing',
    });

    // Save snapshot
    const snapshotRecord = await createSnapshot({
      gitSessionId: gitSession.id,
      snapshotJson: snapshot,
    });

    // Save ingest trace
    await saveTrace(
      gitSession.id,
      'ingest',
      snapshotRecord.id,
      { source: 'api' },
      { snapshotId: snapshotRecord.id },
      startTime
    );

    // Call SpoonOS agent for analysis
    const analyzeStartTime = Date.now();
    let agentResponse: { 
      success: boolean; 
      analysis?: AgentAnalysis; 
      error?: string;
      pipelineTraces?: Array<{
        stage: string;
        duration_ms?: number;
        durationMs?: number;
        input?: unknown;
        inputJson?: unknown;
        output?: unknown;
        outputJson?: unknown;
        success?: boolean;
      }>;
    };

    try {
      console.log(`[INGEST] Calling Python agent at ${AGENT_URL}/analyze`);
      const agentResult = await fetch(`${AGENT_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot,
          options: {
            includeGraph: true,
            maxConflictFiles: 10,
            maxHunksPerFile: 5,
          },
        }),
      });

      if (!agentResult.ok) {
        const errorText = await agentResult.text();
        console.error(`[INGEST] Agent returned ${agentResult.status}: ${errorText}`);
        throw new Error(`Agent returned ${agentResult.status}: ${errorText}`);
      }

      agentResponse = await agentResult.json();
      console.log(`[INGEST] Agent response received - success: ${agentResponse.success}, traces: ${agentResponse.pipelineTraces?.length || 0}`);
      
      // Save SpoonOS pipeline traces if available from Python agent
      if (agentResponse.pipelineTraces && Array.isArray(agentResponse.pipelineTraces)) {
        let cumulativeTime = analyzeStartTime;
        for (const trace of agentResponse.pipelineTraces) {
          const traceStart = cumulativeTime;
          cumulativeTime += (trace.duration_ms || trace.durationMs || 0);
          await saveTrace(
            gitSession.id,
            trace.stage || 'unknown',
            snapshotRecord.id,
            trace.input || trace.inputJson || {},
            trace.output || trace.outputJson || {},
            traceStart,
            trace.success !== false,
          );
        }
      }
    } catch (agentError) {
      // Fallback to basic analysis if agent is unavailable
      console.error('[INGEST] ❌ Agent unavailable, using fallback analysis:', agentError);
      console.error('[INGEST] Error details:', agentError instanceof Error ? agentError.message : String(agentError));
      agentResponse = generateFallbackAnalysis(snapshot);
    }

    // Save analyze trace (for compatibility)
    await saveTrace(
      gitSession.id,
      'analyze',
      snapshotRecord.id,
      { snapshotId: snapshotRecord.id },
      agentResponse,
      analyzeStartTime,
      agentResponse.success
    );

    if (!agentResponse.success || !agentResponse.analysis) {
      await updateSessionStatus(gitSession.id, 'error');
      return NextResponse.json(
        { error: agentResponse.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    const analysis = agentResponse.analysis;

    // Store analysis in database
    const analysisRecord = await createAnalysis({
      gitSessionId: gitSession.id,
      snapshotId: snapshotRecord.id,
      issueType: analysis.issueType,
      summary: analysis.summary,
      repoGraphJson: analysis.repoGraph,
    });

    // Store conflict files and hunks
    if (analysis.conflicts) {
      for (const conflict of analysis.conflicts) {
        const conflictFile = await createConflictFile({
          analysisId: analysisRecord.id,
          path: conflict.path,
          highLevelSummary: conflict.highLevelSummary,
        });

        for (const hunk of conflict.hunks) {
          await createConflictHunk({
            conflictFileId: conflictFile.id,
            index: hunk.index,
            startLine: hunk.startLine,
            endLine: hunk.endLine,
            baseText: hunk.baseText,
            oursText: hunk.oursText,
            theirsText: hunk.theirsText,
            explanation: hunk.explanation,
            suggestedChoice: hunk.suggestedChoice,
            suggestedContent: hunk.suggestedContent,
          });
        }
      }
    }

    // Store plan steps
    for (const step of analysis.plan) {
      await createPlanStep({
        analysisId: analysisRecord.id,
        index: step.index,
        title: step.title,
        rationale: step.rationale,
        commandsJson: step.commands,
        verifyJson: step.verify,
        undoJson: step.undo,
        dangerLevel: step.dangerLevel,
      });
    }

    // Update session status to ready
    await updateSessionStatus(gitSession.id, 'ready');

    // Build response URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/incident/${gitSession.id}`;

    return NextResponse.json({
      sessionId: gitSession.id,
      url: sessionUrl,
      analysis: {
        issueType: analysis.issueType,
        summary: analysis.summary,
      },
    });
  } catch (error) {
    console.error('Error ingesting snapshot:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function generateTitle(snapshot: {
  branch: { head: string };
  isDetachedHead: boolean;
  unmergedFiles: unknown[];
  rebaseState: { inProgress: boolean };
}): string {
  const parts: string[] = [];

  if (snapshot.unmergedFiles.length > 0) {
    parts.push('Merge Conflict');
  } else if (snapshot.rebaseState.inProgress) {
    parts.push('Rebase');
  } else if (snapshot.isDetachedHead) {
    parts.push('Detached HEAD');
  }

  parts.push(`on ${snapshot.branch.head}`);

  return parts.join(' ') || 'Git Recovery Session';
}

function generateFallbackAnalysis(snapshot: {
  unmergedFiles: Array<{ path: string; conflictBlocks?: Array<{ oursContent: string; theirsContent: string; context?: string }> }>;
  isDetachedHead: boolean;
  rebaseState: { inProgress: boolean };
  branch: { head: string };
}): { success: boolean; analysis: AgentAnalysis } {
  let issueType = 'unknown';
  let summary = 'Repository state analysis';

  if (snapshot.unmergedFiles.length > 0) {
    issueType = 'merge_conflict';
    summary = `Found ${snapshot.unmergedFiles.length} file(s) with merge conflicts. Review each conflict and choose how to resolve.`;
  } else if (snapshot.rebaseState.inProgress) {
    issueType = 'rebase_in_progress';
    summary = 'A rebase operation is in progress. You can continue, skip, or abort.';
  } else if (snapshot.isDetachedHead) {
    issueType = 'detached_head';
    summary = 'HEAD is detached. Consider creating a branch to save your work.';
  } else {
    issueType = 'clean';
    summary = 'Repository appears to be in a clean state.';
  }

  // Extract conflicts
  const conflicts = snapshot.unmergedFiles.map((file) => ({
    path: file.path,
    hunks: (file.conflictBlocks || []).map((block, i) => ({
      index: i,
      baseText: block.context || '',
      oursText: block.oursContent || '',
      theirsText: block.theirsContent || '',
    })),
  }));

  // Generate basic plan
  const plan: AgentAnalysis['plan'] = [];

  if (issueType === 'merge_conflict') {
    plan.push(
      {
        index: 0,
        title: 'Review conflicts',
        rationale: 'Understand what changes conflict before resolving',
        commands: ['git status', 'git diff --name-only --diff-filter=U'],
        verify: ['git status'],
        undo: [],
        dangerLevel: 'safe',
      },
      {
        index: 1,
        title: 'Resolve each conflict',
        rationale: 'Edit files to remove conflict markers and choose correct content',
        commands: ['# Edit files manually or use the Conflict Explorer'],
        verify: ['git diff <file>'],
        undo: ['git checkout --conflict=merge <file>'],
        dangerLevel: 'safe',
      },
      {
        index: 2,
        title: 'Stage resolved files',
        rationale: 'Mark conflicts as resolved',
        commands: ['git add <files>'],
        verify: ['git status'],
        undo: ['git reset HEAD <files>'],
        dangerLevel: 'safe',
      },
      {
        index: 3,
        title: 'Complete merge',
        rationale: 'Commit the merge',
        commands: ['git commit'],
        verify: ['git log -1'],
        undo: ['git reset --soft HEAD~1'],
        dangerLevel: 'caution',
      }
    );
  } else if (issueType === 'detached_head') {
    plan.push(
      {
        index: 0,
        title: 'Check current state',
        rationale: 'Understand where HEAD is pointing',
        commands: ['git log --oneline -5', 'git status'],
        verify: [],
        undo: [],
        dangerLevel: 'safe',
      },
      {
        index: 1,
        title: 'Create branch to save work',
        rationale: 'Preserve commits before switching',
        commands: ['git branch temp-save'],
        verify: ['git branch'],
        undo: ['git branch -d temp-save'],
        dangerLevel: 'safe',
      },
      {
        index: 2,
        title: 'Return to main branch',
        rationale: 'Switch back to your working branch',
        commands: [`git checkout ${snapshot.branch.head}`],
        verify: ['git status'],
        undo: [],
        dangerLevel: 'safe',
      }
    );
  } else if (issueType === 'rebase_in_progress') {
    plan.push(
      {
        index: 0,
        title: 'Check rebase status',
        rationale: 'Understand the current rebase state',
        commands: ['git status'],
        verify: [],
        undo: [],
        dangerLevel: 'safe',
      },
      {
        index: 1,
        title: 'Option A: Continue rebase',
        rationale: 'If conflicts are resolved, continue',
        commands: ['git add .', 'git rebase --continue'],
        verify: ['git status'],
        undo: ['git rebase --abort'],
        dangerLevel: 'caution',
      },
      {
        index: 2,
        title: 'Option B: Abort rebase',
        rationale: 'Cancel and return to previous state',
        commands: ['git rebase --abort'],
        verify: ['git log -3'],
        undo: [],
        dangerLevel: 'safe',
      }
    );
  }

  return {
    success: true,
    analysis: {
      issueType,
      summary,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      plan,
    },
  };
}
