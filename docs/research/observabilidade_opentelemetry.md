# Observabilidade com OpenTelemetry

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar observabilidade com OpenTelemetry baseado em gaps competitivos

## Visão Geral

Observabilidade é crítica para sistemas de LLM em produção. LangSmith, Langfuse, Helicone e Arize Phoenix são as principais ferramentas. IDEIA_aci precisa de observabilidade com OpenTelemetry para vendor-agnostic, distributed tracing, metrics, logs e custom spans.

## Arquitetura de Observabilidade

### Componentes

```
┌─────────────────────────────────────┐
│   OpenTelemetry SDK                 │  ← Instrumentação
├─────────────────────────────────────┤
│   OpenTelemetry Collector          │  ← Coleta de dados
├─────────────────────────────────────┤
│   Trace Exporter                    │  ← Export de traces
├─────────────────────────────────────┤
│   Metrics Exporter                  │  ← Export de métricas
├─────────────────────────────────────┤
│   Log Exporter                      │  ← Export de logs
└─────────────────────────────────────┘
```

## Gap 1: Distributed Tracing

### Conceito

Tracing distribuído para rastrear requisições através de múltiplos serviços. Diferente de tracing local, distributed tracing permite rastrear requisições end-to-end.

### Dependências

```python
pip install opentelemetry-api opentelemetry-sdk
```

