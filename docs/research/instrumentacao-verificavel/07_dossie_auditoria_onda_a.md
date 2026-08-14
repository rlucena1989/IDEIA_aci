# Estudo 07: dossie para auditoria definitiva da Onda A

**Objetivo:** fornecer um roteiro para uma auditoria independente decidir o que foi realmente demonstrado, o que esta somente especificado e o que pertence a Onda B.
**Estado de planejamento:** P0 esta encerrado para planejamento por diretriz do projeto. Este dossie nao converte essa decisao em claim empirico; a auditoria e a fonte do veredito tecnico definitivo.

## Escopo minimo da auditoria

| Area | Artefato de referencia | Pergunta do auditor |
|---|---|---|
| Contratos | `docs/implementation/contracts/` | schemas, registry, vetores e invariantes sao coerentes, fechados e reproduziveis? |
| Canonicalizacao | ADR-004 e vetores JCS | mesma instancia gera mesmos bytes/digest e entradas proibidas falham antes do hash? |
| Estado e correlacao | contracts, reducer e matriz | transicoes, causacao, correlation e sequence preservam as invariantes? |
| Persistencia | ADR-008, DDL e fault profile | DDL impede os caminhos proibidos e os faults afirmados foram de fato executados? |
| Artifacts e redacao | ADR-009, schemas e corpus | nenhum dado proibido atravessa staging, banco, trace, backup ou exportador? |
| Validacao | `p0/`, lockfile e `review/` | build, testes, validators e gates sao reexecutaveis em checkout limpo? |
| Rastreabilidade | `traceability/p0_matrix.md`, gates e handoffs | cada requisito material possui oraculo, evidencia e resultado? |
| Seguranca operacional | SEC-INC-001 e politicas | finding aberto esta contido e nao houve credencial real em escopo indevido? |

## Protocolo de reproducao

O auditor deve trabalhar em worktree/checkout limpo com commits e hashes de artefatos fixados. Nao aprovar a partir de print, narrativa ou resultado de maquina do autor sem repetir ao menos uma amostra independente.

1. Registrar SO, versao de Node, hash do commit, lockfile, data/hora e comandos executados.
2. Executar validadores de schema, vetores de canonicalizacao e detector de drift.
3. Executar typecheck, testes P0 e gate `review` conforme os comandos documentados no repositorio.
4. Alterar deliberadamente schemas, vetores, digest, event sequence, approval e dados classificados para verificar que gates falham.
5. Executar os testes de DDL/faults que estiverem implementados em filesystem e ambiente declarados; marcar cada caso ausente como `not_run`, nunca como `pass` inferido.
6. Executar corpus de secret canario e varrer todos os destinos no escopo: banco, WAL, artifacts, backups, relatorios, traces e saida capturada.
7. Produzir um `EvaluationReport`/relatorio de auditoria com denominadores, logs redigidos, artefatos de resultado e findings.

## Matriz de alegacoes

| Claim | Classe atual | Evidencia requerida | Veredito permitido |
|---|---|---|---|
| Onda A possui contratos e gates internos | fato documental | arquivos, hashes e reexecucao dos comandos | confirmado, divergente ou inconclusivo |
| Onda A esta fechada internamente | fato de planejamento/processo | snapshot, handoffs e responsavel | confirmado como processo; nao prova G2 |
| P0 e suficiente para seguranca/recuperacao | resultado empirico | corpus G2, DB/ART/REC fault suites e ambiente fixado | somente pass/fail/inconclusive medido |
| Cadeia de eventos e verificavel | resultado tecnico | vetores, mutation corpus e replay completo | limitado ao mecanismo e ambiente testados |
| Nao ha vazamento de segredo | resultado de corpus | canarios, destinos, scanner, versoes e exclusoes | limitado ao corpus e codificacoes testadas |
| IA funciona melhor pela instrumentacao | hipotese | IV-EXP03/04, baseline, revisao cega e intervalos | promover, manter ou rejeitar hipotese |

## Pontos que exigem reconciliacao antes do veredito

| ID | Divergencia ou risco | Impacto | Acao exigida |
|---|---|---|---|
| AUD-01 | `handoffs/README.md` informa 192 testes verdes para a Onda A; `reviews/2026-08-13-p0-snapshot.md` registra 152/152 no gate e tambem menciona 151/151 em outra linha. | A contagem publicada nao esta univoca e pode indicar snapshot de momentos distintos ou documentacao desatualizada. | Fixar commit, executar comandos, registrar contagem unica por suite e corrigir os documentos com data/commit. |
| AUD-02 | A matriz de gates declara G2 "especificado, nao executado"; o planejamento agora considera P0 concluido. | "Concluido" pode significar planejamento, nao aprovacao de seguranca/recuperacao. | Registrar esses estados separadamente e nao promover G2 sem corpus/fault evidence. |
| AUD-03 | SEC-INC-001 permanece aberto e bloqueia credenciais reais. | Qualquer teste com provider real ou segredo pode extrapolar o escopo seguro. | Confirmar rotacao/invalidation e revisar historico/backups antes de abrir EG-5. |
| AUD-04 | ADR-008 e ADR-009 condicionam promocoes a fault profile por ambiente/filesystem. | DDL e teste unitario nao demonstram durabilidade sob queda/disco cheio/corrupcao. | Marcar cada DB-F/ART-F/REC-F executado, ambiente e evidencia; nao inferir os demais. |
| AUD-05 | Packages em `packages/` sao legados e nao sao a base normativa P0. | Importar ou avaliar esses packages como se fossem implementacao P0 contamina o escopo. | Auditar proveniencia e aderencia separadamente ou exclui-los formalmente. |

## Checklist de qualidade da auditoria

- Auditor e executor principal nao sao a unica mesma identidade para os claims de maior risco.
- Todo resultado referencia commit, lockfile, ambiente, corpus e comando reproduzivel.
- Relatorios incluem numerador, denominador, casos bloqueados, falhos e excluidos, com motivo anterior a execucao.
- Saidas publicadas passam pela mesma redacao de telemetria; nenhum segredo canario ou dado pessoal sintetico vaza no proprio dossie.
- Achados tem severidade, evidencia, impacto, correcao proposta, dono e criterio de reteste.
- O veredito usa `pass`, `fail`, `blocked` ou `inconclusive`; "documentado" nao e sinonimo de "validado".

## Saidas esperadas da auditoria

| Saida | Conteudo minimo |
|---|---|
| Manifesto de execucao | commit, hashes, SO, Node, dependencias, comandos e tempos |
| Relatorio de contratos | schemas, vetores, mutation tests, divergencias e limites |
| Relatorio de persistencia | DDL, backup/restore e fault cases realmente executados |
| Relatorio de dados | corpus canario, destinos varridos, findings e estado de SEC-INC-001 |
| Matriz de rastreabilidade atualizada | requisito -> teste -> evidencia -> resultado -> finding |
| Registro de decisoes | claims aprovados, rejeitados, bloqueados e encaminhados para Onda B |

## Saida para a Onda B

A auditoria nao deve apenas produzir selo. Ela deve devolver uma lista priorizada: controles P0 confirmados a preservar, gaps que bloqueiam assinatura/checkpoint, e requisitos de experimento para provar valor da instrumentacao na qualidade da IA. A implementacao da Onda B so inicia sobre um baseline fixado pelo veredito ou sob lista explicita de riscos aceitos.
