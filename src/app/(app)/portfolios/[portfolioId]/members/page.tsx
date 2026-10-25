import { notFound } from 'next/navigation';

import { requireUser } from '@/server/auth/session';
import { listMembers } from '@/server/services/membership';
import { withPageErrorHandling } from '@/server/auth/page-error';
import MembersView, { type MemberRow } from '@/components/members/members-view';

interface Props {
  params: Promise<{ portfolioId: string }>;
}

const MembersPage = async ({ params }: Props) => {
  const { portfolioId } = await params;

  const ctx = await withPageErrorHandling(() => requireUser());

  const members = await withPageErrorHandling(() =>
    listMembers(ctx, portfolioId),
  );

  const rows: MemberRow[] = members.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email,
    userId: member.userId,
    joinedAt: member.createdAt.toISOString(),
  }));

  const currentMember = rows.find((member) => member.userId === ctx.userId);

  if (!currentMember) notFound();

  return (
    <MembersView
      members={rows}
      portfolioId={portfolioId}
      currentUserId={ctx.userId}
      currentRole={currentMember.role}
    />
  );
};

export default MembersPage;
