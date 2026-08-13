# Isolamento Efetivo e Retenção de Superfícies Cloud

**Data:** 11 de agosto de 2026  
**Status:** Documentação consolidada  
**Objetivo:** Comparar isolamento e retenção de dados em superfícies cloud (Freebuff, Trae, Kiro)

## Resumo executivo

| Ferramenta | Isolamento | Retenção mínima | Retenção máxima | Enterprise | Recomendação |
|---|---|---|---|---|---|
| **Freebuff** | Workspace isolado | Variável por plano | 5 anos (dados pessoais) | Zero-retention configurável | Não recomendado para dados sensíveis |
| **Trae** | Sessão isolada | 5 anos (dados pessoais) | Indefinida (dados não pessoais) | Não documentado | Não recomendado para dados corporativos |
| **Kiro** | Sandbox OS | 60 dias (Free Tier) | Configurável (Enterprise) | Zero-retention configurável | Aceitável com Enterprise |
| **OpenCode** | Local-first | Não armazena (exceto share links) | Share links: configurável | Self-hosting disponível | Recomendado para dados sensíveis |

## Freebuff

### Isolamento
- **Workspace isolado:** Cada sessão usa workspace separado
- **Sessões paralelas:** Desktop suporta sessões paralelas em workspaces isolados
- **Sandbox cloud:** Web usa sessões em sandbox cloud isolado
- **Uploads separados:** Uploads e repositórios conectados NÃO são fornecidos a providers de advertising

### Retenção de dados
- **Free Tier:** Inputs armazenados até 60 dias para abuse detection
- **Abuse detection:** Não usado para treinar modelos, apenas para detectar violações
- **OpenAI GPT:** Tráfego classificado retido até 30 dias para abuse detection
- **Enterprise:** Custom retention windows incluindo zero-retention
- **Dados pessoais:** Retidos por 5 anos após fechamento da conta (política ByteDance)
- **Dados não pessoais:** Retidos indefinidamente

### Riscos
- **Ad-supported:** Personalização de ads via análise de prompts/messages
- **Telemetria:** Coleta extensiva sem opt-out claro
- **ByteDance:** Transferência internacional para China (risco adicional)

### Recomendação
- **Não usar** para código sensível ou corporativo
- **Aceitável** para projetos pessoais/learning
- **Enterprise** pode ser viável com zero-retention configurável

## Trae

### Isolamento
- **Sessão isolada:** Cada sessão é isolada
- **Workspace:** Workspace por sessão
- **Não documentado:** Detalhes de isolamento não são claros na documentação

### Retenção de dados
- **Dados pessoais:** Retidos por 5 anos após fechamento da conta
- **Dados não pessoais:** Retidos indefinidamente
- **Telemetria:** Coleta extensiva sem opt-out claro
- **Privacy mode:** Disponível quando logado (não claro o que desabilita)

### Riscos
- **ByteDance:** Transferência internacional para China
- **Retenção 5 anos:** Muito longo para dados corporativos
- **Telemetria extensiva:** Coleta sem opt-out claro
- **Privacy mode:** Não claro o que desabilita

### Recomendação
- **Não usar** para código sensível ou corporativo
- **Aceitável** apenas para projetos pessoais/learning
- **Enterprise** não documentado

## Kiro

### Isolamento
- **Sandbox OS:** Isolamento via Linux namespaces ou macOS Seatbelt
- **Defense-in-depth:** 8 camadas de verificação por tool call
- **Sensitive paths blocked:** `.aws`, `.ssh`, `.gnupg`, `.env` inacessíveis
- **Output redaction:** Padrões de credenciais removidos da resposta
- **Environment scrubbing:** Variáveis de ambiente sensíveis removidas

### Retenção de dados
- **Free Tier:** Inputs armazenados até 60 dias para abuse detection
- **Abuse detection:** Não usado para treinar modelos, apenas para detectar violações
- **OpenAI GPT:** Tráfego classificado retido até 30 dias para abuse detection
- **Enterprise:** Opção de não armazenar dados (zero-retention)
- **Audit log:** Registro de todas as decisões (configurável)

