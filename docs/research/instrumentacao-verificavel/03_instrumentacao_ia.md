# Estudo 03: instrumentacao para melhorar a IA

**Pergunta:** quais sinais devem ser capturados para transformar execucoes de agente em diagnostico e melhoria mensuravel?
**Decisao informada:** taxonomia de eventos, politica de dados, conjuntos de avaliacao e SLOs.
**Hipotese H-IN01:** medir cada decisao material do agente com suas entradas referenciadas, versoes e resultado verificado reduz o tempo para localizar regressao e aumenta o sucesso em tarefas do benchmark, comparado a medir somente custo e latencia.
**Refutacao:** se a cobertura adicional nao elevar cobertura de diagnostico, rapidez de triagem ou sucesso verificado no experimento controlado, reduzir a instrumentacao ao subconjunto de maior sinal.

## O que a IA recebe de valor

A instrumentacao nao deve ser alimentada diretamente de volta ao modelo como memoria automatica. Primeiro ela forma um sistema de aprendizagem operacional:

1. identifica uma falha verificavel;
2. separa causa provavel: contexto, planejamento, ferramenta, politica, modelo ou ambiente;
3. transforma o caso em avaliacao/regressao com rotulo;
4. testa uma alteracao isolada; e
5. promove somente se melhorar a metrica primaria sem piorar guardrails.

O ganho vem da qualidade causal do registro, nao do volume. Um evento util responde: "qual decisao foi tomada, com que versao de contexto e politica, por qual ferramenta, qual foi o resultado verificado e qual evidencia permite repetir o caso?"

## Taxonomia central de eventos

| Momento | Evento | Campos de alta densidade | Resultado esperado |
|---|---|---|---|
| Inicio | `agent.task.started` | tipo de tarefa, benchmark/caso, commit, configuracao do agente, trace | segmentar comparacoes validas |
| Contexto | `context.selected` / `context.excluded` | hashes/referencias, fonte, score, motivo, tokens, versao do retriever | descobrir perda ou contaminacao de contexto |
| Planejamento | `agent.plan.created` / `plan.revised` | plano estruturado, motivo da revisao, limite, versao de prompt | medir loops, mudancas e qualidade do plano |
| LLM | `gen_ai.request` / `gen_ai.response` | provider, modelo, parametros, tokens, latencia, finish reason, hash do payload | separar custo, degradacao e variacao de modelo |
| Ferramenta | `tool.call.started` / `completed` / `blocked` | tool version, input/output refs, autorizacao, policy, exit/status, duracao | localizar erro de ferramenta, excesso de agencia ou bloqueio |
| Politica | `policy.evaluated` | policy id/version, decisao, regra, risco, aprovacao humana | provar e melhorar guardrails |
| Resultado | `task.verified` / `task.failed` | testes executados, diff hash, criterios, avaliador e rotulo humano quando houver | produzir sinal de qualidade confiavel |
| Seguranca | `security.prompt_injection.detected`, `secret.redacted` | categoria/regra, origem, acao tomada, sem payload bruto | medir defesas sem multiplicar vazamento |
| Feedback | `human.override` / `human.rating` | decisao anterior, razao padronizada, correcao e confianca | priorizar casos que a automatizacao errou |

O registry P0 ja possui 33 eventos e contratos para tarefa, contexto, plano, provider, tool, policy, verificacao, artifacts, budget e redacao. A instrumentacao posterior deve complementar o registry, nao criar uma taxonomia paralela. Os nomes devem ser mapeados para as convencoes OpenTelemetry Generative AI vigentes na data de implementacao. As convencoes evoluem e foram migradas para repositorio dedicado; manter o adaptador em um modulo evita espalhar atributos instaveis pelo projeto.

### Politica de captura por classe

| Classe de sinal | Persistencia de evidencia | Trace | Metrica | Amostragem |
|---|---|---|---|---|
| Decisao de politica, efeito, verificacao, redacao, recuperacao | obrigatoria e append-only | correlacao obrigatoria | contador agregado | nunca amostrar a evidencia |
| Falha, cancelamento, inconclusao e anomalia | obrigatoria | trace completo quando permitido | contador e latencia | 100% no corpus e producao definida |
| Sucesso de tarefa | evento final e referencias | trace conforme perfil | sucesso, custo, duracao | trace pode usar tail sampling |
| Span interno de alta frequencia | nao e evidencia primaria | trace opt-in | agregados de baixa cardinalidade | taxa configuravel e auditada |

O collector pode transformar, filtrar e enriquecer telemetria por governanca, custo e seguranca; redacao primaria deve acontecer antes do SDK/exporter. Transformacao no collector e defesa em profundidade, nao permissao para emitir dado sensivel do processo.

## Topicos perifericos, mas decisivos

