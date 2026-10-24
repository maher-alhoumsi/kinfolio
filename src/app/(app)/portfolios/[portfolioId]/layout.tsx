import Link from 'next/link';

import { RoleBadge } from '@/components/role-badge';
import { requireUser } from '@/server/auth/session';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';
import PortfolioTabs from '@/components/portfolio/portfolio-tabs';

interface Props {
  children: React.ReactNode;
  params: Promise<{ portfolioId: string }>;
}

const PortfolioLayout = async ({ children, params }: Props) => {
  const { portfolioId } = await params;

  const ctx = await withPageErrorHandling(requireUser);

  const portfolio = await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <Link
          href="/portfolios"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          All portfolios
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {portfolio.name}
            </h1>

            <div className="mt-2">
              <RoleBadge role={portfolio.role} />
            </div>
          </div>
          <PortfolioTabs portfolioId={portfolioId} />
        </div>
      </div>

      {children}
    </div>
  );
};

export default PortfolioLayout;
