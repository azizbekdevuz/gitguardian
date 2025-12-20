# Demo: Detached HEAD / Rebase Recovery

This demo shows how to use GitGuard to recover from detached HEAD state and rebase issues.

## Scenario 1: Detached HEAD

### Setup

```bash
# Create a test repo
mkdir test-detached-head
cd test-detached-head
git init

# Create some commits
echo "v1" > file.txt
git add file.txt
git commit -m "Version 1"

echo "v2" > file.txt
git add file.txt
git commit -m "Version 2"

echo "v3" > file.txt
git add file.txt
git commit -m "Version 3"

# Checkout an old commit (creates detached HEAD)
git checkout HEAD~2

# Make changes in detached state (dangerous!)
echo "important work" > new-feature.txt
git add new-feature.txt
git commit -m "Important work in detached state"
```

### Generate Snapshot

```bash
gitguard snapshot --pretty > snapshot.json
```

### Expected Recovery

GitGuard should:
- Detect detached HEAD state
- Identify uncommitted/committed work at risk
- Suggest creating a branch to save work
- Provide reflog recovery path

---

## Scenario 2: Rebase in Progress

### Setup

```bash
# Create a test repo
mkdir test-rebase
cd test-rebase
git init

# Create initial commits on main
echo "base" > file.txt
git add file.txt
git commit -m "Base commit"

echo "main-change" > file.txt
git add file.txt
git commit -m "Main change"

# Create feature branch from base
git checkout HEAD~1
git checkout -b feature
echo "feature-change" > file.txt
git add file.txt
git commit -m "Feature change"

# Try to rebase onto main (will conflict)
git rebase main

# Now we're stuck in rebase!
```

### Generate Snapshot

```bash
gitguard snapshot --pretty > snapshot.json
```

### Expected Recovery

GitGuard should:
- Detect rebase in progress
- Show current step and total steps
- Provide options:
  1. Continue rebase (after resolving conflicts)
  2. Skip current commit
  3. Abort rebase (return to original state)
- Include reflog recovery for each option

---

## Analyze with GitGuard

1. Start the web app: `cd apps/web && pnpm dev`
2. Open http://localhost:3000
3. Upload the snapshot.json file
4. Click "Generate Recovery Plan"
5. Follow the step-by-step recovery instructions

## Cleanup

```bash
cd ..
rm -rf test-detached-head test-rebase
```
