# Comparação T06 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Status funcional | sucesso | sucesso |
| Testes finais | 15/15 | 27/27 |
| Testes de aceite | 3/3 | 3/3 |
| Arquivo de código alterado | 0 | 0 |
| Arquivo de testes alterado | 1 | 1 |
| Cobertura reportada | 100% linhas/branches/funções | 100% linhas/branches/funções |
| Alterações fora do código | não observadas | `.freebuff` metadata criada |
| Retries | 0 | 0 |
| Intervenções | 0 | 0 |
| Custo/modelo capturados | não | não |

## Conclusão
Ambos cumpriram o contrato: ampliaram testes comportamentais, cobrindo sucesso e erro sem tocar na implementação. Freebuff adicionou uma suíte mais ampla, com 27 testes contra 15 do OpenCode. A contagem maior não prova, isoladamente, melhor qualidade; os casos foram validados contra comportamento observável e todos passaram.
