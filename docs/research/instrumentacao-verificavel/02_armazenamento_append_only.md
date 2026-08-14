# Estudo 02: armazenamento append-only

**Pergunta:** como persistir evidencias de execucao do agente de modo consultavel, verificavel e compativel com privacidade?
**Decisao informada:** desenho do event store, checkpoint e retencao.
**Hipotese H-AA01:** um banco append-only com permissoes de escrita restritas, cadeia por stream, Merkle root por lote e copia em dominio administrativo separado satisfaz o P0 melhor que blockchain.
**Refutacao:** se for exigida verificacao por partes sem relacao de confianca, ou se a ancora externa nao atender a auditoria requerida, avaliar log de transparencia/federado para o subconjunto de eventos criticos.

## Valor real para a IA

Armazenamento append-only preserva os exemplos reais que ligam configuracao a resultado. Isso permite reproduzir uma falha, recalcular metricas depois de melhorar um avaliador, comparar versoes de prompt/modelo/ferramenta e criar conjuntos de regressao. Sem essa continuidade, a telemetria vira apenas painel momentaneo e a IA nao acumula aprendizado operacional.

Ele nao torna o dado automaticamente correto. Um log persistente de eventos incompletos, sem rotulo de sucesso e com prompt sensivel em texto aberto apenas aumenta custo e risco. A densidade de informacao deve vir de relacoes entre evento, versao, evidencia e resultado verificado.

## Topicos centrais

| Topico | Perguntas de pesquisa | Direcionamento para o projeto |
|---|---|---|
| Streams e ordem | Qual e a unidade de ordenacao: sessao, tarefa, projeto, ferramenta? | Usar sequencia por `task_id` ou `session_id`; nao prometer ordem global sem necessidade. |
| Imutabilidade tecnica | Quem pode inserir, alterar ou apagar? Como uma tentativa e detectada? | Conta de aplicacao somente `INSERT`; migrations, delecao e correcoes passam por conta administrativa auditada. |
| Checkpoints | Como provar que o log nao encolheu nem foi bifurcado? | Raiz Merkle assinada por lote; armazenar tree size e root anterior para prova de consistencia. |
| Consulta | Como achar um incidente sem abrir payload sensivel? | Indices em ids pseudonimizados, tipo, resultado, ferramenta, modelo, versao de politica e janela temporal. |
| Replay | Que entradas sao suficientes para repetir uma execucao? | Manifesto de replay com referencias imutaveis: modelo, parametros, prompt template, contexto, ferramentas, respostas fixadas e estado do repositorio. |
| Retencao | O que fica quente, frio, resumido ou apagado? | Separar evidencia minima, conteudo sensivel e agregados. Definir TTL por classe e legal hold antes do esquema final. |

## Topicos perifericos, mas necessarios

- WORM em armazenamento de objeto: investigar retenction lock/versionamento como copia imutavel de checkpoints, sem depender do banco operacional.
- Consistencia entre replicas: definir comportamento de falha, duplicata e idempotencia antes de escalar.
- Merkle proof: uma prova precisa incluir direcao/posicao de cada irmao. Uma lista simples de hashes nao e suficiente para verificacao geral.
- Redacao antes da persistencia: o log deve registrar classificacao e hash do segredo detectado, nao o segredo nem o texto que o contem.
- Direito de exclusao: usar referencias a cofre separado permite apagar o conteudo autorizado mantendo um tombstone de evidencia e hash, quando a politica permitir.
- Custo: eventos de alta cardinalidade exigem taxa de amostragem para traces, mas nunca para eventos de seguranca/decisao critica.

## Arquitetura candidata apos P0

```text
Agent/MCP/Policy
      |  OpenTelemetry trace + EvidenceEnvelope
      v
Redactor and classifier ----> encrypted evidence vault (opt-in payload)
      |
      v
Append-only event store ----> query projection / metric warehouse
      |
      +--> batch Merkle root + signature --> immutable object copy
      |                                      |
      +--> independent verifier <------------+
```

O P0 ja define SQLite com WAL, `synchronous=FULL`, writer logico, DDL com triggers defensivos, cadeia por tarefa, backup/restore e fault profile DB-F01..DB-F16. A extensao deve preservar esse modelo no perfil local e adicionar checkpoints assinados e copia independente sem abrir um segundo writer. Uma blockchain publica nao substitui o cofre, as consultas, a classificacao de dados nem o ciclo de avaliacao.

