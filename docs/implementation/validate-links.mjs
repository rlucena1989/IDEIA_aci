import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "docs/implementation");
const markdownFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") markdownFiles.push(path);
  }
}

await walk(root);
const broken = [];
const linkPattern = /!??\[[^\]]*\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
    if (/^(https?:|mailto:|data:|#)/i.test(target)) continue;
    target = target.split("#", 1)[0];
    if (target.length === 0) continue;
    try {
      target = decodeURIComponent(target);
      await stat(resolve(dirname(file), target));
    } catch {
      broken.push({ file, target });
    }
  }
}

console.log("Markdown files:", markdownFiles.length);
console.log("Broken local links:", broken.length);
for (const item of broken) console.error("-", item.file, "->", item.target);
if (broken.length > 0) process.exitCode = 1;
