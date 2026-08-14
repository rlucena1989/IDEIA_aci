# Handoffs prontos para modelos de código

## Snapshot normativo

- contracts/registry: rc.7, 45 schemas JSON, 44 contratos de instância e 33 tipos de evento;
- SQLite DDL: 40 tabelas, 80 triggers, checksum `sha256:cb0ee9f4e21510505ee045ea89700918e9795de6907deee75fc9a65055a9bd84`;
- estado de implementação (verificado em 2026-08-14): diretório `p0` implementado — 201 testes verdes (`cd p0 && npm test`), Ajv 8.20.0 com lockfile, validators ESM gerados sob strict (`npm run check-drift` sem drift), typecheck habilitado (`npx tsc --noEmit`); remediações concluídas em 2026-08-14: WP-02B-R (P2-R05/R06) e WP-05-R (P0-R02); WP-09A concluído (44 fixtures válidas + mutações CT-X02..X10); WP-08 concluído (registry rc.7 + reducer puro `task-projection.ts`); WP-04 concluído (parse estrito pré-parse, JCS RFC 8785 e fingerprint jcs-sha256-v1 via Web Crypto — sem `node:crypto`; 34 vetores + 21 rejeições como oráculo); WP-09B em execução — catálogo parcial com 218 IDs da matriz, 57 executáveis (validators, budget, transições, source-scan, projeção, JCS-P0/JCS-R/CT-C) e 161 bloqueados com `blocked_by` explícito; **Onda A executável fechada para os pacotes concluídos, mas WP-09B não está concluído** — próximos passos: iniciar os pacotes elegíveis da Onda B conforme suas dependências e, a cada integração, desbloquear os casos correspondentes do WP-09B (WP-11/12/14/15/15B/15C/16/17/18/20/21/21B);
- gate de revisão (`cd review && npm run full`) em 2026-08-14: **8/8 PASS** (`status=pass`) — inclui o `p0-typecheck` e o `contract-build-policy` sob ESM 2020-12 + strict após a remediação WP-05-R. Evidência do gate em `review/reports/latest.json`;
- proteção operacional: o workspace possui Git, hook local de segredos, proteção contra push destrutivo e `main` limpo/alinhado com `origin/main`; `p0/` e `benchmark_fixture/P0_ALIGNMENT.md` estão versionados. Antes de cada nova edição por modelo, crie um snapshot/commit recuperável;
- segurança: SEC-INC-001 continua open e bloqueia WP-22/credenciais reais.

Entregue ao modelo o [protocolo vinculante de execucao](LLM_EXECUTION_PROTOCOL.md), o arquivo do WP, os documentos listados nele e nada que contenha credencial. Se qualquer contagem/checksum/assinatura divergir, pare e revalide o freeze em vez de adaptar silenciosamente.

## Índice de entregas

Consulta rápida dos registros de entrega gravados nos próprios handoffs (seções "Registro de entrega").
O estado atual (contagens e gate de hoje) está no Snapshot normativo acima e em
`docs/implementation/reviews/2026-08-13-p0-snapshot.md`.

Entregas de 2026-08-14 (com contagens verificadas e registro no handoff):

