# Protocolo de telemetria obrigatória para benchmarks

## Objetivo
Tornar comparáveis custo, velocidade, intervenção e eficiência entre agentes em execuções de benchmark. Este protocolo define os campos mínimos obrigatórios para que uma execução seja considerada válida para comparação quantitativa.

## Campos obrigatórios (mínimo para comparabilidade)

| Campo | Tipo | Regra | Exemplo |
|---|---|---|---|
| `runId` | string | UUID v4 único por execução | `"550e8400-e29b-41d4-a716-446655440000"` |
| `taskId` | string | `T01`–`T10` | `"T01"` |
| `tool` | string | Nome exato do agente | `"OpenCode"`, `"Freebuff Desktop"` |
| `toolVersion` | string | Versão observada ou `"not captured"` | `"v0.0.142"`, `"not captured"` |
| `model` | string | Modelo efetivo usado na execução ou `"not reported"` | `"deepseek-v4-flash-free"`, `"gpt-5.6-luna"` |
| `provider` | string | Provider efetivo ou `"not reported"` | `"omniroute"`, `"openai"`, `"not reported"` |
| `workspace` | string | Tipo de workspace usado | `"isolated-copy"` |
| `startedAt` | string | ISO 8601 UTC | `"2026-08-11T12:00:00Z"` |
| `finishedAt` | string | ISO 8601 UTC | `"2026-08-11T12:01:30Z"` |
| `durationMs` | integer | Diferença finishedAt - startedAt em ms | `90000` |
| `humanInterventions` | integer | Contagem de intervenções manuais | `0`, `1`, `2` |
| `toolCalls` | integer | Contagem total de chamadas de ferramenta | `15` |
| `inputTokens` | integer | Tokens de entrada ou `null` se indisponível | `15000`, `null` |
| `outputTokens` | integer | Tokens de saída ou `null` se indisponível | `5000`, `null` |
| `cost` | object | `{amount: number, currency: string}` ou `null` | `{"amount": 0.015, "currency": "USD"}` |
| `status` | string | Enum controlado | `"success"`, `"failed"`, `"partial"` |

## Campos opcionais (recomendados para análise detalhada)

| Campo | Tipo | Regra |
|---|---|---|
| `retries` | integer | Tentativas adicionais automáticas |
| `reasoningTokens` | integer | Tokens de reasoning (se aplicável) |
| `cacheTokens` | integer | Tokens de cache hit |
| `blocks` | integer | Contagem de bloqueios de segurança |
| `networkAccess` | string | `"none"`, `"blocked"` ou `"allowed"` |
| `testsBefore` | object | `{passed: N, failed: M}` |
| `testsAfter` | object | `{passed: N, failed: M}` |
| `acceptanceTests` | object | `{passed: N, failed: M}` |
| `filesChanged` | array | Lista de caminhos relativos alterados |
| `outOfScopeChanges` | array | Lista de caminhos fora do escopo |
| `rollbackPerformed` | boolean | Se rollback foi executado |
| `reviewScore` | integer | Score 0-100 de revisão manual |
| `notes` | string | Observações qualitativas |
| `round` | integer | Número da rodada do benchmark |
| `providerTokens` | object | Tokens por provider (se múltiplos) |
| `providerModels` | array | Lista de modelos usados por provider |

## Regras de coleta

### Não fazer
- **Não estimar** tokens, custo ou tempo — usar valores reais ou `null`
- **Não inventar** valores para campos indisponíveis — usar `null` com motivo documentado
- **Não registrar** prompts privados, secrets ou conteúdo de bancos locais
- **Não misturar** retries automáticos com intervenção humana

### Deve fazer
- **Registrar fonte** de cada métrica: agente, CLI, log ou observação manual
- **Medir tempo** a partir do primeiro prompt até a conclusão verificável
- **Separar** retries automáticos de intervenção humana
- **Capturar hashes** antes/depois para arquivos fora do escopo
- **Documentar motivo** quando usar `null` para campos obrigatórios

### Valores nulos
Usar `null` apenas quando:
- A ferramenta não fornecer o dado nativamente
- O dado for indisponível por limitação técnica conhecida
- O dado não for aplicável ao contexto

