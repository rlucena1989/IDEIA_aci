# Avaliação de Ferramentas de Logging Estruturado

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de logging estruturado (Loguru, Structlog, Python logging) e recomendar a melhor opção

## Visão geral

Logging estruturado é essencial para sistemas de IA que precisam rastrear execuções, debugar problemas e monitorar performance. Diferentes ferramentas oferecem abordagens distintas para logging, com trade-offs entre simplicidade, performance e features.

## Ferramentas comparadas

### 1. Loguru

**Foco:** Logging simples e poderoso  
**GitHub stars:** ~18k (julho 2026)  
**Licença:** MIT  
**Primary focus:** Simplificar logging  
**Language support:** Python  
**Structured logging:** ✅ Yes (via bind/extras)  
**Performance:** Fast  
**Pricing:** Free (open source)

**Prós:**
- API simples e intuitiva
- Structured logging nativo
- Rotation automática de logs
- Compression automática
- Context managers
- Exception handling melhorado
- Colorido no terminal
- Integration com Sentry, etc.
- Lazy evaluation
- Correlation IDs

**Contras:**
- Python-only
- Menos configurável que logging padrão
- Curva de aprendizado para features avançadas
- Sem integração nativa com OpenTelemetry

**Best for:**
- Projetos Python
- Logging simples
- Prototipagem rápida
- Equipes que querem simplicidade

**Implementação básica:**
```python
from loguru import logger

# Logging básico
logger.info("Hello, world!")
logger.error("Something went wrong")

# Logging com contexto
logger.info("User logged in", user_id=123, username="john")

# Logging com exceção
try:
    1 / 0
except Exception as e:
    logger.exception("Division by zero")
```

**Features avançadas:**
```python
from loguru import logger
import sys

# Configurar logger
logger.remove()  # Remove handler padrão
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    rotation="10 MB",  # Rotacionar a cada 10 MB
    compression="zip",  # Comprimir logs antigos
    retention="30 days"  # Manter logs por 30 dias
)

# Logging estruturado
logger.bind(user_id=123).info("User logged in")

# Context manager
with logger.contextualize(user_id=123, request_id="abc"):
    logger.info("Processing request")

# Correlation ID
import uuid
correlation_id = str(uuid.uuid4())
logger.bind(correlation_id=correlation_id).info("Request started")

# Integration com Sentry
import sentry_sdk
sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[loguru_integration]
)
```

### 2. Structlog

**Foco:** Logging estruturado puro  
**GitHub stars:** ~4k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** Structured logging  
**Language support:** Python  
**Structured logging:** ✅ Yes (native)  
**Performance:** Fast  
**Pricing:** Free (open source)

**Prós:**
- Structured logging nativo
- Processors para transformação
- Multiple formatters
- Context binding
- Integration com OpenTelemetry
- Type hints
- Performance otimizada
- JSON logging nativo
- Contextvars support

**Contras:**
- Python-only
- Curva de aprendizado
- Menos features que Loguru
- Comunidade menor
- Sem rotation automática nativo

**Best for:**
- Logging estruturado puro
- JSON logging
- OpenTelemetry integration
- Sistemas distribuídos

**Implementação básica:**
```python
import structlog

# Configurar structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.JSONRenderer()
    ]
)

log = structlog.get_logger()

# Logging estruturado
log.info("user_logged_in", user_id=123, username="john")
```

**Features avançadas:**
```python
import structlog
from structlog.types import EventDict

# Custom processor
def add_correlation_id(logger, method_name, event_dict: EventDict) -> EventDict:
    event_dict["correlation_id"] = get_correlation_id()
    return event_dict

# Configurar com processors
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        add_correlation_id,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

log = structlog.get_logger()

# Context binding
log = log.bind(user_id=123, request_id="abc")
log.info("Processing request")

# Integration com OpenTelemetry
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

tracer_provider = TracerProvider()
trace.set_tracer_provider(tracer_provider)

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.contextvars.merge_contextvars,
        structlog.processors.JSONRenderer()
    ]
)
```

### 3. Python logging (stdlib)

**Foco:** Logging padrão do Python  
**GitHub stars:** N/A (stdlib)  
**Licença:** Python License  
**Primary focus:** Logging padrão  
**Language support:** Python  
**Structured logging:** ⚠️ Via custom formatters  
**Performance:** Medium  
**Pricing:** Free (stdlib)