### Invariantes obrigatorios de persistencia

| Invariante | Mecanismo | Evidencia de auditoria |
|---|---|---|
| Nao ha fato parcial | uma transacao para evento, journal e projection | fault injection antes/depois de cada fase de commit |
| Nao ha overwrite de evidencia | API append-only, triggers e sem `INSERT OR REPLACE` | tentativa direta de UPDATE/DELETE e revisao do DDL |
| Ordem e cadeia por tarefa | `sequence`, CAS de sequence e `previous_event_digest` | replay integral e corpus de reordenacao |
| Conteudo e metadata nao se confundem | artifacts por referencia/digest/lifecycle | teste de artifact ausente, alterado, quarentenado e tombstoned |
| Backup nao e apenas copia | API de backup, manifest e verificacao separada | restore em caminho novo, checks e replay |
| Falha externa nao vira sucesso | estado inconclusivo e reconciliacao | timeout apos efeito e contador externo por intent |

## Gaps verificados no repositorio

| ID | Observacao | Impacto | Proximo passo |
|---|---|---|---|
| AA-G01 | O P0 possui ADR-008, DDL SQLite e DB-F01..DB-F16 especificados; os resultados de fault profile e backup/restore precisam estar no pacote auditado. | Nao confundir especificacao ou testes unitarios da Onda A com demonstracao de durabilidade real. | Auditoria executa/adquire evidencias dos faults aplicaveis ao ambiente alvo. |
| AA-G02 | `MerkleProvenanceTree` em `packages/` nao e a base P0 e sua prova nao traz direcao/posicao. | Reuso direto pode introduzir prova incorreta. | Criar implementacao nova, com perfil formal e vetores, sem importar o package legado. |
| AA-G03 | A extensao ainda nao define storage separado para checkpoint, politica de backup externo ou monitor anti-fork. | Um operador que controla aplicacao e storage pode reescrever uma cadeia local. | Definir dominio administrativo independente e executar IV-EXP02 ampliado. |
| AA-G04 | Retencao, legal hold e destruicao de payload ainda dependem da politica de dados. | Acumulo ou descarte inadequado reduz valor probatorio e aumenta risco. | Aplicar o estudo 06 antes de armazenar payload de replay. |

## Metricas e gates

| Metrica | Definicao | Gate inicial |
|---|---|---|
| Durabilidade de evidencia critica | eventos criticos confirmados pelo store / eventos emitidos | 100% ou falha fechada para o usuario; nunca silencio |
| Duplicacao | eventos com mesma chave idempotente aceitos mais de uma vez | 0 duplicatas logicas |
| Ordem por stream | pares de eventos fora de sequencia / pares esperados | 0 em testes concorrentes |
| Recuperacao | tempo e completude de reconstruir projection a partir do stream | medir em corpus de referencia e definir SLO apos baseline |
| Verificacao de checkpoint | batches validados / batches produzidos | 100%; divergencia gera alerta de alta prioridade |
| Cobertura de replay | execucoes falhas com manifesto reproduzivel / falhas elegiveis | meta inicial >= 95%, excluindo chamadas externas nao gravadas |
| Retencao conforme politica | objetos fora do TTL ou eliminados cedo / objetos auditados | 0 violacoes |

## Evidencias e limites

| ID | Afirmacao | Classe | Evidencia | Confianca |
|---|---|---|---|---|
| AA-E01 | Merkle trees permitem provar inclusao e que um estado posterior e superconjunto de estado anterior. | Fato | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) | Alta para o protocolo de CT; implementacao local precisa de testes |
| AA-E02 | Logs podem mostrar visoes inconsistentes a clientes diferentes se nao houver monitoramento/ancora apropriada. | Fato | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) | Alta |
| AA-E03 | Event store + assinatura de lote e a melhor escolha P0. | Decisao proposta | premissas deste estudo | Media; depende de IV-EXP01 e IV-EXP02 |

## Perguntas em aberto

1. O ambiente alvo e local, cloud ou hibrido? Isso determina o mecanismo de WORM e KMS viavel.
2. Qual volume esperado de eventos por tarefa e qual janela de consulta operacional?
3. Quais dados podem ser preservados para replay e sob qual consentimento/classificacao?
