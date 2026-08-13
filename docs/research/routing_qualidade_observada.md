# Routing Baseado em Qualidade Observada

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Definir estratégia de routing baseado em qualidade observada para múltiplos modelos

## Visão geral

Routing baseado em qualidade observada permite selecionar o modelo mais adequado para cada tarefa com base em métricas de performance observadas em tempo real.

## Métricas de qualidade

### 1. Taxa de sucesso

**Definição:** Proporção de tarefas concluídas com sucesso

**Implementação:**
```javascript
class SuccessRateTracker {
  constructor() {
    this.successes = new Map(); // model -> count
    this.failures = new Map(); // model -> count
  }
  
  recordResult(model, success) {
    if (success) {
      this.successes.set(model, (this.successes.get(model) || 0) + 1);
    } else {
      this.failures.set(model, (this.failures.get(model) || 0) + 1);
    }
  }
  
  getSuccessRate(model) {
    const successes = this.successes.get(model) || 0;
    const failures = this.failures.get(model) || 0;
    const total = successes + failures;
    
    if (total === 0) return 0;
    return successes / total;
  }
}
```

### 2. Tempo de resposta

**Definição:** Tempo médio de resposta por modelo

**Implementação:**
```javascript
class ResponseTimeTracker {
  constructor() {
    this.responseTimes = new Map(); // model -> [times]
  }
  
  recordResponse(model, duration) {
    if (!this.responseTimes.has(model)) {
      this.responseTimes.set(model, []);
    }
    this.responseTimes.get(model).push(duration);
  }
  
  getAverageResponseTime(model) {
    const times = this.responseTimes.get(model) || [];
    if (times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }
  
  getP95ResponseTime(model) {
    const times = this.responseTimes.get(model) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }
}
```

### 3. Custo por token

**Definição:** Custo médio por token por modelo

**Implementação:**
```javascript
class CostTracker {
  constructor() {
    this.costs = new Map(); // model -> {inputTokens, outputTokens, totalCost}
  }
  
  recordCost(model, inputTokens, outputTokens, cost) {
    if (!this.costs.has(model)) {
      this.costs.set(model, { inputTokens: 0, outputTokens: 0, totalCost: 0 });
    }
    
    const modelCost = this.costs.get(model);
    modelCost.inputTokens += inputTokens;
    modelCost.outputTokens += outputTokens;
    modelCost.totalCost += cost;
  }
  
  getAverageCostPerToken(model) {
    const cost = this.costs.get(model);
    if (!cost) return 0;
    
    const totalTokens = cost.inputTokens + cost.outputTokens;
    if (totalTokens === 0) return 0;
    
    return cost.totalCost / totalTokens;
  }
}
```

### 4. Qualidade de resposta

**Definição:** Avaliação subjetiva da qualidade da resposta

**Implementação:**
```javascript
class QualityTracker {
  constructor() {
    this.ratings = new Map(); // model -> [ratings]
  }
  
  recordRating(model, rating) {
    if (!this.ratings.has(model)) {
      this.ratings.set(model, []);
    }
    this.ratings.get(model).push(rating);
  }
  
  getAverageRating(model) {
    const ratings = this.ratings.get(model) || [];
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
  }
}
```

## Algoritmos de routing

### 1. Routing por qualidade

**Implementação:**
```javascript
class QualityBasedRouter {
  constructor(models, qualityTracker) {
    this.models = models;
    this.qualityTracker = qualityTracker;
  }
  
  selectModel(task) {
    let bestModel = null;
    let bestScore = -1;
    
    for (const model of this.models) {
      const score = this.calculateScore(model, task);
      
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    return bestModel;
  }
  
  calculateScore(model, task) {
    const successRate = this.qualityTracker.getSuccessRate(model);
    const responseTime = this.qualityTracker.getAverageResponseTime(model);
    const cost = this.qualityTracker.getAverageCostPerToken(model);
    const quality = this.qualityTracker.getAverageRating(model);
    
    // Ponderar métricas
    const score = (
      successRate * 0.4 +
      (1 / (responseTime + 1)) * 0.2 +
      (1 / (cost + 1)) * 0.2 +
      quality * 0.2
    );
    
    return score;
  }
}
```

### 2. Routing por custo

**Implementação:**
```javascript
class CostBasedRouter {
  constructor(models, costTracker) {
    this.models = models;
    this.costTracker = costTracker;
  }
  
  selectModel(task, budget) {
    let bestModel = null;
    let bestCost = Infinity;
    
    for (const model of this.models) {
      const estimatedCost = this.estimateCost(model, task);
      
      if (estimatedCost <= budget && estimatedCost < bestCost) {
        bestCost = estimatedCost;
        bestModel = model;
      }
    }
    
    return bestModel;
  }
  
  estimateCost(model, task) {
    const inputTokens = this.estimateInputTokens(task);
    const outputTokens = this.estimateOutputTokens(task);
    
    const inputPrice = model.pricing.input;
    const outputPrice = model.pricing.output;
    
    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1000000;
  }
  
  estimateInputTokens(task) {
    // Estimar tokens de input baseado no tamanho do prompt
    return task.prompt.length / 4;
  }
  
  estimateOutputTokens(task) {
    // Estimar tokens de output baseado no tipo de tarefa
    const taskComplexity = this.getTaskComplexity(task);
    return taskComplexity * 100;
  }
}
```

