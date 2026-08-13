# Guia de Implementação - Cache Strategies Avançado

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de estratégias de cache avançado para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de estratégias de cache avançado com semantic caching, multi-level cache, cache invalidation e cache analytics, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install numpy redis
```

### Estrutura de Diretórios

```
packages/
├── cache_system/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── cache_entry.py        # Entrada de cache
│   │   ├── cache_types.py        # Tipos de cache
│   │   └── cache_config.py       # Configurações de cache
│   ├── strategies/
│   │   ├── __init__.py
│   │   ├── semantic_cache.py     # Cache semântico
│   │   ├── lru_cache.py          # Cache LRU
│   │   ├── lfu_cache.py          # Cache LFU
│   │   └── ttl_cache.py          # Cache com TTL
│   ├── multi_level/
│   │   ├── __init__.py
│   │   ├── multi_level_cache.py  # Cache multi-level
│   │   ├── level1_cache.py       # Cache L1 (memória)
│   │   ├── level2_cache.py       # Cache L2 (Redis)
│   │   └── level3_cache.py       # Cache L3 (disco)
│   ├── invalidation/
│   │   ├── __init__.py
│   │   ├── invalidator.py        # Invalidador de cache
│   │   ├── ttl_invalidator.py    # Invalidação por TTL
│   │   └── manual_invalidator.py # Invalidação manual
│   ├── analytics/
│   │   ├── __init__.py
│   │   ├── metrics.py            # Métricas de cache
│   │   ├── hit_rate.py           # Taxa de hit
│   │   └── cost_analyzer.py      # Análise de custo
│   └── storage/
│       ├── __init__.py
│       ├── memory_storage.py      # Storage em memória
│       ├── redis_storage.py       # Storage Redis
│       └── file_storage.py        # Storage em arquivo
```

## Passo 1: Tipos de Cache (core/cache_types.py)

```python
"""
Definições de tipos de cache.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class CacheLevel(Enum):
    """Níveis de cache."""
    L1 = "l1"  # Memória (mais rápido, menor)
    L2 = "l2"  # Redis (rápido, médio)
    L3 = "l3"  # Disco (mais lento, maior)

class CacheStrategy(Enum):
    """Estratégias de cache."""
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    TTL = "ttl"  # Time To Live
    SEMANTIC = "semantic"  # Similaridade semântica

class CacheConfig:
    """Configuração de cache."""
    
    def __init__(
        self,
        max_size: int = 1000,
        ttl: Optional[timedelta] = None,
        enable_semantic: bool = True,
        similarity_threshold: float = 0.85,
        embedding_dim: int = 768
    ):
        self.max_size = max_size
        self.ttl = ttl or timedelta(hours=1)
        self.enable_semantic = enable_semantic
        self.similarity_threshold = similarity_threshold
        self.embedding_dim = embedding_dim
```

## Passo 2: Entrada de Cache (core/cache_entry.py)

```python
"""
Entrada de cache com metadados e embeddings.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import hashlib

