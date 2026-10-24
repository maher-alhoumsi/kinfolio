import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/auth/errors';
import { db } from '@/server/db';
import { compare, toDecimal } from '@/lib/money';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { netQuantity } from '@/server/domain/ledger';
import { assets, transactions } from '@/server/db/schema';
import { addTransactionInput, parseInput } from '@/lib/schemas';

export const addTransaction = async (ctx: Ctx, input: unknown) => {
  const parsed = parseInput(addTransactionInput, input);

  await assertRole({
    ctx,
    requiredRole: 'EDITOR',
    portfolioId: parsed.portfolioId,
  });

  return db.transaction(async (tx) => {
    const [asset] = await tx
      .select({ id: assets.id, type: assets.type })
      .from(assets)
      .where(
        and(
          eq(assets.id, parsed.assetId),
          eq(assets.portfolioId, parsed.portfolioId),
        ),
      )
      .for('update')
      .limit(1);

    if (!asset) throw new NotFoundError('Asset not found');

    const isCashTransaction =
      parsed.kind === 'DEPOSIT' || parsed.kind === 'WITHDRAW';

    if ((asset.type === 'CASH') !== isCashTransaction) {
      throw new ValidationError(
        asset.type === 'CASH'
          ? 'Cash assets only support DEPOSIT and WITHDRAW transactions'
          : 'Non-cash assets only support BUY and SELL transactions',
      );
    }

    const unitPrice = asset.type === 'CASH' ? '1' : parsed.unitPrice;

    if (unitPrice === undefined) {
      throw new ValidationError(
        'Unit price is required for non-cash transactions',
      );
    }

    if (parsed.kind === 'SELL' || parsed.kind === 'WITHDRAW') {
      const assetTransactions = await tx
        .select({
          id: transactions.id,
          kind: transactions.kind,
          quantity: transactions.quantity,
          reversesTransactionId: transactions.reversesTransactionId,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.portfolioId, parsed.portfolioId),
            eq(transactions.assetId, parsed.assetId),
          ),
        );

      if (compare(parsed.quantity, netQuantity(assetTransactions)) > 0) {
        throw new ConflictError('Insufficient holdings');
      }
    }

    const [transaction] = await tx
      .insert(transactions)
      .values({
        portfolioId: parsed.portfolioId,
        assetId: parsed.assetId,
        kind: parsed.kind,
        quantity: parsed.quantity,
        unitPrice,
        occurredAt: parsed.occurredAt,
        note: parsed.note,
        createdBy: ctx.userId,
      })
      .returning({
        id: transactions.id,
        assetId: transactions.assetId,
        kind: transactions.kind,
        quantity: transactions.quantity,
        unitPrice: transactions.unitPrice,
        occurredAt: transactions.occurredAt,
        note: transactions.note,
        createdAt: transactions.createdAt,
      });

    return {
      ...transaction,
      quantity: toDecimal(transaction.quantity).toFixed(),
      unitPrice: toDecimal(transaction.unitPrice).toFixed(),
      occurredAt: transaction.occurredAt.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
    };
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
