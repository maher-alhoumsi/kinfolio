import 'server-only';

import { asc, desc, eq } from 'drizzle-orm';

import {
  computeSummary,
  computeHoldings,
  computeAllocation,
} from '@/server/domain/holdings';
import {
  assets,
  portfolios,
  transactions,
  priceSnapshots,
} from '@/server/db/schema';
import { db } from '@/server/db';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { NotFoundError } from '@/server/auth/errors';

export const getPortfolioOverview = async (ctx: Ctx, portfolioId: string) => {
  await assertRole({ ctx, portfolioId, requiredRole: 'VIEWER' });

  const [portfolioRows, portfolioAssets, portfolioTransactions, latestPrices] =
    await Promise.all([
      db
        .select({ baseCurrency: portfolios.baseCurrency })
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1),
      db
        .select({
          id: assets.id,
          type: assets.type,
          name: assets.name,
          symbol: assets.symbol,
        })
        .from(assets)
        .where(eq(assets.portfolioId, portfolioId)),
      db
        .select({
          id: transactions.id,
          assetId: transactions.assetId,
          kind: transactions.kind,
          quantity: transactions.quantity,
          unitPrice: transactions.unitPrice,
          occurredAt: transactions.occurredAt,
          createdAt: transactions.createdAt,
          reversesTransactionId: transactions.reversesTransactionId,
        })
        .from(transactions)
        .where(eq(transactions.portfolioId, portfolioId)),
      db
        .selectDistinctOn([priceSnapshots.assetId], {
          assetId: priceSnapshots.assetId,
          price: priceSnapshots.price,
        })
        .from(priceSnapshots)
        .innerJoin(assets, eq(assets.id, priceSnapshots.assetId))
        .where(eq(assets.portfolioId, portfolioId))
        .orderBy(asc(priceSnapshots.assetId), desc(priceSnapshots.asOf)),
    ]);

  const portfolio = portfolioRows[0];
  if (!portfolio) throw new NotFoundError();

  const prices = new Map(
    latestPrices.map((snapshot) => [snapshot.assetId, snapshot.price]),
  );
  const holdings = computeHoldings(
    portfolioAssets,
    portfolioTransactions,
    prices,
  );

  return {
    baseCurrency: portfolio.baseCurrency,
    holdings,
    allocation: computeAllocation(holdings),
    summary: computeSummary(holdings),
  };
};
