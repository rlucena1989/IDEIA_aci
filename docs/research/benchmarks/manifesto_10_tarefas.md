# Manifesto das 10 tarefas

Cada tarefa deve ser executada em uma cópia limpa do commit-base. Os critérios abaixo são o contrato de aceite.

| ID | Tipo | Objetivo | Critério de aceite | Risco |
|---|---|---|---|---|
| T01 | compreensão | explicar estrutura e fluxo principal | relatório cita arquivos/símbolos corretos; nenhum arquivo alterado | baixo |
| T02 | bugfix | corrigir bug de validação de email | teste de regressão falha antes e passa depois; testes existentes passam | médio |
| T03 | feature backend | adicionar endpoint de paginação | contrato HTTP, validação, paginação e testes passam | médio |
| T04 | feature frontend | adicionar filtro de lista | filtro funciona, estado é previsível e teste relevante passa | médio |
| T05 | refatoração | separar módulo monolítico | comportamento preservado, imports válidos e diff limitado | médio |
| T06 | testes | aumentar cobertura de serviço | testes cobrem sucesso/erro e não são tautológicos | baixo |
| T07 | dependência | atualizar dependência compatível | lockfile consistente, build e testes passam | alto |
| T08 | documentação | atualizar README/API | instruções reproduzíveis, links válidos e exemplos coerentes | baixo |
| T09 | segurança | corrigir secret hardcoded sintético | secret removido, configuração segura e scanner passa | alto |
| T10 | monorepo | alterar pacote sem quebrar outro | pacote alvo passa; testes afetados passam; sem alteração fora do escopo | alto |

## Regras gerais
- T01 é read-only.
- T02–T10 exigem branch/worktree descartável.
- Nenhuma tarefa pode executar deploy, push, merge ou alteração de instalação.
- Instalações de OpenCode, Freebuff, Cursor, Devin, Antigravity e OmniRoute não fazem parte do workspace de teste.
- Comandos de rede devem ser proibidos, salvo tarefa explicitamente dedicada e ambiente sintético.
