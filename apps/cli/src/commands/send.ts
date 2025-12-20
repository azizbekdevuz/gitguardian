import { SnapshotV1Schema, type SnapshotV1 } from '@gitguard/schema';
import { collectGitInfo } from '../collectors/git-info.js';
import { parseStatus } from '../parsers/status-parser.js';
import { parseBranches } from '../parsers/branch-parser.js';
import { parseLog } from '../parsers/log-parser.js';
import { parseReflog } from '../parsers/reflog-parser.js';
import { parseDiffStat } from '../parsers/diffstat-parser.js';
import { detectRebaseState } from '../collectors/rebase-detector.js';
import { extractConflicts } from '../collectors/conflict-extractor.js';

const DEFAULT_API_URL = 'http://localhost:3000';

interface SendOptions {
  apiUrl?: string;
  open?: boolean;
}

interface IngestResponse {
  sessionId: string;
  url: string;
  analysis: {
    issueType: string;
    summary: string;
  };
}

export async function sendCommand(options: SendOptions): Promise<void> {
  const apiUrl = options.apiUrl || process.env.GITGUARD_API_URL || DEFAULT_API_URL;

  console.error('Collecting repository state...');

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

    // Extract conflict details
    const unmergedFiles = await extractConflicts(
      gitInfo.repoRoot,
      statusInfo.unmergedPaths.slice(0, 10) // Extract up to 10 conflict files
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

      commitGraph: gitInfo.commitGraph || undefined,
      diffStats: diffStats.length > 0 ? diffStats : undefined,
      mergeHead: gitInfo.mergeHead || undefined,
      mergeMessage: gitInfo.mergeMessage || undefined,

      rawStatus: gitInfo.status,
      rawBranches: gitInfo.branches,
    };

    // Validate with Zod
    const validated = SnapshotV1Schema.parse(snapshot);

    console.error('Uploading snapshot to GitGuard...');

    // Send to API
    const response = await fetch(`${apiUrl}/api/snapshots/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ snapshot: validated }),
    });

    if (!response.ok) {
      let errorMessage = `Server returned ${response.status}`;
      try {
        const errorData = await response.json() as { error?: string };
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    const result = await response.json() as IngestResponse;

    // Display results
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log(`  Issue Type: ${result.analysis.issueType.replace('_', ' ').toUpperCase()}`);
    console.log(`  Summary: ${result.analysis.summary}`);
    console.log('');
    console.log(`  Incident Room: ${result.url}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');

    // Try to open in browser if requested
    if (options.open) {
      try {
        const open = await getOpenCommand();
        if (open) {
          const { exec } = await import('node:child_process');
          exec(`${open} "${result.url}"`);
          console.error('Opening in browser...');
        }
      } catch {
        // Silently fail if we can't open the browser
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.message.includes('not a git repository')) {
        console.error('Please run this command from within a git repository.');
      } else if (error.message.includes('fetch')) {
        console.error(`Could not connect to ${apiUrl}. Is the server running?`);
      }
    }
    process.exit(1);
  }
}

async function getOpenCommand(): Promise<string | null> {
  switch (process.platform) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'start';
    case 'linux':
      return 'xdg-open';
    default:
      return null;
  }
}
