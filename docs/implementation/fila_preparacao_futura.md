# Fila de preparação para implementações futuras

**Atualizada:** 2026-08-13

## Primeira onda delegável

| Pacote | Pode começar | Autor mínimo | Condição de integração |
|---|---|---|---|
| WP-01 | agora | L | revisão F |
| WP-02A | após WP-01 | L | revisão F |
| WP-02B | após WP-01 | L | vetores de ID + revisão F |
| WP-03 | após WP-01 | L | tabela completa + revisão F/S |
| WP-04 | após WP-01, em paralelo | F | todos os vetores + revisão S |
| WP-05 | após WP-02B | F/S | Ajv 8.20.0 autorizado, lock e revisão S |
| WP-06 | após WP-02A | L | revisão F |
| WP-08 | após WP-03 | L/F | integrar somente depois de WP-05 |
| WP-09A | após WP-05 | L | validators reais executados |
| WP-10 | agora | L | revisão F |

L, F e S seguem p0_prontidao_delegacao.md.

## Horizonte posterior já especificado

| Pacote | Dono | Pré-condição dominante |
|---|---|---|
| WP-05B/07A | L/F | WP-05 integrado |
| WP-07B/11 | F | validators, reducer e canonicalizer integrados |
| WP-07C | L/F | WP-04/05B/07B; não simula garantia de filesystem |
| WP-09B | F/S | componente-alvo existente; casos bloqueados não contam como pass |
| WP-12/13/14/15 | F/S | shared suites, MP aplicável e revisão S |
| WP-15B | F + revisão S | canonicalizer/validators/WP-07B/07C; governance fixtures |
| WP-15C | S; núcleo puro pode ser F | gate + Catalog transacional; accounting dentro da transação |
| WP-16 | F + revisão S | 07A/B, 08, 11 e 15/15B/15C |
| WP-17–20 | S | sandbox/capabilities/approvals e harness destrutível isolado |
| WP-21B | F/S + revisão S | corpus/MP versionados e slice read-only |
| WP-21 | S independente | WP-20/21B, MP e fault harness |
| WP-22 | S independente | WP-15C/16/21/21B, incidente fechado e egress aprovado |

Cada linha possui prompt autocontido em [handoffs](handoffs/README.md). Isso significa prontidão do pacote para distribuição quando suas dependências passarem, não autoriza iniciá-lo antes.

## Preparação documental seguinte

| Ordem | Entrega preparatória | Desbloqueia | Evidência necessária |
|---:|---|---|---|
| 1 | governança v2 + schema + admission protocol/WP-15B — concluída | policy/provider boundaries e unidade de promoção | papéis reais/evento organizacional/G0-G1 pendentes |
| 2 | avaliação v2 + schemas/gates/MP/WP-21B — concluída | G2 e relatório versionado | corpus/runner/baseline ainda pendentes |
| 3 | contexto/RAG v2 + schemas/eventos — concluída | ProviderRequest, minimização e provenance | corpus/implementação C0/C1 pendentes |
| 4 | ciclo agentic + ports/registry — concluída | WP-05B/07A/16 | fakes/implementação pendentes |
| 5 | custos + ADR-011/schemas/DDL — concluída | multiunidade, reserva e conciliação | limits/PriceBook/provider probes pendentes |
| 6 | threat model v2 — concluído documentalmente | ToolBroker, approvals e egress | estudo cronológico 14; corpus ainda pendente |
| 7 | sandbox v2 + ADR-012/schemas — concluído | process/filesystem/Git adapters | controles/PoC por SO pendentes |
| 8 | DDL e fault profile SQLite — concluído documentalmente | WP-11/WP-12 | implementação DB-F pendente |
| 9 | artifact lifecycle — concluído documentalmente | WP-13 | limites MP-P0 + ART-F pendentes |
| 10 | recovery — concluído documentalmente | WP-17–WP-21 | implementação REC-F pendente |
| 11 | preencher MP-P0 e fixtures | limites, QG-05/06, ART/JSON/process | medição baseline aprovada |
| 12 | corpus semântico/adversarial | WP-09B/15/21 | casos materializados e mutantes |
| 13 | PoC de sandbox por SO | WP-18–20 | SBX-T/C + evidence artifact |
| 14 | fault harness isolado | EG-4/G2 | DB/ART/REC e processo/provider faults |
| 15 | piloto G0/G1 | decisão de P1 | entrevistas/tarefas emparelhadas |

## Bloqueios atuais por pacote

| Pacote | Bloqueio real |
|---|---|
| WP-05B/07A | apenas integração de WP-05 e tipos; contratos já congelados |
| WP-07B | depende do modelo de eventos WP-11 e shared suite |
| WP-07C | depende do fake Catalog atual e shared suite de artifact |
| WP-11 | implementações WP-03/04/05 e testes de cadeia ainda ausentes |
| WP-12 | DDL/PRAGMAs definidos; implementação e DB-F/MP faltam |
| WP-13 | lifecycle definido; números de quota/TTL/data-root e ART-F faltam |
| WP-14/15 | store transacional e policy corpus ainda ausentes |
| WP-15B | governance root/fixtures e dependências de validação/artifact ainda ausentes |
| WP-15C | accounting/reservation ainda não implementados; exige concorrência transacional |
| WP-16 | ProviderPort/fake, event store, admission e budget não integrados |
| WP-17–20 | contratos prontos; controles host/process/fs ainda não demonstrados |
| WP-21 | gate/fault matrix pronta; MP/corpus/implementação ausentes |
| WP-21B | corpus/split/runner e MP aprovado ainda ausentes |
| WP-22 | provider real/egress/PriceBook não escolhidos e SEC-INC-001 open |

## Regra de avanço

Preparação documental pode produzir schema, vetor, corpus, ADR e handoff. Ela não autoriza implementação de efeito antes de:

- contrato congelado;
- teste independente pré-escrito;
- port definida;
- ameaça e falha aplicáveis cobertas;
- ordem transacional explícita;
- revisor compatível com o risco.
