'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  cancelProposalAction,
  confirmProposalAction,
} from '@/app/(app)/portfolios/[portfolioId]/assistant/actions';

export type TransactionProposalSummary = {
  kind: string;
  quantity: string;
  assetName: string;
  unitPrice?: string;
  occurredAt: string;
  note?: string | null;
  assetSymbol: string | null;
};

interface Props {
  expiresAt: string;
  proposalId: string;
  portfolioId: string;
  proposal: TransactionProposalSummary;
}

type Resolution = 'idle' | 'pending' | 'recorded' | 'cancelled';

const ProposalCard = ({
  portfolioId,
  proposal,
  proposalId,
  expiresAt,
}: Props) => {
  const [error, setError] = useState<string>();
  const [resolution, setResolution] = useState<Resolution>('idle');

  const resolve = async (action: 'confirm' | 'cancel') => {
    if (resolution !== 'idle') return;

    setResolution('pending');
    setError(undefined);

    const result =
      action === 'confirm'
        ? await confirmProposalAction(portfolioId, proposalId)
        : await cancelProposalAction(portfolioId, proposalId);

    if (!result.ok) {
      setResolution('idle');
      setError(
        result.code === 'NOT_FOUND'
          ? 'This proposal has expired or is no longer available.'
          : result.message,
      );
      return;
    }

    setResolution(action === 'confirm' ? 'recorded' : 'cancelled');
  };

  const resolved = resolution === 'recorded' || resolution === 'cancelled';
  const expires = new Date(expiresAt).toLocaleString();

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3 text-sm shadow-sm">
      <div className="space-y-1">
        <p className="font-medium">
          {proposal.assetSymbol
            ? `${proposal.assetSymbol} — ${proposal.assetName}`
            : proposal.assetName}
        </p>

        <p>
          <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs">
            {proposal.kind}
          </span>
          Quantity: {proposal.quantity}
        </p>

        {proposal.unitPrice !== undefined && (
          <p>Unit price: {proposal.unitPrice}</p>
        )}

        <p>Date: {proposal.occurredAt}</p>
        {proposal.note && <p>Note: {proposal.note}</p>}

        <p className="text-xs text-muted-foreground">Expires: {expires}</p>
      </div>

      {resolution === 'recorded' && (
        <p className="font-medium text-emerald-700">Recorded</p>
      )}

      {resolution === 'cancelled' && (
        <p className="font-medium text-muted-foreground">Cancelled</p>
      )}

      {error && <p className="text-destructive">{error}</p>}

      {!resolved && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={resolution === 'pending'}
            onClick={() => void resolve('confirm')}
          >
            {resolution === 'pending' ? 'Saving...' : 'Confirm'}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={resolution === 'pending'}
            onClick={() => void resolve('cancel')}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProposalCard;
