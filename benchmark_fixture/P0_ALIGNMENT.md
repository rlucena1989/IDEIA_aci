# P0 Alignment — auditoria documental da fixture

> **Conteúdo histórico — snapshot de 13 de agosto de 2026.** As condições abaixo foram atualizadas posteriormente; preserve este documento como registro da auditoria original e das correções posteriores.

**Snapshot original:** 13 de agosto de 2026

**Escopo do WP-10:** inventariar divergências entre README, `run_t01.js`, `package.json` e o schema de resultados, sem editar executores, `package.json` ou `src/`.

## Método e limite do snapshot

O inventário distingue **arquivo físico** de **arquivo versionado**. A varredura foi feita com listagem explícita do filesystem e com `git ls-files`; usar somente `rg --files` seria insuficiente porque ele respeita `.gitignore`. Estado corrigido após o snapshot: a exceção `!benchmark_fixture/src/**/*.js` foi adicionada ao `.gitignore`, os quatro fontes estão versionados no commit `a88f76d`, e `benchmark_fixture/package-lock.json` foi gerado com `npm install --package-lock-only --ignore-scripts`.

Esta distinção é necessária: o padrão raiz `.gitignore` `**/src/**/*.js` agora é acompanhado da exceção específica da fixture. Os quatro fontes existem e são rastreados. A instalação foi preparada com lockfile; o runner T01 também foi executado ponta a ponta em checkout limpo com `node run_t01.js` e Enter via pipe. Essa execução prova a operabilidade do runner, mas não valida o contrato de resultados.

## 1. Inventário de divergências

### 1.1 Arquivos e reprodutibilidade

| Item | Estado físico | Estado Git | Consequência |
|---|---|---|---|
| `src/index.js` | existe | versionado (`a88f76d`) | servidor reproduzível |
| `src/email-validator.js` | existe | versionado (`a88f76d`) | cenário T02 reproduzível |
| `src/pagination.js` | existe | versionado (`a88f76d`) | cenário T03 reproduzível |
| `src/email-validator.test.js` | existe | versionado (`a88f76d`) | oráculo de regressão reproduzível |
| `results/` | ausente | não rastreado | é criado pelo runner; ainda não há resultado registrado |
| `validate_benchmark.mjs` | ausente | não rastreado | não existe validação executável dos resultados |
| `package-lock.json` | existe | gerado com `npm install --package-lock-only --ignore-scripts` | instalação reproduzível com `npm ci --ignore-scripts` |
| `node_modules/` | ausente | ignorado | `express` e `jest` estão como dependências não satisfeitas |

**Divergência crítica:** o README histórico listava os quatro arquivos de `src/` corretamente como arquivos físicos, mas dava a entender que compunham a fixture compartilhável. O problema não é ausência de fonte; é que as fontes foram omitidas do controle de versão pela regra global de ignore.

### 1.2 README, package e execução

| Afirmação/entrada | Evidência no snapshot | Situação |
|---|---|---|
| `npm test` | script `jest`; `jest` não está instalado | não executável neste checkout |
| `npm start` | script `node src/index.js`; fonte existe, mas não é versionada e `express` não está instalado | não verificado |
| `node run_t01.js` | executado em checkout limpo; primeiro chama `npm test` | operável; registro ainda não adere ao schema |
| “fixture pronta para execução manual” | falta lockfile, fontes rastreadas e execução limpa registrada | afirmação não demonstrada |
| “paginação correta” | não há teste de contrato nem execução registrada | afirmação não demonstrada |

### 1.3 Resultado emitido por `run_t01.js`

O [schema de resultados, linhas 5–31](../docs/research/benchmarks/schema_resultados.md) exige os campos abaixo. O runner atual diverge assim:

| Campo do runner | Regra do schema | Situação |
|---|---|---|
| `durationMs` | não listado | não deve compor o resultado canônico |
| `status: 'success'` | enum `success|partial|failed|rolled_back` | valor atual é permitido, mas é fixado sem evidência |
| `cost: 0` | objeto `{ amount, currency }` | estrutura divergente |
| `tokensInput` / `tokensOutput` | `inputTokens` / `outputTokens` | nomes divergentes |
| `interventions` | `humanInterventions` | nome divergente |
| `score: 1` | `reviewScore` de 0–100; fórmula na seção Score | nome e escala divergentes |
| `reason` | não listado | não deve compor o resultado canônico |
| campos restantes | `toolVersion`, `baseCommit`, `workspace`, contadores, resultados de teste, findings, diff, rollback e `notes` | ausentes |

O schema no estudo é uma representação Markdown, não um JSON Schema executável. Logo, “validar contra o schema” ainda exige uma decisão de contrato: criar um JSON Schema versionado ou um validador manual com testes de aceitação.

