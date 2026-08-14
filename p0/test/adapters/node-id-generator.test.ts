/**
 * Tests for Node UUID v4 generator adapter
 *
 * Tests use node:test and node:assert/strict
 */

import assert from "node:assert/strict";
import test from "node:test";
import { NodeUuidV4Generator } from "../../src/adapters/node-id-generator.ts";
import type { UuidV4Generator } from "../../src/ports/id-generator.ts";

test("NodeUuidV4Generator - generates valid UUID v4", () => {
  const generator = new NodeUuidV4Generator();
  const uuid = generator.generate();

  assert.strictEqual(typeof uuid, "string");
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid));
});

test("NodeUuidV4Generator - generates different UUIDs", () => {
  const generator = new NodeUuidV4Generator();
  const uuid1 = generator.generate();
  const uuid2 = generator.generate();

  assert.notStrictEqual(uuid1, uuid2);
});

test("NodeUuidV4Generator - implements UuidV4Generator interface", () => {
  const generator: UuidV4Generator = new NodeUuidV4Generator();
  const uuid = generator.generate();

  assert.strictEqual(typeof uuid, "string");
  assert.ok(uuid.length === 36);
});
