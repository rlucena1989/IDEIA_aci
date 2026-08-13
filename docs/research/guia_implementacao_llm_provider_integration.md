# Guia de Implementação - LLM Provider Integration

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de integração de providers LLM para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de integração de múltiplos providers LLM com multi-sidekick routing, cost-aware routing, provider-agnostic routing e provider-specific features, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install openai anthropic langchain-openai langchain-anthropic
```

### Estrutura de Diretórios

```
packages/
├── llm_provider/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── provider.py            # Provider base
│   │   ├── provider_types.py      # Tipos de provider
│   │   └── provider_config.py     # Configurações
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── openai_provider.py    # Provider OpenAI
│   │   ├── anthropic_provider.py  # Provider Anthropic
│   │   ├── local_provider.py      # Provider local (Ollama)
│   │   └── mock_provider.py       # Provider mock para testes
│   ├── routing/
│   │   ├── __init__.py
│   │   ├── router.py              # Router base
│   │   ├── multi_sidekick_router.py # Multi-sidekick routing
│   │   ├── cost_aware_router.py   # Cost-aware routing
│   │   └── capability_router.py   # Capability-based routing
│   ├── monitoring/
│   │   ├── __init__.py
│   │   ├── metrics.py             # Métricas de performance
│   │   ├── logger.py              # Logger de chamadas
│   │   └── cost_tracker.py        # Rastreamento de custos
│   ├── fallback/
│   │   ├── __init__.py
│   │   ├── fallback_handler.py    # Handler de fallback
│   │   └── retry_strategy.py      # Estratégia de retry
│   └── utils/
│       ├── __init__.py
│       ├── token_counter.py       # Contador de tokens
│       └── validators.py         # Validadores
```

## Passo 1: Tipos de Provider (core/provider_types.py)

```python
"""
Definições de tipos de provider LLM.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime

class ProviderTier(Enum):
    """Tier de provider."""
    FRONTIER = "frontier"  # GPT-4o, Claude Opus, etc.
    BALANCED = "balanced"  # GPT-4o-mini, Claude Sonnet, etc.
    COST_OPTIMIZED = "cost_optimized"  # GPT-3.5, Grok, etc.
    LOCAL = "local"  # Ollama, vLLM, etc.

class ProviderCapability(Enum):
    """Capacidades de provider."""
    CODE_GENERATION = "code_generation"
    CODE_REVIEW = "code_review"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    REFACTORING = "refactoring"
    ANALYSIS = "analysis"
    CHAT = "chat"
    FUNCTION_CALLING = "function_calling"
    STREAMING = "streaming"

class ProviderStatus(Enum):
    """Status de provider."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    RATE_LIMITED = "rate_limited"
    ERROR = "error"

class ProviderConfig:
    """Configuração de provider."""
    
    def __init__(
        self,
        provider_id: str,
        model_id: str,
        tier: ProviderTier,
        capabilities: list,
        cost_per_1k_tokens: float,
        latency_p95: float,
        max_tokens: int,
        supports_streaming: bool,
        supports_function_calling: bool,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.provider_id = provider_id
        self.model_id = model_id
        self.tier = tier
        self.capabilities = capabilities
        self.cost_per_1k_tokens = cost_per_1k_tokens
        self.latency_p95 = latency_p95
        self.max_tokens = max_tokens
        self.supports_streaming = supports_streaming
        self.supports_function_calling = supports_function_calling
        self.api_key = api_key
        self.base_url = base_url
```

## Passo 2: Provider Base (core/provider.py)

```python
"""
Classe base para providers LLM.
"""
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
import logging

from .provider_config import ProviderConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseProvider(ABC):
    """Classe base para providers LLM."""
    
    def __init__(self, config: ProviderConfig):
        """Inicializa provider."""
        self.config = config
        self.client = self._initialize_client()
        self.status = ProviderStatus.AVAILABLE
        self.metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
    
    @abstractmethod
    def _initialize_client(self):
        """Inicializa cliente específico do provider."""
        pass
    
    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 2000, **kwargs) -> str:
        """Gera resposta do LLM."""
        pass
    
    @abstractmethod
    def generate_stream(self, prompt: str, max_tokens: int = 2000, **kwargs):
        """Gera resposta do LLM com streaming."""
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Conta tokens em texto."""
        pass
    
    def update_metrics(self, success: bool, tokens: int, cost: float):
        """Atualiza métricas do provider."""
        self.metrics["total_calls"] += 1
        
        if success:
            self.metrics["successful_calls"] += 1
        else:
            self.metrics["failed_calls"] += 1
        
        self.metrics["total_tokens"] += tokens
        self.metrics["total_cost"] += cost
    
    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas do provider."""
        return self.metrics.copy()
    
    def reset_metrics(self):
        """Reseta métricas do provider."""
        self.metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
    
    def is_available(self) -> bool:
        """Verifica se provider está disponível."""
        return self.status == ProviderStatus.AVAILABLE
    
    def has_capability(self, capability: ProviderCapability) -> bool:
        """Verifica se provider tem capacidade específica."""
        return capability.value in self.config.capabilities
