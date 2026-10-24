type ErrorWithCode = {
  code?: unknown;
  cause?: unknown;
};

const hasCode = (value: unknown): value is ErrorWithCode =>
  typeof value === 'object' && value !== null && 'code' in value;

export const isUniqueViolation = (error: unknown): boolean => {
  if (!hasCode(error)) return false;
  if (error.code === '23505') return true;

  return hasCode(error.cause) && error.cause.code === '23505';
};
