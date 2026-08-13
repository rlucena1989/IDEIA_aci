# LLM Provider Integration

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar integração de providers LLM baseado em gaps competitivos

## Visão Geral

Devin usa model-agnostic routing com Fusion (frontier + sidekick), Cursor usa Router com Compass + taxonomy, Windsurf usa SWE-1 + frontier models. IDEIA_aci precisa de integração mais avançada com multi-sidekick routing, reinforcement learning routing, cost-aware routing, provider-agnostic routing e provider-specific features.

## Arquitetura de Provider Integration

### Componentes

```
┌─────────────────────────────────────┐
│   Provider Gateway                  │  ← Abstração de providers
├─────────────────────────────────────┤
│   Provider Router                   │  ← Routing inteligente
├─────────────────────────────────────┤
│   Provider Adapter                  │  ← Adapters específicos
├─────────────────────────────────────┤
│   Provider Monitor                  │  ← Monitoramento de performance
├─────────────────────────────────────┤
│   Provider Catalog                 │  ← Catálogo de providers
└─────────────────────────────────────┘
```

## Gap 1: Multi-Sidekick Routing

### Conceito

N sidekicks especializados vs 1 sidekick (Devin Fusion). Cada sidekick otimizado para tipos específicos de subtarefas.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Multi-Sidekick Router

