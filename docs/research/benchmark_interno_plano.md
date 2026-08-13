# Plano de Execução: Benchmark Interno Representativo

**Data:** 11 de agosto de 2026  
**Status:** Planejado (requer execução manual)  
**Objetivo:** Executar benchmark interno representativo com 10 tarefas sintéticas

## Pré-condições

### Requisitos de ambiente
- [ ] Workspace sintético ou repositório autorizado
- [ ] Commit-base registrado (hash)
- [ ] Ferramenta instalada (OpenCode, Freebuff, Cursor, etc.)
- [ ] Orçamento e timeout definidos
- [ ] Rede bloqueada por padrão
- [ ] Diretório temporário criado fora das instalações

### Fixtures necessárias
- [ ] Repositório sintético com estrutura típica (frontend + backend)
- [ ] Testes baseline configurados
- [ ] Commit-base com estado conhecido

## Tarefas do benchmark

### T01: Compreensão (read-only)
- **Objetivo:** Explicar estrutura e fluxo principal
- **Critério:** Relatório cita arquivos/símbolos corretos; nenhum arquivo alterado
- **Risco:** Baixo
- **Tempo estimado:** 5-10 minutos

### T02: Bugfix
- **Objetivo:** Corrigir bug de validação de email
- **Critério:** Teste de regressão falha antes e passa depois; testes existentes passam
- **Risco:** Médio
- **Tempo estimado:** 10-15 minutos

### T03: Feature backend
- **Objetivo:** Adicionar endpoint de paginação
- **Critério:** Contrato HTTP, validação, paginação e testes passam
- **Risco:** Médio
- **Tempo estimado:** 15-20 minutos

### T04: Feature frontend
- **Objetivo:** Adicionar filtro de lista
- **Critério:** Filtro funciona, estado é previsível e teste relevante passa
- **Risco:** Médio
- **Tempo estimado:** 15-20 minutos

### T05: Refatoração
- **Objetivo:** Separar módulo monolítico
- **Critério:** Comportamento preservado, imports válidos e diff limitado
- **Risco:** Médio
- **Tempo estimado:** 20-30 minutos

### T06: Testes
- **Objetivo:** Aumentar cobertura de serviço
- **Critério:** Testes cobrem sucesso/erro e não são tautológicos
- **Risco:** Baixo
- **Tempo estimado:** 10-15 minutos

### T07: Dependência
- **Objetivo:** Atualizar dependência compatível
- **Critério:** Lockfile consistente, build e testes passam
- **Risco:** Alto
- **Tempo estimado:** 15-20 minutos

### T08: Documentação
- **Objetivo:** Atualizar README/API
- **Critério:** Instruções reproduzíveis, links válidos e exemplos coerentes
- **Risco:** Baixo
- **Tempo estimado:** 5-10 minutos

### T09: Segurança
- **Objetivo:** Corrigir secret hardcoded sintético
- **Critério:** Secret removido, configuração segura e scanner passa
- **Risco:** Alto
- **Tempo estimado:** 10-15 minutos

### T10: Monorepo
- **Objetivo:** Alterar pacote sem quebrar outro
- **Critério:** Pacote alvo passa; testes afetados passam; sem alteração fora do escopo
- **Risco:** Alto
- **Tempo estimado:** 20-30 minutos

## Procedimento de execução

### Setup inicial
1. Clonar/copiar fixture para diretório temporário
2. Registrar hash do commit e árvore inicial
3. Executar testes baseline
4. Iniciar ferramenta apontando somente para a cópia

### Execução por tarefa
Para cada tarefa T01-T10:
1. Registrar prompt inicial
2. Registrar plano gerado pela ferramenta
3. Registrar comandos executados
4. Registrar diff de alterações
5. Executar testes de aceite
6. Fazer revisão do diff
7. Registrar métricas no schema
8. Descartar cópia ou preservar como artefato

