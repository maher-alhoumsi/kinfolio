import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import {
  parseInput,
  createPortfolioInput,
  renamePortfolioInput,
} from '@/lib/schemas';
import { db } from '@/server/db';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { memberships, portfolios } from '@/server/db/schema';

export const createPortfolio = async (ctx: Ctx, input: unknown) => {
  const { name } = parseInput(createPortfolioInput, input);

  return db.transaction(async (tx) => {
    const [portfolio] = await tx
      .insert(portfolios)
      .values({ name, createdBy: ctx.userId })
      .returning();

    await tx.insert(memberships).values({
      portfolioId: portfolio.id,
      userId: ctx.userId,
      role: 'OWNER',
    });

    return portfolio;
  });
};

export const listMyPortfolios = async (ctx: Ctx) => {
  const myPortfolios = await db
    .select({
      id: portfolios.id,
      name: portfolios.name,
      role: memberships.role,
      createdBy: portfolios.createdBy,
      createdAt: portfolios.createdAt,
      baseCurrency: portfolios.baseCurrency,
    })
    .from(portfolios)
    .innerJoin(
      memberships,
      and(
        eq(memberships.portfolioId, portfolios.id),
        eq(memberships.userId, ctx.userId),
      ),
    )
    .orderBy(desc(portfolios.createdAt));

  return myPortfolios;
};

export const getPortfolio = async (ctx: Ctx, id: string) => {
  await assertRole({ ctx, portfolioId: id, requiredRole: 'VIEWER' });

  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.id, id))
    .limit(1);

  return portfolio;
};

export const renamePortfolio = async (ctx: Ctx, input: unknown) => {
  const { portfolioId, name } = parseInput(renamePortfolioInput, input);

  await assertRole({ ctx, portfolioId, requiredRole: 'OWNER' });

  const [portfolio] = await db
    .update(portfolios)
    .set({ name })
    .where(eq(portfolios.id, portfolioId))
    .returning();

  return portfolio;
};
