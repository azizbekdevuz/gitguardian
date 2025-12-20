import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema, type PlanV1, type Signals } from '@gitguard/schema';
import { getSessionWithDetails } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const sessionData = await getSessionWithDetails(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const latestSnapshot = sessionData.snapshots[0];
    if (!latestSnapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = SnapshotV1Schema.parse(latestSnapshot.snapshotJson);

    const latestPlan = sessionData.plans[0];
    const plan: PlanV1 | null = latestPlan
      ? (latestPlan.planJson as PlanV1)
      : null;

    const traces = sessionData.traces.map((t) => ({
      stage: t.stage,
      output: t.outputJson,
      createdAt: t.createdAt.toISOString(),
      durationMs: t.durationMs,
    }));

    // Get signals from collector trace
    let signals: Signals | null = null;
    const collectorTrace = sessionData.traces.find((t) => t.stage === 'collector');
    if (collectorTrace) {
      signals = collectorTrace.outputJson as Signals;
    }

    return NextResponse.json({
      session: {
        id: sessionData.id,
        title: sessionData.title,
        createdAt: sessionData.createdAt.toISOString(),
      },
      snapshot,
      signals,
      plan,
      traces,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
