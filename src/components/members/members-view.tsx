'use client';

import { RoleBadge } from '@/components/role-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from '@/components/ui/table';
import type { Role } from '@/lib/roles';
import { dateFormatter, getInitials } from '@/lib/utils';
import RoleSelect from '@/components/members/role-select';
import AddMemberDialog from '@/components/members/add-member-dialog';
import RemoveMemberAction from '@/components/members/remove-member-action';

export interface MemberRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
}

interface Props {
  portfolioId: string;
  currentUserId: string;
  currentRole: Role;
  members: MemberRow[];
}

const MembersView = ({
  members,
  portfolioId,
  currentRole,
  currentUserId,
}: Props) => {
  const isOwner = currentRole === 'OWNER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Members
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            People who can view or manage this portfolio.
          </p>
        </div>

        {isOwner && <AddMemberDialog portfolioId={portfolioId} />}
      </div>

      {!isOwner && (
        <p className="text-sm text-muted-foreground">
          Only owners can manage portfolio members.
        </p>
      )}

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">
                        {member.name}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {isOwner ? (
                    <RoleSelect portfolioId={portfolioId} member={member} />
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </TableCell>

                <TableCell>
                  {dateFormatter.format(new Date(member.joinedAt))}
                </TableCell>

                {isOwner && (
                  <TableCell className="text-right">
                    <RemoveMemberAction
                      member={member}
                      portfolioId={portfolioId}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MembersView;
