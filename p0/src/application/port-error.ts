/**
 * Port error type for application ports
 * All port errors use this structure for consistent error handling
 */

export type PortError = Readonly<{
  code: string;
  retry: "never" | "safe" | "ambiguous" | "manual";
  redacted_message: string;
  cause_ref: string | null;
}>;

/**
 * Valid retry values
 */
export type RetryValue = "never" | "safe" | "ambiguous" | "manual";

/**
 * Valid error codes for P0 ports
 */
export type PortErrorCode =
  // General errors
  | "unknown"
  | "invalid_input"
  | "not_found"
  | "conflict"
  | "forbidden"
  | "timeout"
  | "aborted"
  // Provider errors
  | "provider.unavailable"
  | "provider.invalid_response"
  | "provider.timeout"
  | "provider.cancelled"
  // Tool errors
  | "tool.not_found"
  | "tool.invalid_version"
  | "tool.execution_failed"
  | "tool.timeout"
  | "tool.cancelled"
  // Policy errors
  | "policy.denied"
  | "policy.approval_required"
  | "policy.invalid_request"
  // Catalog errors
  | "catalog.transaction_failed"
  | "catalog.constraint_violation"
  | "catalog.not_found"
  // Artifact errors
  | "artifact.not_found"
  | "artifact.invalid_digest"
  | "artifact.quarantined"
  | "artifact.size_exceeded"
  // Governance errors
  | "governance.bundle_not_found"
  | "governance.bundle_expired"
  | "governance.bundle_divergent"
  // Budget errors
  | "budget.insufficient"
  | "budget.reservation_failed"
  // Verification errors
  | "verification.failed"
  | "verification.timeout"
  | "verification.evidence_missing";

/**
 * Known valid error codes
 */
const VALID_CODES: ReadonlySet<string> = new Set([
  "unknown",
  "invalid_input",
  "not_found",
  "conflict",
  "forbidden",
  "timeout",
  "aborted",
  "provider.unavailable",
  "provider.invalid_response",
  "provider.timeout",
  "provider.cancelled",
  "tool.not_found",
  "tool.invalid_version",
  "tool.execution_failed",
  "tool.timeout",
  "tool.cancelled",
  "policy.denied",
  "policy.approval_required",
  "policy.invalid_request",
  "catalog.transaction_failed",
  "catalog.constraint_violation",
  "catalog.not_found",
  "artifact.not_found",
  "artifact.invalid_digest",
  "artifact.quarantined",
  "artifact.size_exceeded",
  "governance.bundle_not_found",
  "governance.bundle_expired",
  "governance.bundle_divergent",
  "budget.insufficient",
  "budget.reservation_failed",
  "verification.failed",
  "verification.timeout",
  "verification.evidence_missing",
]);

/**
 * Known valid retry values
 */
const VALID_RETRY: ReadonlySet<string> = new Set([
  "never",
  "safe",
  "ambiguous",
  "manual",
]);

/**
 * Create a port error with validation
 * @throws Error if code or retry is invalid
 */
export function createPortError(
  code: string,
  retry: RetryValue,
  redacted_message: string,
  cause_ref: string | null = null
): PortError {
  if (!VALID_CODES.has(code)) {
    throw new Error(`Invalid port error code: ${code}`);
  }

  if (!VALID_RETRY.has(retry)) {
    throw new Error(`Invalid retry value: ${retry}`);
  }

  return {
    code,
    retry,
    redacted_message,
    cause_ref,
  };
}

/**
 * Check if a value is a valid PortError
 */
export function isPortError(value: unknown): value is PortError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const err = value as Record<string, unknown>;
  return (
    typeof err.code === "string" &&
    VALID_CODES.has(err.code) &&
    typeof err.retry === "string" &&
    VALID_RETRY.has(err.retry) &&
    typeof err.redacted_message === "string" &&
    (err.cause_ref === null || typeof err.cause_ref === "string")
  );
}
