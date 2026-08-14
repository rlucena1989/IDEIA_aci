/**
 * Runner do catálogo semântico/transacional (WP-09B).
 *
 * Lê p0/test/fixtures/semantic/cases.json como fonte imutável, valida a
 * estrutura e os enums (camada e estratégia de oráculo) e executa o oráculo
 * de cada case. O oráculo nunca é alterado pelo runner. Case/estratégia
 * desconhecidos são rejeitados com erro.
 *
 * Uso direto (CLI):
 *   node test/semantic/run-semantic-case.ts CT-U06
 */

import { readFileSync } from "node:fs";
import * as validators from "../../src/contracts/validators.generated.js";
import { computeBudget } from "../../src/domain/budget.ts";
import { validateTransition, InvalidTransitionError } from "../../src/domain/task-transition.ts";
import { project } from "../../src/domain/task-projection.ts";
import type { EventEnvelopeV1 } from "../../src/domain/task-projection.ts";
import type { TaskState } from "../../src/domain/task-state.ts";
import { parseStrictJson } from "../../src/security/strict-json.ts";
import { assertCanonicalizable, canonicalizeJcs } from "../../src/security/jcs.ts";
import { fingerprint, rawDigest } from "../../src/security/fingerprint.ts";

export const LAYERS = [
  "schema",
  "semantic",
  "transaction",
  "canonicalization",
  "architecture",
  "pre-parse",
] as const;
export type Layer = (typeof LAYERS)[number];

export const ORACLE_STRATEGIES = [
  "schema:validator",
  "budget:computeBudget",
  "transition:validateTransition",
  "policy:source-scan",
  "projection:reducer",
  "jcs:vector",
  "jcs:reject",
  "jcs:property",
  "blocked",
] as const;
export type OracleStrategy = (typeof ORACLE_STRATEGIES)[number];

/** Propriedades canônicas cobertas pelas estratégias jcs:* (CT-C01..C06). */
export const JCS_PROPERTIES = [
  "reorder-properties-same",
  "reorder-array-diff",
  "purpose-diff",
  "material-change-diff",
  "nfc-nfd-diff",
  "raw-digest-raw",
] as const;
export type JcsProperty = (typeof JCS_PROPERTIES)[number];

const CASES_URL = new URL("../fixtures/semantic/cases.json", import.meta.url);
const FIXTURES_DIR = new URL("../fixtures/contracts/v1/", import.meta.url);
const CONTRACT_MAP_URL = new URL("../../src/contracts/contract-map.generated.json", import.meta.url);
const VECTORS_URL = new URL("../../../docs/implementation/contracts/canonicalization/vectors.json", import.meta.url);
const REJECTIONS_URL = new URL("../../../docs/implementation/contracts/canonicalization/rejections.json", import.meta.url);

/** Limites locais de oráculo (configuração do perfil; OD-DP-08 permanece autoritativo). */
const JCS_LIMITS = { maxBytes: 1 << 20, maxDepth: 128, maxMembers: 4096, maxStringLength: 1 << 20 };

interface ContractMap {
  contractIdToValidatorName: Record<string, string>;
}

const contractMap = JSON.parse(readFileSync(CONTRACT_MAP_URL, "utf8")) as ContractMap;

type Validator = ((data: unknown) => boolean) & {
  errors?: Array<{ keyword: string; instancePath: string; message?: string }>;
};

export interface OracleArgs {
  strategy: OracleStrategy;
  // schema:validator
  base_fixture?: string;
  operation?: "remove" | "add" | "replace";
  json_pointer?: string;
  value?: unknown;
  keyword?: string;
  expect?: "valid";
  // budget:computeBudget
  hardLimit?: number;
  confirmed?: number;
  reserved?: number;
  possibleOverage?: number;
  expected_decision?: string;
  // transition:validateTransition
  from?: string;
  to?: string;
  error_code?: string;
  // policy:source-scan
  target?: string;
  require_absent?: string[];
  require_present?: string[];
  // projection:reducer
  events?: ReducerEventSpec[];
  expect_result?: "accept" | "reject";
  expect_error_code?: string;
  expect_state?: string;
  // jcs:vector
  vector_id?: string;
  // jcs:reject
  reject_id?: string;
  // jcs:property
  property?: string;
}

