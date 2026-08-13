# Token Optimization

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar token optimization baseado em gaps competitivos

## Visão Geral

Token optimization é crítico para reduzir custo e latência. Diferente de sistemas sem otimização, IDEIA_aci precisa de token optimization com prompt compression, token counting, token budgeting e token-aware routing.

## Arquitetura de Token Optimization

### Componentes

```
┌─────────────────────────────────────┐
│   Token Counter                     │  ← Contagem de tokens
├─────────────────────────────────────┤
│   Prompt Compressor                 │  ← Compressão de prompts
├─────────────────────────────────────┤
│   Token Budget Manager              │  ← Gerenciamento de budget
├─────────────────────────────────────┤
│   Token-Aware Router               │  ← Routing baseado em tokens
└─────────────────────────────────────┘
```

## Gap 1: Prompt Compression

### Conceito

Compressão de prompts para reduzir token usage. Diferente de prompts não comprimidos, prompt compression usa summarization e pruning.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Prompt Compression

```python
from typing import List, Dict
import re

class PromptCompressor:
    """Compressor de prompts"""
    
    def __init__(self):
        self.compression_strategies = [
            "remove_redundancy",
            "summarize_context",
            "prune_examples",
            "remove_whitespace"
        ]
    
    def compress(self, prompt: str, max_tokens: int) -> str:
        """Comprime prompt para caber no limite de tokens"""
        current_tokens = self._count_tokens(prompt)
        
        if current_tokens <= max_tokens:
            return prompt
        
        # Aplicar estratégias de compressão
        compressed = prompt
        
        for strategy in self.compression_strategies:
            if self._count_tokens(compressed) <= max_tokens:
                break
            
            compressed = self._apply_strategy(compressed, strategy)
        
        return compressed
    
    def _count_tokens(self, text: str) -> int:
        """Conta tokens (regra simples: 1 token ≈ 4 caracteres)"""
        return len(text) // 4
    
    def _apply_strategy(self, prompt: str, strategy: str) -> str:
        """Aplica estratégia de compressão"""
        if strategy == "remove_redundancy":
            return self._remove_redundancy(prompt)
        elif strategy == "summarize_context":
            return self._summarize_context(prompt)
        elif strategy == "prune_examples":
            return self._prune_examples(prompt)
        elif strategy == "remove_whitespace":
            return self._remove_whitespace(prompt)
        return prompt
    
    def _remove_redundancy(self, prompt: str) -> str:
        """Remove redundância"""
        # Remover repetições
        lines = prompt.split("\n")
        seen = set()
        unique_lines = []
        
        for line in lines:
            if line not in seen:
                seen.add(line)
                unique_lines.append(line)
        
        return "\n".join(unique_lines)
    
    def _summarize_context(self, prompt: str) -> str:
        """Sumariza contexto (simulado)"""
        # Em produção, usar LLM para summarization
        words = prompt.split()
        
        if len(words) > 500:
            return " ".join(words[:250]) + "... [context summarized]"
        
        return prompt
    
    def _prune_examples(self, prompt: str) -> str:
        """Remove exemplos desnecessários"""
        # Remover blocos de exemplo
        lines = prompt.split("\n")
        pruned = []
        in_example = False
        
        for line in lines:
            if "Example:" in line or "example:" in line:
                in_example = True
                continue
            
            if in_example and line.strip() == "":
                in_example = False
                continue
            
            if not in_example:
                pruned.append(line)
        
        return "\n".join(pruned)
    
    def _remove_whitespace(self, prompt: str) -> str:
        """Remove whitespace excessivo"""
        # Remover múltiplas linhas em branco
        compressed = re.sub(r"\n\s*\n", "\n\n", prompt)
        # Remover espaços excessivos
        compressed = re.sub(r" +", " ", compressed)
        
        return compressed

# Uso
compressor = PromptCompressor()

long_prompt = """
This is a very long prompt that needs to be compressed.
It contains a lot of redundant information.
This is a very long prompt that needs to be compressed.
It contains a lot of redundant information.

Example:
Here is an example that can be pruned.
It takes up a lot of tokens.
This is a very long prompt that needs to be compressed.
It contains a lot of redundant information.
"""

compressed = compressor.compress(long_prompt, max_tokens=100)
print(f"Compressed prompt: {compressed}")
```

## Gap 2: Token Counting

### Conceito

Contagem precisa de tokens para diferentes modelos. Diferente de estimativa grosseira, token counting usa tokenizers específicos de cada modelo.