```

## Passo 3: Provider OpenAI (providers/openai_provider.py)

```python
"""
Provider OpenAI.
"""
from typing import Dict, Any, Optional
import logging

from ..core.provider import BaseProvider
from ..core.provider_types import ProviderStatus
from ..core.provider_config import ProviderConfig

try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None
    logging.warning("langchain-openai not installed")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIProvider(BaseProvider):
    """Provider OpenAI."""
    
    def _initialize_client(self):
        """Inicializa cliente OpenAI."""
        if not ChatOpenAI:
            raise ImportError("langchain-openai not installed")
        
        return ChatOpenAI(
            model=self.config.model_id,
            api_key=self.config.api_key,
            base_url=self.config.base_url,
            temperature=0.7
        )
    
    def generate(self, prompt: str, max_tokens: int = 2000, **kwargs) -> str:
        """Gera resposta do OpenAI."""
        try:
            response = self.client.invoke(prompt, max_tokens=max_tokens)
            content = response.content
            
            # Contar tokens (estimado)
            tokens = self.count_tokens(prompt) + self.count_tokens(content)
            cost = (tokens / 1000) * self.config.cost_per_1k_tokens
            
            self.update_metrics(True, tokens, cost)
            
            return content
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            self.update_metrics(False, 0, 0)
            raise
    
    def generate_stream(self, prompt: str, max_tokens: int = 2000, **kwargs):
        """Gera resposta do OpenAI com streaming."""
        try:
            for chunk in self.client.stream(prompt, max_tokens=max_tokens):
                yield chunk.content
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            raise
    
    def count_tokens(self, text: str) -> int:
        """Conta tokens (estimado: ~4 caracteres por token)."""
        return len(text) // 4
```

## Passo 4: Provider Anthropic (providers/anthropic_provider.py)

```python
"""
Provider Anthropic.
"""
from typing import Dict, Any, Optional
import logging

from ..core.provider import BaseProvider
from ..core.provider_types import ProviderStatus
from ..core.provider_config import ProviderConfig

try:
    from langchain_anthropic import ChatAnthropic
except ImportError:
    ChatAnthropic = None
    logging.warning("langchain-anthropic not installed")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnthropicProvider(BaseProvider):
    """Provider Anthropic."""
    
    def _initialize_client(self):
        """Inicializa cliente Anthropic."""
        if not ChatAnthropic:
            raise ImportError("langchain-anthropic not installed")
        
        return ChatAnthropic(
            model=self.config.model_id,
            api_key=self.config.api_key,
            base_url=self.config.base_url,
            temperature=0.7
        )
    
    def generate(self, prompt: str, max_tokens: int = 2000, **kwargs) -> str:
        """Gera resposta do Anthropic."""
        try:
            response = self.client.invoke(prompt, max_tokens=max_tokens)
            content = response.content
            
            # Contar tokens (estimado)
            tokens = self.count_tokens(prompt) + self.count_tokens(content)
            cost = (tokens / 1000) * self.config.cost_per_1k_tokens
            
            self.update_metrics(True, tokens, cost)
            
            return content
        except Exception as e:
            logger.error(f"Anthropic generation error: {e}")
            self.update_metrics(False, 0, 0)
            raise
    
    def generate_stream(self, prompt: str, max_tokens: int = 2000, **kwargs):
        """Gera resposta do Anthropic com streaming."""
        try:
            for chunk in self.client.stream(prompt, max_tokens=max_tokens):
                yield chunk.content
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            raise
    
    def count_tokens(self, text: str) -> int:
        """Conta tokens (estimado: ~4 caracteres por token)."""
        return len(text) // 4