/**
 * DSL compacto de eventos para o oráculo projection:reducer.
 * `previous`: "null" (padrão), "last" (digest do evento anterior) ou
 * "wrong" (digest divergente). `event_id`/`task_id`/`causation_event_id`
 * são opcionais com defaults determinísticos.
 */
export interface ReducerEventSpec {
  event_type: string;
  sequence: number;
  payload_contract: string;
  payload?: unknown;
  previous?: "null" | "last" | "wrong" | string;
  event_id?: string;
  task_id?: string;
  causation_event_id?: string | null;
}

export interface SemanticCase {
  case_id: string;
  layer: Layer;
  requirement: string;
  preconditions: string;
  mutation: string;
  expected_code: string;
  oracle: OracleArgs;
  blocked_by: string | null;
}

export interface Verdict {
  case_id: string;
  status: "pass" | "fail" | "blocked";
  expected_code: string;
  blocked_by: string | null;
  detail?: string;
}

/**
 * Valida a estrutura e os enums do catálogo. Rejeita case_id duplicado,
 * camada/estratégia desconhecidas, executável com blocked_by ou bloqueado
 * sem blocked_by explícito. Nunca muta a entrada.
 */
export function validateCatalog(raw: unknown): SemanticCase[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { cases?: unknown }).cases)) {
    throw new Error("catalog: cases deve ser um array");
  }
  const cases = (raw as { cases: unknown[] }).cases as unknown[];
  const seen = new Set<string>();
  const result: SemanticCase[] = [];
  for (const item of cases) {
    if (!item || typeof item !== "object") throw new Error("catalog: case não é objeto");
    const c = item as Partial<SemanticCase>;
    if (typeof c.case_id !== "string" || c.case_id.length === 0) {
      throw new Error("catalog: case sem case_id");
    }
    if (seen.has(c.case_id)) throw new Error(`catalog: case_id duplicado "${c.case_id}"`);
    seen.add(c.case_id);
    if (!(LAYERS as readonly string[]).includes(c.layer as string)) {
      throw new Error(`catalog: ${c.case_id} camada desconhecida "${String(c.layer)}"`);
    }
    if (typeof c.requirement !== "string" || c.requirement.length === 0) {
      throw new Error(`catalog: ${c.case_id} sem requirement`);
    }
    if (typeof c.preconditions !== "string") throw new Error(`catalog: ${c.case_id} sem preconditions`);
    if (typeof c.mutation !== "string") throw new Error(`catalog: ${c.case_id} sem mutation`);
    if (typeof c.expected_code !== "string" || c.expected_code.length === 0) {
      throw new Error(`catalog: ${c.case_id} sem expected_code`);
    }
    if (!c.oracle || typeof c.oracle !== "object" || typeof c.oracle.strategy !== "string") {
      throw new Error(`catalog: ${c.case_id} sem oracle`);
    }
    if (!(ORACLE_STRATEGIES as readonly string[]).includes(c.oracle.strategy)) {
      throw new Error(`catalog: ${c.case_id} estratégia desconhecida "${c.oracle.strategy}"`);
    }
    if (c.oracle.strategy === "jcs:vector" && typeof c.oracle.vector_id !== "string") {
      throw new Error(`catalog: ${c.case_id} oracle jcs:vector sem vector_id`);
    }
    if (c.oracle.strategy === "jcs:reject" && typeof c.oracle.reject_id !== "string") {
      throw new Error(`catalog: ${c.case_id} oracle jcs:reject sem reject_id`);
    }
    if (c.oracle.strategy === "jcs:property" && !(JCS_PROPERTIES as readonly string[]).includes(c.oracle.property as string)) {
      throw new Error(`catalog: ${c.case_id} propriedade jcs desconhecida "${String(c.oracle.property)}"`);
    }
    if (c.oracle.strategy === "blocked") {
      if (typeof c.blocked_by !== "string" || c.blocked_by.length === 0) {
        throw new Error(`catalog: ${c.case_id} bloqueado sem blocked_by explícito`);
      }
    } else if (c.blocked_by !== null) {
      throw new Error(`catalog: ${c.case_id} executável não pode ter blocked_by`);
    }
    result.push(c as SemanticCase);
  }
  return result;
}

export function loadCaseCatalog(): SemanticCase[] {
  const raw = JSON.parse(readFileSync(CASES_URL, "utf8"));
  return validateCatalog(raw);
}