**Prós:**
- Built-in no Python
- Amplamente usado
- Configurável
- Handlers flexíveis
- Integration com muitos sistemas
- Performance razoável
- Documentação extensa

**Contras:**
- API verbosa
- Structured logging não nativo
- Curva de aprendizado
- Requer configuração manual
- Menos intuitivo que Loguru

**Best for:**
- Projetos Python padrão
- Integração com sistemas legados
- Equipes que preferem stdlib
- Sistemas com requisitos específicos

**Implementação básica:**
```python
import logging

# Configurar logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Logging básico
logger.info("Hello, world!")
logger.error("Something went wrong")
```

**Features avançadas:**
```python
import logging
import logging.config
import json

# Configuração avançada
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json'
        }
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file'],
            'level': 'INFO'
        }
    }
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Logging estruturado (via extra)
logger.info("User logged in", extra={'user_id': 123, 'username': 'john'})
```

## Ferramentas adicionais

### 1. OpenTelemetry Logging

**Foco:** Observabilidade padronizada  
**GitHub stars:** ~3k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** Observabilidade  
**Language support:** Multi-language  
**Structured logging:** ✅ Yes  
**Performance:** Fast  
**Pricing:** Free (open source)

**Prós:**
- Padrão de indústria
- Multi-language
- Integration com tracing
- Context propagation
- Exporters flexíveis
- Vendor-agnostic

**Contras:**
- Curva de aprendizado íngreme
- Complexo de configurar
- Overhead para casos simples
- Requer infraestrutura

**Implementação:**
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Configurar tracing
tracer_provider = TracerProvider()
trace.set_tracer_provider(tracer_provider)

otlp_exporter = OTLPSpanExporter(endpoint="localhost:4317")
span_processor = BatchSpanProcessor(otlp_exporter)
tracer_provider.add_span_processor(span_processor)

# Logging com tracing
tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("operation"):
    logger.info("Operation started")
```

### 2. ELK Stack (Elasticsearch, Logstash, Kibana)

**Foco:** Centralização e análise de logs  
**GitHub stars:** ~65k (Elasticsearch) (julho 2026)  
**Licença:** Elastic License (proprietário)  
**Primary focus:** Log aggregation e análise  
**Language support:** Multi-language  
**Structured logging:** ✅ Yes  
**Performance:** High  
**Pricing:** Free (basic), paid (enterprise)

**Prós:**
- Centralização de logs
- Busca poderosa
- Visualização rica
- Escalabilidade
- Alertas
- Integration com muitos sistemas

**Contras:**
- Complexo de setup
- Requer infraestrutura
- Custo para enterprise
- Curva de aprendizado
- Overhead para casos simples

**Implementação:**
```python
import logging
from logstash_async.handler import AsynchronousLogstashHandler

# Configurar handler Logstash
handler = AsynchronousLogstashHandler(
    host='localhost',
    port=5959,
    database_path=None
)

