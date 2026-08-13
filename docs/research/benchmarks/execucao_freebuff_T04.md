# Execução Freebuff — T04

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T04-freebuff`

## Prompt
```text
Benchmark T04. Trabalhe SOMENTE no workspace atual.

Implemente filterProducts(products, query = "") em src/products.mjs.

Requisitos:
- filtrar pelo nome do produto sem diferenciar maiúsculas/minúsculas;
- query vazia retorna todos;
- nenhum match retorna [];
- preservar a ordem original;
- não mutar o array de entrada;
- não alterar package.json ou testes;
- não instalar dependências;
- executar npm test e npm run test:acceptance;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute.
```

## Critério de aceite
- `npm test`: 4/4 passando.
- `npm run test:acceptance`: 3/3 passando.
- Somente `src/products.mjs` alterado.
