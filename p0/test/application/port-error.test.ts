/**
 * Tests for PortError type and helper functions
 */

import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  createPortError,
  isPortError,
  type PortError,
} from "../../src/application/port-error.ts";

test("createPortError - creates valid error with all fields", () => {
  const error = createPortError(
    "unknown",
    "never",
    "Something went wrong",
    "ref-123"
  );

  assert.strictEqual(error.code, "unknown");
  assert.strictEqual(error.retry, "never");
  assert.strictEqual(error.redacted_message, "Something went wrong");
  assert.strictEqual(error.cause_ref, "ref-123");
});

test("createPortError - creates valid error with null cause_ref", () => {
  const error = createPortError(
    "invalid_input",
    "safe",
    "Invalid input provided"
  );

  assert.strictEqual(error.code, "invalid_input");
  assert.strictEqual(error.retry, "safe");
  assert.strictEqual(error.redacted_message, "Invalid input provided");
  assert.strictEqual(error.cause_ref, null);
});

test("createPortError - throws on invalid code", () => {
  assert.throws(
    () => createPortError("invalid_code", "never", "message"),
    (err: Error) => err.message.includes("Invalid port error code")
  );
});

test("createPortError - throws on invalid retry", () => {
  assert.throws(
    () => createPortError("unknown", "invalid_retry" as never, "message"),
    (err: Error) => err.message.includes("Invalid retry value")
  );
});

test("isPortError - returns true for valid PortError", () => {
  const error: PortError = {
    code: "unknown",
    retry: "never",
    redacted_message: "message",
    cause_ref: null,
  };

  assert.strictEqual(isPortError(error), true);
});

test("isPortError - returns false for non-object", () => {
  assert.strictEqual(isPortError(null), false);
  assert.strictEqual(isPortError(undefined), false);
  assert.strictEqual(isPortError("string"), false);
  assert.strictEqual(isPortError(123), false);
});

test("isPortError - returns false for object missing fields", () => {
  assert.strictEqual(isPortError({}), false);
  assert.strictEqual(isPortError({ code: "unknown" }), false);
  assert.strictEqual(
    isPortError({
      code: "unknown",
      retry: "never",
      redacted_message: "message",
    }),
    false
  );
});

test("isPortError - returns false for invalid code", () => {
  assert.strictEqual(
    isPortError({
      code: "invalid_code",
      retry: "never",
      redacted_message: "message",
      cause_ref: null,
    }),
    false
  );
});

test("isPortError - returns false for invalid retry", () => {
  assert.strictEqual(
    isPortError({
      code: "unknown",
      retry: "invalid_retry",
      redacted_message: "message",
      cause_ref: null,
    }),
    false
  );
});

test("isPortError - returns false for invalid redacted_message type", () => {
  assert.strictEqual(
    isPortError({
      code: "unknown",
      retry: "never",
      redacted_message: 123,
      cause_ref: null,
    }),
    false
  );
});

test("isPortError - returns false for invalid cause_ref type", () => {
  assert.strictEqual(
    isPortError({
      code: "unknown",
      retry: "never",
      redacted_message: "message",
      cause_ref: 123,
    }),
    false
  );
});

test("isPortError - accepts valid cause_ref string", () => {
  assert.strictEqual(
    isPortError({
      code: "unknown",
      retry: "never",
      redacted_message: "message",
      cause_ref: "ref-123",
    }),
    true
  );
});

test("isPortError - accepts all valid retry values", () => {
  const validRetries: Array<"never" | "safe" | "ambiguous" | "manual"> = [
    "never",
    "safe",
    "ambiguous",
    "manual",
  ];

  for (const retry of validRetries) {
    assert.strictEqual(
      isPortError({
        code: "unknown",
        retry,
        redacted_message: "message",
        cause_ref: null,
      }),
      true,
      `Failed for retry: ${retry}`
    );
  }
});

test("isPortError - accepts sample of valid codes", () => {
  const sampleCodes = [
    "unknown",
    "provider.unavailable",
    "tool.not_found",
    "policy.denied",
    "catalog.transaction_failed",
    "artifact.not_found",
    "governance.bundle_not_found",
    "budget.insufficient",
    "verification.failed",
  ];

  for (const code of sampleCodes) {
    assert.strictEqual(
      isPortError({
        code,
        retry: "never",
        redacted_message: "message",
        cause_ref: null,
      }),
      true,
      `Failed for code: ${code}`
    );
  }
});
