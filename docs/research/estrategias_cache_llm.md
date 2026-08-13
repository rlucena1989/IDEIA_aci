# Estratégias de Cache de LLM

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias de cache para reduzir custo e latência de chamadas LLM

## Visão geral

Cache de LLM reduz custo e latência reutilizando trabalho previamente computado. Existem três camadas principais: prompt caching (provider-side), semantic caching (application-side) e KV-cache (serving-stack).

## Camadas de cache

### 1. Prompt Caching (Provider-side)

**O que é:** Reuso de prefixos de prompt exatos no provider  
**Onde vive:** Provider-side (OpenAI, Anthropic, Gemini)  
**Savings mechanics:** Cached input billed at 10% (Anthropic) ou 50% (OpenAI) do list price  
**Typical hit rates:** 60-87% com cache-key routing  
**Quando aplica:** System prompts, tool schemas, documentos, conversation history

#### OpenAI

**Ativação:** Automático (zero code changes)  
**Mínimo de tokens:** 1,024 tokens  
**Cache TTL:** 5-10 min default, até 1 hora  
**Cost savings:** 50% discount em cached input tokens  
**Write cost:** Sem surcharge  
**Latency reduction:** Até 80%  
**Cache hit guarantee:** ~50% (best effort)

**Implementação:**
```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant..."},
        {"role": "user", "content": "Hello"}
    ]
)

# Verificar cache hits
print(response.usage.prompt_tokens_details.cached_tokens)
```

#### Anthropic

**Ativação:** Manual via `cache_control` parameter  
**Mínimo de tokens:** 1,024 (Sonnet/Opus) ou 2,048 (Haiku)  
**Cache TTL:** 5 min default, opção de 1 hora  
**Cost savings:** 90% discount em cache reads  
**Write cost:** +25% (5-min TTL) ou +100% (1-hour TTL)  
**Latency reduction:** Até 85%  
**Cache hit guarantee:** 100% quando explicitamente configurado

**Implementação:**
```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are a helpful assistant...",
            "cache_control": {"type": "ephemeral"}  # 5 min TTL
        }
    ],
    messages=[
        {"role": "user", "content": "Hello"}
    ]
)

# Verificar cache hits
print(response.usage.cache_read_input_tokens)
print(response.usage.cache_creation_input_tokens)
```

### 2. Semantic Caching (Application-side)

**O que é:** Match de queries semanticamente similares via embedding similarity  
**Onde vive:** Sua infra (embeddings + vector store)  
**Savings mechanics:** LLM call skipped entirely - 100% do call salvo em hit  
**Typical hit rates:** 20-45% em produção  
**Quando aplica:** Repetitive user-facing query traffic (FAQ, search, support)

#### Threshold tuning

| Threshold | Hit rate | False positive rate |
|---|---|---|
| 0.99 | 1-3% | <0.1% |
| 0.97 | 5-10% | ~0.5% |
| 0.95 | 15-25% | 1-3% |
| 0.93 | 25-40% | 3-7% |
| 0.90 | 35-55% | 7-15% |
| 0.85 | 45-70% | 15-30% |

**Recomendação:** 0.93-0.95 para balance entre hit rate e correctness

#### Implementação com GPTCache

```python
from gptcache import Cache
from gptcache.manager import get_data_manager, CacheBase, VectorBase
from gptcache.embedding import Onnx
from gptcache.similarity_evaluation.distance import SearchDistanceEvaluation

# Inicializar cache
cache = Cache()
data_manager = get_data_manager(
    cache_base=CacheBase("sqlite"),
    vector_base=VectorBase("faiss", dimension=512)
)

init_similar_cache(
    cache_obj=cache,
    embedding=Onnx(),
    data_manager=data_manager,
    evaluation=SearchDistanceEvaluation(),
    similarity_threshold=0.92
)

# Usar cache
from gptcache.adapter import openai

openai.ChatCompletion.create = openai.ChatCompletion.create
response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

#### Implementação com Redis

```python
import redis
import numpy as np
import json
from openai import OpenAI

