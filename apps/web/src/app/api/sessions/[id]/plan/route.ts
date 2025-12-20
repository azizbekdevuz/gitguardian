import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { SnapshotV1Schema, type Signals } from '@gitguard/schema';
import { getLatestSnapshot, getTraces, createPlan, createTrace } from '@/lib/db';
import { classifyIssue, generatePlan } from '@/lib/agent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Get snapshot
    const snapshotRow = getLatestSnapshot(sessionId);
    if (!snapshotRow) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = SnapshotV1Schema.parse(JSON.parse(snapshotRow.snapshot_json));

    // Get signals from collector trace
    const traceRows = getTraces(sessionId);
    const collectorTrace = traceRows.find(t => t.stage === 'collector');
    if (!collectorTrace) {
      return NextResponse.json({ error: 'No collector trace found' }, { status: 400 });
    }

    const signals = JSON.parse(collectorTrace.output_json) as Signals;

    // Run classifier
    const classification = await classifyIssue(signals);
    const classifierTraceId = nanoid();
    createTrace(classifierTraceId, sessionId, 'classifier', null, JSON.stringify(classification));

    // Update signals with refined classification
    const refinedSignals: Signals = {
      ...signals,
      primaryIssue: classification.primaryIssue,
      secondaryIssues: classification.secondaryIssues,
      estimatedRisk: classification.estimatedRisk,
    };

    // Run planner
    const dangerousAllowed = false; // Could be passed from request body
    const plan = await generatePlan(snapshot, refinedSignals, dangerousAllowed);

    // Save plan
    const planId = nanoid();
    createPlan(planId, sessionId, plan.issueType, plan.risk, JSON.stringify(plan), dangerousAllowed);

    // Save planner trace
    const plannerTraceId = nanoid();
    createTrace(plannerTraceId, sessionId, 'planner', null, JSON.stringify(plan));

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error generating plan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
