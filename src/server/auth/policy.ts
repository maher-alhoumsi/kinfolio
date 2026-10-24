import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { memberships } from '@/server/db/schema';
import { portfolioIdSchema } from '@/lib/schemas/portfolio';

import { Ctx } from './session';
import { hasAtLeast, type Role } from './roles';
import { ForbiddenError, NotFoundError } from './errors';

interface AssertRoleOptions {
  ctx: Ctx;
  requiredRole: Role;
  portfolioId: string;
}

export const assertRole = async ({
  ctx,
  portfolioId,
  requiredRole,
}: AssertRoleOptions): Promise<Role> => {
  const parsedPortfolioId = portfolioIdSchema.safeParse(portfolioId);

  if (!parsedPortfolioId.success) throw new NotFoundError();

  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.portfolioId, parsedPortfolioId.data),
        eq(memberships.userId, ctx.userId),
      ),
    );

  if (!membership) throw new NotFoundError();
  if (!hasAtLeast(membership.role, requiredRole)) throw new ForbiddenError();

  return membership.role;
};