### Implementação com Token Counting

```python
from typing import Dict
import tiktoken

class TokenCounter:
    """Contador de tokens multi-modelo"""
    
    def __init__(self):
        self.encoders: Dict[str, any] = {}
        self._load_encoders()
    
    def _load_encoders(self):
        """Carrega tokenizers de diferentes modelos"""
        # OpenAI models
        self.encoders["gpt-4o"] = tiktoken.encoding_for_model("gpt-4o")
        self.encoders["gpt-4o-mini"] = tiktoken.encoding_for_model("gpt-4o-mini")
        self.encoders["gpt-3.5-turbo"] = tiktoken.encoding_for_model("gpt-3.5-turbo")
        
        # Claude (aproximado com cl100k_base)
        self.encoders["claude-opus-4"] = tiktoken.get_encoding("cl100k_base")
        self.encoders["claude-sonnet-4"] = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str, model: str) -> int:
        """Conta tokens para um modelo específico"""
        if model not in self.encoders:
            # Fallback para cl100k_base
            encoder = tiktoken.get_encoding("cl100k_base")
        else:
            encoder = self.encoders[model]
        
        return len(encoder.encode(text))
    
    def count_messages_tokens(self, messages: list, model: str) -> int:
        """Conta tokens em mensagens (formato OpenAI)"""
        if model not in self.encoders:
            encoder = tiktoken.get_encoding("cl100k_base")
        else:
            encoder = self.encoders[model]
        
        # Estimar tokens de mensagens (simplificado)
        total = 0
        
        for message in messages:
            # Tokens do conteúdo
            total += len(encoder.encode(message.get("content", "")))
            
            # Overhead de role e estrutura (~4 tokens por mensagem)
            total += 4
        
        # Overhead do array de mensagens (~3 tokens)
        total += 3
        
        return total
    
    def estimate_cost(self, text: str, model: str, pricing: Dict[str, float]) -> float:
        """Estima custo baseado em tokens"""
        tokens = self.count_tokens(text, model)
        
        input_price = pricing.get(f"{model}_input", 0.0)
        output_price = pricing.get(f"{model}_output", 0.0)
        
        # Assumindo 50% input, 50% output
        cost = (tokens * 0.5 * input_price / 1000) + (tokens * 0.5 * output_price / 1000)
        
        return cost

# Uso
token_counter = TokenCounter()

text = "This is a sample text for token counting."
tokens = token_counter.count_tokens(text, "gpt-4o")
print(f"Tokens: {tokens}")

messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
]

message_tokens = token_counter.count_messages_tokens(messages, "gpt-4o")
print(f"Message tokens: {message_tokens}")

pricing = {
    "gpt-4o_input": 0.005,
    "gpt-4o_output": 0.015
}

cost = token_counter.estimate_cost(text, "gpt-4o", pricing)
print(f"Estimated cost: ${cost:.6f}")
```

## Gap 3: Token Budget Management

### Conceito

Gerenciamento de budget de tokens por sessão/projeto. Diferente de sem budget, token budget management previne custos excessivos.

### Implementação com Token Budget

```python
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class TokenBudget:
    """Budget de tokens"""
    total: int
    used: int = 0
    remaining: int = 0
    
    def __post_init__(self):
        self.remaining = self.total - self.used
    
    def can_spend(self, tokens: int) -> bool:
        """Verifica se pode gastar tokens"""
        return self.used + tokens <= self.total
    
    def spend(self, tokens: int) -> bool:
        """Gasta tokens do budget"""
        if self.can_spend(tokens):
            self.used += tokens
            self.remaining = self.total - self.used
            return True
        return False

class TokenBudgetManager:
    """Gerenciador de budget de tokens"""
    
    def __init__(self):
        self.budgets: Dict[str, TokenBudget] = {}  # session_id -> budget
    
    def set_budget(self, session_id: str, total_tokens: int):
        """Define budget para sessão"""
        self.budgets[session_id] = TokenBudget(total=total_tokens)
    
    def check_budget(self, session_id: str, required_tokens: int) -> bool:
        """Verifica se há budget suficiente"""
        if session_id not in self.budgets:
            return False
        
        budget = self.budgets[session_id]
        return budget.can_spend(required_tokens)
    
    def spend_tokens(self, session_id: str, tokens: int) -> bool:
        """Gasta tokens do budget"""
        if session_id not in self.budgets:
            return False
        
        budget = self.budgets[session_id]
        return budget.spend(tokens)
    
    def get_budget_status(self, session_id: str) -> Optional[Dict]:
        """Retorna status do budget"""
        if session_id not in self.budgets:
            return None
        
        budget = self.budgets[session_id]
        return {
            "total": budget.total,
            "used": budget.used,
            "remaining": budget.remaining,
            "utilization": budget.used / budget.total if budget.total > 0 else 0
        }

# Uso
budget_manager = TokenBudgetManager()

# Definir budget
budget_manager.set_budget("session_123", total_tokens=100000)

# Verificar budget
can_spend = budget_manager.check_budget("session_123", 5000)
print(f"Can spend 5000 tokens: {can_spend}")

# Gastar tokens
success = budget_manager.spend_tokens("session_123", 5000)
print(f"Spend success: {success}")

# Verificar status
status = budget_manager.get_budget_status("session_123")
print(f"Budget status: {status}")
```

