# Estudo 04: plano experimental e de implementacao

**Objetivo:** decidir a arquitetura por evidencias produzidas no IDEIA_aci, nao por comparacao abstrata de ferramentas.
**Estado de planejamento:** P0 encerrado para planejamento por diretriz do projeto; Onda A fechada internamente e pendente de auditoria definitiva. Este plano organiza a extensao posterior, sem reabrir o P0.
**Principio:** uma entrega so avanca se gerar evidencia reutilizavel ou reduzir um risco material.

## Mapa de dependencias

```text
Contrato de evento + classificacao de dados
             |
             +--> redactor --> writer append-only --> checkpoint assinado --> verificador
             |
             +--> adaptador OTel --> traces/metricas --> joins de qualidade --> avaliacoes
                                                                    |
                                                                    v
                                                        baseline, experimento e gate de promocao
```

## Backlog posterior ao P0

| Prioridade | Topico | Pergunta que precisa ser respondida | Evidencia de encerramento |
|---|---|---|---|
| Onda B-0 | Contrato e dados | Que extensoes sao necessarias alem do EventEnvelope P0? | ADR/schema versionado, tabela de classificacao, testes com secrets canario |
| Onda B-0 | Integridade | O verificador detecta adulteracao, exclusao, reordenacao e chave invalida? | Suite adversarial independente e relatorio de resultados |
| Onda B-0 | Valor para qualidade | A evidencia permite diagnosticar falhas e gerar regressoes? | 20 falhas reais/sinteticas classificadas e >= 95% de cobertura de diagnostico |
| P1 | Persistencia | O store permanece correto sob concorrencia, queda e replay? | Teste de carga/falha com SLOs e restore reproduzivel |
| P1 | Identidade | Qual KMS/OIDC e rotacao atendem ao ambiente de deploy? | Spike com assinatura, revogacao e verificacao de evidencia antiga |
| P2 | Ancora externa | O projeto realmente precisa provar existencia a terceiro? | Caso de uso, ameaca, custo e PoC; se nao, manter fora do escopo |
| P2 | TEE e blockchain | O adversario inclui operador/host comprometido ou organizacoes sem confianca mutua? | Threat model aprovado; sem ele, nao implementar |

## Experimentos obrigatorios

| ID | Experimento | Metodo | Metrica primaria | Criterio de decisao |
|---|---|---|---|---|
| IV-EXP01 | Contrato e redacao | Gerar corpus com prompt injection, tokens falsos, PII sintetica e tool I/O; validar schema e writer | vazamento proibido | 0 vazamentos; cada evento critico persiste metadata minima valida |
| IV-EXP02 | Integridade e checkpoint | Inserir, alterar, apagar, reordenar e bifurcar eventos/batches; executar verificador fora do processo escritor | taxa de deteccao | 100% das adulteracoes conhecidas detectadas; 0 falso positivo no corpus valido |
| IV-EXP03 | Diagnostico de IA | Executar corpus fixo de tarefas com telemetria basica versus instrumentada; revisores cegos localizam causa | cobertura e tempo de triagem | melhora predefinida antes do teste; reportar intervalo e discordancias |
| IV-EXP04 | Replay | Selecionar falhas com manifesto; executar em ambiente congelado e comparar resultado | taxa de reproducao | >= 95% das falhas elegiveis reproduzidas; excecoes categorizadas |
| IV-EXP05 | Overhead | Medir p50/p95 de tarefa, CPU, bytes/evento, custo de storage e verificacao em volumes crescentes | overhead p95 | limite decidido a partir do baseline; nao escolher numero arbitrario antes da medida |
| IV-EXP06 | Promocao de variante | Alterar somente uma variavel por vez: prompt, modelo, retriever ou tool | sucesso verificado | promover apenas com ganho e sem regressao de seguranca, privacidade ou reproducao |

## Sequencia de implementacao proposta

### Entrega B-1: fundacao observavel e segura

- Criar `EvidenceEnvelope` versionado e catalogo fechado de `event_type`.
- Implementar classificacao de dados e redactor antes de qualquer persistencia.
- Mapear `trace_id` e `span_id`; manter o adaptador OpenTelemetry isolado.
- Definir caso de teste de segredo canario, PII sintetica e injecao indireta.

