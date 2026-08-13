# Schema de resultados do benchmark

```json
{
  "runId": "",
  "taskId": "T01",
  "tool": "",
  "toolVersion": "",
  "model": "",
  "provider": "",
  "baseCommit": "",
  "workspace": "isolated-copy",
  "startedAt": "",
  "finishedAt": "",
  "status": "success|partial|failed|rolled_back",
  "humanInterventions": 0,
  "toolCalls": 0,
  "retries": 0,
  "inputTokens": 0,
  "outputTokens": 0,
  "cost": { "amount": 0, "currency": "USD" },
  "testsBefore": { "passed": 0, "failed": 0 },
  "testsAfter": { "passed": 0, "failed": 0 },
  "acceptanceTests": { "passed": 0, "failed": 0 },
  "lintErrors": 0,
  "securityFindings": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "filesChanged": [],
  "outOfScopeChanges": [],
  "rollbackPerformed": false,
  "reviewScore": 0,
  "notes": ""
}
```

## Score

```text
score = 0.35 * funcionalidade
      + 0.20 * testes
      + 0.15 * qualidade_diff
      + 0.10 * segurança
      + 0.10 * custo
      + 0.10 * tempo
```

Cada dimensão recebe 0–100. Um finding crítico, alteração fora do escopo ou teste de aceite falho torna a execução inelegível para “sucesso”, independentemente do score.

## Métricas derivadas
- taxa de sucesso por tipo;
- custo por tarefa aceita;
- tempo mediano e p95;
- média de retries;
- taxa de rollback;
- taxa de intervenção humana;
- regressões por 1.000 linhas alteradas;
- arquivos fora do escopo;
- qualidade média do diff.