| Handoff | Entrega | Testes na entrega | Gate na entrega | Arquivos principais | Observação |
|---|---|---|---|---|---|
| [WP-02B-remediacao.md](WP-02B-remediacao.md) | WP-02B-R (P2-R05/R06) | **151/151** | 6 PASS/1 FAIL (P0-R02 aberto; 7/7 após WP-05-R) | `ids.ts`, `ids.test.ts`, `ids-opacity.test.ts` | queda de 166: consolidação em testes dirigidos por `id-vectors.json` (29 tipos × 29 válidos + 10 inválidos) |
| [WP-05.md](WP-05.md) | WP-05-R (P0-R02) | **152/152** | **7/7** (primeira execução) | `generate-contract-validators.mjs` + validators regenerados | remoção das 3 relaxações do `createAjv()`; 45 schemas compilam sob strict |
| [WP-08.md](WP-08.md) | WP-08 (projeção pura) | **192/192** | **7/7** | `event-registry.ts`, `task-projection.ts`, 2 testes (32) | desbloqueou 8 casos do WP-09B (`projection:reducer`); executáveis 15 → 23 |
| [WP-09A.md](WP-09A.md) | WP-09A (fixtures de forma) | **153/153** | **7/7** | 44 fixtures + `index.json` + `mutations.json` + `fixtures.test.ts` | corpus base do agente paralelo; teste endurecido (sem fallback; cobertura 44/44; keyword/instancePath das mutações CT-X02..X07/X09/X10) |
| [WP-04.md](WP-04.md) | WP-04 (JCS/fingerprints) | **201/201** | **7/7** | `strict-json.ts`, `jcs.ts`, `fingerprint.ts`, 2 testes (9) | desbloqueou 34 casos (JCS-P0/JCS-R/CT-C); executáveis 23 → 57 |

Em execução em 2026-08-14 (sem seção própria no handoff): **WP-09B** — catálogo parcial com 218 IDs da matriz; 57 executáveis / 161 bloqueados, cada bloqueio com `blocked_by` explícito. O pacote só poderá ser marcado concluído quando todos os casos tiverem oráculo e evidência de execução ou bloqueio formal conforme o DoD de `docs/implementation/handoffs/WP-09B.md`.

Evolução da contagem da suíte: 166 → **151** (WP-02B-R) → **152** (WP-05-R) → **153** (WP-09A) → 160 (WP-09B) → **192** (WP-08) → **201** (WP-04).

Concluídos anteriormente (verificados em 2026-08-13, sem contagem por WP registrada; na captura de
2026-08-13 a suíte tinha 96 testes e P0-R02 ainda estava em aberto): **WP-01**, **WP-02A**,
**WP-02B** (remediação WP-02B-R em 2026-08-14), **WP-03**, **WP-05** (base; remediação WP-05-R em
2026-08-14), **WP-05B**, **WP-06**, **WP-07A**, **WP-10** — ver
`docs/implementation/reviews/2026-08-13-p0-snapshot.md`.

Estes prompts da primeira onda podem ser entregues separadamente a modelos locais ou free tiers:

- [WP-01 — esqueleto isolado](WP-01.md) — **concluído** (verificado em 2026-08-13)
- [WP-02A — relógios injetáveis](WP-02A.md) — **concluído** (verificado em 2026-08-13)
- [WP-03 — máquina de estados](WP-03.md) — **concluído** (verificado em 2026-08-13)
- [WP-06 — gate de limite duro](WP-06.md) — **concluído** (verificado em 2026-08-13)
- [WP-10 — alinhamento documental da fixture](WP-10.md) — **concluído** (verificado em 2026-08-13)
- [WP-02B-R — remediação de opacidade dos IDs (P2-R05/R06)](WP-02B-remediacao.md) — **concluído em 2026-08-14** (opacidade nominal via `unique symbol` não exportado + testes dirigidos por `id-vectors.json` + prova compile-time em `ids-opacity.test.ts`)

Depois da primeira base, estes handoffs já possuem contrato, mas pedem revisão mais forte:

- [WP-02B — IDs tipados](WP-02B.md) — **concluído** (verificado em 2026-08-13; remediação WP-02B-R em 2026-08-14)
- [WP-04 — JSON canônico e fingerprints](WP-04.md) — **concluído em 2026-08-14** (`p0/src/security/`: `strict-json.ts`, `jcs.ts`, `fingerprint.ts` + testes em `p0/test/security/`; JCS-P0/JCS-R/CT-C desbloqueados no catálogo WP-09B)
- [WP-05 — validators JSON Schema](WP-05.md) — **concluído em 2026-08-14** (WP-05 original integrado; remediação WP-05-R/P0-R02: três relaxações removidas do `createAjv()`, gate 7/7)
- [WP-08 — projeção pura da tarefa](WP-08.md) — **concluído em 2026-08-14** (registry rc.7 + reducer puro `task-projection.ts`; 192/192; 8 casos desbloqueados no WP-09B)
- [WP-09A — fixtures de forma](WP-09A.md) — **concluído em 2026-08-14** (44 fixtures válidas + mutações CT-X02..X10)
- [WP-05B — tipos das ports](WP-05B.md) — **concluído** (verificado em 2026-08-13)
- [WP-07A — fakes de provider/tool/verifier/catalog](WP-07A.md) — **concluído** (verificado em 2026-08-13)

