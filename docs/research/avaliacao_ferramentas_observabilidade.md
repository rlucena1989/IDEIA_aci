# Avaliação de Ferramentas de Observabilidade

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de observabilidade para sistemas de LLM e agentes

## Visão geral

Observabilidade é crítica para sistemas de LLM em produção. As quatro principais ferramentas em 2026 são LangSmith, Langfuse, Helicone e Arize Phoenix, cada uma com diferentes abordagens e trade-offs.

## Comparativo de ferramentas

### LangSmith

**Vendor:** LangChain, Inc.  
**License:** Proprietary (SaaS-only, self-host enterprise tier)  
**Integration model:** SDK-native (LangChain/LangGraph), OTel, OpenAI wrapper  
**Framework affinity:** LangChain-first  
**Free tier:** Developer: 5k traces/mo, 14-day retention  
**Paid entry:** Plus $39/seat/mo + $2.50/1k overage  
**Latest funding:** Series B $125M, $1.25B valuation (Oct 2025)

**Prós:**
- Integração nativa com LangGraph (cada nó vira span automaticamente)
- Eval product forte (datasets, regression runs, LLM-as-judge)
- Prompt registry com versionamento
- Annotation queue para human review em escala
- Trace visualization mais detalhada para LangChain-native traces
- Graph state visualization em cada nó para LangGraph workflows

**Contras:**
- Cloud-only no free tier (self-host requer enterprise plan)
- Strong fit para LangChain stacks, menos para outros frameworks
- Pricing escala agressivamente em alto volume de traces
- Framework coupling alto

**Best for:** LangGraph teams que precisam de evals estruturados

**Implementação:**
```python
from langsmith import LangSmith
from langchain_openai import ChatOpenAI

# Inicializar LangSmith
langsmith = LangSmith(
    api_key="your-api-key",
    project_name="my-project"
)

# Criar LLM com tracing
llm = ChatOpenAI(
    model="gpt-4o",
    callbacks=[langsmith.get_callback_handler()]
)

# Executar
response = llm.invoke("Hello")
```

### Langfuse

**Vendor:** ClickHouse (adquirido Jan 2026)  
**License:** MIT (true OSS)  
**Integration model:** OpenTelemetry + SDKs (Python, JS, Go)  
**Framework affinity:** Framework-agnostic  
**Free tier:** Hobby: 50k units/mo  
**Paid entry:** Core $29/mo, Pro $199/mo  
**Latest funding:** Adquirido por ClickHouse ($400M Series D)

**Prós:**
- Open source (MIT) com self-hosting first-class
- Framework-agnostic (funciona com LangGraph, OpenAI Agents SDK, CrewAI, AutoGen)
- Eval suite forte (datasets, LLM-as-judge, programmatic evals)
- Prompt management com versionamento
- Generous free tier (50K events/month)
- Self-hosting gratuito (paga apenas infra)
- v3 release: ClickHouse analytics, prompt experiments, Datasets v2

**Contras:**
- Cloud UX ligeiramente menos polida que LangSmith
- Multi-modal traces (vision, audio) ainda maturando
- Roadmap influenciado por ClickHouse (analytics depth over agent-UX depth)

**Best for:** Framework-agnostic, self-host, cost-sensitive at scale

**Implementação:**
```python
from langfuse import Langfuse
from langfuse.decorators import observe

langfuse = Langfuse(
    public_key="your-public-key",
    secret_key="your-secret-key"
)

@observe()
def my_function(input_text):
    # Função a ser observada
    return process(input_text)

# Executar
result = my_function("Hello")
langfuse.flush()
```

### Helicone

**Vendor:** Mintlify (adquirido Mar 2026)  
**License:** Apache 2.0 (OSS, maintenance mode)  
**Integration model:** HTTP proxy + AI gateway  
**Framework affinity:** Framework-agnostic  
**Free tier:** 10k requests/mo  
**Paid entry:** Pro $79/mo  
**Latest funding:** Adquirido por Mintlify (Mar 2026)

**Prós:**
- Setup mais fácil (drop-in HTTP proxy)
- Excellent cost dashboards out of the box
- Caching layer pode reduzir model spend 20-60%
- Rate-limiting e request hedging built-in
- Zero-code instrumentation (mudar base URL)
- Strong para pure-LLM workloads

