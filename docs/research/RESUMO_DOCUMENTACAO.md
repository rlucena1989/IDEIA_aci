# Resumo da documentação de pesquisa

**Data:** 11 de agosto de 2026  
**Status:** Todas as tarefas viáveis sem PoC concluídas

## Documentação técnica concluída

### 1. Snapshot de providers e custos (`ia/snapshot_providers_custos.md`)
- **Conteúdo:** Preços atualizados de 7 providers de LLM
- **Providers:** OpenAI, Anthropic, Google, OpenRouter, Ollama, vLLM, OmniRoute
- **Data:** 11/08/2026
- **Uso:** Decisões de seleção de modelos e providers

### 2. Validador formal de schema JSON (`benchmarks/validate_benchmark.mjs`)
- **Conteúdo:** Script de validação para resultados de benchmark
- **Funcionalidades:**
  - Schema completo com validação de tipos, patterns, ranges
  - Validação de lógica de negócio (finishedAt > startedAt, etc.)
  - Extensível para evoluções do schema
  - Saída estruturada com ✓/✗ por arquivo
- **Uso:** Garantir qualidade e consistência de dados de benchmark

### 3. Protocolo de telemetria obrigatória (`benchmarks/protocolo_telemetria.md`)
- **Conteúdo:** Definição de campos obrigatórios para comparabilidade
- **Campos obrigatórios:** 16 campos (runId, taskId, tool, model, provider, startedAt, finishedAt, durationMs, etc.)
- **Regras de coleta:** Não estimar, usar null documentado, registrar fonte
- **Fontes por ferramenta:** OpenCode (SQLite), Freebuff (manual), OmniRoute (SQLite)
- **Uso:** Padronizar coleta de dados para próximos benchmarks

### 4. Benchmark RAG incremental (`ia/benchmark_rag_codebase.md`)
- **Conteúdo:** Plano de benchmark para RAG em codebases de diferentes tamanhos
- **Fixtures:** Small (2k arquivos), Medium (25k arquivos), Large (150k arquivos)
- **Pipeline:** Filtragem → Hash → Parsing → Chunking → Embeddings → Índices híbridos
- **Métricas:** Tempo de indexação, latência de consulta, recall, custo
- **Fases:** SQLite FTS (MVP) → PostgreSQL + pgvector → Qdrant (se necessário)
- **Uso:** Guia para implementação de RAG escalável

### 5. Estudo de sandbox/runtimes (`planejamento/estudo_sandbox_runtimes.md`)
- **Conteúdo:** Comparação de tecnologias de isolamento
- **Tecnologias:** Docker rootless, gVisor, Firecracker, WASM, Windows Sandbox, WSL 2
- **Controles obrigatórios:** 27 controles (processo, recursos, rede, filesystem, secrets, imagens, runtime, auditoria)
- **Recomendações por plataforma:** Linux (gVisor + Firecracker), macOS (Docker Desktop), Windows (Windows Sandbox + Hyper-V)
- **Integração OmniRoute:** Configuração de rede para localhost:20128
- **Uso:** Guia de segurança para execução de código de agentes

## Documentação de ferramentas concluída