export function getCase(catalog: SemanticCase[], caseId: string): SemanticCase {
  const found = catalog.find((c) => c.case_id === caseId);
  if (!found) throw new Error(`unknown case: ${caseId}`);
  return found;
}

function validatorFor(data: unknown): Validator {
  const contract = (data as { contract?: unknown }).contract;
  if (typeof contract !== "string") throw new Error("fixture sem campo contract string");
  const exportName = contractMap.contractIdToValidatorName[contract];
  if (!exportName) throw new Error(`sem validator declarado para ${contract}`);
  const v = (validators as unknown as Record<string, unknown>)[exportName];
  if (typeof v !== "function") throw new Error(`validator ${exportName} não exportado`);
  return v as Validator;
}

function mutate(base: unknown, operation: string | undefined, pointer: string | undefined, value: unknown): unknown {
  if (!operation || !pointer) throw new Error("mutação sem operation/json_pointer");
  const result = structuredClone(base) as Record<string, unknown>;
  const parts = pointer
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  const key = parts.pop();
  if (key === undefined) throw new Error(`json_pointer inválido: ${pointer}`);
  let target: Record<string, unknown> = result;
  for (const part of parts) target = target[part] as Record<string, unknown>;
  if (operation === "remove") delete target[key];
  else target[key] = value;
  return result;
}

function runSchemaValidator(c: SemanticCase): Verdict {
  const a = c.oracle;
  if (!a.base_fixture) throw new Error(`${c.case_id}: oracle sem base_fixture`);
  const data = JSON.parse(readFileSync(new URL(a.base_fixture, FIXTURES_DIR), "utf8"));
  const validator = validatorFor(data);
  if (a.expect === "valid") {
    if (!validator(data)) {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `fixture inválida: ${JSON.stringify(validator.errors?.[0] ?? null)}` };
    }
    return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: "fixture schema-valid" };
  }
  const mutated = mutate(data, a.operation, a.json_pointer, a.value);
  if (validator(mutated)) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: "mutação validou inesperadamente" };
  }
  const error = validator.errors?.[0];
  if (!error) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: "validator falhou sem erro" };
  }
  if (a.keyword && error.keyword !== a.keyword) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `keyword esperada "${a.keyword}", observada "${error.keyword}"` };
  }
  return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `keyword=${error.keyword} path=${error.instancePath}` };
}

function runBudget(c: SemanticCase): Verdict {
  const a = c.oracle;
  const { hardLimit, confirmed, reserved, possibleOverage, expected_decision } = a;
  if (hardLimit === undefined || confirmed === undefined || reserved === undefined || possibleOverage === undefined || expected_decision === undefined) {
    throw new Error(`${c.case_id}: oracle budget incompleto`);
  }
  const state = computeBudget(hardLimit, confirmed, reserved, possibleOverage);
  if (state.decision !== expected_decision) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `decisão esperada "${expected_decision}", observada "${state.decision}"` };
  }
  return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `decision=${state.decision} accounted=${state.accounted} remaining=${state.remaining} overage=${state.possibleOverage}` };
}

function runTransition(c: SemanticCase): Verdict {
  const { from, to, error_code } = c.oracle;
  if (!from || !to || !error_code) throw new Error(`${c.case_id}: oracle transition incompleto`);
  try {
    validateTransition(from as TaskState, to as TaskState);
  } catch (err) {
    if (err instanceof InvalidTransitionError && err.code === error_code) {
      return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `rejeitado ${from} -> ${to} (${err.code})` };
    }
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `erro inesperado: ${(err as Error).message}` };
  }
  return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `transição ${from} -> ${to} aceita inesperadamente` };
}

function buildEnvelope(spec: ReducerEventSpec, index: number, previousDigest: string | null): EventEnvelopeV1 {
  const digest = `sha256:${(index + 1).toString(16).padStart(64, "0")}`;
  let previous: string | null;
  if (spec.previous === undefined || spec.previous === "null") previous = null;
  else if (spec.previous === "last") previous = previousDigest;
  else if (spec.previous === "wrong") previous = `sha256:${(999).toString(16).padStart(64, "0")}`;
  else previous = spec.previous;
  return {
    contract: "ideia.event-envelope/1",
    domain: "IDEIA-P0",
    event_id: spec.event_id ?? `evt_${index + 1}`,
    task_id: spec.task_id ?? "tsk_11111111-1111-4111-8111-111111111111",
    sequence: spec.sequence,
    occurred_at: "2024-01-01T00:00:00.000Z",
    recorded_at: "2024-01-01T00:00:00.000Z",
    principal_id: "prn_11111111-1111-4111-8111-111111111111",
    project_id: "prj_11111111-1111-4111-8111-111111111111",
    step_id: null,
    event_type: spec.event_type,
    correlation_id: "cor_11111111-1111-4111-8111-111111111111",
    causation_event_id: spec.causation_event_id ?? null,
    payload_contract: spec.payload_contract,
    payload: spec.payload ?? {},
    payload_digest: digest,
    previous_event_digest: previous,
    fingerprint_profile: "jcs-sha256-v1",
    event_digest: digest,
  };
}

