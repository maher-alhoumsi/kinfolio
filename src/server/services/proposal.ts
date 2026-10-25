import 'server-only';

import { z } from 'zod';
import { and, count, eq, gt } from 'drizzle-orm';

import {
  checkTransactionAllowed,
  insertValidatedTransaction,
} from '@/server/services/internal/transaction-core';
import { db } from '@/server/db';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { agentProposals } from '@/server/db/schema';
import { recordAudit } from '@/server/services/audit';
import { addTransactionInput, parseInput } from '@/lib/schemas';
import { ConflictError, NotFoundError } from '@/server/auth/errors';

const proposalIdInput = z.object({ proposalId: z.uuid() });

export const createTransactionProposal = async (
  ctx: Ctx,
  portfolioId: string,
  input: unknown,
) => {
  const parsed = parseInput(addTransactionInput, {
    ...(input as Record<string, unknown>),
    portfolioId,
  });

  await assertRole({ ctx, portfolioId, requiredRole: 'EDITOR' });

  return db.transaction(async (tx) => {
    const [{ pendingCount }] = await tx
      .select({ pendingCount: count(agentProposals.id) })
      .from(agentProposals)
      .where(
        and(
          eq(agentProposals.portfolioId, portfolioId),
          eq(agentProposals.userId, ctx.userId),
          eq(agentProposals.status, 'PENDING'),
          gt(agentProposals.expiresAt, new Date()),
        ),
      );

    if (pendingCount >= 5) {
      throw new ConflictError(
        'Too many pending proposals. Confirm or cancel some first.',
      );
    }

    const { asset } = await checkTransactionAllowed(tx, parsed);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const storedInput = {
      ...parsed,
      occurredAt: parsed.occurredAt.toISOString(),
    };

    const [proposal] = await tx
      .insert(agentProposals)
      .values({
        portfolioId,
        userId: ctx.userId,
        input: storedInput,
        expiresAt,
      })
      .returning({
        id: agentProposals.id,
        expiresAt: agentProposals.expiresAt,
      });

    await recordAudit(tx, {
      portfolioId,
      actorUserId: ctx.userId,
      actorKind: 'AGENT',
      action: 'proposal.created',
      payload: {
        proposalId: proposal.id,
        assetId: parsed.assetId,
        kind: parsed.kind,
        quantity: parsed.quantity,
        unitPrice: asset.type === 'CASH' ? '1' : parsed.unitPrice,
      },
    });

    return {
      proposalId: proposal.id,
      expiresAt: proposal.expiresAt.toISOString(),
      summary: {
        assetName: asset.name,
        assetSymbol: asset.symbol,
        kind: parsed.kind,
        quantity: parsed.quantity,
        unitPrice: asset.type === 'CASH' ? '1' : parsed.unitPrice,
        occurredAt: parsed.occurredAt.toISOString(),
        note: parsed.note,
      },
    };
  });
};

const getProposalId = (proposalId: unknown) =>
  parseInput(proposalIdInput, { proposalId }).proposalId;

export const confirmTransactionProposal = async (
  ctx: Ctx,
  portfolioId: string,
  proposalId: unknown,
) => {
  const parsedProposalId = getProposalId(proposalId);
  await assertRole({ ctx, portfolioId, requiredRole: 'EDITOR' });

  return db.transaction(async (tx) => {
    const [proposal] = await tx
      .select()
      .from(agentProposals)
      .where(
        and(
          eq(agentProposals.id, parsedProposalId),
          eq(agentProposals.portfolioId, portfolioId),
          eq(agentProposals.userId, ctx.userId),
          eq(agentProposals.status, 'PENDING'),
          gt(agentProposals.expiresAt, new Date()),
        ),
      )
      .for('update')
      .limit(1);

    if (!proposal) throw new NotFoundError('Proposal not found or expired');

    const parsedInput = parseInput(addTransactionInput, {
      ...proposal.input,
      portfolioId: proposal.portfolioId,
    });
    const transaction = await insertValidatedTransaction(tx, ctx, parsedInput);

    await tx
      .update(agentProposals)
      .set({
        status: 'CONFIRMED',
        transactionId: transaction.id,
        resolvedAt: new Date(),
      })
      .where(eq(agentProposals.id, proposal.id));

    await recordAudit(tx, {
      portfolioId,
      actorKind: 'USER',
      actorUserId: ctx.userId,
      action: 'proposal.confirmed',
      payload: {
        proposalId: proposal.id,
        transactionId: transaction.id,
        via: 'assistant',
      },
    });

    return transaction;
  });
};

export const cancelTransactionProposal = async (
  ctx: Ctx,
  portfolioId: string,
  proposalId: unknown,
) => {
  const parsedProposalId = getProposalId(proposalId);
  await assertRole({ ctx, portfolioId, requiredRole: 'EDITOR' });

  return db.transaction(async (tx) => {
    const [proposal] = await tx
      .select()
      .from(agentProposals)
      .where(
        and(
          eq(agentProposals.id, parsedProposalId),
          eq(agentProposals.portfolioId, portfolioId),
          eq(agentProposals.userId, ctx.userId),
          eq(agentProposals.status, 'PENDING'),
          gt(agentProposals.expiresAt, new Date()),
        ),
      )
      .for('update')
      .limit(1);

    if (!proposal) throw new NotFoundError('Proposal not found or expired');

    await tx
      .update(agentProposals)
      .set({ status: 'CANCELLED', resolvedAt: new Date() })
      .where(eq(agentProposals.id, proposal.id));

    await recordAudit(tx, {
      portfolioId,
      actorKind: 'USER',
      actorUserId: ctx.userId,
      action: 'proposal.cancelled',
      payload: { proposalId: proposal.id, via: 'assistant' },
    });
  });
};
