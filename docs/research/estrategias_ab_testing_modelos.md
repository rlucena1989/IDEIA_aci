# Estratégias de A/B Testing de Modelos

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e implementações de A/B testing para comparar performance de modelos de LLM

## Visão geral

A/B testing de modelos é essencial para comparar diferentes modelos de LLM, otimizar performance e garantir que mudanças não degradam qualidade. Diferentes estratégias oferecem trade-offs entre precisão estatística, tempo de teste e complexidade de implementação.

## Estratégias de A/B testing

### 1. Random Split (Divisão aleatória)

**Princípio:** Dividir tráfego aleatoriamente entre modelos

**Características:**
- Implementação simples
- Resultados rápidos
- Requer volume significativo para significância estatística
- Adequado para testes rápidos

**Implementação:**
```python
import random
from typing import Dict, Any

class RandomSplitABTest:
    def __init__(self, models: Dict[str, Any], split_ratio: Dict[str, float]):
        """
        models: {model_name: model_instance}
        split_ratio: {model_name: percentage} (ex: {'gpt-4': 0.5, 'claude-3': 0.5})
        """
        self.models = models
        self.split_ratio = split_ratio
        self.model_names = list(split_ratio.keys())
        self.ratios = list(split_ratio.values())
    
    def get_model(self) -> str:
        """Selecionar modelo aleatoriamente baseado na proporção"""
        return random.choices(self.model_names, weights=self.ratios, k=1)[0]
    
    def execute(self, prompt: str) -> Dict[str, Any]:
        """Executar prompt no modelo selecionado"""
        model_name = self.get_model()
        model = self.models[model_name]
        
        result = model.generate(prompt)
        
        return {
            'model': model_name,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }

# Uso
models = {
    'gpt-4': GPT4Model(),
    'claude-3': Claude3Model()
}

ab_test = RandomSplitABTest(models, {'gpt-4': 0.5, 'claude-3': 0.5})
result = ab_test.execute("Qual é a capital da França?")
```

### 2. Hash-based Split (Divisão por hash)

**Princípio:** Usar hash de user ID ou request ID para consistência

**Características:**
- Consistente para mesmo usuário
- Implementação simples
- Adequado para testes de usuário
- Requer identificador único

**Implementação:**
```python
import hashlib

class HashBasedABTest:
    def __init__(self, models: Dict[str, Any], split_ratio: Dict[str, float]):
        self.models = models
        self.split_ratio = split_ratio
        self.model_names = list(split_ratio.keys())
        self.cumulative_ratios = []
        cumulative = 0
        for ratio in split_ratio.values():
            cumulative += ratio
            self.cumulative_ratios.append(cumulative)
    
    def get_model(self, identifier: str) -> str:
        """Selecionar modelo baseado em hash do identificador"""
        # Calcular hash
        hash_value = int(hashlib.md5(identifier.encode()).hexdigest(), 16)
        normalized = hash_value / (2**256 - 1)
        
        # Selecionar modelo baseado na proporção
        for i, threshold in enumerate(self.cumulative_ratios):
            if normalized < threshold:
                return self.model_names[i]
        
        return self.model_names[-1]
    
    def execute(self, prompt: str, user_id: str) -> Dict[str, Any]:
        """Executar prompt no modelo selecionado"""
        model_name = self.get_model(user_id)
        model = self.models[model_name]
        
        result = model.generate(prompt)
        
        return {
            'model': model_name,
            'result': result,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        }

# Uso
ab_test = HashBasedABTest(models, {'gpt-4': 0.5, 'claude-3': 0.5})
result = ab_test.execute("Qual é a capital da França?", user_id="user-123")
```

### 3. Multi-armed Bandit (Bandido multi-brasado)

**Princípio:** Balancear exploração e exploração dinamicamente

**Características:**
- Otimiza automaticamente para melhor modelo
- Reduz custo ao longo do tempo
- Implementação mais complexa
- Adequado para otimização contínua

