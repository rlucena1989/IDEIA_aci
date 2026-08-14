import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function globToRegExp(glob) {
  const value = normalizePath(glob);
  let expression = "^";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "*") {
      if (value[index + 1] === "*") {
        index += 1;
        if (value[index + 1] === "/") {
          index += 1;
          expression += "(?:.*/)?";
        } else {
          expression += ".*";
        }
      } else {
        expression += "[^/]*";
      }
    } else if (char === "?") {
      expression += "[^/]";
    } else if ("\\^$+.|()[]{}".includes(char)) {
      expression += `\\${char}`;
    } else {
      expression += char;
    }
  }
  return new RegExp(`${expression}$`);
}

export function pathMatchesAny(filePath, globs) {
  const normalized = normalizePath(filePath);
  return globs.some((glob) => globToRegExp(glob).test(normalized));
}

export function evaluateScope(manifest, changedPaths) {
  const paths = [...new Set(changedPaths.map(normalizePath))].sort();
  const allowedPaths = manifest.allowedPaths ?? [];
  const unexpected = paths.filter((filePath) => !pathMatchesAny(filePath, allowedPaths));
  return {
    changedPaths: paths,
    unexpected,
    allowed: unexpected.length === 0,
  };
}

export function listFiles(root, predicate = () => true) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(filePath, predicate));
    } else if (entry.isFile() && predicate(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function command(command, args, cwd) {
  const executable = process.platform === "win32" && (command === "npm" || command === "npx") ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    output: output.slice(-12000),
    error: result.error?.message,
  };
}

export function makeCheck(id, status, summary, details = {}) {
  return { id, status, summary, details };
}

export function checkSchemaCopy(repoRoot) {
  const sourceDirectory = path.join(repoRoot, "docs", "implementation", "contracts", "v1");
  const copyDirectory = path.join(repoRoot, "p0", "contracts", "v1");
  if (!fs.existsSync(sourceDirectory) || !fs.existsSync(copyDirectory)) {
    return makeCheck("schema-copy", "skip", "Catálogo fonte ou cópia P0 ainda não existe.");
  }
  const source = listFiles(sourceDirectory, (file) => file.endsWith(".schema.json"));
  const copy = listFiles(copyDirectory, (file) => file.endsWith(".schema.json"));
  const sourceByName = new Map(source.map((file) => [path.basename(file), file]));
  const copyByName = new Map(copy.map((file) => [path.basename(file), file]));
  const mismatches = [];
  for (const [name, filePath] of sourceByName) {
    const copied = copyByName.get(name);
    if (!copied || sha256File(filePath) !== sha256File(copied)) mismatches.push(name);
  }
  for (const name of copyByName.keys()) {
    if (!sourceByName.has(name)) mismatches.push(name);
  }
  if (mismatches.length > 0) {
    return makeCheck("schema-copy", "fail", "A cópia P0 diverge dos schemas aprovados.", { mismatches: [...new Set(mismatches)].sort() });
  }
  return makeCheck("schema-copy", "pass", "Schemas P0 são cópias byte a byte do catálogo aprovado.", { count: source.length });
}

export function checkLockfile(repoRoot) {
  const packagePath = path.join(repoRoot, "p0", "package.json");
  if (!fs.existsSync(packagePath)) return makeCheck("lockfile", "skip", "p0/package.json ainda não existe.");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const dependencyCount = Object.keys(packageJson.dependencies ?? {}).length;
  const lockPath = path.join(repoRoot, "p0", "package-lock.json");
  if (dependencyCount > 0 && !fs.existsSync(lockPath)) {
    return makeCheck("lockfile", "fail", "Há dependências de runtime no P0 sem package-lock reproduzível.", { dependencyCount, expected: "p0/package-lock.json" });
  }
  return makeCheck("lockfile", "pass", "Lockfile compatível com as dependências declaradas.", { dependencyCount });
}

export function checkSourcePolicy(repoRoot) {
  const roots = [path.join(repoRoot, "p0", "src"), path.join(repoRoot, "p0", "scripts"), path.join(repoRoot, "p0", "test")];
  const files = roots.flatMap((root) => listFiles(root, (file) => /\.(?:ts|mjs)$/.test(file) && !file.includes("validators.generated")));
  if (files.length === 0) return makeCheck("source-policy", "skip", "Ainda não há fontes P0 para avaliar.");
  const violations = [];
  const patterns = [
    { id: "typescript.any", expression: /\bany\b/, message: "uso de any" },
    { id: "typescript.ignore", expression: /@ts-(?:ignore|expect-error)/, message: "supressão TypeScript" },
    { id: "unfinished", expression: /\b(?:TODO|FIXME)\b/, message: "marcador de trabalho pendente" },
    { id: "test.selection", expression: /\b(?:test|describe|it)\.(?:only|skip|todo)\s*\(/, message: "teste selecionado, pulado ou marcado como pendente" },
    { id: "legacy.import", expression: /(?:from\s+["']|import\s*\()[^"']*packages\//, message: "import do legado em quarentena" },
    { id: "runtime.network", expression: /\b(?:fetch|loadSchema)\s*\(|\bnode:(?:http|https|net)\b/, message: "acesso de rede fora de adapter aprovado" },
  ];
  for (const filePath of files) {
    const relative = normalizePath(path.relative(repoRoot, filePath));
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
      for (const pattern of patterns) {
        if (pattern.expression.test(line)) violations.push({ rule: pattern.id, file: relative, line: index + 1, message: pattern.message });
      }
      if (line.includes("node:crypto") && relative !== "p0/src/adapters/node-id-generator.ts") {
        violations.push({ rule: "id.crypto-boundary", file: relative, line: index + 1, message: "node:crypto fora do adapter de UUID autorizado" });
      }
      if (relative.startsWith("p0/src/domain/") && /(?:performance\.now|Date\.now|new Date\s*\(\s*\))/.test(line)) {
        violations.push({ rule: "clock.adapter-boundary", file: relative, line: index + 1, message: "relógio global em domain; deve ficar em adapter real" });
      }
    });
  }
  if (violations.length > 0) return makeCheck("source-policy", "fail", "Políticas estáticas foram violadas.", { violations });
  return makeCheck("source-policy", "pass", "Fontes P0 passam as regras estáticas locais.", { files: files.length });
}

export function checkRepositoryHealth(repoRoot) {
  const diff = command("git", ["diff", "--check"], repoRoot);
  if (!diff.ok) return makeCheck("repository-health", "fail", "git diff --check encontrou whitespace inválido.", { output: diff.output });
  const hookPath = path.join(repoRoot, ".githooks", "pre-commit");
  if (!fs.existsSync(hookPath)) return makeCheck("repository-health", "warn", "Hook de pré-commit para segredos não foi encontrado.");
  return makeCheck("repository-health", "pass", "Whitespace do diff e hook local de segredos foram encontrados.");
}

export function checkContractBuildPolicy(repoRoot) {
  const generatorPath = path.join(repoRoot, "p0", "scripts", "generate-contract-validators.mjs");
  const runtimePath = path.join(repoRoot, "p0", "src", "contracts", "validate.ts");
  if (!fs.existsSync(generatorPath) || !fs.existsSync(runtimePath)) {
    return makeCheck("contract-build-policy", "skip", "Gerador ou runtime de contracts ainda não existe.");
  }
  const generator = fs.readFileSync(generatorPath, "utf8");
  const runtime = fs.readFileSync(runtimePath, "utf8");
  const violations = [];
  if (!/from\s+["']ajv\/dist\/2020(?:\.js)?["']/.test(generator)) violations.push("Ajv não usa a entrada específica draft 2020-12.");
  if (!/\bstrict\s*:\s*true\b/.test(generator)) violations.push("strict: true não foi encontrado.");
  if (/\bstrictSchema\s*:\s*false\b/.test(generator)) violations.push("strictSchema não pode ser false.");
  if (/\bvalidateSchema\s*:\s*false\b/.test(generator)) violations.push("validateSchema não pode ser false.");
  if (/\bstrictRequired\s*:\s*["']log["']/.test(generator)) violations.push("strictRequired não pode degradar falha para log.");
  if (!/\besm\s*:\s*true\b/.test(generator)) violations.push("Standalone não habilita saída ESM.");
  if (!/validators\.generated\.js/.test(generator)) violations.push("Saída esperada validators.generated.js não foi encontrada.");
  if (/validators\.generated\.cjs/.test(generator) || /createRequire\s*\(/.test(runtime)) violations.push("Runtime/CommonJS encontrado onde o contrato exige ESM.");
  if (violations.length > 0) return makeCheck("contract-build-policy", "fail", "Perfil do build de contracts não cumpre ADR-005/WP-05.", { violations });
  return makeCheck("contract-build-policy", "pass", "Perfil do build de contracts cumpre as restrições ESM, 2020-12 e strict.");
}

export function checkP0Typecheck(repoRoot, run = command) {
  const p0 = path.join(repoRoot, "p0");
  if (!fs.existsSync(path.join(p0, "package.json"))) return makeCheck("p0-typecheck", "skip", "P0 não existe.");
  const result = run("npx", ["tsc", "--noEmit"], p0);
  const details = { command: "npx tsc --noEmit", output: result.output };
  if (!result.ok) {
    return makeCheck("p0-typecheck", "fail", "npx tsc --noEmit falhou; corrija os erros de TypeScript antes de aprovar.", details);
  }
  return makeCheck("p0-typecheck", "pass", "TypeScript compila sem erros (npx tsc --noEmit).", details);
}

export function checkP0Tests(repoRoot, includeDrift) {
  const p0 = path.join(repoRoot, "p0");
  if (!fs.existsSync(path.join(p0, "package.json"))) return [makeCheck("p0-tests", "skip", "P0 não existe.")];
  const test = command("npm", ["test"], p0);
  const checks = [makeCheck("p0-tests", test.ok ? "pass" : "fail", test.ok ? "Suíte P0 executou com sucesso." : "Suíte P0 falhou.", { output: test.output })];
  if (includeDrift) {
    const drift = command("npm", ["run", "check-drift"], p0);
    checks.push(makeCheck("validator-drift", drift.ok ? "pass" : "fail", drift.ok ? "Validators gerados não apresentam drift." : "Há drift ou falha no gerador.", { output: drift.output }));
  }
  return checks;
}

export function checkManifest(repoRoot, manifest) {
  const missingFiles = (manifest.requiredPaths ?? []).filter((relative) => !fs.existsSync(path.join(repoRoot, relative)));
  const missingDirectories = (manifest.requiredDirectories ?? []).filter((relative) => !fs.existsSync(path.join(repoRoot, relative)));
  if (missingFiles.length > 0 || missingDirectories.length > 0) {
    return makeCheck("wp-artifacts", "fail", `Artefatos obrigatórios de ${manifest.workPackage} estão ausentes.`, { missingFiles, missingDirectories });
  }
  return makeCheck("wp-artifacts", "pass", `Artefatos obrigatórios de ${manifest.workPackage} estão presentes.`);
}

export function statusOf(checks) {
  return checks.some((check) => check.status === "fail") ? "fail" : "pass";
}
