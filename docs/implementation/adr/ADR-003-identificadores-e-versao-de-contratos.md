# ADR-003 — Identificadores e versão dos contratos P0

- Status: aceita para contratos P0
- Data: 2026-08-13
- Fecha: bloqueio de formato de WP-02B
- Relaciona: RF-001, RF-002, RF-004, RF-019; RNF-012, RNF-013

## Contexto

O domínio precisa impedir confusão entre IDs, manter representação textual única e rejeitar contratos desconhecidos. Ordenação de eventos já possui sequence e timestamps explícitos; portanto, o identificador não deve se tornar uma segunda fonte implícita de ordem.

## Decisão sobre IDs

Entidades internas usam o formato:

~~~text
<prefixo>_<uuid-v4-em-minúsculas>
~~~

O UUID segue RFC 9562, versão 4 e variante 10. A aplicação gera UUIDs na borda por gerador injetável; o adapter Node pode usar crypto.randomUUID. O domínio recebe o valor gerado e não consulta aleatoriedade global.

| Tipo | Prefixo |
|---|---|
| ProjectId | prj |
| WorkspaceId | wsp |
| PrincipalId | prn |
| TaskId | tsk |
| ManifestId | mft |
| PlanId | pln |
| StepId | stp |
| EventId | evt |
| CorrelationId | cor |
| causation_event_id | referencia EventId, prefixo evt |
| CallId | cal |
| PolicyDecisionId | pdc |
| ApprovalId | apr |
| ApprovalUseId | apu |
| EffectIntentId | efi |
| VerificationId | vrf |
| UsageId | use |
| CriterionId | crt |
| AttemptId | atm |
| ProviderRequestId | pvr |
| ContextQueryId | cxq |
| ContextItemId | cxi |
| ContextPackageId | cxp |
| ArtifactId | art |
| BudgetSetId | bgt |
| BudgetReservationId | brs |
| PriceBookId | pbk |
| CapabilityGrantId | cpg |
| RecoveryRunId | rcv |

Os identificadores acrescentados depois do primeiro freeze são justificados pela ADR-007 e obedecem ao mesmo perfil.

Regras:

- texto canônico é minúsculo;
- prefixo incorreto, UUID nil, versão diferente de 4, variante diferente ou grafia não canônica são rejeitados;
- o parser não converte maiúsculas nem remove whitespace;
- tipos de ID são opacos e não intercambiáveis;
- IDs não carregam autoridade, tempo, ordem, tenant ou classificação;
- ID não é secret;
- colisão de chave é falha explícita, nunca upsert silencioso.

ToolId, provider_id, model_id, verifier_id e policy_id são nomes estáveis versionados, não IDs de entidade. Usam o alfabeto minúsculo a-z, 0-9, ponto, hífen e sublinhado, começam por letra e têm entre 1 e 64 caracteres. A versão fica em campo separado.

PrincipalId é um ID interno. O adapter de host mantém o vínculo com a identidade autenticada do sistema operacional; nomes de usuário, SID ou UID não são incorporados ao ID nem expostos automaticamente em eventos.

## Decisão sobre contratos

- Dialeto: JSON Schema 2020-12.
- Cada instância possui contract com valor exato ideia.<nome>/1.
- Cada schema possui URI absoluta em https://schemas.ideia.invalid/p0/v1/.
- O sufixo .invalid é deliberado: resolução ocorre por catálogo local e não autoriza egress.
- Objetos de contrato usam additionalProperties false.
- Campo obrigatório ausente, campo desconhecido, enum desconhecido ou versão desconhecida falha fechado.
- Validação não faz coerção, trimming, defaulting nem normalização Unicode.
- Timestamps canônicos usam UTC, três casas de milissegundo e sufixo Z.
- Contadores e limites são inteiros seguros entre 0 e 9007199254740991.
- Valor decimal exato, monetário ou maior que o inteiro seguro deve usar unidade inteira declarada ou string definida por contrato posterior.

Compatibilidade:

- corrigir descrição sem mudar comportamento não altera versão;
- tornar campo opcional obrigatório, ampliar enum, mudar semântica ou adicionar campo muda a versão do contrato;
- leitor P0 não ignora campo de versão futura;
- migração cria nova instância e preserva evidência da origem; não reinterpreta bytes antigos silenciosamente.

## Alternativas rejeitadas

| Alternativa | Motivo |
|---|---|
| inteiro autoincremental como ID público | confunde identidade com ordem e facilita colisão em export/import |
| UUIDv7 | ordenação já é explícita; timestamp interno seria uma segunda semântica e não é monotônico |
| string livre | permite troca acidental de tipos e representações múltiplas |
| aceitar maiúsculas e normalizar | dois textos poderiam representar a mesma identidade antes da validação |
| schemas extensíveis por padrão | typo ou campo crítico futuro poderia ser ignorado |

## Evidência externa

- [RFC 9562 — UUID](https://www.rfc-editor.org/rfc/rfc9562), seções 4 e 5.4.
- [Node.js 24.16 — crypto.randomUUID](https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html#cryptorandomuuidoptions).
- [JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core).

## Condições de reabertura

- import/export demonstrar necessidade de namespace distribuído diferente;
- contrato externo obrigatório não suportar o formato;
- custo ou índice do UUIDv4 falhar em benchmark do catálogo;
- mudança de versão exigir compatibilidade não atendida pelo fail-closed.