**Implementação (Thompson Sampling):**
```python
import numpy as np
from typing import Dict, Any

class ThompsonSamplingABTest:
    def __init__(self, models: Dict[str, Any]):
        self.models = models
        self.model_names = list(models.keys())
        # Estatísticas para cada modelo: (successes, failures)
        self.stats = {name: [1, 1] for name in self.model_names}  # Beta prior
    
    def get_model(self) -> str:
        """Selecionar modelo usando Thompson Sampling"""
        samples = {}
        
        for name in self.model_names:
            alpha, beta = self.stats[name]
            # Amostrar da distribuição Beta
            samples[name] = np.random.beta(alpha, beta)
        
        # Selecionar modelo com maior amostra
        return max(samples, key=samples.get)
    
    def update_stats(self, model_name: str, success: bool):
        """Atualizar estatísticas após feedback"""
        alpha, beta = self.stats[model_name]
        
        if success:
            self.stats[model_name] = [alpha + 1, beta]
        else:
            self.stats[model_name] = [alpha, beta + 1]
    
    def execute(self, prompt: str) -> Dict[str, Any]:
        """Executar prompt no modelo selecionado"""
        model_name = self.get_model()
        model = self.models[model_name]
        
        result = model.generate(prompt)
        
        # Avaliar sucesso (ex: qualidade da resposta)
        success = evaluate_quality(result)
        self.update_stats(model_name, success)
        
        return {
            'model': model_name,
            'result': result,
            'success': success,
            'stats': self.stats,
            'timestamp': datetime.now().isoformat()
        }

def evaluate_quality(result: str) -> bool:
    """Avaliar qualidade da resposta (simplificado)"""
    # Implementar lógica de avaliação
    return len(result) > 50  # Exemplo simplificado

# Uso
ab_test = ThompsonSamplingABTest(models)
result = ab_test.execute("Qual é a capital da França?")
```

### 4. Sequential Testing (Teste sequencial)

**Princípio:** Testar modelos sequencialmente com critérios de parada

**Características:**
- Economiza recursos
- Para teste quando modelo vencedor é claro
- Requer critérios de parada bem definidos
- Adequado para testes de longo prazo

**Implementação:**
```python
from scipy import stats

class SequentialABTest:
    def __init__(self, models: Dict[str, Any], min_samples=100, confidence=0.95):
        self.models = models
        self.model_names = list(models.keys())
        self.min_samples = min_samples
        self.confidence = confidence
        self.results = {name: [] for name in self.model_names}
    
    def execute(self, prompt: str) -> Dict[str, Any]:
        """Executar prompt em todos os modelos"""
        results = {}
        
        for name in self.model_names:
            model = self.models[name]
            result = model.generate(prompt)
            score = evaluate_score(result)
            
            self.results[name].append(score)
            results[name] = {
                'result': result,
                'score': score
            }
        
        # Verificar se podemos parar
        if self.should_stop():
            winner = self.get_winner()
            return {
                'winner': winner,
                'results': results,
                'stopped': True
            }
        
        return {
            'results': results,
            'stopped': False
        }
    
    def should_stop(self) -> bool:
        """Verificar se devemos parar o teste"""
        # Verificar se temos amostras suficientes
        for name in self.model_names:
            if len(self.results[name]) < self.min_samples:
                return False
        
        # Teste estatístico (t-test)
        if len(self.model_names) == 2:
            name1, name2 = self.model_names
            t_stat, p_value = stats.ttest_ind(
                self.results[name1],
                self.results[name2]
            )
            
            # Se p-value < alpha, temos diferença significativa
            if p_value < (1 - self.confidence):
                return True
        
        return False
    
    def get_winner(self) -> str:
        """Retornar modelo com melhor média"""
        means = {}
        for name in self.model_names:
            means[name] = np.mean(self.results[name])
        
        return max(means, key=means.get)

def evaluate_score(result: str) -> float:
    """Avaliar score da resposta (0-1)"""
    # Implementar lógica de avaliação
    return min(len(result) / 100, 1.0)  # Exemplo simplificado

# Uso
ab_test = SequentialABTest(models, min_samples=100, confidence=0.95)
result = ab_test.execute("Qual é a capital da França?")
```

