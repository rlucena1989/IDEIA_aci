# Context Management

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar context management baseado em gaps competitivos

## Visão Geral

Context management é crítico para otimizar o uso de tokens e manter contexto relevante. Cursor usa Merkle tree + semantic chunking + simhash reuso, Windsurf usa real-time awareness + Memories. IDEIA_aci precisa de um sistema mais avançado com hybrid indexing, context-aware caching, distributed indexing, context compression, context provenance, e context versioning.

## Arquitetura de Context Management

### Componentes

```
┌─────────────────────────────────────┐
│   Context Builder                  │  ← Monta contexto dinâmico
├─────────────────────────────────────┤
│   Context Indexer                   │  ← Indexa código e documentos
├─────────────────────────────────────┤
│   Context Retriever                 │  ← Recupera contexto relevante
├─────────────────────────────────────┤
│   Context Compressor                │  ← Comprime contexto
├─────────────────────────────────────┤
│   Context Provenance Tracker        │  ← Rastreia origem do contexto
└─────────────────────────────────────┘
```

## Gap 1: Hybrid Indexing (Merkle Tree + Semantic Graph + Real-time Awareness)

### Conceito

Combinar Merkle tree (Cursor), semantic graph (Windsurf) e real-time awareness (Windsurf) em um sistema híbrido.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação de Hybrid Indexer

