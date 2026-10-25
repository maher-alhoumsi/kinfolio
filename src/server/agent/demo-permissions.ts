import { eq } from 'drizzle-orm';

import type { ModelMessage } from 'ai';
import {
  cancelTransactionProposal,
  confirmTransactionProposal,
} from '@/server/services/proposal';
import { db } from '@/server/db';
import { user } from '@/server/db/schema';
import { type Ctx } from '@/server/auth/session';
import { buildTools } from '@/server/agent/tools';
import { listAssets } from '@/server/services/asset';
import { createAsset } from '@/server/services/asset';
import { listAuditLog } from '@/server/services/audit';
import { AppError, type ErrorCode } from '@/server/auth/errors';
import { addMember } from '@/server/services/membership';
import { createPortfolio, listMyPortfolios } from '@/server/services/portfolio';
import { addTransaction } from '@/server/services/transaction';

type ExpectedResult = 'OK' | ErrorCode;
type Role = 'OWNER' | 'EDITOR' | 'VIEWER';
type ToolOptions = { toolCallId: string; messages: ModelMessage[] };

const emails = {
  OWNER: 'owner@kinfolio.test',
  EDITOR: 'editor@kinfolio.test',
  VIEWER: 'viewer@kinfolio.test',
} as const;
const roles = ['OWNER', 'EDITOR', 'VIEWER'] as const;

const today = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isErrorResult = (value: unknown): value is { error: string } =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  typeof value.error === 'string';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const resultCode = (value: unknown): string =>
  isErrorResult(value) ? value.error : 'OK';

const runTool = async <TInput>(
  tool: { execute?: (input: TInput, options: never) => unknown },
  input: TInput,
  toolCallId: string,
): Promise<unknown> => {
  try {
    // The agent tools do not define a context schema, despite the SDK type requiring one.
    // @ts-expect-error The runtime accepts the documented minimal tool execution options.
    return await tool.execute?.(input, { toolCallId, messages: [] } satisfies ToolOptions);
  } catch (error) {
    if (error instanceof AppError) return { error: error.code };
    console.error(`Unexpected error in ${toolCallId}:`, error);
    return { error: 'UNEXPECTED_ERROR' };
  }
};

const capture = async (
  action: () => Promise<unknown>,
  label: string,
): Promise<unknown> => {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) return { error: error.code };
    console.error(`Unexpected error in ${label}:`, error);
    return { error: 'UNEXPECTED_ERROR' };
  }
};

