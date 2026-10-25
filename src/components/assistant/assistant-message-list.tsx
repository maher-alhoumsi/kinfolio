import { type UIMessage } from 'ai';

import { cn } from '@/lib/utils';
import ProposalCard, {
  type TransactionProposalSummary,
} from '@/components/assistant/proposal-card';
import { toolLabels } from '@/components/assistant/assistant-constants';

type ToolPart = {
  type: string;
  state?: string;
  toolName?: string;
  output?: unknown;
};

interface Props {
  portfolioId: string;
  messages: UIMessage[];
}

const isToolPart = (part: UIMessage['parts'][number]): boolean =>
  part.type === 'dynamic-tool' || part.type.startsWith('tool-');

const getToolPart = (part: UIMessage['parts'][number]): ToolPart =>
  part as ToolPart;

type ProposalOutput = {
  proposalId: string;
  expiresAt: string;
  summary: TransactionProposalSummary;
};

const isProposalOutput = (output: unknown): output is ProposalOutput => {
  if (typeof output !== 'object' || output === null) return false;

  const value = output as Record<string, unknown>;
  const summary =
    typeof value.summary === 'object' && value.summary !== null
      ? (value.summary as Record<string, unknown>)
      : undefined;

  return (
    typeof value.proposalId === 'string' &&
    typeof value.expiresAt === 'string' &&
    summary !== undefined &&
    typeof summary.assetName === 'string' &&
    (typeof summary.assetSymbol === 'string' || summary.assetSymbol === null) &&
    typeof summary.kind === 'string' &&
    typeof summary.quantity === 'string' &&
    typeof summary.occurredAt === 'string'
  );
};

const hasToolError = (output: unknown): output is { error: string } =>
  typeof output === 'object' &&
  output !== null &&
  typeof (output as Record<string, unknown>).error === 'string';

const ToolStatus = ({ part }: { part: ToolPart }) => {
  const toolName = part.toolName ?? part.type.replace(/^tool-/, '');
  const failed = part.state === 'output-error';
  const complete = part.state === 'output-available';

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-1 text-xs',
        failed
          ? 'border-destructive/30 text-destructive'
          : 'border-border text-muted-foreground',
      )}
    >
      {failed
        ? 'Unable to read portfolio data'
        : complete
          ? 'Done'
          : (toolLabels[toolName] ?? 'Reading portfolio data...')}
    </span>
  );
};

const AssistantMessage = ({
  message,
  portfolioId,
}: {
  message: UIMessage;
  portfolioId: string;
}) => (
  <div
    className={cn(
      'flex',
      message.role === 'user' ? 'justify-end' : 'justify-start',
    )}
  >
    <div
      className={cn(
        'max-w-[90%] space-y-2 rounded-xl px-3 py-2 text-sm sm:max-w-[75%]',
        message.role === 'user'
          ? 'bg-primary text-primary-foreground'
          : 'bg-background text-foreground shadow-sm',
      )}
    >
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <p
              className="whitespace-pre-wrap"
              dir="auto"
              key={`${message.id}-${index}`}
            >
              {part.text}
            </p>
          );
        }

        if (!isToolPart(part)) return null;

        const toolPart = getToolPart(part);
        const toolName =
          toolPart.toolName ?? toolPart.type.replace(/^tool-/, '');

        if (
          toolName === 'proposeTransaction' &&
          toolPart.state === 'output-available'
        ) {
          if (hasToolError(toolPart.output)) {
            return (
              <span
                className="inline-flex rounded-full border border-destructive/30 px-2 py-1 text-xs text-destructive"
                key={`${message.id}-${index}`}
              >
                Unable to create proposal
              </span>
            );
          }

          if (isProposalOutput(toolPart.output)) {
            return (
              <ProposalCard
                key={`${message.id}-${index}`}
                portfolioId={portfolioId}
                proposal={toolPart.output.summary}
                proposalId={toolPart.output.proposalId}
                expiresAt={toolPart.output.expiresAt}
              />
            );
          }
        }

        return <ToolStatus key={`${message.id}-${index}`} part={toolPart} />;
      })}
    </div>
  </div>
);

const AssistantMessageList = ({ messages, portfolioId }: Props) => (
  <>
    {messages.map((message) => (
      <AssistantMessage
        key={message.id}
        message={message}
        portfolioId={portfolioId}
      />
    ))}
  </>
);

export default AssistantMessageList;