**Contras:**
- **Em maintenance mode** (roadmap desacelerou após aquisição)
- Proxy-based architecture adiciona 5-30ms por call
- Vê apenas camada HTTP, não chain de raciocínio do agente
- Não recomendado para compromissos estratégicos de longo prazo

**Best for:** Drop-in lightweight, cost visibility imediata

**Implementação:**
```python
from openai import OpenAI

# Mudar base URL para Helicone
client = OpenAI(
    api_key="your-openai-key",
    base_url="https://oai.helicone.ai/v1",
    default_headers={
        "Helicone-Auth": "Bearer your-helicone-key"
    }
)

# Executar
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Arize Phoenix

**Vendor:** Arize AI  
**License:** Elastic License 2.0 (source-available)  
**Integration model:** SDK / OpenTelemetry  
**Framework affinity:** LlamaIndex, LangChain, DSPy  
**Free tier:** Phoenix self-host free; AX Free 25k spans/mo  
**Paid entry:** AX Pro $50/mo (50k spans, 10GB)  
**Latest funding:** Series C $70M (2024)

**Prós:**
- OTel-native com vendor-neutral tracing layer
- RAG evaluation capabilities mais fortes (precision, recall, NDCG)
- OpenTelemetry instrumentation funciona cross-frameworks
- Self-host gratuito (Elastic License 2.0)
- Phoenix Evals é a eval library open source mais madura
- Melhor para document-centric agents onde retrieval correctness é o primary failure mode

**Contras:**
- RAG features mais tight com LlamaIndex
- Framework coupling médio
- Cloud tier separada (Arize AX)

**Best for:** OTel-purist, LlamaIndex-heavy, regulated industries

**Implementação:**
```python
from openinference.instrumentation.openai import OpenAIInstrumentor
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from arize import Arize

# Configurar OTel
provider = TracerProvider()
processor = SimpleSpanProcessor()
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Instrumentar OpenAI
OpenAIInstrumentor().instrument()

# Configurar Arize
arize = Arize(
    api_key="your-api-key",
    space_key="your-space-key"
)
```

### Langtrace

**Vendor:** Scale3 Labs  
**License:** AGPL-3.0 (server), Apache-2.0 (SDK)  
**Integration model:** OpenTelemetry + SDKs (Python, TypeScript)  
**Framework affinity:** Framework-agnostic  
**Free tier:** 50K spans/mo  
**Paid entry:** $39/user/mo + $0.005/additional span  
**Latest funding:** Privately held (2024)

**Prós:**
- OpenTelemetry-native (OTLP traces exportáveis para qualquer backend)
- Auto-instrumentação para 8+ providers (OpenAI, Anthropic, Gemini, Cohere, Groq, Mistral, Perplexity, Ollama)
- Suporta 10+ frameworks (LangChain, LlamaIndex, LangGraph, CrewAI, DSPy, AutoGen)
- Self-hostable com Docker Compose
- Cost tracking per model e session
- Integrated evaluation e dataset workflows
- SOC2 Type II certified

**Contras:**
- AGPL license no server pode ser problema para empresas
- Eval tooling menos maduro que especialistas
- Ecosystem menor que Langfuse

**Best for:** OTel-native, framework-agnostic, self-host com data sovereignty

**Implementação:**
```python
from langtrace import Langtrace

# Inicializar Langtrace
langtrace = Langtrace(
    api_key="your-api-key",
    project_name="my-project"
)

# Auto-instrumentação (OpenAI, Anthropic, etc.)
langtrace.init()

# Executar
response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Spanlens

**Vendor:** Spanlens  
**License:** MIT (true OSS)  
**Integration model:** Drop-in proxy + SDK + OpenTelemetry  
**Framework affinity:** Framework-agnostic  
**Free tier:** 50K req/mo  
**Paid entry:** $149/mo (1M req/mo)  
**Latest funding:** Privately held (2026)

**Prós:**
- MIT license (true open-source)
- Drop-in proxy (1 linha de código: mudar base URL)
- Agent tracing com critical path highlighting
- PII detection e prompt-injection scan
- Model recommendations com dollar-figure savings
- OpenTelemetry support (OTLP/HTTP ingest e export)
- Self-hostable com Docker one-liner
- LLM-as-judge evals integrados

