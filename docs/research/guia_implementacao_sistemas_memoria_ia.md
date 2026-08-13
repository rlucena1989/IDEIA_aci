# Guia de Implementação - Sistemas de Memória IA

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de sistemas de memória para IA para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de sistemas de memória hierárquica para IA, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install numpy redis faiss-cpu sentence-transformers
```

### Estrutura de Diretórios

```
packages/
├── memory_system/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── hierarchy.py          # Hierarquia de memória
│   │   ├── memory_entry.py       # Entrada de memória
│   │   └── memory_types.py       # Tipos de memória
│   ├── levels/
│   │   ├── __init__.py
│   │   ├── working_memory.py     # Memória de trabalho (curto prazo)
│   │   ├── project_memory.py     # Memória de projeto (médio prazo)
│   │   ├── global_memory.py      # Memória global (longo prazo)
│   │   └── institutional_memory.py # Memória institucional (enterprise)
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── retriever.py          # Recuperador de memória
│   │   ├── similarity.py         # Similaridade semântica
│   │   └── ranking.py            # Ranking de resultados
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── memory_store.py       # Armazenamento de memória
│   │   ├── redis_store.py        # Storage Redis
│   │   └── file_store.py         # Storage em arquivo
│   ├── indexing/
│   │   ├── __init__.py
│   │   ├── vector_indexer.py     # Indexador vetorial
│   │   ├── text_indexer.py       # Indexador de texto
│   │   └── hybrid_indexer.py     # Indexador híbrido
│   ├── management/
│   │   ├── __init__.py
│   │   ├── eviction.py           # Política de evicção
│   │   ├── consolidation.py      # Consolidação de memória
│   │   └── cleanup.py            # Limpeza de memória
│   └── utils/
│       ├── __init__.py
│       ├── embeddings.py         # Geração de embeddings
│       └── validators.py         # Validadores
```

## Passo 1: Tipos de Memória (core/memory_types.py)

```python
"""
Definições de tipos de memória.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class MemoryType(Enum):
    """Tipos de memória."""
    WORKING = "working"  # Curto prazo, sessão atual
    PROJECT = "project"  # Médio prazo, projeto específico
    GLOBAL = "global"  # Longo prazo, cross-session
    INSTITUTIONAL = "institutional"  # Enterprise, cross-project

class MemoryPriority(Enum):
    """Prioridade de memória."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class MemoryAccessPattern(Enum):
    """Padrão de acesso."""
    SEQUENTIAL = "sequential"
    RANDOM = "random"
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used

class MemoryConfig:
    """Configuração de memória."""
    
    def __init__(
        self,
        memory_type: MemoryType,
        max_size: int = 1000,
        ttl: Optional[timedelta] = None,
        priority: MemoryPriority = MemoryPriority.MEDIUM,
        access_pattern: MemoryAccessPattern = MemoryAccessPattern.LRU
    ):
        self.memory_type = memory_type
        self.max_size = max_size
        self.ttl = ttl
        self.priority = priority
        self.access_pattern = access_pattern
        
        # Configurações específicas por tipo
        self._apply_type_defaults()
    
    def _apply_type_defaults(self):
        """Aplica configurações padrão por tipo."""
        defaults = {
            MemoryType.WORKING: {
                "max_size": 100,
                "ttl": timedelta(hours=1),
                "priority": MemoryPriority.HIGH,
                "access_pattern": MemoryAccessPattern.LRU
            },
            MemoryType.PROJECT: {
                "max_size": 1000,
                "ttl": timedelta(days=7),
                "priority": MemoryPriority.MEDIUM,
                "access_pattern": MemoryAccessPattern.LRU
            },
            MemoryType.GLOBAL: {
                "max_size": 10000,
                "ttl": timedelta(days=30),
                "priority": MemoryPriority.LOW,
                "access_pattern": MemoryAccessPattern.LFU
            },
            MemoryType.INSTITUTIONAL: {
                "max_size": 100000,
                "ttl": None,  # Sem TTL
                "priority": MemoryPriority.CRITICAL,
                "access_pattern": MemoryAccessPattern.RANDOM
            }
        }
        
        if self.memory_type in defaults:
            default = defaults[self.memory_type]
            if self.max_size == 1000:  # Valor padrão
                self.max_size = default["max_size"]
            if self.ttl is None:
                self.ttl = default["ttl"]
            if self.priority == MemoryPriority.MEDIUM:
                self.priority = default["priority"]
            if self.access_pattern == MemoryAccessPattern.LRU:
                self.access_pattern = default["access_pattern"]
