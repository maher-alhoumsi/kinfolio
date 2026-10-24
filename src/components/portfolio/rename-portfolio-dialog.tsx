'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { renamePortfolioAction } from '@/app/(app)/portfolios/[portfolioId]/actions';

interface Props {
  portfolioId: string;
  currentName: string;
}

const RenamePortfolioDialog = ({ portfolioId, currentName }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);

    startTransition(async () => {
      const result = await renamePortfolioAction(portfolioId, name);

      if (!result.ok) {
        if (result.code === 'VALIDATION') setError(result.message);
        else if (result.code === 'FORBIDDEN') toast.error(result.message);
        else
          toast.error('Unable to rename portfolio', {
            description: result.message,
          });
        return;
      }

      setOpen(false);
      toast.success('Portfolio renamed');
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(currentName);
      setError(undefined);
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil />
        Rename
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename portfolio</DialogTitle>
          <DialogDescription>
            Choose a clear name for this portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="portfolio-rename">Name</Label>
            <Input
              required
              value={name}
              maxLength={80}
              disabled={pending}
              id="portfolio-rename"
              onChange={(event) => setName(event.target.value)}
            />

            <p className="text-xs text-muted-foreground">
              Use 1 to 80 characters.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" /> Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenamePortfolioDialog;
