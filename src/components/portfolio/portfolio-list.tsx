import Link from 'next/link';

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '../ui/card';
import { RoleBadge } from '../role-badge';
import { dateFormatter } from '@/lib/utils';

interface Props {
  portfolios: {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    baseCurrency: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
  }[];
}

const PortfolioList = ({ portfolios }: Props) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {portfolios.map((portfolio) => (
        <Link
          key={portfolio.id}
          href={`/portfolios/${portfolio.id}`}
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="truncate">{portfolio.name}</CardTitle>
                <RoleBadge role={portfolio.role} />
              </div>

              <CardDescription>
                Created {dateFormatter.format(portfolio.createdAt)}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Base currency{' '}
                <span className="font-medium text-foreground">
                  {portfolio.baseCurrency}
                </span>
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default PortfolioList;