```

## Passo 2: Entrada de Memória (core/memory_entry.py)

```python
"""
Entrada de memória com metadados e embeddings.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field
import hashlib

@dataclass
class MemoryEntry:
    """Entrada de memória."""
    
    # Identificação
    entry_id: str
    content: str
    memory_type: str
    
    # Metadados
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    
    # Embeddings
    embedding: Optional[List[float]] = None
    embedding_dim: int = 768
    
    # TTL
    ttl: Optional[int] = None  # segundos
    expires_at: Optional[datetime] = None
    
    # Prioridade
    priority: str = "medium"
    
    # Metadados adicionais
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Tags
    tags: List[str] = field(default_factory=list)
    
    # Relacionamentos
    related_entries: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Inicialização pós-criação."""
        if not self.entry_id:
            self.entry_id = self._generate_id()
        
        if self.ttl and not self.expires_at:
            self.expires_at = self.created_at + timedelta(seconds=self.ttl)
    
    def _generate_id(self) -> str:
        """Gera ID único para entrada."""
        content_hash = hashlib.sha256(self.content.encode()).hexdigest()[:16]
        timestamp = int(self.created_at.timestamp())
        return f"{self.memory_type}_{content_hash}_{timestamp}"
    
    def is_expired(self) -> bool:
        """Verifica se entrada expirou."""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at
    
    def access(self):
        """Registra acesso à entrada."""
        self.access_count += 1
        self.last_accessed = datetime.now()
        self.updated_at = datetime.now()
    
    def add_tag(self, tag: str):
        """Adiciona tag à entrada."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def add_related(self, entry_id: str):
        """Adiciona entrada relacionada."""
        if entry_id not in self.related_entries:
            self.related_entries.append(entry_id)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "entry_id": self.entry_id,
            "content": self.content,
            "memory_type": self.memory_type,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "access_count": self.access_count,
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "embedding": self.embedding,
            "embedding_dim": self.embedding_dim,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "priority": self.priority,
            "metadata": self.metadata,
            "tags": self.tags,
            "related_entries": self.related_entries
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryEntry":
        """Cria entrada a partir de dicionário."""
        return cls(
            entry_id=data["entry_id"],
            content=data["content"],
            memory_type=data["memory_type"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            access_count=data["access_count"],
            last_accessed=datetime.fromisoformat(data["last_accessed"]) if data["last_accessed"] else None,
            embedding=data["embedding"],
            embedding_dim=data["embedding_dim"],
            expires_at=datetime.fromisoformat(data["expires_at"]) if data["expires_at"] else None,
            priority=data["priority"],
            metadata=data["metadata"],
            tags=data["tags"],
            related_entries=data["related_entries"]
        )
```

## Passo 3: Hierarquia de Memória (core/hierarchy.py)

```python
"""
Hierarquia de memória com múltiplos níveis.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .memory_types import MemoryType, MemoryConfig
from .memory_entry import MemoryEntry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryHierarchy:
    """Hierarquia de memória com múltiplos níveis."""
    
    def __init__(self):
        """Inicializa hierarquia de memória."""
        self.levels: Dict[MemoryType, Any] = {}
        self._initialize_levels()
    
    def _initialize_levels(self):
        """Inicializa níveis de memória."""
        from levels.working_memory import WorkingMemory
        from levels.project_memory import ProjectMemory
        from levels.global_memory import GlobalMemory
        from levels.institutional_memory import InstitutionalMemory
        
        self.levels[MemoryType.WORKING] = WorkingMemory()
        self.levels[MemoryType.PROJECT] = ProjectMemory()
        self.levels[MemoryType.GLOBAL] = GlobalMemory()
        self.levels[MemoryType.INSTITUTIONAL] = InstitutionalMemory()
        
        logger.info("Memory hierarchy initialized with 4 levels")
    
    def add(self, content: str, memory_type: MemoryType, **kwargs) -> MemoryEntry:
        """Adiciona entrada à memória."""
        level = self.levels[memory_type]
        entry = level.add(content, **kwargs)
        logger.info(f"Added entry {entry.entry_id} to {memory_type.value}")
        return entry
    
    def get(self, entry_id: str, memory_type: Optional[MemoryType] = None) -> Optional[MemoryEntry]:
        """Recupera entrada da memória."""
        if memory_type:
            level = self.levels[memory_type]
            return level.get(entry_id)
        else:
            # Buscar em todos os níveis
            for level in self.levels.values():
                entry = level.get(entry_id)
                if entry:
                    return entry
        return None
    
    def retrieve(
        self,
        query: str,
        memory_type: Optional[MemoryType] = None,
        top_k: int = 5,
        **kwargs
    ) -> List[MemoryEntry]:
        """Recupera entradas relevantes."""
        if memory_type:
            level = self.levels[memory_type]
            return level.retrieve(query, top_k=top_k, **kwargs)
        else:
            # Buscar em todos os níveis e combinar resultados
            all_results = []
            for mem_type, level in self.levels.items():
                results = level.retrieve(query, top_k=top_k, **kwargs)
                all_results.extend(results)
            
            # Ordenar por relevância
            all_results.sort(key=lambda x: x.access_count, reverse=True)
            return all_results[:top_k]
    
    def update(self, entry_id: str, content: str, memory_type: Optional[MemoryType] = None) -> bool:
        """Atualiza entrada na memória."""
        if memory_type:
            level = self.levels[memory_type]
            return level.update(entry_id, content)
        else:
            # Buscar em todos os níveis
            for level in self.levels.values():
                if level.update(entry_id, content):
                    return True
        return False
    
    def delete(self, entry_id: str, memory_type: Optional[MemoryType] = None) -> bool:
        """Deleta entrada da memória."""
        if memory_type:
            level = self.levels[memory_type]
            return level.delete(entry_id)
        else:
            # Buscar em todos os níveis
            for level in self.levels.values():
                if level.delete(entry_id):
                    return True
        return False
    
    def consolidate(self, source_type: MemoryType, target_type: MemoryType, threshold: float = 0.8):
        """Consolida memória de um nível para outro."""
        source_level = self.levels[source_type]
        target_level = self.levels[target_type]
        
        # Recuperar todas as entradas do nível fonte
        entries = source_level.get_all()
        
        # Mover entradas com alta prioridade ou acesso frequente
        moved_count = 0
        for entry in entries:
            if entry.access_count > 10 or entry.priority == "critical":
                target_level.add(entry.content, **entry.to_dict())
                source_level.delete(entry.entry_id)
                moved_count += 1
        
        logger.info(f"Consolidated {moved_count} entries from {source_type.value} to {target_type.value}")
        return moved_count
    
    def cleanup(self, memory_type: Optional[MemoryType] = None):
        """Limpa entradas expiradas de memória."""
        if memory_type:
            level = self.levels[memory_type]
            return level.cleanup()
        else:
            # Limpar todos os níveis
            total_cleaned = 0
            for level in self.levels.values():
                total_cleaned += level.cleanup()
            return total_cleaned
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas da hierarquia."""
        stats = {}
        for mem_type, level in self.levels.items():
            stats[mem_type.value] = level.get_stats()
        return stats
```

## Passo 4: Memória de Trabalho (levels/working_memory.py)

```python
"""
Memória de trabalho (curto prazo, sessão atual).
"""
from typing import Dict, List, Optional
from collections import OrderedDict
from datetime import datetime, timedelta
import logging

from ..core.memory_entry import MemoryEntry
from ..core.memory_types import MemoryConfig, MemoryType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkingMemory:
    """Memória de trabalho com LRU eviction."""
    
    def __init__(self, config: Optional[MemoryConfig] = None):
        """Inicializa memória de trabalho."""
        self.config = config or MemoryConfig(MemoryType.WORKING)
        self.entries: OrderedDict[str, MemoryEntry] = OrderedDict()
        self.max_size = self.config.max_size
        self.ttl = self.config.ttl or timedelta(hours=1)
    
    def add(self, content: str, **kwargs) -> MemoryEntry:
        """Adiciona entrada à memória de trabalho."""
        # Criar entrada
        entry = MemoryEntry(
            entry_id="",
            content=content,
            memory_type="working",
            ttl=int(self.ttl.total_seconds()),
            **kwargs
        )
        
        # Evict se necessário
        if len(self.entries) >= self.max_size:
            self._evict()
        
        # Adicionar
        self.entries[entry.entry_id] = entry
        logger.debug(f"Added entry {entry.entry_id} to working memory")
        
        return entry
    
    def get(self, entry_id: str) -> Optional[MemoryEntry]:
        """Recupera entrada da memória de trabalho."""
        entry = self.entries.get(entry_id)
        
        if entry:
            # Verificar expiração
            if entry.is_expired():
                self.delete(entry_id)
                return None
            
            # Mover para o final (LRU)
            self.entries.move_to_end(entry_id)
            entry.access()
            
            return entry
        
        return None
    
    def retrieve(self, query: str, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas relevantes."""
        # Busca simples por substring
        results = []
        query_lower = query.lower()
        
        for entry_id, entry in self.entries.items():
            if entry.is_expired():
                continue
            
            if query_lower in entry.content.lower():
                results.append(entry)
                entry.access()
        
        # Ordenar por access_count
        results.sort(key=lambda x: x.access_count, reverse=True)
        
        return results[:top_k]
    
    def update(self, entry_id: str, content: str) -> bool:
        """Atualiza entrada na memória de trabalho."""
        entry = self.entries.get(entry_id)
        
        if entry:
            entry.content = content
            entry.updated_at = datetime.now()
            entry.access()
            self.entries.move_to_end(entry_id)
            return True
        
        return False
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada da memória de trabalho."""
        if entry_id in self.entries:
            del self.entries[entry_id]
            return True
        return False
    
    def get_all(self) -> List[MemoryEntry]:
        """Retorna todas as entradas."""
        return list(self.entries.values())
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas."""
        expired_ids = [
            entry_id for entry_id, entry in self.entries.items()
            if entry.is_expired()
        ]
        
        for entry_id in expired_ids:
            del self.entries[entry_id]
        
        logger.info(f"Cleaned up {len(expired_ids)} expired entries from working memory")
        return len(expired_ids)
    
    def _evict(self):
        """Evict entrada menos recentemente usada."""
        if self.entries:
            entry_id, entry = self.entries.popitem(last=False)
            logger.debug(f"Evicted entry {entry_id} from working memory")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_entries": len(self.entries),
            "max_size": self.max_size,
            "ttl_seconds": self.ttl.total_seconds(),
            "utilization": len(self.entries) / self.max_size
        }
