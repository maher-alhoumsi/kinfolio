'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/auth/session';
import { runAction, type ActionResult } from '@/server/actions/run-action';
import { createAsset } from '@/server/services/asset';
import { refreshMockPrices } from '@/server/services/price';
import { addTransaction } from '@/server/services/transaction';

export type CreateAssetActionResult = ActionResult<
  Awaited<ReturnType<typeof createAsset>>
>;
export type AddTransactionActionResult = ActionResult<
  Awaited<ReturnType<typeof addTransaction>>
>;
export type RefreshPricesActionResult = ActionResult<
  Awaited<ReturnType<typeof refreshMockPrices>>
>;

export async function createAssetAction(
  portfolioId: string,
  input: Record<string, unknown>,
): Promise<CreateAssetActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    const asset = await createAsset(ctx, { ...input, portfolioId });

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
    return asset;
  });
}

export async function addTransactionAction(
  portfolioId: string,
  input: Record<string, unknown>,
): Promise<AddTransactionActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    const transaction = await addTransaction(ctx, { ...input, portfolioId });

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
    return transaction;
  });
}

export async function refreshPricesAction(
  portfolioId: string,
): Promise<RefreshPricesActionResult> {
  return runAction(async () => {
    const ctx = await requireUser();
    const result = await refreshMockPrices(ctx, portfolioId);

    revalidatePath(`/portfolios/${portfolioId}`, 'layout');
    return result;
  });
}
