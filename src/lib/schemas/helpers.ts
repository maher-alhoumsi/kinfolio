import { z } from 'zod';

import { ValidationError } from '@/server/auth/errors';

export const parseInput = <TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> => {
  const result = schema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'input';
        
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    throw new ValidationError(message);
  }

  return result.data;
};
