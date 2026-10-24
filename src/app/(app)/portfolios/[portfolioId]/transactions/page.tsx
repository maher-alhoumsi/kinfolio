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
import AddTransactionDialog from '@/components/portfolio/add-transaction-dialog';
import { formatMoney, multiply } from '@/lib/money';
import { dateFormatter } from '@/lib/utils';
import { getPortfolioForPage } from '@/server/auth/page-data';
import { withPageErrorHandling } from '@/server/auth/page-error';
import { requireUser } from '@/server/auth/session';
import { listAssets } from '@/server/services/asset';
import { listTransactions } from '@/server/services/transaction';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

const TransactionsPage = async ({ params }: Props) => {
  const { portfolioId } = await params;
  const ctx = await withPageErrorHandling(() => requireUser());
  const portfolio = await withPageErrorHandling(() =>
    getPortfolioForPage(ctx.userId, portfolioId),
  );
  const assets = await withPageErrorHandling(() => listAssets(ctx, portfolioId));
  const transactions = await withPageErrorHandling(() =>
    listTransactions(ctx, portfolioId),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription className="mt-1">
              A record of activity in this portfolio.
            </CardDescription>
          </div>
          <AddTransactionDialog
            portfolioId={portfolioId}
            role={portfolio.role}
            assets={assets}
          />
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions have been recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className={transaction.isReversed ? 'text-muted-foreground' : undefined}
                >
                  <TableCell>{dateFormatter.format(new Date(transaction.occurredAt))}</TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {transaction.asset.symbol ?? transaction.asset.name}
                    </p>
                    {transaction.asset.symbol && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.asset.name}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.kind}</Badge>
                  </TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>
                    {formatMoney(transaction.unitPrice, portfolio.baseCurrency)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(
                      multiply(transaction.quantity, transaction.unitPrice),
                      portfolio.baseCurrency,
                    )}
                  </TableCell>
                  <TableCell>{transaction.note ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsPage;
