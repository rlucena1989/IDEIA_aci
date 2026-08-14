import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkLockfile,
  checkContractBuildPolicy,
  checkManifest,
  checkP0Tests,
  checkP0Typecheck,
  checkRepositoryHealth,
  checkSchemaCopy,
  checkSourcePolicy,
  evaluateScope,
  makeCheck,
  statusOf,
} from "../lib/review-core.mjs";

const reviewDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(reviewDirectory, "..");

function parseArguments(values) {
  const result = { profile: "inventory", paths: [], report: path.join(reviewDirectory, "reports", "latest.json") };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--profile") result.profile = values[++index];
    else if (value === "--wp") result.wp = values[++index];
    else if (value === "--path") result.paths.push(values[++index]);
    else if (value === "--report") result.report = path.resolve(repoRoot, values[++index]);
    else if (value === "--no-report") result.report = undefined;
    else if (value === "--help") result.help = true;
    else throw new Error(`Argumento desconhecido: ${value}`);
  }
  return result;
}

function help() {
  console.log("Uso: node review/scripts/review.mjs [--profile scope|inventory|fast|full] [--wp WP-06] [--path arquivo] [--report arquivo] [--no-report]");
  console.log("Use --path repetidamente para conferir o escopo de um WP. O runner nunca deduz o escopo de uma árvore em movimento.");
}

function loadManifest(wp) {
  const filePath = path.join(reviewDirectory, "manifests", `${wp}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Manifesto não encontrado para ${wp}.`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function printSummary(report) {
  console.log(`review status=${report.status} profile=${report.profile}${report.workPackage ? ` wp=${report.workPackage}` : ""}`);
  for (const check of report.checks) console.log(`[${check.status.toUpperCase()}] ${check.id}: ${check.summary}`);
  if (report.reportPath) console.log(`report=${report.reportPath}`);
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    help();
    process.exit(0);
  }
  const policy = JSON.parse(fs.readFileSync(path.join(reviewDirectory, "policy", "gates.json"), "utf8"));
  const profile = policy.profiles[options.profile];
  if (!profile) throw new Error(`Perfil desconhecido: ${options.profile}`);

  const checks = [];
  const requested = new Set(profile.checks);
  if (requested.has("repository-health")) checks.push(checkRepositoryHealth(repoRoot));
  if (requested.has("source-policy")) checks.push(checkSourcePolicy(repoRoot));
  if (requested.has("schema-copy")) checks.push(checkSchemaCopy(repoRoot));
  if (requested.has("lockfile")) checks.push(checkLockfile(repoRoot));
  if (requested.has("contract-build-policy")) checks.push(checkContractBuildPolicy(repoRoot));
  if (requested.has("p0-tests")) checks.push(...checkP0Tests(repoRoot, requested.has("validator-drift")));
  if (requested.has("p0-typecheck")) checks.push(checkP0Typecheck(repoRoot));

  let manifest;
  if (options.wp) {
    manifest = loadManifest(options.wp);
    checks.push(checkManifest(repoRoot, manifest));
    if (options.paths.length > 0) {
      const scope = evaluateScope(manifest, options.paths);
      checks.push(makeCheck("wp-scope", scope.allowed ? "pass" : "fail", scope.allowed ? `Arquivos informados respeitam o escopo de ${options.wp}.` : `Há arquivos fora do escopo de ${options.wp}.`, scope));
    } else {
      checks.push(makeCheck("wp-scope", "skip", "Escopo não avaliado: informe cada arquivo alterado com --path."));
    }
  }

  const report = {
    contract: "ideia.review-report/1",
    createdAt: new Date().toISOString(),
    profile: options.profile,
    workPackage: manifest?.workPackage,
    status: statusOf(checks),
    checks,
  };
  if (options.report) {
    fs.mkdirSync(path.dirname(options.report), { recursive: true });
    fs.writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`);
    report.reportPath = path.relative(repoRoot, options.report).replaceAll("\\", "/");
  }
  printSummary(report);
  process.exit(report.status === "pass" ? 0 : 1);
} catch (error) {
  console.error(`review runner error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}