```python
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProviderTier(Enum):
    FRONTIER = "frontier"  # GPT-4o, Claude Opus, etc.
    BALANCED = "balanced"  # GPT-4o-mini, Claude Sonnet, etc.
    COST_OPTIMIZED = "cost_optimized"  # GPT-3.5, Grok, etc.
    LOCAL = "local"  # Ollama, vLLM, etc.

@dataclass
class ProviderConfig:
    """Configuração de provider"""
    provider_id: str
    model_id: str
    tier: ProviderTier
    capabilities: List[str]  # code_generation, code_review, testing, etc.
    cost_per_1k_tokens: float
    latency_p95: float  # ms
    success_rate: float
    max_tokens: int
    supports_streaming: bool
    supports_function_calling: bool

@dataclass
class RoutingDecision:
    """Decisão de routing"""
    primary_provider: str
    sidekick_providers: List[str]
    reason: str
    estimated_cost: float
    estimated_latency: float

class MultiSidekickRouter:
    """Router com multi-sidekick"""
    
    def __init__(self):
        self.providers: Dict[str, ProviderConfig] = {}
        self.provider_catalog: Dict[str, List[str]] = {}  # capability -> provider_ids
    
    def register_provider(self, config: ProviderConfig):
        """Registra provider"""
        self.providers[config.provider_id] = config
        
        # Indexar por capabilities
        for capability in config.capabilities:
            if capability not in self.provider_catalog:
                self.provider_catalog[capability] = []
            self.provider_catalog[capability].append(config.provider_id)
        
        logger.info(f"Registered provider {config.provider_id} ({config.model_id})")
    
    def route(self, task_type: str, complexity: float, budget: Optional[float] = None) -> RoutingDecision:
        """Roteia tarefa para providers apropriados"""
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
        
        # Selecionar primary provider baseado em complexidade e budget
        primary = self._select_primary(capable_providers, complexity, budget)
        
        # Selecionar sidekicks especializados
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
        """Seleciona provider principal"""
        candidates = [self.providers[p] for p in capable_providers]
        
        # Filtrar por budget
        if budget is not None:
            candidates = [c for c in candidates if c.cost_per_1k_tokens * 10 <= budget]  # Assumindo 10k tokens
        
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
        
        # Baixa complexidade: usar cost-optimized
        cost_optimized = [c for c in candidates if c.tier == ProviderTier.COST_OPTIMIZED]
        if cost_optimized:
            return min(cost_optimized, key=lambda c: c.cost_per_1k_tokens).provider_id
        
        # Fallback
        return candidates[0].provider_id
    
    def _select_sidekicks(self, task_type: str, primary: str, capable_providers: List[str]) -> List[str]:
        """Seleciona sidekicks especializados"""
        sidekicks = []
        
        # Adicionar sidekick de review se primary não for especializado em review
        if "code_review" in self.provider_catalog:
            review_providers = [p for p in self.provider_catalog["code_review"] if p != primary]
            if review_providers:
                sidekicks.append(review_providers[0])
        
        # Adicionar sidekick de testing se necessário
        if "testing" in self.provider_catalog:
            test_providers = [p for p in self.provider_catalog["testing"] if p != primary]
            if test_providers:
                sidekicks.append(test_providers[0])
        
        return sidekicks[:2]  # Limitar a 2 sidekicks
    
    def _estimate_cost(self, primary: str, sidekicks: List[str]) -> float:
        """Estima custo total"""
        primary_config = self.providers[primary]
        primary_cost = primary_config.cost_per_1k_tokens * 10  # Assumindo 10k tokens
        
        sidekick_cost = 0.0
        for sidekick in sidekicks:
            sidekick_config = self.providers[sidekick]
            sidekick_cost += sidekick_config.cost_per_1k_tokens * 5  # Assumindo 5k tokens por sidekick
        
        return primary_cost + sidekick_cost
    
    def _estimate_latency(self, primary: str, sidekicks: List[str]) -> float:
        """Estima latência total"""
        primary_config = self.providers[primary]
        primary_latency = primary_config.latency_p95
        
        # Sidekicks executam em paralelo
        max_sidekick_latency = 0.0
        for sidekick in sidekicks:
            sidekick_config = self.providers[sidekick]
            max_sidekick_latency = max(max_sidekick_latency, sidekick_config.latency_p95)
        
        return primary_latency + max_sidekick_latency

# Uso
router = MultiSidekickRouter()

# Registrar providers
router.register_provider(ProviderConfig(
    provider_id="openai_gpt4o",
    model_id="gpt-4o",
    tier=ProviderTier.FRONTIER,
    capabilities=["code_generation", "code_review", "testing"],
    cost_per_1k_tokens=0.005,
    latency_p95=2000,
    success_rate=0.95,
    max_tokens=128000,
    supports_streaming=True,
    supports_function_calling=True
))

router.register_provider(ProviderConfig(
    provider_id="openai_gpt4o_mini",
    model_id="gpt-4o-mini",
    tier=ProviderTier.BALANCED,
    capabilities=["code_generation", "testing"],
    cost_per_1k_tokens=0.00015,
    latency_p95=500,
    success_rate=0.90,
    max_tokens=128000,
    supports_streaming=True,
    supports_function_calling=True
))

router.register_provider(ProviderConfig(
    provider_id="ollama_llama3",
    model_id="llama3:8b",
    tier=ProviderTier.LOCAL,
    capabilities=["code_generation"],
    cost_per_1k_tokens=0.0,
    latency_p95=3000,
    success_rate=0.85,
    max_tokens=8192,
    supports_streaming=True,
    supports_function_calling=False
))

# Rotear tarefa
decision = router.route(task_type="code_generation", complexity=0.8, budget=0.01)

print(f"Routing decision: {decision}")
```

## Gap 2: Reinforcement Learning Routing

### Conceito

Routing com reinforcement learning que aprende de sessões reais. Diferente de routing estático, RL routing adapta automaticamente.

### Implementação com RL Routing

