# Estudo 05: modelo de ameacas e limites de confianca

**Pergunta:** que adversario cada controle enfrenta, que evidencia ele preserva e que ataque permanece possivel?
**Decisao informada:** quais controles entram na extensao de logs assinados e quais alegacoes sao proibidas.
**Status:** linha de base para threat review da Onda B; nao substitui teste de penetracao, revisao legal ou auditoria independente.

## Regra central

Toda garantia precisa declarar seu dominio de confianca. A cadeia P0, a assinatura, o backup e a ancora externa protegem contra ameacas diferentes. Somar os nomes dos controles nao soma suas garantias.

| Mecanismo | Detecta | Nao prova |
|---|---|---|
| Schema fechado e canonicalizacao | dado malformado, campo inesperado, ambiguidade de bytes | que o dado era verdadeiro quando foi criado |
| Cadeia de digests por tarefa | alteracao, omissao e reordenacao dentro do conjunto que o verificador recebeu | que o escritor nao reescreveu toda a cadeia antes da verificacao |
| SQLite append-only e backups | sobrescrita acidental e falhas cobertas pelo perfil | resistencia a administrador malicioso ou filesystem comprometido |
| Assinatura de checkpoint | que uma chave autorizada assinou aquele checkpoint | que a pessoa/host por tras da chave agiu corretamente |
| TSA ou log de transparencia | existencia/inclusao segundo o terceiro confiado | verdade semantica do payload ou ausencia de fork sem monitoramento |
| TEE real | medicao de ambiente sob as garantias do hardware/provedor | seguranca de toda a aplicacao, politica ou dado que entrou no enclave |

## Ativos e propriedades a preservar

| Ativo | Propriedades | Falha relevante |
|---|---|---|
| EventEnvelope e cadeia | integridade, ordem, completude por stream, correlacao | uma acao fica sem evidencia ou e atribuida ao contexto errado |
| Politicas, grants e aprovacoes | autenticidade, escopo, validade, nao reuso | ferramenta executa fora da autorizacao |
| Artifacts/replay payloads | confidencialidade, integridade, lifecycle e disponibilidade | prompt, diff ou tool I/O vaza ou nao pode ser reencontrado |
| Chaves de assinatura | exclusividade de uso, rotacao, auditabilidade | atacante produz checkpoint aparentemente valido |
| Projecoes e dashboards | frescor e consistencia com o log | painel indica sucesso/falha que o stream nao sustenta |
| Corpus e EvaluationReport | proveniencia, reproducao, independencia | melhoria aparente vem de corpus alterado ou avaliador enviesado |

## Atores e fronteiras

| Ator | Capacidades assumidas | Nao assumir sem evidencia |
|---|---|---|
| Usuario autenticado | envia tarefa e aprova quando permitido | que conteudo do usuario e instrucao confiavel |
| Modelo/provider | produz texto/tool requests e pode falhar ou ser manipulado | que output e seguro, factual ou autorizado |
| Tool/MCP remoto | retorna dado e pode causar efeito dentro do grant | que tool output nao contem prompt injection ou segredo |
| Processo do agente | canonicaliza, redige e escreve eventos | que esta livre de comprometimento local |
| Operador local | administra processo, banco e backup no perfil P0 | que nao pode alterar arquivos se tiver privilegio do host |
| Collector/backend de telemetria | recebe dados ja redigidos e transforma/exporta | que e local, privado ou que retem dados corretamente |
| KMS/TSA/transparency log | assina, carimba ou registra checkpoint | que conhece a semantica da tarefa ou substitui monitor independente |
| Auditor | le artefatos, reproduz comandos e questiona alegacoes | que aceita logs sem corpus, escopo e ferramentas fixadas |

## Ameacas prioritarias e contramedidas