```

## Passo 5: Router Multi-Sidekick (routing/multi_sidekick_router.py)

```python
"""
Router multi-sidekick para orquestração de providers.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

from ..core.provider_config import ProviderConfig
from ..core.provider_types import ProviderCapability, ProviderTier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RoutingDecision:
    """Decisão de routing."""
    primary_provider: str
    sidekick_providers: List[str]
    reason: str
    estimated_cost: float
    estimated_latency: float

class MultiSidekickRouter:
    """Router com multi-sidekick."""
    
    def __init__(self):
        """Inicializa router."""
        self.providers: Dict[str, ProviderConfig] = {}
        self.provider_catalog: Dict[str, List[str]] = {}  # capability -> provider_ids
    
    def register_provider(self, config: ProviderConfig):
        """Registra provider."""
        self.providers[config.provider_id] = config
        
        # Indexar por capabilities
        for capability in config.capabilities:
            if capability not in self.provider_catalog:
                self.provider_catalog[capability] = []
            self.provider_catalog[capability].append(config.provider_id)
        
        logger.info(f"Registered provider {config.provider_id} ({config.model_id})")
    
    def route(self, task_type: str, complexity: float, budget: Optional[float] = None) -> RoutingDecision:
        """Roteia tarefa para providers apropriados."""
        # Encontrar providers com capability necessária
        capable_providers = self.provider_catalog.get(task_type, [])
        
        if not capable_providers:
            logger.warning(f"No providers found for task type: {task_type}")
            return RoutingDecision(
                primary_provider="",
                sidekick_providers=[],
                reason="No capable providers",
                estimated_cost=0.0,
                estimated_latency=0.0
            )
        
        # Selecionar primary provider
        primary = self._select_primary(capable_providers, complexity, budget)
        
        # Selecionar sidekicks
        sidekicks = self._select_sidekicks(task_type, primary, capable_providers)
        
        # Estimar custo e latência
        estimated_cost = self._estimate_cost(primary, sidekicks)
        estimated_latency = self._estimate_latency(primary, sidekicks)
        
        return RoutingDecision(
            primary_provider=primary,
            sidekick_providers=sidekicks,
            reason=f"Primary: {primary}, Sidekicks: {sidekicks}",
            estimated_cost=estimated_cost,
            estimated_latency=estimated_latency
        )
    
    def _select_primary(self, capable_providers: List[str], complexity: float, budget: Optional[float]) -> str:
        """Seleciona provider principal."""
        candidates = [self.providers[p] for p in capable_providers]
        
        # Filtrar por budget
        if budget is not None:
            candidates = [c for c in candidates if c.cost_per_1k_tokens * 10 <= budget]
        
        if not candidates:
            # Fallback para provider mais barato
            return min(capable_providers, key=lambda p: self.providers[p].cost_per_1k_tokens)
        
        # Selecionar baseado em complexidade
        if complexity > 0.7:
            # Alta complexidade: usar frontier
            frontier = [c for c in candidates if c.tier == ProviderTier.FRONTIER]
            if frontier:
                return min(frontier, key=lambda c: c.cost_per_1k_tokens).provider_id
        
        # Complexidade média: usar balanced
        balanced = [c for c in candidates if c.tier == ProviderTier.BALANCED]
        if balanced:
            return min(balanced, key=lambda c: c.cost_per_1k_tokens).provider_id
        
        # Fallback para cost-optimized
        cost_optimized = [c for c in candidates if c.tier == ProviderTier.COST_OPTIMIZED]
        if cost_optimized:
            return min(cost_optimized, key=lambda c: c.cost_per_1k_tokens).provider_id
        
        # Último fallback
        return candidates[0].provider_id
    
    def _select_sidekicks(self, task_type: str, primary: str, capable_providers: List[str]) -> List[str]:
        """Seleciona sidekicks especializados."""
        sidekicks = []
        
        # Adicionar 1-2 sidekicks com tiers diferentes
        primary_config = self.providers[primary]
        
        for provider_id in capable_providers:
            if provider_id == primary:
                continue
            
            config = self.providers[provider_id]
            
            # Selecionar sidekicks com tiers diferentes
            if config.tier != primary_config.tier and len(sidekicks) < 2:
                sidekicks.append(provider_id)
        
        return sidekicks
    
    def _estimate_cost(self, primary: str, sidekicks: List[str]) -> float:
        """Estima custo total."""
        total_cost = 0.0
        
        # Primary: assume 10k tokens
        total_cost += self.providers[primary].cost_per_1k_tokens * 10
        
        # Sidekicks: assume 5k tokens cada
        for sidekick in sidekicks:
            total_cost += self.providers[sidekick].cost_per_1k_tokens * 5
        
        return total_cost
    
    def _estimate_latency(self, primary: str, sidekicks: List[str]) -> float:
        """Estima latência total."""
        total_latency = 0.0
        
        # Primary
        total_latency += self.providers[primary].latency_p95
        
        # Sidekicks (paralelo, pegar o máximo)
        return total_latency
```

## Passo 6: Gateway de Providers (core/provider_gateway.py)

```python
"""
Gateway para gerenciar múltiplos providers.
"""
from typing import Dict, List, Optional
import logging

from .provider_config import ProviderConfig
from .provider_types import ProviderCapability, ProviderTier
from .provider import BaseProvider
from ..providers.openai_provider import OpenAIProvider
from ..providers.anthropic_provider import AnthropicProvider
from ..routing.multi_sidekick_router import MultiSidekickRouter, RoutingDecision

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProviderGateway:
    """Gateway para gerenciar múltiplos providers."""
    
    def __init__(self):
        """Inicializa gateway."""
        self.providers: Dict[str, BaseProvider] = {}
        self.router = MultiSidekickRouter()
    
    def register_provider(self, config: ProviderConfig):
        """Registra provider no gateway."""
        # Criar provider baseado no tipo
        if "openai" in config.provider_id.lower():
            provider = OpenAIProvider(config)
        elif "anthropic" in config.provider_id.lower():
            provider = AnthropicProvider(config)
        else:
            raise ValueError(f"Unknown provider type: {config.provider_id}")
        
        self.providers[config.provider_id] = provider
        self.router.register_provider(config)
        
        logger.info(f"Registered provider {config.provider_id} in gateway")
    
    def generate(self, prompt: str, task_type: str, complexity: float = 0.5, budget: Optional[float] = None, **kwargs) -> str:
        """Gera resposta usando routing."""
        # Obter decisão de routing
        decision = self.router.route(task_type, complexity, budget)
        
        if not decision.primary_provider:
            raise ValueError("No primary provider available")
        
        # Usar primary provider
        provider = self.providers[decision.primary_provider]
        result = provider.generate(prompt, **kwargs)
        
        logger.info(f"Generated response using {decision.primary_provider}")
        
        return result
    
    def generate_with_sidekicks(self, prompt: str, task_type: str, complexity: float = 0.5, budget: Optional[float] = None, **kwargs) -> Dict[str, str]:
        """Gera resposta usando primary + sidekicks."""
        decision = self.router.route(task_type, complexity, budget)
        
        if not decision.primary_provider:
            raise ValueError("No primary provider available")
        
        # Usar primary provider
        primary_provider = self.providers[decision.primary_provider]
        primary_result = primary_provider.generate(prompt, **kwargs)
        
        # Usar sidekicks (opcional)
        sidekick_results = {}
        for sidekick_id in decision.sidekick_providers:
            sidekick = self.providers[sidekick_id]
            sidekick_results[sidekick_id] = sidekick.generate(prompt, **kwargs)
        
        return {
            "primary": primary_result,
            "sidekicks": sidekick_results,
            "decision": decision
        }
    
    def get_provider_metrics(self, provider_id: str) -> Dict[str, Any]:
        """Retorna métricas de um provider."""
        if provider_id in self.providers:
            return self.providers[provider_id].get_metrics()
        return {}
    
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Retorna métricas de todos os providers."""
        return {
            provider_id: provider.get_metrics()
            for provider_id, provider in self.providers.items()
        }