```python
import numpy as np
from typing import Dict, List, Tuple

class RLRouter:
    """Router baseado em reinforcement learning"""
    
    def __init__(self, n_providers: int, learning_rate: float = 0.01, epsilon: float = 0.1):
        self.n_providers = n_providers
        self.learning_rate = learning_rate
        self.epsilon = epsilon
        self.q_table = np.zeros((10, n_providers))  # [complexity_level, provider]
        self.provider_ids = []
    
    def set_provider_ids(self, provider_ids: List[str]):
        """Define IDs de providers"""
        self.provider_ids = provider_ids
    
    def complexity_to_level(self, complexity: float) -> int:
        """Converte complexidade (0-1) para nível (0-9)"""
        return int(complexity * 9)
    
    def choose_provider(self, complexity: float, training: bool = True) -> str:
        """Escolhe provider usando epsilon-greedy"""
        level = self.complexity_to_level(complexity)
        
        if training and np.random.random() < self.epsilon:
            # Exploração: escolher aleatório
            provider_idx = np.random.randint(self.n_providers)
        else:
            # Exploração: escolher melhor
            provider_idx = np.argmax(self.q_table[level])
        
        return self.provider_ids[provider_idx]
    
    def update_q_table(self, complexity: float, provider_idx: int, reward: float):
        """Atualiza Q-table usando Q-learning"""
        level = self.complexity_to_level(complexity)
        
        # Q-learning update
        current_q = self.q_table[level, provider_idx]
        new_q = current_q + self.learning_rate * reward
        self.q_table[level, provider_idx] = new_q
    
    def calculate_reward(self, success: bool, latency: float, cost: float, quality: float) -> float:
        """Calcula reward baseado em sucesso, latência, custo e qualidade"""
        if not success:
            return -1.0
        
        # Reward positivo ajustado por latência e custo
        latency_penalty = min(latency / 5000.0, 1.0)  # Normalizar latência (5s = 1.0)
        cost_penalty = min(cost / 0.1, 1.0)  # Normalizar custo ($0.1 = 1.0)
        
        reward = quality * (1.0 - 0.3 * latency_penalty - 0.3 * cost_penalty)
        return reward
    
    def train(self, episodes: List[Dict]):
        """Treina router com episódios"""
        for episode in episodes:
            complexity = episode["complexity"]
            provider_id = episode["provider_id"]
            provider_idx = self.provider_ids.index(provider_id)
            
            success = episode["success"]
            latency = episode["latency"]
            cost = episode["cost"]
            quality = episode["quality"]
            
            reward = self.calculate_reward(success, latency, cost, quality)
            self.update_q_table(complexity, provider_idx, reward)
        
        logger.info(f"Training complete with {len(episodes)} episodes")

# Uso
rl_router = RLRouter(n_providers=3)
rl_router.set_provider_ids(["openai_gpt4o", "openai_gpt4o_mini", "ollama_llama3"])

# Simular episódios de treinamento
episodes = [
    {"complexity": 0.9, "provider_id": "openai_gpt4o", "success": True, "latency": 2000, "cost": 0.05, "quality": 0.95},
    {"complexity": 0.5, "provider_id": "openai_gpt4o_mini", "success": True, "latency": 500, "cost": 0.0015, "quality": 0.85},
    {"complexity": 0.3, "provider_id": "ollama_llama3", "success": True, "latency": 3000, "cost": 0.0, "quality": 0.75},
    {"complexity": 0.8, "provider_id": "openai_gpt4o", "success": False, "latency": 5000, "cost": 0.1, "quality": 0.0},
]

rl_router.train(episodes)

# Usar router treinado
provider = rl_router.choose_provider(complexity=0.7, training=False)
print(f"Selected provider: {provider}")
```

## Gap 3: Cost-Aware Routing

### Conceito

Routing baseado em custo com orçamento por sessão/projeto. Diferente de routing apenas por performance, cost-aware routing otimiza economia.

### Implementação com Cost-Aware Routing

