# Contexto, memória e RAG — proveniência, minimização e promoção

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 13 de agosto de 2026  
**Data de corte das fontes:** 13 de agosto de 2026  
**Versão:** 2.0  
**Status:** contrato documental; corpus de recuperação, limites e adapters ainda não implementados  
**Método:** [Protocolo de pesquisa rigorosa](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Base:** [Governança](governanca_de_ia.md), [avaliação](avaliacao_e_benchmarks.md), [arquitetura](../arquitetura/arquitetura_de_referencia.md), [dados/persistência](../arquitetura/dados_e_persistencia.md), [RF](../produto/requisitos_funcionais.md) e [RNF](../produto/requisitos_nao_funcionais.md)

## 1. Resultado da revisão

O texto original colocava tree-sitter, LSP, embeddings, PostgreSQL/pgvector, Qdrant/LanceDB e memória persistente no mesmo pipeline, sem demonstrar que busca lexical falhava. Também confundia quatro objetos diferentes: conteúdo disponível, pacote enviado ao modelo, índice derivado e afirmação persistida como memória.

Decisão:

> **o P0 usa arquivos explicitamente selecionados e busca lexical dentro dos roots autorizados. Cada item carrega origem, versão/hash, intervalo, sensibilidade, confiança e motivo de seleção; conteúdo do repositório é dado não confiável, nunca instrução. Índice persistente, AST/LSP, embeddings, vetor e memória de projeto só entram por ablação downstream contra esse baseline.**

RAG é uma técnica candidata de recuperação + geração, não sinônimo de indexar tudo ou de usar vetores. A capacidade primária do produto é construir um `ContextPackage` mínimo, reproduzível e autorizado.

## 2. Perguntas e escopo

1. Qual informação é necessária para o próximo critério/passo e quem autoriza seu uso?
2. Como provar de onde veio, qual versão foi lida e se ficou stale antes da chamada?
3. Como separar instrução confiável, dado não confiável, resultado de tool e memória inferida?
4. Quando busca lexical deixa de ser suficiente para sucesso downstream?
5. Que informação pode persistir entre passos, sessões, projetos ou principals?
6. Como impedir excesso de contexto, injection, secret leakage e contaminação entre escopos?

O estudo informa `ContextItem`, `ContextQuery`, `ContextPackage` e `ProviderRequest`, além dos gates de indexação/RAG. Não define modelo de embeddings, vector DB, LSP, parser, memória global ou preço de provider.

## 3. Vocabulário operacional

| Termo | Definição | Não implica |
|---|---|---|
| fonte | objeto autorizado observável: arquivo, evento, tool result, usuário, configuração | verdade |
| item de contexto | trecho imutavelmente descrito com provenance e classificação | que foi enviado ao modelo |
| pacote de contexto | sequência ordenada e limitada de itens aceitos para uma finalidade | memória persistente |
| prompt efetivo | instruções confiáveis + pacote/contexto serializados para uma request | reprodução do output estocástico |
| índice | projeção derivada para descoberta/recuperação | autoridade sobre conteúdo atual |
| recuperação | seleção de candidatos segundo estratégia versionada | relevância perfeita |
| memória de sessão | afirmação tipada persistida para a tarefa/sessão com TTL/provenance | fato permanente |
| memória de projeto/global | dado reutilizado além da sessão | P0 ou consentimento implícito |
| RAG | geração condicionada a itens recuperados de fonte externa aos parâmetros | necessariamente embedding/vector DB |
| stale | fonte observada diverge da versão/hash que sustentou seleção | que conteúdo novo é inválido; exige revalidação |

## 4. Fronteiras de confiança

| Origem | Classe inicial | Pode dar instrução? | Tratamento |
|---|---|---:|---|
| task manifest/policy assinados pelo projeto | confiável no escopo/fingerprint | sim, nos campos normativos | validar schema e versão |
| input direto do usuário autenticado | instrução solicitada, não capability | sim, dentro de policy | normalizar e confirmar ambiguidade material |
| arquivo, README, comentário, issue, teste | dado não confiável | não | delimitar, citar, analisar injection/secret |
| stdout/stderr/tool result | observação não confiável | não | truncar, redigir, classificar e referenciar |
| output anterior do modelo | proposta/inferência | não | nunca elevar a fato sem verifier |
| memória | classe original preservada | somente se era instrução válida e ainda vigente | TTL, escopo, correção, revalidação |
| índice/embedding/resumo | derivado | não | apontar fontes; invalidar com elas |

Texto recuperado que diz “ignore a policy”, define uma tool ou pede envio externo permanece dado. A serialização precisa separar visual e estruturalmente instruções de conteúdo.

## 5. Contrato `ContextItem`

| Campo | Regra |
|---|---|
| `context_item_id` | ID estável desta observação/trecho |
| `source_kind` | file, event, tool_result, user_input, config ou memory |
| `source_ref` | path relativo/URI lógico/ID; nunca path externo não autorizado |
| `source_version` | hash/digest e, quando útil, mtime/commit/sequence observados |
| `range` | bytes ou linhas com convenção explícita; ausente só para objeto indivisível |
| `project_id`/`principal_scope` | escopo que precisa coincidir com a task |
| `data_class` | classificação D0–D5 vigente |
| `trust_class` | instruction, observation, inference, hypothesis ou decision |
| `observed_at` | momento da leitura; não substitui hash |
| `selection_reason` | explícito, lexical match, dependency, diagnostic etc. |
| `query_id`/`strategy_version` | como foi descoberto; obrigatório se recuperado |
| `content_ref` | conteúdo inline limitado ou artifact ref redigida/digerida |
| `content_digest` | digest após normalização definida; raw permanece verificável quando permitido |
| `token_estimate` | estimativa + tokenizer/model ID ou `unknown` |
| `expires_at` | quando aplicável a tool result/memory/dado volátil |

Invariante: sem provenance, escopo, classe e versão, o item não entra no pacote. Resumo aponta os IDs-fonte e recebe nova identidade; não substitui o original como evidência.

## 6. Contratos de consulta e pacote

### `ContextQuery`

- `query_id`, task/step/criterion e purpose;
- texto/termos normalizados sem secret em claro;
- roots, globs, idiomas/tipos e limites;
- estratégia e versão (`explicit-v1`, `rg-lexical-v1` etc.);
- filtros de access/data/trust/freshness;
- budget de items/bytes/tokens/tempo;
- configuração de ranking/tie-break determinístico;
- resultados candidatos, aceitos, rejeitados e reason codes.

### `ContextPackage`

- package ID/schema/version/fingerprint;
- task, step, criterion e governance bundle;
- query IDs e ordered item IDs;
- totais por item/bytes/tokens/data class;
- regras de ordenação, deduplicação e truncamento;
- redaction report e staleness check;
- provider destination e egress class;
- exclusions/unknowns;
- created/validated/expiry timestamps.

A ordem é parte do fingerprint porque posição pode mudar o uso do contexto pelo modelo. Estudos de long context observaram degradação quando informação relevante muda de posição; isso é evidência para testar ordenação, não garantia sobre todo modelo ([S8]).

## 7. `ProviderRequest` mínimo

| Grupo | Campos |
|---|---|
| identidade | request ID, task/step/attempt, bundle/provider/model |
| finalidade | criterion/purpose e output esperado |
| instruções | prompt/template IDs e hashes; parâmetros normalizados |
| contexto | package ID/fingerprint e item refs ordenadas |
| tools | definições autorizadas e seus fingerprints; ou lista vazia |
| saída | response schema/version ou text contract; max output |
| limites | deadline, cancel, max attempts, unidades de budget |
| dados | destination, classes, redaction result e egress decision |
| rastreio | correlation IDs, idempotency key quando suportada, timestamps |

O adapter serializa o request para cada API e registra diferenças. “OpenAI-compatible” descreve uma superfície, não equivalência semântica. LM Studio oferece endpoints compatíveis, structured output e tool use, mas sua documentação alerta que modelos menores/sem suporte nativo podem produzir chamadas malformadas e que resultados variam por modelo ([S9]–[S11]). Portanto:

- tools nunca são executadas a partir de texto sem parse + schema + policy;
- structured output ainda passa pelo validator local;
- capabilities são testadas por model + quantização + chat template + runtime;
- endpoint local não recebe automaticamente acesso às tools ou à rede;
- estado do servidor/provider não é fonte de verdade da tarefa.

## 8. Pipeline P0

```mermaid
flowchart LR
    N["Necessidade do passo/critério"] --> Q["ContextQuery tipada"]
    Q --> A["Filtro de root, acesso e classe"]
    A --> R["Explícito + busca lexical"]
    R --> I["ContextItems com provenance"]
    I --> D["Deduplicar, ordenar e limitar"]
    D --> V["Revalidar hash/permissão"]
    V --> X["Redigir e minimizar"]
    X --> P["ContextPackage fingerprint"]
    P --> G["Policy de destino/egress"]
    G --> PR["ProviderRequest"]
```

### Ordem obrigatória

1. declarar a pergunta/critério, não “buscar contexto” genericamente;
2. resolver root e escopo antes de conteúdo;
3. descobrir nomes/path/símbolos por metadado/lexical;
4. ler apenas candidatos dentro de budget;
5. classificar trust/data e detectar secret-canaries;
6. deduplicar por fonte/range/digest;
7. ordenar por regra versionada e reservar espaço a instruções/output;
8. revalidar fonte e permissão imediatamente antes do package final;
9. redigir/minimizar para o destino;
10. fingerprint, policy e emissão da request.

Falha de redaction, acesso ou staleness não vira item omitido silenciosamente quando o critério dependia dele: pacote fica `blocked` ou `inconclusive` com razão.

## 9. Baseline e escada de recuperação

| Nível | Capacidade | Gate para promover |
|---|---|---|
| C0 | paths/trechos explícitos + leitura delimitada | baseline de cada UC |
| C1 — P0 | C0 + `rg`/busca lexical efêmera, metadado e ranking simples | padrão inicial |
| C2 | SQLite FTS5 persistente e incremental | latência/repetição do C1 causa falha; frescor/integridade passam |
| C3 | parser/AST/LSP/grafo | oracle de símbolo/dependência melhora downstream além do custo |
| C4 | embeddings + busca híbrida/re-ranker | ablação supera melhor lexical/estrutural em holdout e segurança |
| C5 | serviço/vector DB distribuído | volume/concorrência/localidade excede storage local medido |

SQLite FTS5 oferece busca full-text, tokenizers, queries, ranking BM25 e integrity-check ([S7]); isso prova capability, não necessidade. Tree-sitter, LSP, pgvector e Qdrant permanecem candidatos até o experimento correspondente.

## 10. Ranking, montagem e budget

O P0 usa ranking explicável e determinístico, por exemplo:

1. item explicitamente nomeado;
2. match exato de path/símbolo/diagnóstico;
3. match lexical com tie-break por path/range;
4. proximidade ao arquivo já autorizado;
5. recência apenas quando semântica do caso a exige.

Recência não torna item verdadeiro. Score não cruza scope/data policy. O pacote reserva quotas por função:

- instruções/critério;
- contexto primário;
- evidência de tool/diagnóstico;
- catálogo de tools/schema;
- margem para output.

Truncamento nunca corta no meio de encoding/estrutura sem marcar; registra item, bytes/tokens removidos e razão. Se parte obrigatória não cabe, reduzir/reconsultar ou bloquear — não omitir e continuar alegando cobertura.

## 11. Memória

### 11.1 P0: sessão tipada

Memória é uma coleção de `MemoryClaim`, não um transcript ilimitado:

| Campo | Regra |
|---|---|
| ID/versão | imutável; correção cria novo claim relacionado |
| classe | observation, inference, hypothesis, decision, preference ou instruction |
| conteúdo/ref | mínimo necessário, redigido e digerido |
| provenance | usuário/event/tool/artifact/model + IDs |
| scope | task/session/project/principal explícitos |
| confidence | quando inferência; não aplicada a fato verificado como probabilidade |
| validity | observed/created/expires e condição de revalidação |
| status | active, superseded, expired, corrected, deleted-content |
| consumers | passos/capabilities permitidos |

Somente task/session é recuperável por default no P0. Preferência do usuário não vira regra de segurança. Hipótese do modelo continua hipótese. Resultado de tool stale é reobservado quando material.

### 11.2 Memória de projeto/global

- projeto é P1, opt-in por classe, com owner, TTL, correção/exclusão e provenance;
- global é P2, opt-in explícito, escopos consumidores visíveis e isolamento testado;
- transcript bruto não vira memória automaticamente;
- secret, credencial e dado D5 nunca entram;
- conteúdo apagado deixa apenas evento redigido/digest permitido, não é republicado.

## 12. Invalidação e frescor

Índice/memória derivada mantém dependências reversas para fonte e policy. Invalida quando:

- conteúdo/hash/range muda ou arquivo desaparece;
- root, permissão, principal ou classificação muda;
- parser/embedder/tokenizer/ranking muda;
- source claim expira/corrige/exclui;
- commit/worktree muda de forma que afeta a referência;
- policy proíbe novo destino/uso.

P0 sem índice persistente ainda revalida hash entre leitura, montagem e efeito. Cache hit nunca pula autorização/freshness.

## 13. Segurança e privacidade

| Risco | Controle P0 | Teste |
|---|---|---|
| prompt injection no repo/tool | delimitador + trust class + model sem autoridade | corpus instrui bypass/exfiltração |
| secret/PII | scope, detector/canary, redaction antes de package/storage | variantes literal/encoding previstas |
| path traversal/link | root canônico + adapter filesystem | corpus cross-platform |
| cross-project memory/index | chave de escopo obrigatória e negative query | canário A nunca retorna em B |
| stale context | hash/version + recheck antes de request/effect | mutação concorrente |
| poisoning de índice/resumo | provenance + derivation version + fonte revalidada | mutante derivado diverge da fonte |
| contexto excessivo/DoS | bytes/items/tokens/time hard limits | arquivo gigante, output flood |
| egress indevido | destination policy sobre package final | endpoint fora da allowlist |

Detector não prova ausência de secret; QG-02 é medido no corpus e o pipeline minimiza a consequência residual.

## 14. Avaliação e ablações

### Corpus

- queries de path/símbolo exato;
- mudança cross-file/dependência;
- diagnóstico/teste que aponta região;
- nomes ambíguos e termos ausentes;
- arquivo renomeado/deletado/stale;
- monorepo com pacotes fora do escopo;
- injection/secret/arquivo grande/binário/gerado;
- caso onde informação relevante muda de posição.

### Métricas

- recall/precision/MRR/nDCG apenas contra relevance judgments versionados;
- coverage do conjunto mínimo necessário, não “qualquer arquivo relacionado”;
- success downstream e regressão por UC;
- bytes/tokens enviados, redundância e utilização citada;
- latência/index time/RAM/disco/custo;
- staleness, cross-scope e secret violations;
- tempo humano para corrigir contexto.

Comparar C0 → C1 → candidato alterando uma capacidade por vez. Busca vetorial só promove se melhorar sucesso downstream ou reduzir custo/latência de modo pré-registrado, sem piorar hard gates. O benchmark RAG antigo passa a ser backlog exploratório; seus targets e escolhas tecnológicas não são gates até baseline.

## 15. Eventos e contracts candidatos

| Artefato/evento | Conteúdo mínimo |
|---|---|
| `context.query_recorded` | query, strategy/version, scope, limits, candidate/accepted IDs |
| `context.package_built` | package/fingerprint, ordered items, totals, exclusions, destination |
| `context.stale_detected` | item/source, expected/observed version, affected request/step |
| `memory.claim_recorded` | claim class, provenance, scope, TTL, digest |
| `memory.claim_changed` | old/new relation, correction/expiry/deletion reason |
| `provider.requested` | ProviderRequest referenciando package/bundle |

Os nomes só entram no event registry após schema/vectors. Conteúdo bruto deve preferir artifact ref redigida; evento preserva metadado suficiente para reprodução sem duplicar dado sensível.

## 16. Hipóteses e testes

| ID | Hipótese | Teste | Refutação |
|---|---|---|---|
| CTX-H01 | C1 basta ao P0 inicial | UC-01–05 C0/C1 | falha causal de recuperação excede limiar prévio |
| CTX-H02 | provenance detecta staleness | mutar fonte entre query/package/request | request usa trecho como atual |
| CTX-H03 | trust boundary resiste injection | corpus hostil em docs/stdout | conteúdo concede capability/muda policy |
| CTX-H04 | minimização reduz bytes sem perder sucesso | ablação de itens | pacote menor regrede critério além da margem |
| CTX-H05 | memória não cruza escopo | matriz principal/projeto/session | canário retorna fora do escopo |
| CTX-H06 | C2–C4 só promovem por downstream | holdout pareado | ganho só em retrieval proxy ou dev set |
| CTX-H07 | adapter local fraco é controlável | malformed tools/JSON/truncation | texto malformado chega ao handler |
| CTX-H08 | ordenação não é arbitrária | permutar item relevante | sensibilidade não medida/mitigada |

## 17. Testes de aceitação

| ID | Teste | Aceite |
|---|---|---|
| CTX-T01 | ContextItem schema | item sem source/version/scope/class é rejeitado |
| CTX-T02 | deterministic query | mesma fixture/versão produz IDs/ordem iguais |
| CTX-T03 | root/link/permission | nenhum candidato fora do escopo entra |
| CTX-T04 | race de staleness | package/request bloqueado ou reconstruído |
| CTX-T05 | redaction failure | nenhum conteúdo é persistido/enviado; causa visível |
| CTX-T06 | budget/truncation | limites respeitados e omissões registradas |
| CTX-T07 | derived item | resumo/embedding aponta fontes e invalida com elas |
| CTX-T08 | memory claim lifecycle | correction/expiry/delete não reabre conteúdo antigo |
| CTX-T09 | cross-scope corpus | zero canário entre projeto/principal |
| CTX-T10 | injection corpus | zero authority/policy/tool bypass |
| CTX-T11 | ProviderRequest | bundle/package/tool/output/limits/destination fingerprints válidos |
| CTX-T12 | LM Studio/provider fake | malformed JSON/tool, stream parcial e capability ausente falham fechados |

## 18. Decisões e questões abertas

| ID | Decisão | Estado |
|---|---|---|
| CTX-D01 | P0 = explícito + lexical efêmero | aceita |
| CTX-D02 | sem embedding/vector DB/LSP obrigatório | aceita até ablação |
| CTX-D03 | contexto de repo/tool é dado não confiável | aceita |
| CTX-D04 | memória P0 só task/session tipada | aceita |
| CTX-D05 | package order participa do fingerprint | aceita |
| CTX-D06 | adapter local/remoto passa mesmo contrato | aceita; equivalência não presumida |

| ID | Questão | Método | Bloqueia |
|---|---|---|---|
| OD-CTX-01 | tokenizer/limite por modelo local/remoto | capability probe + fixture | budget real |
| OD-CTX-02 | estratégia/serialization exata C1 | spike e gold queries | schema final |
| OD-CTX-03 | TTL e classes de memória | piloto + privacy/threat model | persistência além da task |
| OD-CTX-04 | FTS5 disponível/adequado no runtime escolhido | PoC Node/SQLite | C2, não P0 C1 |
| OD-CTX-05 | modelo/quantização/template LM Studio | inventário + contract/eval | adapter real |
| OD-CTX-06 | limiares de C2–C4 | baseline/holdout | promoção RAG |

## 19. Registro de evidências

| ID | Classe | Afirmação delimitada | Fonte | Confiança | Impacto |
|---|---|---|---|---|---|
| CTX-C01 | resultado primário | RAG original combina memória paramétrica e índice denso não paramétrico em tarefas de NLP estudadas | [S6] | alta no estudo | técnica candidata, não arquitetura obrigatória |
| CTX-C02 | resultado primário | posição de informação relevante afetou desempenho em tarefas/modelos long-context avaliados | [S8] | alta no estudo | testar ordem/posição por modelo |
| CTX-C03 | fato de especificação | SQLite FTS5 oferece full-text query, ranking e integrity-check | [S7] | alta | candidato C2 |
| CTX-C04 | fato de fornecedor | LM Studio expõe APIs locais/compatíveis, structured output e tool use; suporte/qualidade variam por modelo/template | [S9]–[S11] | alta para capability declarada | contract tests por modelo |
| CTX-C05 | decisão | P0 usa C1 e memória task/session | [S1]–[S5], RF-011/012 | alta como decisão | reduz infraestrutura |
| CTX-C06 | desconhecido | recall downstream, limites, tokenizer e melhor modelo local | OD-CTX-01–06 | baixa | nenhuma claim de RAG/escala |

## 20. Fontes e busca

- <a id="s1"></a>**[S1]** ACI Arena. [Arquitetura de referência](../arquitetura/arquitetura_de_referencia.md). Revisão de 12 ago. 2026.
- <a id="s2"></a>**[S2]** ACI Arena. [Dados e persistência](../arquitetura/dados_e_persistencia.md). Revisão de 12 ago. 2026.
- <a id="s3"></a>**[S3]** ACI Arena. [Requisitos funcionais](../produto/requisitos_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s4"></a>**[S4]** ACI Arena. [Requisitos não funcionais](../produto/requisitos_nao_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s5"></a>**[S5]** ACI Arena. [Avaliação v2](avaliacao_e_benchmarks.md). 13 ago. 2026.
- <a id="s6"></a>**[S6]** Lewis et al. [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401). NeurIPS 2020; consulta em 13 ago. 2026.
- <a id="s7"></a>**[S7]** SQLite. [FTS5 Extension](https://www.sqlite.org/fts5.html). Consulta em 13 ago. 2026.
- <a id="s8"></a>**[S8]** Liu et al. [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172). TACL 2024; consulta em 13 ago. 2026.
- <a id="s9"></a>**[S9]** LM Studio. [OpenAI Compatibility Endpoints](https://lmstudio.ai/docs/developer/openai-compat). Consulta em 13 ago. 2026.
- <a id="s10"></a>**[S10]** LM Studio. [Tool Use](https://lmstudio.ai/docs/developer/openai-compat/tools). Consulta em 13 ago. 2026.
- <a id="s11"></a>**[S11]** LM Studio. [Structured Output](https://lmstudio.ai/docs/developer/openai-compat/structured-output). Consulta em 13 ago. 2026.

**Busca executada em 13/08/2026:** artigo primário RAG, estudo de uso de long context, especificação SQLite FTS5 e documentação oficial LM Studio para API/tool/structured output. Tecnologias AST/LSP/vector foram mantidas como alternativas; páginas comerciais e benchmarks sem protocolo não sustentam promoção.

## 21. Critério de encerramento

A revisão documental está encerrada porque contratos, confiança, pipeline, baseline, níveis, memória, invalidação, segurança, avaliação, eventos, hipóteses e testes estão explícitos. ContextQuery/Item/Package/Stale e ProviderRequest agora possuem schemas rc.7; a implementação continua pendente até CTX-T01–12, corpus/gold queries, context builder, fake/provider adapter e `MP-P0` aprovado existirem.

O estudo autoriza implementar C0/C1, memória de sessão mínima e adapters por contrato. Não autoriza alegar RAG, indexação incremental, compreensão semântica, suporte a codebase grande, memória de projeto/global ou equivalência entre modelos/APIs.
