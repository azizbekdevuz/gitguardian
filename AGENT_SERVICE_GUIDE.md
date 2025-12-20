# GitGuard Agent Service - Complete Guide

## 📋 Overview

The `apps/agent` directory contains a **Python FastAPI microservice** that provides **SpoonOS-powered AI analysis** for git snapshots. It's a separate service that runs independently from the Next.js web app.

---

## 🎯 What is `apps/agent`?

**`apps/agent`** is a **Python-based AI service** that:

1. **Uses SpoonOS Framework** - Implements a multi-stage AI pipeline using SpoonOS StateGraph
2. **Provides Advanced AI Analysis** - Uses Claude AI to generate detailed conflict explanations and recovery plans
3. **Runs as Separate Service** - FastAPI server on port 8000 (default)
4. **Optional but Recommended** - The web app can work without it (uses fallback), but you get much better AI analysis with it

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js Web   │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP POST
         │ /analyze
         ▼
┌─────────────────┐
│  Python Agent   │
│  (Port 8000)    │
│  SpoonOS + AI   │
└─────────────────┘
```

### Two Agent Implementations:

1. **Python Agent (`apps/agent/main.py`)** - Full SpoonOS implementation
   - Uses SpoonOS StateGraph for pipeline
   - Advanced AI analysis with Claude
   - Multi-stage processing
   - **RECOMMENDED for hackathon**

2. **TypeScript Agent (`apps/web/src/lib/agent/`)** - Fallback implementation
   - Works without Python service
   - Basic analysis without SpoonOS
   - Used when Python agent is unavailable

---

## 🔄 How It Works

### SpoonOS Pipeline (Python Agent)

The Python agent uses a **5-stage SpoonOS StateGraph pipeline**:

```
1. detect_issue    → Identify problem type (merge_conflict, detached_head, etc.)
2. build_graph     → Create repository visualization
3. extract_conflicts → Parse conflict files and hunks
4. collect_signals → Normalize data for AI
5. generate_analysis → Use Claude AI to generate explanations and plan
```

Each stage:
- Processes the state
- Adds traces for debugging
- Passes data to next stage
- Can be visualized in the "SpoonOS Pipeline" tab

---

## 🔌 Integration with Web App

### How the Web App Calls the Agent:

1. **User uploads snapshot** → `/api/snapshots/ingest` or `/api/sessions`
2. **Web app tries to call Python agent**:
   ```typescript
   // apps/web/src/app/api/snapshots/ingest/route.ts
   const agentResult = await fetch(`${AGENT_URL}/analyze`, {
     method: 'POST',
     body: JSON.stringify({ snapshot, options })
   });
   ```
3. **If agent available** → Uses SpoonOS analysis
4. **If agent unavailable** → Falls back to basic TypeScript analysis

### Environment Variable:

```bash
# In apps/web/.env.local
AGENT_URL=http://localhost:8000  # Default if not set
```

---

## 🚀 How to Start the Agent Service

### Prerequisites:

1. **Python 3.8+** installed
2. **SpoonOS installed** (`spoon-ai` package)
3. **Anthropic API Key** (for Claude AI)

### Step-by-Step Setup:

#### 1. Navigate to Agent Directory

```bash
cd apps/agent
```

#### 2. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `spoon-ai` - SpoonOS framework ⭐
- `anthropic` - Claude AI client
- `pydantic` - Data validation
- `python-dotenv` - Environment variables

#### 4. Create `.env` File

Create `apps/agent/.env`:

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional (defaults shown)
MODEL_NAME=claude-sonnet-4-20250514
PORT=8000
HOST=0.0.0.0
```

**Get Anthropic API Key:**
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Create API key
4. Copy to `.env` file

#### 5. Start the Service

**Option A: Direct Python (Simple)**
```bash
python main.py
```

**Option B: Uvicorn (Development with auto-reload)**
```bash
uvicorn main:app --reload --port 8000
```

**Option C: Production**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

