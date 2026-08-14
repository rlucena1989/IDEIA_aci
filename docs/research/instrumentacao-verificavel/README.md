# Estudos: instrumentacao verificavel para IA

**Data de corte:** 14 de agosto de 2026
**Status:** P0 encerrado para fins de planejamento por diretriz do projeto; Onda A em fechamento para auditoria definitiva. As afirmacoes de evidencia continuam condicionadas aos artefatos e ao escopo auditados.
**Escopo:** logs assinados, armazenamento append-only e instrumentacao para elevar a qualidade operacional do IDEIA_aci.

## Pergunta de decisao

Qual arquitetura de evidencias permite diagnosticar e melhorar o comportamento do agente sem registrar secrets ou texto sensivel em massa, e sem introduzir uma dependencia de blockchain?

## Tese de trabalho

Para o IDEIA_aci, a arquitetura de continuidade apos P0 e em camadas: telemetria OpenTelemetry para diagnostico; registros semanticos normalizados para avaliacao; append-only para retencao; assinatura de lotes e checkpoints para integridade; e exportacao de provas somente quando houver auditoria externa. Blockchain permanece fora do escopo base.

Essa tese nao afirma que a IA ficara melhor apenas por registrar eventos. O ganho esperado vem do ciclo: observar -> classificar falha -> formar conjunto de avaliacao -> alterar uma variavel -> comparar contra baseline -> promover ou reverter.

## Estudos

| Estudo | Decisao que informa | Resultado esperado |
|---|---|---|
| [01_logs_assinados](01_logs_assinados.md) | Como provar autoria e detectar adulteracao | Contrato de evento, identidade, assinatura, rotacao e verificacao |
| [02_armazenamento_append_only](02_armazenamento_append_only.md) | Como reter evidencia e permitir replay seguro | Modelo de armazenamento, checkpoints, provas e retencao |
| [03_instrumentacao_ia](03_instrumentacao_ia.md) | Quais sinais tornam o agente mensuravel e melhoravel | Taxonomia de eventos, dados proibidos, qualidade e alertas |
| [04_plano_experimental](04_plano_experimental.md) | Como validar valor antes de integrar toda a plataforma | Experimentos, gates, metricas, riscos e roadmap por entregas |
| [05_modelo_ameacas_confianca](05_modelo_ameacas_confianca.md) | Contra quem cada garantia protege e onde ela termina | Ameacas, controles, riscos residuais e criterios de auditoria |
| [06_governanca_dados_retencao](06_governanca_dados_retencao.md) | Como evitar que a evidencia se torne uma superficie de vazamento | Classes de dados, ciclo de vida, acesso, retencao e incidentes |
| [07_dossie_auditoria_onda_a](07_dossie_auditoria_onda_a.md) | Como auditar a Onda A e liberar a proxima implementacao | Escopo, evidencias, testes independentes e veredito rastreavel |
| [08_roteiro_auditoria_onda_a](08_roteiro_auditoria_onda_a.md) | Como executar a auditoria em profundidade | Congelamento, hashes, ledger linha a linha, mutacoes e E2E |

## Limites

- Assinatura prova que uma chave autorizada assinou um payload; ela nao prova que o modelo estava correto, que o ator humano era legitimo nem que a maquina nao estava comprometida.
- Append-only impede sobrescrita no caminho normal, mas nao impede um administrador de apagar ou reescrever dados sem uma ancora e controles fora do mesmo dominio de administracao.
- Trace nao e registro de auditoria. Um trace pode ser amostrado, agregado ou descartado; um registro de evidencia precisa ter contrato de retencao e verificacao proprio.
- Capturar prompt e output completos por padrao aumenta muito o risco de vazamento. Os estudos adotam metadados, hashes e referencias a cofre criptografado como padrao.

## Registro de fontes

| ID | Fonte | Uso | Consulta |
|---|---|---|---|
| IV-E01 | [RFC 9162 - Certificate Transparency](https://www.rfc-editor.org/rfc/rfc9162.html) | Log append-only, Merkle tree, provas de inclusao e consistencia | 2026-08-14 |
| IV-E02 | [SLSA v1.2](https://slsa.dev/spec/v1.2/) | Proveniencia e attestations vinculadas a artefatos | 2026-08-14 |
| IV-E03 | [Sigstore Cosign - verification](https://docs.sigstore.dev/cosign/verifying/verify/) | Assinaturas, identidade e bundles verificaveis offline | 2026-08-14 |
| IV-E04 | [NIST AI RMF 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) | Medicao, documentacao e monitoramento de risco de IA | 2026-08-14 |
| IV-E05 | [NIST GenAI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | Acoes de medicao e monitoramento especificas para IA generativa | 2026-08-14 |
| IV-E06 | [OWASP Logging Vocabulary](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html) | Reducao de dados sensiveis em logs e eventos para MCP | 2026-08-14 |
| IV-E07 | [OWASP LLMSVS 2.0](https://owasp.org/www-project-llm-verification-standard/LLMSVS-v2.0-en.html) | Controles de monitoramento, limites e ferramentas de agentes | 2026-08-14 |
| IV-E08 | [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | Convencoes interoperaveis para traces e atributos; verificar versao antes de implementar | 2026-08-14 |

## Linha de base P0

O P0 ja define `EventEnvelope v1`, cadeia por tarefa, `jcs-sha256-v1` baseado em RFC 8785, redacao antes de hash, contratos JSON Schema, classificacao D0-D5, DDL SQLite e fault profile. O snapshot de 2026-08-14 registra gates internos aprovados para a Onda A; a auditoria definitiva precisa confirmar o escopo, a reprodutibilidade e os limites das alegacoes.

Os packages legados em `packages/` continuam sendo candidatos separados. Nenhum deles substitui os contratos e a implementacao P0 sem auditoria de origem, build, testes e aderencia aos invariantes vigentes.
