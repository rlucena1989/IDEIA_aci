import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("./", import.meta.url));
const tasks = Array.from({ length: 10 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`);

const rows = [];
for (const task of tasks) {
  const r1 = JSON.parse(await readFile(join(dir, `results_${task}_opencode.json`), "utf8"));
  const r2 = JSON.parse(await readFile(join(dir, `results_${task}_opencode_r2.json`), "utf8"));
  const f1 = r1.filesChanged.join(", ") || "nenhum";
  const f2 = r2.filesChanged.join(", ") || "nenhum";
  const t = r2.testsAfter ? `${r2.testsBefore.passed + r2.testsBefore.failed}→${r2.testsAfter.passed}/${r2.testsAfter.failed}` : "—";
  const dur = r2.durationMs != null ? (r2.durationMs / 1000).toFixed(1) + " s" : "—";
  const calls = r2.toolCallsByKind
    ? `${r2.toolCallsByKind.read}L/${r2.toolCallsByKind.edit}E/${r2.toolCallsByKind.glob}G`
    : "—";
  const tok = r2.providerTokens ? `${(r2.providerTokens.input / 1000).toFixed(0)}k` : "—";
  const same = JSON.stringify([...f1.split(", ")].sort()) === JSON.stringify([...f2.split(", ")].sort()) ? "igual" : "diferente";
  rows.push({ task, f1, f2, same, dur, calls, t, tok, note: r2.notes ?? "-" });
}

const md = `# Comparativo OpenCode — rodada 1 vs rodada 2

## Escopo
Rodada 1 (11/08, sem telemetria consistente) vs rodada 2 (telemetria completa: duração, tool calls, tokens db/provider). Mesmas fixtures, mesmos prompts, cópias limpas. Resultados: \`results_Txx_opencode.json\` (r1) e \`results_Txx_opencode_r2.json\` (r2).

| Tarefa | FilesChanged r1 | FilesChanged r2 | Δ escopo | Duração r2 | Tool calls r2 (L/E/G) | Testes antes→depois r2 | Tokens in r2 (provider) | Nota r2 |
|---|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.task} | ${r.f1} | ${r.f2} | ${r.same} | ${r.dur} | ${r.calls} | ${r.t} | ${r.tok} | ${r.note} |`).join("\n")}

## Observações
- **Convergência de escopo**: em 9 de 10 tarefas o arquivo alterado na r2 é o mesmo da r1 (T01 não altera nada nas duas). T09 manteve o conjunto src/config + src/client (+ testes na r2).
- **Testes**: baseline com falha (T02/T03/T04/T08/T09/T10) → 100% após a execução em todas.
- **T06** expandiu a suíte de 5 para 20 testes; **T08** criou o arquivo de documentação ausente; **T10** preservou o checkout (hash idêntico).
- **Custo**: não comparável entre rodadas (r1 sem telemetria; r2 com tokens de provedor mas sem preço por token — ver consolidação).
- Conclusão: a rodada 2 reproduziu os resultados funcionais da rodada 1 com telemetria completa, sem alterar o escopo das alterações.
`;

await writeFile(join(dir, "comparacao_r1_vs_r2.md"), md, "utf8");
console.log("comparacao_r1_vs_r2.md escrito");
