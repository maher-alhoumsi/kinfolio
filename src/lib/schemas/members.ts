import { z } from 'zod';

import { ROLES } from '@/lib/roles';

import { portfolioId } from './portfolio';

const targetUserId = z.string().trim().min(1);

export const addMemberInput = z.object({
  portfolioId,
  role: z.enum(ROLES),
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export const changeMemberRoleInput = z.object({
  portfolioId,
  targetUserId,
  role: z.enum(ROLES),
});

export const removeMemberInput = z.object({
  portfolioId,
  targetUserId,
});