- Amostragem: traces de sucesso rotineiro podem ser amostrados; incidentes, mudanca persistente, autorizacao e falha de verificacao devem ser 100% capturados.
- Cardinalidade: `task_id` e hash nao devem virar labels de metricas Prometheus. Eles pertencem a traces/logs consultaveis; metricas usam dimensoes finitas.
- Qualidade de avaliador: LLM-as-judge deve medir concordancia com avaliacao humana e usar casos cegos. Nunca usar o proprio score do modelo como unica verdade.
- Causalidade: nao comparar duas versoes quando modelo, prompt, ferramentas e corpus mudaram juntos.
- Privacidade: prompts completos, diffs e tool I/O precisam de classificacao e opt-in; por padrao registrar hash, tamanho, categoria e referencia protegida.
- Anti-Goodhart: metas de latencia, custo ou numero de tools podem incentivar respostas piores. O gate sempre combina sucesso verificado e guardrails.

## Gaps verificados no repositorio

| ID | Observacao | Impacto | Proximo passo |
|---|---|---|---|
| IN-G01 | P0 ja fixa IDs de correlacao, `VerificationResult`, `EvaluationReport` e eventos de contexto/politica/tool. | A extensao deve produzir joins por IDs P0, nao depender de atributos livres de spans. | Definir projection de avaliacao e contract tests de correlacao. |
| IN-G02 | `observability-engine` legado aceita `Record<string, unknown>` e nao e a fronteira normativa do P0. | Facilita vazamento e schema drift se integrado diretamente. | Criar adaptador novo com allowlist de atributos e redacao obrigatoria. |
| IN-G03 | Os contratos suportam resultado e avaliacao, mas ainda e preciso executar corpus para saber se os campos reduzem tempo de triagem ou elevam sucesso verificado. | Valor para IA permanece hipotese ate experimento. | Rodar IV-EXP03 com revisores cegos e denominadores congelados. |
| IN-G04 | O OTel GenAI semconv evolui rapidamente. | Mudanca silenciosa de nome/semantica pode quebrar dashboard e comparacao historica. | Fixar versao/schema URL, mapear migracoes e testar compatibilidade no CI. |

## Metricas para elevar densidade e nivel

| Metrica | Formula | Por que importa | Anti-metrica |
|---|---|---|---|
| Sucesso verificado por tarefa | tarefas que passam criterios objetivos / tarefas concluidas | qualidade principal para agente de engenharia | nao contar texto "concluido" como sucesso |
| Cobertura de diagnostico | falhas com modelo+prompt+contexto+ferramentas+politica+verificacao referenciados / falhas elegiveis | mede se um incidente pode virar caso de melhoria | nao exigir payload bruto |
| Taxa de reproducao | falhas reproduzidas pelo manifesto / tentativas de replay | valida completude da evidencia | separar falhas externas nao deterministicas |
| Precisao de roteamento de falha | classificacoes confirmadas / classificacoes revisadas | mostra se o dado ajuda a encontrar causa | revisar amostra humana cega |
| Eficiencia de contexto | sucesso verificado por 1k tokens de contexto | encontra contexto caro sem beneficio | nunca otimizar isoladamente |
| Utilidade de ferramenta | tarefas verificadas apos uso da tool / usos da tool | revela ferramenta que gera passos mas nao resultado | estratificar por tipo de tarefa |
| Intervencao humana | tarefas com override ou correcao / tarefas | identifica limites reais da autonomia | distinguir aprovacao obrigatoria de correcao |
| Regressao por versao | diferenca de sucesso e guardrails contra baseline | bloqueia promocao de mudanca pior | intervalo de confianca e corpus fixo |
| Vazamento evitado | payloads sensiveis bloqueados/redigidos / deteccoes | mede protecao da propria telemetria | nao registrar o conteudo bloqueado |

## Proposta de score de decisao para experimento

O projeto nao deve colapsar qualidade em uma nota unica para producao. Para decidir entre variantes em um conjunto fixo, usar um score apenas como triagem, com guardrails eliminatorios:

```text
Elegivel se: vazamento = 0, eventos criticos assinados = 100%, regressao de seguranca = 0

Score de triagem =
  0.55 * sucesso_verificado
  0.20 * cobertura_de_diagnostico
  0.15 * taxa_de_reproducao
  0.10 * eficiencia_de_contexto_normalizada
```

Latencia e custo sao reportados separadamente. Uma variante mais barata nao e promovida se reduzir sucesso verificado alem da margem declarada.

## Evidencias e limites

| ID | Afirmacao | Classe | Evidencia | Confianca |
|---|---|---|---|---|
| IN-E01 | O NIST AI RMF trata medicao, documentacao e monitoramento como funcoes do gerenciamento de risco de IA. | Fato | [AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) | Alta |
| IN-E02 | Para MCP, registrar categorias, ids e limites em vez de prompt/tool I/O completo reduz risco secundario de vazamento e injecao em log. | Fato | [OWASP Logging Vocabulary](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html) | Alta como orientacao; adequacao legal local requer revisao |
| IN-E03 | Instrumentacao completa melhora sucesso do agente. | Hipotese | ainda sem experimento controlado no IDEIA_aci | Baixa; validar IV-EXP03 |

## Perguntas em aberto

1. Qual e o conjunto de tarefas representativo do IDEIA_aci e quais criterios sao objetivamente verificaveis?
2. Quem rotula falhas e como medir a concordancia entre avaliador automatico e humano?
3. Qual classe de dados pode entrar no cofre de replay, por quanto tempo e com qual controle de acesso?
