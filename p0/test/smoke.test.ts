/**
 * Smoke test for P0 skeleton
 *
 * This test validates the minimal executable base.
 * Uses node:test with native TypeScript execution.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { hello, version } from "../src/index.ts";

test("P0 skeleton - version export", () => {
  assert.strictEqual(version, "0.0.1");
});

test("P0 skeleton - hello function", () => {
  const result = hello();
  assert.strictEqual(result, "P0 skeleton initialized");
});
