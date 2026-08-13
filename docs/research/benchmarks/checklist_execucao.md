# Checklist de Execução do Benchmark Interno

## Preparação

### 1. Configuração do Ambiente
- [ ] Instalar ferramenta de benchmark (OpenCode, Freebuff, Cursor, Windsurf)
- [ ] Configurar API key do modelo (se necessário)
- [ ] Preparar workspace isolado (clonar repositório ou usar fixture sintética)
- [ ] Verificar dependências (Node.js, Python, etc.)
- [ ] Definir orçamento máximo (ex: $10)
- [ ] Definir timeout por tarefa (ex: 30 min)

### 2. Preparação dos Arquivos
- [ ] Gerar templates de JSON para todas as tarefas
  ```bash
  node generate_template.mjs all opencode gpt-4o
  ```
- [ ] Criar diretório para resultados (se não existir)
- [ ] Verificar schema de resultados (`schema_resultados.md`)

## Execução das Tarefas

### T01 - Compreensão (Read-only)
**Tempo estimado:** 5-10 min  
**Objetivo:** Compreender código existente sem modificar

- [ ] Abrir ferramenta de benchmark
- [ ] Carregar workspace
- [ ] Carregar template JSON: `results_T01_opencode_<timestamp>.json`
- [ ] Preencher `startedAt` com timestamp atual
- [ ] Executar tarefa T01 (ver descrição em `T01_opencode.md`)
- [ ] Preencher `finishedAt` com timestamp atual
- [ ] Registrar métricas:
  - [ ] `humanInterventions`: número de intervenções manuais
  - [ ] `toolCalls`: número de chamadas de ferramenta
  - [ ] `retries`: número de retries
  - [ ] `inputTokens`: tokens de entrada
  - [ ] `outputTokens`: tokens de saída
  - [ ] `cost.amount`: custo em USD
- [ ] Preencher `status`: success | partial | failed | rolled_back
- [ ] Preencher `testsBefore`: passed/failed antes da execução
- [ ] Preencher `testsAfter`: passed/failed após execução
- [ ] Preencher `acceptanceTests`: passed/failed
- [ ] Preencher `lintErrors`: número de erros de lint
- [ ] Preencher `securityFindings`: critical/high/medium/low
- [ ] Preencher `filesChanged`: lista de arquivos modificados
- [ ] Preencher `outOfScopeChanges`: alterações fora do escopo
- [ ] Preencher `rollbackPerformed`: true/false
- [ ] Preencher `reviewScore`: 0-100
- [ ] Preencher `notes`: observações
- [ ] Salvar arquivo JSON

### T02 - Bugfix
**Tempo estimado:** 10-15 min  
**Objetivo:** Corrigir bug específico

- [ ] Repetir processo de T01 para T02
- [ ] Verificar `T02_opencode.md` para descrição da tarefa
- [ ] Focar em correção de bug sem introduzir regressões

### T03 - Feature Backend
**Tempo estimado:** 15-20 min  
**Objetivo:** Implementar feature backend

- [ ] Repetir processo para T03
- [ ] Verificar `T03_opencode.md` para descrição
- [ ] Implementar feature com testes

### T04 - Feature Frontend
**Tempo estimado:** 15-20 min  
**Objetivo:** Implementar feature frontend

- [ ] Repetir processo para T04
- [ ] Verificar `T04_opencode.md` para descrição
- [ ] Implementar feature com validação visual

### T05 - Refatoração
**Tempo estimado:** 20-30 min  
**Objetivo:** Refatorar código mantendo funcionalidade

- [ ] Repetir processo para T05
- [ ] Verificar `T05_opencode.md` para descrição
- [ ] Garantir que testes continuam passando

### T06 - Testes
**Tempo estimado:** 10-15 min  
**Objetivo:** Adicionar testes para código existente

- [ ] Repetir processo para T06
- [ ] Verificar `T06_opencode.md` para descrição
- [ ] Focar em cobertura de testes

### T07 - Dependência
**Tempo estimado:** 15-20 min  
**Objetivo:** Adicionar nova dependência

- [ ] Repetir processo para T07
- [ ] Verificar `T07_opencode.md` para descrição
- [ ] Verificar segurança da dependência

