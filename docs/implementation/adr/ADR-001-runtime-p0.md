# ADR-001 — runtime do vertical slice P0

**Data:** 13 de agosto de 2026  
**Estado:** aceito provisoriamente para protótipo; release depende dos testes P0  
**Fecha parcialmente:** OD-AR-01, OD-DP-01 e OD-TL-01

## Contexto

O workspace contém 20 manifests de packages TypeScript herdados, mas não possui package raiz, lockfile, node_modules, compilador TypeScript ou tsconfig.base.json. Nove dependências internas declaradas estão ausentes. Reconstituir esse monorepo perpetuaria a arquitetura anterior — multiagentes, memória global, plugins, MCP, Redis/PostgreSQL e serviços — em vez de testar o P0 mínimo.

O host possui Node.js 24.16.0. Foram executados com sucesso um banco SQLite em memória por node:sqlite e a descoberta do runner node:test.

## Decisão

O primeiro vertical slice usará:

- Node.js 24.16.x, ESM e APIs nativas;
- TypeScript restrito a sintaxe apagável, executável pelo type stripping nativo;
- node:test e node:assert/strict para testes;
- node:crypto, node:fs, node:path e node:child_process atrás de ports;
- node:sqlite apenas no adapter de catálogo, atrás de CatalogPort;
- nenhuma dependência de runtime na primeira onda;
- TypeScript 5.8+ como dependência de desenvolvimento quando o typecheck for habilitado, com versão exata no lockfile;
- código novo em p0/, sem importar packages/.

O uso de node:sqlite é adequado ao protótipo local porque funciona no host e reduz instalação nativa, mas o módulo ainda é classificado como release candidate na documentação Node 24. Ele não se torna requisito irremovível do domínio.

A regra de zero runtime dependencies vale para a primeira onda pura. A ADR-005 autoriza Ajv 8.20.0 como dependência única e exata a partir de WP-05, pois o código standalone ainda usa helpers de runtime; isso não retroage para WP-01–WP-04.

## Configuração pretendida

~~~json
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "strict": true
  }
}
~~~

Não usar enum, parameter properties, path aliases ou outra sintaxe que exija transformação de JavaScript. Imports relativos incluem extensão .ts. O type stripping executa, mas não faz typecheck; release exige ambos.

## Consequências

### Positivas

- bootstrap pequeno para modelos locais;
- test runner estável sem Jest;
- menos supply chain na superfície inicial;
- SQLite disponível sem addon compilado;
- boundaries explícitos permitem trocar adapter.

### Riscos

- DatabaseSync é síncrono e precisa de benchmark de responsividade;
- node:sqlite ainda não é API estável;
- executar .ts não substitui tsc --noEmit;
- suporte oficial inicial fica restrito ao host Windows testado até matriz posterior.

## Condições de reabertura

- API node:sqlite quebrar o contrato ou falhar em DP-T01–12;
- operação síncrona romper RNF-006.2 sob MP-P0;
- necessidade de SO/runtime incompatível ser validada;
- packages existentes demonstrarem, por contract suite, alternativa menor e mais segura.

## Evidência externa

- Node.js. [SQLite — Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html): módulo classificado como release candidate; DatabaseSync e backup documentados.
- Node.js. [Modules: TypeScript — Node 24](https://nodejs.org/download/release/v24.15.0/docs/api/typescript.html): type stripping estável desde 24.12 e configuração recomendada.
- Node.js. [Test runner — Node 24](https://nodejs.org/download/release/v24.14.0/docs/api/test.html): runner estável desde Node 20.