@dataclass
class CacheEntry:
    """Entrada de cache."""
    
    # Identificação
    key: str
    value: str
    
    # Metadados
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    
    # TTL
    ttl: Optional[timedelta] = None
    expires_at: Optional[datetime] = None
    
    # Embeddings (para semantic cache)
    embedding: Optional[List[float]] = None
    embedding_dim: int = 768
    
    # Tamanho
    size: int = 0  # caracteres
    
    # Hash
    value_hash: str = ""
    
    # Metadados adicionais
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Inicialização pós-criação."""
        if not self.value_hash:
            self.value_hash = self._compute_hash()
        
        self.size = len(self.value)
        
        if self.ttl and not self.expires_at:
            self.expires_at = self.created_at + self.ttl
    
    def _compute_hash(self) -> str:
        """Computa hash do valor."""
        return hashlib.sha256(self.value.encode()).hexdigest()
    
    def is_expired(self) -> bool:
        """Verifica se entrada expirou."""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at
    
    def access(self):
        """Registra acesso à entrada."""
        self.access_count += 1
        self.last_accessed = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "access_count": self.access_count,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "embedding": self.embedding,
            "embedding_dim": self.embedding_dim,
            "size": self.size,
            "value_hash": self.value_hash,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        """Cria entrada a partir de dicionário."""
        return cls(
            key=data["key"],
            value=data["value"],
            created_at=datetime.fromisoformat(data["created_at"]),
            last_accessed=datetime.fromisoformat(data["last_accessed"]) if data["last_accessed"] else None,
            access_count=data["access_count"],
            expires_at=datetime.fromisoformat(data["expires_at"]) if data["expires_at"] else None,
            embedding=data["embedding"],
            embedding_dim=data["embedding_dim"],
            size=data["size"],
            value_hash=data["value_hash"],
            metadata=data["metadata"]
        )
```

## Passo 3: Cache Semântico (strategies/semantic_cache.py)

```python
"""
Cache semântico baseado em similaridade.
"""
from typing import Dict, Optional, Tuple
import numpy as np
import logging

from ..core.cache_entry import CacheEntry
from ..core.cache_config import CacheConfig
from ..utils.embeddings import EmbeddingGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SemanticCache:
    """Cache semântico baseado em similaridade."""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        """Inicializa cache semântico."""
        self.config = config or CacheConfig()
        self.entries: Dict[str, CacheEntry] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        self.embedding_generator = EmbeddingGenerator(dimension=self.config.embedding_dim)
        self.hit_count = 0
        self.miss_count = 0
    
    def get(self, query: str) -> Optional[str]:
        """Recupera valor usando similaridade semântica."""
        if not self.embeddings:
            self.miss_count += 1
            return None
        
        # Gerar embedding da query
        query_embedding = self.embedding_generator.generate(query)
        
        # Encontrar entrada mais similar
        best_match = None
        best_similarity = 0.0
        
        for key, embedding in self.embeddings.items():
            similarity = self._cosine_similarity(query_embedding, embedding)
            
            if similarity > best_similarity and similarity >= self.config.similarity_threshold:
                best_similarity = similarity
                best_match = key
        
        if best_match:
            entry = self.entries[best_match]
            
            # Verificar expiração
            if entry.is_expired():
                self.delete(best_match)
                self.miss_count += 1
                return None
            
            entry.access()
            self.hit_count += 1
            logger.debug(f"Cache hit for query (similarity: {best_similarity:.3f})")
            return entry.value
        
        self.miss_count += 1
        return None
    
    def set(self, key: str, value: str, **kwargs) -> CacheEntry:
        """Define valor no cache."""
        # Criar entrada
        entry = CacheEntry(
            key=key,
            value=value,
            ttl=self.config.ttl,
            **kwargs
        )
        
        # Gerar embedding
        embedding = self.embedding_generator.generate(value)
        entry.embedding = embedding.tolist()
        
        # Evict se necessário
        if len(self.entries) >= self.config.max_size:
            self._evict()
        
        # Adicionar
        self.entries[key] = entry
        self.embeddings[key] = embedding
        
        logger.debug(f"Cache set for key: {key}")
        
        return entry
    
    def delete(self, key: str) -> bool:
        """Deleta entrada do cache."""
        if key in self.entries:
            del self.entries[key]
            del self.embeddings[key]
            logger.debug(f"Cache deleted for key: {key}")
            return True
        return False
    
    def _evict(self):
        """Evict entrada menos acessada."""
        if not self.entries:
            return
        
        # Encontrar entrada com menor access_count
        min_access = min(entry.access_count for entry in self.entries.values())
        candidates = [
            key for key, entry in self.entries.items()
            if entry.access_count == min_access
        ]
        
        # Evict primeiro candidato
        if candidates:
            self.delete(candidates[0])
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calcula similaridade cosseno."""
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas."""
        expired_keys = [
            key for key, entry in self.entries.items()
            if entry.is_expired()
        ]
        
        for key in expired_keys:
            self.delete(key)
        
        logger.info(f"Cleaned up {len(expired_keys)} expired entries")
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        total_requests = self.hit_count + self.miss_count
        hit_rate = self.hit_count / total_requests if total_requests > 0 else 0.0
        
        return {
            "total_entries": len(self.entries),
            "max_size": self.config.max_size,
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate": hit_rate,
            "similarity_threshold": self.config.similarity_threshold
        }
```

## Passo 4: Cache Multi-Level (multi_level/multi_level_cache.py)

```python
"""
Cache multi-level com L1, L2 e L3.
"""
from typing import Dict, Optional
import logging

from ..core.cache_config import CacheConfig
from ..strategies.semantic_cache import SemanticCache
from ..strategies.lru_cache import LRUCache
from ..storage.memory_storage import MemoryStorage
from ..storage.redis_storage import RedisStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiLevelCache:
    """Cache multi-level."""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        """Inicializa cache multi-level."""
        self.config = config or CacheConfig()
        
        # L1: Memória (semantic cache)
        self.l1_cache = SemanticCache(config)
        
        # L2: Redis (LRU cache)
        self.l2_cache = LRUCache(config)
        
        # L3: Disco (opcional)
        self.l3_cache = None  # Implementação futura
        
        self.stats = {
            "l1_hits": 0,
            "l2_hits": 0,
            "l3_hits": 0,
            "misses": 0
        }
        
        logger.info("Multi-level cache initialized")
    
    def get(self, key: str, query: Optional[str] = None) -> Optional[str]:
        """Recupera valor do cache multi-level."""
        # Tentar L1
        if query:
            l1_result = self.l1_cache.get(query)
            if l1_result:
                self.stats["l1_hits"] += 1
                logger.debug(f"L1 cache hit for key: {key}")
                return l1_result
        
        # Tentar L2
        l2_result = self.l2_cache.get(key)
        if l2_result:
            self.stats["l2_hits"] += 1
            logger.debug(f"L2 cache hit for key: {key}")
            
            # Promote para L1
            if query:
                self.l1_cache.set(key, l2_result)
            
            return l2_result
        
        # Tentar L3 (se implementado)
        if self.l3_cache:
            l3_result = self.l3_cache.get(key)
            if l3_result:
                self.stats["l3_hits"] += 1
                logger.debug(f"L3 cache hit for key: {key}")
                
                # Promote para L2 e L1
                self.l2_cache.set(key, l3_result)
                if query:
                    self.l1_cache.set(key, l3_result)
                
                return l3_result
        
        # Cache miss
        self.stats["misses"] += 1
        logger.debug(f"Cache miss for key: {key}")
        return None
    
    def set(self, key: str, value: str, query: Optional[str] = None, **kwargs) -> bool:
        """Define valor em todos os níveis de cache."""
        # Set em L1
        if query:
            self.l1_cache.set(key, value, **kwargs)
        
        # Set em L2
        self.l2_cache.set(key, value, **kwargs)
        
        # Set em L3 (se implementado)
        if self.l3_cache:
            self.l3_cache.set(key, value, **kwargs)
        
        logger.debug(f"Cache set for key: {key} in all levels")
        return True
    
    def delete(self, key: str) -> bool:
        """Deleta valor de todos os níveis de cache."""
        success = True
        
        # Delete de L1
        self.l1_cache.delete(key)
        
        # Delete de L2
        success &= self.l2_cache.delete(key)
        
        # Delete de L3 (se implementado)
        if self.l3_cache:
            success &= self.l3_cache.delete(key)
        
        logger.debug(f"Cache deleted for key: {key} from all levels")
        return success
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas de todos os níveis."""
        total_cleaned = 0
        total_cleaned += self.l1_cache.cleanup()
        total_cleaned += self.l2_cache.cleanup()
        
        if self.l3_cache:
            total_cleaned += self.l3_cache.cleanup()
        
        logger.info(f"Cleaned up {total_cleaned} expired entries from all levels")
        return total_cleaned
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas combinadas."""
        total_requests = sum(self.stats.values())
        hit_rate = (self.stats["l1_hits"] + self.stats["l2_hits"] + self.stats["l3_hits"]) / total_requests if total_requests > 0 else 0.0
        
        return {
            "total_requests": total_requests,
            "hit_rate": hit_rate,
            "l1_hits": self.stats["l1_hits"],
            "l2_hits": self.stats["l2_hits"],
            "l3_hits": self.stats["l3_hits"],
            "misses": self.stats["misses"],
            "l1_stats": self.l1_cache.get_stats(),
            "l2_stats": self.l2_cache.get_stats()
        }
```

## Passo 5: Cache LRU (strategies/lru_cache.py)

```python
"""
Cache LRU (Least Recently Used).
"""
from typing import Dict, Optional
from collections import OrderedDict
from datetime import datetime, timedelta
import logging

from ..core.cache_entry import CacheEntry
from ..core.cache_config import CacheConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LRUCache:
    """Cache LRU."""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        """Inicializa cache LRU."""
        self.config = config or CacheConfig()
        self.entries: OrderedDict[str, CacheEntry] = OrderedDict()
        self.max_size = self.config.max_size
        self.hit_count = 0
        self.miss_count = 0
    
    def get(self, key: str) -> Optional[str]:
        """Recupera valor do cache LRU."""
        entry = self.entries.get(key)
        
        if entry:
            # Verificar expiração
            if entry.is_expired():
                self.delete(key)
                self.miss_count += 1
                return None
            
            # Mover para o final (mais recentemente usado)
            self.entries.move_to_end(key)
            entry.access()
            self.hit_count += 1
            logger.debug(f"LRU cache hit for key: {key}")
            return entry.value
        
        self.miss_count += 1
        return None
    
    def set(self, key: str, value: str, **kwargs) -> CacheEntry:
        """Define valor no cache LRU."""
        # Criar entrada
        entry = CacheEntry(
            key=key,
            value=value,
            ttl=self.config.ttl,
            **kwargs
        )
        
        # Evict se necessário
        if len(self.entries) >= self.max_size:
            self._evict()
        
        # Adicionar
        self.entries[key] = entry
        self.entries.move_to_end(key)
        
        logger.debug(f"LRU cache set for key: {key}")
        
        return entry
    
    def delete(self, key: str) -> bool:
        """Deleta entrada do cache LRU."""
        if key in self.entries:
            del self.entries[key]
            logger.debug(f"LRU cache deleted for key: {key}")
            return True
        return False
    
    def _evict(self):
        """Evict entrada menos recentemente usada."""
        if self.entries:
            key, _ = self.entries.popitem(last=False)
            logger.debug(f"LRU evicted key: {key}")
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas."""
        expired_keys = [
            key for key, entry in self.entries.items()
            if entry.is_expired()
        ]
        
        for key in expired_keys:
            self.delete(key)
        
        logger.info(f"LRU cleaned up {len(expired_keys)} expired entries")
        return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        total_requests = self.hit_count + self.miss_count
        hit_rate = self.hit_count / total_requests if total_requests > 0 else 0.0
        
        return {
            "total_entries": len(self.entries),
            "max_size": self.max_size,
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "hit_rate": hit_rate
        }
