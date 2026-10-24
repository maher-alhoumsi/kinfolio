import { z } from 'zod';

export const portfolioId = z.uuid();
export const portfolioIdSchema = portfolioId;

export const createPortfolioInput = z.object({
  name: z.string().trim().min(1).max(80),
});

export const renamePortfolioInput = z.object({
  portfolioId,
  name: z.string().trim().min(1).max(80),
});
