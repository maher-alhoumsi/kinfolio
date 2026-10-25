import { z } from 'zod';
import {
  streamText,
  stepCountIs,
  type UIMessage,
  toUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
} from 'ai';

import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from '@/server/auth/errors';
import { getModel } from '@/server/agent/model';
import { buildTools } from '@/server/agent/tools';
import { requireUser } from '@/server/auth/session';
import { getPortfolio } from '@/server/services/portfolio';
import { buildSystemPrompt } from '@/server/agent/system-prompt';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_000_000;
const MAX_OUTPUT_TOKENS = 500;
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const requestTimestamps = new Map<string, number[]>();

const uiMessageSchema = z.custom<UIMessage>((value) => {
  if (typeof value !== 'object' || value === null) return false;

  const message = value as Record<string, unknown>;

  return (
    typeof message.id === 'string' &&
    ['user', 'assistant'].includes(String(message.role)) &&
    Array.isArray(message.parts)
  );
}, 'Invalid UI message');

const requestSchema = z.object({
  portfolioId: z.uuid(),
  messages: z.array(uiMessageSchema).min(1).max(50),
});

const jsonResponse = (body: object, status: number) =>
  Response.json(body, { status });

const readBodyWithLimit = async (
  request: Request,
): Promise<Uint8Array | null> => {
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
};

export async function POST(request: Request) {
  try {
    let ctx;

    try {
      ctx = await requireUser();
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        return jsonResponse({ error: error.code }, 401);
      }
      throw error;
    }

    const now = Date.now();
    const recentRequests = (requestTimestamps.get(ctx.userId) ?? []).filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    if (recentRequests.length >= RATE_LIMIT_REQUESTS) {
      requestTimestamps.set(ctx.userId, recentRequests);
      return jsonResponse({ error: 'RATE_LIMITED' }, 429);
    }

    recentRequests.push(now);
    requestTimestamps.set(ctx.userId, recentRequests);

    const contentLength = request.headers.get('content-length');

    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'PAYLOAD_TOO_LARGE' }, 413);
    }

    const bodyBytes = await readBodyWithLimit(request);

    if (bodyBytes === null) {
      return jsonResponse({ error: 'PAYLOAD_TOO_LARGE' }, 413);
    }

    let body: unknown;

    try {
      body = JSON.parse(new TextDecoder().decode(bodyBytes)) as unknown;
    } catch {
      return jsonResponse({ error: 'VALIDATION' }, 400);
    }

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse({ error: 'VALIDATION' }, 400);
    }

    let portfolio;
    const { portfolioId } = parsed.data;

    try {
      portfolio = await getPortfolio(ctx, portfolioId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return jsonResponse({ error: error.code }, 404);
      }
      if (error instanceof ForbiddenError) {
        return jsonResponse({ error: error.code }, 403);
      }
      throw error;
    }

    const tools = buildTools(ctx, portfolioId);

    const result = streamText({
      tools,
      model: getModel(),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      stopWhen: stepCountIs(5),
      system: buildSystemPrompt({ role: portfolio.role }),
      messages: await convertToModelMessages(parsed.data.messages.slice(-20), {
        tools,
      }),
      onError: (error) => {
        console.error('AI chat stream failed', error);
      },
    });

    const uiMessageStream = toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (error) => {
        console.error('AI chat stream failed', error);
        return 'The assistant could not complete the request.';
      },
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
  } catch (error) {
    if (error instanceof AppError) {
      console.error('AI chat request failed', error);
    } else {
      console.error('Unexpected AI chat request failure', error);
    }
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
