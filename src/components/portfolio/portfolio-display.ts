import { type AssetType } from '@/lib/enums';

export const typeLabels: Record<AssetType, string> = {
  STOCK: 'Stock',
  CRYPTO: 'Crypto',
  REAL_ESTATE: 'Real estate',
  CASH: 'Cash',
};

export const allocationColors: Record<AssetType, string> = {
  STOCK: 'bg-blue-500',
  CRYPTO: 'bg-violet-500',
  REAL_ESTATE: 'bg-amber-500',
  CASH: 'bg-emerald-500',
};
