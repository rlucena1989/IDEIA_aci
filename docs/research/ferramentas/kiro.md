# Kiro

## 1. Resumo rápido
- Nome: Kiro
- Categoria: IDE/agentic coding/SaaS (Google)
- Site/repositório: https://kiro.dev
- Status: ativo
- Licença: proprietária
- Público-alvo: desenvolvedores individuais e equipes
- Maturidade: 4/5 — produto Google com infraestrutura AWS, enterprise-ready
- Reaproveitamento: inspiração de arquitetura de segurança e sandbox

## 2. Descrição
IDE agentic da Google com suporte a múltiplos modelos, sandbox de segurança, e integração com canais de mensagens (Slack, Discord, Teams, etc.).

## 3. Funcionalidades principais
- IDE local baseada em Code OSS.
- CLI para terminal, agentes customizados e pipelines.
- Web com sessões em sandbox cloud isolado.
- Modos autonomous, spec e default na web.
- Steering files e learnings compartilhados entre interfaces.
- GitHub/GitLab em sessões web.
- Automações cloud.
- Seleção de modelos com créditos e multiplicadores; a página consultada mostra modelos Claude, DeepSeek e MiniMax.
- Importação de configurações, temas e plugins Open VSX compatíveis.

## 4. Arquitetura ou funcionamento provável
Fato: produto distribuído em IDE local, CLI e web; web usa sandboxes cloud e integra repositórios.

Hipótese: um serviço de sessão coordena estado, steering/learnings e execução em workers isolados; clientes IDE/CLI funcionam como superfícies para o mesmo modelo de tarefa.

## 5. Pontos fortes
- Abrange local, CLI e cloud.
- Spec-driven development e steering files.
- Sessões longas em sandbox.
- Integração com GitHub/GitLab.
- Modelo de créditos com indicação de multiplicadores.

## 6. Pontos fracos e limitações
- Produto proprietário e dependente de políticas do fornecedor.
- Retenção, isolamento e telemetria devem ser confirmados nos termos enterprise.
- Autonomia cloud e automações aumentam superfície de risco.
- Custos por crédito podem dificultar previsão sem histórico próprio.

## 7. Maturidade
Nota: 4/5. Tem várias superfícies e documentação; a maturidade de agentes autônomos em produção ainda deve ser medida por benchmark próprio.

## 8. Possibilidade de reaproveitamento
Reaproveitar como inspiração: spec-driven, steering, sessões cross-surface e créditos. Não reutilizar código/branding.

## 9. Gaps e oportunidades
Self-hosted completo, transparência de routing, exportação/replay de estado e controle local de dados.

## 10. Ideias de implementação
Adotar specs versionadas, steering files por projeto e worker remoto opcional. Prioridade: média; dificuldade: média.

## 11. Segurança e privacidade

### Data protection
- **Infraestrutura:** AWS shared responsibility model
- **Encryption:** AWS owned encryption keys via AWS KMS
- **Responsabilidade:** Usuário responsável por conteúdo e configuração de segurança

### Retenção de dados
- **Free Tier:** Inputs armazenados até 60 dias para abuse detection
- **Abuse detection:** Não usado para treinar modelos, apenas para detectar violações
- **OpenAI GPT:** Tráfego classificado retido até 30 dias para abuse detection
- **Enterprise:** Opção de não armazenar dados (confirmar com contrato)

### Billing e créditos
| Tier | Créditos | Add-on |
|---|---|---|
| Free | 50 | Não disponível |
| Pro | 1.000 | Disponível |
| Pro+ | 2.000 | Disponível |
| Pro Max | 5.000 | Disponível |
| Power | 10.000 | Disponível |

**Práticas de billing:**
- Créditos consumidos fractionalmente por request
- Upgrade mid-month: fee prorated, créditos completos do novo tier
- Upgrade no mesmo mês: fee backdated, créditos recalculados
- Downgrade mid-month: fee completo do tier atual
- Add-on credits preservados após upgrade
- Credit reset no início do ciclo de billing

### Security model (Crew)
8 camadas de verificação por tool call:
1. **Owner lock:** Gateway rejeita usuários não autorizados
2. **Denied commands:** 137 padrões bloqueiam operações destrutivas
3. **Governance ceiling:** Policy ∩ Profile (tightest-wins)
4. **Sensitive path blocking:** Diretórios de credenciais inacessíveis
5. **Tool approval:** Interactive review, trust escalation, Autopilot
6. **Input validation:** MCP schemas, type checks, length limits
7. **OS sandbox:** Isolamento via Linux namespaces ou macOS Seatbelt
8. **Output redaction:** Padrões de credenciais removidos da resposta

### Proteção de credenciais
- **Sensitive paths blocked:** `.aws`, `.ssh`, `.gnupg`, `.env` inacessíveis
- **Output redaction:** AWS keys, private keys, Slack tokens, GitHub tokens, etc. removidos
- **Environment scrubbing:** Variáveis de ambiente sensíveis removidas
- **15+ credential patterns:** Detectados e removidos automaticamente

### Audit log
- **Registro:** Todo tool call, approval, denial, security event
- **Inspeção:** Via CLI ou dashboard
- **Snapshots:** Incluído em snapshots
- **Cross-cutting:** Não é um gate sequencial

### Channel lock
- **Slack:** `KIROCREW_OWNER_ID` (single owner)
- **Discord:** Allowlist de user IDs (deny-by-default)
- **Telegram:** Allowlist de user IDs
- **Teams:** Allowlist de Azure AD emails/object IDs
- **Webex:** Allowlist de emails
- **WeCom:** Allowlist de userids (ou `allow_all_users` opt-in)
- **WeChat:** Allowlist de user IDs (default deny everyone)
- **Dashboard:** Token-authenticated

### Configuração recomendada
- **agent.sandbox:** `auto` ou `strict` (nunca `off`)
- **Autopilot:** Usar com moderação (remove gate humano)
- **Denied commands:** Revisar customizações (não desativar regras)

## 12. Referências
- https://kiro.dev
- https://kiro.dev/docs/specs/
- https://kiro.dev/docs/web/
- https://kiro.dev/docs/web/sandbox/
- https://kiro.dev/docs/guides/migrating-from-vscode/
- https://kiro.dev/docs/privacy-and-security/data-protection/
- https://kiro.dev/docs/billing/
- https://kiro.dev/faq/
- https://kiro.dev/docs/crew/security/
