# Roteiro de auditoria: Onda A, byte a byte, linha a linha e end-to-end

**Objetivo:** produzir um veredito tecnico reproduzivel sobre a Onda A, sem extrapolar seus testes para persistencia real, efeitos externos, provider real ou Gate G2.
**Pre-condicao:** auditar uma copia congelada. `p0/` e outros artefatos podem estar fora do Git; o commit sozinho nao identifica o estado auditado.
**Saida obrigatoria:** manifesto de bytes, ledger de revisao por arquivo, resultados de comandos, relatorio de mutacoes, relatorio end-to-end, findings e veredito.

## 1. Decisao de prontidao para LLMs

**Confirmado com condicao:** as instrucoes estao prontas para LLMs quando a unidade de entrega contiver:

1. [Protocolo vinculante](../../implementation/handoffs/LLM_EXECUTION_PROTOCOL.md).
2. O handoff `WP-*.md` correspondente.
3. Somente os ADRs, contratos, vetores e testes que o handoff manda ler.
4. Um worktree congelado e a lista de arquivos autorizados.

Todos os WPs possuem handoff. Os WPs posteriores que dependem de componentes nao implementados continuam prontos para delegacao documental, mas ficam operacionalmente `blocked` ate seus prerequisitos. Nenhum LLM deve ser instruido a contornar esse bloqueio.

No estado verificado em 2026-08-14, os gates locais foram reproduzidos: `201/201` testes P0, `npx tsc --noEmit`, `npm run check-drift` e `cd review && npm run full` com 8/8 checks `PASS`. Essa evidencia confirma somente o ambiente e o conjunto de testes executados neste momento.

## 2. Regras do auditor

- Trabalhar em copia separada e nao executar casos destrutivos no workspace de desenvolvimento ou em dados reais.
- Tratar resultado sem hash, comando, exit code, ambiente e denominador como evidencia insuficiente.
- Registrar todo arquivo fora do Git; nao aceitar "mesmo estado" apenas por hash de commit.
- Separar `pass`, `fail`, `blocked`, `not_run` e `inconclusive`. Nunca converter ausencia de teste em `pass`.
- Usar dois revisores para controles de maior risco: canonicalizacao, validacao, event chain, redacao, policy e qualquer codigo gerado.

## 3. Fase 0: congelamento e cadeia de custodia

1. Criar copia somente para auditoria e registrar caminho, responsavel, UTC e motivo.
2. Registrar `git rev-parse HEAD`, `git status --short`, branch, log recente e diferencas nao rastreadas.
3. Gerar manifesto SHA-256 de todos os arquivos do escopo, incluindo `p0/`, `review/`, `docs/implementation/contracts/`, `docs/implementation/adr/`, `docs/implementation/handoffs/` e `benchmark_fixture/`.
4. Assinar ou armazenar o manifesto em local com controle de acesso separado do escritor auditado.
5. Proibir alteracoes na copia; se forem necessarias, gerar nova rodada com novo manifesto.

Exemplo de manifesto de bytes em PowerShell, executado na copia congelada:

```powershell
$auditRoot = "C:\audit\ideia-onda-a"
$scope = @("p0", "review", "docs\implementation", "benchmark_fixture")
Get-ChildItem $scope -Recurse -File |
  Sort-Object FullName |
  ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "{0}  {1}" -f $hash.Hash.ToLowerInvariant(), $_.FullName
  } | Set-Content -LiteralPath "$auditRoot\manifest-sha256.txt" -Encoding ascii
```

O auditor deve anexar tambem o hash de `package-lock.json`, cada schema, cada vetor e cada output gerado. Para arquivos que deveriam ser copias exatas, comparar hash e bytes, nao apenas JSON parseado.

## 4. Fase 1: auditoria byte a byte

