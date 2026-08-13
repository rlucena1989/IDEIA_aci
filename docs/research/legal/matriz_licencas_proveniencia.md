# Matriz de licenças e proveniência

> Inventário técnico preliminar. Confirmar o commit/arquivo `LICENSE` antes de distribuição comercial.

| Componente | Origem | Licença observada | Pode copiar? | Condições |
|---|---|---|---|---|
| OmniRoute | `diegosouzapw/OmniRoute` / npm local | MIT no `package.json` local | Sim, sujeito a confirmação | manter copyright/NOTICE e revisar deps |
| OpenCode | `anomalyco/opencode` / npm local | MIT no pacote/repositório | Sim, sujeito a confirmação | manter avisos e separar serviços proprietários |
| Plugin OmniRoute/OpenCode | instalação local | MIT no `package.json` | Sim, sujeito a confirmação | preservar licença e dependência de API |
| Freebuff | `CodebuffAI/freebuff` | Apache-2.0 no repositório | Sim, sujeito a confirmação | NOTICE, patentes e dependências |
| VS Code/Code OSS | Microsoft/Code OSS | mistura de licenças | Parcial | não copiar branding/binários; revisar LICENSE |
| Cursor | Anysphere | produto proprietário; componentes de terceiros | Não como código proprietário | usar apenas APIs, UX e padrões observáveis |
| Devin | Cognition/Exafunction | produto proprietário | Não como código proprietário | usar conceitos e documentação pública |
| Antigravity | Google | produto proprietário; componentes Code OSS/terceiros | Parcial | copiar apenas componentes com licença explícita |
| LSP | Microsoft/consórcio | especificação/projetos variados | Sim conforme projeto | respeitar licença da implementação |
| MCP | protocolo/ecossistema | especificação/SDKs variados | Depende do SDK | revisar licença e versão |

## Regras de cópia
1. Copiar somente de repositório/artefato com licença identificável.
2. Registrar URL, commit/versão e data.
3. Preservar LICENSE, NOTICE e copyright.
4. Auditar dependências transitivas.
5. Não copiar tokens, logs, prompts privados, cookies, dados de usuário ou binários proprietários.
6. Não remover telemetria/licenciamento de software de terceiros.
7. Separar código copiado em diretório com proveniência própria.

## Recomendação para IDEIA
Usar adaptação direta principalmente de componentes MIT/Apache-2.0, priorizando OpenCode, OmniRoute plugin, LSP, tree-sitter e bibliotecas de infraestrutura. Tratar produtos proprietários como referência de UX e arquitetura.
