import { type UIMessage } from 'ai';

import { cn } from '@/lib/utils';
import { toolLabels } from '@/components/assistant/assistant-constants';

type ToolPart = {
  type: string;
  state?: string;
  toolName?: string;
};

interface Props {
  messages: UIMessage[];
}

const isToolPart = (part: UIMessage['parts'][number]): boolean =>
  part.type === 'dynamic-tool' || part.type.startsWith('tool-');

const getToolPart = (part: UIMessage['parts'][number]): ToolPart =>
  part as ToolPart;

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

const AssistantMessage = ({ message }: { message: UIMessage }) => (
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

        return (
          <ToolStatus
            key={`${message.id}-${index}`}
            part={getToolPart(part)}
          />
        );
      })}
    </div>
  </div>
);

const AssistantMessageList = ({ messages }: Props) => (
  <>
    {messages.map((message) => (
      <AssistantMessage key={message.id} message={message} />
    ))}
  </>
);

export default AssistantMessageList;
