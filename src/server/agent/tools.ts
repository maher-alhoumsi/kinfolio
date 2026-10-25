import 'server-only';

import { tool } from 'ai';
import { z } from 'zod';

import { type Ctx } from '@/server/auth/session';
import { AppError } from '@/server/auth/errors';
import { listAssets } from '@/server/services/asset';
import { listTransactions } from '@/server/services/transaction';
import { getPortfolioOverview } from '@/server/services/overview';

const emptyInput = z.object({});

const appErrorResult = (error: AppError) => ({
  error: error.code,
  message: error.message,
});

const withAppErrorResult =
  <TInput, TOutput>(execute: (input: TInput) => Promise<TOutput>) =>
  async (input: TInput) => {
    try {
      return await execute(input);
    } catch (error) {
      if (error instanceof AppError) return appErrorResult(error);
      throw error;
    }
  };

export const buildTools = (ctx: Ctx, portfolioId: string) => ({
  getPortfolioOverview: tool({
    description:
      'Get the portfolio overview, holdings, allocation, and summary.',
    inputSchema: emptyInput,
    execute: withAppErrorResult(() => getPortfolioOverview(ctx, portfolioId)),
  }),

  listRecentTransactions: tool({
    description: 'List the most recent transactions for the portfolio.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(25).default(10),
    }),

    execute: withAppErrorResult(async ({ limit }) => {
      const transactions = await listTransactions(ctx, portfolioId);

      return transactions.slice(0, limit).map((transaction) => ({
        id: transaction.id,
        asset: {
          name: transaction.asset.name,
          type: transaction.asset.type,
          symbol: transaction.asset.symbol,
        },
        kind: transaction.kind,
        note: transaction.note,
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice,
        occurredAt: transaction.occurredAt,
        isReversed: transaction.isReversed,
      }));
    }),
  }),
  listAssets: tool({
    inputSchema: emptyInput,
    description: 'List the assets in the portfolio.',
    execute: withAppErrorResult(() => listAssets(ctx, portfolioId)),
  }),
});
