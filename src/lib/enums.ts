export const ASSET_TYPES = [
  'STOCK',
  'CRYPTO',
  'REAL_ESTATE',
  'CASH',
] as const;

export const TRANSACTION_KINDS = [
  'BUY',
  'SELL',
  'DEPOSIT',
  'WITHDRAW',
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];