## 2. Status: mapeamentos permitidos e não permitidos

O WP-10 exige fonte para cada mapeamento e proíbe transformar `inconclusivo` em sucesso ou falha. A única fonte que define os status do resultado de benchmark é o campo `status` do [schema de resultados](../docs/research/benchmarks/schema_resultados.md#schema-de-resultados-do-benchmark).

### 2.1 Rótulos canônicos declarados pelo schema

| Rótulo | Destino | Fonte normativa |
|---|---|---|
| `success` | `success` | `schema_resultados.md`, campo `status` |
| `partial` | `partial` | `schema_resultados.md`, campo `status` |
| `failed` | `failed` | `schema_resultados.md`, campo `status` |
| `rolled_back` | `rolled_back` | `schema_resultados.md`, campo `status` |

Não há, nesse documento, mapeamento entre esses rótulos de benchmark e os estados do domínio P0 (`sucesso_verificado`, `falha`, `bloqueado`, `cancelado`, `inconclusivo`). Tal equivalência precisa de decisão explícita posterior.

### 2.2 Valores efetivos do runner que não podem ser mapeados automaticamente

| Valor em `run_t01.js` | Situação | Motivo |
|---|---|---|
| `success` | pode permanecer `success` | valor literal previsto pelo schema |
| `failure` | **sem mapeamento normativo** | o schema usa `failed`, mas não define equivalência semântica entre os dois |
| `timeout` | **sem mapeamento normativo** | não há `timeout` no schema; resultado externo incerto é `inconclusivo` no P0, mas o schema não oferece esse valor |
| `error` | **sem mapeamento normativo** | “erro” não informa se houve rollback, falha determinada ou estado desconhecido |

Em especial, `timeout` e `error` **não podem ser traduzidos para `rolled_back`**: rollback exige que a compensação tenha ocorrido e sido registrada; ele não é sinônimo de incerteza. A decisão futura deve preservar a causa em `notes`, registrar se houve rollback e escolher o status somente após uma matriz de semântica aprovada.

## 3. Mudanças futuras necessárias — fora do WP-10

### A. Recuperar a fixture como artefato reproduzível

1. Criar uma exceção específica no `.gitignore` para `benchmark_fixture/src/**/*.js`, revisar o conteúdo e versionar os quatro fontes.
2. Gerar `package-lock.json` com scripts de dependência desabilitados; validar `npm ci --ignore-scripts` em cópia limpa.
3. Executar `npm test -- --runInBand` e registrar o resultado bruto. O baseline esperado de T02 deve falhar somente nos casos que representam o bug, não por dependência ausente.
4. Não registrar `results/` como evidência válida até que o contrato de resultado esteja implementado e o runner seja corrigido.

### B. Congelar o contrato de resultado antes de modificar o runner

1. Converter o schema Markdown em schema JSON versionado ou especificação de validador com testes.
2. Decidir, com fonte normativa, a semântica de `failure`, `timeout` e `error`; até lá, o runner deve falhar fechado para esses valores em vez de inventar `rolled_back`.
3. Definir como uma execução T01 read-only prova: resposta preservada/redigida, hashes/diff antes e depois, testes baseline e revisão humana.

### C. Corrigir `run_t01.js` somente após A e B

1. Emitir somente campos do contrato e todos os obrigatórios.
2. Substituir `tokensInput`, `tokensOutput`, `interventions` e `score` pelos campos canônicos; remover campos sem contrato do JSON canônico ou registrá-los em log separado.
3. Nunca fixar `status: 'success'`; calcular/aprovar o resultado a partir das evidências e falhar fechado quando elas faltarem.
4. Registrar `baseCommit`, workspace isolado, resultados antes/depois, testes de aceite, diff/out-of-scope, rollback e findings de segurança.
5. Adicionar validador local e testes negativos para campo ausente, tipo incorreto, status não permitido e resultado com sucesso apesar de finding/diff proibido.

### D. Completar os cenários

1. T02: manter o bug deliberado no baseline, executar a regressão antes/depois e registrar a alteração permitida.
2. T03: adicionar testes de contrato para paginação, limites e entradas inválidas antes de declarar a rota correta.
3. T04–T10: definir objetivo, escopo, oráculo, precondições, resultado esperado e regra de rollback antes de implementação.

## 4. Conclusão

O WP-10 original precisava de correção: sua auditoria confundiu arquivos ignorados com diretório vazio e inventou uma equivalência de status não autorizada. Após esta revisão documental, os fontes estão versionados, há lockfile e a fixture foi instalada/testada; o runner T01 também foi executado em checkout limpo. T01 permanece operável, mas o registro produzido ainda não adere ao schema; T02–T03 continuam fora deste ajuste e T04–T10 não existem como tarefas implementadas.
