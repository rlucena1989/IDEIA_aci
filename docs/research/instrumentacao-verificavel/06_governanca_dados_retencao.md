# Estudo 06: governanca de dados, privacidade e retencao

**Pergunta:** como manter evidencia suficiente para melhoria e auditoria sem transformar observabilidade em repositorio de prompts, codigo ou segredos?
**Decisao informada:** politica de coleta, acesso, retencao, eliminacao e resposta a incidente.
**Principio:** coletar o minimo que permite decidir; reter o minimo que permite reproduzir, investigar e cumprir a politica aprovada.

## O erro que este estudo evita

Mais logs nao significam mais aprendizagem. Em IA agentica, prompt, output, tool I/O, diffs, arquivos e embeddings podem conter codigo proprietario, PII e credenciais. O dado completo deve ser uma excecao governada; hashes, classificacao, tamanho, versao e ArtifactRef sao o padrao para telemetria e evidencias.

## Modelo de dados do P0 e regra de extensao

O P0 ja usa classes D0-D5, `redaction_status`, `retention_class`, ArtifactRef e a regra de que D5 e um handle de segredo, nunca Artifact ou payload de provider. Este estudo nao redefine o significado das classes sem uma decisao proprietaria. Ele exige que a politica operacional publique, para cada classe, destino permitido, transformacao obrigatoria, papeis de leitura, periodo de retencao e destino de descarte.

| Decisao | Regra obrigatoria |
|---|---|
| Coleta | campo so entra em evento se responder a uma decisao, metrica, replay ou requisito de incidente identificado |
| Redacao | executar antes de fingerprint, writer, SDK de telemetria e exportador; collector redige novamente como defesa em profundidade |
| Referencia | evento aponta para ArtifactRef/digest; nunca embute bytes grandes ou secretos |
| Egress | D3/D4 remoto somente com allow explicito para package/request exato; D5 nunca sai |
| Acesso | separar escritor, leitor operacional, auditor, administrador de chave e responsavel por retencao |
| Exclusao | apagar/expirar bytes pelo lifecycle; manter tombstone e evidencia minima somente se a politica permitir |
| Incidente | suspeita de bytes enviados/persistidos invalida alegacao `redaction.failed`; abrir incidente, conter e preservar evidencia minima |

## Fluxo de dados e controles

```text
input, tool output, arquivo, memoria
            |
            v
classificador -> redactor -> validator -> fingerprint
       |             |              |          |
       |             |              |          +--> EventEnvelope P0
       |             |              +--> deny/redaction.failed ou incidente
       |             +--> Artifact staging classificado, se permitido
       +--> D5 handle somente
                                         |
                                         +--> provider/collector somente com politica de destino
```

## Politica de retencao a aprovar

Os periodos nao podem ser inventados neste estudo. A tabela e um contrato de decisao para preencher pelo responsavel de dados e pelo contexto legal aplicavel.

| Classe de registro | Conteudo padrao | Retencao proposta como campo de politica | Legal hold | Descarte verificavel |
|---|---|---|---|---|
| Evidencia minima de tarefa | IDs, digests, versoes, decisao, resultado e checkpoint | `retention.audit_minimum` | suspende expurgo quando autorizado | tombstone + registro de job de expurgo |
| Trace operacional | spans redigidos e atributos allowlisted | `retention.trace_operational` | amostra congelada se incidente | expurgo do backend e confirmacao de job |
| Artifact de replay | bytes autorizados, metadata, digest e lifecycle | `retention.replay_payload` | preservar somente artefatos no escopo | tombstone, revogacao de acesso e verificacao de ausencia |
| Corpus/evaluation | caso, split, resultados e fingerprints | `retention.evaluation` | preservar para reproducao de decisao | deprecar versao sem reescrever relatorio historico |
| D5/secret | somente handle e logs de uso sem material | `retention.secret_audit` | conforme incidente | revogacao/rotacao no secret store; nunca tentativa de apagar copia inexistente |

## Controles de acesso e segregacao