```

## Passo 5: Memória de Projeto (levels/project_memory.py)

```python
"""
Memória de projeto (médio prazo, projeto específico).
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

from ..core.memory_entry import MemoryEntry
from ..core.memory_types import MemoryConfig, MemoryType
from ..storage.redis_store import RedisStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectMemory:
    """Memória de projeto com persistência Redis."""
    
    def __init__(self, config: Optional[MemoryConfig] = None, project_id: str = "default"):
        """Inicializa memória de projeto."""
        self.config = config or MemoryConfig(MemoryType.PROJECT)
        self.project_id = project_id
        self.storage = RedisStore(prefix=f"project:{project_id}")
        self.max_size = self.config.max_size
        self.ttl = self.config.ttl or timedelta(days=7)
    
    def add(self, content: str, **kwargs) -> MemoryEntry:
        """Adiciona entrada à memória de projeto."""
        # Criar entrada
        entry = MemoryEntry(
            entry_id="",
            content=content,
            memory_type="project",
            ttl=int(self.ttl.total_seconds()),
            metadata={"project_id": self.project_id},
            **kwargs
        )
        
        # Persistir
        self.storage.set(entry.entry_id, entry.to_dict())
        
        logger.debug(f"Added entry {entry.entry_id} to project memory")
        
        return entry
    
    def get(self, entry_id: str) -> Optional[MemoryEntry]:
        """Recupera entrada da memória de projeto."""
        data = self.storage.get(entry_id)
        
        if data:
            entry = MemoryEntry.from_dict(data)
            
            # Verificar expiração
            if entry.is_expired():
                self.delete(entry_id)
                return None
            
            entry.access()
            self.storage.set(entry_id, entry.to_dict())
            
            return entry
        
        return None
    
    def retrieve(self, query: str, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas relevantes."""
        # Busca por tags ou metadados
        all_entries = self.storage.get_all()
        results = []
        query_lower = query.lower()
        
        for data in all_entries:
            entry = MemoryEntry.from_dict(data)
            
            if entry.is_expired():
                continue
            
            # Busca por conteúdo
            if query_lower in entry.content.lower():
                results.append(entry)
                entry.access()
            
            # Busca por tags
            elif any(query_lower in tag.lower() for tag in entry.tags):
                results.append(entry)
                entry.access()
        
        # Ordenar por access_count
        results.sort(key=lambda x: x.access_count, reverse=True)
        
        return results[:top_k]
    
    def update(self, entry_id: str, content: str) -> bool:
        """Atualiza entrada na memória de projeto."""
        data = self.storage.get(entry_id)
        
        if data:
            entry = MemoryEntry.from_dict(data)
            entry.content = content
            entry.updated_at = datetime.now()
            entry.access()
            
            self.storage.set(entry_id, entry.to_dict())
            return True
        
        return False
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada da memória de projeto."""
        return self.storage.delete(entry_id)
    
    def get_all(self) -> List[MemoryEntry]:
        """Retorna todas as entradas."""
        all_data = self.storage.get_all()
        return [MemoryEntry.from_dict(data) for data in all_data]
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas."""
        all_entries = self.get_all()
        expired_count = 0
        
        for entry in all_entries:
            if entry.is_expired():
                self.delete(entry.entry_id)
                expired_count += 1
        
        logger.info(f"Cleaned up {expired_count} expired entries from project memory")
        return expired_count
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        all_entries = self.get_all()
        return {
            "total_entries": len(all_entries),
            "max_size": self.max_size,
            "ttl_seconds": self.ttl.total_seconds(),
            "project_id": self.project_id,
            "utilization": len(all_entries) / self.max_size
        }
