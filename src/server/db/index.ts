import ws from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';

export const db = drizzle({ ws, connection: process.env.DATABASE_URL! });
