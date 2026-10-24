import { z } from 'zod';

import { TRANSACTION_KINDS } from '@/lib/enums';

import { decimalString, priceString } from './decimal';
import { portfolioId } from './portfolio';

export { TRANSACTION_KINDS } from '@/lib/enums';

const notFutureDate = z.string().pipe(z.coerce.date()).refine(
  (value) => value.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
  {
  message: 'Date cannot be in the future',
  },
);

export const addTransactionInput = z.object({
  portfolioId,
  assetId: z.uuid(),
  kind: z.enum(TRANSACTION_KINDS),
  quantity: decimalString,
  unitPrice: priceString.optional(),
  occurredAt: notFutureDate,
  note: z.string().trim().max(280).optional(),
});

export const reverseTransactionInput = z.object({
  portfolioId,
  transactionId: z.uuid(),
});
