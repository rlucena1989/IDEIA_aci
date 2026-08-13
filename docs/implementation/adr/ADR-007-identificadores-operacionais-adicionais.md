# ADR-007 — Identificadores operacionais adicionais do P0

- Status: aceita para contratos P0 v1 ainda em release candidate
- Data: 2026-08-13
- Complementa: ADR-003
- Relaciona: contexto, provider, artifacts, orçamento, sandbox e recovery

## Contexto

A primeira lista de IDs cobria o núcleo de task, evento, aprovação, efeito e verificação. Os estudos v2 posteriores demonstraram entidades com lifecycle, escopo ou concorrência próprios. Representá-las apenas por posição, timestamp ou digest confundiria identidade de registro com identidade de conteúdo.

## Decisão

Aplicam-se exatamente as regras de UUID v4 minúsculo da ADR-003:

| Tipo | Prefixo | Razão de identidade própria |
|---|---|---|
| AttemptId | atm | tentativa imutável, inclusive falha antes do I/O |
| ProviderRequestId | pvr | requisição normalizada; `CallId` continua correlacionando a chamada |
| ContextQueryId | cxq | consulta reproduzível e seus candidatos/rejeições |
| ContextItemId | cxi | observação de uma fonte em uma versão/faixa |
| ContextPackageId | cxp | pacote ordenado e validado entregue a uma request |
| ArtifactId | art | lifecycle/metadata; digest continua identidade dos bytes |
| BudgetSetId | bgt | conjunto de limites multiunidade congelado |
| BudgetReservationId | brs | reserva com lifecycle e reconciliação próprios |
| PriceBookId | pbk | snapshot versionado de preço, nunca preço corrente implícito |
| CapabilityGrantId | cpg | concessão de capability com escopo e validade |
| RecoveryRunId | rcv | execução de recovery/reconciliação auditável |

Não são criados IDs separados para ToolRequest, ProviderOutcome, ContextPackageFingerprint ou ArtifactDigest:

- ToolRequest é identificada operacionalmente por `CallId` e materialmente por `request_fingerprint`;
- ProviderOutcome pertence a um `ProviderRequestId`/`CallId` e não possui lifecycle independente;
- fingerprints e digests identificam bytes/representações, não registros mutáveis de lifecycle.

## Compatibilidade

Os novos prefixos são aditivos enquanto o registry permanece release candidate. Um parser baseado em allowlist precisa atualizar mapa e vetores antes de aceitar esses tipos. Leitor que não conhece o tipo falha fechado; não remove o prefixo para tratar tudo como UUID genérico.

## Condições de reabertura

- duas entidades listadas provarem lifecycle inseparável;
- import/export exigir namespace externo;
- schema tornar um dos IDs redundante sem perder auditoria ou concorrência.
