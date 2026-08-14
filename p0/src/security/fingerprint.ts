/**
 * Fingerprints (WP-04).
 *
 * fingerprint implements the jcs-sha256-v1 profile (ADR-004):
 *
 *   digest = "sha256:" + lowerhex(SHA-256(UTF8("IDEIA-P0|jcs-sha256-v1|" +
 *            purpose + "\n") || UTF8(JCS(value))))
 *
 * purpose must belong to the closed normative list; InvalidPurposeError is
 * thrown otherwise (including uppercase or separator injection). Hashing
 * uses the native Web Crypto API (no node:crypto import, keeping the
 * UUID-adapter crypto boundary intact).
 *
 * rawDigest is the separate raw-sha256-v1 profile for artifact bytes: SHA-256
 * of the exact bytes, without header and without JCS.
 */

import { assertCanonicalizable, canonicalizeJcs } from "./jcs.ts";

export const FINGERPRINT_PROFILE = "jcs-sha256-v1";
export const FINGERPRINT_HEADER_PREFIX = "IDEIA-P0|jcs-sha256-v1|";

/**
 * Closed list of normative purposes (ADR-004). Adding one requires an ADR or
 * normative addendum plus a vector.
 */
export const PURPOSES = [
  "manifest",
  "config",
  "provider-capabilities",
  "governance-candidate",
  "governance-bundle",
  "evaluation-report",
  "plan",
  "policy",
  "payload",
  "event",
  "context-query",
  "context-item",
  "context-package",
  "sandbox-profile",
  "capability-grant",
  "tool-request",
  "tool-result",
  "provider-request",
  "provider-result",
  "approval-request",
  "verification",
  "artifact-metadata",
  "recovery-report",
  "price-book",
  "budget-set",
  "budget-reservation",
  "budget-ledger",
  "schema",
] as const;

/** Purpose outside the closed normative list (code fingerprint.invalid_purpose). */
export class InvalidPurposeError extends Error {
  readonly code = "fingerprint.invalid_purpose";
  readonly purpose: string;

  constructor(purpose: string) {
    super("purpose inválido para o perfil jcs-sha256-v1");
    this.name = "InvalidPurposeError";
    this.purpose = purpose;
  }
}

function toLowerHex(bytes: ArrayBuffer): string {
  let out = "";
  for (const byte of new Uint8Array(bytes)) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * jcs-sha256-v1 fingerprint of a value for a normative purpose.
 */
export async function fingerprint(value: unknown, purpose: string): Promise<string> {
  if (!(PURPOSES as readonly string[]).includes(purpose)) {
    throw new InvalidPurposeError(purpose);
  }
  assertCanonicalizable(value);
  const header = `${FINGERPRINT_HEADER_PREFIX}${purpose}\n`;
  const canonical = canonicalizeJcs(value);
  const bytes = new TextEncoder().encode(header + canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${toLowerHex(digest)}`;
}

/**
 * raw-sha256-v1 digest of artifact bytes: SHA-256 of the exact bytes, no
 * header, no JCS.
 */
export async function rawDigest(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${toLowerHex(digest)}`;
}
