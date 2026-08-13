# Segurança, privacidade e retenção — ferramentas agentic

## Matriz

| Ferramenta | Processamento/armazenamento observado | Controle relevante | Risco para código sensível | Observação |
|---|---|---|---|---|
| Freebuff | coleta prompts, código, arquivos, repos, uso e diagnóstico; providers podem processar dados | notices por modelo, direitos de privacidade | Alto no serviço gratuito | política permite publicidade personalizada baseada em prompts/mensagens; retenção varia |
| OpenCode | declara não armazenar código/contexto; processamento local ou direto ao provider | config central, SSO, gateway interno, `share: disabled` | Médio/baixo com provider confiável | `/share` envia conversa/dados ao serviço de compartilhamento |
| Kiro local | agente pode ler/modificar/deletar e executar comandos; Supervised é fluxo de revisão, não sandbox | protected paths, trusted commands, workspace isolation | Médio | documentação afirma explicitamente que Supervised não restringe acesso |
| Kiro Web | sandbox isolado por tarefa, clone de repos autorizados, internet/vars configuráveis | isolamento e teardown por tarefa | Médio | confirmar políticas de secrets, regiões e retenção enterprise |
| Antigravity | Projects delimitam pastas/repos; Local Mode ou Worktree Mode | políticas por projeto, worktree, permissões e browser allowlist | Médio | detalhes de retenção/provider devem ser confirmados nos termos |
| Trae | não confirmado nesta rodada | não encontrado publicamente | Desconhecido | requer consulta de política/termos aplicáveis à região |

## Implicações para a plataforma própria
1. “Supervisionado” deve ser separado de “isolado”.
2. Compartilhamento de sessões deve ser desligado por padrão em projetos privados.
3. Modelos/providers devem ser selecionados por classificação de dados.
4. Publicidade baseada em prompts não é compatível com modo confidencial.
5. Worktree delimita alterações, mas não substitui sandbox de processo/rede.
6. Toda integração deve expor retenção, local de processamento e sub-processadores.

## Fontes
- https://freebuff.ai/privacy-policy
- https://opencode.ai/docs/enterprise/
- https://kiro.dev/docs/privacy-and-security/
- https://kiro.dev/docs/web/sandbox/
- https://antigravity.google/docs/getting-started
- https://trae.ai
