# Estratégias de Rate Limiting e Throttling

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e implementações de rate limiting e throttling para controlar uso e custos de LLMs

## Visão geral

Rate limiting e throttling são essenciais para controlar uso de APIs de LLM, prevenir abuso, gerenciar custos e garantir disponibilidade. Diferentes estratégias oferecem trade-offs entre precisão, performance e complexidade.

## Algoritmos de rate limiting

### 1. Token Bucket (Balde de tokens)

**Princípio:** Balde com capacidade fixa que enche a uma taxa constante. Requisições consomem tokens do balde.

**Características:**
- Permite bursts (picos) até a capacidade do balde
- Suaviza tráfego irregular
- Fácil de implementar
- Adequado para APIs com bursts permitidos

**Implementação com Redis:**
```python
import redis
import time

class TokenBucket:
    def __init__(self, redis_client, key, capacity, refill_rate):
        self.redis = redis_client
        self.key = key
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens por segundo
    
    def consume(self, tokens=1):
        now = time.time()
        
        # Usar Lua script para atomicidade
        script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local tokens = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local current_tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        -- Refill tokens
        local elapsed = now - last_refill
        local refill = elapsed * refill_rate
        current_tokens = math.min(capacity, current_tokens + refill)
        
        -- Consumir tokens
        if current_tokens >= tokens then
            current_tokens = current_tokens - tokens
            redis.call('HMSET', key, 'tokens', current_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return 1
        else
            redis.call('HMSET', key, 'tokens', current_tokens, 'last_refill', now)
            redis.call('EXPIRE', key, 3600)
            return 0
        end
        """
        
        result = self.redis.eval(
            script, 1, self.key, 
            self.capacity, self.refill_rate, tokens, now
        )
        
        return result == 1

# Uso
redis_client = redis.Redis()
rate_limiter = TokenBucket(redis_client, "user:123", capacity=10, refill_rate=1)

if rate_limiter.consume():
    # Permitir requisição
    pass
else:
    # Rejeitar (rate limit exceeded)
    pass
```

**Implementação em memória (para single-instance):**
```python
import time
from collections import deque

class MemoryTokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = threading.Lock()
    
    def consume(self, tokens=1):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            
            # Refill tokens
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now
            
            # Consumir tokens
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
```

### 2. Leaky Bucket (Balde com vazamento)

**Princípio:** Requisições entram em uma fila que é processada a uma taxa constante. Excesso é descartado.

**Características:**
- Suaviza tráfego para taxa constante
- Não permite bursts
- Adequado para processamento constante
- Fácil de implementar com filas

**Implementação:**
```python
import time
from collections import deque
import threading

class LeakyBucket:
    def __init__(self, capacity, leak_rate):
        self.capacity = capacity
        self.leak_rate = leak_rate  # requisições por segundo
        self.queue = deque()
        self.lock = threading.Lock()
        self.last_leak = time.time()
    
    def allow(self):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_leak
            
            # Vazar requisições
            leak_amount = elapsed * self.leak_rate
            self.last_leak = now
            
            while leak_amount >= 1 and self.queue:
                self.queue.popleft()
                leak_amount -= 1
            
            # Verificar se há espaço
            if len(self.queue) < self.capacity:
                self.queue.append(now)
                return True
            return False
```

### 3. Fixed Window Counter (Janela fixa)

**Princípio:** Conta requisições em janelas de tempo fixas (ex: 100 requisições por minuto).

**Características:**
- Simples de implementar
- Problema de borda (burst no início da janela)
- Adequado para casos simples
- Não suporta bursts

**Implementação com Redis:**
```python
import redis
import time

class FixedWindowCounter:
    def __init__(self, redis_client, key, limit, window_seconds):
        self.redis = redis_client
        self.key = key
        self.limit = limit
        self.window_seconds = window_seconds
    
    def allow(self):
        now = time.time()
        window_start = int(now // self.window_seconds) * self.window_seconds
        window_key = f"{self.key}:{window_start}"
        
        # Incrementar contador
        count = self.redis.incr(window_key)
        
        # Setar expiração na primeira requisição
        if count == 1:
            self.redis.expire(window_key, self.window_seconds)
        
        return count <= self.limit

# Uso
redis_client = redis.Redis()
rate_limiter = FixedWindowCounter(redis_client, "user:123", limit=100, window_seconds=60)

if rate_limiter.allow():
    # Permitir requisição
    pass
else:
    # Rejeitar
    pass
```

### 4. Sliding Window Log (Janela deslizante)

**Princípio:** Registra timestamp de cada requisição e conta quantas estão na janela deslizante.

**Características:**
- Mais preciso que janela fixa
- Sem problema de borda
- Maior uso de memória
- Adequado para precisão crítica

