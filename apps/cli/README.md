# GitGuard CLI

Command-line tool for capturing and analyzing Git repository state.

## Installation & Usage

Since this is a local package (not published to npm), use one of these methods:

### Method 1: Using pnpm (Recommended - Easiest)

From the **project root**:
```bash
# Build the CLI first (one time)
pnpm build:cli

# Then use via pnpm (use -- to pass arguments)
pnpm --filter @gitguard/cli -- snapshot --pretty > snapshot.json
# pnpm --filter @gitguard/cli -- send
# pnpm --filter @gitguard/cli -- send --open
```

### Method 2: Direct Node Execution (After Building)

```bash
# Build first (one time)
pnpm build:cli

# Run directly from project root
node apps/cli/dist/index.js snapshot --pretty > snapshot.json
# node apps/cli/dist/index.js send
# node apps/cli/dist/index.js send --open
```

### Method 3: Global Link (For Development)

```bash
# From project root
pnpm build:cli
cd apps/cli
pnpm link --global

# Now you can use `gitguard` from anywhere on your system
gitguard snapshot --pretty > snapshot.json
gitguard send
gitguard send --open
```

### Method 4: Create an Alias (PowerShell)

Add to your PowerShell profile (`$PROFILE`):
```powershell
function gitguard { node D:\Workplace\Web\gitguardian\apps\cli\dist\index.js $args }
```

Then use normally:
```bash
gitguard snapshot --pretty > snapshot.json
gitguard send
```

## Commands

### `gitguard snapshot`

Generate a read-only snapshot of your repository state.

```bash
gitguard snapshot                    # Output to stdout
gitguard snapshot -o snapshot.json  # Save to file
gitguard snapshot --pretty           # Pretty-print JSON
```

### `gitguard send`

Capture repository state and send to GitGuard for AI analysis.

```bash
gitguard send                        # Send to default API (localhost:3000)
gitguard send -u https://api.example.com  # Custom API URL
gitguard send --open                # Open incident room in browser
```

## Requirements

- Node.js 18+
- Git repository with issues (conflicts, detached HEAD, rebase in progress)
- Build the CLI first: `pnpm build:cli` or `cd apps/cli && pnpm build`

