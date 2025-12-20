import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema, type Signals, type PlanV1 } from '@gitguard/schema';
import { getLatestPlan, getTraces, createSnapshot, saveTrace } from '@/lib/db';
import { verifyProgress, collectSignals } from '@/lib/agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { snapshot: rawSnapshot } = body;

    // Validate new snapshot
    const newSnapshot = SnapshotV1Schema.parse(rawSnapshot);

    // Save new snapshot
    const snapshotRecord = await createSnapshot({
      gitSessionId: sessionId,
      snapshotJson: newSnapshot,
    });

    // Get original signals from collector trace
    const traces = await getTraces(sessionId);
    const collectorTrace = traces.find((t) => t.stage === 'collector');
    if (!collectorTrace) {
      return NextResponse.json({ error: 'No collector trace found' }, { status: 400 });
    }

    const originalSignals = collectorTrace.outputJson as Signals;

    // Get current plan
    const planRecord = await getLatestPlan(sessionId);
    if (!planRecord) {
      return NextResponse.json({ error: 'No plan found' }, { status: 400 });
    }

    const plan = planRecord.planJson as PlanV1;

    // Run verifier
    const verifierStart = Date.now();
    const result = await verifyProgress(newSnapshot, originalSignals, plan);

    // Save new collector trace for the new snapshot
    const newSignals = collectSignals(newSnapshot);
    await saveTrace(sessionId, 'collector', snapshotRecord.id, newSignals);

    // Save verifier trace
    await saveTrace(sessionId, 'verifier', snapshotRecord.id, result, verifierStart);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying progress:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
