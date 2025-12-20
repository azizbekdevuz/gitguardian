# GitGuard Agent

A cross-platform (Windows/macOS/Linux) system that helps developers safely recover from git issues:
- Merge conflicts
- Detached HEAD state
- Rebase-in-progress scenarios

**Reversible by Design**: Every action includes explicit undo paths. Dangerous operations require explicit opt-in.

## Architecture

```
gitguard-agent/
├── packages/
│   └── schema/          # Shared Zod schemas (SnapshotV1, PlanV1)
├── apps/
│   ├── cli/             # Node.js CLI for generating snapshots
│   └── web/             # Next.js web app with agent pipeline
└── demos/               # Reproducible test cases
```

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Packages

```bash
pnpm build
```

### 3. Generate a Snapshot (CLI)

Navigate to a git repository with issues:

```bash
# From any git repo
npx gitguard snapshot --pretty > snapshot.json

# Or if installed globally
gitguard snapshot --pretty > snapshot.json
```

### 4. Run the Web App

```bash
cd apps/web
pnpm dev
```

Open http://localhost:3000 and upload your snapshot.json.

## CLI Usage

```bash
gitguard snapshot [options]

Options:
  -o, --output <file>  Write snapshot to file instead of stdout
  --pretty             Pretty-print JSON output
  -h, --help           Display help
```

The CLI collects:
- `git status --porcelain=v2 --branch`
- `git branch -vv`
- `git log --oneline --decorate -n 30`
- `git reflog -n 30`
- Conflict snippets from unmerged files (up to 2 files, 3 blocks each)
- Rebase state detection

## Web App Features

### Agent Pipeline

1. **Collector**: Normalizes snapshot into signals
2. **Classifier**: Identifies issue type (merge_conflict, detached_head, rebase_in_progress)
3. **Planner**: Generates step-by-step recovery plan with undo options
4. **Verifier**: Validates progress when new snapshot is uploaded

### UI Tabs

- **Diagnosis**: View repository state and detected issues
- **Plan**: Step-by-step recovery with copy buttons and undo for each step
- **Verify**: Upload new snapshot to check progress
- **Trace**: View raw agent pipeline outputs

## LLM Integration

Set your Anthropic API key for enhanced planning:

```bash
export ANTHROPIC_API_KEY=your-key-here
```

Without an API key, the system uses mock responses suitable for demo/development.

## Database

SQLite database (`gitguard.db`) stores:
- Sessions
- Snapshots
- Plans
- Agent traces

## Demos

See the `/demos` directory for reproducible test cases:

- [Merge Conflict Demo](./demos/merge-conflict/README.md)
- [Detached HEAD / Rebase Demo](./demos/detached-head/README.md)

## Cross-Platform Notes

The CLI uses git commands (not direct filesystem access) to ensure cross-platform compatibility:
- `git rev-parse --git-dir` instead of assuming `.git` location
- `git rev-parse --git-path` for rebase detection
- Line ending normalization (CRLF → LF)

## Development

```bash
# Watch mode for schema package
cd packages/schema && pnpm dev

# Watch mode for CLI
cd apps/cli && pnpm dev

# Dev server for web
cd apps/web && pnpm dev
```

## Safety Principles

1. **Never destructive by default**: All suggested actions are reversible
2. **Explicit undo paths**: Every step includes undo commands
3. **Dangerous operations gated**: `reset --hard`, `push --force` require explicit flag
4. **Reflog fallback**: Always provides reflog-based recovery option
5. **Read-only CLI**: Snapshot generation never modifies the repository

## License

MIT
