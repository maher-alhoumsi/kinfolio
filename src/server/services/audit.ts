import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { auditLog, user } from '@/server/db/schema';

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const recordAudit = async (
  tx: DbTransaction,
  entry: {
    action: string;
    portfolioId: string;
    actorUserId: string;
    actorKind: 'USER' | 'AGENT';
    payload: Record<string, unknown>;
  },
) => {
  await tx.insert(auditLog).values(entry);
};

export const listAuditLog = async (ctx: Ctx, portfolioId: string) => {
  await assertRole({ ctx, portfolioId, requiredRole: 'OWNER' });

  const rows = await db
    .select({
      id: auditLog.id,
      actorName: user.name,
      action: auditLog.action,
      payload: auditLog.payload,
      actorKind: auditLog.actorKind,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .innerJoin(user, eq(user.id, auditLog.actorUserId))
    .where(eq(auditLog.portfolioId, portfolioId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
};
