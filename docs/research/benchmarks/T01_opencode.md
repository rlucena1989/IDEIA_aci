# Resultado T01 — OpenCode

## Resultado
**Sucesso read-only com observação operacional.** O agente produziu relatório correto após uma tentativa inicial de acessar `C:\Users\Usuario\Desktop\T01\*`, bloqueada. Na segunda tentativa, restringiu-se ao workspace.

## Conteúdo validado
- Entrada: `placeOrder` em `src/checkout.mjs`.
- Sequência: `createOrder` → `chargePayment` → `saveOrder`.
- Símbolos exportados e formatos de dados identificados.
- Totais `<= 0` geram `Error("amount must be positive")` antes da persistência.
- Limitação: repositório em `Map` somente em memória.

## Integridade
- Nenhum arquivo criado, alterado ou excluído.
- Inventário permaneceu com `package.json`, 4 módulos e 1 teste.

## Observação
O primeiro acesso externo foi rejeitado e não modificou o workspace.