class SemanticCache:
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        similarity_threshold: float = 0.92,
        ttl_seconds: int = 86_400,  # 24 hours
    ):
        self.r = redis.from_url(redis_url)
        self.threshold = similarity_threshold
        self.ttl = ttl_seconds
        self.openai = OpenAI()
        
    def _embed(self, text: str) -> np.ndarray:
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(response.data[0].embedding, dtype=np.float32)
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    
    def get(self, query: str) -> str | None:
        query_embedding = self._embed(query)
        
        keys = self.r.scan_iter("semcache:*")
        best_similarity = 0.0
        best_response = None
        
        for key in keys:
            entry = self.r.get(key)
            if not entry:
                continue
            
            data = json.loads(entry)
            cached_embedding = np.array(data["embedding"], dtype=np.float32)
            similarity = self._cosine_similarity(query_embedding, cached_embedding)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_response = data["response"]
        
        if best_similarity >= self.threshold:
            return best_response
        return None
    
    def set(self, query: str, response: str):
        query_embedding = self._embed(query)
        key = f"semcache:{hash(query)}"
        
        entry = {
            "query": query,
            "response": response,
            "embedding": query_embedding.tolist()
        }
        
        self.r.setex(key, self.ttl, json.dumps(entry))
```

#### Implementação com RedisVL

```python
from redisvl.semanticcache import SemanticCache
from redisvl.llmcache import HFTextVectorizer

llmcache = SemanticCache(
    name="llmcache",
    redis_url="redis://localhost:6379",
    distance_threshold=0.1,
    vectorizer=HFTextVectorizer("redis/langcache-embed-v1"),
)

# Armazenar
llmcache.store(
    prompt="What is the capital of France?",
    response="Paris",
    metadata={"city": "Paris", "country": "france"}
)

# Recuperar
result = llmcache.check(prompt="What's France's capital?")
if result:
    print(f"Cache hit: {result}")
else:
    # Chamar LLM e armazenar
    pass
```

### 3. Exact-Match Cache

**O que é:** Hash do full prompt como chave  
**Onde vive:** Sua infra (Redis, Memcached)  
**Savings mechanics:** LLM call skipped em hit  
**Typical hit rates:** 5-20% (chat), 40-70% (classification/extraction)  
**Quando aplica:** Narrow classification ou extraction tasks

**Implementação:**
```python
import hashlib
import redis

class ExactMatchCache:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.r = redis.from_url(redis_url)
        
    def _hash_prompt(self, prompt: str) -> str:
        return hashlib.sha256(prompt.encode()).hexdigest()
    
    def get(self, prompt: str) -> str | None:
        key = f"exact:{self._hash_prompt(prompt)}"
        return self.r.get(key)
    
    def set(self, prompt: str, response: str, ttl: int = 3600):
        key = f"exact:{self._hash_prompt(prompt)}"
        self.r.setex(key, ttl, response)
```

### 4. KV-Cache (Serving-stack)

**O que é:** Reuso de attention states dentro do serving stack  
**Onde vive:** Seu serving stack (vLLM, SGLang, TensorRT-LLM)  
**Savings mechanics:** Higher GPU throughput / lower latency per request  
**Quando aplica:** Apenas se você self-host open-weight models

**Frameworks:**
- vLLM: Paged attention, automatic prefix caching
- SGLang: Radix attention
- TensorRT-LLM: In-flight batching

## Comparativo de camadas

| Camada | O que é match | Onde vive | Savings | Typical hit rates | Quando aplica |
|---|---|---|---|---|---|
| Prompt caching | Exact token prefix | Provider-side | 90% off (Anthropic), 50% off (OpenAI) | 60-87% | System prompts, tool schemas, docs |
| Semantic caching | Semantic similarity | Sua infra | 100% do call salvo | 20-45% | FAQ, search, support |
| Exact-match cache | Hash do full prompt | Sua infra | 100% do call salvo | 5-70% | Classification, extraction |
| KV-cache | Attention states | Serving stack | Higher throughput | Workload-dependent | Self-host only |

## Comparativo OpenAI vs Anthropic

| Feature | OpenAI | Anthropic |
|---|---|---|
| Ativação | Automática | Manual via `cache_control` |
| Mínimo de tokens | 1,024 | 1,024 (Sonnet/Opus) ou 2,048 (Haiku) |
| Cache TTL | 5-10 min default, até 1 hora | 5 min default, 1-hour option |
| Cost savings | 50% discount | 90% discount |
| Write cost | Sem surcharge | +25% (5-min) ou +100% (1-hour) |
| Latency reduction | Até 80% | Até 85% |
| Cache hit guarantee | ~50% (best effort) | 100% quando explicitamente configurado |
| Max cache breakpoints | N/A (automático) | Até 4 por request |

## Estratégias de invalidação de cache

### TTL (Time-to-Live)

**Princípio:** Cache entries expiram automaticamente após um período fixo

**Implementação com Redis:**
```python
import redis
import hashlib
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def cache_with_ttl(prompt: str, response: str, ttl_seconds: int = 3600):
    """Cache com TTL fixo"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    
    # Set com expiração
    r.setex(cache_key, ttl_seconds, json.dumps(response))
    
def get_cached_response(prompt: str):
    """Recupera do cache se ainda válido"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    cached = r.get(cache_key)
    
    if cached:
        return json.loads(cached)
    return None
