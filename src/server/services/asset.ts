import 'server-only';

import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { assets, portfolios } from '@/server/db/schema';
import { assertRole } from '@/server/auth/policy';
import { type Ctx } from '@/server/auth/session';
import { ConflictError } from '@/server/auth/errors';
import { isUniqueViolation } from '@/server/lib/db-errors';
import { createAssetInput, parseInput } from '@/lib/schemas';

export const createAsset = async (ctx: Ctx, input: unknown) => {
  const { portfolioId, type, symbol, name } = parseInput(
    createAssetInput,
    input,
  );

  await assertRole({ ctx, portfolioId, requiredRole: 'EDITOR' });

  try {
    return await db.transaction(async (tx) => {
      await tx
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .for('update');

      if (type === 'CASH') {
        const [cashAsset] = await tx
          .select({ id: assets.id })
          .from(assets)
          .where(
            and(eq(assets.portfolioId, portfolioId), eq(assets.type, 'CASH')),
          )
          .for('update')
          .limit(1);

        if (cashAsset) {
          throw new ConflictError('This portfolio already has a cash asset');
        }
      }

      const [asset] = await tx
        .insert(assets)
        .values({ portfolioId, type, symbol, name })
        .returning({
          id: assets.id,
          type: assets.type,
          symbol: assets.symbol,
          name: assets.name,
          createdAt: assets.createdAt,
        });

      return asset;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('An asset with this symbol already exists');
    }
    throw error;
  }
};

export const listAssets = async (ctx: Ctx, portfolioId: string) => {
  await assertRole({ ctx, portfolioId, requiredRole: 'VIEWER' });

  return db
    .select({
      id: assets.id,
      type: assets.type,
      symbol: assets.symbol,
      name: assets.name,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(eq(assets.portfolioId, portfolioId))
    .orderBy(asc(assets.type), asc(assets.name));
};