const main = async (): Promise<void> => {
  const expectations: {
    actual: string;
    expected: ExpectedResult;
    label: string;
  }[] = [];

  const createdProposals: Partial<Record<Role, { id: string; ctx: Ctx }>> = {};

  const users = await Promise.all(
    roles.map(async (role) => {
      const email = emails[role];
      const [found] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
      return [role, found] as const;
    }),
  );

  const userIds = Object.fromEntries(users);

  if (!userIds.OWNER || !userIds.EDITOR || !userIds.VIEWER) {
    console.error('Seeded users are missing. Run db:seed first.');
    process.exitCode = 1;
    return;
  }

  const ownerCtx: Ctx = { userId: userIds.OWNER.id };
  const editorCtx: Ctx = { userId: userIds.EDITOR.id };
  const viewerCtx: Ctx = { userId: userIds.VIEWER.id };

  const existingSandbox = (await listMyPortfolios(ownerCtx)).find(
    (portfolio) => portfolio.name === 'Permission demo',
  );
  const sandbox = existingSandbox ?? (await createPortfolio(ownerCtx, {
    name: 'Permission demo',
  }));
  const sandboxId = sandbox.id;

  if (!existingSandbox) {
    await addMember(ownerCtx, {
      portfolioId: sandboxId,
      email: emails.EDITOR,
      role: 'EDITOR',
    });
    await addMember(ownerCtx, {
      portfolioId: sandboxId,
      email: emails.VIEWER,
      role: 'VIEWER',
    });
  }

  const stock =
    (await listAssets(ownerCtx, sandboxId)).find(
      (asset) => asset.type === 'STOCK' && asset.symbol === 'DEMO',
    ) ??
    (await createAsset(ownerCtx, {
      portfolioId: sandboxId,
      type: 'STOCK',
      symbol: 'DEMO',
      name: 'Permission demo stock',
    }));
  if (!stock) {
    console.error('The sandbox STOCK asset is missing.');
    process.exitCode = 1;
    return;
  }

  const tools = {
    OWNER: buildTools(ownerCtx, sandboxId),
    EDITOR: buildTools(editorCtx, sandboxId),
    VIEWER: buildTools(viewerCtx, sandboxId),
  };

  const contexts = { OWNER: ownerCtx, EDITOR: editorCtx, VIEWER: viewerCtx };

  const proposalInput: {
    assetId: string;
    quantity: string;
    kind: 'BUY';
    unitPrice: string;
    occurredAt: string;
  } = {
    assetId: stock.id,
    quantity: '1',
    kind: 'BUY',
    unitPrice: '100',
    occurredAt: today(),
  };
  const transactionInput = { ...proposalInput, portfolioId: sandboxId };

  const matrixRows: { tool: string; results: Record<Role, string> }[] = [];
  for (const toolName of [
    'getPortfolioOverview',
    'listAssets',
    'proposeTransaction',
  ] as const) {
    const results: Record<Role, string> = {
      OWNER: '',
      EDITOR: '',
      VIEWER: '',
    };
    for (const role of roles) {
      const result =
        toolName === 'getPortfolioOverview'
          ? await runTool(
              tools[role].getPortfolioOverview,
              {},
              `matrix-${toolName}-${role}`,
            )
          : toolName === 'listAssets'
            ? await runTool(
                tools[role].listAssets,
                {},
                `matrix-${toolName}-${role}`,
              )
            : await runTool(
                tools[role].proposeTransaction,
                proposalInput,
                `matrix-${toolName}-${role}`,
              );
      results[role] = resultCode(result);

      if (
        toolName === 'proposeTransaction' &&
        isRecord(result) &&
        !isErrorResult(result)
      ) {
        const proposalId = result.proposalId;
        if (typeof proposalId === 'string') {
          createdProposals[role] = { id: proposalId, ctx: contexts[role] };
        }
      }

      expectations.push({
        actual: results[role],
        expected:
          toolName === 'proposeTransaction' && role === 'VIEWER'
            ? 'FORBIDDEN'
            : 'OK',
        label: `${role} ${toolName}`,
      });
    }

    matrixRows.push({ tool: toolName, results });
  }

  console.log('\nSECTION A - role x tool matrix');
  console.log(
    'Expect: OWNER and EDITOR can use all tools; VIEWER is forbidden only for proposals.',
  );

  console.table(
    matrixRows.map(({ tool: toolName, results }) => ({
      tool: toolName,
      OWNER: results.OWNER,
      EDITOR: results.EDITOR,
      VIEWER: results.VIEWER,
    })),
  );

  console.log('\nSECTION B - confirmation flow');
  console.log(
    'Expect: the editor can confirm once; repeated and cross-user confirmation return NOT_FOUND.',
  );
  const editorProposalId = createdProposals.EDITOR?.id;

  if (!editorProposalId) {
    expectations.push({
      actual: 'could not create proposal',
      expected: 'OK',
      label: 'editor proposal',
    });
  } else {
    const confirmed = await capture(
      () =>
        confirmTransactionProposal(editorCtx, sandboxId, editorProposalId),
      'confirm editor proposal',
    );

    console.log('Confirmed transaction:', confirmed);
    expectations.push({
      actual: resultCode(confirmed),
      expected: 'OK',
      label: 'editor confirms proposal',
    });

    const repeated = await capture(
      () =>
        confirmTransactionProposal(editorCtx, sandboxId, editorProposalId),
      'confirm proposal again',
    );
    expectations.push({
      actual: resultCode(repeated),
      expected: 'NOT_FOUND',
      label: 'editor confirms same proposal again',
    });

    const another = await runTool(
      tools.EDITOR.proposeTransaction,
      proposalInput,
      'editor-another-proposal',
    );
    if (isRecord(another) && typeof another.proposalId === 'string') {
      createdProposals.EDITOR = { id: another.proposalId, ctx: editorCtx };
      const wrongUser = await capture(
        () =>
          confirmTransactionProposal(ownerCtx, sandboxId, another.proposalId),
        'owner confirms editor proposal',
      );
      expectations.push({
        actual: resultCode(wrongUser),
        expected: 'NOT_FOUND',
        label: 'owner confirms editor proposal',
      });
    } else {
      expectations.push({
        actual: 'could not create proposal',
        expected: 'OK',
        label: 'another editor proposal',
      });
    }
  }

  const viewerTransaction = await capture(
    () => addTransaction(viewerCtx, transactionInput),
    'viewer adds transaction',
  );
  expectations.push({
    actual: resultCode(viewerTransaction),
    expected: 'FORBIDDEN',
    label: 'viewer adds transaction',
  });

  const pendingEditorProposal = createdProposals.EDITOR?.id;
  if (!pendingEditorProposal) {
    expectations.push({
      actual: 'could not create proposal',
      expected: 'OK',
      label: 'viewer confirms editor proposal',
    });
  } else {
    const viewerConfirmation = await capture(
      () =>
        confirmTransactionProposal(
          viewerCtx,
          sandboxId,
          pendingEditorProposal,
        ),
      'viewer confirms editor proposal',
    );
    expectations.push({
      actual: resultCode(viewerConfirmation),
      expected: 'FORBIDDEN',
      label: 'viewer confirms editor proposal',
    });
  }

  console.log('\nSECTION C - tenant isolation');
  console.log(
    'Expect: the editor cannot read or propose in the viewer private portfolio.',
  );
  const viewerPortfolios = await listMyPortfolios(viewerCtx);
  const privatePortfolio =
    viewerPortfolios.find((portfolio) => portfolio.name === 'Viewer private') ??
    (await createPortfolio(viewerCtx, { name: 'Viewer private' }));
  const isolatedTools = buildTools(editorCtx, privatePortfolio.id);
  const isolatedOverview = await runTool(
    isolatedTools.getPortfolioOverview,
    {},
    'tenant-isolation-overview',
  );
  const isolatedProposal = await runTool(
    isolatedTools.proposeTransaction,
    proposalInput,
    'tenant-isolation-proposal',
  );
  expectations.push({
    actual: resultCode(isolatedOverview),
    expected: 'NOT_FOUND',
    label: 'editor reads viewer private portfolio',
  });
  expectations.push({
    actual: resultCode(isolatedProposal),
    expected: 'NOT_FOUND',
    label: 'editor proposes in viewer private portfolio',
  });

  for (const { id: proposalId, ctx } of Object.values(createdProposals)) {
    await capture(
      () => cancelTransactionProposal(ctx, sandboxId, proposalId),
      `cancel proposal ${proposalId}`,
    );
  }

  const auditEntries = await listAuditLog(ownerCtx, sandboxId);
  const hasAgentProposal = auditEntries.some(
    (entry) => entry.action === 'proposal.created' && entry.actorKind === 'AGENT',
  );
  const hasUserConfirmation = auditEntries.some(
    (entry) =>
      entry.action === 'proposal.confirmed' && entry.actorKind === 'USER',
  );
  expectations.push({
    actual: hasAgentProposal ? 'OK' : 'NOT_FOUND',
    expected: 'OK',
    label: 'audit contains AGENT proposal.created',
  });
  expectations.push({
    actual: hasUserConfirmation ? 'OK' : 'NOT_FOUND',
    expected: 'OK',
    label: 'audit contains USER proposal.confirmed',
  });

  console.log('\nSECTION D - last 10 audit entries');
  console.log(
    'Expect: the audit log contains an AGENT proposal.created and USER proposal.confirmed entry.',
  );
  console.table(
    auditEntries.slice(0, 10).map((entry) => ({
      time: entry.createdAt,
      actorName: entry.actorName,
      actorKind: entry.actorKind,
      action: entry.action,
    })),
  );

  let passed = 0;
  for (const expectation of expectations) {
    const ok = expectation.actual === expectation.expected;
    if (ok) passed += 1;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${expectation.label}: expected ${expectation.expected}, got ${expectation.actual}`,
    );
  }
  console.log(`${passed}/${expectations.length} expectations passed`);
  if (passed !== expectations.length) process.exitCode = 1;
};

main()
  .catch((error: unknown) => {
    console.error('Permission demo failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
