import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dateFormatter } from '@/lib/utils';
import RenamePortfolioDialog from '@/components/portfolio/rename-portfolio-dialog';
import { type Role } from '@/lib/roles';

interface Props {
  id: string;
  name: string;
  role: Role;
  baseCurrency: string;
  createdAt: Date;
}

const PortfolioDetails = ({
  id,
  name,
  role,
  baseCurrency,
  createdAt,
}: Props) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Portfolio details</CardTitle>
          <CardDescription className="mt-1">
            A quick reference for this portfolio.
          </CardDescription>
        </div>
        {role === 'OWNER' && (
          <RenamePortfolioDialog portfolioId={id} currentName={name} />
        )}
      </div>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Base currency
        </p>
        <p className="mt-1 text-sm font-medium">{baseCurrency}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Created
        </p>
        <p className="mt-1 text-sm font-medium">
          {dateFormatter.format(createdAt)}
        </p>
      </div>
    </CardContent>
  </Card>
);

export default PortfolioDetails;
