# Freebuff

## 1. Resumo rápido
- Nome: Freebuff
- Categoria: agente de coding, CLI, desktop, web e cloud
- Site/repositório: https://freebuff.ai / https://github.com/CodebuffAI/freebuff
- Status: ativo; desktop indicado como beta no README consultado
- Licença: Apache-2.0 no repositório consultado
- Público-alvo: desenvolvedores individuais, equipes e usuários de agentes
- Maturidade: 3/5 — código público, múltiplas superfícies e uso relevante; produto gratuito/ad-supported e métricas independentes limitadas.
- Reaproveitamento: adaptar/inspirar; revisar licença, privacidade e dependências.

## 2. Descrição
Freebuff é um agente de coding gratuito, apoiado por anúncios, com CLI, desktop, web, cloud e chat. O repositório declara que usa agentes especializados, catálogo de modelos e o framework Codebuff.

## 3. Funcionalidades principais
- Leitura e edição de codebase.
- Execução de verificações e ferramentas.
- Agentes especializados para localizar arquivos, implementar, revisar e pesquisar.
- Sessões paralelas em workspaces isolados no Desktop.
- Browser/research e ambientes cloud com sandbox, preview, terminal e deploy.
- Modelos incluídos e possibilidade de conectar agentes locais como Claude Code/Codex.
- SDK/framework Codebuff para agentes customizados.
- CLI, Desktop, Web, Cloud e Chat.

## 4. Arquitetura ou funcionamento provável
Fato: o README descreve monorepo TypeScript/Bun, diretórios `agents`, `cli`, `sdk`, `packages`, `evals` e `freebuff`, além de agentes especializados e workspaces isolados.

Hipótese: o runtime possui um coordenador que delega descoberta de contexto, implementação, browser/research e revisão para subagentes; a execução local/cloud usa ambientes separados por sessão.

## 5. Pontos fortes
- Custo de entrada zero e sem API key para o catálogo incluído.
- Arquitetura multiagente explícita.
- Suporte a várias superfícies.
- Código open source e SDK.
- Workspaces paralelos e integração com GitHub Cloud.

## 6. Pontos fracos e limitações
- Modelo de anúncios cria riscos de privacidade e UX.
- O próprio README informa que prompts, mensagens, código, arquivos e repositórios são usados para prestar o serviço; certos usos podem envolver análise para anúncios ou treinamento conforme modelo/recurso.
- Disponibilidade de modelos e limites variam por região/capacidade.
- Produto Desktop indicado como beta.
- Dependência da infraestrutura e políticas do serviço para modelos gratuitos.

## 7. Maturidade
Nota: 3/5. Há repositório ativo, licença declarada, CLI e vários produtos; ainda é necessário validar estabilidade, segurança e resultados em tarefas reais.

## 8. Possibilidade de reaproveitamento
Reaproveitar como inspiração e avaliar adaptação do código Apache-2.0. Não copiar dados, prompts ou componentes sem verificar NOTICE, dependências e termos do serviço.

## 9. Gaps e oportunidades
- Opção paga sem publicidade e com retenção configurável.
- Auditoria empresarial e self-hosted.
- Benchmarks reproduzíveis de subagentes.
- Políticas mais explícitas para código sensível.

## 10. Ideias de implementação
Adotar catálogo de subagentes, file-picker/scout, reviewer e workspaces paralelos. Separar claramente serviço gratuito, modelos e dados do usuário. Prioridade: média; dificuldade: média/alta.

## 11. Privacidade e retenção de dados

### Uso de dados para treinar AI
- **Regra geral:** Apenas quando modelo ou feature diz explicitamente que dados podem ser usados para AI training
- **Quando usado:** Freebuff ou provider pode manter submissions para desenvolver, treinar, testar, avaliar, fine-tune e melhorar modelos ou produtos de AI
- **Notificação:** Freebuff mostra limites de sessão aplicáveis e aviso de uso de dados por modelo antes de iniciar

### Uso e armazenamento de dados
- **Dados usados:** Prompts, messages, code, files e repository data são usados para prestar o serviço
- **Personalização de ads:** Prompts e messages (incluindo conteúdo colado) podem ser analisados para personalizar ads, usando sistemas Freebuff e service providers
- **Uploads separados:** Uploads e repositórios conectados NÃO são fornecidos a providers de advertising
- **Opt-out:** Onde exigido por lei, Freebuff fornece escolhas de advertising e honra sinais de opt-out reconhecidos; em outros lugares, este processamento pode ser obrigatório para usar o serviço gratuito
- **Retenção:** Ver Privacy Policy para detalhes de retenção

### Enterprise
- **Custom retention:** Janelas de retenção customizadas incluindo zero-retention
- **Training terms:** Termos de treinamento e ad-personalization definidos no acordo
- **Billing:** Metered token billing (não subscriptions de $200/mês)
- **Custo estimado:** Engenheiro usando agente o dia todo ~$30.000/ano em tokens
- **Data storage:** Localização de armazenamento e acesso configurável no acordo

### Modelos e limites
- **Modelo base:** DeepSeek V4 Flash (o mesmo do OpenCode)
- **Quota:** 6 sessões de uma hora por dia (CLI npm v0.0.142)
- **Modelos disponíveis:** DeepSeek V4 Flash, MiMo 2.5, GLM 5.2 (ilimitado via bounties), GPT 5.6 Luna
- **Providers conectáveis:** Codex e Claude Code

### Terms of Service (Web)
- **Propriedade intelectual:**
  - Conteúdo em planos gratuitos: sem proteção de IP (Freebuff paga pela geração)
  - Conteúdo em planos pagos: usuário retém proteção de IP
- **Proibições:**
  - Modificar, reverse-engineer ou derivar source code de software proprietário
  - Expor IP subjacente (system prompts, source code proprietário, informações confidenciais)
  - Usar para conteúdo ilegal, prejudicial ou ameaçador
- **Terminação:** Direito de terminar ou suspender conta a qualquer momento, com ou sem aviso
- **Limitação de responsabilidade:** Ao máximo permitido por lei, responsabilidade total não excede valor pago

## 12. Referências
- https://freebuff.ai
- https://github.com/CodebuffAI/freebuff
- https://freebuff.ai/privacy-policy
- https://freebuff.com/web/terms
- https://freebuff.com/enterprise
- https://codebuff.com/docs
