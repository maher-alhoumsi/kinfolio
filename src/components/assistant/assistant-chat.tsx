'use client';

import { useEffect, useRef, useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import AssistantError from '@/components/assistant/assistant-error';
import AssistantComposer from '@/components/assistant/assistant-composer';
import AssistantEmptyState from '@/components/assistant/assistant-empty-state';
import AssistantMessageList from '@/components/assistant/assistant-message-list';

interface Props {
  portfolioId: string;
  portfolioName: string;
}

const AssistantChat = ({ portfolioId, portfolioName }: Props) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [transport] = useState(
    () => new DefaultChatTransport({ body: { portfolioId } }),
  );

  const { messages, sendMessage, stop, regenerate, status, error } = useChat({
    transport,
  });

  const isStreaming = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? 'auto' : 'smooth',
    });
  }, [isStreaming, messages]);

  const send = (text: string) => {
    if (!text.trim() || isStreaming) return;
    void sendMessage({ text });
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  };

  const handleRetry = () => {
    regenerate();
  };

  const handleSend = () => {
    send(input);
  };

  return (
    <section className="flex min-h-[calc(100vh-14rem)] flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about {portfolioName}.
        </p>
      </div>

      <div
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 sm:p-5"
      >
        {messages.length === 0 && (
          <AssistantEmptyState onSuggestion={send} disabled={isStreaming} />
        )}

        {messages.length > 0 && (
          <AssistantMessageList
            messages={messages}
            portfolioId={portfolioId}
          />
        )}

        {status === 'submitted' && (
          <p className="text-sm text-muted-foreground" dir="auto">
            Thinking...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <AssistantError onRetry={handleRetry} />}

      <AssistantComposer
        input={input}
        onStop={stop}
        onChange={setInput}
        onSend={handleSend}
        isStreaming={isStreaming}
        onKeyDown={handleKeyDown}
      />
    </section>
  );
};

export default AssistantChat;
