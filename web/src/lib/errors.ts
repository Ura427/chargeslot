import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiErrorBody {
  code?: string;
  message?: string | string[];
}

export function isFetchBaseQueryError(
  error: unknown,
): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function getErrorBody(error: unknown): ApiErrorBody | undefined {
  if (
    isFetchBaseQueryError(error) &&
    typeof error.data === 'object' &&
    error.data
  ) {
    return error.data as ApiErrorBody;
  }
  return undefined;
}

export function getErrorCode(error: unknown): string | undefined {
  return getErrorBody(error)?.code;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const body = getErrorBody(error);
  const message = body?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && message.length > 0) return message.join(', ');
  return fallback;
}