```

**TTL recomendados:**
- **System prompts:** 24-48 horas (mudam raramente)
- **FAQ/support:** 1-4 horas (podem mudar com atualizações)
- **Classification:** 12-24 horas (labels estáveis)
- **Search results:** 5-15 minutos (dados dinâmicos)

### LRU (Least Recently Used)

**Princípio:** Remove entries menos recentemente usados quando cache está cheio

**Implementação com Redis:**
```python
def cache_with_lru(prompt: str, response: str, max_size: int = 10000):
    """Cache com LRU eviction"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    
    # Adicionar ao cache
    r.set(cache_key, json.dumps(response))
    
    # Adicionar ao LRU tracking
    r.lpush("lru_keys", cache_key)
    r.ltrim("lru_keys", 0, max_size - 1)
    
    # Remover keys não mais em LRU
    all_keys = r.lrange("lru_keys", 0, -1)
    for key in r.scan_iter(match="cache:*"):
        if key.decode() not in all_keys:
            r.delete(key)
```

### Cache invalidation por evento

**Princípio:** Invalida cache quando dados subjacentes mudam

**Implementação com pub/sub:**
```python
import redis
from typing import Callable

r = redis.Redis(host='localhost', port=6379, db=0)
pubsub = r.pubsub()

def subscribe_to_invalidations(callback: Callable):
    """Subscribe to cache invalidation events"""
    pubsub.subscribe("cache_invalidation")
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            cache_key = message['data'].decode()
            callback(cache_key)

def invalidate_cache(cache_key: str):
    """Invalida cache entry específico"""
    r.delete(cache_key)
    r.publish("cache_invalidation", cache_key)

# Exemplo: invalidar quando documento é atualizado
def on_document_update(doc_id: str):
    cache_key = f"doc:{doc_id}"
    invalidate_cache(cache_key)
```

### Cache invalidação por versão

**Princípio:** Usa versionamento para invalidar grupos de entries

**Implementação:**
```python
def cache_with_version(prompt: str, response: str, version: str):
    """Cache com versionamento"""
    cache_key = f"{version}:{hashlib.sha256(prompt.encode()).hexdigest()}"
    r.set(cache_key, json.dumps(response))

def get_cached_response(prompt: str, version: str):
    """Recupera do cache com versão específica"""
    cache_key = f"{version}:{hashlib.sha256(prompt.encode()).hexdigest()}"
    cached = r.get(cache_key)
    
    if cached:
        return json.loads(cached)
    return None

def invalidate_version(version: str):
    """Invalida todas as entries de uma versão"""
    for key in r.scan_iter(match=f"{version}:*"):
        r.delete(key)
```

### Cache invalidação por tag

**Princípio:** Invalida múltiplas entries baseadas em tags

**Implementação:**
```python
def cache_with_tags(prompt: str, response: str, tags: list[str]):
    """Cache com tags para invalidação em grupo"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    r.set(cache_key, json.dumps(response))
    
    # Adicionar tags
    for tag in tags:
        r.sadd(f"tag:{tag}", cache_key)

def invalidate_by_tag(tag: str):
    """Invalida todas as entries com uma tag"""
    cache_keys = r.smembers(f"tag:{tag}")
    
    for key in cache_keys:
        r.delete(key)
    
    r.delete(f"tag:{tag}")