**Contras:**
- Projeto mais recente (abril 2026)
- Ecosystem menor
- Menos features que Langfuse

**Best for:** Drop-in lightweight, PII detection, model recommendations

**Implementação:**
```python
from openai import OpenAI

# Drop-in proxy - mudar base URL
client = OpenAI(
    api_key="your-openai-key",
    base_url="https://api.spanlens.io/v1",
    default_headers={
        "X-Spanlens-Key": "your-spanlens-key"
    }
)

# Executar
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

## Comparativo detalhado

| Metric | LangSmith | Langfuse | Helicone | Arize Phoenix | Langtrace | Spanlens |
|---|---|---|---|---|---|---|
| Vendor | LangChain, Inc. | ClickHouse | Mintlify | Arize AI | Scale3 Labs | Spanlens |
| License | Proprietary | MIT (true OSS) | Apache 2.0 (maintenance) | Elastic License 2.0 | AGPL-3.0 (server) | MIT (true OSS) |
| Self-host | Enterprise tier only | Free + production-ready | Helm (slowed roadmap) | Free, full parity | Docker Compose | Docker one-liner |
| Integration model | SDK-native, OTel | OpenTelemetry + SDKs | HTTP proxy + AI gateway | SDK / OpenTelemetry | OpenTelemetry + SDKs | Proxy + SDK + OTel |
| Framework affinity | LangChain-first | Framework-agnostic | Framework-agnostic | LlamaIndex, LangChain, DSPy | Framework-agnostic | Framework-agnostic |
| Free tier | 5k traces/mo | 50k events/mo | 10k requests/mo | Phoenix free; 25k spans/mo | 50K spans/mo | 50K req/mo |
| Paid entry | $39/seat/mo + usage | $29/mo (Core), $199/mo (Pro) | $79/mo | $50/mo (AX Pro) | $39/user/mo + usage | $149/mo (1M req) |
| Setup time | 5 min | 10 min (cloud), 30 min (self-host) | 1 min | 15-30 min | 10 min | 2 min |
| Framework lock-in | High (LangChain) | None | None | Medium (OTel) | None | None |
| Eval features | Strong (built in) | Strong (LLM-as-judge + datasets) | Light (added 2025) | Strong (ML-flavored) | Medium | Medium |
| Framework coupling | High | Low | None | Medium | Low | Low |
| PII detection | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Agent tracing | ✅ | ✅ | ⚠️ limited | ✅ | ✅ | ✅ (critical path) |
| OTel-native | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |

## OpenTelemetry para LLM

### Semantic conventions GenAI

OpenTelemetry GenAI semantic conventions padronizam como operações LLM são registradas:

| Attribute | Example |
|---|---|
| `gen_ai.operation.name` | `chat`, `execute_tool`, `invoke_agent`, `embeddings` |
| `gen_ai.provider.name` | `openai`, `anthropic`, `aws.bedrock` |
| `gen_ai.request.model` | `gpt-4o-mini` |
| `gen_ai.usage.input_tokens` | `412` |
| `gen_ai.usage.output_tokens` | `96` |
| `gen_ai.response.finish_reasons` | `["stop"]`, `["tool_calls"]` |
| `gen_ai.agent.name` | `travel-concierge` |
| `gen_ai.tool.name` | `get_weather` |

### Auto-instrumentation

**OpenAI:**
```python
from opentelemetry.instrumentation.openai_v2 import OpenAIInstrumentor

OpenAIInstrumentor().instrument()
```

**Anthropic:**
```python
from opentelemetry.instrumentation.anthropic import AnthropicInstrumentor

AnthropicInstrumentor().instrument()
```

**LangChain:**
```python
from opentelemetry.instrumentation.langchain import LangChainInstrumentor

