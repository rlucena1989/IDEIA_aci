/**
 * Executa o catálogo WP-09B inteiro via CLI (etapa local/CI).
 *
 * Para cada caso executável, dispara o runner real como processo separado:
 *
 *   node test/semantic/run-semantic-case.ts <case_id>
 *
 * e agrega os vereditos. O catálogo (cases.json) é lido como fonte imutável;
 * casos bloqueados são apenas contados, nunca executados. Exit code != 0 se
 * qualquer caso executável falhar, se o processo do runner não sair com
 * status 0 ou se a saída não for um veredito JSON válido com status "pass".
 *
 * Uso:
 *   node test/semantic/run-catalog.ts          # roda via npm test
 *   npm run test:catalog
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadCaseCatalog } from "./run-semantic-case.ts";

const here = dirname(fileURLToPath(import.meta.url));
const runner = join(here, "run-semantic-case.ts");

const catalog = loadCaseCatalog();
const executable = catalog.filter((c) => c.oracle.strategy !== "blocked");
const blockedCount = catalog.length - executable.length;

let failures = 0;
for (const c of executable) {
  const result = spawnSync(process.execPath, [runner, c.case_id], {
    encoding: "utf8",
    windowsHide: true,
  });
  let pass = result.status === 0;
  let detail = "";
  try {
    const verdict = JSON.parse(result.stdout ?? "") as { status?: string; detail?: string };
    pass = pass && verdict.status === "pass";
    detail = verdict.detail ?? "";
  } catch {
    pass = false;
    detail = result.stderr?.trim() || "runner sem saída JSON";
  }
  if (pass) {
    console.log(`[PASS] ${c.case_id}: ${detail}`);
  } else {
    failures += 1;
    console.error(`[FAIL] ${c.case_id}: ${detail}`);
  }
}

console.log(`catalog: ${executable.length} executáveis, ${blockedCount} bloqueados, ${failures} falha(s)`);
if (failures > 0) process.exit(1);