```

## Passo 7: Exemplo de Uso

```python
"""
Exemplo de uso do gateway de providers.
"""
from llm_provider.core.provider_gateway import ProviderGateway
from llm_provider.core.provider_config import ProviderConfig
from llm_provider.core.provider_types import ProviderTier, ProviderCapability

# Criar gateway
gateway = ProviderGateway()

# Registrar providers
openai_config = ProviderConfig(
    provider_id="openai_gpt4",
    model_id="gpt-4o",
    tier=ProviderTier.FRONTIER,
    capabilities=["code_generation", "code_review", "testing", "documentation"],
    cost_per_1k_tokens=0.03,
    latency_p95=2.0,
    max_tokens=4096,
    supports_streaming=True,
    supports_function_calling=True,
    api_key="your-openai-api-key"
)
gateway.register_provider(openai_config)

anthropic_config = ProviderConfig(
    provider_id="anthropic_claude",
    model_id="claude-3-opus-20240229",
    tier=ProviderTier.FRONTIER,
    capabilities=["code_generation", "code_review", "analysis"],
    cost_per_1k_tokens=0.015,
    latency_p95=3.0,
    max_tokens=4096,
    supports_streaming=True,
    supports_function_calling=True,
    api_key="your-anthropic-api-key"
)
gateway.register_provider(anthropic_config)

