# GitGuard CLI

[![npm version](https://img.shields.io/npm/v/@azizbekdevuz/gitguard-cli.svg)](https://www.npmjs.com/package/@azizbekdevuz/gitguard-cli)
[![npm downloads](https://img.shields.io/npm/dm/@azizbekdevuz/gitguard-cli.svg)](https://www.npmjs.com/package/@azizbekdevuz/gitguard-cli)

Command-line tool for capturing and analyzing Git repository state. Part of [GitGuard Agent](https://github.com/azizbekdevuz/gitguardian)—a cross-platform system that helps developers safely recover from merge conflicts, detached HEAD, and rebase-in-progress scenarios.

**Read-only by design**: Snapshot generation never modifies your repository.

## Requirements

- **Node.js** 20+
- **Git** repository (run from within a repo)

## Installation

```bash
npm install -g @azizbekdevuz/gitguard-cli
```

Or with pnpm:

```bash
pnpm add -g @azizbekdevuz/gitguard-cli
```

Or with yarn:

```bash
yarn global add @azizbekdevuz/gitguard-cli
```

## Quick Start

```bash
# Generate a snapshot (output to stdout)
gitguard snapshot --pretty > snapshot.json

# Send snapshot to GitGuard API and open incident room in browser
gitguard send --open
```

## Commands

### `gitguard snapshot`

Generate a read-only snapshot of your repository state. Captures branch info, status, recent commits, reflog, conflict details, rebase state, and diff stats.

```bash
gitguard snapshot                    # Output JSON to stdout
gitguard snapshot -o snapshot.json   # Write to file
gitguard snapshot --pretty           # Pretty-print JSON
```

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Write snapshot to file instead of stdout |
| `--pretty` | Pretty-print JSON output |
| `-h, --help` | Display help |

### `gitguard send`

Capture repository state and send it to the GitGuard API for AI analysis. Returns an incident room URL with diagnosis and recovery plan.

```bash
gitguard send                        # Send to default API (localhost:3000)
gitguard send -u https://api.example.com  # Custom API URL
gitguard send --open                 # Open incident room in browser after upload
```

| Option | Description |
|--------|-------------|
| `-u, --api-url <url>` | GitGuard API URL (default: `http://localhost:3000`) |
| `-o, --open` | Open the incident room in browser after upload |
| `-h, --help` | Display help |

**Environment variable**: `GITGUARD_API_URL` overrides the default API URL when set.

## What the Snapshot Includes

- Branch info (head, tracking, ahead/behind)
- Detached HEAD detection
- Rebase state (in progress, onto, etc.)
- Unmerged files with conflict snippets (up to 5 files for `snapshot`, up to 10 for `send`; 3 blocks per file)
- Staged, modified, and untracked files
- Recent commit log and reflog
- Commit graph for history visualization
- Diff stats for changed files
- Merge metadata (MERGE_HEAD, merge message)

## Development

If you're working from the [monorepo](https://github.com/azizbekdevuz/gitguardian):

```bash
# From project root
pnpm build:cli
pnpm --filter @gitguard/cli -- snapshot --pretty > snapshot.json

# Or link globally for development
cd apps/cli && pnpm link --global
gitguard snapshot --pretty
```

## Related Packages

- [@azizbekdevuz/gitguard-schema](https://www.npmjs.com/package/@azizbekdevuz/gitguard-schema) – Shared Zod schemas (SnapshotV1, PlanV1)

## License

MIT
