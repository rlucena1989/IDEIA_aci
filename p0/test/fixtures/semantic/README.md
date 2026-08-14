# Corpus semântico e transacional (WP-09B)

Catálogo imutável de casos transcrito de `docs/implementation/contracts/matriz_testes_contrato_v1.md`
com requisito (famílias RF/RNF de `docs/implementation/traceability/p0_matrix.md`), camada, precondições,
mutação declarativa, `expected_code` da matriz e oráculo.

## Arquivos

- `cases.json` — catálogo (contrato `ideia.semantic-cases/1`);
- `README.md` — este documento.

O runner e o teste de catálogo vivem em `p0/test/semantic/` (`run-semantic-case.ts` e `case-catalog.test.ts`).

## Estrutura de cada case

```json
{
  "case_id": "CT-X02",
  "layer": "schema",
  "requirement": "RF-019 / EG-0",
  "preconditions": "fixture task-manifest.valid.json",
  "mutation": "remover cada campo required, um por vez (âncora: /objective)",
  "expected_code": "invalid.required",
  "oracle": { "strategy": "schema:validator", "base_fixture": "task-manifest.valid.json", "operation": "remove", "json_pointer": "/objective", "keyword": "required" },
  "blocked_by": null
}
```

- `case_id` segue exatamente a matriz (CT-X, CT-M, CT-P, CT-A, CT-CTX, CT-PR, CT-PL, CT-E, CT-AR,
  CT-RC, CT-U, CT-SB, CT-GV, CT-EV, CT-MP, CT-C, JCS-P0, JCS-R). Nenhum ID é removido ou renomeado;
  o teste de catálogo verifica a contiguidade de cada família.
- `layer`: `schema | semantic | transaction | canonicalization | architecture | pre-parse`.
- `oracle.strategy`: `schema:validator | budget:computeBudget | transition:validateTransition |
  policy:source-scan | projection:reducer | jcs:vector | jcs:reject | jcs:property | blocked`.
  As estratégias `jcs:*` reutilizam `canonicalization/vectors.json` e `canonicalization/rejections.json`
  como oráculo (referência por `vector_id` / `reject_id`; `jcs:property` cobre CT-C01..C06 com
  propriedades fechadas em `JCS_PROPERTIES`).
- `blocked_by`: `null` para casos executáveis hoje; string explícita (pacote/componente da Onda B)
  para casos não executáveis. Nunca se usa "skipped" genérico.

## Executáveis hoje (2026-08-14)

| Caso | Componente | Oráculo |
|---|---|---|
| CT-X01..X07, X09, X10, CT-E09 | validators gerados (WP-05) | `schema:validator` sobre fixtures de `p0/test/fixtures/contracts/v1/` |
| CT-X13, CT-X14 | política de build (WP-05) | `policy:source-scan` sobre `validators.generated.js` e o gerador |
| CT-M10, CT-U06 | gate de limite duro (WP-06) | `budget:computeBudget` |
| CT-RC12 | máquina de estados (WP-03) | `transition:validateTransition` |
| CT-E11..E14, E17, E19..E21 | projeção pura da tarefa (WP-08) | `projection:reducer` sobre eventos declarativos |
| JCS-P0-001..006 | canonicalização/fingerprints (WP-04) | `jcs:vector` sobre `canonicalization/vectors.json` |
| JCS-R01..R21 | parser estrito pré-hash (WP-04) | `jcs:reject` sobre `canonicalization/rejections.json` |
| CT-C01..C06 | propriedades canônicas (WP-04) | `jcs:property` (reordenação, purpose, NFC/NFD, rawDigest) |

Os demais casos ficam com `blocked_by` explícito até o componente correspondente da Onda B
(WP-11/12/14/15/15B/15C/16/17/18/20/21/21B, MP-P0 aprovado e fechamento de SEC-INC-001).

## Uso

```bash
cd p0
node test/semantic/run-semantic-case.ts CT-U06   # executa um case e imprime veredito
npm run test:catalog                              # roda TODOS os casos executáveis via runner CLI
npm test                                          # run-catalog + suíte (case-catalog.test.ts incluso)
```

`npm run test:catalog` (`node test/semantic/run-catalog.ts`) dispara o runner real como processo
separado para cada caso executável e agrega os vereditos; qualquer falha (status != 0, saída sem
veredito `pass`) encerra com exit != 0 — é a etapa local/CI do catálogo completo, embutida no `npm test`.

O runner nunca altera o oráculo: lê `cases.json` como fonte imutável, valida enums e rejeita
`case_id`/estratégia desconhecidos. Higiene: o corpus não contém secret, path de operador ou rede.
