# Comparativo OpenCode — rodada 1 vs rodada 2

## Escopo
Rodada 1 (11/08, sem telemetria consistente) vs rodada 2 (telemetria completa: duração, tool calls, tokens db/provider). Mesmas fixtures, mesmos prompts, cópias limpas. Resultados: `results_Txx_opencode.json` (r1) e `results_Txx_opencode_r2.json` (r2).

| Tarefa | FilesChanged r1 | FilesChanged r2 | Δ escopo | Duração r2 | Tool calls r2 (L/E/G) | Testes antes→depois r2 | Tokens in r2 (provider) | Nota r2 |
|---|---|---|---|---|---|---|---|---|
| T01 | nenhum | nenhum | igual | 22.8 s | 6L/0E/0G | — | 281k | Run 2. First attempt with default glob did not match .mjs files and attempted an external read that was auto-rejected; retry with explicit file list completed. Hashes unchanged. Report correct and citations accurate. |
| T02 | src/users.mjs | src/users.mjs | igual | 56.5 s | 5L/1E/1G | 4→4/0 | 2749k | Fixed isValidEmail to require a dot after the at sign. Tests 4/4 and acceptance 2/2. |
| T03 | src/products.mjs | src/products.mjs | igual | 64.0 s | 5L/1E/1G | 3→3/0 | 978k | Pagination with page/pageSize validation. Tests 3/3 and acceptance 2/2. |
| T04 | src/products.mjs | src/products.mjs | igual | 76.6 s | 4L/1E/1G | 4→4/0 | 523k | Case-insensitive filter; empty query returns all; input preserved. Tests 4/4 and acceptance 3/3. |
| T05 | src/orders.mjs | src/orders.mjs | igual | 128.2 s | 5L/1E/0G | 4→4/0 | 640k | Refactor preserved public API and behavior; no mutation. |
| T06 | tests/service.test.mjs | tests/service.test.mjs | igual | 187.5 s | 5L/3E/1G | 5→20/0 | 222k | Expanded behavioral suite to 20 tests; implementation untouched. |
| T07 | package.json, package-lock.json | package.json, package-lock.json | igual | 97.9 s | 1L/1E/1G | — | 2313k | Run 2. Offline install, 2/2 tests, build ok, dist.txt=hello-world. src, tests and vendor unchanged. No blocked events. |
| T08 | docs/API.md | docs/API.md | igual | 163.0 s | 6L/1E/0G | 1→1/0 | 193k | Created missing docs/API.md; docs check and test passed. |
| T09 | src/config.mjs, src/client.mjs, tests/config.test.mjs, tests/acceptance.test.mjs | src/config.mjs, src/client.mjs, tests/acceptance.test.mjs, tests/config.test.mjs | igual | 175.1 s | 7L/4E/2G | 8→10/0 | 1371k | API_KEY via env getter with no fallback; clear error when missing; both paths validated locally. Error message is 'API_KEY environment variable is required'. |
| T10 | packages/catalog/src/products.mjs | packages/catalog/src/products.mjs | igual | 100.4 s | 6L/1E/2G | 4→4/0 | 5474k | Optional currency in catalog; checkout package untouched. Catalog 3/3 and checkout 1/1. |

## Observações
- **Convergência de escopo**: em 9 de 10 tarefas o arquivo alterado na r2 é o mesmo da r1 (T01 não altera nada nas duas). T09 manteve o conjunto src/config + src/client (+ testes na r2).
- **Testes**: baseline com falha (T02/T03/T04/T08/T09/T10) → 100% após a execução em todas.
- **T06** expandiu a suíte de 5 para 20 testes; **T08** criou o arquivo de documentação ausente; **T10** preservou o checkout (hash idêntico).
- **Custo**: não comparável entre rodadas (r1 sem telemetria; r2 com tokens de provedor mas sem preço por token — ver consolidação).
- Conclusão: a rodada 2 reproduziu os resultados funcionais da rodada 1 com telemetria completa, sem alterar o escopo das alterações.
