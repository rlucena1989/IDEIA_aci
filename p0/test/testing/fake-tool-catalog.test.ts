/**
 * Tests for FakeToolCatalog
 */

import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  FakeToolCatalog,
  type ToolEntry,
} from "../../src/testing/fake-tool-catalog.ts";

test("FakeToolCatalog - resolveExact with success", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  const result = fake.resolveExact("test-tool", "1.0.0");

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { name: "Test Tool" });
  }
});

test("FakeToolCatalog - resolveExact with not found", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  const result = fake.resolveExact("unknown-tool", "1.0.0");

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "tool.not_found");
  }
});

test("FakeToolCatalog - resolveExact with wrong version", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  const result = fake.resolveExact("test-tool", "2.0.0");

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "tool.not_found");
  }
});

test("FakeToolCatalog - listAllowed with success", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "tool-a", tool_version: "1.0.0", definition: { name: "Tool A" } },
    { tool_id: "tool-b", tool_version: "1.0.0", definition: { name: "Tool B" } },
  ];
  fake.setTools(tools);

  const allowed = [
    { tool_id: "tool-a", tool_version: "1.0.0" },
    { tool_id: "tool-b", tool_version: "1.0.0" },
  ];

  const result = fake.listAllowed(allowed);

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.strictEqual(result.value.length, 2);
    assert.deepStrictEqual(result.value[0], { name: "Tool A" });
    assert.deepStrictEqual(result.value[1], { name: "Tool B" });
  }
});

test("FakeToolCatalog - listAllowed preserves order", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "tool-a", tool_version: "1.0.0", definition: { name: "Tool A" } },
    { tool_id: "tool-b", tool_version: "1.0.0", definition: { name: "Tool B" } },
    { tool_id: "tool-c", tool_version: "1.0.0", definition: { name: "Tool C" } },
  ];
  fake.setTools(tools);

  const allowed = [
    { tool_id: "tool-c", tool_version: "1.0.0" },
    { tool_id: "tool-a", tool_version: "1.0.0" },
    { tool_id: "tool-b", tool_version: "1.0.0" },
  ];

  const result = fake.listAllowed(allowed);

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.strictEqual(result.value.length, 3);
    assert.deepStrictEqual(result.value[0], { name: "Tool C" });
    assert.deepStrictEqual(result.value[1], { name: "Tool A" });
    assert.deepStrictEqual(result.value[2], { name: "Tool B" });
  }
});

test("FakeToolCatalog - listAllowed with not found", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "tool-a", tool_version: "1.0.0", definition: { name: "Tool A" } },
  ];
  fake.setTools(tools);

  const allowed = [
    { tool_id: "tool-a", tool_version: "1.0.0" },
    { tool_id: "unknown-tool", tool_version: "1.0.0" },
  ];

  const result = fake.listAllowed(allowed);

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "tool.not_found");
  }
});

test("FakeToolCatalog - fingerprint returns configured value", () => {
  const fake = new FakeToolCatalog();
  fake.setCatalogFingerprint("test-fingerprint-123");

  const result = fake.fingerprint();

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.strictEqual(result.value, "test-fingerprint-123");
  }
});

test("FakeToolCatalog - fingerprint returns default", () => {
  const fake = new FakeToolCatalog();

  const result = fake.fingerprint();

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.strictEqual(result.value, "fake-fingerprint");
  }
});

test("FakeToolCatalog - records calls", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  fake.resolveExact("test-tool", "1.0.0");
  fake.fingerprint();

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[0].operation, "resolveExact");
  assert.strictEqual(calls[1].operation, "fingerprint");
});

test("FakeToolCatalog - calls have defensive copy of args", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  const allowed = [
    { tool_id: "tool-a", tool_version: "1.0.0", mutable: "value" },
  ];
  fake.listAllowed(allowed);

  // Modify original
  allowed[0].mutable = "changed";

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.strictEqual((calls[0] as { args: Array<{ mutable: string }> }).args[0].mutable, "value");
});

test("FakeToolCatalog - reset clears state", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  fake.resolveExact("test-tool", "1.0.0");

  assert.strictEqual(fake.getCalls().length, 1);

  fake.reset();

  assert.strictEqual(fake.getCalls().length, 0);
});

test("FakeToolCatalog - no network or filesystem access", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  // Should complete without any external calls
  const result = fake.resolveExact("test-tool", "1.0.0");

  assert.strictEqual(result.ok, true);
});

test("FakeToolCatalog - deterministic and pure", () => {
  const fake = new FakeToolCatalog();
  const tools: ToolEntry[] = [
    { tool_id: "test-tool", tool_version: "1.0.0", definition: { name: "Test Tool" } },
  ];
  fake.setTools(tools);

  const result1 = fake.resolveExact("test-tool", "1.0.0");
  const result2 = fake.resolveExact("test-tool", "1.0.0");

  assert.deepStrictEqual(result1, result2);
});
