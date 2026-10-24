'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

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
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { Role } from '@/lib/roles';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { addMemberAction } from '@/app/(app)/portfolios/[portfolioId]/actions';

interface Props {
  portfolioId: string;
}

const AddMemberDialog = ({ portfolioId }: Props) => {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [role, setRole] = useState<Role>('VIEWER');
  const [pending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setEmail('');
      setRole('VIEWER');
      setError(undefined);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);

    startTransition(async () => {
      const result = await addMemberAction(portfolioId, email, role);

      if (!result.ok) {
        if (result.code === 'VALIDATION' || result.code === 'CONFLICT')
          setError(result.fields?.email ?? result.message);
        else if (result.code === 'FORBIDDEN') toast.error(result.message);
        else
          toast.error('Unable to add member', { description: result.message });
        return;
      }

      handleOpenChange(false);
      toast.success('Member added');
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <UserPlus />
        Add member
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
          <DialogDescription>
            Add someone who already has a Kinfolio account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              required
              type="email"
              value={email}
              id="member-email"
              disabled={pending}
              aria-invalid={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
            />

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Select
              value={role}
              disabled={pending}
              onValueChange={(value) => value && setRole(value as Role)}
            >
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? 'Adding...' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