function runProjection(c: SemanticCase): Verdict {
  const a = c.oracle;
  if (!a.events || a.events.length === 0) throw new Error(`${c.case_id}: oracle projection sem events`);
  if (a.expect_result !== "accept" && a.expect_result !== "reject") throw new Error(`${c.case_id}: oracle projection sem expect_result`);
  let previousDigest: string | null = null;
  const envelopes: EventEnvelopeV1[] = a.events.map((spec, index) => {
    const env = buildEnvelope(spec, index, previousDigest);
    previousDigest = env.event_digest;
    return env;
  });
  try {
    const projection = project(envelopes);
    if (a.expect_result === "reject") {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: "projeção aceitou entrada que deveria falhar" };
    }
    if (a.expect_state !== undefined && projection.current_state !== a.expect_state) {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `estado esperado ${a.expect_state}, observado ${projection.current_state}` };
    }
    return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `state=${projection.current_state} last_sequence=${projection.last_sequence}` };
  } catch (err) {
    if (a.expect_result === "accept") {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `projeção falhou inesperadamente: ${(err as Error).message}` };
    }
    const code = (err as { code?: string }).code;
    if (a.expect_error_code !== undefined && code !== a.expect_error_code) {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `erro esperado ${a.expect_error_code}, observado ${code ?? "sem code"}` };
    }
    return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `rejeitado com ${code ?? (err as Error).message}` };
  }
}

function runSourceScan(c: SemanticCase): Verdict {
  const { target, require_absent, require_present } = c.oracle;
  if (!target) throw new Error(`${c.case_id}: oracle source-scan sem target`);
  const url = new URL(`../../../${target}`, import.meta.url);
  const source = readFileSync(url, "utf8");
  for (const forbidden of require_absent ?? []) {
    if (source.includes(forbidden)) {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `"${forbidden}" presente em ${target}` };
    }
  }
  for (const required of require_present ?? []) {
    if (!source.includes(required)) {
      return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `"${required}" ausente em ${target}` };
    }
  }
  return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `política satisfeita para ${target}` };
}

interface CanonicalizationVector {
  id: string;
  source: string;
  purpose: string;
  input_json?: string;
  input?: unknown;
  expected_canonical: string;
  expected_digest: string;
}

interface RejectionCase {
  id: string;
  construction: string;
  value: string;
  reason: string;
}

function loadVectors(): CanonicalizationVector[] {
  const raw = JSON.parse(readFileSync(VECTORS_URL, "utf8")) as { vectors: CanonicalizationVector[] };
  return raw.vectors;
}

function loadRejections(): RejectionCase[] {
  const raw = JSON.parse(readFileSync(REJECTIONS_URL, "utf8")) as { cases: RejectionCase[] };
  return raw.cases;
}

