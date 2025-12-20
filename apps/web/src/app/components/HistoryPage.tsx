import { useState } from 'react';
import { Home, Search, ChevronRight, CheckCircle, XCircle, GitBranch, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';

interface HistoryPageProps {
  onNavigateToHome: () => void;
  onNavigateToRecovery: (id: string) => void;
}

interface RecoveryLog {
  id: string;
  date: string;
  branch: string;
  issueType: string;
  status: 'resolved' | 'aborted';
  description: string;
  trace: {
    collector: string[];
    classifier: string[];
    planner: string[];
    verifier: string[];
  };
}

const mockLogs: RecoveryLog[] = [
  {
    id: 'rec-abc123',
    date: '2025-12-20 14:32',
    branch: 'main',
    issueType: 'Detached HEAD',
    status: 'resolved',
    description: 'Recovered from detached HEAD state after checking out commit 3f2a1bc',
    trace: {
      collector: [
        'Analyzed git status output',
        'Detected HEAD detached at 3f2a1bc',
        'Found 7 modified files, 2 untracked',
        'Identified last known good branch: main'
      ],
      classifier: [
        'Issue type: Detached HEAD state',
        'Severity: Medium',
        'Risk level: Low (changes are stashed)',
        'Recommended approach: Safe reattachment'
      ],
      planner: [
        'Step 1: Stash current changes',
        'Step 2: Checkout target branch (main)',
        'Step 3: Verify repository state',
        'Step 4: Restore stashed changes'
      ],
      verifier: [
        'All commands are non-destructive',
        'Rollback strategy available for each step',
        'User data is preserved',
        'Plan approved for execution'
      ]
    }
  },
  {
    id: 'rec-def456',
    date: '2025-12-19 09:15',
    branch: 'feature/auth',
    issueType: 'Merge Conflict',
    status: 'resolved',
    description: 'Resolved merge conflict between feature/auth and main branch',
    trace: {
      collector: [
        'Detected merge conflict in 3 files',
        'Branches involved: feature/auth, main',
        'Conflict markers found in: auth.ts, config.ts, types.ts'
      ],
      classifier: [
        'Issue type: Merge conflict',
        'Severity: High',
        'Risk level: Medium',
        'Recommended approach: Manual resolution with backup'
      ],
      planner: [
        'Step 1: Create backup branch',
        'Step 2: Identify conflicting sections',
        'Step 3: Provide merge strategy options',
        'Step 4: Verify merged state'
      ],
      verifier: [
        'Backup created successfully',
        'No data loss risk',
        'User maintains full control',
        'Plan approved for execution'
      ]
    }
  },
  {
    id: 'rec-ghi789',
    date: '2025-12-18 16:45',
    branch: 'develop',
    issueType: 'Accidental Reset',
    status: 'aborted',
    description: 'User aborted recovery after reviewing reflog options',
    trace: {
      collector: [
        'Detected hard reset to previous commit',
        'Found orphaned commits in reflog',
        '12 commits at risk of being lost'
      ],
      classifier: [
        'Issue type: Accidental hard reset',
        'Severity: High',
        'Risk level: High (commits may be lost)',
        'Recommended approach: Reflog recovery'
      ],
      planner: [
        'Step 1: Review reflog entries',
        'Step 2: Identify target commit',
        'Step 3: Create recovery branch',
        'Step 4: Reset to target commit'
      ],
      verifier: [
        'User aborted: Decided to keep current state',
        'No changes were made',
        'Repository remains in current state'
      ]
    }
  }
];

export function HistoryPage({ onNavigateToHome, onNavigateToRecovery }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<RecoveryLog | null>(null);

  const filteredLogs = mockLogs.filter(log => 
    log.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToHome}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-white font-semibold">GitGuard Agent</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-white mb-2">Recovery Logs</h2>
          <p className="text-zinc-400">
            View past recovery sessions and agent decision traces
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by branch, issue type, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Table View */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-6 py-4 text-zinc-400 text-sm font-semibold">Date</th>
                <th className="text-left px-6 py-4 text-zinc-400 text-sm font-semibold">Branch</th>
                <th className="text-left px-6 py-4 text-zinc-400 text-sm font-semibold">Issue Type</th>
                <th className="text-left px-6 py-4 text-zinc-400 text-sm font-semibold">Status</th>
                <th className="text-right px-6 py-4 text-zinc-400 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <code className="text-sm">{log.date}</code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-zinc-500" />
                      <code className="text-emerald-400 text-sm">{log.branch}</code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{log.issueType}</span>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'resolved' ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="error">
                        <XCircle className="w-3 h-3 mr-1" />
                        Aborted
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm flex items-center gap-1 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      View Trace
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500">No recovery logs found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer/Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-zinc-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white mb-2">Agent Thinking Process</h3>
                  <p className="text-zinc-400 text-sm">{selectedLog.description}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <code className="text-zinc-400 text-sm">{selectedLog.date}</code>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-zinc-500" />
                  <code className="text-emerald-400 text-sm">{selectedLog.branch}</code>
                </div>
                {selectedLog.status === 'resolved' ? (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="error">
                    <XCircle className="w-3 h-3 mr-1" />
                    Aborted
                  </Badge>
                )}
              </div>
            </div>

            {/* Trace Stages */}
            <div className="p-6 space-y-6">
              {/* Collector */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">1</span>
                  </div>
                  <h4 className="text-white">Collector</h4>
                </div>
                <div className="ml-10 space-y-2">
                  {selectedLog.trace.collector.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <p className="text-zinc-400 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classifier */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-sm font-bold">2</span>
                  </div>
                  <h4 className="text-white">Classifier</h4>
                </div>
                <div className="ml-10 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedLog.trace.classifier.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                        <p className="text-zinc-300 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Planner */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-400 text-sm font-bold">3</span>
                  </div>
                  <h4 className="text-white">Planner</h4>
                </div>
                <div className="ml-10 space-y-2">
                  {selectedLog.trace.planner.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-zinc-400 text-xs">{index + 1}</span>
                      </div>
                      <p className="text-zinc-400 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verifier */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-amber-400 text-sm font-bold">4</span>
                  </div>
                  <h4 className="text-white">Verifier</h4>
                </div>
                <div className="ml-10 bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedLog.trace.verifier.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-zinc-300 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decision Reason Callout */}
              <div className="bg-zinc-950 border-l-4 border-emerald-500 p-4 rounded">
                <p className="text-emerald-400 font-semibold text-sm mb-2">Decision Reason</p>
                <p className="text-zinc-300 text-sm">
                  {selectedLog.status === 'resolved' 
                    ? 'All safety checks passed. The recovery plan was executed successfully with no data loss.'
                    : 'User chose to abort the recovery process after reviewing the proposed steps.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-800 p-6 flex justify-between">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  onNavigateToRecovery(selectedLog.id);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                View Recovery Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
