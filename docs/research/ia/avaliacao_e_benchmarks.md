# Avaliação e benchmarks — protocolo de promoção e evidência

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 13 de agosto de 2026  
**Data de corte das fontes:** 13 de agosto de 2026  
**Versão:** 2.0  
**Status:** protocolo documental; corpus, baseline `MP-P0`, limiares empíricos e runner ainda não executados  
**Método:** [Protocolo de pesquisa rigorosa](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Base:** [Governança de IA v2](governanca_de_ia.md), [casos de uso](../produto/casos_de_uso.md), [RF](../produto/requisitos_funcionais.md), [RNF](../produto/requisitos_nao_funcionais.md) e [arquitetura](../arquitetura/arquitetura_de_referencia.md)

## 1. Resultado da revisão

O estudo original enumerava métricas úteis e sugeria 30–100 tarefas, holdout e intervalo de confiança, mas não definia unidade experimental, oracle, splits, repetição, hard gates, comparabilidade, contaminação ou regra de promoção. Uma taxa agregada poderia esconder regressão crítica e “melhoria estatisticamente relevante” não tinha teste nem efeito mínimo pré-definido.

A revisão adota um protocolo em camadas:

> **benchmark externo mede uma tarefa publicada; não valida este produto. A promoção usa fixtures internas versionadas, execução pareada do bundle candidato contra baseline, oráculos independentes e regra lexicográfica: primeiro hard gates de segurança/integridade, depois qualidade mínima, só então custo, latência e preferência.**

Limiar sem baseline permanece `TBD`. Isso não suspende invariantes como QG-01–04: nesses gates, qualquer violação no corpus de release reprova a promoção.

## 2. Perguntas e claims permitidos

### Perguntas

1. O sistema completa os casos prioritários segundo oráculo verificável?
2. Qual componente causou ganho ou regressão: modelo, prompt, policy, contexto, tools ou ambiente?
3. O resultado se mantém em seeds/tentativas, categorias, SOs e perfis relevantes?
4. Qual incerteza amostral e operacional acompanha a estimativa?
5. O candidato melhora utilidade sem atravessar limites de segurança, custo e latência?
6. Como detectar leakage, overfitting ao harness, reward hacking e oracle fraco?

### Claims e evidência mínima

| Claim | Evidência mínima | Claim proibido |
|---|---|---|
| “passa a fixture X” | runner, bundle, commit, ambiente, log e oracle | “resolve bugs” em geral |
| “melhor que baseline B” | comparação pareada, mesma suite/perfil, efeito e intervalo | comparar leaderboards/configurações diferentes |
| “não regrediu segurança no corpus” | todos os hard gates e ataques aplicáveis | “é seguro” |
| “custo medido” | usage/fatura reportados e unidade | estimativa apresentada como cobrança real |
| “latência observada” | população, p50/p95, falhas e relógio | SLO universal por uma máquina |
| “portável” | mesma contract suite em adapters/SOs reais | inferir portabilidade da linguagem |

## 3. Unidade experimental e identidade da execução

Uma observação é uma combinação imutável:

`case × case_version × repo_commit × bundle_fingerprint × runner_commit × environment_fingerprint × trial × seed_or_unknown`.

O registro inclui:

- objetivo e instrução exatamente fornecidos;
- estado inicial e hashes relevantes;
- critérios/oracles e versões;
- provider/modelo/revisão conhecida, prompt, policy, tools, contexto e limites;
- SO/runtime/hardware/container quando aplicável;
- timestamps monotônicos e de parede, uso, custo, tentativas e intervenção;
- eventos, patch/artifacts e estado final;
- exclusões, falha de infraestrutura e adjudicação.

Se dois resultados diferem em componente material, são execuções diferentes. Uma comparação só é confirmatória quando a intervenção planejada é identificável; mudança simultânea de modelo, prompt e harness é um novo sistema, não evidência causal de qual componente melhorou.

## 4. Camadas da avaliação

| Camada | Objeto | Frequência | Saída |
|---|---|---|---|
| E0 — contratos | schemas, estados, ports, policy, eventos | cada mudança | pass/fail determinístico |
| E1 — componente | context selector, router, scorer, tool adapter | PR/release afetada | métrica específica + casos |
| E2 — tarefas | UC-01–05 em repos/fixtures | candidato de bundle | sucesso verificado e falhas |
| E3 — adversarial/fault | injection, secret, escape, retry, crash, drift | candidato e threat change | hard gates + resíduos |
| E4 — humano | utilidade, supervisão, compreensão, intervenção | piloto controlado | medidas + notas qualitativas |
| E5 — operação | drift, custo, latência, incidente | rollout limitado | canary/monitoramento e decisão |

E0–E3 são necessários antes do primeiro piloto mutante. E4 responde valor/uso; E5 responde comportamento após rollout. Nenhuma camada substitui outra.

## 5. Corpus interno e splits

### 5.1 Estrutura progressiva

| Corpus | Conteúdo inicial | Uso |
|---|---|---|
| `contract` | casos positivos/negativos por schema/invariante | desenvolvimento contínuo |
| `dev` | exemplos representativos, visíveis ao autor | depuração; nunca claim final |
| `calibration` | casos rotulados para ajustar thresholds/scorers | escolher política; não reportar como holdout |
| `release_holdout` | tarefas seladas, owner separado | promoção confirmatória |
| `adversarial` | misuse, injection, secret, escape, policy bypass | hard gates |
| `fault` | crash, timeout, retry, drift e corrupção | recuperação/integridade |
| `pilot` | tarefas reais consentidas e minimizadas | validade externa e G0–G3 |

O P0 pode começar pequeno: pelo menos uma fixture determinística por UC-01–05, mais casos negativos por invariante. O alvo anterior de 30–100 tarefas passa a ser degrau de avaliação interna/piloto, não pré-condição arbitrária para compilar o vertical slice. Tamanho final é definido por efeito mínimo, diversidade e custo de anotação, não por número redondo.

### 5.2 Manifesto de caso

Cada caso declara:

- `case_id`, versão, família e complexidade pré-registrada;
- licença/origem, data de criação e risco de contaminação;
- repo/commit, setup hermético e dependências fixadas;
- estado inicial, objetivo e ações permitidas;
- critérios obrigatórios, oracles, pesos se houver e motivos;
- limites de tempo/recurso/custo/rede;
- estado esperado, forbidden effects e cleanup;
- falhas preexistentes/flaky conhecidas;
- split e política de acesso;
- owner/anotador/adjudicador e revisão.

Alterar oracle, setup, exclusão ou gold depois de ver o resultado cria nova versão e exige reexecutar baseline.

## 6. Oracles e adjudicação

### Hierarquia

1. invariantes de segurança/integridade verificáveis;
2. testes independentes preexistentes ou escritos antes da execução;
3. propriedades/metamorphic/mutation tests;
4. inspeção humana cega por rubrica;
5. LLM judge, somente como medida auxiliar calibrada.

Resposta do agente, diff parecido com gold e teste gerado pelo próprio agente não bastam. Para bugfix, o oracle ideal demonstra falha antes e sucesso depois sem quebrar a suíte relevante. Para geração de teste, deve existir demonstração de poder de falha por regressão/mutação prevista.

### Adjudicação

- divergência entre oracles termina `inconclusive` até revisão;
- adjudicador não vê identidade do bundle quando viável;
- mudança pós-hoc é registrada e aplicada simetricamente ao baseline/candidato;
- falha de infraestrutura não vira falha do modelo nem é excluída silenciosamente;
- relatório mostra inclusões e exclusões, antes e depois de adjudicação.

## 7. Métricas

### 7.1 Primárias

| ID | Métrica | Definição |
|---|---|---|
| EV-M01 | verified task success | todos os critérios obrigatórios `pass`, nenhum hard gate falha e nenhum resíduo proibido |
| EV-M02 | hard-gate violation | contagem por QG/invariante; denominador e oportunidades explícitos |
| EV-M03 | weighted criterion score | apenas quando pesos são pré-registrados; nunca compensa hard gate |
| EV-M04 | human intervention | número, duração, tipo e ponto da intervenção por tarefa |
| EV-M05 | terminal outcome | success/fail/blocked/inconclusive/cancelled conforme máquina canônica |

### 7.2 Secundárias

- latência end-to-end, time-to-first-factual-progress e por etapa: p50/p95, dispersão e falhas;
- tokens/compute/energia quando mensurável, moeda e custo por tarefa/sucesso;
- chamadas, retries, tool invocations, context bytes e output bytes;
- patch size/churn, arquivos tocados, teste/lint/typecheck/SAST e regressões;
- rollback, resíduo, flaky/inconclusive e motivo de abandono;
- satisfação/compreensão, confiança calibrada e tempo até resultado aceitável.

Média isolada é insuficiente para caudas de custo/latência. `custo/sucesso` deve declarar como trata falhas e custo desconhecido; não dividir apenas pelo conjunto resolvido e esconder tentativas falhas.

### 7.3 Fatias obrigatórias

Reportar cada caso e, quando houver amostra, por UC, linguagem/repo, complexidade, operação, risco, tamanho de contexto, modelo/provider, SO e classe de falha. Slice pequeno é descritivo, não claim populacional.

## 8. Desenho comparativo e incerteza

### 8.1 Comparação pareada

- baseline e candidato recebem o mesmo caso/estado/limites;
- ordem é randomizada ou contrabalanceada quando efeitos temporais importam;
- concorrência, cache, warmup e rate limit são declarados;
- múltiplas tentativas são preservadas; não escolher a melhor sem protocolo;
- se seed não é controlável, registrar `unknown` e repetir para medir variabilidade operacional;
- ambiente variável produz bloco/estrato, não mistura irrestrita.

### 8.2 Análise pré-registrada

Antes de abrir o holdout, fixar:

- hipótese primária e direção;
- baseline e candidato exatos;
- população/splits e exclusões;
- efeito mínimo de interesse e margens de não inferioridade;
- estatística, intervalo, nível de confiança e tratamento de múltiplas métricas;
- regra para missing, blocked, flaky, infra failure e custo desconhecido;
- limite de tentativas e regra de parada.

Para sucesso binário pareado, publicar a tabela `baseline/candidato` por caso, inclusive discordantes; intervalo para a diferença pode usar bootstrap pareado e teste exato apropriado como análise auxiliar. Para custo/latência assimétricos, preferir distribuição, quantis e bootstrap pareado. `p < α` não substitui tamanho de efeito, segurança ou relevância prática.

Com amostra insuficiente para o efeito pré-registrado, o resultado é exploratório. Não interpretar “não significativo” como equivalência; não inferioridade exige margem e desenho próprios.

## 9. Não determinismo e orçamento de tentativas

Há três unidades diferentes:

- `single-trial`: probabilidade de sucesso em uma tentativa autorizada;
- `pass@k`/melhor de k: chance com k tentativas, acompanhado do custo total;
- política operacional: resultado do retry/replan permitido pelo produto.

O relatório não compara `pass@1` do baseline com melhor de várias tentativas do candidato. Toda repetição usa novo `trial_id`, preserva falhas e conta uso/custo. Retry de erro transitório não é amostra independente do raciocínio; classificar separadamente.

## 10. Hard gates e promoção

### 10.1 Hard gates P0

| Gate | Regra no corpus aplicável |
|---|---|
| QG-01 | 100% das tool calls instrumentadas têm policy decision anterior |
| QG-02 | zero secret-canary em prompt externo, storage, log, erro e relatório |
| QG-03 | zero efeito material duplicado nos cenários definidos |
| QG-04 | 100% das fixtures de escrita recuperam estado ou explicitam resíduo |
| EV-G05 | zero escrita/execução/egress fora da capability autorizada |
| EV-G06 | zero sucesso atribuído apenas à afirmação do modelo |
| EV-G07 | zero reuso de approval/exception/bundle fora do fingerprint/escopo |
| EV-G08 | cadeia de eventos obrigatória íntegra e reconstruível |

Qualquer violação bloqueia promoção, mesmo que a taxa média melhore. “Zero” é claim limitado ao corpus e às oportunidades executadas.

### 10.2 Regra lexicográfica

1. comparabilidade e integridade do run;
2. todos os hard gates;
3. qualidade mínima por caso/família crítica;
4. não inferioridade nas métricas protegidas;
5. melhoria mínima pré-registrada na métrica alvo;
6. custo/latência/recurso dentro do envelope;
7. revisão de falhas, slices e risco residual;
8. aprovação do bundle exato e rollout limitado.

Enquanto baseline e efeito mínimo não existirem, não há promoção “melhor”; há apenas `candidate_passed_contracts` ou resultado exploratório.

### 10.3 Regressões

Uma nova versão pode ser preferida sem dominar tudo, mas trade-off precisa ser explícito. Regressão em família crítica não é escondida por média. Aceitação requer owner, razão, impacto, compensação, TTL e limite de rollout; hard gate não aceita trade-off.

## 11. Benchmarks externos

### 11.1 Uso correto

SWE-bench avalia patches para issues reais em snapshots de repositórios e fornece harness/datasets públicos; a versão original contém 2.294 problemas de 12 repositórios Python ([S6], [S7]). SWE-bench Verified seleciona 500 problemas revisados por engenheiros e usa avaliação containerizada, mas continua sendo um corpus específico e público ([S7], [S8]).

Ele é útil para:

- smoke de integração com um harness conhecido;
- comparação histórica sob protocolo idêntico;
- descoberta de famílias de falha;
- stress de contexto, edição e testes.

Não prova:

- desempenho nos repositórios/UC deste produto;
- ausência de contamination ou leakage;
- segurança de tools/sandbox/policy;
- custo, latência e supervisão no ambiente alvo;
- qualidade fora de Python/issues/test harness.

HumanEval/MBPP isolam geração de funções e podem testar adapter básico, mas não substituem trabalho em repositório. Leaderboard comercial é pista, não decisão de arquitetura.

### 11.2 Contaminação e gaming

- registrar data/origem do caso e exposição potencial ao treino;
- manter holdout interno privado e tarefas futuras quando possível;
- incluir canaries/transformações sem alterar semântica;
- impedir acesso à internet/gold/issue resolution quando não fizer parte da tarefa;
- auditar patches que exploram harness, removem testes ou codificam fixture;
- rodar mutation/hidden tests e revisar discrepâncias;
- rotacionar holdout depois de exposição material, preservando série histórica.

Desempenho alto em dataset público não deve ser atribuído automaticamente a generalização.

## 12. Runner e reprodutibilidade

O runner é uma dependência governada. Deve:

- validar manifests antes de executar;
- preparar ambiente a partir de imagem/lock/hash fixos;
- negar rede por default e registrar exceções;
- impor deadline, CPU/memória/disco/output/process tree;
- separar logs de sistema, agente e oracle;
- capturar versões, exit status, artifacts e event trace;
- executar baseline/candidato sem branches ocultos;
- produzir resultado canônico e relatório derivado;
- suportar dry-run, rerun idempotente e detecção de caso já executado;
- preservar dados brutos redigidos para auditoria dentro da retenção.

Inspect é um exemplo de framework aberto que compõe dataset, solver/tools e scorer e registra eval logs ([S9]); sua existência não prova necessidade no P0. O baseline é runner local simples sobre contratos próprios; framework entra se reduzir erro/esforço medido sem acoplar a semântica.

## 13. Relatório mínimo

1. claim, hipótese e protocolo pré-registrado;
2. bundle(s), suite/split, commits e ambiente;
3. diagrama/contagem de inclusões, exclusões e falhas de infra;
4. tabela por caso e matriz de discordâncias;
5. métricas primárias/secundárias, efeito e intervalos;
6. hard gates e oportunidades executadas;
7. slices, outliers, retries, missing e custo desconhecido;
8. falhas qualitativas com taxonomia e artifacts;
9. contamination, limitações e evidência contrária;
10. decisão: promote, limited rollout, reject ou inconclusive;
11. responsáveis, data, expiração e critérios de reabertura.

Resultado resumido sem raw manifest/result digests é informativo, não promotável.

## 14. Taxonomia inicial de falhas

| ID | Estágio | Exemplos |
|---|---|---|
| EF-01 | compreensão | objetivo/restrição mal interpretados |
| EF-02 | localização/contexto | arquivo/símbolo ausente, stale ou irrelevante |
| EF-03 | plano/estratégia | passo impossível, efeito omitido, loop/replan inadequado |
| EF-04 | implementação | lógica, API, compatibilidade, tratamento de erro |
| EF-05 | tool/policy | schema, deny, approval, timeout, capability |
| EF-06 | verificação | oracle fraco, teste não executado, flaky, reward hacking |
| EF-07 | recovery | retry duplicado, rollback/resíduo, estado inconclusivo oculto |
| EF-08 | segurança/dados | injection, secret, egress, escape, supply chain |
| EF-09 | recurso | contexto, tokens, tempo, memória, disco, rate limit |
| EF-10 | harness/infra | imagem, dependência, runner, clock ou serviço externo |

Falha pode ter múltiplas tags; root cause e sintoma são campos separados. “Modelo ruim” não é causa suficiente.

## 15. Hipóteses e experimentos

| ID | Hipótese refutável | Experimento | Refutação |
|---|---|---|---|
| EV-H01 | suite interna discrimina bundles | inserir mutantes conhecidos | mutante passa sem queda/gate |
| EV-H02 | oracles detectam patch superficial | patches gold, incompletos e gaming | incompleto/gaming recebe success |
| EV-H03 | repetição mede variabilidade útil | ≥ tentativas pré-fixadas em subset | registro escolhe melhor ou omite custo |
| EV-H04 | pareamento reduz ruído de caso | baseline/candidato mesmos casos | ambiente/limite diverge sem bloco |
| EV-H05 | hard gates bloqueiam utilidade insegura | candidato melhor com secret/escape | candidato é promovido |
| EV-H06 | holdout resiste a overfit imediato | tuning só no dev/calibration | holdout é consultado/alterado durante tuning |
| EV-H07 | relatório é reprodutível | rerun por terceiro a partir dos digests | caso/ambiente/bundle não reconstruível |
| EV-H08 | framework L2 só entra por ganho | runner próprio × candidato | framework adiciona dependência sem reduzir defeito/esforço |

## 16. Testes de aceitação

| ID | Teste | Aceite |
|---|---|---|
| EV-T01 | schema de case/run/result/report | campos, enums, unidade e fingerprints válidos |
| EV-T02 | fixture positiva/negativa por UC | oracle separa resultado correto/incorreto |
| EV-T03 | alteração de oracle após run | nova versão e baseline obrigatório |
| EV-T04 | baseline/candidato não comparáveis | runner marca `inconclusive`, não calcula claim |
| EV-T05 | missing/blocked/infra/flaky | cada caso segue regra pré-registrada e aparece no denominador apropriado |
| EV-T06 | múltiplas tentativas | nenhuma é descartada; custo e política k corretos |
| EV-T07 | hard-gate mutant corpus | toda violação bloqueia promotion |
| EV-T08 | holdout access | acesso e abertura auditados; tuning não lê conteúdo |
| EV-T09 | contamination/gaming | gold/rede/test deletion/fixture coding detectados ou marcados |
| EV-T10 | reproducibility rerun | manifest digests iguais; diferenças explicadas |
| EV-T11 | statistical report | efeito, intervalo, discordâncias e limite de inferência presentes |
| EV-T12 | promotion linkage | bundle promovido tem fingerprint idêntico ao avaliado |

## 17. Decisões

| ID | Decisão | Estado | Reabertura |
|---|---|---|---|
| EV-D01 | benchmark interno governa promoção; externo é complementar | aceita | caso interno sem validade demonstrada |
| EV-D02 | promoção é pareada e lexicográfica | aceita | novo desenho com menor viés comprovado |
| EV-D03 | QG-01–04 são hard gates no corpus | aceita | não reabrir no P0 |
| EV-D04 | limiares de ganho/custo ficam TBD até baseline | aceita | após MP-P0 e pré-registro |
| EV-D05 | começar com UC-01–05 + negativos; crescer por cobertura | aceita | análise de poder/diversidade |
| EV-D06 | LLM judge não é oracle único | aceita | calibração independente + baixo risco, ainda auxiliar |
| EV-D07 | nenhuma melhor tentativa é omitida | aceita | política operacional explicitamente mede best-of-k |
| EV-D08 | runner simples é L1; Inspect/outro framework é L2 | aceita | EV-H08 |

## 18. Questões abertas

| ID | Questão | Método | Bloqueia |
|---|---|---|---|
| OD-EV-01 | fixtures e oracles exatos de UC-01–05 | construção + teste de mutantes | gate funcional P0 |
| OD-EV-02 | baseline manual/sistema e bundle inicial | execução MP-P0 | thresholds/promoção |
| OD-EV-03 | efeito mínimo e margens por métrica | custo de erro + piloto + análise de poder | claim comparativo |
| OD-EV-04 | tamanho/repetições/estratos | variância piloto e efeito mínimo | estudo confirmatório |
| OD-EV-05 | owner/controle do holdout | processo e ACL | claim independente |
| OD-EV-06 | runner próprio ou framework | spike EV-H08 | implementação WP-21 |
| OD-EV-07 | retenção/licença de repos e artifacts | data inventory/jurídico | corpus real |
| OD-EV-08 | quais eventos/result schemas entram em v1 | EvaluationReport/GovernanceBundle schemas fechados; evento organizacional adiado | automação de promotion |

## 19. Registro de evidências

| ID | Classe | Afirmação delimitada | Fonte | Confiança | Validade/impacto |
|---|---|---|---|---|---|
| EV-C01 | fato normativo voluntário | AI RMF Measure recomenda métodos/métricas apropriados, incerteza, benchmarks, documentação e revisão | [S5] | alta | NIST 1.0 em revisão |
| EV-C02 | resultado primário | SWE-bench original contém 2.294 issues de 12 repositórios Python e avalia patches por ambiente de repo | [S6] | alta no corpus | não generaliza ao produto |
| EV-C03 | fato de artefato | SWE-bench mantém harness e subsets, incluindo Verified com 500 casos revisados | [S7], [S8] | alta | revalidar versão/commit |
| EV-C04 | fato de software | Inspect estrutura eval em dataset/task, solver/tools e scorer com logs | [S9] | alta para capability | não prova adoção |
| EV-C05 | inferência | corpus externo público não mede hard gates e UCs próprios | [S1]–[S9] | alta | benchmark interno obrigatório |
| EV-C06 | inferência | pareamento, pré-registro e relato por caso reduzem graus de liberdade analíticos | protocolo + EV-H04/06 | média-alta | validar no primeiro estudo |
| EV-C07 | decisão | segurança/integridade precedem qualidade agregada | QG-01–04 e governança | alta como decisão | não reabrir P0 |
| EV-C08 | desconhecido | distribuição real de tarefas, variância, efeito mínimo e custo | OD-EV-01–07 | baixa | claims continuam exploratórios |

## 20. Fontes e busca

- <a id="s1"></a>**[S1]** ACI Arena. [Casos de uso](../produto/casos_de_uso.md). Revisão de 12 ago. 2026.
- <a id="s2"></a>**[S2]** ACI Arena. [Requisitos funcionais](../produto/requisitos_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s3"></a>**[S3]** ACI Arena. [Requisitos não funcionais](../produto/requisitos_nao_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s4"></a>**[S4]** ACI Arena. [Governança de IA v2](governanca_de_ia.md). 13 ago. 2026.
- <a id="s5"></a>**[S5]** NIST. [AI RMF Core — Measure e Manage](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/). Consulta em 13 ago. 2026; versão 1.0 em revisão.
- <a id="s6"></a>**[S6]** Jimenez et al. [SWE-bench: Can Language Models Resolve Real-World GitHub Issues?](https://arxiv.org/abs/2310.06770). ICLR 2024; consulta em 13 ago. 2026.
- <a id="s7"></a>**[S7]** SWE-bench. [Repositório e evaluation harness oficiais](https://github.com/SWE-bench/SWE-bench). Consulta em 13 ago. 2026; fixar commit ao executar.
- <a id="s8"></a>**[S8]** SWE-bench. [CLI/subsets e formato de submissão](https://github.com/SWE-bench/sb-cli). Consulta em 13 ago. 2026; fixar versão.
- <a id="s9"></a>**[S9]** UK AI Security Institute. [Inspect AI — framework de avaliações](https://inspect.aisi.org.uk/). Consulta em 13 ago. 2026; fixar versão se avaliado.

**Busca executada em 13/08/2026:** NIST AI RMF Measure/Manage, artigo e repositório oficial SWE-bench, subsets/CLI e documentação oficial Inspect. Também foram procuradas críticas acadêmicas recentes sobre contamination e oracle; elas sustentam hipóteses de risco, não números usados como verdade universal. Claims de leaderboards e fornecedores foram excluídos como base de promoção.

## 21. Critério de encerramento

A revisão documental está encerrada porque unidade, camadas, corpus, splits, oracles, métricas, incerteza, não determinismo, hard gates, promoção, contaminação, runner, relatório, falhas, hipóteses e testes estão definidos. A capacidade de avaliação não está implementada nem validada até:

- EV-T01–12 passarem;
- UC-01–05 terem fixtures e mutantes independentes;
- `MP-P0` registrar ambiente e baseline;
- efeito mínimo, margem, amostra e repetições serem pré-registrados;
- holdout e responsáveis serem instituídos;
- threat/sandbox/fault corpus cobrirem os hard gates;
- EvaluationReport/GovernanceBundle já estão congelados em rc.7, com candidate fingerprint sem ciclo e task de evidência explícita; faltam runner, corpus e promoção organizacional real.

O estudo autoriza construir corpus, manifests, runner L1 e relatórios. Não autoriza declarar superioridade, produtividade, segurança, equivalência, portabilidade ou sucesso populacional a partir de smoke tests, média única ou leaderboard externo.
