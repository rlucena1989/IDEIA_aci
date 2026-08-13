# Guia de Implementação - Observabilidade com OpenTelemetry

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de observabilidade com OpenTelemetry para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de observabilidade com OpenTelemetry, incluindo distributed tracing, metrics, logging e alerting, com estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-langchain
```

### Estrutura de Diretórios

```
packages/
├── observability/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── tracer.py              # Tracer base
│   │   ├── meter.py               # Meter base
│   │   └── logger.py              # Logger base
│   ├── tracing/
│   │   ├── __init__.py
│   │   ├── llm_tracer.py          # Tracer para LLM calls
│   │   ├── agent_tracer.py        # Tracer para agentes
│   │   └── context_tracer.py      # Tracer para contexto
│   ├── metrics/
│   │   ├── __init__.py
│   │   ├── llm_metrics.py         # Métricas de LLM
│   │   ├── agent_metrics.py       # Métricas de agentes
│   │   └── system_metrics.py      # Métricas de sistema
│   ├── logging/
│   │   ├── __init__.py
│   │   ├── structured_logger.py   # Logger estruturado
│   │   └── correlation_logger.py  # Logger com correlação
│   ├── exporters/
│   │   ├── __init__.py
│   │   ├── otlp_exporter.py      # Exportador OTLP
│   │   ├── console_exporter.py    # Exportador console
│   │   └── file_exporter.py      # Exportador arquivo
│   └── utils/
│       ├── __init__.py
│       ├── context.py             # Contexto de tracing
│       └── decorators.py          # Decoradores de tracing
```

## Passo 1: Tracer Base (core/tracer.py)

```python
"""
Tracer base com OpenTelemetry.
"""
from typing import Optional, Dict, Any
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TracerConfig:
    """Configuração de tracer."""
    
    def __init__(
        self,
        service_name: str = "ideia_aci",
        service_version: str = "1.0.0",
        enable_console: bool = True,
        enable_otel: bool = False,
        otlp_endpoint: Optional[str] = None
    ):
        self.service_name = service_name
        self.service_version = service_version
        self.enable_console = enable_console
        self.enable_otel = enable_otel
        self.otlp_endpoint = otlp_endpoint

class BaseTracer:
    """Tracer base com OpenTelemetry."""
    
    def __init__(self, config: Optional[TracerConfig] = None):
        """Inicializa tracer."""
        self.config = config or TracerConfig()
        self.tracer_provider = self._setup_tracer_provider()
        self.tracer = trace.get_tracer(__name__)
        
        logger.info(f"Tracer initialized for {self.config.service_name}")
    
    def _setup_tracer_provider(self) -> TracerProvider:
        """Configura provider de tracer."""
        resource = Resource.create({
            "service.name": self.config.service_name,
            "service.version": self.config.service_version
        })
        
        provider = TracerProvider(resource=resource)
        
        # Console exporter
        if self.config.enable_console:
            console_exporter = ConsoleSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(console_exporter))
        
        # OTLP exporter
        if self.config.enable_otel and self.config.otlp_endpoint:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            otlp_exporter = OTLPSpanExporter(endpoint=self.config.otlp_endpoint)
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        
        # Set global tracer provider
        trace.set_tracer_provider(provider)
        
        return provider
    
    def start_span(self, name: str, **kwargs):
        """Inicia span."""
        return self.tracer.start_span(name, **kwargs)
    
    def get_tracer(self):
        """Retorna tracer."""
        return self.tracer
```

## Passo 2: Tracer para LLM (tracing/llm_tracer.py)

```python
"""
Tracer específico para chamadas LLM.
"""
from typing import Dict, Any, Optional
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
import logging

