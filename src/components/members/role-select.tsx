'use client';

import { useTransition } from 'react';

import { toast } from 'sonner';

import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import type { Role } from '@/lib/roles';
import type { MemberRow } from '@/components/members/members-view';
import { changeMemberRoleAction } from '@/app/(app)/portfolios/[portfolioId]/actions';

interface Props {
  member: MemberRow;
  portfolioId: string;
}

const RoleSelect = ({ member, portfolioId }: Props) => {
  const [pending, startTransition] = useTransition();

  const updateRole = (value: string | null) => {
    if (!value || value === member.role) return;

    const nextRole = value as Role;
    startTransition(async () => {
      const result = await changeMemberRoleAction(
        portfolioId,
        member.userId,
        nextRole,
      );

      if (!result.ok) {
        if (result.code === 'FORBIDDEN') toast.error(result.message);
        else
          toast.error('Unable to change role', { description: result.message });
        return;
      }

      toast.success('Member role updated');
    });
  };

  return (
    <Select value={member.role} onValueChange={updateRole} disabled={pending}>
      <SelectTrigger size="sm" aria-label={`Role for ${member.name}`}>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="OWNER">Owner</SelectItem>
        <SelectItem value="EDITOR">Editor</SelectItem>
        <SelectItem value="VIEWER">Viewer</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default RoleSelect;