## Gap 4: Token-Aware Routing

### Conceito

Routing baseado em token budget e custo. Diferente de routing apenas por performance, token-aware routing otimiza custo.

### Implementação com Token-Aware Routing

```python
from typing import Dict, Optional

class TokenAwareRouter:
    """Router com awareness de tokens"""
    
    def __init__(self, token_counter: TokenCounter, budget_manager: TokenBudgetManager):
        self.token_counter = token_counter
        self.budget_manager = budget_manager
        self.model_costs: Dict[str, float] = {}  # model -> cost per 1k tokens
    
    def set_model_cost(self, model: str, cost_per_1k_tokens: float):
        """Define custo por modelo"""
        self.model_costs[model] = cost_per_1k_tokens
    
    def route(self, session_id: str, prompt: str, available_models: list) -> Optional[str]:
        """Roteia baseado em budget e custo"""
        # Contar tokens do prompt
        prompt_tokens = self.token_counter.count_tokens(prompt, "gpt-4o")  # Usar gpt-4o como referência
        
        # Estimar tokens de resposta (assumindo 2x do prompt)
        estimated_total_tokens = prompt_tokens * 3
        
        # Verificar budget
        if not self.budget_manager.check_budget(session_id, estimated_total_tokens):
            logger.warning(f"Insufficient budget for session {session_id}")
            # Tentar modelo mais barato
            cheapest_model = min(available_models, key=lambda m: self.model_costs.get(m, float('inf')))
            return cheapest_model
        
        # Escolher modelo baseado em custo/benefício
        affordable_models = []
        
        for model in available_models:
            cost = self.model_costs.get(model, float('inf'))
            if cost < float('inf'):
                affordable_models.append((model, cost))
        
        if not affordable_models:
            return available_models[0] if available_models else None
        
        # Escolher modelo mais barato que cabe no budget
        affordable_models.sort(key=lambda x: x[1])
        
        for model, cost in affordable_models:
            if self.budget_manager.check_budget(session_id, estimated_total_tokens):
                return model
        
        return affordable_models[0][0] if affordable_models else None

# Uso
token_aware_router = TokenAwareRouter(token_counter, budget_manager)

# Definir custos
token_aware_router.set_model_cost("gpt-4o", 0.005)
token_aware_router.set_model_cost("gpt-4o-mini", 0.00015)
token_aware_router.set_model_cost("ollama_llama3", 0.0)

# Rotear
model = token_aware_router.route(
    session_id="session_123",
    prompt="Generate a REST API endpoint",
    available_models=["gpt-4o", "gpt-4o-mini", "ollama_llama3"]
)

print(f"Selected model: {model}")
```

## Recomendações de Implementação

### Para MVP
1. **Prompt compression básico:** Implementar com estratégias simples
2. **Token counting básico:** Implementar com tiktoken
3. **Token budget básico:** Implementar com budget por sessão

### Para Produção
1. **Prompt compression avançado:** Implementar com LLM-based summarization
2. **Token counting avançado:** Implementar com tokenizers específicos de cada provider
3. **Token budget avançado:** Implementar com budget por projeto com alertas
4. **Token-aware routing:** Implementar com routing inteligente baseado em custo

## Integração com IDEIA-master

O package `token-optimization` do IDEIA-master pode ser usado como base para implementação de token optimization no IDEIA_aci.

## Referências

- TikToken: https://github.com/openai/tiktoken
- LangChain Token Counting: https://python.langchain.com/docs/modules/model_io/prompts/example_parsing/token_counting/
