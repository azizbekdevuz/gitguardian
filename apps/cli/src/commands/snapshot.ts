import { writeFileSync } from 'node:fs';
import { SnapshotV1Schema, type SnapshotV1 } from '@gitguard/schema';
import { collectGitInfo } from '../collectors/git-info.js';
import { parseStatus } from '../parsers/status-parser.js';
import { parseBranches } from '../parsers/branch-parser.js';
import { parseLog } from '../parsers/log-parser.js';
import { parseReflog } from '../parsers/reflog-parser.js';
import { parseDiffStat } from '../parsers/diffstat-parser.js';
import { detectRebaseState } from '../collectors/rebase-detector.js';
import { extractConflicts } from '../collectors/conflict-extractor.js';

interface SnapshotOptions {
  output?: string;
  pretty?: boolean;
}

export async function snapshotCommand(options: SnapshotOptions): Promise<void> {
  try {
    // Collect git information
    const gitInfo = await collectGitInfo();

    // Parse status
    const statusInfo = parseStatus(gitInfo.status);

    // Parse branches
    const branchInfo = parseBranches(gitInfo.branches, statusInfo.branch);

    // Parse logs
    const logEntries = parseLog(gitInfo.log);
    const reflogEntries = parseReflog(gitInfo.reflog);

    // Parse diff stats
    const diffStats = parseDiffStat(gitInfo.diffStat);

    // Detect rebase state
    const rebaseState = await detectRebaseState(gitInfo.gitDir);

    // Extract conflict details for up to 5 unmerged files (increased for better conflict exploration)
    const unmergedFiles = await extractConflicts(
      gitInfo.repoRoot,
      statusInfo.unmergedPaths.slice(0, 5)
    );

    // Build snapshot
    const snapshot: SnapshotV1 = {
      version: 1,
      timestamp: new Date().toISOString(),
      platform: process.platform as 'win32' | 'darwin' | 'linux',
      repoRoot: gitInfo.repoRoot,
      gitDir: gitInfo.gitDir,

      branch: branchInfo,
      isDetachedHead: statusInfo.isDetachedHead,

      rebaseState,

      unmergedFiles,
      stagedFiles: statusInfo.stagedFiles,
      modifiedFiles: statusInfo.modifiedFiles,
      untrackedFiles: statusInfo.untrackedFiles,

      recentLog: logEntries,
      recentReflog: reflogEntries,

      // NEW: Commit graph for history visualization
      commitGraph: gitInfo.commitGraph || undefined,

      // NEW: Diff stats for file summary
      diffStats: diffStats.length > 0 ? diffStats : undefined,

      // NEW: Merge metadata
      mergeHead: gitInfo.mergeHead || undefined,
      mergeMessage: gitInfo.mergeMessage || undefined,

      rawStatus: gitInfo.status,
      rawBranches: gitInfo.branches,
    };

    // Validate with Zod
    const validated = SnapshotV1Schema.parse(snapshot);

    // Output
    const jsonOutput = options.pretty
      ? JSON.stringify(validated, null, 2)
      : JSON.stringify(validated);

    if (options.output) {
      writeFileSync(options.output, jsonOutput, 'utf-8');
      console.error(`Snapshot written to: ${options.output}`);
    } else {
      console.log(jsonOutput);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.message.includes('not a git repository')) {
        console.error('Please run this command from within a git repository.');
      }
    }
    process.exit(1);
  }
}
