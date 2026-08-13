# Cache Strategies Avançado

**Data:** 12 de agosto de 2026  
**Status:** Documentação complementar  
**Objetivo:** Aprofundar cache strategies baseado em gaps competitivos

## Visão Geral

Cache de LLM reduz custo e latência. OpenAI e Anthropic têm prompt caching automático. IDEIA_aci precisa de cache avançado com semantic caching, multi-level cache, cache invalidation e cache analytics.

## Gap 1: Semantic Caching

### Conceito

Cache baseado em similaridade semântica, não apenas match exato. Diferente de prompt caching que requer match exato, semantic caching permite reuso de respostas similares.

### Dependências

```python
pip install numpy
```

### Implementação com Semantic Caching

```python
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
import hashlib

@dataclass
class CacheEntry:
    """Entrada de cache"""
    key: str
    prompt: str
    response: str
    embedding: np.ndarray
    created_at: datetime
    ttl: Optional[timedelta] = None
    hit_count: int = 0

class SemanticCache:
    """Cache semântico"""
    
    def __init__(self, similarity_threshold: float = 0.85):
        self.cache: Dict[str, CacheEntry] = {}
        self.similarity_threshold = similarity_threshold
        self.embedding_model = None  # Em produção, usar modelo real
    
    def _generate_key(self, prompt: str) -> str:
        """Gera chave para prompt"""
        return hashlib.sha256(prompt.encode()).hexdigest()
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Gera embedding (simulado)"""
        # Em produção, usar modelo de embeddings real
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        return np.array([hash_val % 1000 / 1000.0] * 768)
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calcula similaridade cosseno"""
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def get(self, prompt: str) -> Optional[str]:
        """Recupera do cache com similaridade semântica"""
        key = self._generate_key(prompt)
        
        # Tentar match exato
        if key in self.cache:
            entry = self.cache[key]
            
            if entry.ttl and datetime.now() > entry.created_at + entry.ttl:
                del self.cache[key]
                return None
            
            entry.hit_count += 1
            return entry.response
        
        # Tentar match semântico
        query_embedding = self._get_embedding(prompt)
        
        for cache_key, entry in self.cache.items():
            if entry.ttl and datetime.now() > entry.created_at + entry.ttl:
                continue
            
            similarity = self._cosine_similarity(query_embedding, entry.embedding)
            
            if similarity >= self.similarity_threshold:
                entry.hit_count += 1
                return entry.response
        
        return None
    
    def set(self, prompt: str, response: str, ttl: Optional[timedelta] = None):
        """Define entrada no cache"""
        key = self._generate_key(prompt)
        embedding = self._get_embedding(prompt)
        
        entry = CacheEntry(
            key=key,
            prompt=prompt,
            response=response,
            embedding=embedding,
            created_at=datetime.now(),
            ttl=ttl
        )
        
        self.cache[key] = entry
    
    def invalidate(self, prompt: str):
        """Invalida entrada do cache"""
        key = self._generate_key(prompt)
        if key in self.cache:
            del self.cache[key]
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do cache"""
        total_hits = sum(entry.hit_count for entry in self.cache.values())
        
        return {
            "size": len(self.cache),
            "total_hits": total_hits,
            "avg_hits": total_hits / len(self.cache) if self.cache else 0
        }

# Uso
semantic_cache = SemanticCache(similarity_threshold=0.85)

# Adicionar ao cache
semantic_cache.set("What is Python?", "Python is a programming language", ttl=timedelta(minutes=30))

# Recuperar (match exato)
result = semantic_cache.get("What is Python?")
print(f"Exact match: {result}")

# Recuperar (match semântico)
result = semantic_cache.get("Tell me about Python", similarity_threshold=0.8)
print(f"Semantic match: {result}")
```

## Gap 2: Multi-Level Cache

### Conceito

Cache em múltiplos níveis (L1: memória, L2: Redis, L3: disk). Diferente de cache único, multi-level cache otimiza performance e custo.

### Implementação com Multi-Level Cache