## Métricas de avaliação

### 1. Qualidade da resposta

**Definição:** Avaliação subjetiva ou objetiva da qualidade

**Implementação:**
```python
def evaluate_quality(result: str, expected: str = None) -> float:
    """Avaliar qualidade da resposta (0-1)"""
    score = 0.0
    
    # Comprimento adequado
    if 50 <= len(result) <= 500:
        score += 0.3
    
    # Contém palavras-chave
    keywords = ['capital', 'França', 'Paris']
    if any(keyword in result.lower() for keyword in keywords):
        score += 0.4
    
    # Coerência gramatical
    if is_grammatically_correct(result):
        score += 0.3
    
    return score

def is_grammatically_correct(text: str) -> bool:
    """Verificar correção gramatical (simplificado)"""
    # Implementar verificação gramatical
    return True
```

### 2. Latência

**Definição:** Tempo de resposta do modelo

**Implementação:**
```python
import time

def measure_latency(model, prompt: str) -> float:
    """Medir latência do modelo em segundos"""
    start = time.time()
    result = model.generate(prompt)
    end = time.time()
    
    return end - start
```

### 3. Custo

**Definição:** Custo por requisição (tokens)

**Implementação:**
```python
def measure_cost(model, prompt: str, result: str) -> float:
    """Medir custo da requisição em USD"""
    input_tokens = count_tokens(prompt)
    output_tokens = count_tokens(result)
    
    # Preços por 1M tokens (exemplo)
    input_price = model.input_price_per_1m_tokens
    output_price = model.output_price_per_1m_tokens
    
    cost = (input_tokens * input_price / 1_000_000) + \
           (output_tokens * output_price / 1_000_000)
    
    return cost

def count_tokens(text: str) -> int:
    """Contar tokens (simplificado)"""
    return len(text.split())  # Exemplo simplificado
```

### 4. Satisfação do usuário

**Definição:** Feedback do usuário sobre a resposta

**Implementação:**
```python
def collect_user_feedback(result: str) -> float:
    """Coletar feedback do usuário (0-1)"""
    # Implementar coleta de feedback (ex: thumbs up/down, rating)
    # Retornar score normalizado
    pass
```

## Framework de A/B testing

### Implementação completa

```python
from typing import Dict, Any, List
from datetime import datetime
import json

class ABTestingFramework:
    def __init__(self, models: Dict[str, Any], strategy: str = "random"):
        self.models = models
        self.strategy = strategy
        self.results = []
        
        # Inicializar estratégia
        if strategy == "random":
            self.ab_test = RandomSplitABTest(models, {name: 0.5 for name in models.keys()})
        elif strategy == "hash":
            self.ab_test = HashBasedABTest(models, {name: 0.5 for name in models.keys()})
        elif strategy == "bandit":
            self.ab_test = ThompsonSamplingABTest(models)
        elif strategy == "sequential":
            self.ab_test = SequentialABTest(models)
    
    def execute_test(self, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Executar teste A/B"""
        if self.strategy in ["random", "bandit"]:
            result = self.ab_test.execute(prompt)
        elif self.strategy == "hash":
            result = self.ab_test.execute(prompt, user_id)
        elif self.strategy == "sequential":
            result = self.ab_test.execute(prompt)
        
        # Medir métricas
        model = self.models[result['model']]
        
        # Latência
        start = time.time()
        model_result = model.generate(prompt)
        latency = time.time() - start
        
        # Custo
        cost = measure_cost(model, prompt, model_result)
        
        # Qualidade
        quality = evaluate_quality(model_result)
        
        # Adicionar resultado
        test_result = {
            'model': result['model'],
            'prompt': prompt,
            'result': model_result,
            'latency': latency,
            'cost': cost,
            'quality': quality,
            'timestamp': datetime.now().isoformat()
        }
        
        self.results.append(test_result)
        
        return test_result
    
    def get_statistics(self) -> Dict[str, Any]:
        """Calcular estatísticas do teste"""
        stats = {}
        
        for model_name in self.models.keys():
            model_results = [r for r in self.results if r['model'] == model_name]
            
            if model_results:
                stats[model_name] = {
                    'count': len(model_results),
                    'avg_latency': np.mean([r['latency'] for r in model_results]),
                    'avg_cost': np.mean([r['cost'] for r in model_results]),
                    'avg_quality': np.mean([r['quality'] for r in model_results]),
                    'total_cost': sum([r['cost'] for r in model_results])
                }
        
        return stats
    
    def get_winner(self) -> str:
        """Determinar modelo vencedor"""
        stats = self.get_statistics()
        
        # Ponderar métricas (ajustar pesos conforme necessário)
        scores = {}
        for model_name, model_stats in stats.items():
            score = (
                model_stats['avg_quality'] * 0.5 +
                (1 / model_stats['avg_latency']) * 0.3 +
                (1 / model_stats['avg_cost']) * 0.2
            )
            scores[model_name] = score
        
        return max(scores, key=scores.get)
    
    def save_results(self, filepath: str):
        """Salvar resultados em arquivo JSON"""
        with open(filepath, 'w') as f:
            json.dump({
                'results': self.results,
                'statistics': self.get_statistics(),
                'winner': self.get_winner()
            }, f, indent=2)
```

