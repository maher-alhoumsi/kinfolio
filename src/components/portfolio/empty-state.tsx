import { Card, CardContent } from '../ui/card';
import NewPortfolioDialog from '@/components/portfolio/new-portfolio-dialog';

const EmptyState = () => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Create your first portfolio
        </h2>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Start with a simple overview of the accounts and assets that matter to
          your household.
        </p>

        <NewPortfolioDialog />
      </CardContent>
    </Card>
  );
};

export default EmptyState;
