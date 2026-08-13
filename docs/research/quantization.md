# Quantization

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Quantization baseado em gaps competitivos

## Visão Geral

Quantization reduz tamanho de modelos e melhora performance. Diferente de modelos full-precision, quantization permite execução em hardware mais barato e latência menor.

## Arquitetura de Quantization

### Componentes

```
┌─────────────────────────────────────┐
│   Quantization Engine                │  ← Engine de quantização
├─────────────────────────────────────┤
│   Calibration Engine                │  ← Calibração de quantização
├─────────────────────────────────────┤
│   Evaluation Engine                  │  ← Avaliação de qualidade
├─────────────────────────────────────┤
│   Deployment Engine                  │  ← Deploy de modelos quantizados
└─────────────────────────────────────┘
```

## Gap 1: Post-Training Quantization

### Conceito

Quantização pós-treinamento sem re-treino. Diferente de quant-aware training, PTQ é mais rápido e não requer dados de treino.

### Dependências

```python
pip install numpy
```

### Implementação com PTQ

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import numpy as np

@dataclass
class QuantizationConfig:
    """Configuração de quantização"""
    bits: int = 8  # 4, 8, 16
    method: str = "symmetric"  # symmetric, asymmetric
    per_channel: bool = False
    dynamic: bool = False

class QuantizationEngine:
    """Engine de quantização"""
    
    def __init__(self, config: QuantizationConfig):
        self.config = config
    
    def quantize_tensor(self, tensor: np.ndarray) -> tuple[np.ndarray, Dict]:
        """Quantiza tensor"""
        if self.config.dynamic:
            return self._dynamic_quantization(tensor)
        else:
            return self._static_quantization(tensor)
    
    def _static_quantization(self, tensor: np.ndarray) -> tuple[np.ndarray, Dict]:
        """Quantização estática"""
        # Calcular escala e zero point
        if self.config.method == "symmetric":
            scale = self._calculate_symmetric_scale(tensor, self.config.bits)
            zero_point = 0
        else:
            scale, zero_point = self._calculate_asymmetric_scale(tensor, self.config.bits)
        
        # Quantizar
        qmin = -(2 ** (self.config.bits - 1))
        qmax = 2 ** (self.config.bits - 1) - 1
        
        quantized = np.round(tensor / scale + zero_point)
        quantized = np.clip(quantized, qmin, qmax)
        
        # Metadata para dequantização
        metadata = {
            "scale": scale,
            "zero_point": zero_point,
            "qmin": qmin,
            "qmax": qmax,
            "dtype": f"int{self.config.bits}"
        }
        
        return quantized.astype(f"int{self.config.bits}"), metadata
    
    def _dynamic_quantization(self, tensor: np.ndarray) -> tuple[np.ndarray, Dict]:
        """Quantização dinâmica (per-tensor)"""
        # Calcular escala dinâmica
        max_val = np.max(np.abs(tensor))
        scale = max_val / (2 ** (self.config.bits - 1) - 1)
        
        quantized = np.round(tensor / scale)
        
        metadata = {
            "scale": scale,
            "zero_point": 0,
            "dtype": f"int{self.config.bits}"
        }
        
        return quantized.astype(f"int{self.config.bits}"), metadata
    
    def _calculate_symmetric_scale(self, tensor: np.ndarray, bits: int) -> float:
        """Calcula escala simétrica"""
        max_val = np.max(np.abs(tensor))
        qmax = 2 ** (bits - 1) - 1
        return max_val / qmax
    
    def _calculate_asymmetric_scale(self, tensor: np.ndarray, bits: int) -> tuple[float, int]:
        """Calcula escala assimétrica"""
        qmin = -(2 ** (bits - 1))
        qmax = 2 ** (bits - 1) - 1
        
        min_val = np.min(tensor)
        max_val = np.max(tensor)
        
        scale = (max_val - min_val) / (qmax - qmin)
        zero_point = int(qmin - min_val / scale)
        
        return scale, zero_point
    
    def dequantize(self, quantized: np.ndarray, metadata: Dict) -> np.ndarray:
        """Dequantiza tensor"""
        scale = metadata["scale"]
        zero_point = metadata.get("zero_point", 0)
        
        return (quantized - zero_point) * scale

# Uso
config = QuantizationConfig(bits=8, method="symmetric")
quantizer = QuantizationEngine(config)

# Simular tensor de pesos
weights = np.random.randn(1000, 1000).astype(np.float32)

# Quantizar
quantized, metadata = quantizer.quantize_tensor(weights)

print(f"Original shape: {weights.shape}, dtype: {weights.dtype}")
print(f"Quantized shape: {quantized.shape}, dtype: {quantized.dtype}")
print(f"Compression ratio: {weights.nbytes / quantized.nbytes:.2f}x")

# Dequantizar
dequantized = quantizer.dequantize(quantized, metadata)

# Calcular erro
error = np.mean(np.abs(weights - dequantized))
print(f"Mean absolute error: {error:.6f}")
```

## Gap 2: Quantization-Aware Training

### Conceito

Treinamento aware de quantização para melhor qualidade. Diferente de PTQ, QAT preserva melhor precisão.

### Implementação com QAT

```python
from typing import Dict, Callable
import numpy as np

