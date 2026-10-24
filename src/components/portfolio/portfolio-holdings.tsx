import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { hasAtLeast, type Role } from '@/lib/roles';
import { compare, formatMoney, multiply } from '@/lib/money';
import { type Holding } from '@/server/domain/holdings';
import AddAssetDialog from '@/components/portfolio/add-asset-dialog';
import { typeLabels } from '@/components/portfolio/portfolio-display';

interface Props {
  holdings: Holding[];
  baseCurrency: string;
  portfolioId: string;
  role: Role;
}

const PortfolioHoldings = ({
  holdings,
  baseCurrency,
  portfolioId,
  role,
}: Props) => {
  const openHoldings = holdings.filter(
    (holding) => compare(holding.quantity, '0') !== 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>Current positions and performance.</CardDescription>
      </CardHeader>
      <CardContent>
        {openHoldings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {hasAtLeast(role, 'EDITOR')
                ? 'Add an asset and transaction to start tracking holdings.'
                : 'Nothing here yet.'}
            </p>
            <div className="mt-4">
              <AddAssetDialog portfolioId={portfolioId} role={role} />
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Average cost</TableHead>
                <TableHead>Current price</TableHead>
                <TableHead>Current value</TableHead>
                <TableHead>Unrealized P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openHoldings.map((holding) => {
                const gain = compare(holding.unrealizedProfitOrLoss, '0') >= 0;

                return (
                  <TableRow key={holding.assetId}>
                    <TableCell>
                      <p className="font-medium">{holding.name}</p>
                      {holding.symbol && (
                        <p className="text-xs text-muted-foreground">
                          {holding.symbol}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[holding.type]}</Badge>
                    </TableCell>
                    <TableCell>{holding.quantity}</TableCell>
                    <TableCell>{formatMoney(holding.averageCost, baseCurrency)}</TableCell>
                    <TableCell>
                      {formatMoney(holding.currentPrice, baseCurrency)}
                      {holding.priceIsFallback && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          estimated
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(holding.currentValue, baseCurrency)}</TableCell>
                    <TableCell
                      className={
                        gain
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }
                    >
                      {gain ? '+' : '-'}
                      {formatMoney(
                        gain
                          ? holding.unrealizedProfitOrLoss
                          : multiply(holding.unrealizedProfitOrLoss, '-1'),
                        baseCurrency,
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioHoldings;