```

## Passo 6: Gerador de Embeddings (utils/embeddings.py)

```python
"""
Gerador de embeddings para semantic cache.
"""
from typing import List
import numpy as np
import logging

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None
    logging.warning("sentence-transformers not installed, using fallback")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """Gerador de embeddings."""
    
    def __init__(self, dimension: int = 768, model_name: str = "all-MiniLM-L6-v2"):
        """Inicializa gerador de embeddings."""
        self.dimension = dimension
        self.model_name = model_name
        
        if SentenceTransformer:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded sentence transformer model: {model_name}")
        else:
            self.model = None
            logger.warning("Using fallback hash-based embeddings")
    
    def generate(self, text: str) -> np.ndarray:
        """Gera embedding para texto."""
        if self.model:
            embedding = self.model.encode(text)
            return embedding
        else:
            # Fallback: hash-based embedding
            import hashlib
            hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
            np.random.seed(hash_val)
            return np.random.randn(self.dimension)
```

## Passo 7: Exemplo de Uso

```python
"""
Exemplo de uso do sistema de cache.
"""
from cache_system.multi_level.multi_level_cache import MultiLevelCache
from cache_system.core.cache_config import CacheConfig

# Criar configuração
config = CacheConfig(
    max_size=100,
    ttl=None,  # Sem TTL para teste
    enable_semantic=True,
    similarity_threshold=0.85
)