# Gerar resposta
prompt = "Create a REST API endpoint for user authentication"
result = gateway.generate(
    prompt=prompt,
    task_type="code_generation",
    complexity=0.7,
    budget=1.0
)

print(f"Generated response:\n{result}")

# Gerar com sidekicks
result_with_sidekicks = gateway.generate_with_sidekicks(
    prompt=prompt,
    task_type="code_generation",
    complexity=0.7,
    budget=1.0
)

print(f"\nPrimary result:\n{result_with_sidekicks['primary']}")
print(f"\nSidekick results:")
for sidekick_id, sidekick_result in result_with_sidekicks['sidekicks'].items():
    print(f"- {sidekick_id}: {sidekick_result[:100]}...")

# Métricas
metrics = gateway.get_all_metrics()
print(f"\nProvider metrics:")
for provider_id, provider_metrics in metrics.items():
    print(f"- {provider_id}: {provider_metrics}")
```

## Passo 8: Testes de Validação

```python
"""
Testes de validação para gateway de providers.
"""
import pytest
from llm_provider.core.provider_gateway import ProviderGateway
from llm_provider.core.provider_config import ProviderConfig
from llm_provider.core.provider_types import ProviderTier

class TestProviderGateway:
    """Testes para gateway de providers."""
    
    def test_initialization(self):
        """Testa inicialização do gateway."""
        gateway = ProviderGateway()
        
        assert gateway.providers is not None
        assert gateway.router is not None
    
    def test_register_provider(self):
        """Testa registro de provider."""
        gateway = ProviderGateway()
        
        config = ProviderConfig(
            provider_id="openai_test",
            model_id="gpt-4o",
            tier=ProviderTier.FRONTIER,
            capabilities=["code_generation"],
            cost_per_1k_tokens=0.03,
            latency_p95=2.0,
            max_tokens=4096,
            supports_streaming=True,
            supports_function_calling=True,
            api_key="test-key"
        )
        
        gateway.register_provider(config)
        
        assert "openai_test" in gateway.providers
    
    def test_routing(self):
        """Testa routing de providers."""
        gateway = ProviderGateway()
        
        config = ProviderConfig(
            provider_id="openai_test",
            model_id="gpt-4o",
            tier=ProviderTier.FRONTIER,
            capabilities=["code_generation"],
            cost_per_1k_tokens=0.03,
            latency_p95=2.0,
            max_tokens=4096,
            supports_streaming=True,
            supports_function_calling=True,
            api_key="test-key"
        )
        
        gateway.register_provider(config)
        
        decision = gateway.router.route("code_generation", 0.7)
        
        assert decision.primary_provider is not None

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Provider Indisponível

```python
def generate_with_fallback(self, prompt: str, task_type: str, **kwargs) -> str:
    """Gera resposta com fallback."""
    decision = self.router.route(task_type, 0.5)
    
    # Tentar primary
    try:
        provider = self.providers[decision.primary_provider]
        return provider.generate(prompt, **kwargs)
    except Exception as e:
        logger.error(f"Primary provider failed: {e}")
        
        # Tentar sidekicks
        for sidekick_id in decision.sidekick_providers:
            try:
                sidekick = self.providers[sidekick_id]
                return sidekick.generate(prompt, **kwargs)
            except Exception as e:
                logger.error(f"Sidekick {sidekick_id} failed: {e}")
        
        raise Exception("All providers failed")
```