```python
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
import hashlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FileNode:
    """Nó de arquivo com hash Merkle"""
    path: str
    content_hash: str
    children hashes: Dict[str, str] = field(default_factory=dict)
    last_modified: datetime = field(default_factory=datetime.now)
    
    def calculate_hash(self) -> str:
        """Calcula hash do nó (incluindo filhos)"""
        # Hash do conteúdo
        content_hash = self.content_hash
        
        # Hash dos filhos (ordenado para consistência)
        sorted_children = sorted(self.children_hashes.items())
        children_hash = hashlib.sha256(
            "".join(f"{k}:{v}" for k, v in sorted_children).encode()
        ).hexdigest()
        
        # Hash combinado
        combined = f"{content_hash}:{children_hash}"
        return hashlib.sha256(combined.encode()).hexdigest()

@dataclass
class SemanticNode:
    """Nó semântico com símbolos e relações"""
    node_id: str
    file_path: str
    symbols: List[str] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    references: List[str] = field(default_factory=list)
    node_type: str = "unknown"  # function, class, variable, etc.
    
class RealTimeEvent:
    """Evento de tempo real"""
    event_type: str  # file_edit, terminal_command, cursor_navigation
    timestamp: datetime
    data: Dict
    
class HybridContextIndexer:
    """Indexer híbrido combinando Merkle tree, semantic graph e real-time awareness"""
    
    def __init__(self):
        self.merkle_tree: Dict[str, FileNode] = {}
        self.semantic_graph: Dict[str, SemanticNode] = {}
        self.real_time_events: List[RealTimeEvent] = []
        self.file_to_semantic: Dict[str, Set[str]] = {}
    
    def index_file(self, file_path: str, content: str):
        """Indexa arquivo com Merkle tree"""
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        node = FileNode(
            path=file_path,
            content_hash=content_hash
        )
        
        self.merkle_tree[file_path] = node
        logger.info(f"Indexed file {file_path} with hash {content_hash[:8]}")
    
    def index_semantic(self, semantic_node: SemanticNode):
        """Indexa nó semântico"""
        self.semantic_graph[semantic_node.node_id] = semantic_node
        
        # Mapear arquivo para nós semânticos
        if semantic_node.file_path not in self.file_to_semantic:
            self.file_to_semantic[semantic_node.file_path] = set()
        
        self.file_to_semantic[semantic_node.file_path].add(semantic_node.node_id)
        logger.info(f"Indexed semantic node {semantic_node.node_id} for {semantic_node.file_path}")
    
    def track_real_time_event(self, event: RealTimeEvent):
        """Rastreia evento de tempo real"""
        self.real_time_events.append(event)
        
        # Manter apenas últimos 1000 eventos
        if len(self.real_time_events) > 1000:
            self.real_time_events = self.real_time_events[-1000:]
        
        logger.info(f"Tracked real-time event: {event.event_type}")
    
    def detect_changes(self, file_path: str, new_content: str) -> bool:
        """Detecta mudanças usando Merkle tree"""
        if file_path not in self.merkle_tree:
            return True  # Arquivo novo
        
        old_hash = self.merkle_tree[file_path].content_hash
        new_hash = hashlib.sha256(new_content.encode()).hexdigest()
        
        changed = old_hash != new_hash
        
        if changed:
            logger.info(f"File {file_path} changed: {old_hash[:8]} -> {new_hash[:8]}")
        
        return changed
    
    def get_related_files(self, file_path: str) -> Set[str]:
        """Retorna arquivos relacionados via semantic graph"""
        related_files = set()
        
        if file_path not in self.file_to_semantic:
            return related_files
        
        # Encontrar nós semânticos do arquivo
        semantic_nodes = self.file_to_semantic[file_path]
        
        # Encontrar arquivos que importam ou referenciam estes símbolos
        for node_id in semantic_nodes:
            node = self.semantic_graph.get(node_id)
            if not node:
                continue
            
            # Encontrar arquivos que importam símbolos deste arquivo
            for symbol in node.symbols:
                for other_node_id, other_node in self.semantic_graph.items():
                    if symbol in other_node.imports:
                        related_files.add(other_node.file_path)
        
        return related_files
    
    def get_recent_context(self, seconds: int = 300) -> List[RealTimeEvent]:
        """Retorna eventos recentes de tempo real"""
        cutoff = datetime.now() - timedelta(seconds=seconds)
        return [e for e in self.real_time_events if e.timestamp > cutoff]
    
    def build_context(self, file_path: str, max_tokens: int = 8000) -> str:
        """Constrói contexto híbrido para um arquivo"""
        context_parts = []
        
        # 1. Conteúdo do arquivo atual
        if file_path in self.merkle_tree:
            context_parts.append(f"# File: {file_path}")
            # (Em produção, ler conteúdo do arquivo)
        
        # 2. Arquivos relacionados via semantic graph
        related_files = self.get_related_files(file_path)
        for related_file in list(related_files)[:5]:  # Limitar a 5 arquivos
            context_parts.append(f"# Related: {related_file}")
        
        # 3. Eventos recentes de tempo real
        recent_events = self.get_recent_context(seconds=300)
        if recent_events:
            context_parts.append("# Recent Activity:")
            for event in recent_events[-10:]:  # Últimos 10 eventos
                context_parts.append(f"  - {event.event_type}: {event.data}")
        
        return "\n".join(context_parts)

# Uso
hybrid_indexer = HybridContextIndexer()

# Indexar arquivos
hybrid_indexer.index_file("main.py", "def main(): pass")
hybrid_indexer.index_file("utils.py", "def helper(): pass")

# Indexar nós semânticos
hybrid_indexer.index_semantic(SemanticNode(
    node_id="func_main",
    file_path="main.py",
    symbols=["main"],
    imports=["helper"]
))

hybrid_indexer.index_semantic(SemanticNode(
    node_id="func_helper",
    file_path="utils.py",
    symbols=["helper"],
    imports=[]
))

# Rastrear eventos de tempo real
hybrid_indexer.track_real_time_event(RealTimeEvent(
    event_type="file_edit",
    timestamp=datetime.now(),
    data={"file": "main.py", "change": "added function"}
))

hybrid_indexer.track_real_time_event(RealTimeEvent(
    event_type="terminal_command",
    timestamp=datetime.now(),
    data={"command": "pytest", "exit_code": 0}
))

# Construir contexto
context = hybrid_indexer.build_context("main.py")
print(f"Context:\n{context}")
```

## Gap 2: Context-Aware Caching

### Conceito

Caching com LRU + semantic similarity. Diferente de caching baseado apenas em tempo, context-aware caching considera similaridade semântica.

