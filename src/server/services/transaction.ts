import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/server/db';
import { toDecimal } from '@/lib/money';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { recordAudit } from '@/server/services/audit';
import { assets, transactions } from '@/server/db/schema';
import { addTransactionInput, parseInput } from '@/lib/schemas';
import { insertValidatedTransaction } from '@/server/services/internal/transaction-core';

export const addTransaction = async (ctx: Ctx, input: unknown) => {
  const parsed = parseInput(addTransactionInput, input);

  await assertRole({
    ctx,
    requiredRole: 'EDITOR',
    portfolioId: parsed.portfolioId,
  });

  return db.transaction(async (tx) => {
    const transaction = await insertValidatedTransaction(tx, ctx, parsed);

    await recordAudit(tx, {
      actorKind: 'USER',
      actorUserId: ctx.userId,
      action: 'transaction.added',
      portfolioId: parsed.portfolioId,
      payload: {
        kind: transaction.kind,
        assetId: transaction.assetId,
        transactionId: transaction.id,
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice,
      },
    });

    return transaction;
  });
};

export const listTransactions = async (ctx: Ctx, portfolioId: string) => {
  await assertRole({ ctx, portfolioId, requiredRole: 'VIEWER' });

  const rows = await db
    .select({
      id: transactions.id,
      assetName: assets.name,
      assetType: assets.type,
      note: transactions.note,
      kind: transactions.kind,
      assetSymbol: assets.symbol,
      assetId: transactions.assetId,
      quantity: transactions.quantity,
      unitPrice: transactions.unitPrice,
      createdAt: transactions.createdAt,
      occurredAt: transactions.occurredAt,
      reversesTransactionId: transactions.reversesTransactionId,
    })
    .from(transactions)
    .innerJoin(
      assets,
      and(
        eq(assets.id, transactions.assetId),
        eq(assets.portfolioId, portfolioId),
      ),
    )
    .where(eq(transactions.portfolioId, portfolioId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
    .limit(100);

  const transactionIds = rows.map((row) => row.id);

  const reversalRows =
    transactionIds.length === 0
      ? []
      : await db
          .select({ reversesTransactionId: transactions.reversesTransactionId })
          .from(transactions)
          .where(
            and(
              eq(transactions.portfolioId, portfolioId),
              inArray(transactions.reversesTransactionId, transactionIds),
            ),
          );

  const reversedIds = new Set(
    reversalRows.flatMap((row) =>
      row.reversesTransactionId ? [row.reversesTransactionId] : [],
    ),
  );

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    note: row.note,
    assetId: row.assetId,
    asset: {
      name: row.assetName,
      type: row.assetType,
      symbol: row.assetSymbol,
    },
    isReversed: reversedIds.has(row.id),
    createdAt: row.createdAt.toISOString(),
    occurredAt: row.occurredAt.toISOString(),
    quantity: toDecimal(row.quantity).toFixed(),
    unitPrice: toDecimal(row.unitPrice).toFixed(),
    isReversal: row.reversesTransactionId !== null,
  }));
};
