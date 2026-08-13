# Comparação T04 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Status funcional | sucesso | sucesso |
| Testes finais | 4/4 | 4/4 |
| Testes de aceite | 3/3 | 3/3 |
| Arquivo de código alterado | 1 | 1 |
| Query vazia | retorna todos | retorna todos |
| Case-insensitive | sim | sim |
| Trim da query | implícito para vazia | explícito |
| Entrada mutada | não | não |
| Metadados fora do escopo | não observados | `.freebuff` metadata criada |
| Custo/modelo capturados | não | não |

## Conclusão
Ambos passaram os critérios. Freebuff adicionou `trim()` explícito, tornando o comportamento para queries com espaços mais previsível; esse caso não fazia parte do teste de aceite original.