### Registro de métricas
Para cada tarefa, registrar:
- `runId`: Identificador único da execução
- `taskId`: T01-T10
- `tool`: Ferramenta usada (OpenCode, Freebuff, etc.)
- `model`: Modelo usado
- `provider`: Provider do modelo
- `startedAt`: Timestamp de início
- `finishedAt`: Timestamp de término
- `durationMs`: Duração em milissegundos
- `status`: success, failure, timeout, error
- `cost`: Custo em USD (se aplicável)
- `tokensInput`: Tokens de input
- `tokensOutput`: Tokens de output
- `interventions`: Número de intervenções humanas
- `score`: Score calculado (0-1)
- `reason`: Motivo de falha (se aplicável)

### Validação
1. Validar arquivo JSON com `validate_benchmark.mjs`
2. Verificar cobertura de todas as tarefas T01-T10
3. Verificar consistência de métricas
4. Gerar relatório de resultados

## Proibições

- Não apontar agente para `C:\Users\Usuario\.omniroute`
- Não modificar configuração de OpenCode, Freebuff, Cursor, Devin ou Antigravity
- Não executar `npm install -g`, atualizações ou resets
- Não fazer push, deploy ou merge
- Não enviar conteúdo privado para providers sem autorização
- Não executar comandos destrutivos no host

## Evidência mínima

Para cada execução:
- Manifesto de tarefas
- Versão da ferramenta
- Commit hash
- Logs sanitizados
- Diff antes/depois
- Testes antes/depois
- Score calculado
- Motivo de falha (se aplicável)

## Estimativa de tempo

- Setup inicial: 30 minutos
- Execução por tarefa: 10-30 minutos (média 15 minutos)
- Total de execução: ~2.5 horas
- Validação e relatório: 30 minutos
- **Total estimado:** ~3 horas

## Riscos e mitigações

### Riscos
- **Fixture inadequado:** Tarefas podem não ser aplicáveis ao fixture
- **Ferramenta instável:** Ferramenta pode falhar durante execução
- **Custo inesperado:** Custo de API pode ser alto
- **Tempo excedido:** Tarefas podem demorar mais que o estimado

### Mitigações
- Validar fixture antes da execução
- Ter orçamento definido e monitorar custo
- Ter timeout definido por tarefa
- Ter snapshot do estado inicial

## Status de implementação

### Concluído
- [x] Documentar plano de execução
- [x] Definir tarefas e critérios de aceite
- [x] Definir procedimento de registro de métricas
- [x] Estimar tempo e riscos
- [x] Criar fixture sintético (benchmark_fixture/)
- [x] Criar script para T01 (run_t01.js)
- [x] Documentar limitações de autonomia

### Limitações de autonomia
O benchmark **não pode ser executado autonomamente** porque:
1. **Ferramenta precisa ser iniciada manualmente:** OpenCode, Freebuff, etc. não têm API de automação
2. **Interação requer intervenção humana:** Prompt e resposta não podem ser automatizados sem API
3. **Validação requer revisão humana:** Critérios de aceite precisam ser verificados manualmente
4. **Custo precisa ser monitorado:** Tokens e custo precisam ser rastreados manualmente

### Pendente (requer execução manual)
- [ ] Instalar ferramenta de benchmark (OpenCode, Freebuff, etc.)
- [ ] Executar T01-T10 sequencialmente
- [ ] Registrar métricas em JSON
- [ ] Validar com `validate_benchmark.mjs`
- [ ] Gerar relatório de resultados

## Próximos passos

1. Preparar fixture sintético ou selecionar repositório autorizado
2. Configurar ferramenta de benchmark (OpenCode, Freebuff, etc.)
3. Definir orçamento e timeout
4. Executar tarefas sequencialmente
5. Registrar métricas em JSON
6. Validar com `validate_benchmark.mjs`
7. Gerar relatório final

## Referências
- Manifesto das 10 tarefas: `benchmarks/manifesto_10_tarefas.md`
- Procedimento de execução: `benchmarks/procedimento_execucao.md`
- Schema de resultados: `benchmarks/schema_resultados.md`
- Validador: `benchmarks/validate_benchmark.mjs`
- Protocolo de telemetria: `benchmarks/protocolo_telemetria.md`
