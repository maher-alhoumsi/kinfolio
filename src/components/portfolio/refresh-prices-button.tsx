'use client';

import { useTransition } from 'react';

import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { hasAtLeast, type Role } from '@/lib/roles';
import { refreshPricesAction } from '@/app/(app)/portfolios/[portfolioId]/data-actions';

interface Props {
  portfolioId: string;
  role: Role;
}

const RefreshPricesButton = ({ portfolioId, role }: Props) => {
  const [pending, startTransition] = useTransition();

  if (!hasAtLeast(role, 'EDITOR')) return null;

  const refresh = () => {
    startTransition(async () => {
      const result = await refreshPricesAction(portfolioId);

      if (!result.ok) {
        toast.error('Unable to refresh prices', {
          description: result.message,
        });
        return;
      }

      toast.success('Prices refreshed', {
        description: `${result.value.updated} asset${result.value.updated === 1 ? '' : 's'} updated`,
      });
    });
  };

  return (
    <Button variant="outline" onClick={refresh} disabled={pending}>
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <RefreshCw />
      )}
      {pending ? 'Refreshing...' : 'Refresh prices'}
    </Button>
  );
};

export default RefreshPricesButton;
