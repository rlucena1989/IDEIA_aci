# Ferramentas obrigatórias com identidade pendente

## FreeBuff
- Status: Desconhecido.
- Site/repositório: Não encontrado de forma confiável durante a pesquisa.
- Categoria, licença, funcionalidades, maturidade e arquitetura: Desconhecidos.
- Recomendação: precisa pesquisar mais; não usar nome para decisões técnicas até confirmar URL/organização.

## OpenCode
- Existem projetos e produtos homônimos. O repositório inicialmente consultado retornou 404.
- Status, licença e funcionalidades do alvo solicitado: Desconhecidos.
- Recomendação: precisa pesquisar mais; confirmar URL canônica, pacote e proprietário.

## Trae

### Identidade e Proprietário
- **Proprietário:** ByteDance (TikTok's parent company) / 北京引力弹弓科技有限公司
- **Site oficial:** https://trae.ai
- **Categoria:** IDE/assistente e agente de coding (VS Code-based)
- **Status:** Ativo, produto comercial
- **Licença:** Proprietária, código fechado

### Funcionalidades
- **TraeCode/TraeWork:** IDE com assistente de IA e geração/edição assistida
- **Builder Mode:** Gera scaffolding completo de projetos a partir de descrição em linguagem natural
- **Multimodal input:** Upload de screenshots/mockups para gerar código UI
- **MCP Protocol:** Suporte para integrações de ferramentas
- **SOLO mode:** Modo local para desenvolvimento
- **Cloud IDE:** Opção baseada em navegador
- **Custom agents:** Suporte para agentes personalizados

### Preços e Planos (2026)
| Plano | Preço mensal | Preço anual | Basic Usage/mês | Auto-completions | Cloud Tasks |
|---|---|---|---|---|---|
| Free | $0 | - | $3 | 5.000/mês | 2 |
| Lite | $3 | $27 ($2.25/mo) | $5 | Ilimitado | 2 |
| Pro | $10 | $90 ($7.5/mo) | $20 | Ilimitado | 10 |
| Pro+ | $30 | $270 ($22.5/mo) | $90 | Ilimitado | 15 |
| Ultra | $100 | $900 ($75/mo) | $400 | Ilimitado | 20 |

**Notas de billing:**
- Billed by token (Dollar Usage)
- On-Demand Usage: pay-as-you-go após esgotar Basic Usage
- Modelos disponíveis: Claude 4, GPT-4o, DeepSeek R1, outros
- Enterprise via BytePlus: spending caps, zero retention, no model training

### Privacidade e Retenção de Dados

#### Política de Privacidade (trae.ai)
- **Dados pessoais:** Retidos por 5 anos após fechamento da conta
- **Dados não pessoais:** Retidos indefinidamente
- **Compartilhamento:** Dados compartilhados com afiliados ByteDance e service providers
- **Telemetria:** Coleta extensiva, sem opt-out
- **Conexões persistentes:** 5+ domínios ByteDance mesmo quando editor idle
- **Privacidade mode:** Disponível em TraeCode/TraeWork quando logado
  - Quando ativado: não usa chat interactions para analytics, product improvement, model training
  - Codebase files: nunca usados para analytics/training (independentemente do modo)
  - Codebase indexing: upload temporário para embeddings, plaintext deletado após
  - Cloud services: codebase processado e retido na nuvem
  - Apenas efetivo quando logado

#### Termos de Serviço (trae.ai)
- **Licença de conteúdo:** Licença irrevogável, perpétua, sublicensável, transferível, mundial para usar/modificar/reproduzir Your Content
- **Propósito:** provisionamento e melhoria dos serviços, operações de negócios das "SPRING Parties"
- **Marcas:** Licença não-exclusiva, royalty-free, perpétua para usar nomes, slogans, trademarks, logos

#### Funcionalidades de Coleta de Dados (atualização 2026)
- **Memory function:** TRAE pode lembrar detalhes de conversas como background (controlável em Settings)
- **Smart diagnosis:** Coleta automática de CPU, memória, disco, process list, plugin status, logs quando detecta anomalias (enviado para AI model)
- **Payment information:** Coleta de dados de pagamento para serviços pagos
- **Troubleshooting:** Coleta automática de device info e operation logs para diagnóstico

#### Enterprise (BytePlus)
- **Zero Retention:** Code criptografado em trânsito, nunca armazenado nos servidores
- **No Model Training:** Code nunca usado para treinar modelos
- **No logs retained:** Privacy by design
- **SOC2/ISO:** Não documentado na pesquisa

### Arquitetura
- **Base:** VS Code modificado
- **Backend:** Modelos e ferramentas de projeto (detalhes internos não publicados)
- **Infraestrutura:** Supabase (auth), Vercel (hosting)
- **Local vs Cloud:** Opções de desktop local e cloud IDE

### Maturidade
- **Score:** 3/5 — produto disponível e ativo, mas arquitetura pública limitada
- **Métricas independentes:** Escassas
- **Comunidade:** GitHub issues ativos, preocupações com privacidade documentadas

### Riscos e Preocupações
- **Privacidade agressiva:** Telemetria extensiva sem opt-out, retenção 5 anos
- **Compartilhamento ByteDance:** Dados compartilhados com afiliados
- **Sem modo local-only:** Sem opção de uso totalmente offline
- **Context drops:** Perda de contexto em sessões longas com codebases grandes
- **Sem certificações:** SOC2/ISO não documentadas
- **Licença de conteúdo amplo:** Terms of Service concedem licença perpétua para conteúdo do usuário

### Recomendação
- **Para projetos pessoais/learning:** Aceitável dado o custo/benefício
- **Para código sensível/corporativo:** **Não recomendado** — privacidade e retenção são dealbreakers
- **Para decisão técnica:** Avaliar termos de uso cuidadosamente; considerar alternativas local-first (Cursor, Windsurf, OpenCode)

### Referências
- https://trae.ai
- https://www.trae.ai/pricing/
- https://docs.trae.ai/ide/privacy-mode
- https://docs.trae.ai/solo/privacy-mode
- https://www.traeai.com/privacy
- https://www.trae.ai/terms-of-service
- https://www.trae.ai/enterprise
- https://github.com/Trae-AI/Trae/issues/178
- https://vibecoding.app/blog/trae-review
- https://toolchase.com/tool/trae/

## Kiro
- Status: precisa confirmar a versão/produto exato e documentação canônica.
- Categoria, licença, arquitetura e métricas: Desconhecidos neste levantamento.
- Recomendação: não apresentar como fato; pesquisar site oficial, termos, recursos de spec-driven development, agentes e IDE.

## Antigravity
- Status: identidade não confirmada; o repositório presumido retornou 404.
- Categoria/licença/recursos: Desconhecidos.
- Recomendação: solicitar URL ou organização correta antes de avaliar.

## OmniRoute
- Status: identidade não confirmada; o repositório presumido retornou 404.
- Categoria/licença/recursos: Desconhecidos.
- Hipótese: o nome pode referir-se a roteamento de modelos/provedores, mas isso não foi confirmado.
- Recomendação: solicitar URL ou organização correta antes de avaliar.
