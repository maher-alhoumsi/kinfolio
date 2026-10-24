import { notFound, redirect } from 'next/navigation';

import { AppError } from './errors';

export async function withPageErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'NOT_FOUND') notFound();
      if (error.code === 'UNAUTHENTICATED') redirect('/sign-in');
    }

    throw error;
  }
}
