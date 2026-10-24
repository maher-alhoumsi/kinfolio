import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { UnauthenticatedError } from './errors';

export type Ctx = { userId: string };

export const getSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  return session;
});

export const requireUser = async (): Promise<Ctx> => {
  const ctx = await getSession();

  if (!ctx) throw new UnauthenticatedError();

  return { userId: ctx.session.userId };
};
