import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema, type Signals } from '@gitguard/schema';
import { getLatestSnapshot, getTraces, createPlan, saveTrace } from '@/lib/db';
import { classifyIssue, generatePlan } from '@/lib/agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Get snapshot
    const snapshotRecord = await getLatestSnapshot(sessionId);
    if (!snapshotRecord) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = SnapshotV1Schema.parse(snapshotRecord.snapshotJson);

    // Get signals from collector trace
    const traces = await getTraces(sessionId);
    const collectorTrace = traces.find((t) => t.stage === 'collector');
    if (!collectorTrace) {
      return NextResponse.json({ error: 'No collector trace found' }, { status: 400 });
    }

    const signals = collectorTrace.outputJson as Signals;

    // Run classifier
    const classifierStart = Date.now();
    const classification = await classifyIssue(signals);
    await saveTrace(sessionId, 'classifier', null, classification, classifierStart);

    // Update signals with refined classification
    const refinedSignals: Signals = {
      ...signals,
      primaryIssue: classification.primaryIssue,
      secondaryIssues: classification.secondaryIssues,
      estimatedRisk: classification.estimatedRisk,
    };

    // Run planner
    const dangerousAllowed = false; // Could be passed from request body
    const plannerStart = Date.now();
    const plan = await generatePlan(snapshot, refinedSignals, dangerousAllowed);

    // Save plan
    await createPlan({
      gitSessionId: sessionId,
      issueType: plan.issueType,
      risk: plan.risk,
      planJson: plan,
      dangerousAllowed,
    });

    // Save planner trace
    await saveTrace(sessionId, 'planner', null, plan, plannerStart);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error generating plan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