```python
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class Budget:
    """Orçamento"""
    total: float
    spent: float = 0.0
    remaining: float = 0.0
    
    def __post_init__(self):
        self.remaining = self.total - self.spent
    
    def can_afford(self, cost: float) -> bool:
        """Verifica se pode custear"""
        return self.spent + cost <= self.total
    
    def spend(self, cost: float):
        """Gasta do orçamento"""
        if self.can_afford(cost):
            self.spent += cost
            self.remaining = self.total - self.spent
            return True
        return False

class CostAwareRouter:
    """Router com awareness de custo"""
    
    def __init__(self):
        self.budgets: Dict[str, Budget] = {}  # session_id -> Budget
        self.provider_costs: Dict[str, float] = {}  # provider_id -> cost_per_1k_tokens
    
    def set_budget(self, session_id: str, total_budget: float):
        """Define orçamento para sessão"""
        self.budgets[session_id] = Budget(total=total_budget)
        logger.info(f"Set budget ${total_budget} for session {session_id}")
    
    def set_provider_cost(self, provider_id: str, cost_per_1k_tokens: float):
        """Define custo por provider"""
        self.provider_costs[provider_id] = cost_per_1k_tokens
    
    def route_with_budget(self, session_id: str, capable_providers: List[str], estimated_tokens: int) -> Optional[str]:
        """Roteia considerando预算"""
        if session_id not in self.budgets:
            logger.warning(f"No budget set for session {session_id}")
            return capable_providers[0] if capable_providers else None
        
        budget = self.budgets[session_id]
        
        # Calcular custo estimado para cada provider
        provider_costs = {}
        for provider_id in capable_providers:
            cost_per_1k = self.provider_costs.get(provider_id, 0.01)
            estimated_cost = (estimated_tokens / 1000) * cost_per_1k
            provider_costs[provider_id] = estimated_cost
        
        # Filtrar providers que cabem no orçamento
        affordable_providers = [
            p for p in capable_providers
            if budget.can_afford(provider_costs[p])
        ]
        
        if not affordable_providers:
            logger.warning(f"No affordable providers for session {session_id}")
            return None
        
        # Escolher provider mais barato que cabe no orçamento
        cheapest = min(affordable_providers, key=lambda p: provider_costs[p])
        
        # Gastar do orçamento
        budget.spend(provider_costs[cheapest])
        
        logger.info(f"Routed to {cheapest} (cost: ${provider_costs[cheapest]:.4f}, remaining: ${budget.remaining:.4f})")
        
        return cheapest
    
    def get_budget_status(self, session_id: str) -> Optional[Dict]:
        """Retorna status do orçamento"""
        if session_id not in self.budgets:
            return None
        
        budget = self.budgets[session_id]
        return {
            "total": budget.total,
            "spent": budget.spent,
            "remaining": budget.remaining,
            "utilization": budget.spent / budget.total if budget.total > 0 else 0
        }

# Uso
cost_router = CostAwareRouter()

# Definir orçamento
cost_router.set_budget("session_123", total_budget=0.50)

# Definir custos de providers
cost_router.set_provider_cost("openai_gpt4o", 0.005)
cost_router.set_provider_cost("openai_gpt4o_mini", 0.00015)
cost_router.set_provider_cost("ollama_llama3", 0.0)

# Rotear com budget
provider = cost_router.route_with_budget(
    session_id="session_123",
    capable_providers=["openai_gpt4o", "openai_gpt4o_mini", "ollama_llama3"],
    estimated_tokens=10000
)

print(f"Selected provider: {provider}")

# Verificar status do orçamento
status = cost_router.get_budget_status("session_123")
print(f"Budget status: {status}")
```

## Gap 4: Provider-Agnostic Routing

### Conceito

Routing que aceita qualquer provider, não limitado a provedores específicos. Diferente de routing hard-coded, provider-agnostic routing permite flexibilidade.

### Implementação com Provider-Agnostic Adapter

