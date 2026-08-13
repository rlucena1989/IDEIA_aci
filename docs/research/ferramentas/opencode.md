# OpenCode

## 1. Resumo rápido
- Nome: OpenCode
- Categoria: agente open source para terminal, desktop e extensão IDE
- Site/repositório: https://opencode.ai / https://github.com/anomalyco/opencode
- Status: ativo
- Licença: MIT no repositório consultado
- Público-alvo: desenvolvedores individuais, equipes e builders de agentes
- Maturidade: 4/5 — repositório ativo, grande comunidade e múltiplas superfícies; claims de adoção são do fornecedor.
- Reaproveitamento: adaptar conceitos e, sujeito à licença, componentes do repositório.

## 2. Descrição
Agente open source para coding em terminal, desktop e IDE. O site declara suporte a modelos de vários providers, LSP, múltiplas sessões e uso local.

## 3. Funcionalidades principais
- Agentes `build` e `plan`.
- Plan como modo read-only, com permissão antes de bash.
- LSP automático.
- Múltiplas sessões e agentes em paralelo.
- Terminal UI, desktop beta e extensão IDE.
- 75+ providers via Models.dev, incluindo modelos locais, conforme site.
- Share links de sessões (com modos: manual, auto, disabled).
- Integração com GitHub Copilot e ChatGPT Plus/Pro conforme login suportado.
- CLI, configuração, subagente `general` e ferramentas.

## 4. Arquitetura ou funcionamento provável
Fato: repositório público mostra monorepo TypeScript/Bun, `packages`, `sdks/vscode`, `specs`, `infra`, `github`, `nix` e app desktop/web. O README descreve agentes, providers, LSP e instalação multiplataforma.

Hipótese: o sistema separa core agent runtime, TUI/desktop/IDE clients, provider adapters, session store e tool permissions. A implementação detalhada deve ser estudada no código antes de reutilização.

## 5. Pontos fortes
- MIT e código público.
- Plan/read-only como modo de segurança.
- Provider-agnostic e local-friendly.
- CLI forte e múltiplas interfaces.
- LSP e sessões paralelos.
- Enterprise: SSO, AI gateway interno, self-hosting.

## 6. Pontos fracos e limitações
- Desktop indicado como beta.
- Grande superfície de projeto e dependências para manter.
- "Qualquer modelo" não implica mesma qualidade de tool calling.
- Share links enviam dados para servidores OpenCode (opencode.ai).
- Share links armazenados em CDN edge com cache.
- Métricas de sucesso independentes ainda precisam ser medidas.

## 7. Maturidade
Nota: 4/5. Projeto ativo e usável; não é 5 porque produto, desktop e ecossistema ainda evoluem rapidamente.

## 8. Possibilidade de reaproveitamento
Reaproveitar diretamente componentes MIT somente após auditoria técnica e legal. Reaproveitar como inspiração o modo Plan, o provider abstraction e o desenho multi-surface.

## 9. Gaps e oportunidades
- Governança centralizada para equipes.
- Sandbox e políticas cross-platform consistentes.
- Métricas de custo/qualidade por tarefa.
- Memória/RAG empresarial com retenção configurável.

## 10. Ideias de implementação
Usar Plan/Build como referência de UX; integrar um core agentic por API; manter provider adapters e permissões independentes da interface. Prioridade: alta; dificuldade: média.

## 11. Segurança e privacidade

### Share links
- **Modos:** manual (default), auto, disabled
- **Manual:** usuário compartilha explicitamente com `/share`
- **Auto:** todas as sessões são compartilhadas automaticamente
- **Disabled:** compartilhamento totalmente desativado
- **Dados enviados:** conversação e dados associados são enviados para opencode.ai
- **Armazenamento:** CDN edge com cache próximo aos usuários
- **Risco:** código proprietário pode ser exposto publicamente
- **Recomendação enterprise:** Desativar share para trial, usar config centralizada

### Enterprise
- **SSO integration:** Integração com provedor SSO da organização
- **Internal AI gateway:** Configuração para usar apenas gateway interno
- **Central config:** Configuração única para toda a organização
- **Self-hosting:** Opção de self-hostar share pages na infraestrutura própria
- **Data retention:** OpenCode não armazena código ou dados de contexto
- **Processing:** Todo processamento é local ou via API direta ao provider

### Configuração de segurança
```json
{
  "$schema": "https://opencode.ai/config.json",
  "share": "disabled"
}
```

### Limitações atuais
- Share storage backend público (sem opção de S3 privado por default)
- Issue #7807: solicitação de suporte para private storage backends
- Issue #11690: solicitação de auth header hooks para enterprise share

## 12. Referências
- https://opencode.ai
- https://opencode.ai/docs
- https://opencode.ai/docs/share/
- https://open-code.ai/en/docs/enterprise
- https://opencode.ai/enterprise
- https://github.com/anomalyco/opencode
- https://github.com/anomalyco/opencode/blob/dev/LICENSE
- https://github.com/anomalyco/opencode/issues/7807
- https://github.com/anomalyco/opencode/issues/11690