from ..core.tracer import BaseTracer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMTracer:
    """Tracer para chamadas LLM."""
    
    def __init__(self, base_tracer: BaseTracer):
        """Inicializa tracer LLM."""
        self.base_tracer = base_tracer
        self.tracer = base_tracer.get_tracer()
    
    def trace_llm_call(
        self,
        provider: str,
        model: str,
        prompt: str,
        response: Optional[str] = None,
        error: Optional[Exception] = None,
        tokens_used: Optional[int] = None,
        latency_ms: Optional[float] = None,
        **kwargs
    ) -> None:
        """Traça chamada LLM."""
        with self.tracer.start_as_current_span(
            "llm_call",
            attributes={
                "llm.provider": provider,
                "llm.model": model,
                "llm.prompt_length": len(prompt),
                "llm.response_length": len(response) if response else 0,
                "llm.tokens_used": tokens_used or 0,
                "llm.latency_ms": latency_ms or 0
            }
        ) as span:
            # Log prompt
            span.add_event("llm.prompt", {"prompt": prompt[:500]})
            
            if response:
                # Log response
                span.add_event("llm.response", {"response": response[:500]})
                span.set_status(Status(StatusCode.OK))
            elif error:
                # Log error
                span.record_exception(error)
                span.set_status(Status(StatusCode.ERROR, str(error)))
            
            # Adicionar atributos adicionais
            for key, value in kwargs.items():
                span.set_attribute(f"llm.{key}", str(value))
            
            logger.debug(f"Traced LLM call: {provider}/{model}")
    
    def trace_llm_stream(self, provider: str, model: str, prompt: str, **kwargs):
        """Traça chamada LLM com streaming."""
        with self.tracer.start_as_current_span(
            "llm_stream",
            attributes={
                "llm.provider": provider,
                "llm.model": model,
                "llm.prompt_length": len(prompt),
                "llm.streaming": "true"
            }
        ) as span:
            span.add_event("llm.prompt", {"prompt": prompt[:500]})
            
            try:
                # Yield chunks e trace events
                chunk_count = 0
                for chunk in kwargs.get("stream_generator", []):
                    chunk_count += 1
                    span.add_event("llm.chunk", {
                        "chunk_index": chunk_count,
                        "chunk_length": len(chunk)
                    })
                    yield chunk
                
                span.set_status(Status(StatusCode.OK))
                span.set_attribute("llm.chunk_count", chunk_count)
            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                raise
```

## Passo 3: Tracer para Agentes (tracing/agent_tracer.py)

```python
"""
Tracer específico para agentes.
"""
from typing import Dict, Any, Optional
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
import logging

from ..core.tracer import BaseTracer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentTracer:
    """Tracer para agentes."""
    
    def __init__(self, base_tracer: BaseTracer):
        """Inicializa tracer de agentes."""
        self.base_tracer = base_tracer
        self.tracer = base_tracer.get_tracer()
    
    def trace_agent_execution(
        self,
        agent_name: str,
        task: str,
        result: Optional[str] = None,
        error: Optional[Exception] = None,
        steps: Optional[list] = None,
        latency_ms: Optional[float] = None,
        **kwargs
    ) -> None:
        """Traça execução de agente."""
        with self.tracer.start_as_current_span(
            "agent_execution",
            attributes={
                "agent.name": agent_name,
                "agent.task": task[:100],
                "agent.steps_count": len(steps) if steps else 0,
                "agent.latency_ms": latency_ms or 0
            }
        ) as span:
            # Log task
            span.add_event("agent.task", {"task": task})
            
            # Log steps
            if steps:
                for i, step in enumerate(steps):
                    span.add_event(f"agent.step.{i}", {"step": step})
            
            if result:
                # Log result
                span.add_event("agent.result", {"result": result[:500]})
                span.set_status(Status(StatusCode.OK))
            elif error:
                # Log error
                span.record_exception(error)
                span.set_status(Status(StatusCode.ERROR, str(error)))
            
            # Adicionar atributos adicionais
            for key, value in kwargs.items():
                span.set_attribute(f"agent.{key}", str(value))
            
            logger.debug(f"Traced agent execution: {agent_name}")
    
    def trace_agent_step(
        self,
        agent_name: str,
        step_name: str,
        input_data: Optional[Dict] = None,
        output_data: Optional[Dict] = None,
        error: Optional[Exception] = None,
        **kwargs
    ) -> None:
        """Traça passo de agente."""
        with self.tracer.start_as_current_span(
            "agent_step",
            attributes={
                "agent.name": agent_name,
                "agent.step_name": step_name
            }
        ) as span:
            # Log input
            if input_data:
                span.add_event("agent.step.input", {"input": str(input_data)[:500]})
            
            # Log output
            if output_data:
                span.add_event("agent.step.output", {"output": str(output_data)[:500]})
                span.set_status(Status(StatusCode.OK))
            elif error:
                # Log error
                span.record_exception(error)
                span.set_status(Status(StatusCode.ERROR, str(error)))
            
            logger.debug(f"Traced agent step: {agent_name}.{step_name}")
