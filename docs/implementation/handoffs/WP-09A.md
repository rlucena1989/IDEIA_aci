# Handoff WP-09A — fixtures de forma dos contratos

## Registro de entrega (2026-08-14)

Este WP foi **implementado e integrado** em 2026-08-14 seguindo este handoff. O conteúdo abaixo
permanece como registro histórico do contrato de delegação; não reexecute sem necessidade nova.

**Entrega:**

- Corpus (em `p0/test/fixtures/contracts/v1/`): **44 fixtures** `<nome>.valid.json` (uma por
  contrato de instância — as 44 de `contractIds` no map gerado; `_defs` sem instância),
  `index.json` (44 entradas `{ fixture, contract, schema_id, scope: "shape_only" }` — cobertura
  44/44 verificada contra o catálogo, sem extras, sem duplicatas) e `mutations.json` (8 mutações de
  forma CT-X02..X07, X09, X10 no formato declarativo `remove`/`add`/`replace` + `json_pointer` +
  `expected_code`). Valores canônicos: IDs `prefixo_uuid4` (mesmos dos vetores), digests `sha256:`
  placeholder de forma, timestamps `…Z` com milissegundos, enums dos `_defs`, paths sintéticos.
- Teste `p0/test/contracts/fixtures.test.ts` (endurecido em 2026-08-14): **sem fallback permissivo**
  (mapa keyword → `expected_code` explícito que falha alto em código desconhecido), **cobertura do
  catálogo** (exige exatamente 1 fixture por contrato do map gerado e rejeita extra/desconhecida),
  `scope`/`schema_id` conferidos e nome do validator via `contractIdToValidatorName` (fonte única).
- Resultado na entrega: `cd p0 && npm test` → **153/153** (151 base + 2 do teste de fixtures);
  `npx tsc --noEmit` limpo; `cd review && npm run full` → **7/7 PASS**.
- Mutações observadas: CT-X02 `required` (`invalid.required`), CT-X03 `additionalProperties`
  (`invalid.unknown_field`), CT-X04 `const` (`invalid.contract_version`), CT-X05 `type`
  (`invalid.type`), CT-X06 `maximum` (`invalid.range`), CT-X07 `pattern` (`invalid.timestamp`),
  CT-X09 `pattern` (`invalid.id`), CT-X10 `pattern` (`invalid.id_type`).
- Lacunas semânticas (fora do escopo shape): CT-X08 (timestamp com data inexistente — camada
  semantic, exige validação temporal da Onda B/WP-11+), CT-X11 (chave duplicada pré-parse),
  CT-X12 (schema ref ausente), CT-X13/X14 (configuração do validator — cobertos pelo source-scan).
- Observação histórica: o corpus base (fixtures, `index.json`, `mutations.json` e primeira versão do
  teste) foi criado por agente paralelo; a edição desta entrega limitou-se ao endurecimento de
  `fixtures.test.ts`. A regeneração estrita do WP-05-R expôs duas fixtures então inválidas
  (`price-book` com `"currency": "default"` e `tool-definition` com enum) — corrigidas pelo agente
  paralelo; as 44 validam 100% sob strict. Nenhum código de produção, schema ou doc normativo tocado.
  Evolução da contagem: 152 → **153** (WP-09A) → 160 (WP-09B) → 192 (WP-08) → 201 (WP-04). Estado
  atual em `docs/implementation/reviews/2026-08-13-p0-snapshot.md`.

## Pré-condições

WP-05 deve estar integrado e os validators standalone devem passar. Se não estiverem, pare sem editar.

## Objetivo

Criar uma fixture schema-valid para cada contrato de instância e mutações inválidas transversais reproduzíveis.

## Leia antes de editar

- docs/implementation/contracts/README.md
- docs/implementation/contracts/matriz_testes_contrato_v1.md
- todos os schemas em docs/implementation/contracts/v1

## Diretório autorizado

- p0/test/fixtures/contracts/v1/

## Implemente

- um JSON schema-valid por schema de instância; _defs não possui instância;
- index.json listando fixture, contract, schema_id e escopo shape_only;
- mutations.json com CT-X02 a CT-X10 e transformação declarativa;
- valores consistentes de tipo e prefixo;
- timestamps UTC canônicos;
- digests sintaticamente válidos marcados como placeholders de shape.

Formato de mutação:

~~~json
{
  "case_id": "CT-X02-task-manifest-objective",
  "base_fixture": "task-manifest.valid.json",
  "operation": "remove",
  "json_pointer": "/objective",
  "expected_code": "invalid.required"
}
~~~

## Critérios de aceite

- cada fixture válida passa exatamente em seu validator;
- cada mutação falha pelo motivo esperado;
- /2, campo desconhecido, required ausente, tipo incorreto, range, timestamp e ID inválido têm cobertura;
- fixture não é chamada semantic_valid;
- nenhum digest placeholder é tratado como hash verificado;
- nenhum secret, path real, username ou dado pessoal aparece;
- execução duas vezes produz mesmos arquivos.

