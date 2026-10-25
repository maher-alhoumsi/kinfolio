'use server';

import { revalidatePath } from 'next/cache';

import {
  addMember,
  removeMember,
  changeMemberRole,
} from '@/server/services/membership';
import type { Role } from '@/lib/roles';
import { redirect } from 'next/navigation';
import { requireUser } from '@/server/auth/session';
import { renamePortfolio } from '@/server/services/portfolio';
import { runAction, type ActionResult } from '@/server/actions/run-action';

export type PortfolioActionResult = ActionResult<void>;

export async function renamePortfolioAction(
  portfolioId: string,
  name: string,
): Promise<PortfolioActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    await renamePortfolio(ctx, { portfolioId, name });

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
    revalidatePath('/portfolios');
  });
}

export async function addMemberAction(
  portfolioId: string,
  email: string,
  role: Role,
): Promise<PortfolioActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    await addMember(ctx, { portfolioId, email, role });
    revalidatePath(`/portfolios/${portfolioId}/members`);
  });
}

export async function changeMemberRoleAction(
  portfolioId: string,
  targetUserId: string,
  role: Role,
): Promise<PortfolioActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();

    await changeMemberRole(ctx, { portfolioId, targetUserId, role });

    revalidatePath(`/portfolios/${portfolioId}/members`);
    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
  });
}

export async function removeMemberAction(
  portfolioId: string,
  targetUserId: string,
): Promise<PortfolioActionResult> {
  let removedSelf = false;

  const result = await runAction(async () => {
    const ctx = await requireUser();

    await removeMember(ctx, { portfolioId, targetUserId });

    removedSelf = targetUserId === ctx.userId;
  });

  if (result.ok && removedSelf) {
    revalidatePath('/portfolios');
    redirect('/portfolios');
  }

  if (result.ok) {
    revalidatePath(`/portfolios/${portfolioId}/members`);
  }

  return result;
}
