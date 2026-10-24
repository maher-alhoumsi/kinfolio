import { requireUser } from '@/server/auth/session';
import EmptyState from '@/components/portfolio/empty-state';
import { listMyPortfolios } from '@/server/services/portfolio';
import { withPageErrorHandling } from '@/server/auth/page-error';
import PortfolioList from '@/components/portfolio/portfolio-list';
import NewPortfolioDialog from '@/components/portfolio/new-portfolio-dialog';

const PortfoliosPage = async () => {
  const ctx = await withPageErrorHandling(() => requireUser());
  const portfolios = await withPageErrorHandling(() => listMyPortfolios(ctx));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Your wealth</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            Portfolios
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Keep your household&apos;s financial picture organized in one place.
          </p>
        </div>

        <NewPortfolioDialog />
      </div>

      {portfolios.length === 0 && <EmptyState />}

      {portfolios.length > 0 && <PortfolioList portfolios={portfolios} />}
    </div>
  );
};

export default PortfoliosPage;
