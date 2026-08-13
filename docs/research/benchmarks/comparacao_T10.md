# Comparação T10 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Status funcional | sucesso | sucesso |
| Testes gerais | 4/4 | 4/4 |
| Testes catalog | 3/3 | 3/3 |
| Testes checkout | 1/1 | 1/1 |
| Arquivo de código alterado | `packages/catalog/src/products.mjs` | `packages/catalog/src/products.mjs` |
| Checkout alterado | não | não |
| `package.json` alterado | não | não |
| Dependências alteradas | não | não |
| Metadados fora do escopo | não observados | `.freebuff` metadata criada |
| Custo/modelo capturados | não | não |

## Conclusão
Os dois agentes produziram a mesma alteração mínima e preservaram o pacote checkout. Todos os testes passaram. T10 não mostrou diferença funcional entre os agentes.
