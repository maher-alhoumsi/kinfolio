import 'server-only';

import { z } from 'zod';
import { tool } from 'ai';

import { TRANSACTION_KINDS } from '@/lib/enums';
import { AppError } from '@/server/auth/errors';
import { type Ctx } from '@/server/auth/session';
import { listAssets } from '@/server/services/asset';
import { decimalString, priceString } from '@/lib/schemas';
import { listTransactions } from '@/server/services/transaction';
import { getPortfolioOverview } from '@/server/services/overview';
import { createTransactionProposal } from '@/server/services/proposal';

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
  proposeTransaction: tool({
    description:
      'Propose a transaction for the user to review and confirm in the UI. This only PROPOSES a change and never records anything. Call listAssets first to get the real asset id. Never guess ids. Propose once per user request, then wait for the user.',
    inputSchema: z.object({
      assetId: z.uuid(),
      quantity: decimalString,
      kind: z.enum(TRANSACTION_KINDS),
      unitPrice: priceString.optional(),
      note: z.string().trim().max(280).optional(),
      occurredAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format'),
    }),
    execute: withAppErrorResult((input) =>
      createTransactionProposal(ctx, portfolioId, input),
    ),
  }),
});