```

## Passo 6: Memória Global (levels/global_memory.py)

```python
"""
Memória global (longo prazo, cross-session).
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

from ..core.memory_entry import MemoryEntry
from ..core.memory_types import MemoryConfig, MemoryType
from ..storage.redis_store import RedisStore
from ..indexing.vector_indexer import VectorIndexer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GlobalMemory:
    """Memória global com indexação vetorial."""
    
    def __init__(self, config: Optional[MemoryConfig] = None):
        """Inicializa memória global."""
        self.config = config or MemoryConfig(MemoryType.GLOBAL)
        self.storage = RedisStore(prefix="global")
        self.vector_indexer = VectorIndexer(dimension=768)
        self.max_size = self.config.max_size
        self.ttl = self.config.ttl or timedelta(days=30)
    
    def add(self, content: str, **kwargs) -> MemoryEntry:
        """Adiciona entrada à memória global."""
        # Criar entrada
        entry = MemoryEntry(
            entry_id="",
            content=content,
            memory_type="global",
            ttl=int(self.ttl.total_seconds()),
            **kwargs
        )
        
        # Gerar embedding
        embedding = self.vector_indexer.generate_embedding(content)
        entry.embedding = embedding.tolist()
        
        # Persistir
        self.storage.set(entry.entry_id, entry.to_dict())
        
        # Indexar
        self.vector_indexer.add(entry.entry_id, embedding)
        
        logger.debug(f"Added entry {entry.entry_id} to global memory")
        
        return entry
    
    def get(self, entry_id: str) -> Optional[MemoryEntry]:
        """Recupera entrada da memória global."""
        data = self.storage.get(entry_id)
        
        if data:
            entry = MemoryEntry.from_dict(data)
            
            if entry.is_expired():
                self.delete(entry_id)
                return None
            
            entry.access()
            self.storage.set(entry_id, entry.to_dict())
            
            return entry
        
        return None
    
    def retrieve(self, query: str, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas relevantes usando busca vetorial."""
        # Gerar embedding da query
        query_embedding = self.vector_indexer.generate_embedding(query)
        
        # Busca vetorial
        similar_ids = self.vector_indexer.search(query_embedding, top_k=top_k)
        
        # Recuperar entradas
        results = []
        for entry_id in similar_ids:
            entry = self.get(entry_id)
            if entry:
                results.append(entry)
        
        return results
    
    def update(self, entry_id: str, content: str) -> bool:
        """Atualiza entrada na memória global."""
        data = self.storage.get(entry_id)
        
        if data:
            entry = MemoryEntry.from_dict(data)
            entry.content = content
            entry.updated_at = datetime.now()
            entry.access()
            
            # Re-indexar
            embedding = self.vector_indexer.generate_embedding(content)
            entry.embedding = embedding.tolist()
            self.vector_indexer.update(entry_id, embedding)
            
            self.storage.set(entry_id, entry.to_dict())
            return True
        
        return False
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada da memória global."""
        # Remover do índice vetorial
        self.vector_indexer.delete(entry_id)
        
        # Remover do storage
        return self.storage.delete(entry_id)
    
    def get_all(self) -> List[MemoryEntry]:
        """Retorna todas as entradas."""
        all_data = self.storage.get_all()
        return [MemoryEntry.from_dict(data) for data in all_data]
    
    def cleanup(self) -> int:
        """Limpa entradas expiradas."""
        all_entries = self.get_all()
        expired_count = 0
        
        for entry in all_entries:
            if entry.is_expired():
                self.delete(entry.entry_id)
                expired_count += 1
        
        logger.info(f"Cleaned up {expired_count} expired entries from global memory")
        return expired_count
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        all_entries = self.get_all()
        return {
            "total_entries": len(all_entries),
            "max_size": self.max_size,
            "ttl_seconds": self.ttl.total_seconds(),
            "indexed_entries": self.vector_indexer.size(),
            "utilization": len(all_entries) / self.max_size
        }
```

## Passo 7: Storage Redis (storage/redis_store.py)

```python
"""
Storage Redis para persistência de memória.
"""
from typing import Dict, Any, List, Optional
import json
import logging

try:
    import redis
except ImportError:
    redis = None
    logging.warning("Redis not installed, using fallback storage")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedisStore:
    """Storage Redis para memória."""
    
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, prefix: str = "memory"):
        """Inicializa storage Redis."""
        self.prefix = prefix
        
        if redis:
            self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
            logger.info(f"Connected to Redis at {host}:{port}")
        else:
            self.client = None
            self._fallback_storage: Dict[str, Dict[str, Any]] = {}
            logger.warning("Using fallback in-memory storage")
    
    def _make_key(self, key: str) -> str:
        """Cria chave com prefixo."""
        return f"{self.prefix}:{key}"
    
    def set(self, key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Define valor no storage."""
        full_key = self._make_key(key)
        
        if self.client:
            try:
                serialized = json.dumps(value)
                if ttl:
                    self.client.setex(full_key, ttl, serialized)
                else:
                    self.client.set(full_key, serialized)
                return True
            except Exception as e:
                logger.error(f"Redis set error: {e}")
                return False
        else:
            self._fallback_storage[full_key] = value
            return True
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Recupera valor do storage."""
        full_key = self._make_key(key)
        
        if self.client:
            try:
                serialized = self.client.get(full_key)
                if serialized:
                    return json.loads(serialized)
                return None
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                return None
        else:
            return self._fallback_storage.get(full_key)
    
    def delete(self, key: str) -> bool:
        """Deleta valor do storage."""
        full_key = self._make_key(key)
        
        if self.client:
            try:
                return self.client.delete(full_key) > 0
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
                return False
        else:
            if full_key in self._fallback_storage:
                del self._fallback_storage[full_key]
                return True
            return False
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Recupera todos os valores do storage."""
        if self.client:
            try:
                keys = self.client.keys(f"{self.prefix}:*")
                values = []
                for key in keys:
                    value = self.get(key.replace(f"{self.prefix}:", ""))
                    if value:
                        values.append(value)
                return values
            except Exception as e:
                logger.error(f"Redis get_all error: {e}")
                return []
        else:
            return list(self._fallback_storage.values())
    
    def exists(self, key: str) -> bool:
        """Verifica se chave existe."""
        full_key = self._make_key(key)
        
        if self.client:
            try:
                return self.client.exists(full_key) > 0
            except Exception as e:
                logger.error(f"Redis exists error: {e}")
                return False
        else:
            return full_key in self._fallback_storage
