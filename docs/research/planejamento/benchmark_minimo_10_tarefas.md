# Benchmark mínimo — protocolo executável

## Escopo
Benchmark inicial com 10 tarefas autorizadas. Usar somente repositórios próprios ou explicitamente autorizados. Não incluir secrets, dados pessoais ou produção.

## Tarefas

| ID | Tipo | Critério de aceite |
|---|---|---|
| T01 | entender repo | mapa de módulos e entrypoints com referências |
| T02 | bugfix | teste reproduz o bug e passa após correção |
| T03 | feature backend | endpoint, validação e testes |
| T04 | feature frontend | fluxo visual e testes relevantes |
| T05 | refatoração | comportamento preservado e diff limitado |
| T06 | testes | cobertura adicionada sem testes tautológicos |
| T07 | dependência | upgrade, lockfile e regressão controlada |
| T08 | documentação | docs atualizadas e links válidos |
| T09 | segurança | finding reproduzível e correção validada |
| T10 | monorepo/legado | pacote alvo alterado sem regressão cruzada |

## Registro por execução
```yaml
id: T01
repo_commit: <sha>
agent_version: <versao>
model: <provider/modelo>
prompt_version: <versao>
budget_usd: 0
started_at: <timestamp>
finished_at: <timestamp>
status: success|partial|failed|rolled_back
human_interventions: 0
tool_calls: 0
retries: 0
input_tokens: 0
output_tokens: 0
cost_usd: 0
acceptance_tests: 0/0
regressions: []
out_of_scope_changes: []
review_score: 0
notes: ""
```

## Procedimento
1. Criar cópia/branch do commit fixado.
2. Executar baseline dos testes.
3. Rodar agente com budget e timeout definidos.
4. Capturar plano, ações, diff e logs.
5. Executar critérios de aceite e regressão.
6. Fazer revisão cega do diff.
7. Registrar sucesso ou rollback.
8. Repetir tarefas estocásticas três vezes.

## Critério de sucesso
Tarefa só é “concluída” se critérios de aceite passarem, não houver alteração fora do escopo, não houver finding crítico e o diff for aprovado.

## Próximo passo
Preencher os dez casos com repositórios autorizados e commits reais. A plataforma ainda não deve executar tarefas em produção.