You should see:
```
Starting GitGuard Agent with SpoonOS on 0.0.0.0:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 6. Verify It's Working

Open another terminal and test:

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "gitguard-agent",
  "version": "2.0.0",
  "framework": "SpoonOS"
}
```

---

## 🧪 Testing the Agent

### Test with a Snapshot:

1. **Start the agent** (port 8000)
2. **Start the web app** (port 3000)
3. **Upload a snapshot** via the web UI
4. **Check agent logs** - You should see:
   ```
   INFO: POST /analyze
   INFO: Running SpoonOS pipeline...
   INFO: Stage 1: detect_issue completed
   INFO: Stage 2: build_graph completed
   ...
   ```

### Manual API Test:

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d @test-snapshot.json
```

---

## 📊 What the Agent Does

### Input:
- Git snapshot JSON (from CLI or web upload)

### Output:
```json
{
  "success": true,
  "analysis": {
    "issueType": "merge_conflict",
    "riskLevel": "medium",
    "summary": "AI-generated explanation...",
    "repoGraph": { "nodes": [...], "edges": [...] },
    "conflicts": [
      {
        "path": "src/app.ts",
        "hunks": [...],
        "whatHappened": "AI explanation...",
        "whyConflict": "AI explanation...",
        "recommendation": "keep_ours or combine..."
      }
    ],
    "planSteps": [
      {
        "title": "Step 1: Review conflicts",
        "commands": ["git status"],
        "undo": { "commands": [...], "description": "..." }
      }
    ],
    "signals": { ... }
  },
  "durationMs": 2345,
  "pipelineTraces": [
    { "stage": "detect_issue", "duration_ms": 10, ... },
    { "stage": "build_graph", "duration_ms": 15, ... },
    ...
  ]
}
```

---

## 🔍 Key Files Explained

### `apps/agent/main.py` (809 lines)

**Main Components:**

1. **SpoonOS Graph Definition** (lines 50-71)
   - `GitAnalysisState` - State that flows through pipeline

2. **SpoonOS Tools** (lines 77-264)
   - `DetectIssueTool` - Detects issue type
   - `BuildGraphTool` - Creates repo visualization
   - `ExtractConflictsTool` - Parses conflicts

3. **SpoonOS Graph Nodes** (lines 270-494)
   - `detect_issue_node()` - Stage 1
   - `build_graph_node()` - Stage 2
   - `extract_conflicts_node()` - Stage 3
   - `collect_signals_node()` - Stage 4
   - `generate_analysis_node()` - Stage 5 (uses Claude AI)

4. **Graph Assembly** (lines 629-654)
   - Creates StateGraph
   - Connects nodes in sequence
   - Compiles the pipeline

5. **API Endpoints** (lines 684-801)
   - `GET /health` - Health check
   - `POST /analyze` - Main analysis endpoint
   - `POST /explain/conflict` - Conflict explanation

### `apps/agent/requirements.txt`

Lists all Python dependencies including SpoonOS.

---

## ⚠️ Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'spoon_ai'"

**Solution:**
```bash
pip install spoon-ai
# Or reinstall all dependencies:
pip install -r requirements.txt
```

### Issue 2: "ANTHROPIC_API_KEY not found"

**Solution:**
1. Create `.env` file in `apps/agent/`
2. Add: `ANTHROPIC_API_KEY=your_key_here`
3. Restart the service

### Issue 3: "Connection refused" from web app

**Solution:**
1. Make sure agent is running: `curl http://localhost:8000/health`
2. Check `AGENT_URL` in web app's `.env.local`
3. Check CORS settings in `main.py` (line 32) - should allow `localhost:3000`

### Issue 4: Agent works but web app doesn't use it

**Solution:**
- Check web app logs for errors
- Verify `AGENT_URL` environment variable
- The web app falls back silently if agent fails - check console logs

---

## 🎯 For Hackathon: Why Use the Agent?

### ✅ Advantages:

1. **SpoonOS Integration** - Required for hackathon track
2. **Better AI Analysis** - More detailed explanations
3. **Pipeline Visualization** - Shows SpoonOS stages in UI
4. **Professional Architecture** - Microservice pattern
5. **Judging Points** - Demonstrates framework mastery