```

## Passo 8: Indexador Vetorial (indexing/vector_indexer.py)

```python
"""
Indexador vetorial para busca semântica.
"""
from typing import List, Dict, Optional
import numpy as np
import logging

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None
    logging.warning("sentence-transformers not installed, using fallback embeddings")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorIndexer:
    """Indexador vetorial para busca semântica."""
    
    def __init__(self, dimension: int = 768, model_name: str = "all-MiniLM-L6-v2"):
        """Inicializa indexador vetorial."""
        self.dimension = dimension
        self.model_name = model_name
        self.embeddings: Dict[str, np.ndarray] = {}
        
        if SentenceTransformer:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded sentence transformer model: {model_name}")
        else:
            self.model = None
            logger.warning("Using fallback hash-based embeddings")
    
    def generate_embedding(self, text: str) -> np.ndarray:
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
    
    def add(self, key: str, embedding: np.ndarray):
        """Adiciona embedding ao índice."""
        self.embeddings[key] = embedding
    
    def update(self, key: str, embedding: np.ndarray):
        """Atualiza embedding no índice."""
        self.embeddings[key] = embedding
    
    def delete(self, key: str):
        """Deleta embedding do índice."""
        if key in self.embeddings:
            del self.embeddings[key]
    
    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[str]:
        """Busca embeddings similares."""
        if not self.embeddings:
            return []
        
        similarities = []
        
        for key, embedding in self.embeddings.items():
            # Similaridade cosseno
            similarity = np.dot(query_embedding, embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(embedding)
            )
            similarities.append((key, similarity))
        
        # Ordenar por similaridade
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Retornar top_k chaves
        return [key for key, _ in similarities[:top_k]]
    
    def size(self) -> int:
        """Retorna tamanho do índice."""
        return len(self.embeddings)
