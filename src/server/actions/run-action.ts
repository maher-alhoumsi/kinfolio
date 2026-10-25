'use server';

import { redirect } from 'next/navigation';

import {
  AppError,
  type ErrorCode,
  ValidationError,
} from '@/server/auth/errors';

export type ActionResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fields?: Record<string, string>;
    };

export async function runAction<T>(
  callback: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await callback() };
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'UNAUTHENTICATED') redirect('/sign-in');

      return {
        ok: false,
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && error.fields
          ? { fields: error.fields }
          : {}),
      };
    }

    throw error;
  }
}
