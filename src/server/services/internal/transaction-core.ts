import 'server-only';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/auth/errors';
import { db } from '@/server/db';
import { compare, toDecimal } from '@/lib/money';
import { type Ctx } from '@/server/auth/session';
import { addTransactionInput } from '@/lib/schemas';
import { netQuantity } from '@/server/domain/ledger';
import { assets, transactions } from '@/server/db/schema';

type ParsedTransaction = z.output<typeof addTransactionInput>;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const checkTransactionAllowed = async (
  tx: DbTransaction,
  parsed: ParsedTransaction,
) => {
  const [asset] = await tx
    .select({
      id: assets.id,
      type: assets.type,
      name: assets.name,
      symbol: assets.symbol,
    })
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

  return { asset, unitPrice };
};

export const insertValidatedTransaction = async (
  tx: DbTransaction,
  ctx: Ctx,
  parsed: ParsedTransaction,
) => {
  const { unitPrice } = await checkTransactionAllowed(tx, parsed);
  const [transaction] = await tx
    .insert(transactions)
    .values({
      unitPrice,
      note: parsed.note,
      kind: parsed.kind,
      createdBy: ctx.userId,
      assetId: parsed.assetId,
      quantity: parsed.quantity,
      occurredAt: parsed.occurredAt,
      portfolioId: parsed.portfolioId,
    })
    .returning({
      id: transactions.id,
      kind: transactions.kind,
      note: transactions.note,
      assetId: transactions.assetId,
      quantity: transactions.quantity,
      unitPrice: transactions.unitPrice,
      createdAt: transactions.createdAt,
      occurredAt: transactions.occurredAt,
    });

  return {
    ...transaction,
    createdAt: transaction.createdAt.toISOString(),
    occurredAt: transaction.occurredAt.toISOString(),
    quantity: toDecimal(transaction.quantity).toFixed(),
    unitPrice: toDecimal(transaction.unitPrice).toFixed(),
  };
};