```

## Passo 9: Exemplo de Uso

```python
"""
Exemplo de uso do sistema de memória.
"""
from memory_system.core.hierarchy import MemoryHierarchy
from memory_system.core.memory_types import MemoryType

# Criar hierarquia de memória
memory_hierarchy = MemoryHierarchy()

# Adicionar à memória de trabalho
working_entry = memory_hierarchy.add(
    content="User is working on REST API implementation",
    memory_type=MemoryType.WORKING,
    tags=["api", "rest", "implementation"]
)
print(f"Added to working memory: {working_entry.entry_id}")

# Adicionar à memória de projeto
project_entry = memory_hierarchy.add(
    content="Project uses Python 3.11 and FastAPI",
    memory_type=MemoryType.PROJECT,
    metadata={"language": "python", "framework": "fastapi"}
)
print(f"Added to project memory: {project_entry.entry_id}")

# Adicionar à memória global
global_entry = memory_hierarchy.add(
    content="Best practice: Always validate user input",
    memory_type=MemoryType.GLOBAL,
    priority="high",
    tags=["best-practice", "security"]
)
print(f"Added to global memory: {global_entry.entry_id}")

# Recuperar memória relevante
relevant_memories = memory_hierarchy.retrieve("REST API", top_k=3)
print(f"\nRelevant memories for 'REST API':")
for entry in relevant_memories:
    print(f"- {entry.entry_id}: {entry.content[:50]}...")

