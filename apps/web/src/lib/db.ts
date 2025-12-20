/**
 * Database operations using Prisma + Neon Postgres
 *
 * This module provides a clean API for database operations,
 * abstracting Prisma details from the rest of the application.
 */

import prisma from './prisma';
import type { GitSession, Snapshot, Plan, Trace } from '@prisma/client';

// Re-export types for convenience
export type { GitSession, Snapshot, Plan, Trace };

// ============================================
// GitSession Operations
// ============================================

export interface CreateSessionInput {
  title?: string | null;
  os?: string | null;
  repoRootHash?: string | null;
  userId?: string | null;
}

export async function createSession(input: CreateSessionInput): Promise<GitSession> {
  return prisma.gitSession.create({
    data: {
      title: input.title,
      os: input.os,
      repoRootHash: input.repoRootHash,
      userId: input.userId,
    },
  });
}

export async function getSession(id: string): Promise<GitSession | null> {
  return prisma.gitSession.findUnique({
    where: { id },
  });
}

export async function getSessionWithDetails(id: string) {
  return prisma.gitSession.findUnique({
    where: { id },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      plans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      traces: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function getUserSessions(userId: string) {
  return prisma.gitSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      plans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

// ============================================
// Snapshot Operations
// ============================================

export interface CreateSnapshotInput {
  gitSessionId: string;
  snapshotJson: unknown;
  truncated?: boolean;
}

export async function createSnapshot(input: CreateSnapshotInput): Promise<Snapshot> {
  return prisma.snapshot.create({
    data: {
      gitSessionId: input.gitSessionId,
      snapshotJson: input.snapshotJson as object,
      truncated: input.truncated ?? false,
    },
  });
}

export async function getLatestSnapshot(gitSessionId: string): Promise<Snapshot | null> {
  return prisma.snapshot.findFirst({
    where: { gitSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Plan Operations
// ============================================

export interface CreatePlanInput {
  gitSessionId: string;
  issueType?: string | null;
  risk?: string | null;
  planJson: unknown;
  dangerousAllowed?: boolean;
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  return prisma.plan.create({
    data: {
      gitSessionId: input.gitSessionId,
      issueType: input.issueType,
      risk: input.risk,
      planJson: input.planJson as object,
      dangerousAllowed: input.dangerousAllowed ?? false,
    },
  });
}

export async function getLatestPlan(gitSessionId: string): Promise<Plan | null> {
  return prisma.plan.findFirst({
    where: { gitSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Trace Operations (SpoonOS Pipeline)
// ============================================

export interface CreateTraceInput {
  gitSessionId: string;
  stage: string;
  snapshotId?: string | null;
  outputJson: unknown;
  durationMs?: number | null;
  success?: boolean;
  errorMessage?: string | null;
}

export async function createTrace(input: CreateTraceInput): Promise<Trace> {
  return prisma.trace.create({
    data: {
      gitSessionId: input.gitSessionId,
      stage: input.stage,
      snapshotId: input.snapshotId,
      outputJson: input.outputJson as object,
      durationMs: input.durationMs,
      success: input.success ?? true,
      errorMessage: input.errorMessage,
    },
  });
}

export async function getTraces(gitSessionId: string): Promise<Trace[]> {
  return prisma.trace.findMany({
    where: { gitSessionId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Helper to save a trace with timing
 */
export async function saveTrace(
  gitSessionId: string,
  stage: string,
  snapshotId: string | null,
  output: unknown,
  startTime?: number
): Promise<Trace> {
  const durationMs = startTime ? Date.now() - startTime : undefined;
  return createTrace({
    gitSessionId,
    stage,
    snapshotId,
    outputJson: output,
    durationMs,
  });
}

// ============================================
// Event Operations (Analytics/Audit)
// ============================================

export interface CreateEventInput {
  type: string;
  userId?: string | null;
  gitSessionId?: string | null;
  metadata?: unknown;
}

export async function createEvent(input: CreateEventInput) {
  return prisma.event.create({
    data: {
      type: input.type,
      userId: input.userId,
      gitSessionId: input.gitSessionId,
      metadata: input.metadata as object | undefined,
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