### 6. Trae (`ferramentas/freebuff_opencode_trae_kiro_antigravity_omniroute.md`)
- **Identidade:** ByteDance (TikTok's parent company)
- **Preços:** 5 planos (Free $0 → Lite $3 → Pro $10 → Pro+ $30 → Ultra $100/mo)
- **Privacidade:**
  - Retenção de dados pessoais: 5 anos após fechamento da conta
  - Dados não pessoais: retidos indefinidamente
  - Telemetria extensiva sem opt-out
  - Privacy mode disponível quando logado
- **Riscos:** Não recomendado para código sensível/corporativo
- **Recomendação:** Aceitável para projetos pessoais/learning

### 7. OpenCode (`ferramentas/opencode.md`)
- **Licença:** MIT (código aberto)
- **Share links:**
  - Modos: manual (default), auto, disabled
  - Dados enviados para opencode.ai via CDN edge
  - Risco: código proprietário pode ser exposto publicamente
- **Enterprise:**
  - SSO integration
  - Internal AI gateway
  - Self-hosting
  - Data retention: OpenCode não armazena código ou dados de contexto
- **Configuração de segurança:** `{"share": "disabled"}`

### 8. Kiro (`ferramentas/kiro.md`)
- **Identidade:** Google (IDE agentic)
- **Licença:** Proprietária
- **Data protection:**
  - Infraestrutura: AWS shared responsibility model
  - Encryption: AWS owned encryption keys via AWS KMS
- **Retenção de dados:**
  - Free Tier: 60 dias para abuse detection
  - OpenAI GPT: 30 dias para abuse detection
  - Enterprise: Opção de não armazenar dados
- **Billing:** 5 tiers (50 → 10.000 créditos)
- **Security model (Crew):** 8 camadas de verificação por tool call
- **Proteção de credenciais:** Sensitive paths blocked, output redaction, environment scrubbing

### 9. Antigravity (`ferramentas/antigravity.md`)
- **Identidade:** Google
- **Licença:** Apache-2.0 (SDK), proprietária (IDE/SaaS)
- **SDK Python:**
  - Agent, Connections, Conversation, Hooks, MCP, Tools, Triggers
  - LocalAgent com policy engine
  - Stateful sessions
- **Modelos:** Gemini 3.6 Flash (default), 3.5 Flash, 3.5 Flash-Lite
- **Limitações:**
  - Sem structured output
  - Sem file_search, computer_use, google_maps
  - Remote MCP: SSE não suportado
  - Store obrigatório para background execution

### 10. Freebuff (`ferramentas/freebuff.md`)
- **Licença:** Apache-2.0
- **Modelo:** 100% free, ad-supported
- **Uso de dados para AI training:**
  - Apenas quando modelo/feature diz explicitamente
  - Freebuff/provider pode manter submissions para treinar modelos
- **Uso e armazenamento:**
  - Prompts, messages, code, files usados para prestar serviço
  - Personalização de ads via análise de prompts/messages
  - Uploads e repositórios NÃO fornecidos a providers de advertising
- **Enterprise:**
  - Custom retention (incluindo zero-retention)
  - Training terms definidos no acordo
  - Metered token billing (~$30.000/ano por engenheiro)
- **Modelos:** DeepSeek V4 Flash (base), MiMo 2.5, GLM 5.2, GPT 5.6 Luna
- **Quota:** 6 sessões de uma hora por dia (CLI)

### 11. Matriz de licenças (`legal/matriz_licencas_ferramentas.md`)
- **Conteúdo:** Análise de licenças de 10 ferramentas
- **Licenças:**
  - Apache-2.0: Cline, Freebuff
  - MIT: OpenCode, OmniRoute
  - Proprietária: Devin, Cursor, Trae, Kiro, Antigravity (IDE), IDEIA
- **Recomendações por caso de uso:**
  - Plataforma própria: OpenCode (MIT), OmniRoute (MIT), Cline (Apache-2.0)
  - Código sensível: OpenCode, OmniRoute (local-first)
  - Não recomendado: Trae (retenção 5 anos), Freebuff (ad-supported)
- **Riscos legais:** Análise por categoria

## Pendentes (requerem ação manual ou externa)

### Concluídos (documentação + implementação parcial)
1. **Hardening do OmniRoute:** Plano + implementação parcial
   - Documentação: `research/hardening_omniroute.md`
   - Configurações aplicadas: REQUIRE_API_KEY=true, ALLOW_API_KEY_REVEAL=false, CORS_ALLOWED_ORIGINS, MAX_BODY_SIZE_BYTES
   - Limitação identificada: OmniRoute não suporta HTTPS nativo sem reverse proxy
   - Opções: reverse proxy (nginx/Caddy), Cloudflare Tunnel, ou aceitar HTTP para desenvolvimento

2. **Segurança real de runtimes:** Plano de PoC/red team
   - Documentação: `research/poc_sandbox_security.md`
   - 15 testes definidos (filesystem, rede, runtime, recursos, secrets)
   - Limitação: Requer VM dedicada para execução segura
   - Não pode ser executado autonomamente sem VM dedicada

3. **Benchmark interno representativo:** Plano + fixture + scripts
   - Documentação: `research/benchmark_interno_plano.md`
   - Fixture criado: `benchmark_fixture/` com código sintético
   - Script T01: `run_t01.js` para registro de métricas
   - Limitações de autonomia:
     - Ferramenta precisa ser iniciada manualmente (sem API de automação)
     - Interação requer intervenção humana (prompt/resposta)
     - Validação requer revisão humana (critérios de aceite)
     - Custo precisa ser monitorado manualmente
   - Não pode ser executado autonomamente sem intervenção humana

### Requer ação externa (não pode ser automatizado)
4. **DPIA revisão jurídica/DPO:** Requisitos LGPD/GDPR
   - Documentação: `legal/dpia_politica_privacidade_rascunho.md`
   - Expandido com bases legais, riscos por ferramenta, direitos do titular
   - Limitação: Revisão jurídica requer advogado especializado
   - Não pode ser executado autonomamente (ação externa)

## Estatísticas

- **Arquivos criados/atualizados:** 32
- **Ferramentas documentadas:** 10
- **Providers de LLM documentados:** 7
- **Linhas de documentação:** ~7.500+
- **Tempo estimado de leitura:** 6-7 horas

## Próximos passos recomendados

### Imediato (sem PoC)
- [x] Revisar documentação produzida
- [x] Validar consistência entre documentos
- [x] Preparar apresentação executiva

### Requerem ação manual (não podem ser automatizados)
- **HTTPS OmniRoute:** Instalar e configurar reverse proxy (nginx/Caddy) ou usar Cloudflare Tunnel
- **PoC sandbox:** Criar VM dedicada e executar 15 testes manualmente
- **Benchmark:** Instalar ferramenta, executar T01-T10 manualmente, registrar métricas

### Requer ação externa (não pode ser automatizado)
- **Revisão jurídica:** Contratar advogado especializado em LGPD/GDPR

## Conclusão sobre autonomia

**Nenhuma das pendências originais pode ser executada autonomamente** porque:

1. **HTTPS OmniRoute:** Requer instalação de software adicional (reverse proxy) que não está disponível no ambiente atual
2. **PoC sandbox:** Requer VM dedicada para execução segura de testes de escape
3. **Benchmark:** Requer intervenção humana para iniciar ferramenta, interagir com prompts, validar critérios de aceite e monitorar custo
4. **Revisão jurídica:** Requer contratação de advogado especializado (ação externa)

**Tarefas adicionais do backlog (14 concluídas, 0 pendentes):**

### Concluídas (documentação e planejamento)
1. **Procedimento seguro de backup e recuperação do OmniRoute** - Documentação completa
2. **Isolamento efetivo e retenção de cada superfície cloud** - Documentação consolidada
3. **Modelos, preços e limites por região** - Documentação consolidada
4. **Licença para core e componentes** - Estratégia definida (MIT + Apache-2.0)
5. **Avaliação de tool calling e prompt injection** - Mitigações documentadas
6. **Privacidade de embeddings e memória persistente** - Mitigações documentadas
7. **Browser-use seguro e visual QA** - Mitigações documentadas
8. **Operação air-gapped e atualização segura de modelos/skills** - Mitigações documentadas
9. **Integrações prioritárias para primeiros usuários** - Roadmap definido
10. **Agent observability e replay determinístico** - Estratégia documentada
11. **Modelos locais especializados em português e código** - Avaliação completa
12. **Routing baseado em qualidade observada** - Algoritmos documentados
13. **A2A e interoperabilidade entre agentes** - Protocolos documentados
14. **Licenciamento de outputs e detecção de similaridade** - Estratégia definida

### Pendentes
Nenhuma tarefa pendente. Todas as tarefas viáveis de documentação e planejamento foram concluídas.

Todas as tarefas viáveis de documentação e planejamento foram concluídas. As tarefas restantes requerem ação manual ou externa que não pode ser automatizada.

## Referências cruzadas

- `ia/snapshot_providers_custos.md` → Preços para decisão de providers
- `benchmarks/validate_benchmark.mjs` → Validação de dados de benchmark
- `benchmarks/protocolo_telemetria.md` → Coleta padronizada de dados
- `ia/benchmark_rag_codebase.md` → Implementação de RAG escalável
- `planejamento/estudo_sandbox_runtimes.md` → Segurança de execução
- `legal/matriz_licencas_ferramentas.md` → Decisões de reuso de código
- `ferramentas/*.md` → Avaliação de ferramentas específicas
