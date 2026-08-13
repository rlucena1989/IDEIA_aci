# Cline

## 1. Resumo rápido
- Nome: Cline
- Categoria: agente/IDE extension/CLI/SDK
- Site/repositório: https://cline.bot / https://github.com/cline/cline
- Status: ativo
- Licença: Apache-2.0 (conforme site/repositório; confirmar versão)
- Maturidade: 4/5 — amplamente usado, open source e extensível.
- Reaproveitamento: adaptar conceitos; avaliar licença e arquitetura antes de incorporar código.

## 2. Descrição
Agente open source que opera no editor e terminal, com aprovação humana e suporte a vários provedores.

## 3. Funcionalidades principais
- Plan/Act; leitura/escrita; shell; diffs/checkpoints; rules/skills; MCP; CLI/SDK; múltiplos modelos; integrações e automações.

## 4. Arquitetura ou funcionamento provável
Fato público: extensão/CLI/SDK e tools configuráveis. Hipótese: loop agentic central com adapters de provider, persistência de checkpoints e camada de política.

## 5. Pontos fortes
Open source, model-agnostic, MCP, aprovação por ação, CLI/SDK e extensibilidade.

## 6. Limitações
UX e documentação podem variar; execução local depende do ambiente e da configuração de segurança; custo de API continua sendo do usuário.

## 7. Maturidade
Nota: 4/5. Usável em projetos reais e comunidade relevante; segurança operacional depende da configuração local.

## 8. Reaproveitamento
Reaproveitar como inspiração; possível adaptação de componentes somente após revisão de licença, dependências e escopo.

## 9. Gaps e oportunidades
Governança enterprise centralizada, métricas comparáveis, sandbox forte cross-platform e workflows multi-repo nativos.

## 10. Ideias de implementação
Adotar Plan/Act, checkpoints e MCP; separar core de UI e impor capability tokens por tool.

## 11. Referências
https://cline.bot
https://github.com/cline/cline
https://docs.cline.bot
