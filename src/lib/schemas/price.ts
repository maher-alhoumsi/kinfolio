import { z } from 'zod';

import { priceString } from './decimal';
import { portfolioId } from './portfolio';

export const recordPriceInput = z.object({
  portfolioId,
  assetId: z.uuid(),
  price: priceString,
});