## Análise estatística

### Teste de significância

```python
from scipy import stats

def statistical_significance_test(results_a: List[float], results_b: List[float], confidence: float = 0.95):
    """Teste de significância estatística (t-test)"""
    t_stat, p_value = stats.ttest_ind(results_a, results_b)
    
    alpha = 1 - confidence
    significant = p_value < alpha
    
    return {
        't_statistic': t_stat,
        'p_value': p_value,
        'significant': significant,
        'confidence': confidence
    }
```

### Intervalo de confiança

```python
import numpy as np

def confidence_interval(data: List[float], confidence: float = 0.95):
    """Calcular intervalo de confiança"""
    n = len(data)
    mean = np.mean(data)
    std_err = stats.sem(data)
    
    h = std_err * stats.t.ppf((1 + confidence) / 2, n - 1)
    
    return {
        'mean': mean,
        'lower': mean - h,
        'upper': mean + h,
        'confidence': confidence
    }
```

## Recomendações

### Para testes rápidos
- **Estratégia:** Random split
- **Amostra:** 100-1000 requisições
- **Métricas:** Qualidade, latência
- **Duração:** 1-2 dias

### Para otimização contínua
- **Estratégia:** Multi-armed bandit
- **Amostra:** Contínua
- **Métricas:** Qualidade, custo
- **Duração:** Longo prazo

### Para testes de usuário
- **Estratégia:** Hash-based split
- **Amostra:** 1000-10000 usuários
- **Métricas:** Satisfação, retenção
- **Duração:** 1-4 semanas

### Para comparação rigorosa
- **Estratégia:** Sequential testing
- **Amostra:** 1000+ requisições
- **Métricas:** Todas
- **Duração:** 1-2 semanas

## Próximos passos

1. **Escolher estratégia:** Selecionar baseado em objetivo
2. **Definir métricas:** Qualidade, latência, custo
3. **Implementar framework:** Criar sistema de A/B testing
4. **Executar teste:** Coletar dados
5. **Analisar resultados:** Teste estatístico
6. **Tomar decisão:** Selecionar modelo vencedor

## Referências

- A/B Testing Guide: https://optimizely.com/optimization-glossary/ab-testing/
- Multi-armed Bandit: https://en.wikipedia.org/wiki/Multi-armed_bandit
- Thompson Sampling: https://en.wikipedia.org/wiki/Thompson_sampling
- Statistical Significance: https://en.wikipedia.org/wiki/Statistical_significance