### Riscos
- **Google:** Transferência internacional para EUA
- **Free Tier:** Retenção 60 dias (aceitável para desenvolvimento)
- **Autopilot:** Remove gate humano (risco operacional)

### Recomendação
- **Aceitável** para desenvolvimento com Free Tier
- **Recomendado** para produção com Enterprise (zero-retention)
- **Configurar:** `agent.sandbox=auto` ou `strict`, Autopilot com moderação

## OpenCode

### Isolamento
- **Local-first:** Dados armazenados localmente
- **Share links:** Dados enviados para opencode.ai via CDN edge (se habilitado)
- **Sandbox:** Não usa sandbox cloud (execução local)
- **Workspace:** Workspace local por projeto

### Retenção de dados
- **Local:** Não armazena código ou dados de contexto
- **Share links:** Armazenados em CDN edge (configurável)
- **Enterprise:** Self-hosting disponível (nenhum dado enviado externamente)
- **Logs:** Armazenados localmente

### Riscos
- **Share links:** Risco de exposição não intencional se habilitado
- **CDN edge:** Dados enviados para opencode.ai (se share habilitado)

### Recomendação
- **Recomendado** para dados sensíveis (local-first)
- **Configurar:** `{"share": "disabled"}` para dados sensíveis
- **Enterprise:** Self-hosting para máximo isolamento

## Comparativo de isolamento

### Nível de isolamento (1-5)

| Ferramenta | Isolamento local | Isolamento cloud | Sandbox | Score |
|---|---|---|---|---|
| **OpenCode** | 5 (local-first) | N/A | N/A | 5 |
| **Kiro** | 3 (local) | 4 (sandbox OS) | 5 (8 camadas) | 4 |
| **Freebuff** | 2 (workspace isolado) | 3 (sandbox cloud) | 3 | 3 |
| **Trae** | 2 (sessão isolada) | 2 (não documentado) | 2 | 2 |

### Nível de retenção (1-5, menor é melhor)

| Ferramenta | Retenção mínima | Retenção máxima | Enterprise | Score |
|---|---|---|---|---|
| **OpenCode** | 0 (local) | 0 (local) | 0 (self-hosted) | 1 |
| **Kiro** | 30 dias | 60 dias | 0 (zero-retention) | 2 |
| **Freebuff** | 30 dias | 5 anos | 0 (zero-retention) | 3 |
| **Trae** | 5 anos | Indefinida | Não documentado | 5 |

## Recomendações por caso de uso

### Código sensível/corporativo
- **Recomendado:** OpenCode (local-first, share disabled)
- **Aceitável:** Kiro (Enterprise com zero-retention)
- **Não recomendado:** Freebuff, Trae

### Projetos pessoais/learning
- **Recomendado:** OpenCode (local-first, gratuito)
- **Aceitável:** Freebuff (gratuito, ad-supported)
- **Aceitável:** Kiro (Free Tier, 60 dias retenção)
- **Não recomendado:** Trae (retenção 5 anos)

### Desenvolvimento rápido
- **Recomendado:** Freebuff (gratuito, ad-supported)
- **Aceitável:** OpenCode (local-first)
- **Aceitável:** Kiro (Free Tier)

### Produção enterprise
- **Recomendado:** OpenCode (self-hosted)
- **Aceitável:** Kiro (Enterprise com zero-retention)
- **Aceitável:** Freebuff (Enterprise com zero-retention)
- **Não recomendado:** Trae (Enterprise não documentado)

## Próximos passos

Para máxima segurança de dados:
1. **Usar OpenCode** com `{"share": "disabled"}` para dados sensíveis
2. **Configurar Kiro** com Enterprise e zero-retention se necessário
3. **Evitar Trae** para dados corporativos (retenção 5 anos)
4. **Usar Freebuff** apenas para projetos pessoais/learning
5. **Self-hosting** OpenCode para máximo isolamento (se necessário)

## Referências

- Freebuff: `ferramentas/freebuff.md`
- Trae: `ferramentas/freebuff_opencode_trae_kiro_antigravity_omniroute.md`
- Kiro: `ferramentas/kiro.md`
- OpenCode: `ferramentas/opencode.md`
- Matriz de licenças: `legal/matriz_licencas_ferramentas.md`
