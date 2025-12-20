import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { SnapshotV1Schema, type Signals, type PlanV1 } from '@gitguard/schema';
import { getLatestPlan, getTraces, createSnapshot, createTrace } from '@/lib/db';
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
    const snapshotId = nanoid();
    createSnapshot(snapshotId, sessionId, JSON.stringify(newSnapshot));

    // Get original signals from collector trace
    const traceRows = getTraces(sessionId);
    const collectorTrace = traceRows.find(t => t.stage === 'collector');
    if (!collectorTrace) {
      return NextResponse.json({ error: 'No collector trace found' }, { status: 400 });
    }

    const originalSignals = JSON.parse(collectorTrace.output_json) as Signals;

    // Get current plan
    const planRow = getLatestPlan(sessionId);
    if (!planRow) {
      return NextResponse.json({ error: 'No plan found' }, { status: 400 });
    }

    const plan = JSON.parse(planRow.plan_json) as PlanV1;

    // Run verifier
    const result = await verifyProgress(newSnapshot, originalSignals, plan);

    // Save new collector trace for the new snapshot
    const newSignals = collectSignals(newSnapshot);
    const newCollectorTraceId = nanoid();
    createTrace(newCollectorTraceId, sessionId, 'collector', snapshotId, JSON.stringify(newSignals));

    // Save verifier trace
    const verifierTraceId = nanoid();
    createTrace(verifierTraceId, sessionId, 'verifier', snapshotId, JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying progress:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
