import { NextRequest, NextResponse } from 'next/server';
import { SnapshotV1Schema } from '@gitguard/schema';
import {
  getSession,
  getLatestSnapshot,
  getLatestAnalysis,
  updatePlanStepStatus,
  createAnalysis,
  createPlanStep,
  saveTrace,
  deleteAnalysisBySnapshotId,
} from '@/lib/db';
import { collectSignals } from '@/lib/agent/collector';
import { classifyIssue } from '@/lib/agent/classifier';
import { generatePlan } from '@/lib/agent/planner';

/**
 * GET /api/sessions/[id]/plan
 * Get the recovery plan for a session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const analysis = await getLatestAnalysis(sessionId);
    if (!analysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    return NextResponse.json({
      issueType: analysis.issueType,
      summary: analysis.summary,
      planSteps: analysis.planSteps.map((step) => ({
        id: step.id,
        index: step.index,
        title: step.title,
        rationale: step.rationale,
        commands: step.commandsJson,
        verify: step.verifyJson,
        undo: step.undoJson,
        dangerLevel: step.dangerLevel,
        status: step.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/sessions/[id]/plan
 * Update a plan step status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Validate params exist
    const body = await request.json();
    const { stepId, status, userConfirmed } = body;

    if (!stepId || !status) {
      return NextResponse.json(
        { error: 'stepId and status are required' },
        { status: 400 }
      );
    }

    const updatedStep = await updatePlanStepStatus(stepId, status, userConfirmed);

    return NextResponse.json({
      id: updatedStep.id,
      status: updatedStep.status,
      completedAt: updatedStep.completedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error updating plan step:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/sessions/[id]/plan
 * Generate a recovery plan for a session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Check for optional dangerousAllowed body parameter
    let dangerousAllowed = false;
    try {
      const body = await request.json();
      dangerousAllowed = body.dangerousAllowed ?? false;
    } catch {
      // No body or invalid JSON is fine, use defaults
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const snapshotRecord = await getLatestSnapshot(sessionId);
    if (!snapshotRecord) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const snapshot = SnapshotV1Schema.parse(snapshotRecord.snapshotJson);

    // Run the SpoonOS pipeline
    const pipelineStart = Date.now();

    // Stage 1: Detect Issue (SpoonOS: detect_issue)
    const detectStart = Date.now();
    const signals = collectSignals(snapshot);
    const issueType = signals.primaryIssue || 'unknown';
    const riskLevel = signals.estimatedRisk || 'medium';
    await saveTrace(sessionId, 'detect_issue', snapshotRecord.id, { snapshot: 'parsed' }, { issueType, riskLevel }, detectStart);

    // Stage 2: Build Graph (SpoonOS: build_graph)
    const graphStart = Date.now();
    const repoGraph = {
      nodes: [],
      edges: [],
      headRef: snapshot.branch.oid,
    };
    await saveTrace(sessionId, 'build_graph', snapshotRecord.id, { snapshot }, { nodes: 0, edges: 0 }, graphStart);

    // Stage 3: Extract Conflicts (SpoonOS: extract_conflicts)
    const extractStart = Date.now();
    const conflictCount = snapshot.unmergedFiles.length;
    await saveTrace(sessionId, 'extract_conflicts', snapshotRecord.id, { snapshot }, { conflictCount }, extractStart);

    // Stage 4: Collect Signals (SpoonOS: collect_signals)
    const signalsStart = Date.now();
    await saveTrace(sessionId, 'collect_signals', snapshotRecord.id, { snapshot }, signals, signalsStart);

    // Stage 5: Classify Issue (refinement)
    const classifierStart = Date.now();
    const classification = await classifyIssue(signals);
    await saveTrace(sessionId, 'classifier', snapshotRecord.id, signals, classification, classifierStart);

    // Update signals with classification results
    const classifiedSignals = {
      ...signals,
      primaryIssue: classification.primaryIssue,
      secondaryIssues: classification.secondaryIssues,
      estimatedRisk: classification.estimatedRisk,
    };

    // Stage 6: Generate Analysis (SpoonOS: generate_analysis)
    const plannerStart = Date.now();
    const plan = await generatePlan(snapshot, classifiedSignals, dangerousAllowed);
    await saveTrace(sessionId, 'generate_analysis', snapshotRecord.id, classifiedSignals, plan, plannerStart);

    // Delete existing analysis for this snapshot (allows regeneration)
    await deleteAnalysisBySnapshotId(snapshotRecord.id);

    // Save analysis and plan steps to database
    const analysis = await createAnalysis({
      gitSessionId: sessionId,
      snapshotId: snapshotRecord.id,
      issueType: plan.issueType,
      summary: plan.issueSummary,
    });

    // Create plan steps
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      await createPlanStep({
        analysisId: analysis.id,
        index: i,
        title: step.title,
        rationale: step.description,
        commandsJson: step.commands,
        verifyJson: { expected: step.expected },
        undoJson: step.undo,
        dangerLevel: step.dangerous ? 'dangerous' : 'safe',
      });
    }

    const totalDuration = Date.now() - pipelineStart;

    return NextResponse.json({
      success: true,
      plan,
      analysisId: analysis.id,
      duration: totalDuration,
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
