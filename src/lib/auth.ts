import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';

export const auth = betterAuth({
  emailAndPassword: { enabled: true },

  database: drizzleAdapter(db, { provider: 'pg', schema: { ...schema } }),
});
