import {
  add,
  subtract,
  toDecimal,
  D as Decimal,
  type DecimalInstance,
} from '@/lib/money';
import { TRANSACTION_KINDS } from '@/lib/enums';

export type LedgerTransaction = {
  id: string;
  kind: (typeof TRANSACTION_KINDS)[number];
  quantity: string | DecimalInstance;
  reversesTransactionId?: string | null;
};

export const activeTransactions = <T extends LedgerTransaction>(
  transactions: readonly T[],
): T[] => {
  const cancelled = new Set(
    transactions.flatMap((transaction) =>
      transaction.reversesTransactionId
        ? [transaction.id, transaction.reversesTransactionId]
        : [],
    ),
  );

  return transactions.filter((transaction) => !cancelled.has(transaction.id));
};

export const netQuantity = (
  transactions: readonly LedgerTransaction[],
): DecimalInstance => {
  return activeTransactions(transactions).reduce((total, transaction) => {
    const quantity = toDecimal(transaction.quantity);
    return transaction.kind === 'BUY' || transaction.kind === 'DEPOSIT'
      ? add(total, quantity)
      : subtract(total, quantity);
  }, new Decimal(0));
};
