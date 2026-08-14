/**
 * Result type for port operations
 * Discriminated union for success/error cases
 */

export type Result<T, E> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: E }>;