### Implementação com OpenTelemetry

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar OpenTelemetry
resource = Resource.create({
    "service.name": "ideia_aci",
    "service.version": "1.0.0",
    "deployment.environment": "production"
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(ConsoleSpanExporter())
provider.add_span_processor(processor)

trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

def llm_call(model: str, prompt: str):
    """Chamada de LLM com tracing"""
    with tracer.start_as_current_span("llm_call") as span:
        # Adicionar atributos ao span
        span.set_attribute("llm.model", model)
        span.set_attribute("llm.prompt_length", len(prompt))
        span.set_attribute("llm.provider", "openai")
        
        logger.info(f"Calling LLM {model}")
        
        # Simular chamada LLM
        response = f"Response from {model}"
        
        span.set_attribute("llm.response_length", len(response))
        span.set_attribute("llm.success", True)
        
        return response

def agent_task(task: str):
    """Tarefa de agente com tracing"""
    with tracer.start_as_current_span("agent_task") as span:
        span.set_attribute("agent.task", task)
        span.set_attribute("agent.type", "code_generator")
        
        logger.info(f"Executing task: {task}")
        
        # Chamar LLM
        response = llm_call("gpt-4o", task)
        
        span.set_attribute("agent.result", response)
        
        return response

# Uso
result = agent_task("Generate a REST API endpoint")
print(f"Result: {result}")
```

## Gap 2: Custom Spans for Agents

### Conceito

Spans customizados para rastrear execução de agentes específicos. Diferente de spans genéricos, custom spans permitem granularidade.

### Implementação com Custom Spans

```python
from opentelemetry import trace
from typing import Dict, Any

tracer = trace.get_tracer(__name__)

class AgentSpan:
    """Span customizado para agentes"""
    
    def __init__(self, agent_id: str, task: str):
        self.agent_id = agent_id
        self.task = task
        self.span = tracer.start_span(f"agent_{agent_id}")
    
    def __enter__(self):
        self.span.set_attribute("agent.id", self.agent_id)
        self.span.set_attribute("agent.task", self.task)
        self.span.set_attribute("agent.start_time", time.time())
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.span.set_attribute("agent.end_time", time.time())
        self.span.set_attribute("agent.duration", time.time() - self.span.get_attribute("agent.start_time"))
        
        if exc_type is not None:
            self.span.set_attribute("agent.error", str(exc_val))
            self.span.set_status(trace.Status(trace.StatusCode.ERROR, str(exc_val)))
        else:
            self.span.set_attribute("agent.success", True)
            self.span.set_status(trace.Status(trace.StatusCode.OK))
        
        self.span.end()

def agent_workflow(agent_id: str, task: str):
    """Workflow de agente com custom spans"""
    with AgentSpan(agent_id, task) as span:
        # Sub-span para decomposição
        with tracer.start_span("decompose_task") as decompose_span:
            decompose_span.set_attribute("task.complexity", 0.8)
            subtasks = ["subtask_1", "subtask_2"]
        
        # Sub-span para cada subtarefa
        for subtask in subtasks:
            with tracer.start_span("execute_subtask") as subtask_span:
                subtask_span.set_attribute("subtask.id", subtask)
                # Executar subtarefa
                time.sleep(0.1)
        
        # Sub-span para agregação
        with tracer.start_span("aggregate_results") as aggregate_span:
            aggregate_span.set_attribute("results.count", len(subtasks))
            result = "aggregated_result"
        
        return result

# Uso
result = agent_workflow("agent_1", "Analyze codebase")
print(f"Result: {result}")
```

## Gap 3: Metrics Collection

### Conceito

Coleta de métricas específicas para LLMs e agentes. Diferente de métricas genéricas, custom metrics permitem monitoramento específico.

### Implementação com Metrics

```python
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.metrics import Counter, Histogram

# Configurar metrics provider
metric_reader = PeriodicExportingMetricReader(ConsoleMetricExporter())
meter_provider = MeterProvider(metric_readers=[metric_reader])
metrics.set_meter_provider(meter_provider)

meter = metrics.get_meter(__name__)

# Criar métricas customizadas
llm_call_counter = meter.create_counter(
    name="llm_calls_total",
    description="Total number of LLM calls",
    unit="1"
)

llm_latency_histogram = meter.create_histogram(
    name="llm_latency_seconds",
    description="LLM call latency",
    unit="s"
)

agent_task_counter = meter.create_counter(
    name="agent_tasks_total",
    description="Total number of agent tasks",
    unit="1"
)

agent_success_counter = meter.create_counter(
    name="agent_tasks_success_total",
    description="Total number of successful agent tasks",
    unit="1"
)

def track_llm_call(model: str, latency: float, success: bool):
    """Rastreia chamada LLM"""
    llm_call_counter.add(1, {"model": model, "success": str(success)})
    llm_latency_histogram.record(latency, {"model": model})

def track_agent_task(agent_id: str, success: bool):
    """Rastreia tarefa de agente"""
    agent_task_counter.add(1, {"agent_id": agent_id})
    if success:
        agent_success_counter.add(1, {"agent_id": agent_id})

# Uso
track_llm_call("gpt-4o", 2.5, True)
track_agent_task("agent_1", True)
```

## Gap 4: Log Correlation

### Conceito

Correlação de logs com traces. Diferente de logs isolados, log correlation permite conectar logs com spans.

### Implementação com Log Correlation

```python
from opentelemetry import trace
import logging

# Configurar logging com trace context
class TraceContextFilter(logging.Filter):
    """Filter para adicionar trace context aos logs"""
    
    def filter(self, record):
        current_span = trace.get_current_span()
        
        if current_span.is_recording():
            record.trace_id = format(current_span.context.trace_id, '032x')
            record.span_id = format(current_span.context.span_id, '032x')
        else:
            record.trace_id = "N/A"
            record.span_id = "N/A"
        
        return True

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - trace_id=%(trace_id)s - span_id=%(span_id)s - %(message)s'))
handler.addFilter(TraceContextFilter())
logger.addHandler(handler)

def logged_function():
    """Função com logging correlacionado"""
    logger.info("Starting function")
    # Lógica aqui
    logger.info("Function completed")

# Uso com span
with tracer.start_as_current_span("logged_operation"):
    logged_function()
```

## Recomendações de Implementação

### Para MVP
1. **Distributed tracing básico:** Implementar com OpenTelemetry SDK
2. **Custom spans básico:** Implementar spans para agentes principais
3. **Metrics básico:** Implementar contadores e histograms

### Para Produção
1. **Distributed tracing avançado:** Implementar com OTel Collector, Jaeger/Tempo
2. **Custom spans avançado:** Implementar spans granulares para todas as operações
3. **Metrics avançado:** Implementar com Prometheus, Grafana
4. **Log correlation:** Implementar com trace context em todos os logs

## Integração com IDEIA-master

Os packages do IDEIA-master relevantes:
- `langgraph-observability`: Para observabilidade específica de LangGraph
- `langgraph-tracing`: Para tracing de LangGraph
- `observability`: Para observabilidade geral
- `observability-engine`: Para engine de observabilidade

## Referências

- OpenTelemetry: https://opentelemetry.io/
- OpenTelemetry Python: https://opentelemetry.io/docs/instrumentation/python/
- Jaeger: https://www.jaegertracing.io/
- Tempo: https://grafana.com/oss/tempo/
- Prometheus: https://prometheus.io/
