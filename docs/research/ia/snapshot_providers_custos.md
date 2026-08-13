# Snapshot de providers e custos

> **QUARENTENA DOCUMENTAL (13/08/2026):** este arquivo é um rascunho histórico sem coleta reproduzível, artifact digests, plano/conta verificados ou reconciliação com cobrança. Os valores e capacidades abaixo NÃO PODEM alimentar código, orçamento, routing, compra ou claim. Uma substituição deve seguir `PriceBookSnapshot` e o protocolo de [gerenciamento de custos v2](gerenciamento_de_custos.md), consultando fontes oficiais no momento da decisão.

**Data/hora UTC da consulta:** 2026-08-11T17:00:00Z
**Região:** Global (US onde especificado)

## Regra
Preços e limites são voláteis. Este snapshot reflete preços em 11/08/2026. Sempre verificar páginas oficiais antes da decisão.

## Providers principais

### OpenAI API

| Modelo | Preço input | Preço output | Cache input | Cache output | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5.6 Sol | $5.00/MTok | $30.00/MTok | $0.50/MTok (5m) | - | 1M | ✅ | Pay-per-use | 30 dias | Opcional (enterprise) | ✅ | https://openai.com/api/pricing |
| GPT-5.6 Terra | $2.00/MTok | $12.00/MTok | $0.20/MTok (5m) | - | 1M | ✅ | Pay-per-use | 30 dias | Opcional (enterprise) | ✅ | https://openai.com/api/pricing |
| GPT-5.6 Luna | $0.20/MTok | $1.20/MTok | $0.02/MTok (5m) | - | 1M | ✅ | Pay-per-use | 30 dias | Opcional (enterprise) | ✅ | https://openai.com/api/pricing |
| GPT-4o | $2.50/MTok | $10.00/MTok | $1.25/MTok | - | 128K | ✅ | Pay-per-use | 30 dias | Opcional (enterprise) | ✅ | https://openai.com/api/pricing |

**Notas:**
- Regional processing (data residency): +10% uplift
- Batch API: 50% desconto
- Fast mode (ex-Priority): disponível para certos modelos

### Anthropic Claude API

| Modelo | Preço input | Preço output | Cache 5m | Cache 1h | Cache hit | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude Fable 5 | $10.00/MTok | $50.00/MTok | $12.50/MTok | $20.00/MTok | $1.00/MTok | 200K | ✅ | Pay-per-use | 30 dias | Não | ✅ | https://claude.com/pricing |
| Claude Opus 5 | $5.00/MTok | $25.00/MTok | $6.25/MTok | $10.00/MTok | $0.50/MTok | 200K | ✅ | Pay-per-use | 30 dias | Não | ✅ | https://claude.com/pricing |
| Claude Sonnet 5 | $2.00/MTok | $10.00/MTok | $2.50/MTok | $4.00/MTok | $0.20/MTok | 200K | ✅ | Pay-per-use | 30 dias | Não | ✅ | https://claude.com/pricing |
| Claude Haiku 4.5 | $1.00/MTok | $5.00/MTok | $1.25/MTok | $2.00/MTok | $0.10/MTok | 200K | ✅ | Pay-per-use | 30 dias | Não | ✅ | https://claude.com/pricing |

**Notas:**
- Preço introdutório Sonnet 5 ($2/$10) válido até 31/08/2026
- US-only inference: 1.1x premium
- Batch API: 50% desconto
- Fast mode (Opus 5): 2x preço, 2.5x velocidade

### Google Gemini API

| Modelo | Preço input | Preço output | Cache | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|---|
| Gemini 3.6 Flash | $1.50/MTok | $7.50/MTok | $0.15/MTok | 1M | ✅ | Free tier + pay-per-use | Não | Não (paid) | ✅ | https://ai.google.dev/gemini-api/docs/pricing |
| Gemini 3.5 Flash | $1.50/MTok | $9.00/MTok | $0.15/MTok | 1M | ✅ | Free tier + pay-per-use | Não | Não (paid) | ✅ | https://ai.google.dev/gemini-api/docs/pricing |
| Gemini 3.5 Flash-Lite | $0.30/MTok | $2.50/MTok | $0.03/MTok | 1M | ✅ | Free tier + pay-per-use | Não | Não (paid) | ✅ | https://ai.google.dev/gemini-api/docs/pricing |
| Gemini 3.1 Pro | $2.00/MTok | $12.00/MTok | $0.20/MTok | 1M | ✅ | Free tier + pay-per-use | Não | Não (paid) | ✅ | https://ai.google.dev/gemini-api/docs/pricing |
| Gemini 2.5 Flash-Lite | $0.10/MTok | $0.40/MTok | $0.01/MTok | 1M | ✅ | Free tier + pay-per-use | Não | Não (paid) | ✅ | https://ai.google.dev/gemini-api/docs/pricing |

