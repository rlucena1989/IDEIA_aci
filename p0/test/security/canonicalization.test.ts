/**
 * Testes do perfil jcs-sha256-v1 (WP-04).
 *
 * Executa todos os vetores de docs/implementation/contracts/canonicalization/
 * vectors.json como fonte de verdade (bytes canônicos e digests) e os
 * critérios de aceite do ADR-004/RNF-020: reordenar propriedades não muda
 * bytes nem digest, reordenar array muda, purpose diferente muda, NFC/NFD
 * não são normalizados, a entrada nunca é mutada e rawDigest opera sobre os
 * bytes exatos (sem cabeçalho e sem JCS).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseStrictJson } from "../../src/security/strict-json.ts";
import { canonicalizeJcs } from "../../src/security/jcs.ts";
import { fingerprint, rawDigest } from "../../src/security/fingerprint.ts";

const VECTORS_URL = new URL("../../../docs/implementation/contracts/canonicalization/vectors.json", import.meta.url);

const LIMITS = { maxBytes: 1 << 20, maxDepth: 128, maxMembers: 4096, maxStringLength: 1 << 20 };

interface CanonicalizationVector {
  id: string;
  source: string;
  purpose: string;
  input_json?: string;
  input?: unknown;
  expected_canonical: string;
  expected_digest: string;
}

function loadVectors(): CanonicalizationVector[] {
  const raw = JSON.parse(readFileSync(VECTORS_URL, "utf8")) as { vectors: CanonicalizationVector[] };
  return raw.vectors;
}

function toLowerHex(bytes: ArrayBuffer): string {
  let out = "";
  for (const byte of new Uint8Array(bytes)) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

test("vetores - input_json: canonical e digest exatos", async () => {
  const vectors = loadVectors().filter((v) => v.input_json !== undefined);
  assert.ok(vectors.length >= 6, `esperado >= 6 vetores com input_json, obtido ${vectors.length}`);
  assert.ok(vectors.some((vector) => vector.id === "JCS-P0-007"), "JCS-P0-007 deve permanecer no corpus");
  for (const vector of vectors) {
    const value = parseStrictJson(vector.input_json!, LIMITS);
    assert.equal(canonicalizeJcs(value), vector.expected_canonical, `${vector.id}: canonical divergente`);
    assert.equal(await fingerprint(value, vector.purpose), vector.expected_digest, `${vector.id}: digest divergente`);
  }
});

test("vetores - input: canonical e digest exatos", async () => {
  const vectors = loadVectors().filter((v) => v.input !== undefined);
  assert.ok(vectors.length >= 20, `esperado >= 20 vetores com input, obtido ${vectors.length}`);
  for (const vector of vectors) {
    assert.equal(canonicalizeJcs(vector.input), vector.expected_canonical, `${vector.id}: canonical divergente`);
    assert.equal(await fingerprint(vector.input, vector.purpose), vector.expected_digest, `${vector.id}: digest divergente`);
  }
});

test("aceite - reordenar propriedades não muda bytes nem digest", async () => {
  const a = { b: 2, a: 1 };
  const b = { a: 1, b: 2 };
  assert.equal(canonicalizeJcs(a), canonicalizeJcs(b));
  assert.equal(await fingerprint(a, "payload"), await fingerprint(b, "payload"));
});

test("aceite - reordenar array muda bytes e digest", async () => {
  const a = { items: [1, 2] };
  const b = { items: [2, 1] };
  assert.notEqual(canonicalizeJcs(a), canonicalizeJcs(b));
  assert.notEqual(await fingerprint(a, "payload"), await fingerprint(b, "payload"));
});

test("aceite - purpose diferente muda digest", async () => {
  const input = { profile: "domain-separation", version: 1 };
  assert.notEqual(await fingerprint(input, "manifest"), await fingerprint(input, "config"));
});

test("aceite - NFC e NFD não são normalizados", async () => {
  const nfc = { label: "\u00e9" };
  const nfd = { label: "e\u0301" };
  assert.notEqual(canonicalizeJcs(nfc), canonicalizeJcs(nfd));
  assert.notEqual(await fingerprint(nfc, "payload"), await fingerprint(nfd, "payload"));
});

test("aceite - canonicalizeJcs não muta a entrada", () => {
  const input: Record<string, unknown> = { z: [{ b: true, a: null }, 3], a: "x" };
  const before = JSON.stringify(input);
  canonicalizeJcs(input);
  assert.equal(JSON.stringify(input), before);
});

test("aceite - rawDigest usa bytes crus, sem cabeçalho e sem JCS", async () => {
  const text = '{ "b": 2, "a": 1 }';
  const bytes = new TextEncoder().encode(text);
  const direct = "sha256:" + toLowerHex(await crypto.subtle.digest("SHA-256", bytes));
  const raw = await rawDigest(bytes);
  assert.equal(raw, direct, "rawDigest deve ser SHA-256 dos bytes exatos");
  assert.notEqual(raw, await fingerprint({ b: 2, a: 1 }, "payload"), "rawDigest não deve coincidir com fingerprint JCS (cabeçalho + canonicalização)");
});
