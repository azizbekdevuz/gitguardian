'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const snapshot = JSON.parse(content);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const { sessionId } = await response.json();
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process snapshot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>GitGuard Agent</h1>
        <p className={styles.subtitle}>
          Safe git recovery helper - reversible by design
        </p>
      </div>

      <div className={styles.uploadCard}>
        <h2>Upload Snapshot</h2>
        <p className={styles.instructions}>
          Generate a snapshot using the CLI:
        </p>
        <pre className={styles.codeBlock}>
          gitguard snapshot --pretty &gt; snapshot.json
        </pre>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.fileLabel}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <span className={styles.fileButton}>
              {file ? file.name : 'Choose snapshot.json'}
            </span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={!file || loading}
          >
            {loading ? 'Processing...' : 'Analyze Snapshot'}
          </button>
        </form>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>Merge Conflicts</h3>
          <p>Get step-by-step guidance to resolve conflicts safely</p>
        </div>
        <div className={styles.feature}>
          <h3>Detached HEAD</h3>
          <p>Recover from detached HEAD state without losing work</p>
        </div>
        <div className={styles.feature}>
          <h3>Rebase Recovery</h3>
          <p>Navigate stuck rebases with clear undo options</p>
        </div>
      </div>
    </main>
  );
}