logger = logging.getLogger('my-logger')
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# Logging
logger.info("User logged in", extra={'user_id': 123})
```

## Comparativo detalhado

### Features

| Feature | Loguru | Structlog | Python logging | OpenTelemetry |
|---|---|---|---|---|
| Structured logging | ✅ Yes | ✅ Best | ⚠️ Via custom | ✅ Yes |
| Simplicidade | ✅ Best | ⚠️ Medium | ❌ Verbose | ❌ Complex |
| Performance | ✅ Fast | ✅ Fast | ⚠️ Medium | ✅ Fast |
| JSON logging | ✅ Yes | ✅ Native | ⚠️ Via custom | ✅ Yes |
| Rotation | ✅ Native | ❌ No | ✅ Native | ❌ No |
| Compression | ✅ Native | ❌ No | ✅ Native | ❌ No |
| OpenTelemetry | ⚠️ Via integration | ✅ Native | ⚠️ Via integration | ✅ Native |
| Multi-language | ❌ No | ❌ No | ❌ No | ✅ Yes |
| Learning curve | ✅ Low | ⚠️ Medium | ⚠️ Medium | ❌ High |

### Performance

| Metric | Loguru | Structlog | Python logging |
|---|---|---|---|
| Setup time | 5 min | 10 min | 15 min |
| Logging overhead | Low | Low | Medium |
| JSON serialization | Fast | Fast | Medium |
| Memory usage | Low | Low | Medium |

### Casos de uso

| Caso de uso | Loguru | Structlog | Python logging |
|---|---|---|---|
| Logging simples | ✅ Best | ⚠️ Good | ❌ Verbose |
| Structured logging | ✅ Good | ✅ Best | ⚠️ Via custom |
| JSON logging | ✅ Yes | ✅ Best | ⚠️ Via custom |
| OpenTelemetry | ⚠️ Via integration | ✅ Native | ⚠️ Via integration |
| Sistemas legados | ⚠️ Good | ⚠️ Good | ✅ Best |

## Recomendações por caso de uso

### Logging simples
**Recomendado:** Loguru
- API simples
- Setup rápido
- Features poderosas
- Performance boa

### Structured logging puro
**Recomendado:** Structlog
- Structured logging nativo
- Processors flexíveis
- JSON logging nativo
- OpenTelemetry integration

### Sistemas legados
**Recomendado:** Python logging
- Built-in
- Amplamente usado
- Integration com sistemas
- Performance razoável

### Observabilidade completa
**Recomendado:** OpenTelemetry + Structlog
- Padrão de indústria
- Tracing + logging
- Context propagation
- Vendor-agnostic

### Centralização de logs
**Recomendado:** ELK Stack + qualquer logger
- Centralização
- Busca poderosa
- Visualização rica
- Escalabilidade

## Arquitetura híbrida

**Padrão recomendado:** Loguru para desenvolvimento + Structlog para produção + OpenTelemetry para observabilidade

**Implementação:**
```python
import structlog
from loguru import logger
import sys

# Desenvolvimento: Loguru
if os.getenv("ENV") == "development":
    logger.remove()
    logger.add(sys.stderr, level="DEBUG")
    
    def log(message, **kwargs):
        logger.info(message, **kwargs)

# Produção: Structlog + OpenTelemetry
else:
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
    
    log = structlog.get_logger()

# Uso
log("User logged in", user_id=123, username="john")
```

## Estratégia de implementação

### Fase 1: Escolha e setup
- Selecionar ferramenta baseado em caso de uso
- Instalar e configurar
- Criar primeiro log
- Testar output

### Fase 2: Estruturação
- Definir schema de logs
- Configurar formatters
- Adicionar contexto
- Testar structured logging

### Fase 3: Integration
- Integrar com sistema de logs
- Configurar rotation
- Adicionar compression
- Testar integração

### Fase 4: Observabilidade
- Integrar com OpenTelemetry (se necessário)
- Configurar centralização
- Adicionar alertas
- Monitorar logs

## Checklist de implementação

### Para Loguru
- [ ] Instalar Loguru
- [ ] Configurar handlers
- [ ] Definir formato
- [ ] Configurar rotation
- [ ] Configurar compression
- [ ] Adicionar contexto
- [ ] Testar logging
- [ ] Integrar com sistema

### Para Structlog
- [ ] Instalar Structlog
- [ ] Configurar processors
- [ ] Definir formatters
- [ ] Adicionar context binding
- [ ] Integrar OpenTelemetry
- [ ] Testar logging
- [ ] Validar JSON output

### Para Python logging
- [ ] Configurar logging
- [ ] Definir handlers
- [ ] Configurar formatters
- [ ] Adicionar rotation
- [ ] Testar logging
- [ ] Integrar com sistema

## Próximos passos

1. **Escolher ferramenta:** Selecionar baseado em caso de uso
2. **Implementar protótipo:** Criar primeiro log
3. **Estruturar logs:** Definir schema e contexto
4. **Integrar sistema:** Configurar handlers e formatters
5. **Testar:** Validar output e performance
6. **Monitorar:** Configurar alertas e análise

## Referências

- Loguru: https://loguru.readthedocs.io/
- Structlog: https://www.structlog.org/
- Python logging: https://docs.python.org/3/library/logging.html
- OpenTelemetry: https://opentelemetry.io/
- ELK Stack: https://www.elastic.co/elastic-stack
