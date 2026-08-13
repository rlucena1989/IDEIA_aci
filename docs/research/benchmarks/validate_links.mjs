// Validador de links relativos em Markdown (sem dependências).
// Uso: node validate_links.mjs [dir]   (default: diretório docs/ acima deste arquivo)
// Verifica que todo link relativo aponta para um arquivo/diretório existente.
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, dirname, join, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const scope = resolve(process.argv[2] ?? join(here, "..", ".."));

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

async function exists(p) {
  try {
    const s = await stat(p);
    return s.isFile() || s.isDirectory();
  } catch {
    return false;
  }
}

const linkRe = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const refRe = /^\[([^\]]+)\]:\s*(\S+)/gm;
const skip = /^(https?:|ftp:|mailto:|#)/i;

const broken = [];
const files = await walk(scope);
let linksChecked = 0;

for (const file of files) {
  const text = await readFile(file, "utf8");
  const base = dirname(file);
  const targets = [];
  for (const m of text.matchAll(linkRe)) targets.push(m[2]);
  for (const m of text.matchAll(refRe)) targets.push(m[2]);

  for (const raw of targets) {
    const target = raw.replace(/<|>/g, "").split("#")[0];
    if (!target || skip.test(target)) continue;
    if (target.startsWith("/") || target.includes(":/")) continue;
    linksChecked++;
    const resolved = resolve(base, target);
    let ok = await exists(resolved);
    if (!ok && !extname(resolved)) {
      ok = (await exists(resolved + ".md")) || (await exists(join(resolved, "index.md")));
    }
    if (!ok) broken.push(`${file.replace(scope + sep, "")} -> ${raw}`);
  }
}

console.log(`Escopo: ${scope}`);
console.log(`Arquivos .md: ${files.length}`);
console.log(`Links relativos verificados: ${linksChecked}`);
if (broken.length) {
  console.error(`Links quebrados: ${broken.length}`);
  for (const b of broken) console.error(`- ${b}`);
  process.exitCode = 1;
} else {
  console.log("Nenhum link quebrado");
}