class QuantizationAwareTraining:
    """Treinamento aware de quantização"""
    
    def __init__(self, config: QuantizationConfig):
        self.config = config
        self.quantizer = QuantizationEngine(config)
        self.fwd_hooks: Dict[str, Callable] = {}
        self.bwd_hooks: Dict[str, Callable] = {}
    
    def prepare_model(self, model: Dict) -> Dict:
        """Prepara modelo para QAT"""
        # Adicionar fake quantização nos pesos
        prepared_model = {}
        
        for layer_name, weights in model.items():
            if isinstance(weights, np.ndarray):
                # Quantizar e dequantizar (fake quantization)
                quantized, metadata = self.quantizer.quantize_tensor(weights)
                dequantized = self.quantizer.dequantize(quantized, metadata)
                
                prepared_model[layer_name] = dequantized
                prepared_model[f"{layer_name}_metadata"] = metadata
            else:
                prepared_model[layer_name] = weights
        
        return prepared_model
    
    def simulate_quantization_error(self, tensor: np.ndarray) -> np.ndarray:
        """Simula erro de quantização durante forward pass"""
        quantized, metadata = self.quantizer.quantize_tensor(tensor)
        dequantized = self.quantizer.dequantize(quantized, metadata)
        return dequantized
    
    def calculate_quantization_loss(self, original: np.ndarray, quantized: np.ndarray) -> float:
        """Calcula loss de quantização"""
        return np.mean((original - quantized) ** 2)

# Uso
qat = QuantizationAwareTraining(QuantizationConfig(bits=8))

# Simular modelo
model = {
    "layer1_weights": np.random.randn(100, 100).astype(np.float32),
    "layer2_weights": np.random.randn(100, 50).astype(np.float32)
}

# Preparar modelo
prepared_model = qat.prepare_model(model)

print(f"Prepared model layers: {list(prepared_model.keys())}")
```

## Gap 3: Quantization Evaluation

### Conceito

Avaliação de qualidade de modelos quantizados. Diferente de sem avaliação, quantization evaluation garante qualidade aceitável.

### Implementação com Evaluation

```python
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class EvaluationResult:
    """Resultado de avaliação"""
    model_name: str
    quantization_bits: int
    accuracy: float
    latency_ms: float
    memory_mb: float
    compression_ratio: float

class QuantizationEvaluator:
    """Avaliador de quantização"""
    
    def __init__(self):
        self.results: List[EvaluationResult] = []
    
    def evaluate(self, model: Dict, quantized_model: Dict, test_data: List) -> EvaluationResult:
        """Avalia modelo quantizado"""
        # Calcular accuracy (simulado)
        accuracy = self._calculate_accuracy(quantized_model, test_data)
        
        # Calcular latência (simulado)
        latency = self._measure_latency(quantized_model)
        
        # Calcular memória
        memory = self._calculate_memory(quantized_model)
        
        # Calcular compression ratio
        original_memory = self._calculate_memory(model)
        compression_ratio = original_memory / memory
        
        result = EvaluationResult(
            model_name="model",
            quantization_bits=8,
            accuracy=accuracy,
            latency_ms=latency,
            memory_mb=memory,
            compression_ratio=compression_ratio
        )
        
        self.results.append(result)
        return result
    
    def _calculate_accuracy(self, model: Dict, test_data: List) -> float:
        """Calcula accuracy (simulado)"""
        # Em produção, rodar inferência real
        return 0.95  # 95% accuracy
    
    def _measure_latency(self, model: Dict) -> float:
        """Mede latência (simulado)"""
        # Em produção, medir tempo real de inferência
        return 15.5  # 15.5ms
    
    def _calculate_memory(self, model: Dict) -> float:
        """Calcula memória em MB"""
        total_bytes = 0
        
        for key, value in model.items():
            if isinstance(value, np.ndarray):
                total_bytes += value.nbytes
            elif isinstance(value, dict) and "dtype" in value:
                # Metadata não conta
                pass
        
        return total_bytes / (1024 * 1024)
    
    def compare_results(self) -> Dict:
        """Compara resultados de diferentes quantizações"""
        if not self.results:
            return {}
        
        comparison = {
            "accuracy_delta": max(r.accuracy for r in self.results) - min(r.accuracy for r in self.results),
            "latency_improvement": max(r.latency_ms for r in self.results) / min(r.latency_ms for r in self.results),
            "memory_improvement": max(r.memory_mb for r in self.results) / min(r.memory_mb for r in self.results)
        }
        
        return comparison

# Uso
evaluator = QuantizationEvaluator()

# Simular avaliação
result = evaluator.evaluate(model, prepared_model, test_data=[])
print(f"Evaluation result: {result}")
```

## Recomendações de Implementação

### Para MVP
1. **PTQ básico:** Implementar com quantização 8-bit
2. **QAT básico:** Implementar com fake quantization
3. **Evaluation básico:** Implementar com métricas simples

### Para Produção
1. **PTQ avançado:** Implementar com 4-bit, mixed precision
2. **QAT avançado:** Implementar com training real
3. **Evaluation avançado:** Implementar com avaliação detalhada
4. **Deployment:** Implementar com deploy de modelos quantizados

## Integração com IDEIA-master

O package `quantization-engine` do IDEIA-master pode ser usado como base para implementação de quantization no IDEIA_aci.

## Referências

- GPTQ: https://github.com/IST-DASLab/gptq
- AWQ: https://github.com/mit-han-lab/llm-awq
- Bitsandbytes: https://github.com/TimDettmers/bitsandbytes
