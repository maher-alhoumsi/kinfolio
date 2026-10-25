# Kinfolio

Kinfolio is a household portfolio tracker with portfolio memberships and
Owner, Editor, and Viewer roles. It records a multi-asset ledger and derives
holdings, allocation, and portfolio summaries from append-only transactions.
An embedded AI assistant can read the same portfolio data and can propose
transactions for a user to review and confirm. Authorization is enforced by
the same server services for the UI and the assistant.

## Features

- Portfolios and memberships with Owner, Editor, and Viewer roles
- Multi-asset ledger for stocks, crypto, real estate, and cash
- Append-only transactions with derived holdings and allocation summaries
- Mock price refresh
- Portfolio dashboard
- AI assistant with read tools and a propose-then-confirm write path
- Audit log available to portfolio owners

## Architecture

```text
App (Next.js UI, server actions, API routes)
  -> Services (authorization, validation, transactions, audit)
       -> Database (PostgreSQL via Drizzle)

Domain (pure ledger and holdings calculations)
Agent tools (closed-over context) -> the same services
```

Every entry point goes through services, and every service starts with
`parse -> assertRole -> work`.

The agent tools are closed over the authenticated `ctx` and `portfolioId`, so
the model cannot choose a different user or portfolio. Writes are proposals
stored on the server rather than changes made by the model. Confirmation is a
normal server action whose write input is only a proposal id. The server
rechecks the proposal, role, and state before applying it. The transaction and
its audit row are written in the same database transaction.

## Setup

### Prerequisites

- Node.js
- A PostgreSQL connection string, such as a free Neon database or a local
  PostgreSQL instance

Install dependencies:

```bash
npm ci
```

Copy the example environment file and fill every variable:

```bash
copy .env.example .env.local
```

The variables are:

- `BETTER_AUTH_SECRET`: a random secret for Better Auth. Generate one with
  Node.js:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  ```

- `BETTER_AUTH_URL`: for local development, `http://localhost:3000`
- `DATABASE_URL`: your PostgreSQL connection string
- `DATABASE_URL_POOLED`: your pooled PostgreSQL connection string
- `AI_PROVIDER`: `anthropic` or `openai`; it defaults to `anthropic`
- `ANTHROPIC_API_KEY`: optional Anthropic key for the assistant
- `OPENAI_API_KEY`: optional OpenAI key for the assistant
- `AI_MODEL`: optional model name; it defaults to `claude-haiku-5-5` for
  Anthropic and `gpt-4o-mini` for OpenAI

Apply the schema, seed the database, and start the development server:

```bash
npm run db:push
npm run db:seed
npm run dev
```

The assistant needs either `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, selected
with `AI_PROVIDER`. Without the selected provider's key, the assistant chat
cannot answer, but the rest of the application still works. The model-free
permission checks can still be run with:

```bash
npm run agent:demo
```

## Seeded logins

The seed script creates these users with the password `Password123!`:

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@kinfolio.test` | `Password123!` |
| Editor | `editor@kinfolio.test` | `Password123!` |
| Viewer | `viewer@kinfolio.test` | `Password123!` |

It also creates the `Household wealth` portfolio, memberships, and sample
cash, real estate, stock, and crypto data. Re-running the seed exits without
changes when that portfolio already exists.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application |
| `npm run start` | Start the built application |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Apply the Drizzle schema to the database |
| `npm run db:seed` | Seed users, portfolio data, and price snapshots |

## Scope decisions

### Built

The project includes role-based portfolio access, shared service-layer
authorization, append-only transactions, derived holdings and allocation,
mock pricing, dashboard views, an assistant with permission-bound read tools,
server-side transaction proposals and confirmation, and owner-only audit-log
access.

### Deferred on purpose

- **Background job queue:** price refresh is a plain function; production
  would use a queue worker.
- **Realtime updates:** updates use the existing server-rendered/action flow.
- **Transaction reversal UI:** the schema and holdings logic are designed for
  reversals, but there is no reversal UI.
- **Timeline-aware balance checks:** the current balance is checked under a
  row lock.
- **Real market data:** prices are intentionally mocked.
- **Multi-currency conversion:** the base currency is fixed to USD.
- **Email verification and password reset:** these flows are not included.
- **Automated test suite:** no automated test suite is included.

## Known limitations

- Chat history is not persisted.
- Proposals expire after 15 minutes.
- Each portfolio can have one cash asset.
