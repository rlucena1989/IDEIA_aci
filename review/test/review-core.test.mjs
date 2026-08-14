import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { checkP0Typecheck, evaluateScope, globToRegExp, pathMatchesAny, statusOf } from "../lib/review-core.mjs";

const POLICY = JSON.parse(readFileSync(new URL("../policy/gates.json", import.meta.url), "utf8"));
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

test("glob suporta arquivo, estrela e globstar", () => {
  assert.ok(globToRegExp("p0/src/domain/budget.ts").test("p0/src/domain/budget.ts"));
  assert.ok(pathMatchesAny("p0/contracts/v1/_defs.schema.json", ["p0/contracts/v1/**"]));
  assert.ok(pathMatchesAny("p0/test/fixtures/budget/case.json", ["p0/test/fixtures/budget/**"]));
  assert.equal(pathMatchesAny("p0/src/domain/ids.ts", ["p0/test/**"]), false);
});

test("escopo falha fechado para arquivo não autorizado", () => {
  const manifest = { allowedPaths: ["p0/src/domain/budget.ts", "p0/test/domain/budget.test.ts"] };
  const result = evaluateScope(manifest, ["p0/src/domain/budget.ts", "p0/README.md"]);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.unexpected, ["p0/README.md"]);
});

test("escopo aceita todos os arquivos autorizados", () => {
  const manifest = { allowedPaths: ["p0/contracts/v1/**", "p0/src/contracts/validate.ts"] };
  const result = evaluateScope(manifest, ["p0/contracts/v1/task-manifest.schema.json", "p0/src/contracts/validate.ts"]);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.unexpected, []);
});

test("somente fail bloqueia o resultado do pacote", () => {
  assert.equal(statusOf([{ status: "pass" }, { status: "warn" }, { status: "skip" }]), "pass");
  assert.equal(statusOf([{ status: "pass" }, { status: "fail" }]), "fail");
});

test("p0-typecheck - falha de TypeScript produz status=fail com comando e erro no detalhe", () => {
  const fakeRun = () => ({
    ok: false,
    status: 1,
    output: "p0/src/security/jcs.ts:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.",
  });
  const check = checkP0Typecheck(REPO_ROOT, fakeRun);
  assert.equal(check.id, "p0-typecheck");
  assert.equal(check.status, "fail");
  assert.equal(check.details.command, "npx tsc --noEmit");
  assert.match(check.details.output, /error TS2322/);
});

test("p0-typecheck - sem erros produz status=pass e identifica o comando", () => {
  const fakeRun = () => ({ ok: true, status: 0, output: "" });
  const check = checkP0Typecheck(REPO_ROOT, fakeRun);
  assert.equal(check.status, "pass");
  assert.equal(check.details.command, "npx tsc --noEmit");
});

test("p0-typecheck - sem p0 o gate é skip", () => {
  const withoutP0 = path.join(os.tmpdir(), "review-p0-typecheck-sem-p0");
  const check = checkP0Typecheck(withoutP0);
  assert.equal(check.status, "skip");
});

test("p0-typecheck - perfil full inclui o gate e não permanece verde quando o typecheck falha", () => {
  assert.ok(POLICY.profiles.full.checks.includes("p0-typecheck"), "perfil full deve incluir p0-typecheck");
  const checks = POLICY.profiles.full.checks.map((id) => ({ id, status: "pass", summary: "ok" }));
  const index = checks.findIndex((check) => check.id === "p0-typecheck");
  checks[index] = {
    id: "p0-typecheck",
    status: "fail",
    summary: "npx tsc --noEmit falhou; corrija os erros de TypeScript antes de aprovar.",
    details: { command: "npx tsc --noEmit", output: "p0/src/x.ts:1:1 - error TS2322: Type 'string' is not assignable to type 'number'." },
  };
  assert.equal(statusOf(checks), "fail");
});