**Implementação com Redis:**
```python
import redis
import time

class SlidingWindowLog:
    def __init__(self, redis_client, key, limit, window_seconds):
        self.redis = redis_client
        self.key = key
        self.limit = limit
        self.window_seconds = window_seconds
    
    def allow(self):
        now = time.time()
        window_start = now - self.window_seconds
        
        # Remover timestamps antigos
        self.redis.zremrangebyscore(self.key, 0, window_start)
        
        # Contar requisições na janela
        count = self.redis.zcard(self.key)
        
        if count < self.limit:
            # Adicionar timestamp atual
            self.redis.zadd(self.key, {str(now): now})
            self.redis.expire(self.key, self.window_seconds)
            return True
        
        return False
```

### 5. Sliding Window Counter (Janela deslizante otimizada)

**Princípio:** Divide janela em múltiplos buckets e combina contadores para precisão com menos memória.

**Características:**
- Preciso como sliding window log
- Menor uso de memória
- Mais complexo de implementar
- Adequado para alta precisão com escala

**Implementação com Redis:**
```python
import redis
import time

class SlidingWindowCounter:
    def __init__(self, redis_client, key, limit, window_seconds, precision=1):
        self.redis = redis_client
        self.key = key
        self.limit = limit
        self.window_seconds = window_seconds
        self.precision = precision  # segundos por bucket
    
    def allow(self):
        now = time.time()
        current_bucket = int(now // self.precision)
        
        # Criar chave do bucket atual
        bucket_key = f"{self.key}:{current_bucket}"
        
        # Incrementar contador do bucket atual
        count = self.redis.incr(bucket_key)
        self.redis.expire(bucket_key, self.window_seconds)
        
        # Calcular janela deslizante
        buckets_to_consider = int(self.window_seconds / self.precision)
        start_bucket = current_bucket - buckets_to_consider + 1
        
        # Somar contadores de todos os buckets na janela
        total = 0
        for i in range(buckets_to_consider):
            bucket = start_bucket + i
            bucket_key = f"{self.key}:{bucket}"
            bucket_count = self.redis.get(bucket_key)
            if bucket_count:
                total += int(bucket_count)
        
        return total <= self.limit
```

## Estratégias de throttling

### 1. Backoff Exponencial

**Princípio:** Aumentar tempo de espera exponencialmente após cada falha.

**Implementação:**
```python
import time
import random

def exponential_backoff(max_retries=5, base_delay=1, max_delay=60):
    for attempt in range(max_retries):
        try:
            # Tentar requisição
            return make_request()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            
            # Calcular delay com jitter
            delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
            time.sleep(delay)
```

### 2. Adaptive Throttling

**Princípio:** Ajustar taxa dinamicamente baseado em resposta do servidor.

**Implementação:**
```python
class AdaptiveThrottler:
    def __init__(self, initial_rate=10, min_rate=1, max_rate=100):
        self.rate = initial_rate
        self.min_rate = min_rate
        self.max_rate = max_rate
        self.success_count = 0
        self.failure_count = 0
    
    def record_success(self):
        self.success_count += 1
        if self.success_count > 10:
            self.rate = min(self.rate * 1.1, self.max_rate)
            self.success_count = 0
    
    def record_failure(self):
        self.failure_count += 1
        if self.failure_count > 3:
            self.rate = max(self.rate * 0.5, self.min_rate)
            self.failure_count = 0
    
    def get_delay(self):
        return 1.0 / self.rate
```

### 3. Token Bucket com Prioridade

**Princípio:** Múltiplos buckets com diferentes prioridades.

**Implementação:**
```python
class PriorityTokenBucket:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.buckets = {
            'high': TokenBucket(redis_client, 'high', capacity=100, refill_rate=10),
            'medium': TokenBucket(redis_client, 'medium', capacity=50, refill_rate=5),
            'low': TokenBucket(redis_client, 'low', capacity=20, refill_rate=2)
        }
    
    def consume(self, priority='medium', tokens=1):
        # Tentar bucket específico
        if self.buckets[priority].consume(tokens):
            return True
        
        # Fallback para buckets de menor prioridade
        if priority == 'high' and self.buckets['medium'].consume(tokens):
            return True
        if priority == 'medium' and self.buckets['low'].consume(tokens):
            return True
        
        return False
```

## Implementação com middleware

### Express.js middleware

```javascript
const redis = require('redis');
const client = redis.createClient();

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minuto
    this.max = options.max || 100;
    this.keyGenerator = options.keyGenerator || (req => req.ip);
  }
  
  async middleware(req, res, next) {
    const key = this.keyGenerator(req);
    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, this.windowMs / 1000);
    }
    
    if (current > this.max) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(this.windowMs / 1000)
      });
    }
    
    res.setHeader('X-RateLimit-Limit', this.max);
    res.setHeader('X-RateLimit-Remaining', this.max - current);
    
    next();
  }
}

// Uso
const limiter = new RateLimiter({ max: 100, windowMs: 60000 });
app.use('/api', limiter.middleware);
```