### 2. Budget Excedido

```python
def route_with_budget_check(self, task_type: str, complexity: float, budget: float) -> RoutingDecision:
    """Roteia com verificação de budget."""
    decision = self.router.route(task_type, complexity, budget)
    
    if decision.estimated_cost > budget:
        logger.warning(f"Estimated cost {decision.estimated_cost} exceeds budget {budget}")
        
        # Tentar usar providers mais baratos
        capable_providers = self.router.provider_catalog.get(task_type, [])
        cost_optimized = [
            p for p in capable_providers
            if self.providers[p].config.tier == ProviderTier.COST_OPTIMIZED
        ]
        
        if cost_optimized:
            decision.primary_provider = cost_optimized[0]
            decision.estimated_cost = self.router._estimate_cost(decision.primary_provider, decision.sidekick_providers)
    
    return decision
```

### 3. Rate Limiting

```python
def generate_with_retry(self, prompt: str, provider_id: str, max_retries: int = 3, **kwargs) -> str:
    """Gera resposta com retry em caso de rate limiting."""
    provider = self.providers[provider_id]
    
    for attempt in range(max_retries):
        try:
            return provider.generate(prompt, **kwargs)
        except Exception as e:
            if "rate limit" in str(e).lower() and attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"Rate limited, retrying in {wait_time}s")
                import time
                time.sleep(wait_time)
            else:
                raise
```

## Integrações com Outros Componentes

### 1. Integração com Orquestração de Agentes

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from llm_provider.core.provider_gateway import ProviderGateway

class ProviderAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com gateway de providers."""
    
    def __init__(self, provider_gateway: ProviderGateway):
        super().__init__(llm_client=None)  # LLM client gerenciado pelo gateway
        self.provider_gateway = provider_gateway
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando gateway de providers."""
        task = state["task"]
        complexity = state.get("complexity", 0.5)
        
        # Usar gateway para gerar código
        result = self.provider_gateway.generate(
            prompt=task,
            task_type="code_generation",
            complexity=complexity
        )
        
        return {
            "intermediate_results": {"code": result},
            "steps_completed": ["code_generation"]
        }
```

### 2. Integração com Sistema de Memória

```python
from memory_system.core.hierarchy import MemoryHierarchy
from llm_provider.core.provider_gateway import ProviderGateway

class ProviderAwareMemory(MemoryHierarchy):
    """Sistema de memória com tracking de providers."""
    
    def __init__(self, provider_gateway: ProviderGateway):
        super().__init__()
        self.provider_gateway = provider_gateway
    
    def add(self, content: str, memory_type: MemoryType, provider_id: str = None, **kwargs) -> MemoryEntry:
        """Adiciona entrada com tracking de provider."""
        entry = super().add(content, memory_type, **kwargs)
        
        if provider_id:
            entry.metadata["provider_id"] = provider_id
        
        return entry
```

### 3. Integração com RAG

```python
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from llm_provider.core.provider_gateway import ProviderGateway

class RAGProviderGateway(ProviderGateway):
    """Gateway com RAG."""
    
    def __init__(self, rag_retriever: HybridRetriever):
        super().__init__()
        self.rag_retriever = rag_retriever
    
    def generate_with_rag(self, prompt: str, task_type: str, **kwargs) -> str:
        """Gera resposta usando RAG."""
        # Recuperar contexto relevante
        rag_docs = self.rag_retriever.retrieve(prompt, top_k=3)
        
        # Adicionar contexto ao prompt
        context = "\n".join([
            self.rag_retriever.documents[doc_id].content
            for doc_id, _ in rag_docs
        ])
        
        enhanced_prompt = f"Context:\n{context}\n\nTask:\n{prompt}"
        
        # Gerar resposta
        return self.generate(enhanced_prompt, task_type, **kwargs)
```

## Próximos Passos

1. Implementar provider local (Ollama)
2. Adicionar suporte a function calling
3. Implementar sistema de caching de respostas
4. Adicionar métricas avançadas
5. Implementar load balancing
6. Adicionar suporte a multi-modal
7. Implementar testes de performance
8. Adicionar documentação de API
