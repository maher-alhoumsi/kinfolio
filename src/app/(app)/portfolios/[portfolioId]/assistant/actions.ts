'use server';

import { revalidatePath } from 'next/cache';

import {
  cancelTransactionProposal,
  confirmTransactionProposal,
} from '@/server/services/proposal';
import { requireUser } from '@/server/auth/session';
import { runAction, type ActionResult } from '@/server/actions/run-action';

export type ProposalActionResult = ActionResult<void>;

export async function confirmProposalAction(
  portfolioId: string,
  proposalId: string,
): Promise<ProposalActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    await confirmTransactionProposal(ctx, portfolioId, proposalId);

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
  });
}

export async function cancelProposalAction(
  portfolioId: string,
  proposalId: string,
): Promise<ProposalActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    await cancelTransactionProposal(ctx, portfolioId, proposalId);

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
  });
}
