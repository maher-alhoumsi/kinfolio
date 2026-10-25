import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
  pgEnum,
  unique,
  check,
  AnyPgColumn,
  numeric,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';

import { ROLES } from '@/lib/roles';
import { ASSET_TYPES, TRANSACTION_KINDS } from '@/lib/enums';
import { sql } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const portfolios = pgTable(
  'portfolios',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    baseCurrency: text('base_currency').notNull().default('USD'),

    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('portfolios_created_by_idx').on(t.createdBy)],
);

export const roleEnum = pgEnum('membership_role', ROLES);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('VIEWER'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('memberships_userId_idx').on(t.userId),
    unique('memberships_portfolioId_userId_key').on(t.portfolioId, t.userId),
  ],
);

export const assetTypeEnum = pgEnum('asset_type', ASSET_TYPES);

export const transactionKindEnum = pgEnum(
  'transaction_kind',
  TRANSACTION_KINDS,
);

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'restrict' }),
    type: assetTypeEnum('type').notNull(),
    symbol: text('symbol'),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('assets_portfolio_type_symbol_key').on(
      t.portfolioId,
      t.type,
      t.symbol,
    ),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'restrict' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    kind: transactionKindEnum('kind').notNull(),
    quantity: numeric('quantity', { precision: 28, scale: 10 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 20, scale: 6 }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    note: text('note'),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    reversesTransactionId: uuid('reverses_transaction_id')
      .unique()
      .references((): AnyPgColumn => transactions.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('transactions_portfolio_occurred_idx').on(
      t.portfolioId,
      t.occurredAt,
    ),
    index('transactions_asset_idx').on(t.assetId),
    check('transactions_quantity_positive', sql`${t.quantity} > 0`),
    check('transactions_unit_price_positive', sql`${t.unitPrice} > 0`),
    check(
      'transactions_not_self_reversal',
      sql`${t.reversesTransactionId} is distinct from ${t.id}`,
    ),
  ],
);

export const priceSnapshots = pgTable(
  'price_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'restrict' }),
    price: numeric('price', { precision: 20, scale: 6 }).notNull(),
    asOf: timestamp('as_of', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('price_snapshots_asset_as_of_idx').on(t.assetId, t.asOf),
    check('price_snapshots_price_positive', sql`${t.price} > 0`),
  ],
);

export const auditActorKindEnum = pgEnum('audit_actor_kind', ['USER', 'AGENT']);
export const proposalStatusEnum = pgEnum('proposal_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
]);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'restrict' }),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    actorKind: auditActorKindEnum('actor_kind').notNull(),
    action: text('action').notNull(),
    payload: jsonb('payload')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('audit_log_portfolio_created_idx').on(t.portfolioId, t.createdAt),
  ],
);

export const agentProposals = pgTable(
  'agent_proposals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    portfolioId: uuid('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'restrict' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    input: jsonb('input').$type<Record<string, unknown>>().notNull(),
    status: proposalStatusEnum('status').notNull().default('PENDING'),
    transactionId: uuid('transaction_id').references(() => transactions.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('agent_proposals_lookup_idx').on(t.portfolioId, t.userId, t.status),
  ],
);