# Criar cache multi-level
cache = MultiLevelCache(config)

# Set valores
cache.set("key1", "Python is a programming language", query="What is Python?")
cache.set("key2", "JavaScript is used for web development", query="What is JavaScript?")
cache.set("key3", "FastAPI is a modern web framework", query="What is FastAPI?")

# Get com query semântica
result = cache.get("key1", query="Tell me about Python programming")
print(f"Semantic cache result: {result}")

# Get com chave direta
result = cache.get("key2")
print(f"Direct cache result: {result}")

# Cache miss
result = cache.get("key4")
print(f"Cache miss result: {result}")

# Estatísticas
stats = cache.get_stats()
print(f"\nCache stats:")
print(f"- Total requests: {stats['total_requests']}")
print(f"- Hit rate: {stats['hit_rate']:.2%}")
print(f"- L1 hits: {stats['l1_hits']}")
print(f"- L2 hits: {stats['l2_hits']}")
print(f"- Misses: {stats['misses']}")
```

## Passo 8: Testes de Validação

```python
"""
Testes de validação para cache.
"""
import pytest
from cache_system.multi_level.multi_level_cache import MultiLevelCache
from cache_system.core.cache_config import CacheConfig

class TestMultiLevelCache:
    """Testes para cache multi-level."""
    
    def test_initialization(self):
        """Testa inicialização do cache."""
        config = CacheConfig()
        cache = MultiLevelCache(config)
        
        assert cache.l1_cache is not None
        assert cache.l2_cache is not None
    
    def test_set_and_get(self):
        """Testa set e get."""
        cache = MultiLevelCache()
        
        cache.set("key1", "value1")
        result = cache.get("key1")
        
        assert result == "value1"
    
    def test_semantic_cache(self):
        """Testa cache semântico."""
        cache = MultiLevelCache()
        
        cache.set("key1", "Python is a programming language", query="What is Python?")
        result = cache.get("key1", query="Tell me about Python")
        
        assert result is not None
    
    def test_cache_miss(self):
        """Testa cache miss."""
        cache = MultiLevelCache()
        
        result = cache.get("nonexistent")
        
        assert result is None
    
    def test_cache_eviction(self):
        """Testa evicção de cache."""
        config = CacheConfig(max_size=2)
        cache = MultiLevelCache(config)
        
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")  # Deve evict key1
        
        result = cache.get("key1")
        assert result is None

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Cache Cheio

