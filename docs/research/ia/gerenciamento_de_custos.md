# Gerenciamento de custos — orçamento multiunidade e conciliação

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 13 de agosto de 2026  
**Data de corte das fontes:** 13 de agosto de 2026  
**Versão:** 2.0  
**Status:** contrato documental; price books, limites, reserva e conciliação ainda não implementados  
**Método:** [Protocolo de pesquisa rigorosa](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Base:** [Governança](governanca_de_ia.md), [avaliação](avaliacao_e_benchmarks.md), [ciclo agentic](estado_e_ciclo_agentic.md), [RF](../produto/requisitos_funcionais.md), [RNF](../produto/requisitos_nao_funcionais.md) e [contratos v1](../../implementation/contracts/README.md)

## 1. Resultado da revisão

O texto original tratava orçamento como uma lista de otimizações e apresentava uma fórmula única por token. Isso não cobre quotas gratuitas, cache/storage, chamada/tool, tempo de compute, preço em faixas, imposto/crédito, uso atrasado, reserva pessimista, currency conversion ou custo local. Também não separava uso observado, preço aplicado, estimativa, cobrança e custo efetivo.

Decisão:

> **o P0 governa capacidade por múltiplos medidores independentes e nunca mistura unidades implicitamente. Antes de iniciar operação, reserva o pior caso autorizado para medidores duros; depois registra uso reportado/medido/estimado/unknown e concilia sem apagar a estimativa anterior. Moeda é apenas um dos medidores e não substitui limites de calls, tokens, tempo, output ou recurso local.**

Preço volátil fica em `PriceBookSnapshot` datado e digerido. O produto não promete impedir toda cobrança: uso em voo, arredondamento, atraso do provider ou request ambígua pode produzir overage explícito.

## 2. Perguntas e limites

1. Que recursos precisam de hard limit mesmo quando monetariamente gratuitos?
2. Quanto reservar antes de uma operação cujo uso final é desconhecido?
3. Como distinguir medição, estimativa, preço de lista, cobrança e custo efetivo?
4. Como tratar timeout, cancelamento, retry, cache e uso reportado tardiamente?
5. Como comparar endpoint local, free tier e API paga sem fingir equivalência?
6. Que custo pode influenciar routing sem reduzir privacidade, segurança ou qualidade?

Fora do P0: chargeback contábil, invoice ingestion automático, amortização financeira completa, impostos por jurisdição, FX automático, compromissos/reservas empresariais, billing multi-tenant e otimização autônoma multi-provider.

## 3. Vocabulário

| Termo | Definição |
|---|---|
| meter | dimensão de recurso com unidade e escopo próprios |
| limit | teto autorizado para um meter numa janela/escopo |
| accounted | uso confirmado para enforcement local |
| reserved | capacidade comprometida para operações em voo |
| estimated | quantidade/custo calculado, não confirmado pelo provider/fatura |
| reported | valor devolvido/declarado pela API/provider |
| measured | valor observado pelo runtime local sob método declarado |
| billed cost | cobrança usada como base de fatura, quando disponível |
| list cost | preço de lista × quantidade de pricing |
| effective cost | custo alocado após descontos/prepagamentos conforme método |
| possible overage | uso pode exceder teto por operação em voo/ambígua/atrasada |
| reconciliation | vincular observações/cobranças posteriores sem sobrescrever registros anteriores |

A distinção entre list, billed e effective cost é consistente com a taxonomia FOCUS de billing, usada aqui apenas como vocabulário de evolução; P0 não implementa dataset FOCUS completo ([S9]).

## 4. Medidores e unidades

### 4.1 Medidores mínimos

| Família | Exemplos de unidade | Fonte preferida |
|---|---|---|
| request | `model_call`, `tool_call`, `retry`, `replan` | coordinator/event store |
| modelo | `input_token`, `cached_input_token`, `output_token`, `reasoning_token` | provider report; estimator separado |
| contexto/dado | `context_byte`, `egress_byte`, `artifact_byte` | runtime local |
| tempo | `wall_ms`, `model_ms`, `tool_ms`, `cpu_ms` | relógio monotônico/runtime |
| recurso local | `cpu_ms`, `gpu_ms`, `peak_ram_byte`, `disk_byte_ms` | runtime/OS quando disponível |
| ferramenta | `search_query`, `embedding_token`, `sandbox_ms` | tool/provider específico |
| moeda | `currency_minor` por ISO code | price book/charge report |

Não somar input token com output token nem token de modelos/tokenizers distintos sem regra explícita. `total_token` pode ser preservado como report do provider, mas não substitui breakdown quando o provider o fornece.

### 4.2 Identidade de meter

`meter_id` inclui namespace, unit, provider/service/SKU quando aplicável, model/revision ou tokenizer, scope e version. Exemplo conceitual: `provider:lmstudio:model:<fingerprint>:input_token:v1`.

Valores monetários usam inteiros em unidade menor e moeda; quantidades fracionárias/tiered exigem representação decimal exata no price book, nunca binary float. Conversão cambial cria novo registro com fonte, timestamp, par e método; não altera a moeda original.

## 5. `BudgetSet`

O manifest v1 contém um único budget. A evolução necessária é um `BudgetSet` versionado; não se muda a semântica de v1 em silêncio.

| Campo | Regra |
|---|---|
| `budget_set_id`/fingerprint | snapshot imutável ligado ao bundle/task |
| `limits[]` | ao menos um; meter IDs únicos por escopo/janela |
| `hard_limit` | inteiro/decimal exato não negativo na unidade do meter |
| `soft_thresholds[]` | estritamente crescentes e ≤ hard limit |
| `window` | task/step/request ou período explícito |
| `action` | warn, require_approval, stop_new_work; hard sempre fecha admissão |
| `reservation_policy` | worst_case, fixed, estimator+margin ou none justificado |
| `unknown_policy` | reserve_until_reconciled, block ou bounded_assumption |
| `price_book_ref` | obrigatório somente para meter monetário estimado |

Hard limit zero é válido e bloqueia a primeira operação consumidora. Soft alert não autoriza ultrapassar hard. Limites de projeto/usuário/tenant são P1; P0 aplica task/bundle e pode adicionar step/request.

## 6. Admissão e reserva

Para operação `op` e cada meter duro `m`:

`available(m) = hard_limit(m) - accounted(m) - reserved(m)`

A operação só inicia se `reservation(op,m) ≤ available(m)` para todos os medidores necessários. A avaliação é atômica no store local para impedir duas operações de consumirem a mesma capacidade.

### Política de reserva

| Operação | Reserva inicial |
|---|---|
| provider request | 1 call + input conhecido/estimado + max output + tool/provider fees possíveis |
| tool/process | 1 call + timeout × recursos limitados + output/disk ceilings |
| retry/replan | novo call/attempt e seu pior caso; nunca “gratuito” |
| uso sem ceiling confiável | bloquear ou usar limite fixo aprovado; não reservar infinito silenciosamente |

Se preço tiered depende do acumulado, reservar pelo maior custo aplicável dentro do intervalo possível, salvo algoritmo versionado mais exato. Cache hit é otimização possível, não premissa de admissão, a menos que o provider ofereça garantia verificável.

## 7. Ledger append-only

### Registros

| Tipo | Função |
|---|---|
| `budget.reserved` | compromete quantidade antes da operação |
| `usage.observed` | reported/measured/estimated/unknown por meter |
| `budget.released` | libera parte não usada com vínculo à reserva |
| `cost.estimated` | aplica price book a usage/quantidade prevista |
| `cost.reported` | custo/charge retornado pelo provider quando existir |
| `cost.reconciled` | liga fatura/export posterior à execução e registra delta |
| `budget.overage_detected` | delta acima do teto ou uso após ambiguidade |
| `price_book.snapshotted` | fonte/escopo/validade/hash do preço |

Correção gera registro compensatório/relacionado. Não update/delete de valor histórico. Uma observação pode ter `classification = reported|measured|estimated|unknown`; `reported` não significa faturado nem verificado.

### Chaves

Todo registro liga task, step/attempt/call, provider/model/tool, meter, quantity, timestamps, source, classification e correlation. Dedup usa provider usage/charge ID quando confiável; sem ID, reconciliation marca incerteza em vez de fundir por semelhança.

## 8. Conciliação

```mermaid
flowchart LR
    A["Admitir"] --> R["Reservar"]
    R --> I["Operação em voo"]
    I --> O["Observar uso"]
    O --> S["Liquidar/release"]
    S --> L["Aplicar price book"]
    L --> P["Custo estimado"]
    P --> C["Charge/fatura posterior"]
    C --> D["Reconciliar delta"]
```

| Caso | Tratamento |
|---|---|
| uso final reportado | registrar reported, liberar reserva excedente, contabilizar quantity |
| provider não reporta | manter measured/estimated separado; release conforme policy conservadora |
| timeout após aceite | call/usage `unknown`, reserva retida ou converted to possible overage |
| cancel ack sem usage | não assumir zero; seguir unknown policy |
| report tardio | append e reconciliar; pode gerar overage posterior |
| retry | cada request tem uso próprio; custo soma todas as tentativas |
| duplicata de report | dedup por ID/contract; divergência vira incidente |
| price book expira | uso continua registrado; custo estimado fica unknown até snapshot válido |
| invoice diverge | preservar ambos e delta/explicação; invoice não reescreve evento de execução |

## 9. `PriceBookSnapshot`

| Campo | Conteúdo |
|---|---|
| identidade | provider, service/model/SKU, plan/tier, região, moeda |
| fonte | URL/API/contrato, consulted/effective/expiry timestamps |
| pricing | unit, quantity scale, list/contracted rate, tiers, cache/batch/storage/tool rules |
| condições | free allowance, minimum, rounding, surcharge, tax inclusion, eligibility |
| provenance | collector/version, raw artifact digest e normalization version |
| confidence | official_published, contract, invoice, manual_unverified |

Preço é avaliado na unidade de pricing definida; `1M tokens` não vira float: armazenar numerator/denominator decimal exato. Snapshot só calcula no escopo de plano/região/tier indicado. Página oficial prova preço publicado, não a cobrança real da conta.

O arquivo [snapshot_providers_custos.md](snapshot_providers_custos.md) permanece somente como rascunho histórico não verificado; seus valores não podem alimentar código, budget ou comparação sem nova coleta oficial e artifact digest.

## 10. Local, free tier e API paga

| Perfil | Meter duro mínimo | Custo monetário | Risco oculto |
|---|---|---|---|
| LM Studio/local | calls, tokens/context, wall/GPU/CPU/RAM/output | pode ser zero marginal na task; hardware/energia/operação não são zero | thermal/load, capacidade, licença, quantização, host |
| free tier remoto | calls/rate/tokens/egress + currency zero/unknown | cobrança pode ser zero dentro da quota | dados usados segundo termos, quota mutável, bloqueio/rate limit |
| API paga | todos acima + currency | estimativa por price book; billed posterior | tier, cache, tool fee, FX/tax, timeout cobrável |

LM Studio reporta token usage e métricas como tokens/s e time-to-first-token em sua API ([S7]); isso oferece observação, não custo energético nem precisão universal. O free tier do Gemini, por exemplo, distingue disponibilidade/cobrança e uso de conteúdo por tier na documentação atual ([S8]); política deve ser verificada no dia do uso e para a conta/região.

## 11. Routing econômico

Ordem de elegibilidade:

1. policy de dados/egress e jurisdição;
2. capabilities e contrato de output/tool;
3. hard budgets/quotas e saúde;
4. qualidade mínima do benchmark aplicável;
5. risco/latência/custo por sucesso no perfil;
6. tie-break determinístico.

P0 usa provider/modelo fixos. Routing multi-provider é P1 e não escolhe apenas menor preço por token. Free/local não vence se falha tool schema ou reduz sucesso de forma que aumenta tentativas/custo humano.

## 12. Otimizações como experimentos

| Otimização | Benefício hipotético | Risco | Gate |
|---|---|---|---|
| reduzir contexto | input/latência | omitir evidência | ablação sem regressão além da margem |
| cache | custo/latência | stale/cross-scope/data retention | key inclui bundle/source/policy; security tests |
| modelo menor/local | moeda/privacidade | qualidade, loop, energia | custo por sucesso + hard gates |
| batch | preço | latência/cancelamento/retention | tarefa admite atraso e contrato passa |
| compressão/resumo | tokens | distorção/injection | provenance + downstream eval |
| routing | custo/qualidade | fallback inseguro/drift | dois adapters e holdout |
| limitar retries | custo | reduzir sucesso | curva k × custo × qualidade pré-registrada |

Economia calculada contra preço de lista não é economia faturada. Relatórios mostram quantidade evitada, list estimate e billed/effective apenas quando disponíveis.

## 13. Métricas

- usage e custo total por task/call/attempt/success;
- `currency_minor per verified_success`, com falhas incluídas no numerador;
- calls/tokens/wall/compute por verified success;
- estimate error e reservation utilization;
- unknown usage share e reconciliation lag;
- overage count/value e causa;
- retry/repair cost share;
- p50/p95/p99 por família/slice;
- custo humano separado de provider/local compute.

Moedas distintas nunca agregam sem conversão registrada. Custo desconhecido não vira zero. Comparação local/remota declara amortização e energia ou limita o claim a custo variável observado.

## 14. Hipóteses e testes

| ID | Hipótese | Teste | Refutação |
|---|---|---|---|
| CST-H01 | reserva impede nova operação além do hard limit | corrida concorrente/limite zero | operação inicia sem capacidade |
| CST-H02 | units não se misturam | corpus de meters/currency/model | soma/conversão implícita |
| CST-H03 | timeout/cancel preserva custo unknown | fake aceita e perde resposta | valor vira zero/release total |
| CST-H04 | reconciliation não reescreve histórico | report/fatura tardios/correção | estimativa desaparece |
| CST-H05 | price snapshot reproduz estimativa | tiers/cache/rounding fixtures | mesmo snapshot/usage dá valor diferente |
| CST-H06 | retries contam integralmente | falha + sucesso posterior | relatório mostra só tentativa vencedora |
| CST-H07 | local/free não são tratados como ilimitados | quota/recurso esgotado | nova chamada começa |
| CST-H08 | otimização promove por custo por sucesso | ablação pareada | menor token/call vence com regressão crítica |

## 15. Testes de aceitação

| ID | Teste | Aceite |
|---|---|---|
| CST-T01 | BudgetSet schema | meter/unit/window/action únicos e coerentes |
| CST-T02 | hard zero/exato/concorrente | nenhuma operação além do available atômico |
| CST-T03 | reserve/settle/release | accounted + reserved nunca omite in-flight |
| CST-T04 | multiunit | todas as dimensões necessárias passam antes de iniciar |
| CST-T05 | usage classification | reported/measured/estimated/unknown não se sobrescrevem |
| CST-T06 | provider timeout/cancel/retry | possible overage e soma de attempts corretos |
| CST-T07 | price tiers/cache/batch/rounding | decimal exato e scope/validity respeitados |
| CST-T08 | currency/FX | nenhuma soma/conversão sem record versionado |
| CST-T09 | late reconciliation/dedup | delta append-only, duplicata detectada |
| CST-T10 | LM Studio fake stats | tokens/TTFT reportados; dinheiro continua unknown/estimado |
| CST-T11 | free quota | moeda zero não remove call/token/rate/data policy |
| CST-T12 | report por sucesso | inclui falhas, retries, unknowns e denominador |

## 16. Decisões e questões abertas

| ID | Decisão | Estado |
|---|---|---|
| CST-D01 | BudgetSet multiunidade sucede budget único | incorporada ao rc.5+ antes de 1.0 por ADR-011 |
| CST-D02 | reserva pessimista antes de operação | aceita |
| CST-D03 | estimated/reported/measured/billed separados | aceita |
| CST-D04 | price book fora do código e versionado | aceita |
| CST-D05 | P0 sem FX/routing/billing organizacional automático | aceita |
| CST-D06 | custo por sucesso inclui tentativas falhas | aceita |

| ID | Questão | Método | Bloqueia |
|---|---|---|---|
| OD-CST-01 | meters/default limits por bundle | MP-P0/provider probes | release |
| OD-CST-02 | representação decimal/schema final | fechada por ADR-011 + PriceBook/Budget schemas; vectors ainda pendentes | implementação |
| OD-CST-03 | política de release quando usage unknown | fake + provider contract | retry/cancel real |
| OD-CST-04 | price book do provider escolhido | coleta oficial datada | moeda estimate |
| OD-CST-05 | meters locais disponíveis por SO | PoC runtime/OS | custo local comparável |
| OD-CST-06 | threshold de alerts/approval | piloto/usabilidade | UX, não hard enforcement |

## 17. Registro de evidências

| ID | Classe | Afirmação delimitada | Fonte | Confiança | Impacto |
|---|---|---|---|---|---|
| CST-C01 | fato de fornecedor | APIs podem reportar múltiplas categorias de token/usage | [S6]–[S8] | alta para docs | schema extensível/multi-meter |
| CST-C02 | fato de fornecedor | LM Studio reporta tokens e métricas de performance, não preço monetário | [S7] | alta | moeda local unknown/modelada |
| CST-C03 | fato de especificação | FOCUS diferencia list, billed e effective cost e pricing quantity | [S9] | alta | vocabulário/reconciliation futura |
| CST-C04 | inferência | preço × tokens simples não cobre tiers/cache/tools/local/unknown | [S6]–[S9] | alta | PriceBook + ledger |
| CST-C05 | decisão | budgets são multiunidade e reserva precede operação | RF-020/RNF + ADR-011 | alta como decisão | contratos rc.7 |
| CST-C06 | desconhecido | provider, price book, limites, energia e comportamento unknown | OD-CST-01–06 | baixa | sem claim de custo real |

## 18. Fontes e busca

- <a id="s1"></a>**[S1]** ACI Arena. [Requisitos funcionais](../produto/requisitos_funcionais.md), RF-020. Revisão de 12 ago. 2026.
- <a id="s2"></a>**[S2]** ACI Arena. [Requisitos não funcionais](../produto/requisitos_nao_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s3"></a>**[S3]** ACI Arena. [Governança v2](governanca_de_ia.md). 13 ago. 2026.
- <a id="s4"></a>**[S4]** ACI Arena. [Avaliação v2](avaliacao_e_benchmarks.md). 13 ago. 2026.
- <a id="s5"></a>**[S5]** ACI Arena. [Ciclo agentic v2](estado_e_ciclo_agentic.md). 13 ago. 2026.
- <a id="s6"></a>**[S6]** OpenAI. [Usage API reference](https://platform.openai.com/docs/api-reference/usage). Consulta em 13 ago. 2026; capability de campos, não price book.
- <a id="s7"></a>**[S7]** LM Studio. [Chat API — stats e token usage](https://lmstudio.ai/docs/developer/rest/chat). Consulta em 13 ago. 2026.
- <a id="s8"></a>**[S8]** Google. [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing). Consulta em 13 ago. 2026; preços/tiers são voláteis.
- <a id="s9"></a>**[S9]** FinOps Foundation. [FOCUS Specification 1.4](https://focus.finops.org/focus-specification/v1-4/). Ratificada em 4 jun. 2026; consulta em 13 ago. 2026.

**Busca executada em 13/08/2026:** documentação oficial de usage/performance de OpenAI, LM Studio e Gemini; especificação FOCUS atual para vocabulário de billing. Preços pontuais não foram copiados porque não há provider/plano/região decidido e devem ser coletados no momento da decisão.

## 19. Critério de encerramento

A revisão documental está encerrada porque meters, budgets, reserva, ledger, conciliação, price book, perfis local/free/pago, routing, otimizações, métricas, hipóteses e testes estão definidos. A implementação permanece pendente até CST-T01–12, ADR decimal, BudgetSet/ledger schemas, provider fakes e price book real existirem.

O estudo e a ADR-011 autorizam implementar os contratos rc.7 de budget/usage/PriceBook, lifecycle journal e engine de reserva local. Não autorizam alegar previsão exata de fatura, economia, custo total local, comparabilidade monetária, quota organizacional ou prevenção absoluta de overage.
