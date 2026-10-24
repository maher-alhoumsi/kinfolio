import 'server-only';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { UnauthenticatedError } from './errors';

export type Ctx = { userId: string };

export const requireUser = async (): Promise<Ctx> => {
  const ctx = await auth.api.getSession({ headers: await headers() });

  if (!ctx) throw new UnauthenticatedError();

  return { userId: ctx.session.userId };
};
