import { type Role } from '@/lib/roles';
import AddAssetDialog from '@/components/portfolio/add-asset-dialog';
import AddTransactionDialog from '@/components/portfolio/add-transaction-dialog';
import RefreshPricesButton from '@/components/portfolio/refresh-prices-button';

interface Props {
  portfolioId: string;
  role: Role;
  assets: Parameters<typeof AddTransactionDialog>[0]['assets'];
}

const PortfolioActions = ({ portfolioId, role, assets }: Props) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
    <AddAssetDialog portfolioId={portfolioId} role={role} />
    <AddTransactionDialog
      assets={assets}
      role={role}
      portfolioId={portfolioId}
    />
    <RefreshPricesButton portfolioId={portfolioId} role={role} />
  </div>
);

export default PortfolioActions;
