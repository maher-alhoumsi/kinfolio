import 'server-only';

import { and, asc, desc, eq, ne } from 'drizzle-orm';

import { assets, priceSnapshots, transactions } from '@/server/db/schema';
import { db } from '@/server/db';
import { assertRole } from '@/server/auth/policy';
import { type Ctx } from '@/server/auth/session';
import { add, compare, multiply, toDecimal } from '@/lib/money';

export const refreshMockPrices = async (
  ctx: Ctx,
  portfolioId: string,
): Promise<{ updated: number }> => {
  await assertRole({ ctx, portfolioId, requiredRole: 'EDITOR' });

  return db.transaction(async (tx) => {
    const portfolioAssets = await tx
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.portfolioId, portfolioId), ne(assets.type, 'CASH')));

    const latestSnapshots = await tx
      .selectDistinctOn([priceSnapshots.assetId], {
        assetId: priceSnapshots.assetId,
        price: priceSnapshots.price,
      })
      .from(priceSnapshots)
      .innerJoin(assets, eq(assets.id, priceSnapshots.assetId))
      .where(eq(assets.portfolioId, portfolioId))
      .orderBy(asc(priceSnapshots.assetId), desc(priceSnapshots.asOf));

    const latestTransactions = await tx
      .selectDistinctOn([transactions.assetId], {
        assetId: transactions.assetId,
        unitPrice: transactions.unitPrice,
      })
      .from(transactions)
      .where(eq(transactions.portfolioId, portfolioId))
      .orderBy(
        asc(transactions.assetId),
        desc(transactions.occurredAt),
        desc(transactions.createdAt),
      );

    const snapshotPrices = new Map(
      latestSnapshots.map((snapshot) => [snapshot.assetId, snapshot.price]),
    );
    const transactionPrices = new Map(
      latestTransactions.map((transaction) => [
        transaction.assetId,
        transaction.unitPrice,
      ]),
    );
    let updated = 0;
    const rows = [];

    for (const asset of portfolioAssets) {
      const startPrice =
        snapshotPrices.get(asset.id) ?? transactionPrices.get(asset.id);
      if (startPrice === undefined) continue;

      const randomChange = (Math.random() * 0.06 - 0.03).toString();
      const price = multiply(
        toDecimal(startPrice),
        add(toDecimal(1), randomChange),
      );
      const roundedPrice = toDecimal(price.toFixed(6));
      const finalPrice =
        compare(roundedPrice, '0.000001') < 0
          ? toDecimal('0.000001')
          : roundedPrice;

      rows.push({
        assetId: asset.id,
        price: finalPrice.toFixed(6),
      });
    }

    if (rows.length > 0) {
      await tx.insert(priceSnapshots).values(rows);
    }
    updated = rows.length;

    return { updated };
  });
};