# Exemplo: invalidar todos os caches de um usuário
def invalidate_user_caches(user_id: str):
    invalidate_by_tag(f"user:{user_id}")
```

### Cache invalidação por prefixo

**Princípio:** Invalida todas as entries com um prefixo específico

**Implementação:**
```python
def invalidate_by_prefix(prefix: str):
    """Invalida todas as entries com prefixo"""
    for key in r.scan_iter(match=f"{prefix}*"):
        r.delete(key)

# Exemplo: invalidar todos os caches de um documento
def invalidate_document_caches(doc_id: str):
    invalidate_by_prefix(f"doc:{doc_id}:")
```

### Estratégias híbridas

**Combinação de TTL + event-based:**
```python
def cache_with_ttl_and_events(prompt: str, response: str, ttl_seconds: int = 3600, tags: list[str] = None):
    """Cache com TTL e event-based invalidation"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    
    # Set com TTL
    r.setex(cache_key, ttl_seconds, json.dumps(response))
    
    # Adicionar tags para invalidação por evento
    if tags:
        for tag in tags:
            r.sadd(f"tag:{tag}", cache_key)
```

**Recomendações:**
- **Para dados estáticos:** TTL longo (24-48h)
- **Para dados dinâmicos:** TTL curto (5-15min) + event-based invalidation
- **Para multi-tenancy:** Tag-based invalidation por tenant
- **Para documentos:** Prefix-based invalidation por documento ID

## Consistência de cache distribuído

### Modelos de consistência

**Strong consistency:**
- Todas as leituras retornam o valor mais recente
- Latência mais alta (requer coordenação)
- Implementação: Redis com replicação síncrona

**Eventual consistency:**
- Leituras podem retornar valores desatualizados
- Latência mais baixa (sem coordenação)
- Implementação: Redis com replicação assíncrona

**Read-your-writes consistency:**
- Cliente sempre lê o que escreveu
- Latência média (coordenação por cliente)
- Implementação: Sticky sessions ou client-side caching

### Implementação com Redis Cluster

**Configuração de Redis Cluster:**
```python
from redis.cluster import RedisCluster

# Conectar ao cluster
rc = RedisCluster(
    host='localhost',
    port=6379,
    skip_full_coverage_check=True
)

def cache_distributed(prompt: str, response: str):
    """Cache em cluster Redis"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    
    # Redis Cluster automaticamente roteia para o shard correto
    rc.set(cache_key, json.dumps(response))
    
