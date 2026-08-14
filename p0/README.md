# P0 Vertical Slice - Isolated Skeleton

## Runtime Requerido

- Node.js >= 24.0.0

## Comandos

```bash
cd p0

# Executar suíte de testes (roda o catálogo WP-09B via CLI e depois os testes)
npm test

# Executar somente o catálogo WP-09B (cada caso executável via runner CLI)
npm run test:catalog

# Validação e checagem de tipos
npx tsc --noEmit

# Gerar validadores de contrato (Ajv 2020)
npm run generate-validators

# Checar drift de schemas
npm run check-drift
```

## Características

- `npm test` primeiro executa o catálogo semântico/transacional WP-09B inteiro — `node test/semantic/run-catalog.ts` dispara `node test/semantic/run-semantic-case.ts <case_id>` para cada um dos casos executáveis (processo separado por caso) e falha com exit != 0 se algum divergir
- Utiliza `ajv` (8.20.0, draft 2020-12) para validação estática/compilada de contratos v1
- Não importa nada da árvore `packages/` (código legado em quarentena)
- TypeScript executado com type stripping nativo do Node.js 24
- Typecheck verificado via `npx tsc --noEmit`
- Imports relativos usam extensão `.ts` conforme ADR-001

## Estrutura

```
p0/
├── contracts/
│   └── v1/
├── scripts/
│   └── generate-contract-validators.mjs
├── src/
│   ├── index.ts
│   ├── adapters/
│   ├── application/
│   ├── contracts/
│   ├── domain/
│   └── testing/
├── test/
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Configuração TypeScript

A configuração TypeScript segue ADR-001:
- `noEmit: true` - não gera JavaScript
- `target: esnext` - sintaxe moderna
- `module: nodenext` - módulos Node.js
- `rewriteRelativeImportExtensions: true` - reescreve extensões
- `erasableSyntaxOnly: true` - apenas sintaxe apagável
- `verbatimModuleSyntax: true` - sintaxe estrita de módulos
- `strict: true` - modo estrito
