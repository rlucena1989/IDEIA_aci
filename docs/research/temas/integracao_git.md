# Integração Git

> **Revisão de abordagem — 12/08/2026:** Git fornece evidência e mudança recuperável, mas não isolamento de segurança. Preservar estado dirty e trabalho alheio precede commit, push ou PR. Ver [RAT-06](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-06--integração-git).

## 1. Descrição
Permite branch, diff, commit, PR, revisão e rollback.

## 2. Importância para a plataforma
Git fornece isolamento e reversibilidade.

## 3. Ferramentas relacionadas
Git CLI, libgit2, simple-git, GitHub/GitLab APIs.

## 4. Abordagens existentes
Branch/worktree por tarefa e PR como fronteira humana.

## 5. Grau de maturidade
Maduro.

## 6. Tecnologias recomendadas
Git CLI + APIs oficiais, Conventional Commits, signed commits.

## 7. Riscos e desafios
Force push, conflitos, secrets e alterações do usuário.

## 8. Oportunidades de inovação
PR com evidências, custo, testes e timeline do agente.

## 9. Próximos passos
Implementar status/diff/branch/commit; push sob aprovação.

## 10. Referências
https://git-scm.com/docs; https://docs.github.com/en/rest
