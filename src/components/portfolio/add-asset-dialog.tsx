'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { hasAtLeast, type Role } from '@/lib/roles';
import { ASSET_TYPES } from '@/lib/enums';
import { createAssetAction } from '@/app/(app)/portfolios/[portfolioId]/data-actions';

interface Props {
  portfolioId: string;
  role: Role;
}

const typeLabels: Record<(typeof ASSET_TYPES)[number], string> = {
  STOCK: 'Stock',
  CRYPTO: 'Crypto',
  REAL_ESTATE: 'Real estate',
  CASH: 'Cash',
};

const emptyForm = {
  type: 'STOCK' as (typeof ASSET_TYPES)[number],
  name: '',
  symbol: '',
};

const AddAssetDialog = ({ portfolioId, role }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fields, setFields] = useState<Record<string, string>>();
  const [conflict, setConflict] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!hasAtLeast(role, 'EDITOR')) return null;

  const reset = () => {
    setForm(emptyForm);
    setFields(undefined);
    setConflict(undefined);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFields(undefined);
    setConflict(undefined);

    startTransition(async () => {
      const result = await createAssetAction(portfolioId, {
        type: form.type,
        name: form.name,
        symbol: form.symbol,
      });

      if (!result.ok) {
        if (result.code === 'VALIDATION') setFields(result.fields);
        else if (result.code === 'CONFLICT') setConflict(result.message);
        else
          toast.error('Unable to add asset', { description: result.message });
        return;
      }

      setOpen(false);
      toast.success('Asset added');
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add asset
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an asset</DialogTitle>
          <DialogDescription>
            Add an asset that belongs to this portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="asset-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  type: value as (typeof ASSET_TYPES)[number],
                  symbol:
                    value === 'STOCK' || value === 'CRYPTO'
                      ? current.symbol
                      : '',
                }))
              }
            >
              <SelectTrigger id="asset-type" className="w-full">
                <SelectValue>{typeLabels[form.type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {fields?.type && (
              <p className="text-sm text-destructive">{fields.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              required
              id="asset-name"
              value={form.name}
              disabled={pending}
              maxLength={80}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            {fields?.name && (
              <p className="text-sm text-destructive">{fields.name}</p>
            )}
          </div>

          {(form.type === 'STOCK' || form.type === 'CRYPTO') && (
            <div className="space-y-2">
              <Label htmlFor="asset-symbol">Symbol</Label>
              <Input
                required
                id="asset-symbol"
                value={form.symbol}
                disabled={pending}
                maxLength={20}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    symbol: event.target.value,
                  }))
                }
              />
              {fields?.symbol && (
                <p className="text-sm text-destructive">{fields.symbol}</p>
              )}
            </div>
          )}

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
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add asset'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;
