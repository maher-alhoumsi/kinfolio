import 'server-only';

import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-5-5';

export const getModel = (): LanguageModel => {
  const provider = process.env.AI_PROVIDER || 'anthropic';
  const model =
    process.env.AI_MODEL ||
    (provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  if (provider === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'Missing ANTHROPIC_API_KEY environment variable for AI_PROVIDER=anthropic.',
      );
    }

    return createAnthropic()(model);
  }

  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'Missing OPENAI_API_KEY environment variable for AI_PROVIDER=openai.',
      );
    }

    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(model);
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${provider}". Expected "anthropic" or "openai".`,
  );
};