def get_cached_distributed(prompt: str):
    """Recupera do cluster"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    cached = rc.get(cache_key)
    
    if cached:
        return json.loads(cached)
    return None
```

### Cache stampede protection

**Princípio:** Evita múltiplas requisições ao mesmo cache key simultaneamente

**Implementação com Redis lock:**
```python
import time

def get_cached_with_lock(prompt: str, compute_fn: Callable, lock_timeout: int = 10):
    """Cache com lock para evitar stampede"""
    cache_key = hashlib.sha256(prompt.encode()).hexdigest()
    lock_key = f"lock:{cache_key}"
    
    # Tentar obter do cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Tentar adquirir lock
    lock_acquired = r.set(lock_key, "1", nx=True, ex=lock_timeout)
    
    if lock_acquired:
        try:
            # Computar valor
            result = compute_fn(prompt)
            r.set(cache_key, json.dumps(result), ex=3600)
            return result
        finally:
            r.delete(lock_key)
    else:
        # Esperar e tentar novamente
        time.sleep(0.1)
        return get_cached_with_lock(prompt, compute_fn, lock_timeout)
```

### Cache warming

**Princípio:** Pre-popula cache com dados frequentemente acessados

**Implementação:**
```python
def warm_cache(popular_prompts: list[str]):
    """Pre-popula cache com prompts populares"""
    for prompt in popular_prompts:
        response = compute_response(prompt)
        cache_key = hashlib.sha256(prompt.encode()).hexdigest()
        r.set(cache_key, json.dumps(response), ex=3600)

# Executar periodicamente (ex: a cada hora)
def schedule_cache_warming():
    """Agenda cache warming"""
    popular_prompts = get_popular_prompts()
    warm_cache(popular_prompts)
```

### Cache fallback

**Princípio:** Fallback para cache secundário se primário falhar

**Implementação:**
```python
class CacheFallback:
    def __init__(self, primary: redis.Redis, secondary: redis.Redis):
        self.primary = primary
        self.secondary = secondary
    
    def get(self, key: str):
        """Tenta primário, depois secundário"""
        try:
            cached = self.primary.get(key)
            if cached:
                return json.loads(cached)
        except:
            pass
        
        try:
            cached = self.secondary.get(key)
            if cached:
                # Repopular primário
                self.primary.set(key, cached)
                return json.loads(cached)
        except:
            pass
        
        return None
    
    def set(self, key: str, value: str, ex: int = None):
        """Set em ambos primário e secundário"""
        try:
            self.primary.set(key, value, ex=ex)
        except:
            pass
        
        try:
            self.secondary.set(key, value, ex=ex)
        except:
            pass
```

### Monitoramento de consistência

**Métricas de consistência:**
- **Cache hit rate:** % de hits vs misses
- **Cache staleness:** Tempo desde última atualização
- **Replication lag:** Latência entre replicas
- **Lock availability:** % de locks adquiridos com sucesso

**Implementação:**
```python
def monitor_cache_consistency():
    """Monitora consistência de cache"""
    metrics = {
        "hit_rate": calculate_hit_rate(),
        "staleness": calculate_staleness(),
        "replication_lag": calculate_replication_lag(),
        "lock_availability": calculate_lock_availability()
    }
    
    # Alertar se hit rate < 70%
    if metrics["hit_rate"] < 0.7:
        alert("Low cache hit rate", metrics["hit_rate"])
    
    # Alertar se replication lag > 1s
    if metrics["replication_lag"] > 1.0:
        alert("High replication lag", metrics["replication_lag"])
    
    return metrics
```

**Recomendações:**
- **Para alta consistência:** Redis com replicação síncrona + locks
- **Para alta disponibilidade:** Redis Cluster + fallback
- **Para baixa latência:** Eventual consistency + cache warming
- **Para evitar stampede:** Lock-based protection + fallback

## Recomendações

### Para simplicidade
**Recomendado:** OpenAI prompt caching
- Zero code changes
- 50% discount automático
- Sem surcharge de write

### Para máximo savings
**Recomendado:** Anthropic prompt caching
- 90% discount em cache reads
- 100% hit rate garantido
- Requer explicit breakpoint placement

### Para FAQ/support
**Recomendado:** Semantic caching
- Hit rate 30-45% em FAQ patterns
- Threshold 0.93-0.95
- Implementar com RedisVL ou GPTCache

### Para classification/extraction
**Recomendado:** Exact-match cache
- Hit rate 40-70%
- Zero correctness risk
- Implementar com Redis

### Para self-host
**Recomendado:** KV-cache com vLLM
- Paged attention
- Automatic prefix caching
- Higher throughput

## Estratégia de implementação

1. **Prompt caching primeiro:** Implementar prompt caching do provider (mais fácil, mais seguro)
2. **Exact-match cache:** Adicionar exact-match cache para workloads narrow
3. **Semantic caching:** Adicionar semantic caching apenas quando necessário, com eval loop
4. **KV-cache:** Implementar KV-cache apenas se self-hosting

## Próximos passos

1. **Implementar prompt caching:** Configurar OpenAI ou Anthropic prompt caching
2. **Monitorar hit rates:** Track cache hits via API response metadata
3. **Implementar exact-match:** Adicionar Redis-based exact-match cache
4. **Avaliar semantic caching:** Implementar semantic caching com threshold 0.93-0.95
5. **Configurar KV-cache:** Implementar vLLM com paged attention se self-hosting
6. **Otimizar:** Ajustar thresholds e TTLs baseado em workload

## Referências

- OpenAI Prompt Caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Anthropic Prompt Caching: https://claude.com/blog/prompt-caching
- GPTCache: https://github.com/zilliztech/GPTCache
- Redis Semantic Cache: https://redis.io/docs/latest/develop/use-cases/semantic-cache/