### Implementação com Semantic Caching

```python
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import hashlib
import numpy as np

@dataclass
class CacheEntry:
    """Entrada de cache"""
    key: str
    value: str
    embedding: Optional[np.ndarray] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    ttl: Optional[timedelta] = None
    
    def is_expired(self) -> bool:
        """Verifica se expirou"""
        if self.ttl is None:
            return False
        return datetime.now() > self.created_at + self.ttl
    
    def touch(self):
        """Atualiza timestamp de acesso"""
        self.last_accessed = datetime.now()
        self.access_count += 1

class SemanticCache:
    """Cache com similaridade semântica"""
    
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.embedding_model = None  # Em produção, usar modelo de embeddings
    
    def _generate_key(self, context: str) -> str:
        """Gera chave para contexto"""
        return hashlib.sha256(context.encode()).hexdigest()
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Gera embedding (simulado)"""
        # Em produção, usar modelo de embeddings real
        # Aqui simulamos com hash
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        return np.array([hash_val % 1000 / 1000.0] * 768)
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calcula similaridade cosseno"""
        if emb1 is None or emb2 is None:
            return 0.0
        
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def set(self, context: str, value: str, ttl: Optional[timedelta] = None):
        """Define entrada no cache"""
        key = self._generate_key(context)
        embedding = self._get_embedding(context)
        
        entry = CacheEntry(
            key=key,
            value=value,
            embedding=embedding,
            ttl=ttl
        )
        
        self.cache[key] = entry
        
        # Evict se exceder tamanho máximo
        if len(self.cache) > self.max_size:
            self._evict_lru()
        
        logger.info(f"Cached context with key {key[:8]}")
    
    def get(self, context: str, similarity_threshold: float = 0.8) -> Optional[str]:
        """Recupera do cache com similaridade semântica"""
        key = self._generate_key(context)
        
        # Tentar match exato
        if key in self.cache:
            entry = self.cache[key]
            if entry.is_expired():
                del self.cache[key]
                return None
            
            entry.touch()
            logger.info(f"Cache hit (exact): {key[:8]}")
            return entry.value
        
        # Tentar match semântico
        query_embedding = self._get_embedding(context)
        
        for cache_key, entry in self.cache.items():
            if entry.is_expired():
                continue
            
            similarity = self._cosine_similarity(query_embedding, entry.embedding)
            
            if similarity >= similarity_threshold:
                entry.touch()
                logger.info(f"Cache hit (semantic): {cache_key[:8]}, similarity: {similarity:.2f}")
                return entry.value
        
        logger.info("Cache miss")
        return None
    
    def _evict_lru(self):
        """Evicta entrada menos recentemente usada"""
        lru_key = min(
            self.cache.keys(),
            key=lambda k: self.cache[k].last_accessed
        )
        del self.cache[lru_key]
        logger.info(f"Evicted LRU entry: {lru_key[:8]}")
    
    def cleanup_expired(self):
        """Remove entradas expiradas"""
        expired_keys = [k for k, v in self.cache.items() if v.is_expired()]
        
        for key in expired_keys:
            del self.cache[key]
            logger.info(f"Cleaned up expired entry: {key[:8]}")
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do cache"""
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hit_rate": self._calculate_hit_rate()
        }
    
    def _calculate_hit_rate(self) -> float:
        """Calcula taxa de hit (simplificado)"""
        # Em produção, rastrear hits e misses
        return 0.0

# Uso
semantic_cache = SemanticCache(max_size=100)

# Adicionar ao cache
semantic_cache.set("Analyze codebase for security", "Use static analysis tools", ttl=timedelta(minutes=30))
semantic_cache.set("Fix authentication bug", "Check JWT implementation", ttl=timedelta(minutes=30))

# Recuperar (match exato)
result = semantic_cache.get("Analyze codebase for security")
print(f"Exact match: {result}")

# Recuperar (match semântico)
result = semantic_cache.get("Review code for vulnerabilities", similarity_threshold=0.7)
print(f"Semantic match: {result}")
```

