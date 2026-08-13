# Comparação T09 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Status funcional | sucesso | sucesso |
| Testes finais | 7/7 | 7/7 |
| Testes de aceite | 2/2 | 2/2 |
| Caminho com API_KEY | não capturado | validado |
| Caminho sem API_KEY | validado por testes | validado diretamente |
| Arquivos alterados | 4 | 4 |
| Secret hardcoded removido | sim | sim |
| `package.json` alterado | não | não |
| Dependências alteradas | não | não |
| Custo/modelo capturados | não | não |

## Conclusão
Os dois agentes produziram resultado funcionalmente idêntico. Freebuff ainda validou diretamente os caminhos com e sem `API_KEY`. A única diferença operacional foi a reconstrução do prompt pelo Freebuff, pois o arquivo de execução não estava presente no workspace informado.