Sempre documentar o motivo no campo `notes`.

## Status permitidos

| Status | Significado | Critérios |
|---|---|---|
| `success` | Tarefa completada com sucesso | Todos testes passam, sem alterações fora do escopo |
| `partial` | Tarefa parcialmente completada | Alguns testes falham, mas funcionalidade core funciona |
| `failed` | Tarefa falhou | Testes críticos falham ou funcionalidade não implementada |
| `rolled_back` | Execução revertida | Alterações foram desfeitas por segurança |
| `blocked` | Execução bloqueada | Agente recusou executar por segurança/escopo |

## Critério de comparabilidade

Uma execução é **comparável quantitativamente** apenas se tiver todos os campos obrigatórios preenchidos com valores reais ou `null` com motivo documentado.

**Mínimo obrigatório:**
- `runId`, `taskId`, `tool`, `toolVersion`
- `model`, `provider` (ou `null` documentado)
- `startedAt`, `finishedAt`, `durationMs`
- `humanInterventions`, `toolCalls`
- `inputTokens`, `outputTokens` (ou `null` documentado)
- `cost` (ou `null` documentado)
- `status`

**Execuções sem esses campos não podem ser usadas em comparações de custo, velocidade ou eficiência.**

## Fontes de telemetria por ferramenta

### OpenCode
- **Database:** `~/.local/share/opencode/opencode.db`
- **Tabela:** `session`
- **Campos:** `model`, `tokens_input`, `tokens_output`, `tokens_reasoning`, `cost`, `time_created`, `time_updated`
- **Custo:** Painel Zen → "Uso recente da API e custos" (por sessão)
- **Provider:** OmniRoute (se configurado) ou direto

### Freebuff
- **Limitação:** CLI npm v0.0.142 sem telemetria programática
- **Fonte:** Captura manual na GUI (tempo, modelo, quota)
- **Custo:** Não aplicável (100% free, 6h/dia)
- **Modelo:** DeepSeek V4 Flash (fixo)

### OmniRoute
- **Database:** `~/.omniroute/storage.sqlite`
- **Tabelas:** `usage_history`, `call_logs`
- **Campos:** `provider`, `model`, `tokens_input/output/cache_read/reasoning`, `endpoint`, `combo_strategy`, `timestamp`
- **Correlação:** Por intervalo temporal (sem `session_id`)

## Validação

Usar o validador formal `validate_benchmark.mjs` para verificar:
- Presença de campos obrigatórios
- Tipos e formatos corretos
- Consistência lógica (ex: finishedAt > startedAt)
- Cobertura T01-T10 por ferramenta

## Exemplo de resultado válido

```json
{
  "runId": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "T01",
  "tool": "OpenCode",
  "toolVersion": "v0.0.142",
  "model": "deepseek-v4-flash-free",
  "provider": "omniroute",
  "baseCommit": "a1b2c3d",
  "workspace": "isolated-copy",
  "startedAt": "2026-08-11T12:00:00Z",
  "finishedAt": "2026-08-11T12:01:30Z",
  "durationMs": 90000,
  "status": "success",
  "humanInterventions": 0,
  "toolCalls": 15,
  "retries": 0,
  "inputTokens": 15000,
  "outputTokens": 5000,
  "cost": {"amount": 0.015, "currency": "USD"},
  "testsBefore": {"passed": 4, "failed": 0},
  "testsAfter": {"passed": 4, "failed": 0},
  "acceptanceTests": {"passed": 2, "failed": 0},
  "lintErrors": 0,
  "securityFindings": {"critical": 0, "high": 0, "medium": 0, "low": 0},
  "filesChanged": ["src/app.js"],
  "outOfScopeChanges": [],
  "rollbackPerformed": false,
  "reviewScore": 95,
  "notes": "Execução sem intervenção, todos testes passaram",
  "round": 2
}
```

## Referências
- Schema completo: `schema_resultados.md`
- Validador: `validate_benchmark.mjs`
- Consolidação anterior: `consolidacao_open_code_vs_freebuff.md`
