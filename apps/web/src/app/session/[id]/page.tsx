'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { Header } from '@/components/Header';
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

// Visual Graph Node Types
interface GraphNode {
  id: string;
  type: 'commit' | 'branch' | 'head' | 'conflict' | 'merge';
  label: string;
  x: number;
  y: number;
  color: string;
  active?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  color: string;
  dashed?: boolean;
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
        let errorMessage = 'Failed to generate plan';
        try {
          const result = await response.json();
          errorMessage = result.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
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
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          <p className={styles.loadingText}>Initializing Session...</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠</div>
          <h2>Session Error</h2>
          <p>{error || 'Session not found'}</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </button>
        </div>
      </>
    );
  }

  const { snapshot, signals, plan, traces } = data;
  const hasConflicts = snapshot.unmergedFiles.length > 0;

  const getStateBadge = () => {
    if (hasConflicts) {
      if (snapshot.rebaseState.inProgress) return { text: 'Rebase Conflict', color: 'purple', icon: '⚡' };
      return { text: 'Merge Conflict', color: 'yellow', icon: '⚠' };
    }
    if (snapshot.rebaseState.inProgress) return { text: 'Rebase In Progress', color: 'purple', icon: '🔄' };
    if (snapshot.isDetachedHead) return { text: 'Detached HEAD', color: 'blue', icon: '📍' };
    return { text: 'Clean', color: 'green', icon: '✓' };
  };

  const stateBadge = getStateBadge();

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Animated Background */}
        <div className={styles.bgEffects}>
          <div className={styles.bgOrb1}></div>
          <div className={styles.bgOrb2}></div>
          <div className={styles.gridOverlay}></div>
        </div>

        {/* Header with Glass Effect */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.titleSection}>
                <h1>{data.session.title || 'Recovery Session'}</h1>
                <span className={styles.sessionMeta}>
                  <span className={styles.sessionId}>#{sessionId.slice(0, 8)}</span>
                  <span className={styles.sessionTime}>
                    {new Date(data.session.createdAt).toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={`${styles.statusIndicator} ${styles[stateBadge.color]}`}>
                <span className={styles.statusIcon}>{stateBadge.icon}</span>
                <span className={styles.statusText}>{stateBadge.text}</span>
                <span className={styles.statusPulse}></span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'explorer' ? styles.active : ''}`}
              onClick={() => setActiveTab('explorer')}
              disabled={!hasConflicts}
            >
              <span className={styles.tabIcon}>🔍</span>
              <span className={styles.tabLabel}>Conflict Explorer</span>
              {hasConflicts && (
                <span className={styles.tabCount}>{snapshot.unmergedFiles.length}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <span className={styles.tabIcon}>📊</span>
              <span className={styles.tabLabel}>Repository Graph</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
              onClick={() => setActiveTab('plan')}
            >
              <span className={styles.tabIcon}>🗺</span>
              <span className={styles.tabLabel}>Recovery Plan</span>
              {plan && <span className={styles.tabCheck}>✓</span>}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'trace' ? styles.active : ''}`}
              onClick={() => setActiveTab('trace')}
            >
              <span className={styles.tabIcon}>⚙</span>
              <span className={styles.tabLabel}>SpoonOS Pipeline</span>
            </button>
          </div>
        </nav>

        {/* Content Area */}
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
            <RepositoryGraphTab
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
              snapshot={snapshot}
              sessionId={sessionId}
              onReload={loadSession}
            />
          )}
          {activeTab === 'trace' && (
            <SpoonOSPipelineTab traces={traces} signals={signals} />
          )}
        </div>
      </main>
    </>
  );
}

