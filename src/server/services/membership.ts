import 'server-only';

import { and, eq } from 'drizzle-orm';

import {
  parseInput,
  addMemberInput,
  removeMemberInput,
  changeMemberRoleInput,
} from '@/lib/schemas';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/auth/errors';
import { db } from '@/server/db';
import { type Ctx } from '@/server/auth/session';
import { assertRole } from '@/server/auth/policy';
import { memberships, user } from '@/server/db/schema';

export const listMembers = async (ctx: Ctx, portfolioId: string) => {
  await assertRole({ ctx, portfolioId, requiredRole: 'VIEWER' });

  return db
    .select({
      name: user.name,
      email: user.email,
      id: memberships.id,
      role: memberships.role,
      userId: memberships.userId,
      createdAt: memberships.createdAt,
      portfolioId: memberships.portfolioId,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.portfolioId, portfolioId));
};

export const addMember = async (ctx: Ctx, input: unknown) => {
  const parsed = parseInput(addMemberInput, input);

  await assertRole({
    ctx,
    requiredRole: 'OWNER',
    portfolioId: parsed.portfolioId,
  });

  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, parsed.email))
    .limit(1);

  if (!target) {
    throw new ValidationError('No account with that email', {
      email: 'No account with that email',
    });
  }

  const [membership] = await db
    .insert(memberships)
    .values({
      userId: target.id,
      role: parsed.role,
      portfolioId: parsed.portfolioId,
    })
    .onConflictDoNothing({
      target: [memberships.portfolioId, memberships.userId],
    })
    .returning();

  if (!membership)
    throw new ConflictError('User is already a member of this portfolio');

  return membership;
};

export const changeMemberRole = async (ctx: Ctx, input: unknown) => {
  const parsed = parseInput(changeMemberRoleInput, input);

  await assertRole({
    ctx,
    requiredRole: 'OWNER',
    portfolioId: parsed.portfolioId,
  });

  return db.transaction(async (tx) => {
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.portfolioId, parsed.portfolioId),
          eq(memberships.userId, parsed.targetUserId),
        ),
      )
      .limit(1);

    if (!membership) throw new NotFoundError('Member not found');

    if (membership.role === 'OWNER' && parsed.role !== 'OWNER') {
      const owners = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.portfolioId, parsed.portfolioId),
            eq(memberships.role, 'OWNER'),
          ),
        )
        .for('update');

      if (owners.length === 1) {
        throw new ConflictError('A portfolio must have at least one owner');
      }
    }

    const [updated] = await tx
      .update(memberships)
      .set({ role: parsed.role })
      .where(eq(memberships.id, membership.id))
      .returning();

    return updated;
  });
};

export const removeMember = async (ctx: Ctx, input: unknown) => {
  const parsed = parseInput(removeMemberInput, input);

  await assertRole({
    ctx,
    requiredRole: 'OWNER',
    portfolioId: parsed.portfolioId,
  });

  return db.transaction(async (tx) => {
    const [membership] = await tx
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.portfolioId, parsed.portfolioId),
          eq(memberships.userId, parsed.targetUserId),
        ),
      )
      .limit(1);

    if (!membership) throw new NotFoundError('Member not found');

    if (membership.role === 'OWNER') {
      const owners = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.portfolioId, parsed.portfolioId),
            eq(memberships.role, 'OWNER'),
          ),
        )
        .for('update');

      if (owners.length === 1) {
        throw new ConflictError('A portfolio must have at least one owner');
      }
    }

    await tx.delete(memberships).where(eq(memberships.id, membership.id));

    return membership;
  });
};
