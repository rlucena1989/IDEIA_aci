# Versionamento, diff e rollback

1. Criar branch/worktree por tarefa.
2. Capturar snapshot antes de mutações.
3. Mostrar patch/diff e permitir aceitar/rejeitar hunks.
4. Aplicar mudanças atomicamente e rodar validações.
5. Commit por etapa lógica; nunca misturar mudanças do usuário.
6. Push/PR somente com aprovação.
7. Resolver conflitos explicitamente; não sobrescrever alterações desconhecidas.
8. Rollback por snapshot/commit, com confirmação e relatório.
9. Proteger `.env`, chaves, lockfiles e arquivos de produção por política.
10. Dry-run e read-only devem ser modos de primeira classe.

Snapshots precisam de hash, timestamp, tarefa e lista de arquivos; retenção deve ser configurável.