```python
def set_with_eviction(self, key: str, value: str, **kwargs) -> bool:
    """Define valor com evicção se necessário."""
    if len(self.entries) >= self.max_size:
        self._evict()
    
    return self.set(key, value, **kwargs)
```

### 2: Embedding Generation Falha

```python
def get_with_fallback(self, key: str, query: Optional[str] = None) -> Optional[str]:
    """Recupera com fallback."""
    try:
        if query:
            return self.get(key, query)
        else:
            return self.get(key)
    except Exception as e:
        logger.error(f"Cache retrieval error: {e}")
        return None
```

### 3: Storage Falha

```python
def set_with_retry(self, key: str, value: str, max_retries: int = 3) -> bool:
    """Define valor com retry."""
    for attempt in range(max_retries):
        try:
            return self.set(key, value)
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Cache set failed after {max_retries} attempts: {e}")
                return False
            import time
            time.sleep(2 ** attempt)
```

## Integrações com Outros Componentes

### 1: Integração com LLM Provider Gateway

```python
from llm_provider.core.provider_gateway import ProviderGateway
from cache_system.multi_level.multi_level_cache import MultiLevelCache

class CachedProviderGateway(ProviderGateway):
    """Gateway com cache."""
    
    def __init__(self, cache: MultiLevelCache):
        super().__init__()
        self.cache = cache
    
    def generate(self, prompt: str, task_type: str, **kwargs) -> str:
        """Gera resposta com cache."""
        # Gerar chave de cache
        cache_key = f"{task_type}:{hashlib.md5(prompt.encode()).hexdigest()}"
        
        # Tentar cache
        cached_result = self.cache.get(cache_key, query=prompt)
        if cached_result:
            logger.info(f"Cache hit for prompt: {task_type}")
            return cached_result
        
        # Gerar resposta
        result = super().generate(prompt, task_type, **kwargs)
        
        # Cache resultado
        self.cache.set(cache_key, result, query=prompt)
        
        return result
```

### 2: Integração com RAG

```python
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from cache_system.multi_level.multi_level_cache import MultiLevelCache

class CachedRAGRetriever(HybridRetriever):
    """Retriever RAG com cache."""
    
    def __init__(self, config, cache: MultiLevelCache):
        super().__init__(config)
        self.cache = cache
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Recupera documentos com cache."""
        # Gerar chave de cache
        cache_key = f"rag:{hashlib.md5(query.encode()).hexdigest()}"
        
        # Tentar cache
        cached_results = self.cache.get(cache_key, query=query)
        if cached_results:
            import json
            return json.loads(cached_results)
        
        # Recuperar documentos
        results = super().retrieve(query, top_k=top_k)
        
        # Cache resultados
        self.cache.set(cache_key, json.dumps(results), query=query)
        
        return results
```

### 3: Integração com Sistema de Memória

```python
from memory_system.core.hierarchy import MemoryHierarchy
from cache_system.multi_level.multi_level_cache import MultiLevelCache

class CachedMemory(MemoryHierarchy):
    """Sistema de memória com cache."""
    
    def __init__(self, cache: MultiLevelCache):
        super().__init__()
        self.cache = cache
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera memórias com cache."""
        # Gerar chave de cache
        cache_key = f"memory:{memory_type.value if memory_type else 'all'}:{hashlib.md5(query.encode()).hexdigest()}"
        
        # Tentar cache
        cached_results = self.cache.get(cache_key, query=query)
        if cached_results:
            import json
            entry_ids = json.loads(cached_results)
            return [self.get(eid) for eid in entry_ids if self.get(eid)]
        
        # Recuperar memórias
        results = super().retrieve(query, memory_type, top_k, **kwargs)
        
        # Cache IDs
        self.cache.set(cache_key, json.dumps([e.entry_id for e in results]), query=query)
        
        return results
```

## Próximos Passos

1. Implementar storage Redis completo
2. Adicionar suporte a cache distribuído
3. Implementar sistema de invalidação por eventos
4. Adicionar métricas avançadas
5. Implementar dashboard de cache
6. Adicionar suporte a custom eviction policies
7. Implementar testes de performance
8. Adicionar documentação de API
