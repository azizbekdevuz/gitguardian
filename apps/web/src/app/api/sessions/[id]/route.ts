import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema, type PlanV1, type Signals } from '@gitguard/schema';
import { getSession, getLatestSnapshot, getLatestPlan, getTraces } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const snapshotRow = getLatestSnapshot(sessionId);
    if (!snapshotRow) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = SnapshotV1Schema.parse(JSON.parse(snapshotRow.snapshot_json));

    const planRow = getLatestPlan(sessionId);
    let plan: PlanV1 | null = null;
    if (planRow) {
      plan = JSON.parse(planRow.plan_json) as PlanV1;
    }

    const traceRows = getTraces(sessionId);
    const traces = traceRows.map(t => ({
      stage: t.stage,
      output: JSON.parse(t.output_json),
    }));

    // Get signals from collector trace
    let signals: Signals | null = null;
    const collectorTrace = traceRows.find(t => t.stage === 'collector');
    if (collectorTrace) {
      signals = JSON.parse(collectorTrace.output_json) as Signals;
    }

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.created_at,
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