LangChainInstrumentor().instrument()
```

### Manual instrumentation

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def retrieve_and_rerank(query: str):
    with tracer.start_as_current_span("retrieval") as span:
        span.set_attribute("retrieval.query", query)
        span.set_attribute("retrieval.system", "qdrant")
        hits = vector_db.search(query, k=50)
        span.set_attribute("retrieval.hits_count", len(hits))

    with tracer.start_as_current_span("rerank") as span:
        span.set_attribute("rerank.model", "bge-reranker-v2-m3")
        reranked = reranker.rerank(query, hits)[:5]

    return reranked
```

## Métricas de custo e latência

### Métricas de custo

**Token tracking:**
- **Input tokens:** Tokens enviados para o modelo (incluindo prompt cache hits)
- **Output tokens:** Tokens gerados pelo modelo
- **Cache read tokens:** Tokens recuperados do cache (Anthropic, OpenAI)
- **Cache creation tokens:** Tokens armazenados no cache
- **Total tokens:** Input + Output (sem cache hits)

**Cálculo de custo por provider:**
```python
COST_PER_MILLION_TOKENS = {
    "openai": {
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    },
    "anthropic": {
        "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
        "claude-3-5-haiku": {"input": 0.80, "output": 4.00},
    },
    "deepseek": {
        "deepseek-chat": {"input": 0.14, "output": 0.28},
        "deepseek-coder": {"input": 0.14, "output": 0.28},
    },
}

def calculate_cost(provider: str, model: str, input_tokens: int, output_tokens: int, cache_read_tokens: int = 0) -> float:
    """Calcula custo considerando cache discounts"""
    pricing = COST_PER_MILLION_TOKENS[provider][model]
    
    # Cache tokens são cobrados com desconto (tipicamente 90% off)
    cache_cost = (cache_read_tokens / 1_000_000) * pricing["input"] * 0.1
    input_cost = ((input_tokens - cache_read_tokens) / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return cache_cost + input_cost + output_cost
```

**Métricas de custo agregadas:**
- **Cost per request:** Custo médio por requisição
- **Cost per user:** Custo agregado por usuário/session
- **Cost per feature:** Custo por feature específica
- **Cache savings:** Economia total com cache (cache tokens * 90% discount)
- **Cost per 1K tokens:** Custo normalizado por 1K tokens

### Métricas de latência

**Latência breakdown:**
- **TTFT (Time to First Token):** Tempo até o primeiro token gerado
- **Total latency:** Tempo total da requisição
- **Network latency:** Latência de rede (provider)
- **Processing latency:** Latência de processamento do modelo
- **Overhead latency:** Latência de middleware (proxy, tracing)

**Percentiles críticos:**
- **P50:** Mediana (50% das requisições)
- **P90:** 90% das requisições (SLA comum)
- **P95:** 95% das requisições (SLA estrito)
- **P99:** 99% das requisições (outliers críticos)

**Implementação de tracking:**
```python
import time
from typing import TypedDict

class LatencyMetrics(TypedDict):
    ttft_ms: float
    total_latency_ms: float
    network_latency_ms: float
    processing_latency_ms: float
    overhead_latency_ms: float

def track_latency(request_start: float, first_token_time: float, request_end: float, network_time: float) -> LatencyMetrics:
    """Calcula métricas de latência"""
    ttft_ms = (first_token_time - request_start) * 1000
    total_latency_ms = (request_end - request_start) * 1000
    network_latency_ms = network_time * 1000
    processing_latency_ms = (request_end - first_token_time) * 1000
    overhead_latency_ms = total_latency_ms - network_latency_ms - processing_latency_ms
    
    return {
        "ttft_ms": ttft_ms,
        "total_latency_ms": total_latency_ms,
        "network_latency_ms": network_latency_ms,
        "processing_latency_ms": processing_latency_ms,
        "overhead_latency_ms": overhead_latency_ms
    }
```

### Alertas de custo e latência

