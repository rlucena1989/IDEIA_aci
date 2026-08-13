# Resilience Engineering

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Resilience Engineering baseado em gaps competitivos

## Visão Geral

Resilience Engineering é crítico para confiabilidade de sistemas distribuídos. Diferente de sistemas sem resiliência, resilience engineering permite recuperação automática de falhas.

## Arquitetura de Resilience Engineering

### Componentes

```
┌─────────────────────────────────────┐
│   Circuit Breaker                    │  ← Circuit breaker
├─────────────────────────────────────┤
│   Retry Mechanism                    │  ← Retry com backoff
├─────────────────────────────────────┤
│   Bulkhead                           │  ← Isolamento de recursos
├─────────────────────────────────────┤
│   Timeout Manager                    │  ← Gestão de timeouts
├─────────────────────────────────────┤
│   Fallback Handler                   │  ← Handler de fallback
└─────────────────────────────────────┘
```

## Gap 1: Circuit Breaker

### Conceito

Circuit breaker previne cascata de falhas. Diferente de sem proteção, circuit breaker isola serviços com falhas.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Circuit Breaker

```python
from typing import Callable, Optional
from dataclasses import dataclass
from enum import Enum
import time
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"  # Normal
    OPEN = "open"  # Falha detectada
    HALF_OPEN = "half_open"  # Tentando recuperação

@dataclass
class CircuitBreakerConfig:
    """Configuração de circuit breaker"""
    failure_threshold: int = 5  # Falhas antes de abrir
    success_threshold: int = 2  # Sucessos antes de fechar
    timeout: timedelta = timedelta(seconds=60)  # Tempo para tentar recuperação

class CircuitBreaker:
    """Circuit breaker"""
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
    
    def call(self, func: Callable, *args, **kwargs):
        """Executa função com circuit breaker"""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar reset"""
        if self.last_failure_time is None:
            return True
        
        return datetime.now() - self.last_failure_time > self.config.timeout
    
    def _on_success(self):
        """Chamado em sucesso"""
        self.failure_count = 0
        
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            
            if self.success_count >= self.config.success_threshold:
                self.state = CircuitState.CLOSED
                self.success_count = 0
    
    def _on_failure(self):
        """Chamado em falha"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        self.success_count = 0
        
        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitState.OPEN
    
    def get_state(self) -> Dict:
        """Retorna estado atual"""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None
        }

# Uso
config = CircuitBreakerConfig(failure_threshold=3, timeout=timedelta(seconds=30))
circuit_breaker = CircuitBreaker(config)

def unreliable_function():
    """Função que falha aleatoriamente"""
    import random
    if random.random() < 0.7:
        raise Exception("Random failure")
    return "Success"

# Executar com circuit breaker
for i in range(10):
    try:
        result = circuit_breaker.call(unreliable_function)
        print(f"Call {i}: {result}")
    except Exception as e:
        print(f"Call {i}: {e}")
    
    print(f"State: {circuit_breaker.get_state()}")
```

## Gap 2: Retry with Backoff

### Conceito

Retry com backoff exponencial para lidar com falhas temporárias. Diferente de retry simples, backoff evita sobrecarga.

### Implementação com Retry

```python
from typing import Callable, Optional
import time
import random

class RetryConfig:
    """Configuração de retry"""
    def __init__(self, max_attempts: int = 3, base_delay: float = 1.0, max_delay: float = 60.0, jitter: bool = True):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.jitter = jitter

class RetryExecutor:
    """Executor com retry"""
    
    def __init__(self, config: RetryConfig):
        self.config = config
    
    def execute(self, func: Callable, *args, **kwargs):
        """Executa função com retry"""
        last_exception = None
        
        for attempt in range(self.config.max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt < self.config.max_attempts - 1:
                    delay = self._calculate_delay(attempt)
                    print(f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s...")
                    time.sleep(delay)
        
        raise last_exception
    
    def _calculate_delay(self, attempt: int) -> float:
        """Calcula delay com backoff exponencial"""
        delay = self.config.base_delay * (2 ** attempt)
        delay = min(delay, self.config.max_delay)
        
        if self.config.jitter:
            delay = delay * (0.5 + random.random() * 0.5)
        
        return delay

# Uso
retry_config = RetryConfig(max_attempts=5, base_delay=1.0, max_delay=30.0)
retry_executor = RetryExecutor(retry_config)

def flaky_function():
    """Função que falha temporariamente"""
    import random
    if random.random() < 0.6:
        raise Exception("Temporary failure")
    return "Success"

try:
    result = retry_executor.execute(flaky_function)
    print(f"Result: {result}")
except Exception as e:
    print(f"Failed after retries: {e}")
```