```python
from typing import Dict, Optional
from abc import ABC, abstractmethod

class CacheLevel(ABC):
    """Nível de cache abstrato"""
    
    @abstractmethod
    def get(self, key: str) -> Optional[str]:
        pass
    
    @abstractmethod
    def set(self, key: str, value: str, ttl: Optional[int] = None):
        pass
    
    @abstractmethod
    def invalidate(self, key: str):
        pass

class MemoryCache(CacheLevel):
    """Cache em memória (L1)"""
    
    def __init__(self):
        self.cache: Dict[str, tuple] = {}  # key -> (value, expiry)
    
    def get(self, key: str) -> Optional[str]:
        if key not in self.cache:
            return None
        
        value, expiry = self.cache[key]
        
        if expiry and time.time() > expiry:
            del self.cache[key]
            return None
        
        return value
    
    def set(self, key: str, value: str, ttl: Optional[int] = None):
        expiry = time.time() + ttl if ttl else None
        self.cache[key] = (value, expiry)
    
    def invalidate(self, key: str):
        if key in self.cache:
            del self.cache[key]

class RedisCache(CacheLevel):
    """Cache Redis (L2)"""
    
    def __init__(self, host: str = "localhost", port: int = 6379):
        # Em produção, usar redis-py real
        self.host = host
        self.port = port
        self.cache: Dict[str, tuple] = {}  # Simulado
    
    def get(self, key: str) -> Optional[str]:
        # Simulado - em produção usar Redis real
        if key in self.cache:
            value, expiry = self.cache[key]
            if expiry and time.time() > expiry:
                del self.cache[key]
                return None
            return value
        return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None):
        expiry = time.time() + ttl if ttl else None
        self.cache[key] = (value, expiry)
    
    def invalidate(self, key: str):
        if key in self.cache:
            del self.cache[key]

class MultiLevelCache:
    """Cache multi-nível"""
    
    def __init__(self):
        self.levels: list[CacheLevel] = []
    
    def add_level(self, level: CacheLevel):
        """Adiciona nível de cache"""
        self.levels.append(level)
    
    def get(self, key: str) -> Optional[str]:
        """Busca em todos os níveis (L1 -> L2 -> L3)"""
        for i, level in enumerate(self.levels):
            value = level.get(key)
            
            if value is not None:
                # Promote para níveis superiores (write-through)
                for j in range(i):
                    self.levels[j].set(key, value)
                
                return value
        
        return None
    
    def set(self, key: str, value: str, ttl: Optional[int] = None):
        """Define em todos os níveis (write-through)"""
        for level in self.levels:
            level.set(key, value, ttl)
    
    def invalidate(self, key: str):
        """Invalida em todos os níveis"""
        for level in self.levels:
            level.invalidate(key)

# Uso
multi_cache = MultiLevelCache()

# Adicionar níveis
multi_cache.add_level(MemoryCache())  # L1
multi_cache.add_level(RedisCache())  # L2

# Set
multi_cache.set("key1", "value1", ttl=60)

# Get (busca L1, depois L2)
value = multi_cache.get("key1")
print(f"Value: {value}")
```

## Gap 3: Cache Invalidation

### Conceito

Invalidação inteligente de cache baseada em mudanças. Diferente de TTL simples, cache invalidation usa eventos e dependências.

### Implementação com Cache Invalidation

```python
from typing import Dict, List, Set
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CacheDependency:
    """Dependência de cache"""
    cache_key: str
    depends_on: List[str]  # keys que esta entrada depende

class CacheInvalidator:
    """Invalidador de cache"""
    
    def __init__(self):
        self.dependencies: Dict[str, CacheDependency] = {}
        self.dependency_graph: Dict[str, Set[str]] = {}  # key -> keys que dependem dele
    
    def add_dependency(self, cache_key: str, depends_on: List[str]):
        """Adiciona dependência"""
        dependency = CacheDependency(
            cache_key=cache_key,
            depends_on=depends_on
        )
        
        self.dependencies[cache_key] = dependency
        
        # Construir grafo de dependências
        for dep in depends_on:
            if dep not in self.dependency_graph:
                self.dependency_graph[dep] = set()
            self.dependency_graph[dep].add(cache_key)
    
    def invalidate(self, key: str, cache: MultiLevelCache):
        """Invalida chave e todas as dependências"""
        # Invalidar chave
        cache.invalidate(key)
        
        # Invalidar dependências recursivamente
        if key in self.dependency_graph:
            dependent_keys = self.dependency_graph[key].copy()
            
            for dependent_key in dependent_keys:
                self.invalidate(dependent_key, cache)
    
    def on_file_change(self, file_path: str, cache: MultiLevelCache):
        """Invalida cache quando arquivo muda"""
        cache_key = f"file:{file_path}"
        self.invalidate(cache_key, cache)

# Uso
invalidator = CacheInvalidator()

# Adicionar dependências
invalidator.add_dependency("cache_key_1", ["file:main.py", "file:utils.py"])
invalidator.add_dependency("cache_key_2", ["file:main.py"])

# Quando arquivo muda
invalidator.on_file_change("main.py", multi_cache)
```

## Recomendações de Implementação

### Para MVP
1. **Semantic caching básico:** Implementar com similaridade simples
2. **Multi-level cache básico:** Implementar com 2 níveis (memória + Redis)
3. **Cache invalidação básico:** Implementar com TTL simples

### Para Produção
1. **Semantic caching avançado:** Implementar com embeddings reais
2. **Multi-level cache avançado:** Implementar com 3 níveis (memóry + Redis + disk)
3. **Cache invalidação avançado:** Implementar com eventos e dependências
4. **Cache analytics:** Implementar com métricas de hit rate, latência, custo

## Integração com IDEIA-master

O package `cache` do IDEIA-master pode ser usado como base para implementação de cache no IDEIA_aci.

## Referências

- GPTCache: https://github.com/zilliztech/GPTCache
- LangChain Cache: https://python.langchain.com/docs/modules/cache/
- Redis: https://redis.io/