**Notas:**
- Free tier: generosos limites, mas dados usados para melhorar produtos
- Paid tier: não usa dados para treinamento
- Flex tier: 50% desconto (latency-tolerant)
- Priority tier: premium preço, maior confiabilidade
- Grounding com Google Search: 5.000 prompts/mês grátis, depois $14/1.000 queries
- Long-context (>200K): preços dobrados para alguns modelos

### OpenRouter

| Modelo | Preço input | Preço output | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|
| GPT-5.5 | $5.00/MTok | $30.00/MTok | 1M | ✅ | 400+ models | Provider-dependent | Provider-dependent | Provider-dependent | https://openrouter.ai/pricing |
| Claude Opus 4.7 | $5.00/MTok | $25.00/MTok | 1M | ✅ | 400+ models | Provider-dependent | Provider-dependent | Provider-dependent | https://openrouter.ai/pricing |
| Gemini 3.5 Flash | $1.50/MTok | $9.00/MTok | 1M | ✅ | 400+ models | Provider-dependent | Provider-dependent | Provider-dependent | https://openrouter.ai/pricing |

**Notas:**
- Platform fee: 5.5% sobre créditos (não markup per-token)
- Free tier: 26 modelos grátis, 50 reqs/dia
- Pay-as-you-go: 400+ modelos, 70+ providers
- BYOK: 5% fee após 1M requests/mês grátis
- Preços per-token idênticos aos providers diretos

### Ollama

| Modelo | Preço input | Preço output | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|
| Local (qualquer) | $0 | $0 | Model-dependent | ✅ | Ilimitado (local) | Local | Não | N/A | https://ollama.com/pricing |
| Cloud Pro | $20/mo | $20/mo | Model-dependent | ✅ | 3 models simultâneos | Ollama | Não | N/A | https://ollama.com/pricing |
| Cloud Max | $100/mo | $100/mo | Model-dependent | ✅ | 10 models simultâneos | Ollama | Não | N/A | https://ollama.com/pricing |

**Notas:**
- Local: sempre gratuito, executa no hardware do usuário
- Cloud: cobrado por GPU-time, não por tokens
- Free cloud: 1 modelo por vez, uso limitado
- Pro: 3 models simultâneos, 50x mais uso que Free
- Max: 10 models simultâneos, 5x mais uso que Pro (pausado para novos sign-ups)

### vLLM Self-Hosted

| Modelo | Preço input | Preço output | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|
| Llama 4 70B (H100, batch=8) | ~$0.10/MTok | ~$0.13/MTok | Model-dependent | ✅ | GPU utilization | Local | Não | N/A | https://packet.ai/blog/llm-inference-cost |
| Llama 4 70B (T4, batch=1) | ~$0.22/MTok | ~$0.73/MTok | Model-dependent | ✅ | GPU utilization | Local | Não | N/A | https://markaicode.com/pricing/vllm-self-hosted-vs-cloud-api-cost-analysis |

**Notas:**
- Custo dominado por GPU compute hours
- Break-even: ~50M tokens/mês em single GPU
- Utilização crítica: 1 rps = 36.3x mais caro que saturação
- FP8 quantization: 1.5-1.8x throughput improvement
- Engines: vLLM (12.5K tok/s), SGLang (16.2K tok/s), LMDeploy (16.2K tok/s)

### OmniRoute (Gateway)

| Tipo | Provider | Preço | Contexto | Tool calling | Limite/quota | Retenção | Treinamento | DPA/enterprise | Fonte |
|---|---|---|---|---|---|---|---|---|---|
| Gateway local | OmniRoute | $0 | N/A | ✅ | ~1.53B tokens/mês free | Local | Não | N/A | https://github.com/diegosouzapw/OmniRoute |

**Notas:**
- Gateway gratuito e open-source
- 291 providers, 90+ free tiers
- RTK+Caveman compression: 15-95% economia de tokens
- MCP server com 104 tools
- Auto-fallback em milissegundos
- Providers free: Kiro, OpenCode Free, Pollinations, Qoder, Qwen, etc.

## Providers a comparar (resumo)

| Provider | Modelo principal | Preço input | Preço output | Melhor para |
|---|---|---|---|---|
| OpenAI | GPT-5.6 Terra | $2.00/MTok | $12.00/MTok | Balance custo/qualidade |
| Anthropic | Claude Sonnet 5 | $2.00/MTok | $10.00/MTok | Coding agentic, everyday |
| Google | Gemini 3.6 Flash | $1.50/MTok | $7.50/MTok | Price-performance |
| OpenRouter | Vários | Provider price | Provider price | Multi-provider routing |
| Ollama | Local | $0 | $0 | Privacy, local-first |
| vLLM | Self-hosted | ~$0.10/MTok | ~$0.13/MTok | Scale, cost optimization |
| OmniRoute | Gateway | $0 | $0 | Aggregation, free tiers |

## Métricas de decisão
Preço por tarefa bem-sucedida, taxa de tool-call válido, sucesso no benchmark, p95 de latência, falhas, privacidade e custo operacional total.

## Não fazer
Não gravar chaves API, tokens OAuth ou conteúdo de repositórios neste snapshot.
