import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'gitguard-data.json');

interface DbData {
  sessions: SessionRow[];
  snapshots: SnapshotRow[];
  plans: PlanRow[];
  traces: TraceRow[];
}

function loadDb(): DbData {
  if (!existsSync(DB_PATH)) {
    return { sessions: [], snapshots: [], plans: [], traces: [] };
  }
  try {
    const content = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content) as DbData;
  } catch {
    return { sessions: [], snapshots: [], plans: [], traces: [] };
  }
}

function saveDb(data: DbData): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Session operations
export interface SessionRow {
  id: string;
  created_at: string;
  title: string | null;
  os: string | null;
  repo_root_hash: string | null;
}

export function createSession(
  id: string,
  title: string | null,
  os: string | null,
  repoRootHash: string | null
): void {
  const db = loadDb();
  db.sessions.push({
    id,
    created_at: new Date().toISOString(),
    title,
    os,
    repo_root_hash: repoRootHash,
  });
  saveDb(db);
}

export function getSession(id: string): SessionRow | undefined {
  const db = loadDb();
  return db.sessions.find(s => s.id === id);
}

// Snapshot operations
export interface SnapshotRow {
  id: string;
  session_id: string;
  created_at: string;
  snapshot_json: string;
  truncated: number;
}

export function createSnapshot(
  id: string,
  sessionId: string,
  snapshotJson: string,
  truncated: boolean = false
): void {
  const db = loadDb();
  db.snapshots.push({
    id,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    snapshot_json: snapshotJson,
    truncated: truncated ? 1 : 0,
  });
  saveDb(db);
}

export function getLatestSnapshot(sessionId: string): SnapshotRow | undefined {
  const db = loadDb();
  const sessionSnapshots = db.snapshots
    .filter(s => s.session_id === sessionId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return sessionSnapshots[0];
}

// Plan operations
export interface PlanRow {
  id: string;
  session_id: string;
  created_at: string;
  issue_type: string | null;
  risk: string | null;
  plan_json: string;
  dangerous_allowed: number;
}

export function createPlan(
  id: string,
  sessionId: string,
  issueType: string | null,
  risk: string | null,
  planJson: string,
  dangerousAllowed: boolean = false
): void {
  const db = loadDb();
  db.plans.push({
    id,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    issue_type: issueType,
    risk,
    plan_json: planJson,
    dangerous_allowed: dangerousAllowed ? 1 : 0,
  });
  saveDb(db);
}

export function getLatestPlan(sessionId: string): PlanRow | undefined {
  const db = loadDb();
  const sessionPlans = db.plans
    .filter(p => p.session_id === sessionId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return sessionPlans[0];
}

// Trace operations
export interface TraceRow {
  id: string;
  session_id: string;
  created_at: string;
  stage: string;
  input_ref: string | null;
  output_json: string;
}

export function createTrace(
  id: string,
  sessionId: string,
  stage: string,
  inputRef: string | null,
  outputJson: string
): void {
  const db = loadDb();
  db.traces.push({
    id,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    stage,
    input_ref: inputRef,
    output_json: outputJson,
  });
  saveDb(db);
}

export function getTraces(sessionId: string): TraceRow[] {
  const db = loadDb();
  return db.traces
    .filter(t => t.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Helper to save a trace with auto-generated ID
 */
export function saveTrace(
  sessionId: string,
  stage: string,
  inputRef: string | null,
  output: unknown
): void {
  const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  createTrace(id, sessionId, stage, inputRef, JSON.stringify(output));
}
