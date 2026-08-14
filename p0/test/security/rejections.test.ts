/**
 * Testes de rejeição do perfil jcs-sha256-v1 (WP-04).
 *
 * Executa todos os casos de docs/implementation/contracts/canonicalization/
 * rejections.json como fonte de verdade: JSON bruto com chave duplicada
 * (inclusive por escape), valores JS não canonicalizáveis, purpose fora do
 * alfabeto e violação de limite. Cada expressão precisa de um builder
 * registrado (registry fechado); expressão sem builder falha o teste —
 * nunca é aceita silenciosamente.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  parseStrictJson,
  DuplicateKeyError,
  JsonLimitsError,
  JsonParseError,
} from "../../src/security/strict-json.ts";
import { assertCanonicalizable, CanonicalizableError } from "../../src/security/jcs.ts";
import { fingerprint, InvalidPurposeError } from "../../src/security/fingerprint.ts";

const REJECTIONS_URL = new URL("../../../docs/implementation/contracts/canonicalization/rejections.json", import.meta.url);

const LIMITS = { maxBytes: 1 << 20, maxDepth: 128, maxMembers: 4096, maxStringLength: 1 << 20 };

interface RejectionCase {
  id: string;
  construction: string;
  value: string;
  reason: string;
}

/** Builders fechados para as expressões JS de rejections.json. */
const BUILDERS: Record<string, () => unknown> = {
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

function loadRejections(): RejectionCase[] {
  const raw = JSON.parse(readFileSync(REJECTIONS_URL, "utf8")) as { cases: RejectionCase[] };
  return raw.cases;
}

test("rejeições - todos os casos de rejections.json são rejeitados", async () => {
  const cases = loadRejections();
  assert.ok(cases.length >= 21, `esperado >= 21 casos, obtido ${cases.length}`);
  for (const c of cases) {
    switch (c.construction) {
      case "raw_json": {
        assert.throws(
          () => parseStrictJson(c.value, LIMITS),
          (err) => err instanceof DuplicateKeyError || err instanceof JsonParseError || err instanceof JsonLimitsError,
          `${c.id} (${c.reason})`
        );
        break;
      }
      case "javascript_expression": {
        const builder = BUILDERS[c.value];
        assert.ok(builder, `${c.id}: expressão sem builder registrado: "${c.value}"`);
        assert.throws(() => assertCanonicalizable(builder()), CanonicalizableError, `${c.id} (${c.reason})`);
        break;
      }
      case "purpose": {
        await assert.rejects(
          () => fingerprint({ profile: "domain-separation", version: 1 }, c.value),
          InvalidPurposeError,
          `${c.id} (${c.reason})`
        );
        break;
      }
      case "limit": {
        assert.throws(() => parseStrictJson("{\"a\":1}", { ...LIMITS, maxBytes: 4 }), JsonLimitsError, `${c.id}: bytes`);
        assert.throws(() => parseStrictJson("{\"a\":{\"b\":1}}", { ...LIMITS, maxDepth: 1 }), JsonLimitsError, `${c.id}: profundidade`);
        assert.throws(() => parseStrictJson("{\"a\":1,\"b\":2}", { ...LIMITS, maxMembers: 1 }), JsonLimitsError, `${c.id}: membros`);
        assert.throws(() => parseStrictJson("\"abc\"", { ...LIMITS, maxStringLength: 2 }), JsonLimitsError, `${c.id}: string`);
        break;
      }
      default:
        assert.fail(`${c.id}: construction desconhecida "${c.construction}"`);
    }
  }
});
