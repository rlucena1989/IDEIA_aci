# Execução Freebuff — T10

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T10-freebuff`

## Prompt
```text
Benchmark T10. Trabalhe SOMENTE no workspace atual.

Monorepo com packages/catalog e packages/checkout.

Modifique SOMENTE packages/catalog para que formatProduct(product) aceite currency opcional:
- sem currency: manter USD e saída com $;
- currency "USD": saída com $;
- currency "EUR": saída com €.

Requisitos:
- preservar a saída existente sem currency;
- não alterar nenhum arquivo em packages/checkout;
- não alterar package.json;
- não instalar dependências;
- executar npm test;
- executar npm run test:catalog;
- executar npm run test:checkout;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute;
- informar todos os arquivos alterados e confirmar que checkout permaneceu intacto.
```

## Critério de aceite
- Teste geral: 4/4 passando.
- Catálogo: 3/3 passando.
- Checkout: 1/1 passando.
- Alteração de código somente em `packages/catalog`.
- Nenhum arquivo de `packages/checkout` alterado.
