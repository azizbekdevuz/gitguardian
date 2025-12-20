'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import type { SnapshotV1, PlanV1, Signals, UnmergedFile, ConflictBlock } from '@gitguard/schema';

type Tab = 'explorer' | 'history' | 'plan' | 'trace';

interface SessionData {
  session: {
    id: string;
    title: string;
    createdAt: string;
  };
  snapshot: SnapshotV1;
  signals: Signals | null;
  plan: PlanV1 | null;
  traces: Array<{
    stage: string;
    output: unknown;
    createdAt?: string;
  }>;
}

interface ConflictExplanation {
  filePath: string;
  blockIndex: number;
  whatOursChanged: string;
  whatTheirsChanged: string;
  whyConflict: string;
  conflictType: string;
  suggestedStrategy: string;
  complexity: string;
}

interface StateExplanation {
  currentState: string;
  whyStopped: string;
  continueImplications: string;
  abortImplications: string;
  safeActions: string[];
  unsafeActions: string[];
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('explorer');
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Auto-switch to history tab if no conflicts but has state issues
  useEffect(() => {
    if (data?.snapshot) {
      const hasConflicts = data.snapshot.unmergedFiles.length > 0;
      const hasStateIssue = data.snapshot.isDetachedHead || data.snapshot.rebaseState.inProgress;
      if (!hasConflicts && hasStateIssue) {
        setActiveTab('history');
      }
    }
  }, [data?.snapshot]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      const sessionData = await response.json();
      setData(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/plan`, {
        method: 'POST',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to generate plan');
      }
      await loadSession();
      setActiveTab('plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading session...</div>;
  }

  if (error || !data) {
    return <div className={styles.error}>{error || 'Session not found'}</div>;
  }

  const { snapshot, signals, plan, traces } = data;
  const hasConflicts = snapshot.unmergedFiles.length > 0;
  const hasStateIssue = snapshot.isDetachedHead || snapshot.rebaseState.inProgress;

  // Determine the current state badge
  const getStateBadge = () => {
    if (hasConflicts) {
      if (snapshot.rebaseState.inProgress) return { text: 'Rebase Conflict', color: 'purple' };
      return { text: 'Merge Conflict', color: 'yellow' };
    }
    if (snapshot.rebaseState.inProgress) return { text: 'Rebase In Progress', color: 'purple' };
    if (snapshot.isDetachedHead) return { text: 'Detached HEAD', color: 'blue' };
    return { text: 'Clean', color: 'green' };
  };

  const stateBadge = getStateBadge();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>GitGuard Agent</h1>
          <span className={`${styles.stateBadge} ${styles[stateBadge.color]}`}>
            {stateBadge.text}
          </span>
        </div>
        <span className={styles.sessionId}>{sessionId.slice(0, 8)}</span>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'explorer' ? styles.active : ''}`}
          onClick={() => setActiveTab('explorer')}
          disabled={!hasConflicts}
        >
          Conflict Explorer
          {hasConflicts && <span className={styles.tabBadge}>{snapshot.unmergedFiles.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History / State
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          Recovery Plan
          {plan && <span className={styles.tabCheck}>✓</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'trace' ? styles.active : ''}`}
          onClick={() => setActiveTab('trace')}
        >
          SpoonOS Trace
        </button>
      </nav>

      <div className={styles.content}>
        {activeTab === 'explorer' && (
          <ConflictExplorerTab
            snapshot={snapshot}
            sessionId={sessionId}
            onGeneratePlan={generatePlan}
            generating={generating}
            hasPlan={!!plan}
          />
        )}
        {activeTab === 'history' && (
          <HistoryStateTab
            snapshot={snapshot}
            signals={signals}
            sessionId={sessionId}
            onGeneratePlan={generatePlan}
            generating={generating}
            hasPlan={!!plan}
          />
        )}
        {activeTab === 'plan' && (
          <RecoveryPlanTab
            plan={plan}
            sessionId={sessionId}
            onReload={loadSession}
          />
        )}
        {activeTab === 'trace' && <SpoonOSTraceTab traces={traces} signals={signals} />}
      </div>
    </main>
  );
}

// ============================================
// CONFLICT EXPLORER TAB
// ============================================
function ConflictExplorerTab({
  snapshot,
  sessionId,
  onGeneratePlan,
  generating,
  hasPlan,
}: {
  snapshot: SnapshotV1;
  sessionId: string;
  onGeneratePlan: () => void;
  generating: boolean;
  hasPlan: boolean;
}) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [explanation, setExplanation] = useState<ConflictExplanation | null>(null);
  const [explaining, setExplaining] = useState(false);

  const selectedFile = snapshot.unmergedFiles[selectedFileIndex];
  const selectedBlock = selectedFile?.conflictBlocks[selectedBlockIndex];

  const explainConflict = async () => {
    setExplaining(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conflict',
          fileIndex: selectedFileIndex,
          blockIndex: selectedBlockIndex,
        }),
      });
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to explain conflict:', err);
    } finally {
      setExplaining(false);
    }
  };

  // Reset explanation when switching files/blocks
  useEffect(() => {
    setExplanation(null);
  }, [selectedFileIndex, selectedBlockIndex]);

  if (snapshot.unmergedFiles.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No merge conflicts detected.</p>
        <p className={styles.hint}>Check the History / State tab for other issues.</p>
      </div>
    );
  }

  return (
    <div className={styles.explorerLayout}>
      {/* Left Sidebar - File List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Conflicting Files</h3>
          <span className={styles.fileCount}>{snapshot.unmergedFiles.length}</span>
        </div>
        <ul className={styles.fileList}>
          {snapshot.unmergedFiles.map((file, idx) => (
            <li
              key={file.path}
              className={`${styles.fileItem} ${idx === selectedFileIndex ? styles.selected : ''}`}
              onClick={() => {
                setSelectedFileIndex(idx);
                setSelectedBlockIndex(0);
              }}
            >
              <span className={styles.fileName}>{getFileName(file.path)}</span>
              <span className={styles.filePath}>{getFilePath(file.path)}</span>
              <span className={styles.blockBadge}>{file.conflictBlocks.length}</span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className={styles.sidebarActions}>
          <button
            className="btn btn-primary"
            onClick={onGeneratePlan}
            disabled={generating}
          >
            {generating ? 'Generating...' : hasPlan ? 'Regenerate Plan' : 'Generate Recovery Plan'}
          </button>
        </div>
      </aside>

      {/* Main Panel - Diff View */}
      <div className={styles.mainPanel}>
        {selectedFile && selectedBlock ? (
          <>
            {/* Block navigator */}
            {selectedFile.conflictBlocks.length > 1 && (
              <div className={styles.blockNav}>
                <span>Conflict {selectedBlockIndex + 1} of {selectedFile.conflictBlocks.length}</span>
                <div className={styles.blockNavButtons}>
                  <button
                    onClick={() => setSelectedBlockIndex(Math.max(0, selectedBlockIndex - 1))}
                    disabled={selectedBlockIndex === 0}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setSelectedBlockIndex(Math.min(selectedFile.conflictBlocks.length - 1, selectedBlockIndex + 1))}
                    disabled={selectedBlockIndex === selectedFile.conflictBlocks.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Location info */}
            <div className={styles.locationInfo}>
              <span className={styles.filePath}>{selectedFile.path}</span>
              <span className={styles.lineInfo}>Lines {selectedBlock.startLine}-{selectedBlock.endLine}</span>
            </div>

            {/* Side-by-side diff */}
            <div className={styles.diffContainer}>
              <div className={styles.diffPane}>
                <div className={styles.diffHeader}>
                  <span className={styles.oursLabel}>OURS</span>
                  <span className={styles.branchName}>{snapshot.branch.head}</span>
                </div>
                <pre className={styles.diffContent}>{selectedBlock.oursContent || '(empty)'}</pre>
              </div>
              <div className={styles.diffDivider}>
                <span>⟷</span>
              </div>
              <div className={styles.diffPane}>
                <div className={styles.diffHeader}>
                  <span className={styles.theirsLabel}>THEIRS</span>
                  <span className={styles.branchName}>
                    {snapshot.mergeHead ? snapshot.mergeHead.slice(0, 8) : 'incoming'}
                  </span>
                </div>
                <pre className={styles.diffContent}>{selectedBlock.theirsContent || '(empty)'}</pre>
              </div>
            </div>

            {/* Context preview */}
            {selectedBlock.context && (
              <details className={styles.contextSection}>
                <summary>View surrounding context</summary>
                <pre className={styles.contextCode}>{selectedBlock.context}</pre>
              </details>
            )}

            {/* Explain button */}
            <div className={styles.explainSection}>
              <button
                className={`btn ${explanation ? '' : 'btn-primary'}`}
                onClick={explainConflict}
                disabled={explaining}
              >
                {explaining ? 'Analyzing...' : explanation ? 'Re-analyze Conflict' : 'Explain This Conflict'}
              </button>
            </div>

            {/* AI Explanation */}
            {explanation && (
              <div className={styles.explanationCard}>
                <h4>Conflict Analysis</h4>
                <div className={styles.explanationMeta}>
                  <span className={`${styles.conflictType} ${styles[explanation.conflictType]}`}>
                    {explanation.conflictType}
                  </span>
                  <span className={`${styles.complexity} ${styles[explanation.complexity]}`}>
                    {explanation.complexity} complexity
                  </span>
                </div>

                <div className={styles.explanationSection}>
                  <h5>What OURS changed:</h5>
                  <p>{explanation.whatOursChanged}</p>
                </div>

                <div className={styles.explanationSection}>
                  <h5>What THEIRS changed:</h5>
                  <p>{explanation.whatTheirsChanged}</p>
                </div>

                <div className={styles.explanationSection}>
                  <h5>Why this conflict occurred:</h5>
                  <p>{explanation.whyConflict}</p>
                </div>

                <div className={styles.explanationSection}>
                  <h5>Suggested resolution strategy:</h5>
                  <p className={styles.strategy}>{explanation.suggestedStrategy}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Select a file to view conflicts</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// HISTORY / STATE TAB
// ============================================
function HistoryStateTab({
  snapshot,
  signals,
  sessionId,
  onGeneratePlan,
  generating,
  hasPlan,
}: {
  snapshot: SnapshotV1;
  signals: Signals | null;
  sessionId: string;
  onGeneratePlan: () => void;
  generating: boolean;
  hasPlan: boolean;
}) {
  const [stateExplanation, setStateExplanation] = useState<StateExplanation | null>(null);
  const [explaining, setExplaining] = useState(false);

  const explainState = async () => {
    setExplaining(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'state' }),
      });
      const data = await response.json();
      setStateExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to explain state:', err);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className={styles.historyLayout}>
      {/* State Overview */}
      <section className={styles.stateOverview}>
        <h3>Repository State</h3>
        <div className={styles.stateCards}>
          <div className={styles.stateCard}>
            <span className={styles.stateLabel}>Current Position</span>
            <span className={styles.stateValue}>
              {snapshot.isDetachedHead ? (
                <span className={styles.detached}>DETACHED @ {snapshot.branch.oid.slice(0, 8)}</span>
              ) : (
                <span>{snapshot.branch.head}</span>
              )}
            </span>
          </div>

          {snapshot.rebaseState.inProgress && (
            <div className={`${styles.stateCard} ${styles.rebaseCard}`}>
              <span className={styles.stateLabel}>Rebase Progress</span>
              <span className={styles.stateValue}>
                Step {snapshot.rebaseState.currentStep || '?'} of {snapshot.rebaseState.totalSteps || '?'}
              </span>
              <div className={styles.rebaseInfo}>
                <span>From: {snapshot.rebaseState.headName || 'unknown'}</span>
                <span>Onto: {snapshot.rebaseState.onto?.slice(0, 8) || 'unknown'}</span>
              </div>
            </div>
          )}

          {signals && (
            <div className={`${styles.stateCard} ${styles[signals.estimatedRisk]}`}>
              <span className={styles.stateLabel}>Risk Level</span>
              <span className={styles.stateValue}>{signals.estimatedRisk.toUpperCase()}</span>
            </div>
          )}

          <div className={styles.stateCard}>
            <span className={styles.stateLabel}>Uncommitted Work</span>
            <span className={styles.stateValue}>
              {snapshot.stagedFiles.length} staged, {snapshot.modifiedFiles.length} modified
            </span>
          </div>
        </div>

        <button
          className={`btn ${stateExplanation ? '' : 'btn-primary'}`}
          onClick={explainState}
          disabled={explaining}
        >
          {explaining ? 'Analyzing...' : stateExplanation ? 'Re-analyze State' : 'Explain This State'}
        </button>
      </section>

      {/* State Explanation */}
      {stateExplanation && (
        <section className={styles.stateExplanation}>
          <h4>{stateExplanation.currentState}</h4>

          <div className={styles.explanationSection}>
            <h5>Why Git stopped here:</h5>
            <p>{stateExplanation.whyStopped}</p>
          </div>

          <div className={styles.implicationsGrid}>
            <div className={styles.implicationCard}>
              <h5>If you continue:</h5>
              <p>{stateExplanation.continueImplications}</p>
            </div>
            <div className={styles.implicationCard}>
              <h5>If you abort:</h5>
              <p>{stateExplanation.abortImplications}</p>
            </div>
          </div>

          {stateExplanation.safeActions.length > 0 && (
            <div className={styles.actionsList}>
              <h5>Safe actions now:</h5>
              <ul className={styles.safeActions}>
                {stateExplanation.safeActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {stateExplanation.unsafeActions.length > 0 && (
            <div className={styles.actionsList}>
              <h5>Actions to avoid:</h5>
              <ul className={styles.unsafeActions}>
                {stateExplanation.unsafeActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Commit Graph */}
      <section className={styles.graphSection}>
        <h3>Commit Graph</h3>
        <div className={styles.graphContainer}>
          <pre className={styles.commitGraph}>
            {snapshot.commitGraph || 'Commit graph not available'}
          </pre>
          <div className={styles.youAreHere}>
            <span className={styles.indicator}>●</span>
            <span>You are at: {snapshot.branch.oid.slice(0, 8)}</span>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className={styles.activitySection}>
        <h3>Recent Activity (Reflog)</h3>
        <div className={styles.reflogList}>
          {snapshot.recentReflog.slice(0, 10).map((entry, i) => (
            <div key={i} className={styles.reflogEntry}>
              <span className={styles.reflogSelector}>{entry.selector}</span>
              <span className={styles.reflogAction}>{entry.action}</span>
              <span className={styles.reflogMessage}>{entry.message}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Generate Plan Button */}
      <section className={styles.planAction}>
        <button
          className="btn btn-primary"
          onClick={onGeneratePlan}
          disabled={generating}
        >
          {generating ? 'Generating...' : hasPlan ? 'Regenerate Recovery Plan' : 'Generate Recovery Plan'}
        </button>
      </section>
    </div>
  );
}

// ============================================
// RECOVERY PLAN TAB
// ============================================
function RecoveryPlanTab({
  plan,
  sessionId,
  onReload,
}: {
  plan: PlanV1 | null;
  sessionId: string;
  onReload: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    issueResolved: boolean;
    stepsCompleted: string[];
    remainingIssues: string[];
    guidance: string;
    nextStepId?: string;
  } | null>(null);

  const copyCommand = async (command: string, stepId: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedId(stepId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = async () => {
    if (!verifyFile) return;
    setVerifying(true);

    try {
      const content = await verifyFile.text();
      const snapshot = JSON.parse(content);

      const response = await fetch(`/api/sessions/${sessionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      });

      const data = await response.json();
      setVerifyResult(data);
      if (data.issueResolved) {
        onReload();
      }
    } catch (err) {
      setVerifyResult({
        issueResolved: false,
        stepsCompleted: [],
        remainingIssues: ['Failed to verify: ' + (err instanceof Error ? err.message : 'Unknown error')],
        guidance: 'Please try again with a valid snapshot file.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!plan) {
    return (
      <div className={styles.emptyState}>
        <p>No recovery plan generated yet.</p>
        <p className={styles.hint}>Go to the Conflict Explorer or History tab to generate one.</p>
      </div>
    );
  }

  return (
    <div className={styles.planLayout}>
      {/* Plan Summary */}
      <section className={styles.planSummary}>
        <h3>Issue Summary</h3>
        <p className={styles.summary}>{plan.issueSummary}</p>
        <div className={styles.badges}>
          <span className={`badge badge-${getIssueColor(plan.issueType)}`}>
            {plan.issueType.replace('_', ' ')}
          </span>
          <span className={`badge badge-${getRiskColor(plan.risk)}`}>
            Risk: {plan.risk}
          </span>
        </div>
      </section>

      {/* Recovery Steps */}
      <section className={styles.stepsSection}>
        <h3>Recovery Steps</h3>
        <div className={styles.steps}>
          {plan.steps.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.step} ${step.dangerous ? styles.dangerous : ''} ${
                verifyResult?.stepsCompleted.includes(step.id) ? styles.completed : ''
              } ${verifyResult?.nextStepId === step.id ? styles.current : ''}`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h4>{step.title}</h4>
                {step.dangerous && <span className="badge badge-red">DANGEROUS</span>}
                {verifyResult?.stepsCompleted.includes(step.id) && (
                  <span className="badge badge-green">DONE</span>
                )}
              </div>

              <p className={styles.stepDescription}>{step.description}</p>

              {step.warning && (
                <div className={styles.warning}>{step.warning}</div>
              )}

              <div className={styles.commands}>
                {step.commands.map((cmd, i) => (
                  <div key={i} className={styles.command}>
                    <code>{cmd}</code>
                    <button
                      className={styles.copyBtn}
                      onClick={() => copyCommand(cmd, `${step.id}-${i}`)}
                    >
                      {copiedId === `${step.id}-${i}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.expected}>
                <strong>Expected result:</strong> {step.expected}
              </div>

              {step.undo.possible && (
                <details className={styles.undoDetails}>
                  <summary>How to undo this step</summary>
                  <p>{step.undo.description}</p>
                  {step.undo.commands.length > 0 && (
                    <div className={styles.commands}>
                      {step.undo.commands.map((cmd, i) => (
                        <div key={i} className={styles.command}>
                          <code>{cmd}</code>
                          <button
                            className={styles.copyBtn}
                            onClick={() => copyCommand(cmd, `undo-${step.id}-${i}`)}
                          >
                            {copiedId === `undo-${step.id}-${i}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reflog Recovery Fallback */}
      {plan.reflogRecovery && (
        <section className={styles.reflogFallback}>
          <h3>Emergency Recovery (Reflog)</h3>
          <p>{plan.reflogRecovery.description}</p>
          <div className={styles.command}>
            <code>{plan.reflogRecovery.recoveryCommand}</code>
            <button
              className={styles.copyBtn}
              onClick={() => copyCommand(plan.reflogRecovery!.recoveryCommand, 'reflog-recovery')}
            >
              {copiedId === 'reflog-recovery' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </section>
      )}

      {/* Verification Section */}
      <section className={styles.verifySection}>
        <h3>Verify Progress</h3>
        <p>After running some steps, generate a new snapshot and upload it to verify progress.</p>

        <div className={styles.verifyForm}>
          <div className={styles.fileInput}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
              id="verify-file"
            />
            <label htmlFor="verify-file" className={styles.fileLabel}>
              {verifyFile ? verifyFile.name : 'Choose snapshot file...'}
            </label>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleVerify}
            disabled={!verifyFile || verifying}
          >
            {verifying ? 'Verifying...' : 'Verify Progress'}
          </button>
        </div>

        {verifyResult && (
          <div className={`${styles.verifyResult} ${verifyResult.issueResolved ? styles.resolved : ''}`}>
            {verifyResult.issueResolved ? (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✓</span>
                <h4>Issue Resolved!</h4>
                <p>{verifyResult.guidance}</p>
              </div>
            ) : (
              <>
                <h4>Progress Update</h4>
                {verifyResult.stepsCompleted.length > 0 && (
                  <p className={styles.progressText}>
                    Completed: {verifyResult.stepsCompleted.length} step(s)
                  </p>
                )}
                {verifyResult.remainingIssues.length > 0 && (
                  <div className={styles.remainingIssues}>
                    <strong>Still to address:</strong>
                    <ul>
                      {verifyResult.remainingIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className={styles.guidance}>{verifyResult.guidance}</p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================
// SPOONOS TRACE TAB
// ============================================
function SpoonOSTraceTab({
  traces,
  signals,
}: {
  traces: Array<{ stage: string; output: unknown; createdAt?: string }>;
  signals: Signals | null;
}) {
  // SpoonOS pipeline stages
  const stages = [
    { id: 'collector', name: 'Collector', desc: 'Extract signals from snapshot' },
    { id: 'classifier', name: 'Classifier', desc: 'Classify issue type and risk' },
    { id: 'visual_explainer', name: 'Visual Explainer', desc: 'Generate contextual explanations' },
    { id: 'planner', name: 'Planner', desc: 'Create recovery plan' },
    { id: 'verifier', name: 'Verifier', desc: 'Verify progress after actions' },
  ];

  const getStageStatus = (stageId: string) => {
    const trace = traces.find(t => t.stage === stageId);
    if (trace) return 'completed';
    return 'pending';
  };

  const getTraceForStage = (stageId: string) => {
    return traces.find(t => t.stage === stageId);
  };

  return (
    <div className={styles.traceLayout}>
      {/* Pipeline Visualization */}
      <section className={styles.pipelineSection}>
        <h3>SpoonOS Agent Pipeline</h3>
        <div className={styles.pipeline}>
          {stages.map((stage, index) => {
            const status = getStageStatus(stage.id);
            return (
              <div key={stage.id} className={styles.pipelineStage}>
                <div className={`${styles.stageNode} ${styles[status]}`}>
                  <span className={styles.stageNumber}>{index + 1}</span>
                </div>
                <div className={styles.stageInfo}>
                  <span className={styles.stageName}>{stage.name}</span>
                  <span className={styles.stageDesc}>{stage.desc}</span>
                </div>
                {index < stages.length - 1 && <div className={styles.stageConnector} />}
              </div>
            );
          })}
        </div>
      </section>

      {/* Trace Details */}
      <section className={styles.traceDetails}>
        <h3>Stage Outputs</h3>
        {traces.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No traces yet. Interact with the agent to see the pipeline in action.</p>
          </div>
        ) : (
          <div className={styles.traceList}>
            {stages.map((stage) => {
              const trace = getTraceForStage(stage.id);
              if (!trace) return null;

              return (
                <details key={stage.id} className={styles.traceItem} open={stage.id === 'collector'}>
                  <summary className={styles.traceSummary}>
                    <span className={styles.traceStage}>{stage.name}</span>
                    <span className={styles.traceStatus}>completed</span>
                  </summary>
                  <div className={styles.traceContent}>
                    <div className={styles.traceIO}>
                      <div className={styles.traceOutput}>
                        <h5>Output</h5>
                        <pre>{JSON.stringify(trace.output, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      {/* Current Signals */}
      {signals && (
        <section className={styles.signalsSection}>
          <h3>Current Signals</h3>
          <div className={styles.signalsGrid}>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Primary Issue</span>
              <span className={styles.signalValue}>{signals.primaryIssue}</span>
            </div>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Risk Level</span>
              <span className={`${styles.signalValue} ${styles[signals.estimatedRisk]}`}>
                {signals.estimatedRisk}
              </span>
            </div>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Conflicts</span>
              <span className={styles.signalValue}>{signals.conflictCount}</span>
            </div>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Detached HEAD</span>
              <span className={styles.signalValue}>{signals.isDetachedHead ? 'Yes' : 'No'}</span>
            </div>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Rebase</span>
              <span className={styles.signalValue}>{signals.isRebaseInProgress ? 'In Progress' : 'No'}</span>
            </div>
            <div className={styles.signalCard}>
              <span className={styles.signalLabel}>Branch</span>
              <span className={styles.signalValue}>{signals.currentBranch}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function getFilePath(path: string): string {
  const parts = path.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
}

function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low': return 'green';
    case 'medium': return 'yellow';
    case 'high': return 'red';
    default: return 'blue';
  }
}

function getIssueColor(issue: string): string {
  switch (issue) {
    case 'merge_conflict': return 'yellow';
    case 'detached_head': return 'blue';
    case 'rebase_in_progress': return 'purple';
    default: return 'blue';
  }
}