**Gate B-1:** `IV-EXP01` aprovado; schema versionado; sem prompt/output bruto por padrao.

### Entrega B-2: evidencia verificavel

- Criar writer idempotente append-only por stream.
- Criar checkpoint de lote com raiz Merkle, assinatura, `tree_size`, root anterior e `key_id`.
- Criar verificador CLI/biblioteca sem dependencia do writer.
- Testar alteracao, exclusao, reordenacao, duplicacao, chave expirada e rotacao.

**Gate B-2:** `IV-EXP02` aprovado; sem alegar TEE, blockchain ou imutabilidade absoluta.

### Entrega B-3: qualidade e replay

- Instrumentar contexto, plano, LLM, ferramentas, politicas e verificacao final.
- Criar manifesto de replay com referencias imutaveis e cofre de payload opt-in.
- Integrar feedback humano/resultado de testes para formar casos de regressao.

**Gate B-3:** `IV-EXP03` e `IV-EXP04` aprovados contra baseline publicado internamente.

### Entrega B-4: operacao controlada

- Criar projections, dashboards e alertas para anomalia, falha de assinatura, lacuna de evento e violacao de retencao.
- Medir overhead e custo com retencao quente/fria.
- Definir processo de promocao/reversao de alteracoes do agente.

**Gate B-4:** `IV-EXP05` e `IV-EXP06` aprovados; SLOs e runbook de incidente revisados.

## Matriz de riscos e contramedidas

| Risco | Sinal de deteccao | Contramedida | Dono sugerido |
|---|---|---|---|
| Log vaza segredo | secret scanner/canario em evento persistido | redacao antes do writer, cofre separado, testes de regressao | seguranca |
| Writer altera ou apaga evidencia | divergencia de checkpoint, permissao negada, hash invalido | append-only, roles, copia WORM e verificador independente | plataforma |
| Telemetria cara demais | bytes/evento e p95 aumentam | amostrar traces de rotina, manter eventos criticos, agregacao | plataforma |
| Dados sem utilidade para IA | baixa cobertura de diagnostico ou baixa reproducao | remover campos sem decisao associada; adicionar joins de resultado | IA/avaliacao |
| Goodhart de metrica | custo cai e sucesso verificado cai | guardrails eliminatorios e corpus cego | IA/avaliacao |
| Falsa confianca criptografica | assinatura valida, mas acao indevida | ligar identidade a policy, aprovacoes e controles de execucao | seguranca |
| Codigo candidato nao integravel | build/teste falha ou licenca desconhecida | gate de proveniencia, manifest e contract tests | engenharia |

## Registro de gaps que bloqueiam decisao final

| ID | Gap | Consequencia | Acao de pesquisa |
|---|---|---|---|
| IV-G01 | Ambiente de deploy e KMS nao definidos | nao e possivel escolher algoritmo, rotacao ou WORM | registrar cenarios local/cloud/hibrido e executar spike por cenario |
| IV-G02 | Corpus de tarefas e criterio objetivo de sucesso nao definidos | nao ha como provar que a IA melhorou | criar benchmark minimo representativo e congelar baseline |
| IV-G03 | Politica de retencao/classificacao nao definida | replay e logs podem violar privacidade | produzir matriz de dados, TTL e acessos antes de guardar payload |
| IV-G04 | Packages ainda nao tiveram build/testes demonstrados | qualquer estimativa de reuso e incerta | restaurar grafo, executar testes e registrar resultado reproduzivel |
| IV-G05 | Ameaca de auditoria externa nao formalizada | blockchain/TEE podem virar complexidade sem valor | threat model com atores, capacidades e requisito de prova |

## Criterio de encerramento dos estudos

Os estudos podem sair de "proposta" para "decisao validada" somente se cada hipotese tiver experimento executado, artefato de resultado, evidencia contraria buscada e decisao registrada. Ate la, a recomendacao de arquitetura e uma inferencia de confianca media, nao uma afirmacao de prontidao.
