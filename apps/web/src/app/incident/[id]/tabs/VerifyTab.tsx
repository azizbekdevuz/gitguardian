'use client';

import { useState, useCallback } from 'react';

interface SessionData {
  id: string;
  status: string;
  analysis: {
    issueType: string;
    summary: string;
  } | null;
}

interface VerifyTabProps {
  sessionData: SessionData;
}

export default function VerifyTab({ sessionData }: VerifyTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    comparison?: {
      previousIssue: string;
      currentIssue: string;
      resolved: boolean;
      remainingIssues: string[];
    };
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.json')) {
      setUploadedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const content = await uploadedFile.text();
      const snapshot = JSON.parse(content);

      // TODO: Actually call the API to verify the new snapshot
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulated comparison result
      setUploadResult({
        success: true,
        message: 'Snapshot analyzed successfully',
        comparison: {
          previousIssue: sessionData.analysis?.issueType || 'unknown',
          currentIssue: snapshot.unmergedFiles?.length > 0 ? 'merge_conflict' : 'clean',
          resolved: snapshot.unmergedFiles?.length === 0,
          remainingIssues: snapshot.unmergedFiles?.map((f: { path: string }) => f.path) || [],
        },
      });
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze snapshot',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Instructions */}
      <div className="bg-bg-secondary border border-border-color rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Verify Your Progress</h2>
        <p className="text-text-secondary">
          After making changes to your repository, upload a new snapshot to verify that the issues
          have been resolved. Run <code className="px-2 py-1 bg-bg-tertiary rounded">gitguard send</code>{' '}
          in your repository to generate a new snapshot file.
        </p>
      </div>

      {/* Current State */}
      <div className="bg-bg-secondary border border-border-color rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-muted mb-3">Current Session State</h3>
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              sessionData.analysis?.issueType === 'clean'
                ? 'bg-green-500/20 text-green-400'
                : sessionData.analysis?.issueType === 'merge_conflict'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {sessionData.analysis?.issueType?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
          </div>
          <span className="text-text-secondary">{sessionData.analysis?.summary}</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-accent-blue bg-accent-blue/10'
            : 'border-border-color hover:border-accent-blue/50'
        }`}
      >
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="text-4xl">📄</div>
            <div>
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-text-muted">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setUploadedFile(null)}
                className="px-4 py-2 bg-bg-tertiary border border-border-color rounded-md text-sm font-medium hover:bg-bg-secondary transition-colors"
              >
                Remove
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 rounded-md text-sm font-medium transition-colors"
              >
                {uploading ? 'Analyzing...' : 'Analyze Snapshot'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📤</div>
            <div>
              <p className="font-medium">Drop your snapshot file here</p>
              <p className="text-sm text-text-muted">or click to browse</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="snapshot-upload"
            />
            <label
              htmlFor="snapshot-upload"
              className="inline-block px-4 py-2 bg-bg-tertiary border border-border-color rounded-md text-sm font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              Select File
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {uploadResult && (
        <div
          className={`border rounded-lg p-6 ${
            uploadResult.success
              ? uploadResult.comparison?.resolved
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-yellow-500/30 bg-yellow-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          {uploadResult.success && uploadResult.comparison ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {uploadResult.comparison.resolved ? '🎉' : '⚠️'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    {uploadResult.comparison.resolved
                      ? 'Issues Resolved!'
                      : 'Some Issues Remain'}
                  </h3>
                  <p className="text-text-secondary">
                    {uploadResult.comparison.resolved
                      ? 'Your repository is now in a clean state.'
                      : `${uploadResult.comparison.remainingIssues.length} issue(s) still need attention.`}
                  </p>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-color">
                <div className="text-center p-4 bg-bg-secondary rounded-lg">
                  <div className="text-sm text-text-muted mb-1">Previous State</div>
                  <div className="font-medium text-yellow-400">
                    {uploadResult.comparison.previousIssue.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-secondary rounded-lg">
                  <div className="text-sm text-text-muted mb-1">Current State</div>
                  <div
                    className={`font-medium ${
                      uploadResult.comparison.currentIssue === 'clean'
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {uploadResult.comparison.currentIssue.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Remaining Issues */}
              {uploadResult.comparison.remainingIssues.length > 0 && (
                <div className="pt-4 border-t border-border-color">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Remaining Issues</h4>
                  <ul className="space-y-1">
                    {uploadResult.comparison.remainingIssues.map((issue, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-yellow-500">⚠️</span>
                        <span className="font-mono">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <h3 className="text-lg font-semibold text-red-400">Analysis Failed</h3>
                <p className="text-text-secondary">{uploadResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLI Instructions */}
      <div className="bg-bg-secondary border border-border-color rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-muted mb-3">Generate a New Snapshot</h3>
        <div className="bg-bg-primary rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">$</span>
            <code>gitguard send</code>
          </div>
        </div>
        <p className="text-sm text-text-muted mt-3">
          Run this command in your repository to capture the current state and upload it for
          verification.
        </p>
      </div>
    </div>
  );
}
