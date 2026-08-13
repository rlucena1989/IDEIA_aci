# Execução Freebuff — T03

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T03-freebuff`

## Prompt
```text
Benchmark T03. Trabalhe SOMENTE no workspace atual.

Implemente a feature de paginação em src/products.mjs.

Requisitos:
- manter a função listProducts(products, page, pageSize);
- retornar items, page, pageSize e total;
- suportar page e pageSize válidos;
- rejeitar page menor que 1;
- rejeitar pageSize menor que 1;
- não alterar package.json;
- não alterar arquivos de teste;
- não instalar dependências;
- executar npm test e npm run test:acceptance;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute;
- informe arquivos alterados, testes e resultado final.
```

## Critério de aceite
- `npm test`: 3/3 passando.
- `npm run test:acceptance`: 2/2 passando.
- Somente `src/products.mjs` alterado no código.