| Alvo | Procedimento | Criterio |
|---|---|---|
| Schemas | comparar cada `p0/contracts/v1/*.schema.json` contra `docs/implementation/contracts/v1/` por SHA-256 e `fc /b` em amostra | 45 pares identicos; qualquer byte divergente reprova `schema-copy` |
| Validators gerados | rodar gerador em modo check; registrar hash antes/depois | zero drift; output nao e editado manualmente |
| Lockfile | conferir `package.json`, `package-lock.json`, integridade e arvore resolvida | versoes declaradas e lock reproduzem a instalacao permitida |
| JCS e fingerprints | comparar todos os bytes canonicos/digests contra vetores e rejeicoes | cada vetor coincide exatamente; cada rejeicao falha antes de hash |
| Registry e fixtures | comparar registry, mapa gerado, index e fixtures por hash e cardinalidade | IDs, ordem e contratos sem lacuna ou duplicata |
| Relatorios | hash do JSON do review e do output bruto do comando | relatorio corresponde a manifest e ao estado congelado |

Comandos complementares:

```powershell
Get-FileHash p0\contracts\v1\*.schema.json -Algorithm SHA256
Get-FileHash docs\implementation\contracts\v1\*.schema.json -Algorithm SHA256
node p0\scripts\generate-contract-validators.mjs --check
```

Para investigar divergencia, usar `fc /b <arquivo-a> <arquivo-b>` e preservar a saida. Nao corrigir o arquivo durante a auditoria.

## 5. Fase 2: revisao linha a linha

Criar um ledger com uma entrada para cada arquivo em `p0/src`, `p0/scripts`, `p0/test`, contratos, vetores, DDL aplicavel e arquivos de review. O inventario deve ser gerado da copia congelada; nao usar lista escrita manualmente.

| Campo do ledger | Conteudo |
|---|---|
| Arquivo e SHA-256 | identidade exata revisada |
| Revisor A/B | identidade e data UTC |
| Linhas revisadas | 1..EOF, sem intervalos omitidos |
| Autoridade | ADR, schema, vetor, RNF, WP ou teste correspondente |
| Funcao da linha | validacao, transformacao, I/O, estado, erro, teste ou gerado |
| Finding | ID, severidade, linha, impacto, evidencia e reteste |
| Resultado | aprovado, reprovado, bloqueado ou nao aplicavel |

Ordem obrigatoria de revisao:

1. `p0/package.json`, lockfile, `tsconfig.json` e scripts: runtime, ESM, dependencias e comandos.
2. Schemas, registry, invariantes, matrizes e vetores: contratos fechados, `$id`, enums, ranges, `additionalProperties`, referencias e mutacoes.
3. `strict-json.ts`, `jcs.ts`, `fingerprint.ts`: parser antes de `JSON.parse`, I-JSON, Unicode, numeros, ordenacao, domain separation, limites e erros fechados.
4. `ids.ts`, relogios, budget, state machine, transition e projection: opacidade, limites numericos, tempo, transicoes, cadeia, causacao, imutabilidade e repeticao deterministica.
5. validators e `validate.ts`: Ajv strict, ausencia de coercao/default/removeAdditional, registry fechado e mensagem redigida.
6. ports, errors, adapters e fakes: fronteira de I/O, copias defensivas, cancelamento, sequencia, erro nunca convertido em sucesso e ausencia de rede/filesystem nao autorizado.
7. todos os testes e casos semanticos: o teste exercita a implementacao real, assert e especifico e o caso negativo falha pela razao esperada.
8. review kit: scanner, policy, manifests, relatorio e condicoes em que um `warn`/`skip` nao bloqueia.

O auditor deve revisar manualmente todo codigo gerado ao menos uma vez por hash e por politica de import. Nao e necessario inferir intencao de cada linha gerada, mas qualquer permissao, import, avaliacao dinamica ou acesso a rede precisa ser explicado pelo gerador e pela politica.

## 6. Fase 3: testes de mutacao e adversariais

Cada mutacao ocorre em copia temporaria nova e e revertida descartando a copia. Nunca mutar o baseline congelado.