```python
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProviderAdapter(ABC):
    """Adapter abstrato para providers"""
    
    @abstractmethod
    def get_name(self) -> str:
        """Retorna nome do provider"""
        pass
    
    @abstractmethod
    def get_model_id(self) -> str:
        """Retorna ID do modelo"""
        pass
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Gera resposta"""
        pass
    
    @abstractmethod
    def get_capabilities(self) -> Dict[str, bool]:
        """Retorna capabilities"""
        pass

class OpenAIAdapter(ProviderAdapter):
    """Adapter para OpenAI"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
    
    def get_name(self) -> str:
        return "openai"
    
    def get_model_id(self) -> str:
        return self.model
    
    async def generate(self, prompt: str, **kwargs) -> str:
        # Em produção, usar OpenAI API real
        logger.info(f"OpenAI generating with model {self.model}")
        return f"Response from {self.model}"
    
    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "streaming": True,
            "function_calling": True,
            "vision": True,
            "json_mode": True
        }

class AnthropicAdapter(ProviderAdapter):
    """Adapter para Anthropic"""
    
    def __init__(self, api_key: str, model: str = "claude-opus-4"):
        self.api_key = api_key
        self.model = model
    
    def get_name(self) -> str:
        return "anthropic"
    
    def get_model_id(self) -> str:
        return self.model
    
    async def generate(self, prompt: str, **kwargs) -> str:
        # Em produção, usar Anthropic API real
        logger.info(f"Anthropic generating with model {self.model}")
        return f"Response from {self.model}"
    
    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "streaming": True,
            "function_calling": True,
            "vision": True,
            "json_mode": False
        }

class ProviderAgnosticGateway:
    """Gateway provider-agnostic"""
    
    def __init__(self):
        self.adapters: Dict[str, ProviderAdapter] = {}
        self.default_adapter: Optional[str] = None
    
    def register_adapter(self, adapter: ProviderAdapter, is_default: bool = False):
        """Registra adapter"""
        provider_name = adapter.get_name()
        self.adapters[provider_name] = adapter
        
        if is_default:
            self.default_adapter = provider_name
        
        logger.info(f"Registered adapter {provider_name}")
    
    async def generate(self, prompt: str, provider: Optional[str] = None, **kwargs) -> str:
        """Gera resposta usando provider especificado ou default"""
        if provider is None:
            provider = self.default_adapter
        
        if provider is None:
            raise ValueError("No provider specified and no default set")
        
        if provider not in self.adapters:
            raise ValueError(f"Provider {provider} not registered")
        
        adapter = self.adapters[provider]
        return await adapter.generate(prompt, **kwargs)
    
    def get_available_providers(self) -> List[str]:
        """Retorna providers disponíveis"""
        return list(self.adapters.keys())
    
    def get_provider_capabilities(self, provider: str) -> Optional[Dict[str, bool]]:
        """Retorna capabilities de um provider"""
        if provider not in self.adapters:
            return None
        
        return self.adapters[provider].get_capabilities()

# Uso
gateway = ProviderAgnosticGateway()

# Registrar adapters
gateway.register_adapter(OpenAIAdapter(api_key="sk-...", model="gpt-4o"), is_default=True)
gateway.register_adapter(AnthropicAdapter(api_key="sk-ant-...", model="claude-opus-4"))

# Gerar com provider específico
response = await gateway.generate("Hello, world!", provider="openai")
print(f"Response: {response}")

# Gerar com provider default
response = await gateway.generate("Hello, world!")
print(f"Response: {response}")

# Listar providers disponíveis
providers = gateway.get_available_providers()
print(f"Available providers: {providers}")
```

## Recomendações de Implementação

### Para MVP
1. **Multi-sidekick routing básico:** Implementar com 3-5 sidekicks
2. **Cost-aware routing básico:** Implementar com orçamento por sessão
3. **Provider-agnostic adapter:** Implementar adapter para 2-3 providers

### Para Produção
1. **Multi-sidekick routing avançado:** Adicionar RL routing
2. **Cost-aware routing avançado:** Implementar orçamento por projeto com alertas
3. **Provider-agnostic routing:** Implementar adapter para 10+ providers
4. **Provider-specific features:** Implementar features específicas de cada provider

## Integração com IDEIA-master

Os packages do IDEIA-master relevantes:
- `llm-provider`: Para integração de providers
- `llm-gateway`: Para gateway de providers
- `llm-integration`: Para integração avançada

## Referências

- LiteLLM: https://docs.litellm.ai/
- OpenRouter: https://openrouter.ai/docs
- Ollama: https://ollama.com/
- vLLM: https://docs.vllm.ai/
