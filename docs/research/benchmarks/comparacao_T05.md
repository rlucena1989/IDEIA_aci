# Comparação T05 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Status funcional | sucesso | sucesso |
| Testes finais | 4/4 | 4/4 |
| Testes de aceite | 2/2 | 2/2 |
| Arquivo de código alterado | 1 | 1 |
| Estratégia | helpers internos | helpers puros internos |
| Alterações fora do código | não observadas | `.freebuff` metadata criada |
| Retries | 0 | 0 |
| Intervenções | 0 | 0 |
| Custo/modelo capturados | não | não |
| Instalações modificadas | não | não |

## Conclusão
Os dois agentes preservaram a API, os resultados, o tratamento de lista vazia e a não mutação. Freebuff produziu uma decomposição mais granular (`isPaid`, `sumTotals`, `countPaid`, `averageOf`); OpenCode usou uma decomposição menor. Ambos satisfizeram os critérios sem evidência de regressão.
