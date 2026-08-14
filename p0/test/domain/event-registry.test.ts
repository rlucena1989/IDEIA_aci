/**
 * Tests for the static v1 event registry (WP-08).
 *
 * The registry must mirror docs/implementation/contracts/event-registry-v1.json
 * (1.0.0-rc.7) exactly: all 33 entries, same order, same flags and
 * payload_constraints. The normative file is loaded as the source of truth.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EVENT_REGISTRY_V1,
  getRegistryEntry,
  UnknownEventTypeError,
} from "../../src/domain/event-registry.ts";

interface NormativeEntry {
  event_type: string;
  payload_contract: string;
  schema_id: string;
  affects_task_state: boolean;
  payload_constraints?: Record<string, string[]>;
}

interface NormativeRegistry {
  registry_version: string;
  events: NormativeEntry[];
}

const normative = JSON.parse(
  readFileSync(new URL("../../../docs/implementation/contracts/event-registry-v1.json", import.meta.url), "utf8")
) as NormativeRegistry;

test("registry - versão rc.7 e 33 eventos", () => {
  assert.equal(normative.registry_version, "1.0.0-rc.7");
  assert.equal(EVENT_REGISTRY_V1.length, 33);
  assert.equal(normative.events.length, 33);
});

test("registry - espelha o JSON normativo exatamente (ordem e campos)", () => {
  assert.equal(EVENT_REGISTRY_V1.length, normative.events.length);
  for (let i = 0; i < normative.events.length; i++) {
    const norm = normative.events[i];
    const local = EVENT_REGISTRY_V1[i];
    assert.equal(local.event_type, norm.event_type, `índice ${i}: event_type`);
    assert.equal(local.payload_contract, norm.payload_contract, `índice ${i}: payload_contract`);
    assert.equal(local.schema_id, norm.schema_id, `índice ${i}: schema_id`);
    assert.equal(local.affects_task_state, norm.affects_task_state, `índice ${i}: affects_task_state`);
    assert.deepEqual(
      local.payload_constraints ?? undefined,
      norm.payload_constraints,
      `índice ${i}: payload_constraints`
    );
  }
});

test("registry - exatamente task.created e task.transitioned alteram o estado", () => {
  const mutating = EVENT_REGISTRY_V1.filter((entry) => entry.affects_task_state).map((entry) => entry.event_type);
  assert.deepEqual(mutating, ["task.created", "task.transitioned"]);
});

test("registry - payload_constraints só onde o normativo declara", () => {
  const withConstraints = EVENT_REGISTRY_V1.filter((entry) => entry.payload_constraints !== undefined)
    .map((entry) => entry.event_type);
  assert.deepEqual(withConstraints, ["provider.completed", "provider.failed", "artifact.published"]);
  assert.deepEqual(getRegistryEntry("provider.completed").payload_constraints, {
    execution_status: ["completed"],
  });
  assert.deepEqual(getRegistryEntry("provider.failed").payload_constraints, {
    execution_status: ["failed", "cancelled", "timed_out", "ambiguous"],
  });
  assert.deepEqual(getRegistryEntry("artifact.published").payload_constraints, {
    lifecycle: ["committed"],
  });
});

test("registry - lookup resolve os 33 e lança para tipo desconhecido", () => {
  for (const entry of EVENT_REGISTRY_V1) {
    const resolved = getRegistryEntry(entry.event_type);
    assert.equal(resolved, entry);
  }
  assert.throws(
    () => getRegistryEntry("model.called"),
    (err: Error) => err instanceof UnknownEventTypeError && err.code === "event.unknown"
  );
  assert.throws(
    () => getRegistryEntry(""),
    (err: Error) => err instanceof UnknownEventTypeError && err.code === "event.unknown"
  );
});
