import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { SnapshotV1Schema } from '@gitguard/schema';
import { createSession, createSnapshot, createTrace } from '@/lib/db';
import { collectSignals } from '@/lib/agent';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snapshot: rawSnapshot } = body;

    // Validate snapshot
    const snapshot = SnapshotV1Schema.parse(rawSnapshot);

    // Generate IDs
    const sessionId = nanoid();
    const snapshotId = nanoid();

    // Create hash of repo root for deduplication
    const repoRootHash = createHash('sha256')
      .update(snapshot.repoRoot)
      .digest('hex')
      .slice(0, 16);

    // Generate title from branch and issue
    const title = generateTitle(snapshot);

    // Create session
    createSession(sessionId, title, snapshot.platform, repoRootHash);

    // Save snapshot
    createSnapshot(snapshotId, sessionId, JSON.stringify(snapshot));

    // Run collector and save trace
    const signals = collectSignals(snapshot);
    const traceId = nanoid();
    createTrace(traceId, sessionId, 'collector', snapshotId, JSON.stringify(signals));

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function generateTitle(snapshot: { branch: { head: string }; isDetachedHead: boolean; unmergedFiles: unknown[]; rebaseState: { inProgress: boolean } }): string {
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
