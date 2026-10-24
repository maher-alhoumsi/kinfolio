import { cache } from 'react';

import { getPortfolio } from '../services/portfolio';

export const getPortfolioForPage = cache(
  (userId: string, portfolioId: string) => {
    return getPortfolio({ userId }, portfolioId);
  },
);