## Regras

- Não edite código, schemas, package.json, docs ou packages.
- Não acesse rede e não adicione dependência.
- Não invente limite sem fonte.
- Não altere validator para aceitar fixture.
- Não use snapshot opaco como único assert; valide code e instance path.
- Em conflito entre schema e matriz, pare e relate.

## Contexto verificado (2026-08-14)

Pré-condição conferida: WP-05 integrado; `cd p0 && npm test` verde (166 testes) e `npm run check-drift` sem drift. Se divergir, pare e relate.

Catálogo (fonte: `p0/src/contracts/contract-map.generated.json`): 45 schemas em `p0/contracts/v1/`, sendo `_defs.schema.json` apenas definições comuns (sem instância). São **44 contratos de instância** `ideia.<nome>/1` — a lista exata de `contractIds` está no map gerado. Cada contrato tem um validator `validate<CamelCase>` exportado em `p0/src/contracts/validators.generated.js` (ESM standalone, Ajv 8.20.0 draft 2020-12, strict, sem coerção, sem defaults, sem removeAdditional).

Como validar (duas opções):

1. `validateContract(contractId, data)` de `p0/src/contracts/validate.ts` → retorna `data` ou lança `ContractValidationError` (code `contract.validation.failed`) / `UnknownContractError` (code `contract.unknown`). Não expõe keyword nem instance path.
2. `import * as validators from "../../src/contracts/validators.generated.js"` e chamar `validators.validateX(data)` → boolean; se `false`, `validators.validateX.errors` é array Ajv com `{ keyword, instancePath, schemaPath, message, params }`. **Use esta opção nas asserções de mutação** para conferir keyword e instance path (o handoff exige validar code e instance path, não snapshot opaco).

Mapeamento sugerido keyword Ajv → `expected_code` da matriz (`docs/implementation/contracts/matriz_testes_contrato_v1.md`, CT-X01..X14):

- `required` → `invalid.required` (CT-X02);
- `additionalProperties` → `invalid.unknown_field` (CT-X03);
- `const` (contract `/1` → `/2`) → `invalid.contract_version` (CT-X04);
- `type` → `invalid.type` (CT-X05);
- `minimum`/`maximum` (acima de MAX_SAFE_INTEGER) → `invalid.range` (CT-X06);
- `pattern` em timestamp → `invalid.timestamp` (CT-X07);
- `pattern` em ID maiúsculo → `invalid.id` (CT-X09); ID de outro tipo no campo → `invalid.id_type` (CT-X10).

Valores canônicos para as fixtures (defs em `p0/contracts/v1/_defs.schema.json`):

- IDs: `<prefixo>_` + uuid v4 minúsculo. Use `123e4567-e89b-42d3-a456-426614174000` com o prefixo correto do campo (todos os prefixos estão na seção `valid` de `docs/implementation/contracts/vectors/id-vectors.json`; ex.: `tsk_` TaskId, `evt_` EventId, `mft_` ManifestId, `prn_` PrincipalId, `cal_` CallId, `art_` ArtifactId, `crt_` CriterionId, `cor_` CorrelationId);
- digest: `sha256:` + 64 hex minúsculos — **placeholder de forma**; as fixtures são `shape_only` e nenhum digest é tratado como hash verificado;
- timestamp: `2024-01-01T00:00:00.000Z` (obrigatório milissegundos e `Z`);
- stableName: `^[a-z][a-z0-9._-]{0,63}$` (ex.: `default`, `editor`); version: `^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$` (ex.: `1.0.0`); contractName: `^ideia\.[a-z][a-z0-9-]*/1$`;
- inteiros: 0..9007199254740991 (nonNegative) / 1.. (positive);
- enums: `taskState` (12 valores — iguais aos do WP-03), `effectClass`, `riskLevel`, `dataClass` (D0–D5), `policyDecision` (allow/deny/approval_required), `verificationStatus`, `providerFeature`; `artifactRef.profile` const `raw-sha256-v1`; `evidenceRef.kind` enum.

Entregáveis (crie `p0/test/fixtures/contracts/v1/`):

- 44 fixtures `<nome>.valid.json` (uma por contrato de instância);
- `index.json` listando `{ fixture, contract, schema_id, scope: "shape_only" }`;
- `mutations.json` com CT-X02..CT-X10 no formato declarativo do handoff (`base_fixture`, `operation`, `json_pointer`, `expected_code`);
- teste `p0/test/contracts/fixtures.test.ts`: carrega `index.json`, valida cada fixture com `validateContract` (deve passar); aplica cada mutação de `mutations.json` e confere keyword/instance path/`expected_code` com os validators gerados.

Determinismo e higiene: sem data atual, sem aleatório, sem caminhos reais de máquina, sem secrets, usernames ou dados pessoais; executar duas vezes produz os mesmos arquivos.

## Resposta obrigatória

1. inventário de fixtures;
2. arquivos criados;
3. validators executados e resultado;
4. mutações e códigos observados;
5. lacunas semânticas;
6. confirmação de escopo.
