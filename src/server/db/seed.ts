import { auth } from '@/lib/auth';
import { ASSET_TYPES, TRANSACTION_KINDS } from '@/lib/enums';
import { db } from '@/server/db';
import { priceSnapshots } from '@/server/db/schema';
import { type Ctx } from '@/server/auth/session';
import { addMember } from '@/server/services/membership';
import { createAsset } from '@/server/services/asset';
import { createPortfolio, listMyPortfolios } from '@/server/services/portfolio';
import { refreshMockPrices } from '@/server/services/price';
import { addTransaction } from '@/server/services/transaction';

const PASSWORD = 'Password123!';
const PORTFOLIO_NAME = 'Household wealth';

const users = {
  owner: {
    name: 'Olivia Owner',
    email: 'owner@kinfolio.test',
  },
  editor: {
    name: 'Ethan Editor',
    email: 'editor@kinfolio.test',
  },
  viewer: {
    name: 'Vera Viewer',
    email: 'viewer@kinfolio.test',
  },
} as const;

type User = { id: string };

const isExistingEmailError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes('USER_ALREADY_EXISTS') ||
    error.message.includes('already exists')
  );
};

const ensureUser = async (user: (typeof users)[keyof typeof users]): Promise<User> => {
  try {
    const response = await auth.api.signUpEmail({
      body: {
        name: user.name,
        email: user.email,
        password: PASSWORD,
      },
    });

    console.log(`Created user ${user.email}`);
    return { id: response.user.id };
  } catch (error) {
    if (!isExistingEmailError(error)) throw error;

    const response = await auth.api.signInEmail({
      body: {
        email: user.email,
        password: PASSWORD,
      },
    });

    console.log(`Skipped existing user ${user.email}`);
    return { id: response.user.id };
  }
};

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const addSeedTransaction = async (
  ctx: Ctx,
  portfolioId: string,
  assetId: string,
  kind: (typeof TRANSACTION_KINDS)[number],
  quantity: string,
  unitPrice: string | undefined,
  daysAgoCount: number,
  note: string,
) =>
  addTransaction(ctx, {
    portfolioId,
    assetId,
    kind,
    quantity,
    unitPrice,
    occurredAt: daysAgo(daysAgoCount),
    note,
  });

const main = async (): Promise<void> => {
  const owner = await ensureUser(users.owner);
  const editor = await ensureUser(users.editor);
  await ensureUser(users.viewer);
  const ownerCtx: Ctx = { userId: owner.id };
  const editorCtx: Ctx = { userId: editor.id };

  const existingPortfolio = (await listMyPortfolios(ownerCtx)).find(
    (portfolio) => portfolio.name === PORTFOLIO_NAME,
  );

  if (existingPortfolio) {
    console.log(
      `Portfolio "${PORTFOLIO_NAME}" already exists; exiting without changes.`,
    );
    return;
  }

  const portfolio = await createPortfolio(ownerCtx, { name: PORTFOLIO_NAME });
  const portfolioId = portfolio.id;

  await addMember(ownerCtx, {
    portfolioId,
    email: users.editor.email,
    role: 'EDITOR',
  });
  await addMember(ownerCtx, {
    portfolioId,
    email: users.viewer.email,
    role: 'VIEWER',
  });

  const cash = await createAsset(ownerCtx, {
    portfolioId,
    type: 'CASH' satisfies (typeof ASSET_TYPES)[number],
    name: 'Checking',
  });
  const apartment = await createAsset(ownerCtx, {
    portfolioId,
    type: 'REAL_ESTATE' satisfies (typeof ASSET_TYPES)[number],
    name: 'Apartment',
  });
  const aapl = await createAsset(editorCtx, {
    portfolioId,
    type: 'STOCK',
    symbol: 'AAPL',
    name: 'Apple',
  });
  const msft = await createAsset(editorCtx, {
    portfolioId,
    type: 'STOCK',
    symbol: 'MSFT',
    name: 'Microsoft',
  });
  const btc = await createAsset(editorCtx, {
    portfolioId,
    type: 'CRYPTO',
    symbol: 'BTC',
    name: 'Bitcoin',
  });

  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    cash.id,
    'DEPOSIT',
    '50000',
    undefined,
    175,
    'Initial cash deposit',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    cash.id,
    'DEPOSIT',
    '1000',
    undefined,
    140,
    'Additional savings',
  );
  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    cash.id,
    'WITHDRAW',
    '2500',
    undefined,
    20,
    'Household expenses',
  );
  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    aapl.id,
    'BUY',
    '20',
    '180',
    160,
    'Initial AAPL position',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    aapl.id,
    'BUY',
    '10',
    '190',
    110,
    'AAPL follow-up purchase',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    aapl.id,
    'BUY',
    '4',
    '202',
    70,
    'AAPL recurring investment',
  );
  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    aapl.id,
    'SELL',
    '5',
    '218',
    12,
    'Partial AAPL sale',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    msft.id,
    'BUY',
    '12',
    '350',
    150,
    'Initial MSFT position',
  );
  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    msft.id,
    'BUY',
    '5',
    '380',
    90,
    'MSFT follow-up purchase',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    msft.id,
    'BUY',
    '3',
    '410',
    35,
    'MSFT recurring investment',
  );
  await addSeedTransaction(
    ownerCtx,
    portfolioId,
    btc.id,
    'BUY',
    '0.5',
    '42000',
    130,
    'Initial BTC position',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    btc.id,
    'BUY',
    '0.1',
    '45000',
    60,
    'BTC follow-up purchase',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    btc.id,
    'BUY',
    '0.05',
    '47000',
    25,
    'BTC recurring investment',
  );
  await addSeedTransaction(
    editorCtx,
    portfolioId,
    apartment.id,
    'BUY',
    '1',
    '250000',
    100,
    'Apartment purchase',
  );

  await refreshMockPrices(ownerCtx, portfolioId);
  await refreshMockPrices(ownerCtx, portfolioId);
  await refreshMockPrices(ownerCtx, portfolioId);
  await db.insert(priceSnapshots).values({
    assetId: apartment.id,
    price: '255000',
    asOf: new Date(),
  });

  console.log(`Seeded portfolio "${PORTFOLIO_NAME}".`);
  console.log('Logins:');
  console.log(`  Olivia Owner: ${users.owner.email} / ${PASSWORD}`);
  console.log(`  Ethan Editor: ${users.editor.email} / ${PASSWORD}`);
  console.log(`  Vera Viewer: ${users.viewer.email} / ${PASSWORD}`);
};

main().catch((error: unknown) => {
  console.error('Database seed failed:', error);
  process.exitCode = 1;
});
