import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { dateFormatter } from '@/lib/utils';
import { requireUser } from '@/server/auth/session';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';
import RenamePortfolioDialog from '@/components/portfolio/rename-portfolio-dialog';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

const PortfolioOverviewPage = async ({ params }: Props) => {
  const { portfolioId } = await params;

  const ctx = await withPageErrorHandling(() => requireUser());

  const portfolio = await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Portfolio details</CardTitle>
              <CardDescription className="mt-1">
                A quick reference for this portfolio.
              </CardDescription>
            </div>

            {portfolio.role === 'OWNER' && (
              <RenamePortfolioDialog
                portfolioId={portfolio.id}
                currentName={portfolio.name}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Base currency
            </p>
            <p className="mt-1 text-sm font-medium">{portfolio.baseCurrency}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created
            </p>
            <p className="mt-1 text-sm font-medium">
              {dateFormatter.format(portfolio.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-14 text-center">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Your holdings and transactions will appear here
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This is where you&apos;ll be able to understand the full picture of
            this portfolio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverviewPage;