| Grupo | Mutacoes minimas | Esperado |
|---|---|---|
| Schema | remover required, incluir campo extra, trocar const/version, enum e `$ref` | validator/review falha com evidencia especifica |
| Canonicalizacao | chave duplicada, `NaN`, infinity, bigint, surrogate isolado, array esparso, object com prototype, limite excedido | rejeicao fechada antes de fingerprint |
| Fingerprint | alterar purpose, campo material, ordem de array, digest anterior | digest/validacao diverge conforme vetor |
| Event chain | apagar, duplicar, inserir, reordenar, alterar sequence, causacao e task | projection/replay rejeita sem resultado parcial |
| Budget | limite exato, overflow, `possibleOverage`, unidade invalida | nova operacao e bloqueada corretamente; nenhum numero silenciosamente arredonda |
| Validator generation | alterar validator gerado ou schema copiado | `check-drift` ou `schema-copy` falha |
| Policy scanner | introduzir import proibido, rede, `any`, `ts-ignore`, relogio global em domain | `source-policy` falha |
| Secrets | injetar canario sintetico nas entradas e em comentario/teste | scanner/redacao/relatorio impedem persistencia e publicacao no escopo coberto |

O relatorio de cada mutacao contem: patch aplicado, hash antes/depois, comando, exit code, finding esperado, finding observado e limpeza da copia temporaria.

## 7. Fase 4: execucao end-to-end no limite real da Onda A

A Onda A nao possui banco SQLite real, escrita de artifact, ToolBroker, provider real ou efeitos externos. O E2E correto valida o vertical slice deterministico atual; nao pode alegar G2.

| Cenario | Sequencia | Oraculo |
|---|---|---|
| E2E-A01 contrato | fixture valida -> validator standalone -> `validateContract` | aceita sem coerir, default ou remover campo |
| E2E-A02 rejeicao | mutation CT-X02..X10 -> validator gerado | keyword e instance path esperados |
| E2E-A03 cadeia | `task.created` -> eventos validos -> projection/replay | sequence, digest e estado final consistentes |
| E2E-A04 falha de cadeia | evento duplicado, fora de ordem, causacao futura ou digest errado | erro fechado; projection anterior preservada |
| E2E-A05 JCS | bytes/JSON -> strict parse -> JCS -> fingerprint | vetores exatos e rejections recusadas |
| E2E-A06 budget | reserva/uso sintetico no limite e acima | `hard_limit_reached`, sem inicio cobravel |
| E2E-A07 fakes | fake provider/tool/verifier com sucesso, erro, cancelamento e sink failure | chamadas gravadas, copias defensivas, erro/ausencia nunca viram sucesso |
| E2E-A08 review | estado congelado -> `npm run full` | 7 checks passam; relatorio e manifesto coincidem |

Cada cenario deve ser executado duas vezes no mesmo baseline. Divergencia de bytes, resultado ou ordem e finding. Para determinismo de tempo/UUID, usar somente fakes autorizados.

## 8. Fase 5: reconciliacao documental

Antes do veredito, reconciliar explicitamente:

1. Contagens de testes publicadas. No estado atual, a execucao reproduzida foi `201/201`; documentos anteriores registram numeros diferentes.
2. Estado de planejamento P0/Onda A versus estado dos gates G0/G1/G2. Fechamento de planejamento nao e promocao empirica.
3. Escopo de Onda A versus WPs ainda bloqueados para Onda B/C.
4. SEC-INC-001 e qualquer claim que envolva credencial real, provider real ou egress.
5. Arquivos nao rastreados que participaram da execucao e, portanto, precisam de manifesto proprio.

## 9. Formato do veredito

| Resultado | Condicao |
|---|---|
| `pass_limited` | todos os controles executados passam, escopo/limites explicitados e nenhum finding critico aberto no corpus auditado |
| `fail` | finding critico, mutacao aceita, reproducao divergente ou segredo canario exposto |
| `blocked` | ambiente, dependencia, corpus, permissao ou incidente aberto impede teste material |
| `inconclusive` | evidencia incompleta, manifesto ausente, contagem nao reconciliada ou auditor nao conseguiu reproduzir |

O veredito deve listar: commit e manifesto, ambiente, comandos, denominadores, testes `not_run`, findings, riscos aceitos, responsavel e data de reteste. Apenas `pass_limited` libera a implementacao posterior que dependa do controle confirmado; nunca libera alegacao fora do corpus e do ambiente auditados.
