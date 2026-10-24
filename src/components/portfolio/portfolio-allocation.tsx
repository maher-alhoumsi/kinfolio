import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { multiply, formatMoney } from '@/lib/money';
import { type Allocation } from '@/server/domain/holdings';
import { allocationColors, typeLabels } from '@/components/portfolio/portfolio-display';

interface Props {
  allocation: Allocation[];
  baseCurrency: string;
}

const PortfolioAllocation = ({ allocation, baseCurrency }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Allocation</CardTitle>
      <CardDescription>
        How the portfolio is distributed by type.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {allocation.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add holdings to see your allocation.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {allocation.map((item) => (
              <div
                key={item.type}
                className={allocationColors[item.type]}
                style={{ width: `${multiply(item.share, '100').toFixed(2)}%` }}
                title={`${typeLabels[item.type]}: ${multiply(item.share, '100').toFixed(2)}%`}
              />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {allocation.map((item) => (
              <div
                key={item.type}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${allocationColors[item.type]}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">{typeLabels[item.type]}</p>
                    <p className="text-muted-foreground">
                      {formatMoney(item.value, baseCurrency)}
                    </p>
                  </div>
                </div>
                <span className="text-muted-foreground">
                  {multiply(item.share, '100').toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default PortfolioAllocation;
