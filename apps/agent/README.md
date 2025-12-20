# GitGuard Agent Service

SpoonOS-powered Git incident analysis service using Claude AI.

## Setup

1. Create virtual environment:
```bash
cd apps/agent
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

4. Run the service:
```bash
python main.py
# Or with uvicorn for development:
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /analyze
Analyze a git snapshot and return structured analysis.

**Request:**
```json
{
  "snapshot": { ... },
  "options": {
    "includeGraph": true,
    "maxConflictFiles": 10,
    "maxHunksPerFile": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "issueType": "merge_conflict",
    "summary": "...",
    "repoGraph": { ... },
    "conflicts": [ ... ],
    "plan": [ ... ]
  },
  "durationMs": 1234
}
```

### POST /explain/conflict
Get AI explanation for a specific conflict hunk.

### GET /health
Health check endpoint.

## Environment Variables

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `MODEL_NAME` - Claude model to use (default: claude-sonnet-4-20250514)
- `MAX_TOKENS` - Max tokens for AI responses (default: 4096)
- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)