// ============================================
// CONFLICT EXPLORER TAB - Visual Diff View
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
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

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
      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to explain conflict');
      }
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to explain conflict:', err);
    } finally {
      setExplaining(false);
    }
  };

  useEffect(() => {
    setExplanation(null);
  }, [selectedFileIndex, selectedBlockIndex]);

  if (snapshot.unmergedFiles.length === 0) {
    return (
      <div className={styles.emptyStateCard}>
        <div className={styles.emptyIcon}>✓</div>
        <h3>No Merge Conflicts</h3>
        <p>Your repository is conflict-free! Check the Repository Graph tab for other potential issues.</p>
      </div>
    );
  }

  // Build conflict visualization graph
  const conflictNodes: GraphNode[] = snapshot.unmergedFiles.map((file, idx) => ({
    id: `file-${idx}`,
    type: 'conflict' as const,
    label: file.path.split('/').pop() || file.path,
    x: 100 + (idx % 4) * 150,
    y: 80 + Math.floor(idx / 4) * 100,
    color: idx === selectedFileIndex ? '#58a6ff' : '#f85149',
    active: idx === selectedFileIndex,
  }));

  return (
    <div className={styles.explorerContainer}>
      {/* Visual Conflict Map */}
      <div className={styles.conflictMapSection}>
        <div className={styles.sectionHeader}>
          <h3>Conflict Map</h3>
          <span className={styles.conflictCount}>
            {snapshot.unmergedFiles.length} files with conflicts
          </span>
        </div>
        <div className={styles.conflictMap}>
          <svg className={styles.conflictSvg} viewBox="0 0 650 200">
            {/* Central node */}
            <circle cx="325" cy="100" r="30" fill="#161b22" stroke="#30363d" strokeWidth="2" />
            <text x="325" y="105" textAnchor="middle" fill="#c9d1d9" fontSize="12">MERGE</text>

            {/* Conflict file nodes */}
            {conflictNodes.map((node, idx) => {
              const angle = (idx / conflictNodes.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 100;
              const cx = 325 + Math.cos(angle) * radius;
              const cy = 100 + Math.sin(angle) * radius;

              return (
                <g key={node.id} onClick={() => setSelectedFileIndex(idx)} style={{ cursor: 'pointer' }}>
                  {/* Connection line */}
                  <line
                    x1="325"
                    y1="100"
                    x2={cx}
                    y2={cy}
                    stroke={node.active ? '#58a6ff' : '#f85149'}
                    strokeWidth={node.active ? 3 : 2}
                    strokeDasharray={node.active ? '0' : '5,5'}
                    className={styles.conflictLine}
                  />
                  {/* Node circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={node.active ? 25 : 20}
                    fill={node.active ? 'rgba(88, 166, 255, 0.2)' : 'rgba(248, 81, 73, 0.2)'}
                    stroke={node.color}
                    strokeWidth={2}
                    className={styles.conflictNode}
                  />
                  {/* Block count */}
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#c9d1d9" fontSize="10">
                    {snapshot.unmergedFiles[idx]?.conflictBlocks.length || 0}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* File list below */}
          <div className={styles.fileListCompact}>
            {snapshot.unmergedFiles.map((file, idx) => (
              <button
                key={file.path}
                className={`${styles.fileChip} ${idx === selectedFileIndex ? styles.activeChip : ''}`}
                onClick={() => { setSelectedFileIndex(idx); setSelectedBlockIndex(0); }}
              >
                <span className={styles.chipIcon}>📄</span>
                <span className={styles.chipName}>{file.path.split('/').pop()}</span>
                <span className={styles.chipBadge}>{file.conflictBlocks.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diff Viewer */}
      {selectedFile && selectedBlock && (
        <div className={styles.diffSection}>
          <div className={styles.diffHeader}>
            <div className={styles.diffInfo}>
              <span className={styles.filePath}>{selectedFile.path}</span>
              <span className={styles.lineRange}>
                Lines {selectedBlock.startLine} - {selectedBlock.endLine}
              </span>
            </div>
            <div className={styles.diffControls}>
              {/* Block navigator */}
              {selectedFile.conflictBlocks.length > 1 && (
                <div className={styles.blockNavigator}>
                  <button
                    onClick={() => setSelectedBlockIndex(Math.max(0, selectedBlockIndex - 1))}
                    disabled={selectedBlockIndex === 0}
                    className={styles.navBtn}
                  >
                    ◀
                  </button>
                  <span className={styles.blockCounter}>
                    {selectedBlockIndex + 1} / {selectedFile.conflictBlocks.length}
                  </span>
                  <button
                    onClick={() => setSelectedBlockIndex(Math.min(selectedFile.conflictBlocks.length - 1, selectedBlockIndex + 1))}
                    disabled={selectedBlockIndex === selectedFile.conflictBlocks.length - 1}
                    className={styles.navBtn}
                  >
                    ▶
                  </button>
                </div>
              )}
              {/* View mode toggle */}
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'split' ? styles.activeToggle : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  Split
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'unified' ? styles.activeToggle : ''}`}
                  onClick={() => setViewMode('unified')}
                >
                  Unified
                </button>
              </div>
            </div>
          </div>

          {/* Split View */}
          {viewMode === 'split' ? (
            <div className={styles.splitDiff}>
              <div className={styles.diffPane}>
                <div className={styles.paneHeader}>
                  <div className={styles.branchIndicator}>
                    <span className={styles.branchDot} style={{ background: '#3fb950' }}></span>
                    <span className={styles.branchLabel}>OURS</span>
                    <span className={styles.branchName}>{snapshot.branch.head}</span>
                  </div>
                </div>
                <div className={styles.codeBlock}>
                  {renderCodeWithLineNumbers(selectedBlock.oursContent || '(empty)', 'ours', selectedBlock.startLine)}
                </div>
              </div>

              <div className={styles.diffDivider}>
                <div className={styles.dividerLine}></div>
                <span className={styles.dividerIcon}>⚔</span>
                <div className={styles.dividerLine}></div>
              </div>

              <div className={styles.diffPane}>
                <div className={styles.paneHeader}>
                  <div className={styles.branchIndicator}>
                    <span className={styles.branchDot} style={{ background: '#58a6ff' }}></span>
                    <span className={styles.branchLabel}>THEIRS</span>
                    <span className={styles.branchName}>
                      {snapshot.mergeHead ? snapshot.mergeHead.slice(0, 8) : 'incoming'}
                    </span>
                  </div>
                </div>
                <div className={styles.codeBlock}>
                  {renderCodeWithLineNumbers(selectedBlock.theirsContent || '(empty)', 'theirs', selectedBlock.startLine)}
                </div>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className={styles.unifiedDiff}>
              <div className={styles.unifiedCode}>
                <div className={styles.diffMarker} style={{ borderColor: '#f85149' }}>
                  <span className={styles.markerLabel}>- OURS</span>
                  <pre className={styles.markerCode}>{selectedBlock.oursContent || '(empty)'}</pre>
                </div>
                <div className={styles.conflictSeparator}>
                  <span>═══════════════════════════════</span>
                </div>
                <div className={styles.diffMarker} style={{ borderColor: '#3fb950' }}>
                  <span className={styles.markerLabel}>+ THEIRS</span>
                  <pre className={styles.markerCode}>{selectedBlock.theirsContent || '(empty)'}</pre>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Section */}
          <div className={styles.analysisSection}>
            <button
              className={`${styles.analyzeBtn} ${explaining ? styles.analyzing : ''}`}
              onClick={explainConflict}
              disabled={explaining}
            >
              {explaining ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <span className={styles.aiIcon}>🧠</span>
                  {explanation ? 'Re-analyze Conflict' : 'Explain This Conflict'}
                </>
              )}
            </button>

            {explanation && (
              <div className={styles.explanationPanel}>
                <div className={styles.explanationHeader}>
                  <h4>AI Conflict Analysis</h4>
                  <div className={styles.explanationBadges}>
                    <span className={`${styles.typeBadge} ${styles[explanation.conflictType]}`}>
                      {explanation.conflictType}
                    </span>
                    <span className={`${styles.complexityBadge} ${styles[explanation.complexity]}`}>
                      {explanation.complexity} complexity
                    </span>
                  </div>
                </div>

                <div className={styles.explanationGrid}>
                  <div className={styles.explanationCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon} style={{ color: '#3fb950' }}>◉</span>
                      <h5>What OURS Changed</h5>
                    </div>
                    <p>{explanation.whatOursChanged}</p>
                  </div>

                  <div className={styles.explanationCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon} style={{ color: '#58a6ff' }}>◉</span>
                      <h5>What THEIRS Changed</h5>
                    </div>
                    <p>{explanation.whatTheirsChanged}</p>
                  </div>

                  <div className={styles.explanationCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon} style={{ color: '#f85149' }}>⚡</span>
                      <h5>Why This Conflict Occurred</h5>
                    </div>
                    <p>{explanation.whyConflict}</p>
                  </div>

                  <div className={`${styles.explanationCard} ${styles.strategyCard}`}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon} style={{ color: '#a371f7' }}>✨</span>
                      <h5>Suggested Resolution Strategy</h5>
                    </div>
                    <p>{explanation.suggestedStrategy}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <div className={styles.footerInfo}>
          <span className={styles.progressText}>
            {snapshot.unmergedFiles.length} conflicts to resolve
          </span>
        </div>
        <button
          className={`${styles.generateBtn} ${generating ? styles.generating : ''}`}
          onClick={onGeneratePlan}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className={styles.btnSpinner}></span>
              Generating Plan...
            </>
          ) : (
            <>
              <span className={styles.btnIcon}>🚀</span>
              {hasPlan ? 'Regenerate Recovery Plan' : 'Generate Recovery Plan'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Helper function to render code with line numbers
function renderCodeWithLineNumbers(code: string, side: 'ours' | 'theirs', startLine: number) {
  const lines = code.split('\n');
  return (
    <div className={styles.codeLines}>
      {lines.map((line, idx) => (
        <div key={idx} className={`${styles.codeLine} ${styles[side]}`}>
          <span className={styles.lineNumber}>{startLine + idx}</span>
          <span className={styles.lineContent}>{line || ' '}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// REPOSITORY GRAPH TAB - Visual Git History
// ============================================
function RepositoryGraphTab({
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
  const [expandedReflog, setExpandedReflog] = useState(false);

  const explainState = async () => {
    setExplaining(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'state' }),
      });
      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to explain state');
      }
      const data = await response.json();
      setStateExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to explain state:', err);
    } finally {
      setExplaining(false);
    }
  };

  // Build visual graph from reflog
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Current HEAD
    nodes.push({
      id: 'head',
      type: 'head',
      label: snapshot.isDetachedHead ? 'DETACHED' : snapshot.branch.head,
      x: 300,
      y: 50,
      color: snapshot.isDetachedHead ? '#f85149' : '#3fb950',
      active: true,
    });

    // Add recent reflog entries as nodes
    snapshot.recentReflog.slice(0, 6).forEach((entry, idx) => {
      const nodeId = `reflog-${idx}`;
      nodes.push({
        id: nodeId,
        type: 'commit',
        label: entry.message.slice(0, 20) + (entry.message.length > 20 ? '...' : ''),
        x: 100 + (idx % 3) * 200,
        y: 120 + Math.floor(idx / 3) * 80,
        color: '#8b949e',
      });

      if (idx === 0) {
        edges.push({ from: 'head', to: nodeId, color: '#58a6ff' });
      } else {
        edges.push({ from: `reflog-${idx - 1}`, to: nodeId, color: '#30363d' });
      }
    });

    // Add merge head if present
    if (snapshot.mergeHead) {
      nodes.push({
        id: 'merge',
        type: 'merge',
        label: 'MERGE_HEAD',
        x: 500,
        y: 50,
        color: '#d29922',
      });
      edges.push({ from: 'merge', to: 'head', color: '#d29922', dashed: true });
    }

    // Add rebase info if in progress
    if (snapshot.rebaseState.inProgress) {
      nodes.push({
        id: 'rebase',
        type: 'branch',
        label: `Rebasing onto ${snapshot.rebaseState.onto?.slice(0, 8) || 'unknown'}`,
        x: 500,
        y: 50,
        color: '#a371f7',
      });
    }

    return { nodes, edges };
  }, [snapshot]);

  return (
    <div className={styles.graphTabContainer}>
      {/* Status Overview Cards */}
      <div className={styles.statusGrid}>
        <div className={`${styles.statusCard} ${snapshot.isDetachedHead ? styles.warning : styles.success}`}>
          <div className={styles.cardIcon}>
            {snapshot.isDetachedHead ? '⚠' : '✓'}
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>HEAD Position</span>
            <span className={styles.cardValue}>
              {snapshot.isDetachedHead
                ? `Detached @ ${snapshot.branch.oid.slice(0, 8)}`
                : snapshot.branch.head}
            </span>
          </div>
        </div>

        <div className={`${styles.statusCard} ${snapshot.rebaseState.inProgress ? styles.warning : styles.neutral}`}>
          <div className={styles.cardIcon}>
            {snapshot.rebaseState.inProgress ? '🔄' : '○'}
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Rebase Status</span>
            <span className={styles.cardValue}>
              {snapshot.rebaseState.inProgress
                ? `Step ${snapshot.rebaseState.currentStep || '?'} of ${snapshot.rebaseState.totalSteps || '?'}`
                : 'Not in rebase'}
            </span>
          </div>
        </div>

        {signals && (
          <div className={`${styles.statusCard} ${styles[signals.estimatedRisk]}`}>
            <div className={styles.cardIcon}>
              {signals.estimatedRisk === 'high' ? '🔴' : signals.estimatedRisk === 'medium' ? '🟡' : '🟢'}
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Risk Level</span>
              <span className={styles.cardValue}>{signals.estimatedRisk.toUpperCase()}</span>
            </div>
          </div>
        )}

        <div className={styles.statusCard}>
          <div className={styles.cardIcon}>📝</div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Uncommitted Changes</span>
            <span className={styles.cardValue}>
              {snapshot.stagedFiles.length} staged, {snapshot.modifiedFiles.length} modified
            </span>
          </div>
        </div>
      </div>

      {/* Visual Git Graph */}
      <div className={styles.graphSection}>
        <div className={styles.sectionHeader}>
          <h3>Repository Graph</h3>
          <button
            className={`${styles.explainBtn} ${explaining ? styles.loading : ''}`}
            onClick={explainState}
            disabled={explaining}
          >
            {explaining ? 'Analyzing...' : '🧠 Explain State'}
          </button>
        </div>

        <div className={styles.graphVisualization}>
          <svg className={styles.graphSvg} viewBox="0 0 600 280">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Render edges */}
            {graphData.edges.map((edge, idx) => {
              const fromNode = graphData.nodes.find(n => n.id === edge.from);
              const toNode = graphData.nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.color}
                  strokeWidth="2"
                  strokeDasharray={edge.dashed ? '5,5' : '0'}
                  className={styles.graphEdge}
                />
              );
            })}

            {/* Render nodes */}
            {graphData.nodes.map((node) => (
              <g key={node.id} className={styles.graphNode}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.active ? 20 : 15}
                  fill={`${node.color}33`}
                  stroke={node.color}
                  strokeWidth="2"
                  filter={node.active ? 'url(#glow)' : undefined}
                />
                {node.type === 'head' && (
                  <text x={node.x} y={node.y - 28} textAnchor="middle" fill="#3fb950" fontSize="10" fontWeight="bold">
                    HEAD
                  </text>
                )}
                <text x={node.x} y={node.y + 35} textAnchor="middle" fill="#c9d1d9" fontSize="10">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Commit Graph Text */}
        {snapshot.commitGraph && (
          <div className={styles.commitGraphText}>
            <pre>{snapshot.commitGraph}</pre>
          </div>
        )}
      </div>

      {/* State Explanation */}
      {stateExplanation && (
        <div className={styles.stateExplanationPanel}>
          <h4>{stateExplanation.currentState}</h4>

          <div className={styles.explanationSection}>
            <span className={styles.sectionIcon}>❓</span>
            <div>
              <h5>Why Git stopped here</h5>
              <p>{stateExplanation.whyStopped}</p>
            </div>
          </div>

          <div className={styles.implicationsRow}>
            <div className={styles.implicationBox}>
              <h5>▶ If you continue</h5>
              <p>{stateExplanation.continueImplications}</p>
            </div>
            <div className={styles.implicationBox}>
              <h5>◀ If you abort</h5>
              <p>{stateExplanation.abortImplications}</p>
            </div>
          </div>

          <div className={styles.actionsRow}>
            {stateExplanation.safeActions.length > 0 && (
              <div className={styles.safeActionsBox}>
                <h5>✓ Safe Actions</h5>
                <ul>
                  {stateExplanation.safeActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {stateExplanation.unsafeActions.length > 0 && (
              <div className={styles.unsafeActionsBox}>
                <h5>✗ Actions to Avoid</h5>
                <ul>
                  {stateExplanation.unsafeActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reflog Timeline */}
      <div className={styles.reflogSection}>
        <div className={styles.sectionHeader}>
          <h3>Recent Activity Timeline</h3>
          <button
            className={styles.expandBtn}
            onClick={() => setExpandedReflog(!expandedReflog)}
          >
            {expandedReflog ? 'Show Less' : 'Show More'}
          </button>
        </div>

        <div className={styles.timeline}>
          {snapshot.recentReflog.slice(0, expandedReflog ? 15 : 5).map((entry, idx) => (
            <div key={idx} className={styles.timelineEntry}>
              <div className={styles.timelineDot}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <span className={styles.refSelector}>{entry.selector}</span>
                  <span className={styles.refAction}>{entry.action}</span>
                </div>
                <p className={styles.refMessage}>{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Plan Button */}
      <div className={styles.actionFooter}>
        <button
          className={`${styles.generateBtn} ${generating ? styles.generating : ''}`}
          onClick={onGeneratePlan}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className={styles.btnSpinner}></span>
              Generating Plan...
            </>
          ) : (
            <>
              <span className={styles.btnIcon}>🚀</span>
              {hasPlan ? 'Regenerate Recovery Plan' : 'Generate Recovery Plan'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// RECOVERY PLAN TAB - Interactive Steps
// ============================================
function RecoveryPlanTab({
  plan,
  snapshot,
  sessionId,
  onReload,
}: {
  plan: PlanV1 | null;
  snapshot: SnapshotV1;
  sessionId: string;
  onReload: () => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
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

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const handleVerify = async () => {
    if (!verifyFile) return;
    setVerifying(true);

    try {
      const content = await verifyFile.text();
      const snapshotData = JSON.parse(content);

      const response = await fetch(`/api/sessions/${sessionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snapshotData }),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Verification failed');
      }

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
      <div className={styles.emptyStateCard}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>No Recovery Plan Yet</h3>
        <p>Generate a recovery plan from the Conflict Explorer or Repository Graph tab to see step-by-step instructions.</p>
      </div>
    );
  }

  const completedCount = verifyResult?.stepsCompleted.length || 0;
  const progressPercent = (completedCount / plan.steps.length) * 100;

  return (
    <div className={styles.planContainer}>
      {/* Plan Header with Progress */}
      <div className={styles.planHeader}>
        <div className={styles.planSummary}>
          <h3>{plan.issueSummary}</h3>
          <div className={styles.planBadges}>
            <span className={`${styles.issueBadge} ${styles[plan.issueType]}`}>
              {plan.issueType.replace('_', ' ')}
            </span>
            <span className={`${styles.riskBadge} ${styles[plan.risk]}`}>
              Risk: {plan.risk}
            </span>
          </div>
        </div>

        <div className={styles.progressRing}>
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#21262d"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#3fb950"
              strokeWidth="8"
              strokeDasharray={`${progressPercent * 2.83} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className={styles.progressCircle}
            />
          </svg>
          <div className={styles.progressText}>
            <span className={styles.progressCount}>{completedCount}/{plan.steps.length}</span>
            <span className={styles.progressLabel}>Steps</span>
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className={styles.stepsTimeline}>
        {plan.steps.map((step, index) => {
          const isCompleted = verifyResult?.stepsCompleted.includes(step.id);
          const isCurrent = verifyResult?.nextStepId === step.id;
          const isExpanded = expandedSteps.has(step.id);

          return (
            <div
              key={step.id}
              className={`
                ${styles.stepCard}
                ${isCompleted ? styles.completed : ''}
                ${isCurrent ? styles.current : ''}
                ${step.dangerous ? styles.dangerous : ''}
              `}
            >
              {/* Step connector line */}
              {index < plan.steps.length - 1 && (
                <div className={`${styles.stepConnector} ${isCompleted ? styles.completedConnector : ''}`}></div>
              )}

              {/* Step number indicator */}
              <div className={styles.stepIndicator}>
                {isCompleted ? (
                  <span className={styles.checkIcon}>✓</span>
                ) : (
                  <span className={styles.stepNum}>{index + 1}</span>
                )}
              </div>

              {/* Step content */}
              <div className={styles.stepBody}>
                <div className={styles.stepHeader} onClick={() => toggleStep(step.id)}>
                  <h4>{step.title}</h4>
                  <div className={styles.stepMeta}>
                    {step.dangerous && (
                      <span className={styles.dangerTag}>⚠ Dangerous</span>
                    )}
                    <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                <p className={styles.stepDescription}>{step.description}</p>

                {/* Expanded content */}
                <div className={`${styles.stepExpanded} ${isExpanded ? styles.expanded : ''}`}>
                  {step.warning && (
                    <div className={styles.warningBox}>
                      <span className={styles.warningIcon}>⚠</span>
                      <p>{step.warning}</p>
                    </div>
                  )}

                  {/* Commands */}
                  <div className={styles.commandsSection}>
                    <h5>Commands to Run:</h5>
                    {step.commands.map((cmd, cmdIdx) => (
                      <div key={cmdIdx} className={styles.commandBlock}>
                        <code>{cmd}</code>
                        <button
                          className={`${styles.copyBtn} ${copiedId === `${step.id}-${cmdIdx}` ? styles.copied : ''}`}
                          onClick={() => copyCommand(cmd, `${step.id}-${cmdIdx}`)}
                        >
                          {copiedId === `${step.id}-${cmdIdx}` ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Expected result */}
                  <div className={styles.expectedSection}>
                    <h5>Expected Result:</h5>
                    <p>{step.expected}</p>
                  </div>

                  {/* Undo instructions */}
                  {step.undo.possible && (
                    <details className={styles.undoSection}>
                      <summary>How to undo this step</summary>
                      <p>{step.undo.description}</p>
                      {step.undo.commands.length > 0 && (
                        <div className={styles.undoCommands}>
                          {step.undo.commands.map((cmd, cmdIdx) => (
                            <div key={cmdIdx} className={styles.commandBlock}>
                              <code>{cmd}</code>
                              <button
                                className={styles.copyBtn}
                                onClick={() => copyCommand(cmd, `undo-${step.id}-${cmdIdx}`)}
                              >
                                {copiedId === `undo-${step.id}-${cmdIdx}` ? '✓' : 'Copy'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reflog Recovery Fallback */}
      {plan.reflogRecovery && (
        <div className={styles.reflogRecoverySection}>
          <div className={styles.recoveryHeader}>
            <span className={styles.recoveryIcon}>🆘</span>
            <h4>Emergency Recovery (Reflog)</h4>
          </div>
          <p>{plan.reflogRecovery.description}</p>
          <div className={styles.commandBlock}>
            <code>{plan.reflogRecovery.recoveryCommand}</code>
            <button
              className={styles.copyBtn}
              onClick={() => copyCommand(plan.reflogRecovery!.recoveryCommand, 'reflog-recovery')}
            >
              {copiedId === 'reflog-recovery' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Verification Section */}
      <div className={styles.verificationSection}>
        <h4>Verify Your Progress</h4>
        <p>After running some steps, generate a new snapshot and upload it to verify your progress.</p>

        <div className={styles.verifyUpload}>
          <label className={styles.uploadArea}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
            />
            <span className={styles.uploadIcon}>📁</span>
            <span className={styles.uploadText}>
              {verifyFile ? verifyFile.name : 'Drop snapshot.json or click to browse'}
            </span>
          </label>
          <button
            className={`${styles.verifyBtn} ${verifying ? styles.verifying : ''}`}
            onClick={handleVerify}
            disabled={!verifyFile || verifying}
          >
            {verifying ? 'Verifying...' : 'Verify Progress'}
          </button>
        </div>

        {verifyResult && (
          <div className={`${styles.verifyResultPanel} ${verifyResult.issueResolved ? styles.resolved : ''}`}>
            {verifyResult.issueResolved ? (
              <div className={styles.successResult}>
                <span className={styles.successIcon}>🎉</span>
                <h5>Issue Resolved!</h5>
                <p>{verifyResult.guidance}</p>
              </div>
            ) : (
              <>
                <div className={styles.resultHeader}>
                  <h5>Progress Update</h5>
                  {completedCount > 0 && (
                    <span className={styles.completedBadge}>{completedCount} steps completed</span>
                  )}
                </div>
                {verifyResult.remainingIssues.length > 0 && (
                  <div className={styles.remainingIssues}>
                    <h6>Remaining Issues:</h6>
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
      </div>
    </div>
  );
}

// ============================================
// SPOONOS PIPELINE TAB - Visual Flow
// ============================================
function SpoonOSPipelineTab({
  traces,
  signals,
}: {
  traces: Array<{ stage: string; output: unknown; createdAt?: string }>;
  signals: Signals | null;
}) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // SpoonOS Graph Pipeline Stages
  const pipelineStages = [
    { id: 'detect_issue', name: 'Issue Detection', icon: '🔍', desc: 'Identify issue type from snapshot' },
    { id: 'build_graph', name: 'Graph Builder', icon: '📊', desc: 'Build repository dependency graph' },
    { id: 'extract_conflicts', name: 'Conflict Extractor', icon: '⚔', desc: 'Parse and analyze conflict blocks' },
    { id: 'collect_signals', name: 'Signal Collector', icon: '📡', desc: 'Gather recovery signals' },
    { id: 'generate_analysis', name: 'Analysis Generator', icon: '🧠', desc: 'Generate AI-powered analysis' },
  ];

  const getStageStatus = (stageId: string) => {
    const trace = traces.find(t => t.stage === stageId);
    return trace ? 'completed' : 'pending';
  };

  const getTraceForStage = (stageId: string) => {
    return traces.find(t => t.stage === stageId);
  };

  // Calculate pipeline progress
  const completedStages = pipelineStages.filter(s => getStageStatus(s.id) === 'completed').length;
  const progressPercent = (completedStages / pipelineStages.length) * 100;

  return (
    <div className={styles.pipelineContainer}>
      {/* Pipeline Header */}
      <div className={styles.pipelineHeader}>
        <div className={styles.pipelineTitle}>
          <span className={styles.spoonLogo}>⚙</span>
          <div>
            <h3>SpoonOS Graph Pipeline</h3>
            <p>AI-powered analysis using StateGraph architecture</p>
          </div>
        </div>
        <div className={styles.pipelineProgress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className={styles.progressLabel}>{completedStages}/{pipelineStages.length} stages</span>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className={styles.pipelineFlow}>
        <svg className={styles.flowSvg} viewBox="0 0 900 150">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#58a6ff" />
              <stop offset="50%" stopColor="#a371f7" />
              <stop offset="100%" stopColor="#3fb950" />
            </linearGradient>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Flow line */}
          <path
            d="M 80 75 L 820 75"
            fill="none"
            stroke="#21262d"
            strokeWidth="4"
          />
          <path
            d={`M 80 75 L ${80 + (740 * progressPercent / 100)} 75`}
            fill="none"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            className={styles.flowPath}
          />

          {/* Stage nodes */}
          {pipelineStages.map((stage, idx) => {
            const x = 80 + idx * 185;
            const status = getStageStatus(stage.id);
            const isActive = selectedStage === stage.id;

            return (
              <g
                key={stage.id}
                onClick={() => setSelectedStage(isActive ? null : stage.id)}
                style={{ cursor: 'pointer' }}
                className={styles.stageGroup}
              >
                {/* Node background */}
                <circle
                  cx={x}
                  cy={75}
                  r={isActive ? 35 : 30}
                  fill={status === 'completed' ? 'rgba(63, 185, 80, 0.2)' : 'rgba(33, 38, 45, 0.8)'}
                  stroke={status === 'completed' ? '#3fb950' : '#30363d'}
                  strokeWidth={isActive ? 3 : 2}
                  filter={isActive ? 'url(#nodeGlow)' : undefined}
                  className={styles.stageNode}
                />

                {/* Icon */}
                <text x={x} y={80} textAnchor="middle" fontSize="20">
                  {stage.icon}
                </text>

                {/* Status indicator */}
                {status === 'completed' && (
                  <circle cx={x + 20} cy={55} r={8} fill="#3fb950" stroke="#0d1117" strokeWidth="2">
                    <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Label */}
                <text x={x} y={125} textAnchor="middle" fill="#c9d1d9" fontSize="11" fontWeight="500">
                  {stage.name}
                </text>
              </g>
            );
          })}

          {/* Animated particles */}
          {completedStages > 0 && (
            <circle r="4" fill="#58a6ff">
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={`M 80 75 L ${80 + (740 * progressPercent / 100)} 75`}
              />
            </circle>
          )}
        </svg>
      </div>

      {/* Stage Details */}
      <div className={styles.stageDetails}>
        {pipelineStages.map((stage) => {
          const trace = getTraceForStage(stage.id);
          const isSelected = selectedStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`${styles.stageCard} ${trace ? styles.completed : styles.pending} ${isSelected ? styles.selected : ''}`}
              onClick={() => setSelectedStage(isSelected ? null : stage.id)}
            >
              <div className={styles.stageCardHeader}>
                <span className={styles.stageIcon}>{stage.icon}</span>
                <div className={styles.stageInfo}>
                  <h4>{stage.name}</h4>
                  <p>{stage.desc}</p>
                </div>
                <span className={`${styles.stageStatus} ${trace ? styles.done : styles.waiting}`}>
                  {trace ? '✓ Complete' : '○ Pending'}
                </span>
              </div>

              {isSelected && trace && (
                <div className={styles.stageOutput}>
                  <h5>Output Data</h5>
                  <pre>{JSON.stringify(trace.output, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Signals Dashboard */}
      {signals && (
        <div className={styles.signalsDashboard}>
          <h4>Extracted Signals</h4>
          <div className={styles.signalsGrid}>
            <div className={styles.signalTile}>
              <span className={styles.signalIcon}>🎯</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Primary Issue</span>
                <span className={styles.signalValue}>{signals.primaryIssue}</span>
              </div>
            </div>

            <div className={`${styles.signalTile} ${styles[signals.estimatedRisk]}`}>
              <span className={styles.signalIcon}>⚠</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Risk Level</span>
                <span className={styles.signalValue}>{signals.estimatedRisk.toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.signalTile}>
              <span className={styles.signalIcon}>⚔</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Conflicts</span>
                <span className={styles.signalValue}>{signals.conflictCount}</span>
              </div>
            </div>

            <div className={styles.signalTile}>
              <span className={styles.signalIcon}>📍</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Detached HEAD</span>
                <span className={styles.signalValue}>{signals.isDetachedHead ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className={styles.signalTile}>
              <span className={styles.signalIcon}>🔄</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Rebase Status</span>
                <span className={styles.signalValue}>{signals.isRebaseInProgress ? 'In Progress' : 'None'}</span>
              </div>
            </div>

            <div className={styles.signalTile}>
              <span className={styles.signalIcon}>🌿</span>
              <div className={styles.signalData}>
                <span className={styles.signalLabel}>Current Branch</span>
                <span className={styles.signalValue}>{signals.currentBranch}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {traces.length === 0 && (
        <div className={styles.pipelineEmpty}>
          <span className={styles.emptyIcon}>🔮</span>
          <h4>Pipeline Ready</h4>
          <p>Generate a recovery plan to see the SpoonOS pipeline in action.</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
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
