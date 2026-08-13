# Comparação T01 — OpenCode vs Freebuff

| Métrica | OpenCode | Freebuff |
|---|---:|---:|
| Relatório correto | sim | sim |
| Arquivos de código alterados | 0 | 0 |
| Arquivos de teste alterados | 0 | 0 |
| Fluxo identificado | correto | correto |
| Erro para total não positivo | correto | correto |
| Limitações identificadas | Map em memória | Map, atomicidade, colisões e status |
| Acesso externo bloqueado | 1 tentativa | não reportado |
| Metadados fora do escopo | não observados | `.freebuff` metadata criada |

## Conclusão
Ambos cumpriram T01 em modo read-only. Freebuff forneceu uma análise mais ampla de limitações; OpenCode teve uma tentativa inicial de acesso externo, bloqueada sem alteração de arquivos.
