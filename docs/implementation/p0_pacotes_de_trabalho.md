# P0 — Pacotes de trabalho delegáveis

## Base obrigatória

- ADR-001 define runtime, TypeScript, testes e acesso ao catálogo.
- ADR-002 isola o código anterior.
- O destino de toda implementação nova é p0.
- L, F e S significam as classes definidas em p0_prontidao_delegacao.md.

## Dependências

~~~mermaid
flowchart TD
    W01["WP-01 Esqueleto"] --> W02A["WP-02A Relógio"]
    W01 --> W03["WP-03 Estados"]
    W01 --> W02B["WP-02B Identificadores"]
    W02B --> W05["WP-05 Contratos"]
    W02A --> W06["WP-06 Limite duro"]
    W05 --> W05B["WP-05B Ports"]
    W05B --> W07A["WP-07A Port fakes"]
    W05 --> W08
    W03 --> W08["WP-08 Projeções"]
    W01 --> W04["WP-04 Canonicalização"]
    W03 --> W11["WP-11 Event store memória"]
    W04 --> W11
    W05 --> W11
    W11 --> W07B["WP-07B Catalog fake"]
    W07B --> W07C["WP-07C Artifact fake"]
    W04 --> W07C
    W11 --> W12["WP-12 Catálogo SQLite"]
    W04 --> W13["WP-13 Artefatos"]
    W12 --> W13
    W11 --> W14["WP-14 Aprovações"]
    W12 --> W14
    W05 --> W14
    W04 --> W14
    W14 --> W15["WP-15 Política"]
    W04 --> W15B["WP-15B Governança"]
    W05 --> W15B
    W07C --> W15B
    W06 --> W15C["WP-15C Budget engine"]
    W07B --> W15C
    W11 --> W15C
    W07A --> W16["WP-16 Slice read-only"]
    W07B --> W16
    W07C --> W16
    W08 --> W16
    W11 --> W16
    W15 --> W16
    W15B --> W16
    W15C --> W16
    W12 --> W17["WP-17 ToolBroker e efeitos"]
    W13 --> W17
    W14 --> W17
    W15 --> W17
    W15B --> W17
    W15C --> W17
    W17 --> W18["WP-18 Arquivos e Git"]
    W17 --> W19["WP-19 Processos e cancelamento"]
    W18 --> W20["WP-20 Slice mutável"]
    W19 --> W20
    W20 --> W21["WP-21 Gate G2"]
    W16 --> W21B["WP-21B EvaluationReport"]
    W13 --> W21B
    W15B --> W21B
    W15C --> W21B
    W21B --> W21
    W21 --> W22["WP-22 Provider real"]
~~~

WP-09 e WP-10 podem avançar em paralelo, desde que não alterem contratos normativos.

## Rastreabilidade da primeira liberação

| Pacote | Fonte principal | Evidência parcial pretendida |
|---|---|---|
| WP-01 | ADR-001; RNF-014.2; RNF-017.1; RNF-018.1–2 | Base local isolada e executável; ainda não prova build de release |
| WP-02A | tarefas_longas_assincronas, seção 9 | Separação testável entre UTC de auditoria e relógio monotônico |
| WP-03 | RF-004.2; RNF-012.1; RNF-019.2 | Vocabulário final e rejeição de transições não declaradas |
| WP-06 | RNF-021.1–2 | Nenhuma nova operação cobrável começa no limite duro |
| WP-10 | RNF-018.3; RNF-019.2 | Fixture deixa de confundir rótulo genérico com estado final do produto |

Essa tabela é rastreabilidade, não declaração de conformidade. Os requisitos só fecham com seus cenários completos e integração.

## Onda A — determinística e de baixo risco

| ID | Entrega | Classe autora | Revisão | Pré-requisito |
|---|---|---|---|---|
| WP-01 | Esqueleto p0, scripts, configuração e smoke test | L | F | nenhum |
| WP-02A | Clock de auditoria, relógio monotônico e fake | L | F | WP-01 |
| WP-02B | IDs e validadores | L | S/F | WP-01; ADR-003 e vetores concluídos |
| WP-03 | Estados e transições puras | L | S/F | WP-01 |
| WP-05 | Contratos e validators standalone | F | S | WP-02B; schemas v1 e ADR-005 concluídos |
| WP-05B | Tipos TypeScript das ports congeladas | L/F | F | WP-05; ADR-006/007/012 |
| WP-06 | Gate puro de limite duro | L | F | WP-02A |
| WP-07A | Fakes determinísticos de Provider/Tool/Verifier/ToolCatalog | L | F | WP-05B |
| WP-08 | Projeção pura da tarefa | L | F | WP-03; taxonomia pronta; integração após WP-05 |
| WP-09A | Fixtures schema-valid e mutações de forma | L | F | WP-05 integrado |
| WP-09B | Corpus semântico e transacional | F/S | S | componentes WP-11 a WP-17 conforme o caso |
| WP-10 | Alinhamento documental do benchmark_fixture | L | F | nenhum |

