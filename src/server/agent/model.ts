import 'server-only';

import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const DEFAULT_AI_MODEL = 'gpt-4o-mini';

export const getModel = (): LanguageModel => {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai(process.env.AI_MODEL ?? DEFAULT_AI_MODEL);
};