## Gap 3: Distributed Indexing

### Conceito

Indexing distribuído para multi-user workspaces. Diferente de indexing local, distributed indexing permite colaboração e sincronização.

### Implementação com Distributed Indexing

```python
from typing import Dict, List, Set
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class IndexSync:
    """Sincronização de índice distribuído"""
    node_id: str
    last_sync: datetime
    file_hashes: Dict[str, str]
    pending_updates: List[str]

class DistributedIndexer:
    """Indexer distribuído"""
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.local_index: Dict[str, str] = {}  # file_path -> hash
        self.remote_indices: Dict[str, IndexSync] = {}  # node_id -> sync info
        self.conflict_resolution: str = "latest"  # latest, manual, merge
    
    def update_local_index(self, file_path: str, content: str):
        """Atualiza índice local"""
        import hashlib
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        self.local_index[file_path] = content_hash
        logger.info(f"Updated local index: {file_path} -> {content_hash[:8]}")
    
    def sync_with_remote(self, remote_node_id: str, remote_index: Dict[str, str]):
        """Sincroniza com nó remoto"""
        sync = IndexSync(
            node_id=remote_node_id,
            last_sync=datetime.now(),
            file_hashes=remote_index.copy(),
            pending_updates=[]
        )
        
        # Detectar conflitos
        conflicts = self._detect_conflicts(remote_index)
        
        if conflicts:
            logger.warning(f"Conflicts detected with {remote_node_id}: {conflicts}")
            self._resolve_conflicts(conflicts, remote_index)
        
        # Atualizar índice remoto
        self.remote_indices[remote_node_id] = sync
        
        logger.info(f"Synced with {remote_node_id}")
    
    def _detect_conflicts(self, remote_index: Dict[str, str]) -> List[str]:
        """Detecta conflitos entre índices"""
        conflicts = []
        
        for file_path, local_hash in self.local_index.items():
            if file_path in remote_index:
                remote_hash = remote_index[file_path]
                if local_hash != remote_hash:
                    conflicts.append(file_path)
        
        return conflicts
    
    def _resolve_conflicts(self, conflicts: List[str], remote_index: Dict[str, str]):
        """Resolve conflitos"""
        for file_path in conflicts:
            local_hash = self.local_index[file_path]
            remote_hash = remote_index[file_path]
            
            if self.conflict_resolution == "latest":
                # Usar timestamp (simplificado)
                # Em produção, usar timestamps reais
                logger.info(f"Conflict resolution for {file_path}: keeping local")
            
            elif self.conflict_resolution == "manual":
                # Marcar para resolução manual
                logger.warning(f"Manual resolution required for {file_path}")
            
            elif self.conflict_resolution == "merge":
                # Tentar merge (simplificado)
                logger.info(f"Attempting merge for {file_path}")
    
    def get_global_index(self) -> Dict[str, str]:
        """Retorna índice global combinado"""
        global_index = self.local_index.copy()
        
        for node_id, sync in self.remote_indices.items():
            for file_path, file_hash in sync.file_hashes.items():
                if file_path not in global_index:
                    global_index[file_path] = file_hash
        
        return global_index
    
    def broadcast_index(self):
        """Broadcasta índice local para nós remotos"""
        # Em produção, usar message bus ou RPC
        index_data = json.dumps(self.local_index)
        logger.info(f"Broadcasting index to {len(self.remote_indices)} nodes")

# Uso
distributed_indexer = DistributedIndexer("node_1")

# Atualizar índice local
distributed_indexer.update_local_index("main.py", "def main(): pass")
distributed_indexer.update_local_index("utils.py", "def helper(): pass")

# Simular sincronização com nó remoto
remote_index = {
    "main.py": "different_hash",
    "config.py": "config_content_hash"
}

distributed_indexer.sync_with_remote("node_2", remote_index)

# Obter índice global
global_index = distributed_indexer.get_global_index()
print(f"Global index: {global_index}")
```