### 3. Routing por latência

**Implementação:**
```javascript
class LatencyBasedRouter {
  constructor(models, responseTimeTracker) {
    this.models = models;
    this.responseTimeTracker = responseTimeTracker;
  }
  
  selectModel(task, maxLatency) {
    let bestModel = null;
    let bestLatency = Infinity;
    
    for (const model of this.models) {
      const latency = this.responseTimeTracker.getAverageResponseTime(model);
      
      if (latency <= maxLatency && latency < bestLatency) {
        bestLatency = latency;
        bestModel = model;
      }
    }
    
    return bestModel;
  }
}
```

### 4. Routing híbrido

**Implementação:**
```javascript
class HybridRouter {
  constructor(models, qualityTracker, costTracker, responseTimeTracker) {
    this.models = models;
    this.qualityTracker = qualityTracker;
    this.costTracker = costTracker;
    this.responseTimeTracker = responseTimeTracker;
  }
  
  selectModel(task, constraints) {
    const { budget, maxLatency, minQuality } = constraints;
    
    // Filtrar modelos que atendem às restrições
    const eligibleModels = this.models.filter(model => {
      const cost = this.costTracker.getAverageCostPerToken(model);
      const latency = this.responseTimeTracker.getAverageResponseTime(model);
      const quality = this.qualityTracker.getAverageRating(model);
      
      return cost <= budget && latency <= maxLatency && quality >= minQuality;
    });
    
    // Selecionar melhor modelo entre os elegíveis
    let bestModel = null;
    let bestScore = -1;
    
    for (const model of eligibleModels) {
      const score = this.calculateScore(model, task);
      
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    return bestModel;
  }
  
  calculateScore(model, task) {
    const successRate = this.qualityTracker.getSuccessRate(model);
    const responseTime = this.responseTimeTracker.getAverageResponseTime(model);
    const cost = this.costTracker.getAverageCostPerToken(model);
    const quality = this.qualityTracker.getAverageRating(model);
    
    // Ponderar métricas
    const score = (
      successRate * 0.3 +
      (1 / (responseTime + 1)) * 0.2 +
      (1 / (cost + 1)) * 0.2 +
      quality * 0.3
    );
    
    return score;
  }
}
```

## Aprendizado contínuo

### 1. Atualização de métricas

**Implementação:**
```javascript
class MetricsUpdater {
  constructor(successRateTracker, responseTimeTracker, costTracker, qualityTracker) {
    this.successRateTracker = successRateTracker;
    this.responseTimeTracker = responseTimeTracker;
    this.costTracker = costTracker;
    this.qualityTracker = qualityTracker;
  }
  
  updateMetrics(model, result) {
    this.successRateTracker.recordResult(model, result.success);
    this.responseTimeTracker.recordResponse(model, result.duration);
    this.costTracker.recordCost(model, result.inputTokens, result.outputTokens, result.cost);
    
    if (result.rating) {
      this.qualityTracker.recordRating(model, result.rating);
    }
  }
}
```

### 2. Ajuste de pesos

**Implementação:**
```javascript
class WeightAdjuster {
  constructor() {
    this.weights = {
      successRate: 0.4,
      responseTime: 0.2,
      cost: 0.2,
      quality: 0.2
    };
  }
  
  adjustWeights(feedback) {
    // Ajustar pesos baseado em feedback
    if (feedback.priority === 'quality') {
      this.weights.quality += 0.1;
      this.weights.cost -= 0.05;
      this.weights.responseTime -= 0.05;
    } else if (feedback.priority === 'cost') {
      this.weights.cost += 0.1;
      this.weights.quality -= 0.05;
      this.weights.responseTime -= 0.05;
    } else if (feedback.priority === 'speed') {
      this.weights.responseTime += 0.1;
      this.weights.quality -= 0.05;
      this.weights.cost -= 0.05;
    }
    
    // Normalizar pesos
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key in this.weights) {
      this.weights[key] /= total;
    }
  }
}
```

## Próximos passos

1. **Implementar trackers:** Criar sistema de tracking de métricas
2. **Implementar routers:** Criar algoritmos de routing
3. **Implementar aprendizado:** Criar sistema de ajuste de pesos
4. **Testar routing:** Validar performance em tarefas reais
5. **Otimizar performance:** Ajustar algoritmos baseado em feedback
6. **Documentar procedimentos:** Criar guia de configuração

## Referências

- Multi-Model Routing: https://arxiv.org/abs/2305.14314
- Dynamic Model Selection: https://arxiv.org/abs/2305.16546