### ⚠️ Without Agent:

- Web app still works (uses TypeScript fallback)
- But you lose:
  - SpoonOS pipeline visualization
  - Advanced AI explanations
  - Framework integration points

---

## 🔧 Development Workflow

### Typical Development:

1. **Terminal 1**: Run Python agent
   ```bash
   cd apps/agent
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   uvicorn main:app --reload --port 8000
   ```

2. **Terminal 2**: Run Next.js web app
   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Terminal 3**: Test with CLI
   ```bash
   cd some-git-repo
   gitguard snapshot > snapshot.json
   # Upload via web UI or use API
   ```

### Hot Reload:

- **Python agent**: Use `--reload` flag with uvicorn
- **Next.js**: Auto-reloads on file changes

---

## 📝 Environment Variables Summary

### `apps/agent/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...        # Required
MODEL_NAME=claude-sonnet-4-20250514 # Optional
PORT=8000                            # Optional
HOST=0.0.0.0                         # Optional
```

### `apps/web/.env.local`:
```bash
AGENT_URL=http://localhost:8000     # Optional (defaults to this)
ANTHROPIC_API_KEY=sk-ant-...        # For fallback TypeScript agent
```

---

## 🎓 Understanding SpoonOS Integration

### What is SpoonOS?

SpoonOS is an **agentic AI framework** that provides:
- **StateGraph** - Multi-stage processing pipelines
- **Tools** - Reusable AI tools
- **Agents** - AI agents with tool-calling
- **ChatBot** - LLM integration

### How We Use It:

1. **StateGraph** - Our 5-stage pipeline
2. **Tools** - Custom tools for git analysis
3. **ChatBot** - Claude AI integration
4. **Traces** - Track each stage's output

### Why It Matters for Hackathon:

- **Judging Criteria**: "Utilization of Spoon OS"
- **Track Relevance**: Agentic Infrastructure track
- **Technical Excellence**: Shows framework mastery

---

## 🚨 Quick Start Checklist

- [ ] Python 3.8+ installed
- [ ] Navigate to `apps/agent`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
- [ ] Install: `pip install -r requirements.txt`
- [ ] Create `.env` with `ANTHROPIC_API_KEY`
- [ ] Start: `python main.py` or `uvicorn main:app --reload`
- [ ] Test: `curl http://localhost:8000/health`
- [ ] Start web app in another terminal
- [ ] Upload snapshot and verify agent is used

---

## 💡 Pro Tips

1. **Keep Agent Running**: Start it first, then web app
2. **Check Logs**: Agent logs show each pipeline stage
3. **Test Health Endpoint**: Quick way to verify it's running
4. **Use Fallback**: Web app works without agent, but less powerful
5. **Monitor API Calls**: Check network tab in browser devtools

---

## 📚 Additional Resources

- **SpoonOS Docs**: https://xspoonai.github.io/docs/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Anthropic API**: https://docs.anthropic.com/

---

## ❓ FAQ

**Q: Do I need the agent for the hackathon?**  
A: **YES!** It's required to demonstrate SpoonOS usage.

**Q: Can I run without Anthropic API key?**  
A: Agent won't work without it. Get a free key from Anthropic.

**Q: What if agent fails?**  
A: Web app falls back to TypeScript agent, but you lose SpoonOS features.

**Q: Can I modify the pipeline?**  
A: Yes! Edit `main.py` to add/remove stages or modify logic.

**Q: How do I debug?**  
A: Check agent logs, web app console, and use `/health` endpoint.

---

## 🎉 Summary

The `apps/agent` service is:
- ✅ **Python FastAPI microservice**
- ✅ **Uses SpoonOS StateGraph**
- ✅ **Provides advanced AI analysis**
- ✅ **Runs on port 8000**
- ✅ **Called by web app via HTTP**
- ✅ **Optional but recommended for hackathon**

**Start it, keep it running, and enjoy better AI-powered git recovery!** 🚀