function toLowerHex(bytes: ArrayBuffer): string {
  let out = "";
  for (const byte of new Uint8Array(bytes)) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

/** Builders fechados para as expressões JS de rejections.json. */
const REJECT_BUILDERS: Record<string, () => unknown> = {
  "NaN": () => NaN,
  "Infinity": () => Infinity,
  "1n": () => 1n,
  "undefined": () => undefined,
  "new Array(2)": () => new Array(2),
  "({toJSON(){return 1}})": () => ({ toJSON() { return 1; } }),
  "Object.create({inherited:true})": () => Object.create({ inherited: true }),
  "String.fromCharCode(0xdead)": () => String.fromCharCode(0xdead),
  "const x={};x.self=x;x": () => {
    const x: Record<string, unknown> = {};
    x.self = x;
    return x;
  },
  "function named(){}": () => function named() {},
  "Symbol('value')": () => Symbol("value"),
  "const a=[];a.extra=1;a": () => {
    const a: unknown[] & { extra?: number } = [];
    a.extra = 1;
    return a;
  },
  "Object.defineProperty({},'x',{get(){return 1},enumerable:true})": () =>
    Object.defineProperty({}, "x", { get() { return 1; }, enumerable: true }),
  "Object.defineProperty({},'x',{value:1,enumerable:false})": () =>
    Object.defineProperty({}, "x", { value: 1, enumerable: false }),
  "const x={};x[Symbol('key')]=1;x": () => {
    const x: Record<symbol, number> = {};
    x[Symbol("key")] = 1;
    return x;
  },
};

async function executeRejection(r: RejectionCase): Promise<void> {
  switch (r.construction) {
    case "raw_json":
      parseStrictJson(r.value, JCS_LIMITS);
      return;
    case "javascript_expression": {
      const builder = REJECT_BUILDERS[r.value];
      if (!builder) throw new Error(`expressão sem builder registrado: ${r.value}`);
      assertCanonicalizable(builder());
      return;
    }
    case "purpose":
      await fingerprint({ profile: "domain-separation", version: 1 }, r.value);
      return;
    case "limit": {
      parseStrictJson("{\"a\":1}", { ...JCS_LIMITS, maxBytes: 4 });
      parseStrictJson("{\"a\":{\"b\":1}}", { ...JCS_LIMITS, maxDepth: 1 });
      parseStrictJson("{\"a\":1,\"b\":2}", { ...JCS_LIMITS, maxMembers: 1 });
      parseStrictJson("\"abc\"", { ...JCS_LIMITS, maxStringLength: 2 });
      return;
    }
    default:
      throw new Error(`construction desconhecida: ${r.construction}`);
  }
}

const REJECT_CODES = new Set([
  "json.duplicate_key",
  "json.parse",
  "json.limits",
  "json.not_canonicalizable",
  "fingerprint.invalid_purpose",
]);

async function runJcsVector(c: SemanticCase): Promise<Verdict> {
  const vectorId = c.oracle.vector_id;
  if (!vectorId) throw new Error(`${c.case_id}: oracle jcs:vector sem vector_id`);
  const vector = loadVectors().find((v) => v.id === vectorId);
  if (!vector) throw new Error(`${c.case_id}: vetor desconhecido "${vectorId}"`);
  const value = vector.input_json !== undefined ? parseStrictJson(vector.input_json, JCS_LIMITS) : vector.input;
  const canonical = canonicalizeJcs(value);
  if (canonical !== vector.expected_canonical) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `${vectorId}: canonical divergente` };
  }
  const digest = await fingerprint(value, vector.purpose);
  if (digest !== vector.expected_digest) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `${vectorId}: digest divergente` };
  }
  return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `${vectorId}: canonical + digest conferidos` };
}

async function runJcsReject(c: SemanticCase): Promise<Verdict> {
  const rejectId = c.oracle.reject_id;
  if (!rejectId) throw new Error(`${c.case_id}: oracle jcs:reject sem reject_id`);
  const rejection = loadRejections().find((r) => r.id === rejectId);
  if (!rejection) throw new Error(`${c.case_id}: rejeição desconhecida "${rejectId}"`);
  try {
    await executeRejection(rejection);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== undefined && REJECT_CODES.has(code)) {
      return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: `${rejectId}: rejeitado (${code})` };
    }
    throw err;
  }
  return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: `${rejectId}: entrada aceita inesperadamente` };
}

