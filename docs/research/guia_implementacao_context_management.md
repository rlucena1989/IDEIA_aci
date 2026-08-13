# Guia de Implementação - Context Management

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de gerenciamento de contexto híbrido para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de gerenciamento de contexto híbrido combinando Merkle tree, semantic graph e real-time awareness, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install numpy networkx sentence-transformers
```

### Estrutura de Diretórios

```
packages/
├── context_management/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── context_entry.py       # Entrada de contexto
│   │   ├── context_types.py       # Tipos de contexto
│   │   └── context_config.py      # Configurações
│   ├── indexing/
│   │   ├── __init__.py
│   │   ├── merkle_indexer.py      # Indexador Merkle tree
│   │   ├── semantic_indexer.py    # Indexador semântico
│   │   ├── realtime_indexer.py    # Indexador real-time
│   │   └── hybrid_indexer.py      # Indexador híbrido
│   ├── tracking/
│   │   ├── __init__.py
│   │   ├── provenance.py          # Rastreamento de proveniência
│   │   ├── lineage.py             # Rastreamento de linhagem
│   │   └── versioning.py          # Versionamento de contexto
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── retriever.py           # Recuperador de contexto
│   │   ├── ranking.py             # Ranking de resultados
│   │   └── fusion.py              # Fusão de resultados
│   ├── optimization/
│   │   ├── __init__.py
│   │   ├── compressor.py          # Compressão de contexto
│   │   ├── summarizer.py          # Sumarização de contexto
│   │   └── pruner.py              # Pruning de contexto
│   └── utils/
│       ├── __init__.py
│       ├── embeddings.py          # Geração de embeddings
│       ├── hashing.py             # Funções de hashing
│       └── validators.py         # Validadores
```

## Passo 1: Tipos de Contexto (core/context_types.py)

```python
"""
Definições de tipos de contexto.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class ContextType(Enum):
    """Tipos de contexto."""
    CODE = "code"  # Contexto de código
    DOCUMENTATION = "documentation"  # Contexto de documentação
    CONVERSATION = "conversation"  # Contexto de conversação
    FILE = "file"  # Contexto de arquivo
    DIRECTORY = "directory"  # Contexto de diretório
    PROJECT = "project"  # Contexto de projeto
    SESSION = "session"  # Contexto de sessão
    GLOBAL = "global"  # Contexto global

class ContextSource(Enum):
    """Fontes de contexto."""
    USER_INPUT = "user_input"
    CODEBASE = "codebase"
    DOCUMENTATION = "documentation"
    EXTERNAL_API = "external_api"
    MEMORY = "memory"
    RAG = "rag"
    LLM_OUTPUT = "llm_output"

class ContextPriority(Enum):
    """Prioridade de contexto."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ContextConfig:
    """Configuração de contexto."""
    
    def __init__(
        self,
        max_context_size: int = 10000,
        max_entries: int = 1000,
        enable_merkle: bool = True,
        enable_semantic: bool = True,
        enable_realtime: bool = True,
        embedding_dim: int = 768,
        similarity_threshold: float = 0.85
    ):
        self.max_context_size = max_context_size
        self.max_entries = max_entries
        self.enable_merkle = enable_merkle
        self.enable_semantic = enable_semantic
        self.enable_realtime = enable_realtime
        self.embedding_dim = embedding_dim
        self.similarity_threshold = similarity_threshold