| Papel | Pode | Nao pode |
|---|---|---|
| Agente/writer | criar evidencia permitida e pedir assinatura | ler chave privada, apagar evidencias, exportar D5 |
| Verificador | ler envelope, artifact autorizado e checkpoint | alterar catalogo, criar checkpoint, decidir policy |
| Operador | investigar por IDs, metricas e artefatos autorizados | acessar payload apenas por necessidade e trilha de acesso |
| Auditor | receber pacote minimizado e reproduzir verificacao | obter segredo, alterar dados ou reexecutar efeitos externos por padrao |
| Responsavel por dados | definir classes, retencao e legal hold | modificar evidencias historicas para aplicar politica |
| Administrador de chave | rotacionar/revogar e ler log de uso de chave | alterar evento ou resultado de avaliacao |

Todo acesso a payload de replay deve gerar evento auditavel com principal, justificativa, ArtifactId, classificacao e decisao. O evento de acesso nao contem o payload.

## Qualidade de dados para IA

| Risco | Como aparece | Controle e metrica |
|---|---|---|
| Evento sem resultado | muitas etapas, mas nenhum `VerificationResult` | cobertura de diagnostico; bloquear `sucesso_verificado` sem evidencia |
| Resultado sem contexto | falha nao reproduzivel | taxa de reproducao e obrigatoriedade de fingerprints/referencias |
| Feedback ruidoso | rating humano contradiz teste ou sem razao | registrar origem, confianca e taxa de concordancia entre revisores |
| Corpus contaminado | caso de teste vira contexto de treinamento/memoria | separar corpus, permissoes e digests; registrar finalidade |
| Viagem de dados | D3/D4 aparece em destino nao autorizado | cobertura de classificacao e findings de egress por destino |
| Atributos de alta cardinalidade | backend caro/inutil ou metricas quebradas | cardinalidade por metric name; IDs ficam em trace/log, nao label |

## Testes e auditoria de privacidade

| ID | Teste | Oraculo |
|---|---|---|
| DG-01 | injetar canario em prompt, tool result, arquivo, URL, base64 e stack | byte scan em banco, artifacts, backups, trace export e relatorios retorna zero |
| DG-02 | falhar redactor antes e depois de qualquer possivel envio | antes: `redaction.failed` com `bytes_* = false`; depois: incidente inconclusivo, nunca alegacao de contencao |
| DG-03 | tentar D5 em context package, provider request, artifact e span | negacao antes da persistencia/envio |
| DG-04 | testar papel sem acesso a payload | leitura negada e evento de acesso/negacao registrado sem vazar path/payload |
| DG-05 | executar expiracao e legal hold | bytes elegiveis expurgados; objeto em hold preservado; tombstone e decision record consistentes |
| DG-06 | simular exportador indisponivel | evidencia critica segue a politica fail-closed/fila local; acao insegura nao e liberada |

## Evidencias de referencia

| ID | Uso | Fonte |
|---|---|---|
| DG-E01 | Transformacao de telemetria para governanca, custo e seguranca | [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/transforming-telemetry/) |
| DG-E02 | Retencao de audit records deve seguir periodo definido por politica e suportar investigacao posterior | [NIST SP 800-53 AU-11](https://csrc.nist.gov/CSRC/media/Projects/risk-management/800-53%20Downloads/800-53r5/SP_800-53_v5_1-derived-OSCAL.pdf) |
| DG-E03 | Em MCP, preferir categoria, regra e identificadores a prompt/tool I/O completo | [OWASP Logging Vocabulary](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html) |
| DG-E04 | Privacidade, documentacao e monitoramento precisam ser medidos no contexto de uso | [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) |

## Gaps que exigem decisao de responsavel

1. Definicoes textuais e classificadores operacionais para D0-D4 ainda precisam ser aprovados; o enum sozinho nao e politica.
2. Os periodos de retencao, jurisdicao, base legal, exportacao e legal hold nao podem ser deduzidos por engenharia.
3. O cofre de payload de replay exige decisao de criptografia, recuperacao de chave, acessos de emergencia e impacto de perda de chave.
4. Antes de provider remoto, a avaliacao precisa declarar quais classes podem sair, para qual dominio, com qual contrato e por quanto tempo o fornecedor retem dados.
