# Guia Rápido de Execução do Benchmark

## Passo 1: Preparação (5 min)

```bash
# Navegar para o diretório de benchmarks
cd docs/research/benchmarks

# Gerar templates para todas as tarefas
node generate_template.mjs all opencode gpt-4o

# Isso criará 10 arquivos JSON (results_T01_opencode_*.json até results_T10_opencode_*.json)
```

## Passo 2: Executar Tarefas (2-3 horas)

Para cada tarefa (T01-T10):

1. **Abrir template JSON** correspondente
2. **Preencher `startedAt`** com timestamp atual: `new Date().toISOString()`
3. **Executar tarefa** na ferramenta (OpenCode, Freebuff, etc.)
4. **Preencher métricas**:
   - `finishedAt`: timestamp após conclusão
   - `humanInterventions`: número de correções manuais
   - `toolCalls`: número de chamadas de ferramenta
   - `inputTokens`: tokens de entrada (estimativa: 1 token ≈ 4 caracteres)
   - `outputTokens`: tokens de saída
   - `cost.amount`: usar calculadora: `node cost_calculator.mjs <input> <output> gpt-4o`
   - `status`: success | partial | failed | rolled_back
   - `testsBefore`: passed/failed antes
   - `testsAfter`: passed/failed depois
   - `acceptanceTests`: passed/failed
   - `lintErrors`: número de erros
   - `securityFindings`: critical/high/medium/low
   - `filesChanged`: array de arquivos modificados
   - `reviewScore`: 0-100
   - `notes`: observações
5. **Salvar arquivo**

## Passo 3: Validar (5 min)

```bash
# Validar todos os resultados
node validate_benchmark.mjs results_*.json

# Corrigir erros se houver
```

## Passo 4: Consolidar (2 min)

```bash
# Gerar relatório consolidado
node consolidate_results.mjs "results_*.json"

# Isso criará consolidated_report_<timestamp>.json
```

## Dicas Rápidas

### Estimativa de Tokens
- **Rápida:** Conte caracteres e divida por 4
- **Mais precisa:** Use contador de tokens da ferramenta

### Cálculo de Custo
```bash
# Exemplo: 1000 input tokens, 500 output tokens, gpt-4o
node cost_calculator.mjs 1000 500 gpt-4o
# Resultado: $0.0075
```

### Timestamp
```javascript
// No console do navegador ou Node.js
new Date().toISOString()
// Exemplo: "2026-08-12T18:45:30.123Z"
```

### Checklist Detalhado
Para instruções detalhadas, consulte `checklist_execucao.md`

## Tempo Estimado por Tarefa

| Tarefa | Tempo | Dificuldade |
|--------|-------|------------|
| T01 - Compreensão | 5-10 min | Baixa |
| T02 - Bugfix | 10-15 min | Média |
| T03 - Feature Backend | 15-20 min | Média-Alta |
| T04 - Feature Frontend | 15-20 min | Média-Alta |
| T05 - Refatoração | 20-30 min | Alta |
| T06 - Testes | 10-15 min | Média |
| T07 - Dependência | 15-20 min | Média |
| T08 - Documentação | 5-10 min | Baixa |
| T09 - Segurança | 10-15 min | Alta |
| T10 - Monorepo | 20-30 min | Alta |

**Total estimado:** 2-3 horas

## Troubleshooting

### Template não gerou
```bash
# Verificar se Node.js está instalado
node --version

# Verificar se está no diretório correto
cd docs/research/benchmarks
ls
```

### Validação falha
```bash
# Validar arquivo individual para ver erro específico
node validate_benchmark.mjs results_T01_opencode_<timestamp>.json
```

### Custo muito alto
- Pare a execução imediatamente
- Use modelo mais barato (gpt-4o-mini ou claude-3-5-haiku)
- Reduza escopo do benchmark

## Estrutura de Arquivos

```
benchmarks/
├── generate_template.mjs          # Gerador de templates
├── validate_benchmark.mjs         # Validador de resultados
├── consolidate_results.mjs        # Consolidador de resultados
├── cost_calculator.mjs            # Calculadora de custo
├── checklist_execucao.md           # Checklist detalhado
├── quick_start.md                 # Este arquivo
├── schema_resultados.md           # Schema de resultados
├── manifesto_10_tarefas.md         # Descrição das tarefas
├── T01_opencode.md                # Descrição T01
├── T02_opencode.md                # Descrição T02
├── ...                            # ...
├── T10_opencode.md                # Descrição T10
└── results_*.json                 # Resultados (gerados por você)
```

## Próximos Passos

1. Execute os comandos do **Passo 1**
2. Siga o **checklist_execucao.md** para executar as tarefas
3. Valide e consolide os resultados
4. Revise o relatório consolidado
5. Documente findings

## Suporte

Se encontrar problemas:
1. Consulte `checklist_execucao.md` para troubleshooting detalhado
2. Verifique `schema_resultados.md` para formato esperado
3. Revise descrições das tarefas em `T*_opencode.md`
