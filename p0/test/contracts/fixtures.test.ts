import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as validators from "../../src/contracts/validators.generated.js";
import { validateContract } from "../../src/contracts/validate.ts";

const dir = new URL("../fixtures/contracts/v1/", import.meta.url);

interface IndexEntry {
  fixture: string;
  contract: string;
  schema_id: string;
  scope: string;
}

interface MutationCase {
  case_id: string;
  base_fixture: string;
  operation: string;
  json_pointer: string;
  value?: unknown;
  expected_code: string;
}

const index = JSON.parse(fs.readFileSync(new URL("index.json", dir), "utf8")) as IndexEntry[];
const mutations = JSON.parse(fs.readFileSync(new URL("mutations.json", dir), "utf8")) as MutationCase[];
const contractMap = JSON.parse(
  fs.readFileSync(new URL("../../src/contracts/contract-map.generated.json", import.meta.url), "utf8")
) as { contractIdToValidatorName: Record<string, string>; contractIds: string[] };

type Validator = ((data: unknown) => boolean) & {
  errors?: Array<{ keyword: string; instancePath: string }>;
};

// Mapeamento explícito expected_code (matriz CT-X01..X14) -> keywords Ajv.
// Sem fallback permissivo: um expected_code desconhecido deve falhar alto.
// CT-X08 (data inexistente) é camada semantic e não é factível no schema layer.
const KEYWORDS_BY_CODE: Record<string, string[]> = {
  "invalid.required": ["required"], // CT-X02
  "invalid.unknown_field": ["additionalProperties"], // CT-X03
  "invalid.contract_version": ["const"], // CT-X04
  "invalid.type": ["type"], // CT-X05
  "invalid.range": ["minimum", "maximum"], // CT-X06
  "invalid.timestamp": ["pattern"], // CT-X07
  "invalid.id": ["pattern"], // CT-X09
  "invalid.id_type": ["pattern"], // CT-X10
};

function validatorFor(contract: string): Validator {
  const exportName = contractMap.contractIdToValidatorName[contract];
  assert.ok(exportName, `no validator declared for ${contract}`);
  const validator = validators[exportName as keyof typeof validators];
  assert.equal(typeof validator, "function", `missing validator export: ${exportName}`);
  return validator as Validator;
}

function mutate(base: unknown, operation: string, pointer: string, value: unknown): unknown {
  const result = structuredClone(base) as Record<string, unknown>;
  const parts = pointer
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  const key = parts.pop();
  assert.ok(key !== undefined);
  let target: Record<string, unknown> = result;
  for (const part of parts) target = target[part] as Record<string, unknown>;
  if (operation === "remove") delete target[key];
  else target[key] = value;
  return result;
}

test("all contract fixtures are valid", () => {
  const indexed = new Set(index.map((entry) => entry.contract));
  const catalog = new Set(contractMap.contractIds);
  assert.equal(index.length, contractMap.contractIds.length, "index must have exactly one fixture per instance contract");
  for (const id of catalog) {
    assert.ok(indexed.has(id), `missing fixture for ${id}`);
  }
  for (const entry of index) {
    assert.ok(catalog.has(entry.contract), `fixture ${entry.fixture} references unknown contract ${entry.contract}`);
    assert.equal(entry.scope, "shape_only", entry.fixture);
    assert.ok(entry.schema_id.endsWith(".schema.json"), entry.fixture);
    const data = JSON.parse(fs.readFileSync(new URL(entry.fixture, dir), "utf8"));
    assert.doesNotThrow(() => validateContract(entry.contract, data), entry.fixture);
  }
});

test("declared mutations fail with expected Ajv evidence", () => {
  const entries = new Map(index.map((entry) => [entry.fixture, entry]));
  for (const mutation of mutations) {
    const entry = entries.get(mutation.base_fixture);
    assert.ok(entry, `${mutation.case_id}: base fixture not in index`);
    const base = JSON.parse(fs.readFileSync(new URL(mutation.base_fixture, dir), "utf8"));
    const validator = validatorFor(entry.contract);
    assert.equal(
      validator(mutate(base, mutation.operation, mutation.json_pointer, mutation.value)),
      false,
      `${mutation.case_id}: mutated fixture unexpectedly validated`
    );
    const error = validator.errors?.[0];
    assert.ok(error, `${mutation.case_id}: expected a validation error`);
    const allowedKeywords = KEYWORDS_BY_CODE[mutation.expected_code];
    assert.ok(
      allowedKeywords,
      `${mutation.case_id}: expected_code "${mutation.expected_code}" has no keyword mapping`
    );
    assert.ok(
      allowedKeywords.includes(error.keyword),
      `${mutation.case_id}: expected keyword in [${allowedKeywords.join(", ")}] but got "${error.keyword}"`
    );
    // required/additionalProperties são reportados no objeto raiz; os demais, no caminho da mutação.
    const expectedPath =
      error.keyword === "required" || error.keyword === "additionalProperties" ? "" : mutation.json_pointer;
    assert.equal(error.instancePath, expectedPath, mutation.case_id);
  }
});
