/**
 * Teste do catálogo semântico/transacional (WP-09B).
 *
 * Garante: estrutura completa de cada case, IDs da matriz sem lacunas nem
 * renomeações, casos executáveis passando seus oráculos, bloqueados com
 * blocked_by explícito (nunca skip genérico) e rejeição de case/enum
 * desconhecidos pelo runner.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  LAYERS,
  ORACLE_STRATEGIES,
  loadCaseCatalog,
  validateCatalog,
  getCase,
  runCase,
} from "./run-semantic-case.ts";

const catalog = loadCaseCatalog();

// Famílias da matriz (matriz_testes_contrato_v1.md): prefixo, início, fim.
const FAMILY_RANGES: Array<[string, number, number]> = [
  ["CT-X", 1, 14],
  ["CT-M", 1, 17],
  ["CT-P", 1, 12],
  ["CT-A", 1, 16],
  ["CT-CTX", 1, 12],
  ["CT-PR", 1, 12],
  ["CT-PL", 1, 4],
  ["CT-E", 1, 21],
  ["CT-AR", 1, 12],
  ["CT-RC", 1, 13],
  ["CT-U", 1, 20],
  ["CT-SB", 1, 12],
  ["CT-GV", 1, 8],
  ["CT-EV", 1, 7],
  ["CT-MP", 1, 4],
  ["CT-C", 1, 6],
  ["JCS-R", 1, 21],
];

// Vetores de canonicalização com sufixo não numérico (canonicalization/vectors.json).
const EXTRA_IDS = [
  "JCS-P0-001",
  "JCS-P0-002",
  "JCS-P0-003",
  "JCS-P0-004",
  "JCS-P0-005A",
  "JCS-P0-005B",
  "JCS-P0-006",
];

const expectedIds = new Set([
  ...FAMILY_RANGES.flatMap(([prefix, start, end]) =>
    Array.from({ length: end - start + 1 }, (_, i) => `${prefix}${String(start + i).padStart(2, "0")}`)
  ),
  ...EXTRA_IDS,
]);

test("catalog - estrutura: campos, unicidade e enums", () => {
  const ids = catalog.map((c) => c.case_id);
  assert.equal(new Set(ids).size, ids.length, "case_id duplicado");
  for (const c of catalog) {
    assert.ok(c.case_id.length > 0);
    assert.ok((LAYERS as readonly string[]).includes(c.layer), `${c.case_id}: camada desconhecida`);
    assert.ok(c.requirement.length > 0, `${c.case_id}: sem requirement`);
    assert.ok(typeof c.preconditions === "string");
    assert.ok(typeof c.mutation === "string");
    assert.ok(c.expected_code.length > 0, `${c.case_id}: sem expected_code`);
    assert.ok((ORACLE_STRATEGIES as readonly string[]).includes(c.oracle.strategy), `${c.case_id}: estratégia desconhecida`);
    if (c.oracle.strategy === "blocked") {
      assert.ok(typeof c.blocked_by === "string" && c.blocked_by.length > 0, `${c.case_id}: bloqueado sem blocked_by`);
      assert.ok(!/^(skipped|skip|pass|todo)$/i.test(c.blocked_by.trim()), `${c.case_id}: blocked_by genérico`);
    } else {
      assert.equal(c.blocked_by, null, `${c.case_id}: executável não pode ter blocked_by`);
    }
  }
});

test("catalog - IDs da matriz completos, sem lacuna nem renomeação", () => {
  const ids = new Set(catalog.map((c) => c.case_id));
  for (const id of expectedIds) {
    assert.ok(ids.has(id), `ID ausente: ${id}`);
  }
  for (const id of ids) {
    assert.ok(expectedIds.has(id), `ID fora da matriz: ${id}`);
  }
});

test("catalog - higiene: sem secret, path de operador ou rede", () => {
  const raw = JSON.stringify(catalog);
  const forbidden = [
    /password/i,
    /api[_-]?key/i,
    /bearer /i,
    /C:\\\\/,
    /\/Users\//,
    /\/home\//,
    /https?:\/\//,
  ];
  for (const pattern of forbidden) {
    assert.ok(!pattern.test(raw), `conteúdo proibido detectado: ${pattern}`);
  }
});

test("catalog - casos executáveis passam seus oráculos", async () => {
  const executable = catalog.filter((c) => c.oracle.strategy !== "blocked");
  assert.ok(executable.length >= 10, `esperado >= 10 executáveis, obtido ${executable.length}`);
  for (const c of executable) {
    const verdict = await runCase(c);
    assert.equal(verdict.status, "pass", `${c.case_id}: ${verdict.detail ?? "sem detalhe"}`);
  }
});

test("catalog - casos bloqueados reportam blocked_by explícito", async () => {
  const blocked = catalog.filter((c) => c.oracle.strategy === "blocked");
  assert.ok(blocked.length > 150, `esperado corpus majoritariamente bloqueado, obtido ${blocked.length}`);
  for (const c of blocked) {
    const verdict = await runCase(c);
    assert.equal(verdict.status, "blocked", c.case_id);
    assert.ok(typeof c.blocked_by === "string" && c.blocked_by.length > 0, c.case_id);
  }
});

test("runner - rejeita case desconhecido", () => {
  assert.throws(() => getCase(catalog, "CT-ZZZ99"), /unknown case/);
});

test("runner - rejeita camada e estratégia desconhecidas", async () => {
  const base = {
    case_id: "CT-BOGUS",
    requirement: "x",
    preconditions: "x",
    mutation: "x",
    expected_code: "x",
    blocked_by: "WP-test",
  };
  assert.throws(
    () => validateCatalog({ cases: [{ ...base, layer: "not-a-layer", oracle: { strategy: "blocked" } }] }),
    /camada desconhecida/
  );
  assert.throws(
    () => validateCatalog({ cases: [{ ...base, layer: "schema", oracle: { strategy: "not-a-strategy" }, blocked_by: null }] }),
    /estratégia desconhecida/
  );
  // estrutura válida com oracle incompleto passa no validateCatalog e falha no runCase
  const incomplete = validateCatalog({
    cases: [{ ...base, layer: "schema", oracle: { strategy: "schema:validator" }, blocked_by: null }],
  });
  await assert.rejects(() => runCase(incomplete[0]), /sem base_fixture/);
});
