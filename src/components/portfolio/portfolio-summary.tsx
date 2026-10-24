import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { compare, divide, formatMoney, multiply } from '@/lib/money';

interface Props {
  summary: {
    totalValue: string;
    totalCost: string;
    totalUnrealizedProfitOrLoss: string;
  };
  baseCurrency: string;
}

const PortfolioSummary = ({ summary, baseCurrency }: Props) => {
  const profitIsGain = compare(summary.totalUnrealizedProfitOrLoss, '0') >= 0;
  const profitPercentage =
    compare(summary.totalCost, '0') === 0
      ? '0'
      : multiply(
          divide(summary.totalUnrealizedProfitOrLoss, summary.totalCost),
          '100',
        )
          .abs()
          .toFixed(2);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Total value</CardDescription>
          <CardTitle className="text-2xl">
            {formatMoney(summary.totalValue, baseCurrency)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Total cost</CardDescription>
          <CardTitle className="text-2xl">
            {formatMoney(summary.totalCost, baseCurrency)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Unrealized profit/loss</CardDescription>
          <CardTitle
            className={`text-2xl ${
              profitIsGain
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {profitIsGain ? '+' : '-'}
            {formatMoney(
              profitIsGain
                ? summary.totalUnrealizedProfitOrLoss
                : multiply(summary.totalUnrealizedProfitOrLoss, '-1'),
              baseCurrency,
            )}
          </CardTitle>
          <p
            className={`text-sm ${
              profitIsGain
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {profitIsGain ? '+' : '-'}
            {profitPercentage}%
          </p>
        </CardHeader>
      </Card>
    </div>
  );
};

export default PortfolioSummary;
