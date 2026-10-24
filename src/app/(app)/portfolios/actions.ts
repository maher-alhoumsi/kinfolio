'use server';

import { requireUser } from '@/server/auth/session';
import { createPortfolio } from '@/server/services/portfolio';
import { runAction, type ActionResult } from '@/server/actions/run-action';

export type CreatePortfolioResult = ActionResult<{ id: string }>;

export async function createPortfolioAction(
  _previousState: CreatePortfolioResult,
  formData: FormData,
): Promise<CreatePortfolioResult> {
  const result = await runAction(async () => {
    const ctx = await requireUser();
    return createPortfolio(ctx, { name: formData.get('name') });
  });

  if (!result.ok) {
    if (result.code === 'VALIDATION') {
      return {
        ...result,
        message: result.message.replace(/^name:\s*/i, ''),
        fields: { name: result.message.replace(/^name:\s*/i, '') },
      };
    }

    return result;
  }

  return result;
}
