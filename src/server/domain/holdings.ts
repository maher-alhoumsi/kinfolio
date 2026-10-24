import {
  D as Decimal,
  type DecimalInstance,
  add,
  divide,
  multiply,
  subtract,
  toDecimal,
} from '@/lib/money';
import { ASSET_TYPES, TRANSACTION_KINDS } from '@/lib/enums';
import { activeTransactions } from '@/server/domain/ledger';

export type AssetType = (typeof ASSET_TYPES)[number];
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];
export type DecimalValue = string | DecimalInstance;

export type HoldingAsset = {
  id: string;
  type: AssetType;
  name: string;
  symbol?: string | null;
};

export type HoldingTransaction = {
  id: string;
  assetId: string;
  kind: TransactionKind;
  quantity: DecimalValue;
  unitPrice: DecimalValue;
  occurredAt: Date | string;
  createdAt: Date | string;
  reversesTransactionId?: string | null;
};

export type Holding = {
  assetId: string;
  type: AssetType;
  name: string;
  symbol: string | null | undefined;
  quantity: string;
  averageCost: string;
  costBasis: string;
  currentPrice: string;
  currentValue: string;
  unrealizedProfitOrLoss: string;
  priceIsFallback: boolean;
};

export type Allocation = {
  type: AssetType;
  value: string;
  share: string;
};

export type Summary = {
  totalValue: string;
  totalCost: string;
  totalUnrealizedProfitOrLoss: string;
};

const zero = () => new Decimal(0);
const output = (value: DecimalInstance): string => value.toFixed();

export const computeHoldings = (
  assets: readonly HoldingAsset[],
  transactions: readonly HoldingTransaction[],
  latestPrices: ReadonlyMap<string, DecimalValue>,
): Holding[] => {
  const active = activeTransactions(transactions);
  const sortedTransactions = [...active].sort((left, right) => {
    const dateDifference =
      new Date(left.occurredAt).getTime() -
      new Date(right.occurredAt).getTime();
    const createdDateDifference =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    const leftIsAdditive =
      left.kind === 'BUY' || left.kind === 'DEPOSIT';
    const rightIsAdditive =
      right.kind === 'BUY' || right.kind === 'DEPOSIT';

    if (dateDifference !== 0) return dateDifference;
    if (createdDateDifference !== 0) return createdDateDifference;
    if (leftIsAdditive !== rightIsAdditive) {
      return leftIsAdditive ? -1 : 1;
    }
    return left.id.localeCompare(right.id);
  });

  return [...assets]
    .sort(
      (left, right) =>
        left.type.localeCompare(right.type) ||
        left.name.localeCompare(right.name) ||
        left.id.localeCompare(right.id),
    )
    .map((asset) => {
      let quantity = zero();
      let costBasis = zero();
      let lastTransactionPrice = zero();

      for (const transaction of sortedTransactions) {
        if (transaction.assetId !== asset.id) continue;

        const transactionQuantity = toDecimal(transaction.quantity);
        lastTransactionPrice = toDecimal(transaction.unitPrice);
        const transactionCost = multiply(
          transactionQuantity,
          transaction.unitPrice,
        );
        const averageCost = quantity.isZero()
          ? zero()
          : divide(costBasis, quantity);

        if (transaction.kind === 'BUY' || transaction.kind === 'DEPOSIT') {
          quantity = add(quantity, transactionQuantity);
          costBasis = add(costBasis, transactionCost);
        } else {
          quantity = subtract(quantity, transactionQuantity);
          costBasis = subtract(
            costBasis,
            multiply(transactionQuantity, averageCost),
          );
          if (quantity.isZero()) costBasis = zero();
        }
      }

      const snapshotPrice = latestPrices.get(asset.id);
      const isCash = asset.type === 'CASH';
      const priceIsFallback =
        !isCash && !quantity.isZero() && snapshotPrice === undefined;
      const currentPrice = isCash
        ? new Decimal(1)
        : snapshotPrice === undefined
          ? lastTransactionPrice
          : toDecimal(snapshotPrice);
      const currentValue = multiply(quantity, currentPrice);

      return {
        assetId: asset.id,
        type: asset.type,
        name: asset.name,
        symbol: asset.symbol,
        quantity: output(quantity),
        averageCost: output(
          quantity.isZero() ? zero() : divide(costBasis, quantity),
        ),
        costBasis: output(costBasis),
        currentPrice: output(currentPrice),
        currentValue: output(currentValue),
        unrealizedProfitOrLoss: output(subtract(currentValue, costBasis)),
        priceIsFallback,
      };
    });
};

export const computeAllocation = (
  holdings: readonly Holding[],
): Allocation[] => {
  const values = new Map<AssetType, DecimalInstance>();

  for (const holding of holdings) {
    values.set(
      holding.type,
      add(values.get(holding.type) ?? zero(), holding.currentValue),
    );
  }

  const total = holdings.reduce(
    (sum, holding) => add(sum, holding.currentValue),
    zero(),
  );

  return [...values.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, value]) => ({
      type,
      value: output(value),
      share: output(total.isZero() ? zero() : divide(value, total)),
    }));
};

export const computeSummary = (holdings: readonly Holding[]): Summary => {
  const totalValue = holdings.reduce(
    (sum, holding) => add(sum, holding.currentValue),
    zero(),
  );
  const totalCost = holdings.reduce(
    (sum, holding) => add(sum, holding.costBasis),
    zero(),
  );

  return {
    totalValue: output(totalValue),
    totalCost: output(totalCost),
    totalUnrealizedProfitOrLoss: output(subtract(totalValue, totalCost)),
  };
};