| ID | Cenario | Controle preventivo | Deteccao/evidencia | Risco residual |
|---|---|---|---|---|
| TM-01 | Prompt ou tool output tenta comandar ferramenta fora do escopo | treats all external content as data; policy, grants e validacao de argumentos | `policy.evaluated`, `tool.call.blocked`, categoria de injecao sem payload bruto | detector pode falhar; capacidade minima e aprovacao seguem necessarias |
| TM-02 | Segredo entra em trace, evento, erro ou artifact | classificacao, redacao antes de hash/writer, D5 como handle, egress allowlist | corpus de canarios, `redaction.failed`, byte scan em todos os destinos | detector incompleto; incidente se houver possivel envio/persistencia |
| TM-03 | Escritor remove, altera ou reordena eventos | sequence/CAS, cadeia P0, triggers e checkpoint assinado | replay, verificador independente, prova de range | host/admin com acesso a writer, storage e chave pode forjar estado local |
| TM-04 | Atacante forja checkpoint | chave nao exportavel/KMS quando disponivel, identity binding, algoritmo allowlist | verificacao de assinatura, `key_id`, auditoria de uso de chave | compromisso de identidade ou KMS e ataque de alta gravidade |
| TM-05 | Log mostra views diferentes a auditores | checkpoint encadeado, copia fora do writer, monitor periodico | comparacao de roots e tree sizes por observadores independentes | sem observador externo, split-view pode permanecer invisivel |
| TM-06 | Duplicacao apos timeout causa efeito material repetido | intent idempotente, approval de uso unico, estado inconclusivo | contador externo por intent e reconciliacao | sistema externo sem idempotencia impede exactly-once |
| TM-07 | Artifact e trocado depois de publicado | digest de bytes, lifecycle, verificacao na leitura e quarentena | ART fault suite, mismatch de digest/tamanho | rollback fisico e secure erase dependem do filesystem |
| TM-08 | Dashboard/metricas escondem incidente por amostragem | evidencia critica nunca amostrada; traces de rotina com politica declarada | comparacao eventos obrigatorios x traces/exportados | backend indisponivel pode atrasar observacao, nao pode liberar acao insegura |
| TM-09 | Avaliador melhora score sem melhorar tarefa | corpus e baseline pinados, hard gates, revisao cega, uma variavel por experimento | EvaluationReport com denominadores, artifacts e versoes | corpus pode nao representar producao; relatar limite de generalizacao |
| TM-10 | Dependencia/tool maliciosa altera comportamento | provenance de build, allowlist, hash/versao, sandbox e vetting | divergencia de manifest/signature, eventos de quarantine | dependencia confiavel pode ter vulnerabilidade desconhecida |

## Requisitos de desenho para a extensao assinada

1. Separar a chave de assinatura da identidade de aplicacao sempre que o ambiente permitir. O processo pede a assinatura; ele nao le a chave privada.
2. Fixar um `signing_profile` versionado: algoritmo, formato, canonicalizacao, separacao de dominio, regras de `key_id` e verificacao historica.
3. Modelar estado de chave: `active`, `retiring`, `revoked`, `compromised` e `unknown`. Revogacao impede novo uso, mas checkpoints validos antigos permanecem verificaveis com a politica historica registrada.
4. Registrar o escopo assinado: stream, range, algoritmo Merkle, roots anterior/atual, identidade e horario do emissor.
5. Tratar tempo local como observacao operacional. Exigir TSA RFC 3161 apenas quando a decisao de negocio precisar de prova de tempo externa.
6. Manter verificador sem acesso de escrita ao catalogo e sem dependencia da implementacao que produziu o evento.
7. Fazer a verificacao falhar fechada para schema, digest, sequence, assinatura, perfil desconhecido e chave desconhecida; resultado deve diferenciar `invalid`, `unsupported`, `unavailable` e `inconclusive`.

## Plano de teste adversarial

| Grupo | Casos minimos | Aceite |
|---|---|---|
| Canonicalizacao | chave duplicada, Unicode limite, numero fora de range, array reordenado, profile/purpose trocado | todos rejeitados ou produzem digest esperado conforme ADR-004 |
| Cadeia | trocar payload, ID, sequence, digest anterior; apagar, inserir e trocar ordem | 100% das mutacoes conhecidas detectadas |
| Merkle/checkpoint | folha, direcao, range, root, tree size, checkpoint anterior e assinatura adulterados | prova/assinatura invalida nunca e aceita |
| Chaves | chave errada, expirada, revogada, perfil desconhecido, rotacao e compromisso simulado | politica historica produz decisao explicita e auditavel |
| Split view | dois checkpoints distintos para mesmo predecessor/range | monitor emite finding de fork e preserva ambos os artefatos |
| Dados sensiveis | secrets canario em texto, URL, base64, stdout, stack e trace attributes | nenhum byte proibido persiste/exporta; falha vira incidente se nao puder ser provado |
| Reproducao | auditor independente monta ambiente e executa verificador a partir de pacote fechado | mesmo veredito sobre corpus e checkpoints fornecidos |

## Criterios de aceite para auditoria

- Cada claim de integridade aponta para uma ameaca, um mecanismo, um teste e uma limitacao.
- Nenhum documento chama o log de imutavel, nao repudio ou prova de tempo sem mecanismo e dominio de confianca correspondentes.
- Nenhum segredo de teste aparece em log, artifact, relatorio, backup ou terminal capturado.
- A equipe consegue simular compromise de chave, indisponibilidade do backend e divergencia de cadeia sem perder a evidencia do incidente.
- A auditoria recebe resultados de casos que falharam, nao somente a lista de casos verdes.

## Evidencias de referencia

| ID | Uso | Fonte |
|---|---|---|
| TM-E01 | Consistencia e inclusao em log append-only; limite de split-view | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html) |
| TM-E02 | Canonicalizacao JSON de bytes assinaveis | [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) |
| TM-E03 | Ciclo de vida e protecao de chaves | [NIST SP 800-57](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf) |
| TM-E04 | Protocolo de carimbo de tempo | [RFC 3161](https://datatracker.ietf.org/doc/rfc3161/) |
| TM-E05 | Controles de agentes, prompts e ferramentas | [OWASP LLMSVS](https://owasp.org/www-project-llm-verification-standard/LLMSVS-v2.0-en.html) |