async function evaluateJcsProperty(property: JcsProperty | undefined): Promise<{ ok: boolean; detail: string }> {
  switch (property) {
    case "reorder-properties-same": {
      const a = { b: 2, a: 1 };
      const b = { a: 1, b: 2 };
      const canonicalSame = canonicalizeJcs(a) === canonicalizeJcs(b);
      const digestSame = (await fingerprint(a, "payload")) === (await fingerprint(b, "payload"));
      return { ok: canonicalSame && digestSame, detail: "propriedades reordenadas: canonical e digest iguais" };
    }
    case "reorder-array-diff": {
      const a = { items: [1, 2] };
      const b = { items: [2, 1] };
      const canonicalDiff = canonicalizeJcs(a) !== canonicalizeJcs(b);
      const digestDiff = (await fingerprint(a, "payload")) !== (await fingerprint(b, "payload"));
      return { ok: canonicalDiff && digestDiff, detail: "array reordenado: canonical e digest diferentes" };
    }
    case "purpose-diff": {
      const input = { profile: "domain-separation", version: 1 };
      const manifest = await fingerprint(input, "manifest");
      const config = await fingerprint(input, "config");
      return { ok: manifest !== config, detail: "purpose diferente produz digest diferente" };
    }
    case "material-change-diff": {
      const base = {
        contract: "ideia.tool-request/1",
        call_id: "cal_123e4567-e89b-42d3-a456-426614174000",
        task_id: "tsk_123e4567-e89b-42d3-a456-426614174000",
        principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
        tool: { tool_id: "read-file", tool_version: "1.0.0" },
        effect_class: "read_only",
        arguments: { path: "src/a.ts", encoding: "utf8" },
        target: { path: "src/a.ts" },
      };
      const changed = structuredClone(base);
      changed.arguments.encoding = "utf-16";
      const baseDigest = await fingerprint(base, "tool-request");
      const changedDigest = await fingerprint(changed, "tool-request");
      return { ok: baseDigest !== changedDigest, detail: "mudança material no request altera o fingerprint" };
    }
    case "nfc-nfd-diff": {
      const nfc = { label: "\u00e9" };
      const nfd = { label: "e\u0301" };
      const canonicalDiff = canonicalizeJcs(nfc) !== canonicalizeJcs(nfd);
      const digestDiff = (await fingerprint(nfc, "payload")) !== (await fingerprint(nfd, "payload"));
      return { ok: canonicalDiff && digestDiff, detail: "NFC/NFD não normalizados: bytes e digest diferentes" };
    }
    case "raw-digest-raw": {
      const text = '{ "b": 2, "a": 1 }';
      const bytes = new TextEncoder().encode(text);
      const direct = "sha256:" + toLowerHex(await crypto.subtle.digest("SHA-256", bytes));
      const raw = await rawDigest(bytes);
      const fingerprintValue = await fingerprint({ b: 2, a: 1 }, "payload");
      const ok = raw === direct && raw !== fingerprintValue;
      return { ok, detail: "rawDigest = SHA-256 dos bytes exatos, sem cabeçalho e sem JCS" };
    }
    default:
      throw new Error(`jcs:property desconhecida: ${String(property)}`);
  }
}

async function runJcsProperty(c: SemanticCase): Promise<Verdict> {
  const property = c.oracle.property as JcsProperty | undefined;
  const result = await evaluateJcsProperty(property);
  if (!result.ok) {
    return { case_id: c.case_id, status: "fail", expected_code: c.expected_code, blocked_by: null, detail: result.detail };
  }
  return { case_id: c.case_id, status: "pass", expected_code: c.expected_code, blocked_by: null, detail: result.detail };
}

export async function runCase(c: SemanticCase): Promise<Verdict> {
  switch (c.oracle.strategy) {
    case "blocked":
      return {
        case_id: c.case_id,
        status: "blocked",
        expected_code: c.expected_code,
        blocked_by: c.blocked_by,
        detail: `bloqueado por ${c.blocked_by}`,
      };
    case "schema:validator":
      return runSchemaValidator(c);
    case "budget:computeBudget":
      return runBudget(c);
    case "transition:validateTransition":
      return runTransition(c);
    case "policy:source-scan":
      return runSourceScan(c);
    case "projection:reducer":
      return runProjection(c);
    case "jcs:vector":
      return runJcsVector(c);
    case "jcs:reject":
      return runJcsReject(c);
    case "jcs:property":
      return runJcsProperty(c);
    default: {
      const strategy = String((c.oracle as { strategy: unknown }).strategy);
      throw new Error(`unknown oracle strategy: ${strategy}`);
    }
  }
}

// CLI: node test/semantic/run-semantic-case.ts <case_id>
if (process.argv[1]?.endsWith("run-semantic-case.ts")) {
  const caseId = process.argv[2];
  if (!caseId) {
    console.error("uso: node test/semantic/run-semantic-case.ts <case_id>");
    process.exit(2);
  }
  const runCli = async () => {
    const catalog = loadCaseCatalog();
    const verdict = await runCase(getCase(catalog, caseId));
    console.log(JSON.stringify(verdict, null, 2));
    process.exit(verdict.status === "fail" ? 1 : 0);
  };
  void runCli();
}
