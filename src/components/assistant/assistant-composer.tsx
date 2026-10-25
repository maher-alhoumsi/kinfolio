import { type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';

interface Props {
  input: string;
  isStreaming: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop: () => void;
}

const AssistantComposer = ({
  input,
  isStreaming,
  onChange,
  onKeyDown,
  onSend,
  onStop,
}: Props) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
    <textarea
      aria-label="Message the assistant"
      className="min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      dir="auto"
      disabled={isStreaming}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Ask about your portfolio..."
      value={input}
    />
    {isStreaming ? (
      <Button type="button" variant="outline" onClick={onStop}>
        Stop
      </Button>
    ) : (
      <Button type="button" onClick={onSend} disabled={!input.trim()}>
        Send
      </Button>
    )}
  </div>
);

export default AssistantComposer;