### T08 - Documentação
**Tempo estimado:** 5-10 min  
**Objetivo:** Adicionar documentação

- [ ] Repetir processo para T08
- [ ] Verificar `T08_opencode.md` para descrição
- [ ] Documentar código e APIs

### T09 - Segurança
**Tempo estimado:** 10-15 min  
**Objetivo:** Corrigir vulnerabilidade de segurança

- [ ] Repetir processo para T09
- [ ] Verificar `T09_opencode.md` para descrição
- [ ] Focar em correção sem introduzir regressões

### T10 - Monorepo
**Tempo estimado:** 20-30 min  
**Objetivo:** Trabalhar em monorepo com múltiplos pacotes

- [ ] Repetir processo para T10
- [ ] Verificar `T10_opencode.md` para descrição
- [ ] Garantir consistência entre pacotes

## Validação

### 1. Validação Individual
- [ ] Executar validador para cada resultado:
  ```bash
  node validate_benchmark.mjs results_T01_opencode_<timestamp>.json
  ```
- [ ] Corrigir erros de validação se houver

### 2. Validação Consolidada
- [ ] Executar validador para todos os resultados:
  ```bash
  node validate_benchmark.mjs results_*.json
  ```
- [ ] Verificar consistência de métricas

### 3. Geração de Relatório
- [ ] Executar script de consolidação:
  ```bash
  node consolidate_results.mjs results_*.json
  ```
- [ ] Revisar relatório gerado
- [ ] Documentar findings

## Pós-execução

### 1. Limpeza
- [ ] Remover workspaces temporários
- [ ] Limpar caches se necessário
- [ ] Arquivar resultados

### 2. Análise
- [ ] Calcular métricas derivadas:
  - [ ] Taxa de sucesso por tipo
  - [ ] Custo por tarefa aceita
  - [ ] Tempo mediano e p95
  - [ ] Média de retries
  - [ ] Taxa de rollback
  - [ ] Taxa de intervenção humana
- [ ] Comparar com benchmarks anteriores (se houver)
- [ ] Identificar áreas de melhoria

### 3. Documentação
- [ ] Atualizar documentação com resultados
- [ ] Adicionar notas sobre comportamento da ferramenta
- [ ] Documentar limitações encontradas
- [ ] Sugerir melhorias

## Dicas

### Durante a Execução
- **Use um timer:** Defina um timer para cada tarefa para não exceder o tempo estimado
- **Monitore custo:** Verifique o custo acumulado regularmente
- **Salve frequentemente:** Salve o JSON após cada métrica preenchida
- **Tire screenshots:** Tire screenshots do resultado para referência

### Para Preencher Métricas
- **Tokens:** Verifique na interface da ferramenta ou use estimativa (1 token ≈ 4 caracteres)
- **Custo:** Use calculadora de preços do provider (OpenAI, Anthropic, etc.)
- **Tempo:** Use timestamps precisos (ISO 8601)
- **Intervenções:** Conte cada vez que você teve que corrigir manualmente

### Para Validação
- **Schema:** Verifique se todos os campos obrigatórios estão preenchidos
- **Tipos:** Verifique se os tipos estão corretos (números, strings, arrays)
- **Valores:** Verifique se os valores são razoáveis (não negativos, etc.)

## Troubleshooting

### Problema: Ferramenta não responde
- **Solução:** Reinicie a ferramenta e tente novamente
- **Solução:** Verifique conexão de internet
- **Solução:** Verifique se API key está configurada corretamente

### Problema: Custo muito alto
- **Solução:** Pare a execução imediatamente
- **Solução:** Use modelo mais barato para tarefas restantes
- **Solução:** Reduza escopo do benchmark

### Problema: Validação falha
- **Solução:** Verifique schema em `schema_resultados.md`
- **Solução:** Verifique se todos os campos estão preenchidos
- **Solução:** Execute validador individual para identificar erro específico

### Problema: Tarefa não completa
- **Solução:** Marque como `partial` ou `failed`
- **Solução:** Documente motivo em `notes`
- **Solução:** Tente novamente com timeout maior
