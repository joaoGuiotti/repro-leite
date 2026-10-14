export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

export const err = <E = AppError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const appError = (code: string, message: string, details?: unknown): AppError => ({
  code,
  message,
  details,
});