### Python FastAPI middleware

```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import redis
import time

class RateLimiter:
    def __init__(self, redis_client, max_requests=100, window_seconds=60):
        self.redis = redis_client
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def __call__(self, request: Request, call_next):
        key = f"rate_limit:{request.client.host}"
        
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, self.window_seconds)
        
        if current > self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests"}
            )
        
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(self.max_requests - current)
        
        return response

# Uso
redis_client = redis.Redis()
limiter = RateLimiter(redis_client, max_requests=100, window_seconds=60)
app.middleware("http")(limiter)
```

## Estratégias por nível

### 1. Nível de usuário

**Escopo:** Por usuário ou API key  
**Limites:** 1000 requisições/dia, 100 requisições/hora  
**Implementação:** Token bucket com Redis  
**Uso:** Controle de uso por cliente

```python
def user_rate_limiter(user_id):
    key = f"user:{user_id}"
    return TokenBucket(redis, key, capacity=100, refill_rate=1/60)  # 100/hora
```

### 2. Nível de endpoint

**Escopo:** Por endpoint ou rota  
**Limites:** 10000 requisições/minuto  
**Implementação:** Sliding window counter  
**Uso:** Proteção de endpoints críticos

```python
def endpoint_rate_limiter(endpoint):
    key = f"endpoint:{endpoint}"
    return SlidingWindowCounter(redis, key, limit=10000, window_seconds=60)
```

### 3. Nível de IP

**Escopo:** Por endereço IP  
**Limites:** 100 requisições/minuto  
**Implementação:** Fixed window counter  
**Uso:** Prevenção de abuso

```python
def ip_rate_limiter(ip):
    key = f"ip:{ip}"
    return FixedWindowCounter(redis, key, limit=100, window_seconds=60)
```

### 4. Nível global

**Escopo:** Global para toda a aplicação  
**Limites:** 100000 requisições/minuto  
**Implementação:** Leaky bucket  
**Uso:** Proteção de infraestrutura

```python
global_limiter = LeakyBucket(capacity=100000, leak_rate=100000/60)
```

## Monitoramento e alertas

### Métricas a monitorar

- **Requisições permitidas:** Número de requisições que passaram pelo rate limiter
- **Requisições rejeitadas:** Número de requisições bloqueadas
- **Taxa de rejeição:** Requisições rejeitadas / total
- **Latência do rate limiter:** Tempo para verificar limites
- **Utilização do Redis:** CPU e memória do Redis

### Implementação de monitoramento

```python
from prometheus_client import Counter, Histogram

requests_allowed = Counter('rate_limiter_allowed_total', 'Total allowed requests')
requests_rejected = Counter('rate_limiter_rejected_total', 'Total rejected requests')
rate_limiter_latency = Histogram('rate_limiter_latency_seconds', 'Rate limiter latency')

class MonitoredRateLimiter:
    def __init__(self, rate_limiter):
        self.rate_limiter = rate_limiter
    
    def allow(self):
        start = time.time()
        result = self.rate_limiter.allow()
        latency = time.time() - start
        
        rate_limiter_latency.observe(latency)
        
        if result:
            requests_allowed.inc()
        else:
            requests_rejected.inc()
        
        return result
```

## Recomendações

### Para APIs públicas
- **Algoritmo:** Token bucket
- **Escopo:** Por API key
- **Limites:** 1000 requisições/hora, 10000 requisições/dia
- **Implementação:** Redis com Lua scripts

### Para APIs internas
- **Algoritmo:** Sliding window counter
- **Escopo:** Por serviço
- **Limites:** 10000 requisições/minuto
- **Implementação:** Redis ou em memória

### Para LLM providers
- **Algoritmo:** Token bucket com backoff exponencial
- **Escopo:** Por provider
- **Limites:** Conforme limites do provider
- **Implementação:** Adaptive throttling

### Para desenvolvimento
- **Algoritmo:** Fixed window counter
- **Escopo:** Por IP
- **Limites:** 1000 requisições/minuto
- **Implementação:** Em memória

## Próximos passos

1. **Escolher algoritmo:** Selecionar baseado em caso de uso
2. **Implementar com Redis:** Usar Redis para distribuído
3. **Configurar middleware:** Adicionar middleware na aplicação
4. **Monitorar métricas:** Configurar Prometheus/Grafana
5. **Configurar alertas:** Notificar sobre alta taxa de rejeição
6. **Testar carga:** Validar sob alta carga

## Referências

- Redis Rate Limiting: https://redis.io/docs/manual/patterns/distributed-counters/
- Token Bucket Algorithm: https://en.wikipedia.org/wiki/Token_bucket
- Leaky Bucket Algorithm: https://en.wikipedia.org/wiki/Leaky_bucket
- Rate Limiting Best Practices: https://cloud.google.com/architecture/rate-limiting-strategies-techniques