## Onda B — núcleo persistente e slice read-only

| ID | Entrega | Classe autora | Revisão | Pré-requisito |
|---|---|---|---|---|
| WP-04 | JSON estrito, JCS, hash e vetores | F | S | WP-01; integração de fingerprints depende de WP-05 |
| WP-11 | Event store em memória com invariantes | F | S | WP-03, WP-04, WP-05 |
| WP-07B | Fake transacional do CatalogPort | F | S | WP-05B, WP-08, WP-11 |
| WP-07C | Fake de ArtifactStorePort | L/F | F/S | WP-04, WP-05B, WP-07B |
| WP-12 | CatalogPort, migrações e adaptador node:sqlite | S | S independente | WP-11 |
| WP-13 | Store de artefatos com escrita atômica | S | S independente | WP-04, WP-12 |
| WP-14 | Aprovações de uso único vinculadas à intenção | S | S independente | WP-04, WP-05, WP-12 |
| WP-15 | Política allow, deny e approval_required | S | S independente | WP-14 |
| WP-15B | Loader/admissão de GovernanceBundle aprovado | F | S independente | WP-02A, WP-04, WP-05, WP-07B/07C; real após WP-13 |
| WP-15C | Budget engine, reserva e conciliação multiunidade | S (núcleo puro F) | S independente | WP-06, WP-07B, WP-11; SQLite após WP-12 |
| WP-16 | Slice CLI read-only com fakes | F | S | WP-07A/B/C, WP-08, WP-11, WP-15/15B/15C |

## Onda C — efeitos, recuperação e gate

| ID | Entrega | Classe autora | Revisão | Pré-requisito |
|---|---|---|---|---|
| WP-17 | ToolBroker, intenção e diário de efeitos | S | S independente | WP-12–15C |
| WP-18 | Caminhos, arquivo, patch e Git transacional | S | S independente | WP-17 |
| WP-19 | Process runner, streaming, timeout e cancelamento | S | S independente | WP-17 |
| WP-20 | Slice mutável com verificação e rollback | S | S independente | WP-18, WP-19 |
| WP-21B | Runner, artifacts e EvaluationReport | F/S | S independente | WP-13, WP-15B/15C, WP-16, corpus e MP |
| WP-21 | Gate G2, faults, recuperação e reconciliação | S | S independente | WP-20, WP-21B |
| WP-22 | Provider real e gestão de credenciais | S | S independente | WP-15C, WP-16, WP-21/21B e threat model |

## Estado das decisões de integração

| Decisão | Estado em 2026-08-13 | Bloqueia |
|---|---|---|
| IDs e representação textual | fechada por ADR-003 | implementação WP-02B, não seu início |
| Schemas de manifest, evento, intenção e uso | freeze documental v1 | WP-11 até WP-05 passar |
| Algoritmo e vetores de JSON canônico | fechada por ADR-004 | WP-11 até WP-04 passar |
| Engine de JSON Schema | fechada provisoriamente por ADR-005 | WP-07+ até WP-05 passar |
| Semântica de aprovação e consumo | forma e invariantes definidas; transação ainda não provada | WP-14, WP-15, WP-17 |
| Taxonomia task-scoped | rc.7 com 33 tipos e constraints condicionais; implementação ausente | WP-08/11 devem espelhar; 1.0 só após suites |
| Interfaces das ports | congeladas por ADR-006/contracts/ports_v1 | desbloqueia WP-05B/07A; Catalog exige WP-11 |
| Threat model e sandbox | estudos v2 + ADR-012/contracts; controles host não provados | WP-17 a WP-22 exigem corpus/PoC |
| SQLite, artifacts e recovery | ADR-008–010 + DDL/protocol; faults não executados | WP-12/13/21 |
| Governança/admissão | schemas + protocolo de pinning sem ciclo; papéis/MP/evidência reais ausentes | WP-15B/21B e G0/G1 |
| Custos multiunidade/decimais | ADR-011 + schemas; limites/PriceBook reais ausentes | WP-06/12/15C/22 |
| Métricas e thresholds | gate matrix + MP-P0 draft; baseline não aprovado | WP-21/21B e release |

## Contrato de saída de cada entrega

Toda resposta de implementação deve incluir:

1. resumo objetivo;
2. lista exata de arquivos alterados;
3. comandos de teste executados e resultados;
4. requisitos ou IDs atendidos;
5. limitações e casos não implementados;
6. confirmação de que não houve edição fora do escopo.

## Regra de parada

O modelo deve parar sem editar quando:

- faltar um arquivo normativo citado;
- houver conflito entre contrato e teste;
- for necessária nova dependência;
- a tarefa exigir decisão arquitetural não fornecida;
- a edição ultrapassar o diretório autorizado;
- o comportamento seguro depender de suposição.
