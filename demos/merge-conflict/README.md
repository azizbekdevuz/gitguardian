# Demo: Merge Conflict Recovery

This demo shows how to use GitGuard to recover from a merge conflict.

## Setup

Run these commands to create a repository with a merge conflict:

```bash
# Create a new test repo
mkdir test-merge-conflict
cd test-merge-conflict
git init

# Create initial file
echo "line 1" > file.txt
echo "line 2" >> file.txt
echo "line 3" >> file.txt
git add file.txt
git commit -m "Initial commit"

# Create a feature branch and modify line 2
git checkout -b feature
sed -i 's/line 2/line 2 - feature change/' file.txt  # Linux/macOS
# On Windows PowerShell: (Get-Content file.txt) -replace 'line 2', 'line 2 - feature change' | Set-Content file.txt
git add file.txt
git commit -m "Feature: modify line 2"

# Go back to main and make a conflicting change
git checkout main
sed -i 's/line 2/line 2 - main change/' file.txt  # Linux/macOS
# On Windows PowerShell: (Get-Content file.txt) -replace 'line 2', 'line 2 - main change' | Set-Content file.txt
git add file.txt
git commit -m "Main: modify line 2"

# Now try to merge - this will create a conflict!
git merge feature
```

## Generate Snapshot

After the merge conflict is created:

```bash
# Generate snapshot from the repo with conflict
gitguard snapshot --pretty > snapshot.json
```

## Analyze with GitGuard

1. Start the web app: `cd apps/web && pnpm dev`
2. Open http://localhost:3000
3. Upload the snapshot.json file
4. Click "Generate Recovery Plan"
5. Follow the step-by-step recovery instructions

## Expected Results

GitGuard should:
- Detect the merge conflict
- Show the conflicting file (file.txt)
- Provide steps to resolve:
  1. Review conflicting files
  2. Edit files to resolve conflicts
  3. Stage resolved files
  4. Complete the merge with a commit
- Include undo options for each step
- Show reflog recovery as a fallback

## Cleanup

```bash
cd ..
rm -rf test-merge-conflict
```