# Recuperar entrada específica
retrieved = memory_hierarchy.get(working_entry.entry_id)
print(f"\nRetrieved entry: {retrieved.content if retrieved else 'Not found'}")

# Consolidar memória de trabalho para projeto
moved = memory_hierarchy.consolidate(
    source_type=MemoryType.WORKING,
    target_type=MemoryType.PROJECT
)
print(f"\nConsolidated {moved} entries from working to project memory")

# Limpar memória expirada
cleaned = memory_hierarchy.cleanup()
print(f"\nCleaned {cleaned} expired entries")

# Estatísticas
stats = memory_hierarchy.get_stats()
print(f"\nMemory hierarchy stats:")
for mem_type, stat in stats.items():
    print(f"- {mem_type}: {stat['total_entries']} entries ({stat['utilization']:.1%} utilization)")
```

## Passo 10: Testes de Validação

```python
"""
Testes de validação para sistema de memória.
"""
import pytest
from memory_system.core.hierarchy import MemoryHierarchy
from memory_system.core.memory_types import MemoryType
from memory_system.core.memory_entry import MemoryEntry

class TestMemoryHierarchy:
    """Testes para hierarquia de memória."""
    
    def test_initialization(self):
        """Testa inicialização da hierarquia."""
        hierarchy = MemoryHierarchy()
        
        assert hierarchy.levels is not None
        assert len(hierarchy.levels) == 4
        assert MemoryType.WORKING in hierarchy.levels
    
    def test_add_to_working_memory(self):
        """Testa adição à memória de trabalho."""
        hierarchy = MemoryHierarchy()
        
        entry = hierarchy.add(
            content="Test content",
            memory_type=MemoryType.WORKING
        )
        
        assert entry is not None
        assert entry.entry_id is not None
        assert entry.memory_type == "working"
    
    def test_retrieve_from_memory(self):
        """Testa recuperação de memória."""
        hierarchy = MemoryHierarchy()
        
        hierarchy.add(
            content="Python is a programming language",
            memory_type=MemoryType.GLOBAL
        )
        
        results = hierarchy.retrieve("programming", top_k=1)
        
        assert len(results) > 0
        assert "programming" in results[0].content.lower() or "language" in results[0].content.lower()
    
    def test_memory_entry_expiration(self):
        """Testa expiração de entrada de memória."""
        from datetime import timedelta
        
        entry = MemoryEntry(
            entry_id="test",
            content="Test",
            memory_type="working",
            ttl=1  # 1 segundo
        )
        
        import time
        time.sleep(2)
        
        assert entry.is_expired()
    
    def test_memory_cleanup(self):
        """Testa limpeza de memória."""
        hierarchy = MemoryHierarchy()
        
        hierarchy.add(
            content="Test content",
            memory_type=MemoryType.WORKING
        )
        
        cleaned = hierarchy.cleanup()
        
        assert cleaned >= 0

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Falha no Redis

```python
def add_with_fallback(self, content: str, **kwargs) -> MemoryEntry:
    """Adiciona entrada com fallback em caso de falha."""
    try:
        return self.add(content, **kwargs)
    except Exception as e:
        logger.error(f"Redis error, using working memory fallback: {e}")
        # Fallback para memória de trabalho
        return self.levels[MemoryType.WORKING].add(content, **kwargs)
```

### 2. Embedding Generation Falha