**Thresholds recomendados:**
```python
ALERT_THRESHOLDS = {
    "cost": {
        "warning": {"daily_budget": 0.8, "per_request": 0.10},
        "critical": {"daily_budget": 0.95, "per_request": 0.50}
    },
    "latency": {
        "warning": {"p95": 5000, "p99": 10000},
        "critical": {"p95": 10000, "p99": 20000}
    },
    "error_rate": {
        "warning": 0.05,  # 5%
        "critical": 0.10  # 10%
    }
}

def check_alerts(metrics: dict, thresholds: dict) -> list[dict]:
    """Verifica se métricas excedem thresholds"""
    alerts = []
    
    # Check cost
    if metrics["daily_cost"] > thresholds["cost"]["critical"]["daily_budget"] * metrics["daily_budget_limit"]:
        alerts.append({
            "severity": "critical",
            "metric": "daily_cost",
            "value": metrics["daily_cost"],
            "threshold": thresholds["cost"]["critical"]["daily_budget"] * metrics["daily_budget_limit"]
        })
    
    # Check latency
    if metrics["p95_latency"] > thresholds["latency"]["critical"]["p95"]:
        alerts.append({
            "severity": "critical",
            "metric": "p95_latency",
            "value": metrics["p95_latency"],
            "threshold": thresholds["latency"]["critical"]["p95"]
        })
    
    # Check error rate
    if metrics["error_rate"] > thresholds["error_rate"]["critical"]:
        alerts.append({
            "severity": "critical",
            "metric": "error_rate",
            "value": metrics["error_rate"],
            "threshold": thresholds["error_rate"]["critical"]
        })
    
    return alerts
```

### Dashboard de métricas

**KPIs essenciais:**
- **Total cost (daily/weekly/monthly):** Custo total por período
- **Cost per 1K tokens:** Custo normalizado
- **Cache hit rate:** % de tokens recuperados do cache
- **P50/P90/P95/P99 latency:** Distribuição de latência
- **Error rate:** Taxa de erro por período
- **Cost per model:** Custo por modelo (para routing decisions)

**Implementação com Grafana:**
```python
from prometheus_client import Counter, Histogram, Gauge

# Métricas de custo
cost_total = Counter(
    'llm_cost_total_dollars',
    'Total cost in dollars',
    ['model', 'provider', 'feature']
)

cache_savings = Counter(
    'llm_cache_savings_dollars',
    'Cache savings in dollars',
    ['model', 'provider']
)

# Métricas de latência
latency_total = Histogram(
    'llm_request_latency_seconds',
    'Total request latency',
    ['model', 'provider'],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0)
)

latency_ttft = Histogram(
    'llm_ttft_seconds',
    'Time to first token',
    ['model', 'provider'],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

# Métricas de erro
error_rate = Gauge(
    'llm_error_rate',
    'Error rate',
    ['model', 'provider', 'error_type']
)
```

## Recomendações

### Para LangChain/LangGraph teams
**Recomendado:** LangSmith
- Integração nativa zero friction
- Graph state visualization
- Eval workflows estruturados
- Deployments verificados em produção

### Para framework-agnostic
**Recomendado:** Langfuse
- True open-source com self-hosting
- Framework-agnostic
- Generous free tier
- Eval suite forte

### Para zero-code instrumentation
**Recomendado:** Helicone (com ressalvas)
- Setup mais fácil (1 min)
- Cost tracking excelente
- **Em maintenance mode** - não usar para roadmap estratégico

### Para OTel-purist
**Recomendado:** Arize Phoenix
- OTel-native
- RAG evaluation capabilities mais fortes
- Self-host gratuito
- Vendor-neutral

### Para regulated industries
**Recomendado:** Langfuse ou Phoenix
- Self-hosting com data ownership
- Langfuse: true open-source (MIT)
- Phoenix: OTel-native com vendor-neutral

## Próximos passos

1. **Escolher ferramenta:** Selecionar baseado em framework e requisitos
2. **Implementar instrumentação:** Usar SDK ou OTel
3. **Configurar alerts:** Configurar alertas de custo e latência
4. **Implementar evals:** Adicionar evals LLM-as-judge
5. **Monitorar produção:** Track tokens, latency, cost, errors
6. **Optimizar:** Usar dados para optimizar prompts e routing

## Referências

- LangSmith: https://www.langchain.com/langsmith/observability
- Langfuse: https://langfuse.com/
- Helicone: https://www.helicone.ai/
- Arize Phoenix: https://docs.arize.com/phoenix
- Langtrace: https://langtrace.ai/
- Spanlens: https://www.spanlens.io/
- OpenTelemetry GenAI: https://opentelemetry.io/docs/specs/semconv/gen-ai/