## Gap 4: Context Compression

### Conceito

Compressão de contexto com summarization automática. Diferente de Windsurf que apenas armazena memórias, IDEIA_aci deve comprimir contexto automaticamente.

### Implementação com Context Compression

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ContextChunk:
    """Chunk de contexto"""
    content: str
    importance: float  # 0.0 a 1.0
    tokens: int
    source: str

class ContextCompressor:
    """Compressor de contexto"""
    
    def __init__(self, max_tokens: int = 8000):
        self.max_tokens = max_tokens
    
    def compress(self, chunks: List[ContextChunk]) -> str:
        """Comprime chunks para caber no limite de tokens"""
        # Ordenar por importância
        sorted_chunks = sorted(chunks, key=lambda c: c.importance, reverse=True)
        
        # Selecionar chunks até atingir limite
        selected_chunks = []
        total_tokens = 0
        
        for chunk in sorted_chunks:
            if total_tokens + chunk.tokens <= self.max_tokens:
                selected_chunks.append(chunk)
                total_tokens += chunk.tokens
            else:
                # Tentar summarizar chunk
                summarized = self._summarize_chunk(chunk)
                summarized_tokens = self._estimate_tokens(summarized)
                
                if total_tokens + summarized_tokens <= self.max_tokens:
                    selected_chunks.append(ContextChunk(
                        content=summarized,
                        importance=chunk.importance * 0.8,  # Reduz importância após summarization
                        tokens=summarized_tokens,
                        source=f"{chunk.source} (summarized)"
                    ))
                    total_tokens += summarized_tokens
        
        # Montar contexto comprimido
        compressed_context = "\n\n".join([
            f"# {chunk.source}\n{chunk.content}"
            for chunk in selected_chunks
        ])
        
        logger.info(f"Compressed context: {len(chunks)} chunks -> {len(selected_chunks)} chunks, {total_tokens} tokens")
        
        return compressed_context
    
    def _summarize_chunk(self, chunk: ContextChunk) -> str:
        """Sumariza chunk (simulado)"""
        # Em produção, usar LLM para summarization
        words = chunk.content.split()
        
        if len(words) > 100:
            return " ".join(words[:50]) + "... [summarized]"
        
        return chunk.content
    
    def _estimate_tokens(self, text: str) -> int:
        """Estima número de tokens"""
        # Regra simples: 1 token ≈ 4 caracteres
        return len(text) // 4

# Uso
compressor = ContextCompressor(max_tokens=4000)

chunks = [
    ContextChunk(
        content="This is very important context that should be preserved",
        importance=0.9,
        tokens=20,
        source="file1.py"
    ),
    ContextChunk(
        content="This is less important context that could be summarized",
        importance=0.5,
        tokens=30,
        source="file2.py"
    ),
    ContextChunk(
        content="This is low priority context that might be dropped",
        importance=0.2,
        tokens=25,
        source="file3.py"
    )
]

compressed = compressor.compress(chunks)
print(f"Compressed context:\n{compressed}")
```

## Gap 5: Context Provenance

### Conceito

Rastrear origem de cada contexto. Diferente de Windsurf que não rastreia proveniência, IDEIA_aci deve tracking completo.

### Implementação com Context Provenance

```python
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid

@dataclass
class ContextSource:
    """Origem de contexto"""
    source_id: str
    source_type: str  # file, memory, web, user_input
    source_path: str
    confidence: float  # 0.0 a 1.0
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, str] = field(default_factory=dict)

@dataclass
class ContextProvenance:
    """Proveniência de contexto"""
    context_id: str
    sources: List[ContextSource] = field(default_factory=list)
    derivation_chain: List[str] = field(default_factory=list)  # IDs de contextos derivados
    
    def add_source(self, source: ContextSource):
        """Adiciona fonte"""
        self.sources.append(source)
    
    def get_provenance_chain(self) -> List[Dict]:
        """Retorna cadeia de proveniência"""
        return [
            {
                "source_id": s.source_id,
                "source_type": s.source_type,
                "source_path": s.source_path,
                "confidence": s.confidence,
                "timestamp": s.timestamp.isoformat(),
                "metadata": s.metadata
            }
            for s in self.sources
        ]