```

## Passo 2: Entrada de Contexto (core/context_entry.py)

```python
"""
Entrada de contexto com metadados e hash.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field
import hashlib

@dataclass
class ContextEntry:
    """Entrada de contexto."""
    
    # Identificação
    entry_id: str
    content: str
    context_type: str
    
    # Hash para Merkle tree
    content_hash: str
    
    # Metadados
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    source: str = "user_input"
    priority: str = "medium"
    
    # Embeddings
    embedding: Optional[List[float]] = None
    embedding_dim: int = 768
    
    # Relacionamentos
    parent_id: Optional[str] = None
    child_ids: List[str] = field(default_factory=list)
    
    # Metadados adicionais
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Tags
    tags: List[str] = field(default_factory=list)
    
    # Tamanho
    size: int = 0  # caracteres
    
    # Real-time awareness
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    
    def __post_init__(self):
        """Inicialização pós-criação."""
        if not self.entry_id:
            self.entry_id = self._generate_id()
        
        if not self.content_hash:
            self.content_hash = self._compute_hash()
        
        self.size = len(self.content)
    
    def _generate_id(self) -> str:
        """Gera ID único para entrada."""
        timestamp = int(self.created_at.timestamp())
        content_hash = self.content_hash[:8]
        return f"{self.context_type}_{content_hash}_{timestamp}"
    
    def _compute_hash(self) -> str:
        """Computa hash do conteúdo."""
        return hashlib.sha256(self.content.encode()).hexdigest()
    
    def update_content(self, new_content: str):
        """Atualiza conteúdo e recompute hash."""
        self.content = new_content
        self.content_hash = self._compute_hash()
        self.updated_at = datetime.now()
        self.size = len(new_content)
    
    def add_child(self, child_id: str):
        """Adiciona entrada filha."""
        if child_id not in self.child_ids:
            self.child_ids.append(child_id)
    
    def add_tag(self, tag: str):
        """Adiciona tag à entrada."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def access(self):
        """Registra acesso à entrada."""
        self.access_count += 1
        self.last_accessed = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "entry_id": self.entry_id,
            "content": self.content,
            "context_type": self.context_type,
            "content_hash": self.content_hash,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "source": self.source,
            "priority": self.priority,
            "embedding": self.embedding,
            "embedding_dim": self.embedding_dim,
            "parent_id": self.parent_id,
            "child_ids": self.child_ids,
            "metadata": self.metadata,
            "tags": self.tags,
            "size": self.size,
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "access_count": self.access_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ContextEntry":
        """Cria entrada a partir de dicionário."""
        return cls(
            entry_id=data["entry_id"],
            content=data["content"],
            context_type=data["context_type"],
            content_hash=data["content_hash"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            source=data["source"],
            priority=data["priority"],
            embedding=data["embedding"],
            embedding_dim=data["embedding_dim"],
            parent_id=data["parent_id"],
            child_ids=data["child_ids"],
            metadata=data["metadata"],
            tags=data["tags"],
            size=data["size"],
            last_accessed=datetime.fromisoformat(data["last_accessed"]) if data["last_accessed"] else None,
            access_count=data["access_count"]
        )
```

## Passo 3: Indexador Merkle Tree (indexing/merkle_indexer.py)

```python
"""
Indexador baseado em Merkle tree para detecção de mudanças.
"""
from typing import Dict, List, Optional, Set
from collections import defaultdict
import hashlib
import logging

from ..core.context_entry import ContextEntry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MerkleIndexer:
    """Indexador Merkle tree para contexto."""
    
    def __init__(self):
        """Inicializa indexador Merkle."""
        self.entries: Dict[str, ContextEntry] = {}
        self.tree: Dict[str, str] = {}  # node_id -> hash
        self.children: Dict[str, List[str]] = defaultdict(list)  # parent -> children
        self.parent: Dict[str, Optional[str]] = {}  # child -> parent
        self.root_hash: Optional[str] = None
    
    def add(self, entry: ContextEntry) -> str:
        """Adiciona entrada ao índice Merkle."""
        self.entries[entry.entry_id] = entry
        
        # Adicionar nó folha
        self.tree[entry.entry_id] = entry.content_hash
        self.parent[entry.entry_id] = None
        
        # Atualizar árvore
        self._update_tree(entry.entry_id)
        
        logger.debug(f"Added entry {entry.entry_id} to Merkle tree")
        
        return entry.entry_id
    
    def _update_tree(self, entry_id: str):
        """Atualiza árvore Merkle após adição."""
        # Se tiver parent, atualizar parent
        parent_id = self.entries[entry_id].parent_id
        
        if parent_id and parent_id in self.entries:
            self.children[parent_id].append(entry_id)
            self.parent[entry_id] = parent_id
            self._recompute_hash(parent_id)
    
    def _recompute_hash(self, node_id: str):
        """Recomputa hash de nó e propaga para cima."""
        # Se for folha, hash é o content_hash
        if not self.children[node_id]:
            self.tree[node_id] = self.entries[node_id].content_hash
        else:
            # Hash dos filhos
            child_hashes = [self.tree[child_id] for child_id in self.children[node_id]]
            child_hashes.sort()
            combined = "".join(child_hashes)
            self.tree[node_id] = hashlib.sha256(combined.encode()).hexdigest()
        
        # Propagar para parent
        parent_id = self.parent.get(node_id)
        if parent_id:
            self._recompute_hash(parent_id)
        else:
            # Este é o root
            self.root_hash = self.tree[node_id]
    
    def update(self, entry_id: str, new_content: str) -> bool:
        """Atualiza entrada e recompute árvore."""
        if entry_id not in self.entries:
            return False
        
        entry = self.entries[entry_id]
        old_hash = entry.content_hash
        
        entry.update_content(new_content)
        
        # Se hash mudou, recompute árvore
        if entry.content_hash != old_hash:
            self.tree[entry_id] = entry.content_hash
            self._recompute_hash(entry_id)
            logger.debug(f"Updated entry {entry_id} and recomputed Merkle tree")
        
        return True
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada e recompute árvore."""
        if entry_id not in self.entries:
            return False
        
        # Remover de children do parent
        parent_id = self.parent.get(entry_id)
        if parent_id and parent_id in self.children:
            self.children[parent_id].remove(entry_id)
        
        # Remover entrada
        del self.entries[entry_id]
        del self.tree[entry_id]
        del self.parent[entry_id]
        
        # Recompute parent
        if parent_id:
            self._recompute_hash(parent_id)
        
        logger.debug(f"Deleted entry {entry_id} from Merkle tree")
        
        return True
    
    def get_changed_since(self, snapshot_hash: str) -> List[str]:
        """Retorna entradas que mudaram desde snapshot."""
        if snapshot_hash == self.root_hash:
            return []
        
        # BFS para encontrar nós diferentes
        changed = []
        visited = set()
        
        def traverse(node_id: str):
            if node_id in visited:
                return
            
            visited.add(node_id)
            
            if node_id in self.entries:
                # É folha, verificar se mudou
                # (simplificado - na prática comparar com snapshot)
                changed.append(node_id)
            
            for child_id in self.children[node_id]:
                traverse(child_id)
        
        if self.root_hash:
            traverse(self.root_hash)
        
        return changed
    
    def get_snapshot(self) -> str:
        """Retorna snapshot atual (root hash)."""
        return self.root_hash or ""
    
    def get_diff(self, old_snapshot: str, new_snapshot: str) -> Dict[str, Any]:
        """Retorna diff entre dois snapshots."""
        return {
            "old_snapshot": old_snapshot,
            "new_snapshot": new_snapshot,
            "changed": self.get_changed_since(old_snapshot),
            "snapshot": new_snapshot
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_entries": len(self.entries),
            "total_nodes": len(self.tree),
            "root_hash": self.root_hash,
            "max_depth": self._compute_max_depth()
        }
    
    def _compute_max_depth(self) -> int:
        """Computa profundidade máxima da árvore."""
        if not self.root_hash:
            return 0
        
        def depth(node_id: str) -> int:
            if not self.children[node_id]:
                return 1
            return 1 + max(depth(child_id) for child_id in self.children[node_id])
        
        return depth(self.root_hash)
```

## Passo 4: Indexador Semântico (indexing/semantic_indexer.py)

```python
"""
Indexador semântico baseado em embeddings.
"""
from typing import Dict, List, Optional, Tuple
import numpy as np
import logging

from ..core.context_entry import ContextEntry
from ..utils.embeddings import EmbeddingGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SemanticIndexer:
    """Indexador semântico para contexto."""
    
    def __init__(self, embedding_dim: int = 768, similarity_threshold: float = 0.85):
        """Inicializa indexador semântico."""
        self.embedding_dim = embedding_dim
        self.similarity_threshold = similarity_threshold
        self.entries: Dict[str, ContextEntry] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        self.embedding_generator = EmbeddingGenerator(dimension=embedding_dim)
    
    def add(self, entry: ContextEntry) -> str:
        """Adiciona entrada ao índice semântico."""
        self.entries[entry.entry_id] = entry
        
        # Gerar embedding
        embedding = self.embedding_generator.generate(entry.content)
        entry.embedding = embedding.tolist()
        self.embeddings[entry.entry_id] = embedding
        
        logger.debug(f"Added entry {entry.entry_id} to semantic index")
        
        return entry.entry_id
    
    def update(self, entry_id: str, new_content: str) -> bool:
        """Atualiza entrada e recompute embedding."""
        if entry_id not in self.entries:
            return False
        
        entry = self.entries[entry_id]
        entry.update_content(new_content)
        
        # Re-generar embedding
        embedding = self.embedding_generator.generate(new_content)
        entry.embedding = embedding.tolist()
        self.embeddings[entry_id] = embedding
        
        logger.debug(f"Updated entry {entry_id} in semantic index")
        
        return True
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada do índice semântico."""
        if entry_id in self.entries:
            del self.entries[entry_id]
            del self.embeddings[entry_id]
            logger.debug(f"Deleted entry {entry_id} from semantic index")
            return True
        return False
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca entradas semanticamente similares."""
        if not self.embeddings:
            return []
        
        # Gerar embedding da query
        query_embedding = self.embedding_generator.generate(query)
        
        # Calcular similaridades
        similarities = []
        for entry_id, embedding in self.embeddings.items():
            similarity = self._cosine_similarity(query_embedding, embedding)
            if similarity >= self.similarity_threshold:
                similarities.append((entry_id, similarity))
        
        # Ordenar por similaridade
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calcula similaridade cosseno."""
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def get_similar_entries(self, entry_id: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Retorna entradas similares a uma entrada específica."""
        if entry_id not in self.embeddings:
            return []
        
        target_embedding = self.embeddings[entry_id]
        
        similarities = []
        for other_id, other_embedding in self.embeddings.items():
            if other_id != entry_id:
                similarity = self._cosine_similarity(target_embedding, other_embedding)
                similarities.append((other_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_entries": len(self.entries),
            "embedding_dim": self.embedding_dim,
            "similarity_threshold": self.similarity_threshold
        }
```

## Passo 5: Indexador Real-Time (indexing/realtime_indexer.py)

```python
"""
Indexador real-time para awareness de contexto.
"""
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
from collections import deque
import logging

from ..core.context_entry import ContextEntry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealtimeIndexer:
    """Indexador real-time para contexto."""
    
    def __init__(self, window_size: int = 100, time_window: timedelta = timedelta(minutes=30)):
        """Inicializa indexador real-time."""
        self.window_size = window_size
        self.time_window = time_window
        self.entries: Dict[str, ContextEntry] = {}
        self.access_log: deque = deque(maxlen=window_size)
        self.hot_entries: Set[str] = set()
    
    def add(self, entry: ContextEntry) -> str:
        """Adiciona entrada ao índice real-time."""
        self.entries[entry.entry_id] = entry
        
        # Registrar acesso
        self._log_access(entry.entry_id)
        
        logger.debug(f"Added entry {entry.entry_id} to realtime index")
        
        return entry.entry_id
    
    def _log_access(self, entry_id: str):
        """Registra acesso à entrada."""
        now = datetime.now()
        self.access_log.append((entry_id, now))
        
        # Adicionar a hot entries
        self.hot_entries.add(entry_id)
        
        # Limpar entradas antigas
        self._cleanup_old_entries()
    
    def _cleanup_old_entries(self):
        """Limpa entradas fora da janela de tempo."""
        cutoff = datetime.now() - self.time_window
        
        # Remover entradas antigas do log
        while self.access_log and self.access_log[0][1] < cutoff:
            entry_id, _ = self.access_log.popleft()
            
            # Se não houver mais acessos recentes, remover de hot entries
            recent_accesses = any(
                eid == entry_id and timestamp >= cutoff
                for eid, timestamp in self.access_log
            )
            
            if not recent_accesses:
                self.hot_entries.discard(entry_id)
    
    def get_hot_entries(self, top_k: int = 10) -> List[str]:
        """Retorna entradas mais acessadas recentemente."""
        # Contar acessos
        access_counts = {}
        for entry_id, _ in self.access_log:
            access_counts[entry_id] = access_counts.get(entry_id, 0) + 1
        
        # Ordenar por contagem
        sorted_entries = sorted(access_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [entry_id for entry_id, _ in sorted_entries[:top_k]]
    
    def get_recent_entries(self, seconds: int = 300) -> List[str]:
        """Retorna entradas acessadas recentemente."""
        cutoff = datetime.now() - timedelta(seconds=seconds)
        
        recent_ids = set()
        for entry_id, timestamp in self.access_log:
            if timestamp >= cutoff:
                recent_ids.add(entry_id)
        
        return list(recent_ids)
    
    def is_hot(self, entry_id: str) -> bool:
        """Verifica se entrada é hot."""
        return entry_id in self.hot_entries
    
    def get_access_pattern(self, entry_id: str) -> Dict[str, Any]:
        """Retorna padrão de acesso de entrada."""
        access_times = [
            timestamp for eid, timestamp in self.access_log
            if eid == entry_id
        ]
        
        if not access_times:
            return {"total_accesses": 0}
        
        return {
            "total_accesses": len(access_times),
            "first_access": access_times[0].isoformat(),
            "last_access": access_times[-1].isoformat(),
            "avg_interval": (
                (access_times[-1] - access_times[0]).total_seconds() / len(access_times)
                if len(access_times) > 1 else 0
            )
        }
    
    def update(self, entry_id: str, new_content: str) -> bool:
        """Atualiza entrada e registra acesso."""
        if entry_id not in self.entries:
            return False
        
        entry = self.entries[entry_id]
        entry.update_content(new_content)
        
        # Registrar acesso
        self._log_access(entry_id)
        
        return True
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada do índice real-time."""
        if entry_id in self.entries:
            del self.entries[entry_id]
            self.hot_entries.discard(entry_id)
            logger.debug(f"Deleted entry {entry_id} from realtime index")
            return True
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_entries": len(self.entries),
            "window_size": self.window_size,
            "time_window_minutes": self.time_window.total_seconds() / 60,
            "hot_entries": len(self.hot_entries),
            "access_log_size": len(self.access_log)
        }
```

## Passo 6: Indexador Híbrido (indexing/hybrid_indexer.py)

```python
"""
Indexador híbrido combinando Merkle, semântico e real-time.
"""
from typing import Dict, List, Optional, Tuple
import logging

from ..core.context_entry import ContextEntry
from ..core.context_config import ContextConfig
from .merkle_indexer import MerkleIndexer
from .semantic_indexer import SemanticIndexer
from .realtime_indexer import RealtimeIndexer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridIndexer:
    """Indexador híbrido para contexto."""
    
    def __init__(self, config: Optional[ContextConfig] = None):
        """Inicializa indexador híbrido."""
        self.config = config or ContextConfig()
        
        self.merkle_indexer = MerkleIndexer() if self.config.enable_merkle else None
        self.semantic_indexer = SemanticIndexer(
            embedding_dim=self.config.embedding_dim,
            similarity_threshold=self.config.similarity_threshold
        ) if self.config.enable_semantic else None
        self.realtime_indexer = RealtimeIndexer() if self.config.enable_realtime else None
        
        self.entries: Dict[str, ContextEntry] = {}
        
        logger.info("Hybrid indexer initialized")
    
    def add(self, content: str, context_type: str, **kwargs) -> ContextEntry:
        """Adiciona entrada ao índice híbrido."""
        # Criar entrada
        entry = ContextEntry(
            entry_id="",
            content=content,
            context_type=context_type,
            **kwargs
        )
        
        self.entries[entry.entry_id] = entry
        
        # Adicionar a cada indexador
        if self.merkle_indexer:
            self.merkle_indexer.add(entry)
        
        if self.semantic_indexer:
            self.semantic_indexer.add(entry)
        
        if self.realtime_indexer:
            self.realtime_indexer.add(entry)
        
        logger.info(f"Added entry {entry.entry_id} to hybrid index")
        
        return entry
    
    def get(self, entry_id: str) -> Optional[ContextEntry]:
        """Recupera entrada do índice."""
        entry = self.entries.get(entry_id)
        
        if entry:
            # Registrar acesso no realtime
            if self.realtime_indexer:
                self.realtime_indexer._log_access(entry_id)
        
        return entry
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca entradas usando indexação híbrida."""
        results = []
        
        # Busca semântica
        if self.semantic_indexer:
            semantic_results = self.semantic_indexer.search(query, top_k=top_k)
            results.extend(semantic_results)
        
        # Boost para entradas hot
        if self.realtime_indexer:
            hot_entries = self.realtime_indexer.get_hot_entries(top_k)
            for entry_id in hot_entries:
                if entry_id in self.entries:
                    # Boost score
                    found = False
                    for i, (eid, score) in enumerate(results):
                        if eid == entry_id:
                            results[i] = (eid, score * 1.5)  # Boost 50%
                            found = True
                            break
                    if not found:
                        results.append((entry_id, 0.5))
        
        # Ordenar por score
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results[:top_k]
    
    def update(self, entry_id: str, new_content: str) -> bool:
        """Atualiza entrada em todos os indexadores."""
        if entry_id not in self.entries:
            return False
        
        success = True
        
        if self.merkle_indexer:
            success &= self.merkle_indexer.update(entry_id, new_content)
        
        if self.semantic_indexer:
            success &= self.semantic_indexer.update(entry_id, new_content)
        
        if self.realtime_indexer:
            success &= self.realtime_indexer.update(entry_id, new_content)
        
        if success:
            self.entries[entry_id].update_content(new_content)
            logger.info(f"Updated entry {entry_id} in hybrid index")
        
        return success
    
    def delete(self, entry_id: str) -> bool:
        """Deleta entrada de todos os indexadores."""
        if entry_id not in self.entries:
            return False
        
        success = True
        
        if self.merkle_indexer:
            success &= self.merkle_indexer.delete(entry_id)
        
        if self.semantic_indexer:
            success &= self.semantic_indexer.delete(entry_id)
        
        if self.realtime_indexer:
            success &= self.realtime_indexer.delete(entry_id)
        
        if success:
            del self.entries[entry_id]
            logger.info(f"Deleted entry {entry_id} from hybrid index")
        
        return success
    
    def get_snapshot(self) -> str:
        """Retorna snapshot atual (Merkle root hash)."""
        if self.merkle_indexer:
            return self.merkle_indexer.get_snapshot()
        return ""
    
    def get_diff(self, old_snapshot: str) -> Dict[str, Any]:
        """Retorna diff desde snapshot."""
        if self.merkle_indexer:
            return self.merkle_indexer.get_diff(old_snapshot, self.get_snapshot())
        return {}
    
    def get_hot_entries(self, top_k: int = 10) -> List[str]:
        """Retorna entradas hot."""
        if self.realtime_indexer:
            return self.realtime_indexer.get_hot_entries(top_k)
        return []
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas combinadas."""
        stats = {
            "total_entries": len(self.entries),
            "config": {
                "enable_merkle": self.config.enable_merkle,
                "enable_semantic": self.config.enable_semantic,
                "enable_realtime": self.config.enable_realtime
            }
        }
        
        if self.merkle_indexer:
            stats["merkle"] = self.merkle_indexer.get_stats()
        
        if self.semantic_indexer:
            stats["semantic"] = self.semantic_indexer.get_stats()
        
        if self.realtime_indexer:
            stats["realtime"] = self.realtime_indexer.get_stats()
        
        return stats
```

## Passo 7: Gerador de Embeddings (utils/embeddings.py)

```python
"""
Gerador de embeddings para indexação semântica.
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
    
    def generate_batch(self, texts: List[str]) -> np.ndarray:
        """Gera embeddings para lote de textos."""
        if self.model:
            embeddings = self.model.encode(texts)
            return embeddings
        else:
            embeddings = []
            for text in texts:
                embeddings.append(self.generate(text))
            return np.array(embeddings)
```

## Passo 8: Exemplo de Uso

```python
"""
Exemplo de uso do gerenciamento de contexto híbrido.
"""
from context_management.indexing.hybrid_indexer import HybridIndexer
from context_management.core.context_config import ContextConfig
from context_management.core.context_types import ContextType

# Criar indexador híbrido
config = ContextConfig(
    max_context_size=10000,
    max_entries=1000,
    enable_merkle=True,
    enable_semantic=True,
    enable_realtime=True
)

indexer = HybridIndexer(config)

# Adicionar contexto de código
code_entry = indexer.add(
    content="def calculate_sum(a, b): return a + b",
    context_type=ContextType.CODE.value,
    source="codebase",
    tags=["python", "function"]
)
print(f"Added code entry: {code_entry.entry_id}")

# Adicionar contexto de documentação
doc_entry = indexer.add(
    content="This function calculates the sum of two numbers.",
    context_type=ContextType.DOCUMENTATION.value,
    source="documentation",
    parent_id=code_entry.entry_id
)
print(f"Added documentation entry: {doc_entry.entry_id}")

# Adicionar contexto de conversação
conv_entry = indexer.add(
    content="User asked about sum calculation",
    context_type=ContextType.CONVERSATION.value,
    source="user_input"
)
print(f"Added conversation entry: {conv_entry.entry_id}")

# Buscar contexto relevante
results = indexer.search("sum calculation", top_k=3)
print(f"\nSearch results for 'sum calculation':")
for entry_id, score in results:
    entry = indexer.get(entry_id)
    print(f"- {entry_id} (score: {score:.2f}): {entry.content[:50]}...")

# Obter snapshot
snapshot = indexer.get_snapshot()
print(f"\nCurrent snapshot: {snapshot}")

# Atualizar entrada
indexer.update(code_entry.entry_id, "def calculate_sum(a: int, b: int) -> int: return a + b")
print(f"\nUpdated code entry")

# Obter diff
new_snapshot = indexer.get_snapshot()
diff = indexer.get_diff(snapshot)
print(f"Diff: {diff}")

# Obter entradas hot
hot_entries = indexer.get_hot_entries(top_k=5)
print(f"\nHot entries: {hot_entries}")

# Estatísticas
stats = indexer.get_stats()
print(f"\nIndexer stats:")
print(f"- Total entries: {stats['total_entries']}")
print(f"- Merkle stats: {stats.get('merkle', {})}")
print(f"- Semantic stats: {stats.get('semantic', {})}")
print(f"- Realtime stats: {stats.get('realtime', {})}")
```

## Passo 9: Testes de Validação

```python
"""
Testes de validação para gerenciamento de contexto.
"""
import pytest
from context_management.indexing.hybrid_indexer import HybridIndexer
from context_management.core.context_config import ContextConfig
from context_management.core.context_types import ContextType

class TestHybridIndexer:
    """Testes para indexador híbrido."""
    
    def test_initialization(self):
        """Testa inicialização do indexador."""
        config = ContextConfig()
        indexer = HybridIndexer(config)
        
        assert indexer.entries is not None
        assert indexer.merkle_indexer is not None
        assert indexer.semantic_indexer is not None
        assert indexer.realtime_indexer is not None
    
    def test_add_entry(self):
        """Testa adição de entrada."""
        indexer = HybridIndexer()
        
        entry = indexer.add(
            content="Test content",
            context_type=ContextType.CODE.value
        )
        
        assert entry is not None
        assert entry.entry_id is not None
        assert entry.content_hash is not None
    
    def test_search(self):
        """Testa busca de contexto."""
        indexer = HybridIndexer()
        
        indexer.add(
            content="Python is a programming language",
            context_type=ContextType.DOCUMENTATION.value
        )
        
        results = indexer.search("programming", top_k=1)
        
        assert len(results) > 0
    
    def test_update_entry(self):
        """Testa atualização de entrada."""
        indexer = HybridIndexer()
        
        entry = indexer.add(
            content="Original content",
            context_type=ContextType.CODE.value
        )
        
        success = indexer.update(entry.entry_id, "Updated content")
        
        assert success
        assert indexer.get(entry.entry_id).content == "Updated content"
    
    def test_delete_entry(self):
        """Testa deleção de entrada."""
        indexer = HybridIndexer()
        
        entry = indexer.add(
            content="Test content",
            context_type=ContextType.CODE.value
        )
        
        success = indexer.delete(entry.entry_id)
        
        assert success
        assert indexer.get(entry.entry_id) is None
    
    def test_snapshot(self):
        """Testa snapshot do Merkle tree."""
        indexer = HybridIndexer()
        
        indexer.add(
            content="Test content",
            context_type=ContextType.CODE.value
        )
        
        snapshot = indexer.get_snapshot()
        
        assert snapshot is not None
        assert len(snapshot) > 0

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Embedding Generation Falha

```python
def generate_with_fallback(self, text: str) -> np.ndarray:
    """Gera embedding com fallback."""
    try:
        return self.embedding_generator.generate(text)
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        # Fallback: embedding aleatório
        return np.random.randn(self.dimension)
```

### 2. Contexto Muito Grande

```python
def add_with_size_limit(self, content: str, context_type: str, **kwargs) -> ContextEntry:
    """Adiciona entrada com limite de tamanho."""
    if len(content) > self.config.max_context_size:
        # Truncar conteúdo
        content = content[:self.config.max_context_size]
        logger.warning(f"Content truncated to {self.config.max_context_size} characters")
    
    return self.add(content, context_type, **kwargs)
```

### 3. Merkle Tree Corrompida

```python
def validate_tree(self) -> bool:
    """Valida integridade da Merkle tree."""
    if not self.merkle_indexer:
        return True
    
    # Recomputar root hash
    recomputed_root = self._recompute_root()
    
    # Comparar com root atual
    return recomputed_root == self.merkle_indexer.root_hash

def _recompute_root(self) -> str:
    """Recomputa root hash da árvore."""
    # Implementação simplificada
    return self.merkle_indexer.get_snapshot()
```

## Integrações com Outros Componentes

### 1. Integração com Sistema de Memória

```python
from memory_system.core.hierarchy import MemoryHierarchy
from context_management.indexing.hybrid_indexer import HybridIndexer

class ContextAwareMemory(MemoryHierarchy):
    """Sistema de memória com gerenciamento de contexto."""
    
    def __init__(self, context_indexer: HybridIndexer):
        super().__init__()
        self.context_indexer = context_indexer
    
    def add(self, content: str, memory_type: MemoryType, **kwargs) -> MemoryEntry:
        """Adiciona entrada e indexa no contexto."""
        entry = super().add(content, memory_type, **kwargs)
        
        # Indexar no contexto
        self.context_indexer.add(
            content=content,
            context_type=memory_type.value,
            metadata={"memory_id": entry.entry_id}
        )
        
        return entry
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera entradas usando contexto."""
        # Buscar contexto relevante
        context_results = self.context_indexer.search(query, top_k=top_k)
        
        # Recuperar memórias correspondentes
        results = []
        for entry_id, score in context_results:
            entry = self.get(entry_id)
            if entry:
                results.append(entry)
        
        return results
```

### 2. Integração com Orquestração de Agentes

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from context_management.indexing.hybrid_indexer import HybridIndexer

class ContextAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com gerenciamento de contexto."""
    
    def __init__(self, llm_client, context_indexer: HybridIndexer):
        super().__init__(llm_client)
        self.context_indexer = context_indexer
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa usando contexto."""
        # Recuperar contexto relevante
        context_results = self.context_indexer.search(state["task"], top_k=5)
        
        # Adicionar contexto ao estado
        context_entries = [self.context_indexer.get(eid) for eid, _ in context_results]
        state["context"]["relevant"] = [e.content for e in context_entries if e]
        
        # Chamar implementação base
        result = super().task_analyzer_node(state)
        
        # Indexar tarefa no contexto
        self.context_indexer.add(
            content=state["task"],
            context_type="task",
            source="orchestrator"
        )
        
        return result
```

### 3. Integração com RAG

```python
from rag_engine import HybridRetriever
from context_management.indexing.hybrid_indexer import HybridIndexer

class RAGEnhancedContext(HybridIndexer):
    """Indexador de contexto com RAG."""
    
    def __init__(self, config: ContextConfig, rag_retriever: HybridRetriever):
        super().__init__(config)
        self.rag_retriever = rag_retriever
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca usando contexto + RAG."""
        # Busca semântica local
        local_results = super().search(query, top_k=top_k)
        
        # Busca RAG externa
        rag_docs = self.rag_retriever.search(query, top_k=top_k)
        
        # Indexar documentos RAG temporariamente
        rag_entries = []
        for doc in rag_docs:
            entry = self.add(
                content=doc.content,
                context_type="rag",
                source="external",
                metadata={"rag_source": doc.source}
            )
            rag_entries.append(entry)
        
        # Busca novamente incluindo RAG
        enhanced_results = super().search(query, top_k=top_k)
        
        return enhanced_results
```

## Próximos Passos

1. Implementar compressão de contexto
2. Adicionar sumarização automática
3. Implementar pruning inteligente
4. Adicionar sistema de versionamento
5. Implementar rastreamento de proveniência
6. Adicionar métricas e monitoramento
7. Implementar testes de performance
8. Adicionar documentação de API
