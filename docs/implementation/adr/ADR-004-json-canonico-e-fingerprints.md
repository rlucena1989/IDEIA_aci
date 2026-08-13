# ADR-004 — JSON canônico, digests e fingerprints

- Status: aceita para contratos P0
- Data: 2026-08-13
- Fecha: OD-DP-06 para o perfil P0 v1
- Desbloqueia após vetores: WP-04 e contratos dependentes de fingerprint
- Relaciona: RF-003, RF-005, RF-018, RF-019; RNF-011, RNF-012, RNF-020

## Decisão

O perfil de canonicalização chama-se jcs-sha256-v1:

1. validar a instância no schema versionado;
2. redigir campos persistíveis antes do hash;
3. rejeitar entrada que não seja I-JSON;
4. serializar exatamente pelo RFC 8785 JCS;
5. codificar o JSON canônico em UTF-8;
6. antepor o cabeçalho ASCII de separação de domínio;
7. calcular SHA-256;
8. representar o resultado como sha256 seguido de dois-pontos e 64 dígitos hexadecimais minúsculos.

O cabeçalho é:

~~~text
IDEIA-P0|jcs-sha256-v1|<purpose>\n
~~~

purpose usa somente a-z, 0-9 e hífen. Os purposes iniciais são manifest, config, provider-capabilities, governance-candidate, governance-bundle, evaluation-report, plan, policy, payload, event, context-query, context-item, context-package, sandbox-profile, capability-grant, tool-request, tool-result, provider-request, provider-result, approval-request, verification, artifact-metadata, recovery-report, price-book, budget-set, budget-reservation, budget-ledger e schema. Acrescentar purpose exige ADR ou adendo normativo e vetor; não é permitido reutilizar purpose apenas porque a estrutura JSON coincide.

Formalmente:

~~~text
digest = "sha256:" + lowerhex(
  SHA-256(
    UTF8("IDEIA-P0|jcs-sha256-v1|" + purpose + "\n") ||
    UTF8(JCS(value))
  )
)
~~~

## Regras de entrada

- nomes de propriedade duplicados são rejeitados antes que um parser os descarte;
- NaN, Infinity, BigInt, undefined, Symbol, Function, ciclos, arrays esparsos, propriedades extras em arrays, accessors/getters, chaves Symbol, propriedades próprias não enumeráveis, toJSON e protótipos customizados são rejeitados;
- lone surrogate é rejeitado;
- strings Unicode são preservadas como recebidas; não há NFC/NFD;
- propriedades são ordenadas recursivamente por unidades UTF-16, sem locale;
- ordem de arrays é preservada;
- whitespace não é emitido;
- números seguem serialização ECMAScript exigida pelo JCS;
- campos de segurança usam inteiros seguros ou representação textual definida, nunca precisão implícita de float.

Entradas externas em bytes precisam de detector de chaves duplicadas antes de JSON.parse. Objetos construídos internamente precisam ser plain objects e arrays densos. Implementação que apenas ordena Object.keys e chama JSON.stringify sem os guards acima não é conforme.

O parser recebe limites obrigatórios de bytes, profundidade, membros e tamanho de string. Os valores são configuração do perfil e permanecem abertos em OD-DP-08; ausência ou violação de limite falha antes do hash.

## Eventos

O payload_digest usa purpose payload sobre o payload já redigido.

O event_digest usa purpose event sobre o envelope completo, com event_digest omitido. O envelope inclui payload_digest, previous_event_digest e fingerprint_profile. Para o primeiro evento, previous_event_digest é null. Eventos seguintes usam o event_digest anterior da mesma tarefa.

Correção cria evento novo. Ela não recalcula nem substitui o evento anterior.

## Requests e aprovações

request_fingerprint usa purpose tool-request sobre ToolRequest validado e normalizado. ToolRequest não contém seu próprio fingerprint.

ApprovalGrant, PolicyDecision e EffectIntent referenciam exatamente esse request_fingerprint. Alterar tool, versão, argumento, alvo, precondição, tarefa, passo ou idempotency key muda o fingerprint e invalida a aprovação anterior.

## Artefatos

Artefato usa perfil separado raw-sha256-v1: SHA-256 dos bytes exatos, sem cabeçalho e sem JCS. O formato textual do digest continua sha256:<lowerhex>. O perfil deve acompanhar a metadata para não confundir conteúdo bruto com fingerprint de contrato.

## Limites da garantia

SHA-256 e a cadeia detectam divergência dos bytes dentro do trust model declarado. Um operador que controla aplicação e storage pode reescrever toda a cadeia. Este mecanismo não é assinatura, âncora externa ou não repúdio.

## Vetores e aceite

A implementação só é promovida se:

- passar todos os vetores em contracts/canonicalization/vectors.json;
- rejeitar todos os casos em contracts/canonicalization/rejections.json;
- produzir os mesmos bytes em duas implementações independentes ou contra implementação listada no RFC;
- demonstrar que trocar um campo material muda o digest;
- demonstrar que reordenar propriedades não muda o digest;
- demonstrar que reordenar array muda o digest.

## Evidência externa

- [RFC 8785 — JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785).
- [JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core).
- [Node.js 24.16 — crypto](https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html).

## Condições de reabertura

- interoperabilidade exigir outro perfil;
- vetores oficiais divergirem de duas implementações escolhidas;
- SHA-256 deixar de atender ao threat model;
- schema aceitar valor que não tenha representação JCS válida.