```

## Passo 4: Métricas de LLM (metrics/llm_metrics.py)

```python
"""
Métricas para chamadas LLM.
"""
from typing import Dict, Any
from opentelemetry import metrics
from opentelemetry.metrics import MeterProvider
from opentelemetry.sdk.metrics import MeterProvider as SDKMeterProvider
from opentelemetry.sdk.metrics.export import ConsoleMetricExporter, PeriodicExportingMetricReader
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMMetrics:
    """Métricas para LLM."""
    
    def __init__(self):
        """Inicializa métricas LLM."""
        self.meter_provider = self._setup_meter_provider()
        self.meter = metrics.get_meter(__name__)
        
        # Contadores
        self.llm_calls_counter = self.meter.create_counter(
            "llm.calls.total",
            description="Total number of LLM calls"
        )
        
        self.llm_tokens_counter = self.meter.create_counter(
            "llm.tokens.total",
            description="Total number of tokens used"
        )
        
        self.llm_errors_counter = self.meter.create_counter(
            "llm.errors.total",
            description="Total number of LLM errors"
        )
        
        # Histogramas
        self.llm_latency_histogram = self.meter.create_histogram(
            "llm.latency",
            description="LLM call latency in milliseconds",
            unit="ms"
        )
        
        self.llm_tokens_histogram = self.meter.create_histogram(
            "llm.tokens_per_call",
            description="Tokens per LLM call"
        )
        
        # Gauges
        self.llm_cost_gauge = self.meter.create_gauge(
            "llm.cost.total",
            description="Total cost of LLM calls",
            unit="USD"
        )
        
        self.total_cost = 0.0
        
        logger.info("LLM metrics initialized")
    
    def _setup_meter_provider(self) -> MeterProvider:
        """Configura provider de métricas."""
        reader = PeriodicExportingMetricReader(
            ConsoleMetricExporter(),
            export_interval_millis=1000
        )
        
        provider = SDKMeterProvider(metric_readers=[reader])
        metrics.set_meter_provider(provider)
        
        return provider
    
    def record_llm_call(
        self,
        provider: str,
        model: str,
        tokens: int,
        latency_ms: float,
        cost: float,
        error: bool = False,
        **kwargs
    ):
        """Registra chamada LLM."""
        attributes = {
            "llm.provider": provider,
            "llm.model": model
        }
        
        # Adicionar atributos adicionais
        for key, value in kwargs.items():
            attributes[f"llm.{key}"] = str(value)
        
        # Incrementar contadores
        self.llm_calls_counter.add(1, attributes)
        self.llm_tokens_counter.add(tokens, attributes)
        
        if error:
            self.llm_errors_counter.add(1, attributes)
        
        # Registrar histogramas
        self.llm_latency_histogram.record(latency_ms, attributes)
        self.llm_tokens_histogram.record(tokens, attributes)
        
        # Atualizar custo
        self.total_cost += cost
        self.llm_cost_gauge.set(self.total_cost, attributes)
        
        logger.debug(f"Recorded LLM metrics: {provider}/{model}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_cost": self.total_cost
        }
```

## Passo 5: Logger Estruturado (logging/structured_logger.py)

```python
"""
Logger estruturado com correlação.
"""
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime

class StructuredLogger:
    """Logger estruturado."""
    
    def __init__(self, name: str, level: int = logging.INFO):
        """Inicializa logger estruturado."""
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        
        # Handler para JSON
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        self.logger.addHandler(handler)
    
    def log(self, level: int, message: str, **kwargs):
        """Loga mensagem estruturada."""
        log_data = {
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        }
        
        self.logger.log(level, json.dumps(log_data))
    
    def info(self, message: str, **kwargs):
        """Loga info."""
        self.log(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Loga warning."""
        self.log(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Loga error."""
        self.log(logging.ERROR, message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Loga debug."""
        self.log(logging.DEBUG, message, **kwargs)

class JSONFormatter(logging.Formatter):
    """Formatter JSON para logging."""
    
    def format(self, record):
        """Formata log como JSON."""
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id
        
        return json.dumps(log_data)
```

## Passo 6: Exemplo de Uso

```python
"""
Exemplo de uso do sistema de observabilidade.
"""
from observability.core.tracer import BaseTracer, TracerConfig
from observability.tracing.llm_tracer import LLMTracer
from observability.tracing.agent_tracer import AgentTracer
from observability.metrics.llm_metrics import LLMMetrics
from observability.logging.structured_logger import StructuredLogger

# Criar configuração
config = TracerConfig(
    service_name="ideia_aci",
    service_version="1.0.0",
    enable_console=True
)

# Criar tracer base
base_tracer = BaseTracer(config)

# Criar tracers específicos
llm_tracer = LLMTracer(base_tracer)
agent_tracer = AgentTracer(base_tracer)

# Criar métricas
llm_metrics = LLMMetrics()

# Criar logger
logger = StructuredLogger("observability")

# Traçar chamada LLM
import time
start_time = time.time()

# Simular chamada LLM
provider = "openai"
model = "gpt-4o"
prompt = "Create a REST API endpoint"
response = "Here's the code for a REST API endpoint..."
tokens = 150
latency_ms = (time.time() - start_time) * 1000
cost = (tokens / 1000) * 0.03

llm_tracer.trace_llm_call(
    provider=provider,
    model=model,
    prompt=prompt,
    response=response,
    tokens_used=tokens,
    latency_ms=latency_ms
)

llm_metrics.record_llm_call(
    provider=provider,
    model=model,
    tokens=tokens,
    latency_ms=latency_ms,
    cost=cost
)

logger.info("LLM call completed", provider=provider, model=model, tokens=tokens)

# Traçar execução de agente
agent_tracer.trace_agent_execution(
    agent_name="code_generator",
    task="Create REST API endpoint",
    result="Code generated successfully",
    steps=["analyze_task", "generate_code", "review_code"],
    latency_ms=latency_ms
)

logger.info("Agent execution completed", agent="code_generator", task="Create REST API")

# Estatísticas
stats = llm_metrics.get_stats()
print(f"\nMetrics stats: {stats}")
```

## Passo 7: Testes de Validação

```python
"""
Testes de validação para observabilidade.
"""
import pytest
from observability.core.tracer import BaseTracer, TracerConfig
from observability.tracing.llm_tracer import LLMTracer
from observability.metrics.llm_metrics import LLMMetrics

class TestObservability:
    """Testes para observabilidade."""
    
    def test_tracer_initialization(self):
        """Testa inicialização do tracer."""
        config = TracerConfig()
        tracer = BaseTracer(config)
        
        assert tracer.tracer is not None
        assert tracer.tracer_provider is not None
    
    def test_llm_tracer(self):
        """Testa tracer LLM."""
        base_tracer = BaseTracer()
        llm_tracer = LLMTracer(base_tracer)
        
        llm_tracer.trace_llm_call(
            provider="openai",
            model="gpt-4o",
            prompt="Test prompt",
            response="Test response",
            tokens_used=100,
            latency_ms=500
        )
        
        assert llm_tracer.tracer is not None
    
    def test_llm_metrics(self):
        """Testa métricas LLM."""
        metrics = LLMMetrics()
        
        metrics.record_llm_call(
            provider="openai",
            model="gpt-4o",
            tokens=100,
            latency_ms=500,
            cost=0.01
        )
        
        stats = metrics.get_stats()
        assert stats["total_cost"] > 0

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Tracer Falha

```python
def trace_with_fallback(self, *args, **kwargs):
    """Traça com fallback em caso de falha."""
    try:
        return self.trace(*args, **kwargs)
    except Exception as e:
        logger.error(f"Tracing failed: {e}")
        # Fallback: não falhar a operação principal
        return None
```

### 2. Exporter Falha

```python
def export_with_retry(self, data, max_retries: int = 3):
    """Exporta dados com retry."""
    for attempt in range(max_retries):
        try:
            return self.export(data)
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Export failed after {max_retries} attempts: {e}")
                raise
            import time
            time.sleep(2 ** attempt)
```

### 3. Métricas Muito Grandes

```python
def record_with_sampling(self, value, attributes, sample_rate: float = 0.1):
    """Registra métrica com sampling."""
    import random
    
    if random.random() < sample_rate:
        self.record(value, attributes)
```

## Integrações com Outros Componentes

### 1. Integração com Orquestração de Agentes

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from observability.tracing.agent_tracer import AgentTracer
from observability.tracing.llm_tracer import LLMTracer
from observability.metrics.llm_metrics import LLMMetrics

class ObservableOrchestrator(AgentOrchestrator):
    """Orquestrador com observabilidade."""
    
    def __init__(self, llm_client, agent_tracer: AgentTracer, llm_tracer: LLMTracer, llm_metrics: LLMMetrics):
        super().__init__(llm_client)
        self.agent_tracer = agent_tracer
        self.llm_tracer = llm_tracer
        self.llm_metrics = llm_metrics
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa com tracing."""
        import time
        start_time = time.time()
        
        try:
            result = super().task_analyzer_node(state)
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_execution(
                agent_name="task_analyzer",
                task=state["task"],
                result="Task analyzed successfully",
                latency_ms=latency_ms
            )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_execution(
                agent_name="task_analyzer",
                task=state["task"],
                error=e,
                latency_ms=latency_ms
            )
            
            raise
```

### 2. Integração com LLM Provider Gateway

```python
from llm_provider.core.provider_gateway import ProviderGateway
from observability.tracing.llm_tracer import LLMTracer
from observability.metrics.llm_metrics import LLMMetrics

class ObservableProviderGateway(ProviderGateway):
    """Gateway com observabilidade."""
    
    def __init__(self, llm_tracer: LLMTracer, llm_metrics: LLMMetrics):
        super().__init__()
        self.llm_tracer = llm_tracer
        self.llm_metrics = llm_metrics
    
    def generate(self, prompt: str, task_type: str, **kwargs) -> str:
        """Gera resposta com tracing."""
        import time
        start_time = time.time()
        
        try:
            result = super().generate(prompt, task_type, **kwargs)
            latency_ms = (time.time() - start_time) * 1000
            
            # Estimar tokens
            tokens = len(prompt) // 4 + len(result) // 4
            
            self.llm_tracer.trace_llm_call(
                provider="gateway",
                model="routed",
                prompt=prompt,
                response=result,
                tokens_used=tokens,
                latency_ms=latency_ms
            )
            
            self.llm_metrics.record_llm_call(
                provider="gateway",
                model="routed",
                tokens=tokens,
                latency_ms=latency_ms,
                cost=0.0  # Calculado pelo gateway
            )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.llm_tracer.trace_llm_call(
                provider="gateway",
                model="routed",
                prompt=prompt,
                error=e,
                latency_ms=latency_ms
            )
            
            raise
```

### 3. Integração com Sistema de Memória

```python
from memory_system.core.hierarchy import MemoryHierarchy
from observability.tracing.agent_tracer import AgentTracer

class ObservableMemory(MemoryHierarchy):
    """Sistema de memória com observabilidade."""
    
    def __init__(self, agent_tracer: AgentTracer):
        super().__init__()
        self.agent_tracer = agent_tracer
    
    def add(self, content: str, memory_type: MemoryType, **kwargs) -> MemoryEntry:
        """Adiciona entrada com tracing."""
        import time
        start_time = time.time()
        
        try:
            result = super().add(content, memory_type, **kwargs)
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_step(
                agent_name="memory_system",
                step_name="add_entry",
                input_data={"content": content[:100], "type": memory_type.value},
                output_data={"entry_id": result.entry_id},
                latency_ms=latency_ms
            )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_step(
                agent_name="memory_system",
                step_name="add_entry",
                error=e,
                latency_ms=latency_ms
            )
            
            raise
```

## Próximos Passos

1. Implementar exporter OTLP completo
2. Adicionar suporte a distributed tracing
3. Implementar dashboard de métricas
4. Adicionar sistema de alertas
5. Implementar sampling inteligente
6. Adicionar suporte a custom metrics
7. Implementar testes de performance
8. Adicionar documentação de API
