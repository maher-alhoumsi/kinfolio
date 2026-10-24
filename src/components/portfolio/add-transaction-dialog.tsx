'use client';

import { useMemo, useState, useTransition } from 'react';

import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { hasAtLeast, type Role } from '@/lib/roles';
import { type AssetType, type TransactionKind } from '@/lib/enums';
import { addTransactionAction } from '@/app/(app)/portfolios/[portfolioId]/data-actions';

export interface TransactionAsset {
  id: string;
  name: string;
  type: AssetType;
  symbol: string | null;
}

interface Props {
  role: Role;
  portfolioId: string;
  assets: TransactionAsset[];
}

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};

const getEmptyForm = () => ({
  assetId: '',
  kind: 'BUY' as TransactionKind,
  quantity: '',
  unitPrice: '',
  occurredAt: today(),
  note: '',
});

const AddTransactionDialog = ({ portfolioId, role, assets }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(getEmptyForm);
  const [fields, setFields] = useState<Record<string, string>>();
  const [conflict, setConflict] = useState<string>();
  const [pending, startTransition] = useTransition();

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === form.assetId),
    [assets, form.assetId],
  );
  const availableKinds: TransactionKind[] =
    selectedAsset?.type === 'CASH' ? ['DEPOSIT', 'WITHDRAW'] : ['BUY', 'SELL'];

  if (!hasAtLeast(role, 'EDITOR')) return null;

  const reset = () => {
    setForm(getEmptyForm());
    setFields(undefined);
    setConflict(undefined);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFields(undefined);
    setConflict(undefined);

    startTransition(async () => {
      const result = await addTransactionAction(portfolioId, {
        assetId: form.assetId,
        kind: form.kind,
        quantity: form.quantity,
        unitPrice: selectedAsset?.type === 'CASH' ? undefined : form.unitPrice,
        occurredAt: form.occurredAt,
        note: form.note.trim() || undefined,
      });

      if (!result.ok) {
        if (result.code === 'VALIDATION') setFields(result.fields);
        else if (result.code === 'CONFLICT') setConflict(result.message);
        else
          toast.error('Unable to add transaction', {
            description: result.message,
          });
        return;
      }

      setOpen(false);
      toast.success('Transaction added');
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) reset();
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add transaction
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a transaction</DialogTitle>
          <DialogDescription>
            Record a deposit, withdrawal, purchase, or sale.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="transaction-asset">Asset</Label>
            <Select
              value={form.assetId}
              onValueChange={(value) => {
                const asset = assets.find((item) => item.id === value);
                setForm((current) => ({
                  ...current,
                  assetId: value ?? '',
                  kind: asset?.type === 'CASH' ? 'DEPOSIT' : 'BUY',
                }));
                setFields(undefined);
                setConflict(undefined);
              }}
            >
              <SelectTrigger id="transaction-asset" className="w-full">
                <SelectValue placeholder="Choose an asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.symbol
                      ? `${asset.symbol} — ${asset.name}`
                      : asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fields?.assetId && (
              <p className="text-sm text-destructive">{fields.assetId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-kind">Type</Label>
            <Select
              value={form.kind}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  kind: value as TransactionKind,
                }))
              }
              disabled={!selectedAsset}
            >
              <SelectTrigger id="transaction-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind[0] + kind.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fields?.kind && (
              <p className="text-sm text-destructive">{fields.kind}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-quantity">Quantity</Label>
            <Input
              required
              id="transaction-quantity"
              value={form.quantity}
              disabled={pending}
              inputMode="decimal"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
            />
            {fields?.quantity && (
              <p className="text-sm text-destructive">{fields.quantity}</p>
            )}
          </div>

          {selectedAsset?.type !== 'CASH' && (
            <div className="space-y-2">
              <Label htmlFor="transaction-unit-price">Unit price</Label>
              <Input
                required
                id="transaction-unit-price"
                value={form.unitPrice}
                disabled={pending}
                inputMode="decimal"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitPrice: event.target.value,
                  }))
                }
              />
              {fields?.unitPrice && (
                <p className="text-sm text-destructive">{fields.unitPrice}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transaction-date">Date</Label>
            <Input
              required
              id="transaction-date"
              type="date"
              value={form.occurredAt}
              max={today()}
              disabled={pending}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  occurredAt: event.target.value,
                }))
              }
            />
            {fields?.occurredAt && (
              <p className="text-sm text-destructive">{fields.occurredAt}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-note">Note</Label>
            <Input
              id="transaction-note"
              value={form.note}
              disabled={pending}
              maxLength={280}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
            />
            {fields?.note && (
              <p className="text-sm text-destructive">{fields.note}</p>
            )}
          </div>

          {conflict && (
            <p className="text-sm text-destructive" role="alert">
              {conflict}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !selectedAsset}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