```python
def generate_embedding_with_fallback(self, text: str) -> np.ndarray:
    """Gera embedding com fallback."""
    try:
        return self.vector_indexer.generate_embedding(text)
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        # Fallback: embedding aleatório
        return np.random.randn(self.dimension)
```

### 3. Memória Cheia

```python
def add_with_eviction(self, content: str, **kwargs) -> MemoryEntry:
    """Adiciona entrada com evicção se necessário."""
    if len(self.entries) >= self.max_size:
        # Evict entradas de baixa prioridade
        self._evict_low_priority()
    
    return self.add(content, **kwargs)

def _evict_low_priority(self):
    """Evict entradas de baixa prioridade."""
    low_priority = [
        entry_id for entry_id, entry in self.entries.items()
        if entry.priority == "low"
    ]
    
    for entry_id in low_priority[:10]:  # Evict até 10
        del self.entries[entry_id]
```

## Integrações com Outros Componentes

### 1. Integração com Orquestração de Agentes

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from memory_system.core.hierarchy import MemoryHierarchy

class MemoryAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com sistema de memória."""
    
    def __init__(self, llm_client, memory_system: MemoryHierarchy):
        super().__init__(llm_client)
        self.memory_system = memory_system
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa usando memória."""
        # Recuperar contexto relevante da memória
        relevant_memories = self.memory_system.retrieve(state["task"], top_k=5)
        
        # Adicionar contexto ao estado
        state["context"]["memory"] = [m.content for m in relevant_memories]
        
        # Chamar implementação base
        return super().task_analyzer_node(state)
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando memória."""
        # Recuperar exemplos de código similares da memória
        code_memories = self.memory_system.retrieve(
            f"code {state['task']}",
            memory_type=MemoryType.GLOBAL,
            top_k=3
        )
        
        # Adicionar exemplos ao prompt
        state["context"]["code_examples"] = [m.content for m in code_memories]
        
        # Chamar implementação base
        result = super().code_generation_node(state)
        
        # Salvar código gerado na memória
        if "code" in result.get("intermediate_results", {}):
            self.memory_system.add(
                content=result["intermediate_results"]["code"],
                memory_type=MemoryType.PROJECT,
                tags=["generated_code", state["task_type"]]
            )
        
        return result
```

### 2. Integração com Context Management

```python
from context_management import HybridIndexer

class ContextAwareMemory(MemoryHierarchy):
    """Sistema de memória com gerenciamento de contexto."""
    
    def __init__(self, context_indexer: HybridIndexer):
        super().__init__()
        self.context_indexer = context_indexer
    
    def add(self, content: str, memory_type: MemoryType, **kwargs) -> MemoryEntry:
        """Adiciona entrada e indexa no contexto."""
        entry = super().add(content, memory_type, **kwargs)
        
        # Indexar no contexto
        self.context_indexer.index(content, metadata={"memory_id": entry.entry_id})
        
        return entry
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas usando contexto."""
        # Buscar no contexto
        context_results = self.context_indexer.search(query, top_k=top_k)
        
        # Recuperar entradas correspondentes
        memory_ids = [r.metadata.get("memory_id") for r in context_results if r.metadata.get("memory_id")]
        
        results = []
        for memory_id in memory_ids:
            entry = self.get(memory_id)
            if entry:
                results.append(entry)
        
        return results
```

### 3. Integração com RAG

```python
from rag_engine import HybridRetriever

class RAGEnhancedMemory(MemoryHierarchy):
    """Sistema de memória com RAG."""
    
    def __init__(self, rag_retriever: HybridRetriever):
        super().__init__()
        self.rag_retriever = rag_retriever
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas usando RAG."""
        # Recuperar documentos relevantes via RAG
        rag_docs = self.rag_retriever.search(query, top_k=top_k)
        
        # Buscar memórias relacionadas aos documentos
        results = []
        for doc in rag_docs:
            # Buscar memórias com tags ou conteúdo similar
            similar_memories = super().retrieve(doc.content, top_k=1)
            if similar_memories:
                results.extend(similar_memories)
        
        # Remover duplicatas
        seen_ids = set()
        unique_results = []
        for entry in results:
            if entry.entry_id not in seen_ids:
                seen_ids.add(entry.entry_id)
                unique_results.append(entry)
        
        return unique_results[:top_k]
```

## Próximos Passos

1. Implementar memória institucional com RBAC
2. Adicionar suporte a embeddings customizados
3. Implementar sistema de versionamento de memória
4. Adicionar métricas e monitoramento
5. Implementar testes de performance
6. Adicionar documentação de API
7. Criar exemplos de uso avançados