class ContextProvenanceTracker:
    """Rastreador de proveniência de contexto"""
    
    def __init__(self):
        self.provenance_db: Dict[str, ContextProvenance] = {}
    
    def track_context(self, context_id: str, sources: List[ContextSource]):
        """Rastreia proveniência de contexto"""
        provenance = ContextProvenance(context_id=context_id)
        
        for source in sources:
            provenance.add_source(source)
        
        self.provenance_db[context_id] = provenance
        logger.info(f"Tracked provenance for context {context_id}")
    
    def get_provenance(self, context_id: str) -> Optional[ContextProvenance]:
        """Recupera proveniência"""
        return self.provenance_db.get(context_id)
    
    def derive_context(self, parent_context_id: str, child_context_id: str, derivation_type: str):
        """Registra derivação de contexto"""
        if parent_context_id not in self.provenance_db:
            logger.warning(f"Parent context {parent_context_id} not found")
            return
        
        parent = self.provenance_db[parent_context_id]
        
        if child_context_id not in self.provenance_db:
            self.provenance_db[child_context_id] = ContextProvenance(context_id=child_context_id)
        
        child = self.provenance_db[child_context_id]
        child.derivation_chain = parent.derivation_chain + [parent_context_id]
        
        logger.info(f"Derived context {child_context_id} from {parent_context_id} ({derivation_type})")
    
    def verify_context_integrity(self, context_id: str) -> bool:
        """Verifica integridade do contexto"""
        provenance = self.provenance_db.get(context_id)
        
        if not provenance:
            return False
        
        # Verificar se todas as fontes são válidas
        for source in provenance.sources:
            if source.confidence < 0.5:
                logger.warning(f"Low confidence source in context {context_id}: {source.source_id}")
                return False
        
        return True

# Uso
provenance_tracker = ContextProvenanceTracker()

# Rastrear contexto
sources = [
    ContextSource(
        source_id="file_main_py",
        source_type="file",
        source_path="main.py",
        confidence=0.9,
        metadata={"line_range": "1-50"}
    ),
    ContextSource(
        source_id="memory_api_key",
        source_type="memory",
        source_path="global",
        confidence=0.8,
        metadata={"key": "api_endpoint"}
    )
]

provenance_tracker.track_context("context_1", sources)

# Derivar contexto
provenance_tracker.derive_context("context_1", "context_2", "summarization")

# Verificar integridade
integrity = provenance_tracker.verify_context_integrity("context_1")
print(f"Context integrity: {integrity}")

# Obter proveniência
provenance = provenance_tracker.get_provenance("context_1")
chain = provenance.get_provenance_chain()
print(f"Provenance chain: {chain}")
```

## Recomendações de Implementação

### Para MVP
1. **Hybrid indexing básico:** Implementar Merkle tree + semantic graph básico
2. **Context-aware caching:** Implementar LRU + similarity básica
3. **Context compression:** Implementar summarização simples

### Para Produção
1. **Hybrid indexing avançado:** Adicionar real-time awareness completo
2. **Context-aware caching:** Implementar semantic caching avançado
3. **Distributed indexing:** Implementar sincronização distribuída
4. **Context compression:** Implementar compression com LLM
5. **Context provenance:** Implementar tracking completo
6. **Context versioning:** Implementar versionamento de contexto

## Integração com IDEIA-master

Os packages do IDEIA-master relevantes:
- `context-builder`: Para montar contexto dinâmico
- `context-pack-system`: Para gerenciar packs de contexto
- `context-provenance`: Para rastrear proveniência

## Referências

- Cursor Codebase Indexing: https://cursor.com/blog/secure-codebase-indexing
- Windsurf Context Awareness: https://docs.windsurf.com/context-awareness/overview
- LangChain Context: https://python.langchain.com/docs/modules/context/
