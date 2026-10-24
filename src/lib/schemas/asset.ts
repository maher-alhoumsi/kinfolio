import { z } from 'zod';

import { ASSET_TYPES } from '@/lib/enums';
import { portfolioId } from './portfolio';
export { ASSET_TYPES } from '@/lib/enums';

export const createAssetInput = z
  .object({
    portfolioId,
    type: z.enum(ASSET_TYPES),
    name: z.string().trim().min(1).max(80),
    symbol: z
      .preprocess(
        (value) =>
          typeof value === 'string' && value.trim() === '' ? undefined : value,
        z
          .string()
          .trim()
          .min(1)
          .max(20)
          .transform((value) => value.toUpperCase())
          .optional(),
      )
      .optional(),
  })
  .superRefine(({ type, symbol }, context) => {
    const symbolRequired = type === 'STOCK' || type === 'CRYPTO';

    if (symbolRequired && !symbol) {
      context.addIssue({
        code: 'custom',
        path: ['symbol'],
        message: `${type} assets require a symbol`,
      });
    } else if (!symbolRequired && symbol) {
      context.addIssue({
        code: 'custom',
        path: ['symbol'],
        message: `${type} assets cannot have a symbol`,
      });
    }
  });