Segunda/terceira ondas, condicionadas aos pré-requisitos e ao perfil de autor indicado:

- [WP-07B — fake transacional do CatalogPort](WP-07B.md)
- [WP-07C — fake de ArtifactStore](WP-07C.md)
- [WP-09B — corpus semântico/transacional](WP-09B.md) — **em execução** (218 IDs catalogados; 57 executáveis / 161 bloqueados; não contar como concluído)
- [WP-11 — event store em memória](WP-11.md)
- [WP-12 — catálogo SQLite](WP-12.md)
- [WP-13 — ArtifactStore](WP-13.md)
- [WP-14 — approvals](WP-14.md)
- [WP-15 — policy/capabilities](WP-15.md)
- [WP-15B — admissão de GovernanceBundle](WP-15B.md)
- [WP-15C — budget engine multiunidade](WP-15C.md)
- [WP-16 — slice read-only](WP-16.md)
- [WP-17 — ToolBroker](WP-17.md)
- [WP-18 — filesystem/Git](WP-18.md)
- [WP-19 — process runner](WP-19.md)
- [WP-20 — slice mutável](WP-20.md)
- [WP-21 — faults/recovery/G2](WP-21.md)
- [WP-21B — runner de avaliação](WP-21B.md)
- [WP-22 — provider real](WP-22.md)

## Ordem

1. Execute e revise WP-01.
2. Integre WP-01.
3. WP-02A e WP-03 podem seguir em cópias separadas.
4. Depois de integrar WP-02A, execute WP-06.
5. WP-10 é independente e só altera documentação da fixture.
6. WP-02B segue WP-01.
7. WP-04 pode seguir WP-01 em cópia separada, mas só integra após revisão forte.
8. WP-05 segue WP-02B e requer autorização para instalar Ajv como dependência de runtime exata.
9. WP-08 segue WP-03; sua integração aguardava WP-05 — liberada em 2026-08-14 (validators integrados); WP-09A também está liberado (WP-05 integrado).
10. WP-09A só começa depois de WP-05 integrado.
11. WP-05B e WP-07A seguem WP-05; WP-07B só após WP-11; WP-07C segue WP-04/05B/07B.
12. WP-15B exige validação/canonicalização e WP-07C; WP-15C exige gate, fake transacional e event store.
13. WP-16 só fecha o slice read-only depois de WP-15B/15C; WP-17–20 só em fixture isolada.
14. WP-21B materializa EvaluationReport; WP-21 mede faults/G2; WP-22 só após ambos e SEC-INC-001 closed.

## Protocolo do operador

- Crie snapshot, commit ou cópia recuperável antes da primeira execução.
- Dê uma cópia, branch ou worktree exclusiva para cada modelo.
- Use baixa aleatoriedade quando a interface oferecer esse controle.
- Não forneça secrets nem credenciais ao contexto.
- Não permita rede ou shell fora da cópia de trabalho.
- Guarde prompt, identificação do modelo, parâmetros, diff e saída de testes.
- Não integre resposta textual como prova; execute os testes e faça a revisão independente.
- Integre um pacote por vez, na ordem de dependência.

O prompt WP-07 antigo em p0_prompts_primeira_onda.md foi substituído por WP-07A/WP-07B/WP-07C. Use os handoffs versionados deste diretório; WP-08 também deve usar registry rc.7.