## Gap 3: Bulkhead

### Conceito

Bulkhead isola recursos para evitar falhas em cascata. Diferente de compartilhamento, bulkhead limita impacto de falhas.

### Implementação com Bulkhead

```python
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor, Future
import threading

class Bulkhead:
    """Bulkhead para isolamento de recursos"""
    
    def __init__(self, name: str, max_concurrent: int):
        self.name = name
        self.max_concurrent = max_concurrent
        self.semaphore = threading.Semaphore(max_concurrent)
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent)
        self.active_tasks: int = 0
        self.lock = threading.Lock()
    
    def submit(self, func, *args, **kwargs) -> Future:
        """Submete tarefa com bulkhead"""
        if not self.semaphore.acquire(blocking=False):
            raise Exception(f"Bulkhead {self.name} is at capacity")
        
        def wrapped_func():
            try:
                with self.lock:
                    self.active_tasks += 1
                
                return func(*args, **kwargs)
            finally:
                with self.lock:
                    self.active_tasks -= 1
                self.semaphore.release()
        
        return self.executor.submit(wrapped_func)
    
    def get_status(self) -> Dict:
        """Retorna status do bulkhead"""
        return {
            "name": self.name,
            "max_concurrent": self.max_concurrent,
            "active_tasks": self.active_tasks,
            "available_slots": self.max_concurrent - self.active_tasks
        }

class BulkheadManager:
    """Gerenciador de bulkheads"""
    
    def __init__(self):
        self.bulkheads: Dict[str, Bulkhead] = {}
    
    def create_bulkhead(self, name: str, max_concurrent: int) -> Bulkhead:
        """Cria bulkhead"""
        bulkhead = Bulkhead(name, max_concurrent)
        self.bulkheads[name] = bulkhead
        return bulkhead
    
    def get_bulkhead(self, name: str) -> Optional[Bulkhead]:
        """Retorna bulkhead por nome"""
        return self.bulkheads.get(name)

# Uso
bulkhead_manager = BulkheadManager()

# Criar bulkheads
llm_bulkhead = bulkhead_manager.create_bulkhead("llm", max_concurrent=5)
db_bulkhead = bulkhead_manager.create_bulkhead("database", max_concurrent=10)

# Submeter tarefas
def task(name: str):
    print(f"Executing {name}")
    time.sleep(1)
    return f"Done {name}"

try:
    future = llm_bulkhead.submit(task, "LLM task 1")
    print(f"Status: {llm_bulkhead.get_status()}")
except Exception as e:
    print(f"Error: {e}")
```

## Recomendações de Implementação

### Para MVP
1. **Circuit breaker básico:** Implementar com estados simples
2. **Retry básico:** Implementar com backoff exponencial
3. **Bulkhead básico:** Implementar com semáforos

### Para Produção
1. **Circuit breaker avançado:** Implementar com métricas e eventos
2. **Retry avançado:** Implementar com retry condicional
3. **Bulkhead avançado:** Implementar com filas e prioridades
4. **Timeout manager:** Implementar com timeouts adaptativos
5. **Fallback handler:** Implementar com fallbacks em cascata

## Integração com IDEIA-master

O package `resilience-engine` do IDEIA-master pode ser usado como base para implementação de resilience engineering no IDEIA_aci.

## Referências

- Resilience4j: https://resilience4j.readme.io/
- Hystrix: https://github.com/Netflix/Hystrix
- Polly: https://github.com/App-vNext/Polly
