'use client';

import { useActionState, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  createPortfolioAction,
  type CreatePortfolioResult,
} from '../../app/(app)/portfolios/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const initialState: CreatePortfolioResult = { ok: true, value: { id: '' } };

const NewPortfolioDialog = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createPortfolioAction,
    initialState,
  );

  useEffect(() => {
    if (!state.ok) return;

    if (state.value.id) {
      toast.success('Portfolio created');
      router.push(`/portfolios/${state.value.id}`);
    }
  }, [router, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New portfolio</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a portfolio</DialogTitle>
          <DialogDescription>
            Give your portfolio a name to get started.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Name</Label>
            <Input
              required
              name="name"
              maxLength={80}
              disabled={pending}
              id="portfolio-name"
              placeholder="Household wealth"
            />

            <p className="text-xs text-muted-foreground">
              Use 1 to 80 characters.
            </p>

            {!state.ok && state.fields?.name && (
              <p className="text-sm text-destructive">{state.fields.name}</p>
            )}
          </div>

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
                  Creating...
                </>
              ) : (
                'Create portfolio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPortfolioDialog;
