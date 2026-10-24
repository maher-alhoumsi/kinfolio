import { type Role } from '@/lib/roles';
import { requireUser } from '@/server/auth/session';
import { listAssets } from '@/server/services/asset';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';
import { getPortfolioOverview } from '@/server/services/overview';
import PortfolioActions from '@/components/portfolio/portfolio-actions';
import PortfolioDetails from '@/components/portfolio/portfolio-details';
import PortfolioSummary from '@/components/portfolio/portfolio-summary';
import PortfolioHoldings from '@/components/portfolio/portfolio-holdings';
import PortfolioAllocation from '@/components/portfolio/portfolio-allocation';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

const PortfolioOverviewPage = async ({ params }: Props) => {
  const { portfolioId } = await params;
  const ctx = await withPageErrorHandling(() => requireUser());

  const portfolio = await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );

  const [overview, assets] = await withPageErrorHandling(() =>
    Promise.all([
      getPortfolioOverview(ctx, portfolioId),
      listAssets(ctx, portfolioId),
    ]),
  );

  return (
    <div className="space-y-6">
      <PortfolioActions
        assets={assets}
        portfolioId={portfolioId}
        role={portfolio.role as Role}
      />

      <PortfolioSummary
        summary={overview.summary}
        baseCurrency={overview.baseCurrency}
      />

      <PortfolioDetails
        id={portfolio.id}
        name={portfolio.name}
        role={portfolio.role as Role}
        createdAt={portfolio.createdAt}
        baseCurrency={portfolio.baseCurrency}
      />

      <PortfolioAllocation
        allocation={overview.allocation}
        baseCurrency={overview.baseCurrency}
      />

      <PortfolioHoldings
        portfolioId={portfolioId}
        holdings={overview.holdings}
        role={portfolio.role as Role}
        baseCurrency={overview.baseCurrency}
      />
    </div>
  );
};

export default PortfolioOverviewPage;
