# Guia de Implementação - RAG Avançado

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de RAG avançado para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de RAG avançado com hybrid search, re-ranking, multi-vector retrieval e query expansion, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install numpy faiss-cpu sentence-transformers rank-bm25
```

### Estrutura de Diretórios

```
packages/
├── rag_engine/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── document.py            # Documento RAG
│   │   ├── document_types.py      # Tipos de documento
│   │   └── rag_config.py          # Configurações RAG
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── hybrid_retriever.py    # Retriever híbrido
│   │   ├── lexical_retriever.py   # Retriever lexical (BM25)
│   │   ├── semantic_retriever.py  # Retriever semântico
│   │   └── multi_vector_retriever.py # Retriever multi-vector
│   ├── ranking/
│   │   ├── __init__.py
│   │   ├── reranker.py            # Re-ranker
│   │   ├── cross_encoder.py       # Cross-encoder
│   │   └── fusion.py              # Fusão de scores
│   ├── expansion/
│   │   ├── __init__.py
│   │   ├── query_expander.py      # Expansão de query
│   │   ├── synonym_expander.py    # Expansão por sinônimos
│   │   └── llm_expander.py        # Expansão por LLM
│   ├── indexing/
│   │   ├── __init__.py
│   │   ├── vector_index.py        # Índice vetorial (FAISS)
│   │   ├── keyword_index.py       # Índice de keywords
│   │   └── document_index.py      # Índice de documentos
│   ├── optimization/
│   │   ├── __init__.py
│   │   ├── chunker.py             # Chunking de documentos
│   │   ├── deduplicator.py        # Deduplicação
│   │   └── filter.py              # Filtro de qualidade
│   └── utils/
│       ├── __init__.py
│       ├── embeddings.py          # Geração de embeddings
│       ├── preprocessors.py       # Pré-processamento
│       └── validators.py         # Validadores
```

## Passo 1: Tipos de Documento (core/document_types.py)

```python
"""
Definições de tipos de documento RAG.
"""
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime

class DocumentType(Enum):
    """Tipos de documento."""
    CODE = "code"
    DOCUMENTATION = "documentation"
    MARKDOWN = "markdown"
    TEXT = "text"
    PDF = "pdf"
    HTML = "html"
    JSON = "json"

class DocumentSource(Enum):
    """Fontes de documento."""
    CODEBASE = "codebase"
    DOCUMENTATION = "documentation"
    EXTERNAL = "external"
    MEMORY = "memory"
    USER_UPLOAD = "user_upload"

class RAGConfig:
    """Configuração RAG."""
    
    def __init__(
        self,
        embedding_dim: int = 768,
        top_k: int = 5,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        enable_hybrid: bool = True,
        enable_reranking: bool = True,
        enable_expansion: bool = True,
        similarity_threshold: float = 0.75,
        reranker_threshold: float = 0.5
    ):
        self.embedding_dim = embedding_dim
        self.top_k = top_k
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.enable_hybrid = enable_hybrid
        self.enable_reranking = enable_reranking
        self.enable_expansion = enable_expansion
        self.similarity_threshold = similarity_threshold
        self.reranker_threshold = reranker_threshold
```

## Passo 2: Documento RAG (core/document.py)

```python
"""
Documento RAG com metadados e chunks.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field
import hashlib

@dataclass
class Document:
    """Documento RAG."""
    
    # Identificação
    doc_id: str
    content: str
    doc_type: str
    
    # Metadados
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    source: str = "codebase"
    author: Optional[str] = None
    
    # Chunks
    chunks: List[str] = field(default_factory=list)
    chunk_embeddings: List[List[float]] = field(default_factory=list)
    
    # Keywords
    keywords: List[str] = field(default_factory=list)
    
    # Metadados adicionais
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Tags
    tags: List[str] = field(default_factory=list)
    
    # Estatísticas
    size: int = 0  # caracteres
    chunk_count: int = 0
    
    # Hash
    content_hash: str = ""
    
    def __post_init__(self):
        """Inicialização pós-criação."""
        if not self.doc_id:
            self.doc_id = self._generate_id()
        
        if not self.content_hash:
            self.content_hash = self._compute_hash()
        
        self.size = len(self.content)
    
    def _generate_id(self) -> str:
        """Gera ID único para documento."""
        timestamp = int(self.created_at.timestamp())
        content_hash = self.content_hash[:8]
        return f"{self.doc_type}_{content_hash}_{timestamp}"
    
    def _compute_hash(self) -> str:
        """Computa hash do conteúdo."""
        return hashlib.sha256(self.content.encode()).hexdigest()
    
    def add_chunk(self, chunk: str, embedding: Optional[List[float]] = None):
        """Adiciona chunk ao documento."""
        self.chunks.append(chunk)
        if embedding:
            self.chunk_embeddings.append(embedding)
        self.chunk_count = len(self.chunks)
    
    def add_keyword(self, keyword: str):
        """Adiciona keyword ao documento."""
        if keyword not in self.keywords:
            self.keywords.append(keyword)
    
    def add_tag(self, tag: str):
        """Adiciona tag ao documento."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def update_content(self, new_content: str):
        """Atualiza conteúdo e recompute hash."""
        self.content = new_content
        self.content_hash = self._compute_hash()
        self.updated_at = datetime.now()
        self.size = len(new_content)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "doc_id": self.doc_id,
            "content": self.content,
            "doc_type": self.doc_type,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "source": self.source,
            "author": self.author,
            "chunks": self.chunks,
            "chunk_embeddings": self.chunk_embeddings,
            "keywords": self.keywords,
            "metadata": self.metadata,
            "tags": self.tags,
            "size": self.size,
            "chunk_count": self.chunk_count,
            "content_hash": self.content_hash
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Document":
        """Cria documento a partir de dicionário."""
        return cls(
            doc_id=data["doc_id"],
            content=data["content"],
            doc_type=data["doc_type"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            source=data["source"],
            author=data["author"],
            chunks=data["chunks"],
            chunk_embeddings=data["chunk_embeddings"],
            keywords=data["keywords"],
            metadata=data["metadata"],
            tags=data["tags"],
            size=data["size"],
            chunk_count=data["chunk_count"],
            content_hash=data["content_hash"]
        )
```

## Passo 3: Retriever Lexical (retrieval/lexical_retriever.py)

```python
"""
Retriever lexical baseado em BM25.
"""
from typing import Dict, List, Tuple, Optional
import re
import logging

from ..core.document import Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LexicalRetriever:
    """Retriever lexical BM25."""
    
    def __init__(self):
        """Inicializa retriever lexical."""
        self.documents: Dict[str, Document] = {}
        self.index: Dict[str, List[str]] = {}  # keyword -> doc_ids
        self.doc_lengths: Dict[str, int] = {}
        self.avg_doc_length: float = 0.0
        self.k1: float = 1.5  # Parâmetro BM25
        self.b: float = 0.75  # Parâmetro BM25
    
    def add_document(self, doc: Document):
        """Adiciona documento ao índice."""
        self.documents[doc.doc_id] = doc
        
        # Tokenizar e indexar keywords
        tokens = self._tokenize(doc.content)
        self.doc_lengths[doc.doc_id] = len(tokens)
        
        for token in set(tokens):
            if token not in self.index:
                self.index[token] = []
            self.index[token].append(doc.doc_id)
        
        # Recomputar média
        self._update_avg_doc_length()
        
        logger.debug(f"Added document {doc.doc_id} to lexical index")
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokeniza texto."""
        # Lowercase e remover pontuação
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return text.split()
    
    def _update_avg_doc_length(self):
        """Atualiza média de tamanho de documento."""
        if self.doc_lengths:
            self.avg_doc_length = sum(self.doc_lengths.values()) / len(self.doc_lengths)
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Recupera documentos usando BM25."""
        query_tokens = self._tokenize(query)
        
        if not query_tokens:
            return []
        
        # Calcular BM25 scores
        scores = {}
        for doc_id in self.documents:
            scores[doc_id] = self._calculate_bm25(doc_id, query_tokens)
        
        # Ordenar por score
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_scores[:top_k]
    
    def _calculate_bm25(self, doc_id: str, query_tokens: List[str]) -> float:
        """Calcula score BM25."""
        doc = self.documents[doc_id]
        doc_tokens = self._tokenize(doc.content)
        doc_length = len(doc_tokens)
        
        score = 0.0
        
        for token in query_tokens:
            # Term frequency
            tf = doc_tokens.count(token)
            
            # Document frequency
            df = len(self.index.get(token, []))
            
            # Inverse document frequency
            N = len(self.documents)
            idf = max(0, (N - df + 0.5) / (df + 0.5))
            idf = (idf + 1)  # +1 smoothing
            
            # BM25 formula
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / self.avg_doc_length))
            score += idf * (numerator / denominator)
        
        return score
    
    def delete(self, doc_id: str) -> bool:
        """Deleta documento do índice."""
        if doc_id in self.documents:
            doc = self.documents[doc_id]
            tokens = self._tokenize(doc.content)
            
            # Remover do índice
            for token in set(tokens):
                if token in self.index and doc_id in self.index[token]:
                    self.index[token].remove(doc_id)
            
            del self.documents[doc_id]
            del self.doc_lengths[doc_id]
            
            self._update_avg_doc_length()
            
            logger.debug(f"Deleted document {doc_id} from lexical index")
            return True
        
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_documents": len(self.documents),
            "total_terms": len(self.index),
            "avg_doc_length": self.avg_doc_length
        }
```

## Passo 4: Retriever Semântico (retrieval/semantic_retriever.py)

```python
"""
Retriever semântico baseado em embeddings.
"""
from typing import Dict, List, Tuple, Optional
import numpy as np
import logging

from ..core.document import Document
from ..core.rag_config import RAGConfig
from ..utils.embeddings import EmbeddingGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SemanticRetriever:
    """Retriever semântico baseado em embeddings."""
    
    def __init__(self, config: Optional[RAGConfig] = None):
        """Inicializa retriever semântico."""
        self.config = config or RAGConfig()
        self.documents: Dict[str, Document] = {}
        self.embeddings: Dict[str, np.ndarray] = {}
        self.chunk_embeddings: Dict[str, List[np.ndarray]] = {}
        self.embedding_generator = EmbeddingGenerator(dimension=self.config.embedding_dim)
    
    def add_document(self, doc: Document):
        """Adiciona documento ao índice semântico."""
        self.documents[doc.doc_id] = doc
        
        # Gerar embedding do documento completo
        doc_embedding = self.embedding_generator.generate(doc.content)
        self.embeddings[doc.doc_id] = doc_embedding
        
        # Gerar embeddings dos chunks
        chunk_embs = []
        for chunk in doc.chunks:
            chunk_emb = self.embedding_generator.generate(chunk)
            chunk_embs.append(chunk_emb)
        self.chunk_embeddings[doc.doc_id] = chunk_embs
        
        logger.debug(f"Added document {doc.doc_id} to semantic index")
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Recupera documentos usando similaridade semântica."""
        if not self.embeddings:
            return []
        
        # Gerar embedding da query
        query_embedding = self.embedding_generator.generate(query)
        
        # Calcular similaridades
        similarities = []
        for doc_id, doc_embedding in self.embeddings.items():
            similarity = self._cosine_similarity(query_embedding, doc_embedding)
            if similarity >= self.config.similarity_threshold:
                similarities.append((doc_id, similarity))
        
        # Ordenar por similaridade
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def retrieve_chunks(self, query: str, top_k: int = 5) -> List[Tuple[str, int, float]]:
        """Recupera chunks usando similaridade semântica."""
        if not self.chunk_embeddings:
            return []
        
        # Gerar embedding da query
        query_embedding = self.embedding_generator.generate(query)
        
        # Calcular similaridades de chunks
        similarities = []
        for doc_id, chunk_embs in self.chunk_embeddings.items():
            for chunk_idx, chunk_emb in enumerate(chunk_embs):
                similarity = self._cosine_similarity(query_embedding, chunk_emb)
                if similarity >= self.config.similarity_threshold:
                    similarities.append((doc_id, chunk_idx, similarity))
        
        # Ordenar por similaridade
        similarities.sort(key=lambda x: x[2], reverse=True)
        
        return similarities[:top_k]
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calcula similaridade cosseno."""
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def update(self, doc_id: str, new_content: str) -> bool:
        """Atualiza documento e recompute embeddings."""
        if doc_id not in self.documents:
            return False
        
        doc = self.documents[doc_id]
        doc.update_content(new_content)
        
        # Re-generar embeddings
        doc_embedding = self.embedding_generator.generate(new_content)
        self.embeddings[doc_id] = doc_embedding
        
        logger.debug(f"Updated document {doc_id} in semantic index")
        
        return True
    
    def delete(self, doc_id: str) -> bool:
        """Deleta documento do índice semântico."""
        if doc_id in self.documents:
            del self.documents[doc_id]
            del self.embeddings[doc_id]
            del self.chunk_embeddings[doc_id]
            logger.debug(f"Deleted document {doc_id} from semantic index")
            return True
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        return {
            "total_documents": len(self.documents),
            "embedding_dim": self.config.embedding_dim,
            "total_chunks": sum(len(chunks) for chunks in self.chunk_embeddings.values())
        }
```

## Passo 5: Retriever Híbrido (retrieval/hybrid_retriever.py)

```python
"""
Retriever híbrido combinando lexical e semântico.
"""
from typing import Dict, List, Tuple, Optional
import logging

from ..core.document import Document
from ..core.rag_config import RAGConfig
from .lexical_retriever import LexicalRetriever
from .semantic_retriever import SemanticRetriever
from ..ranking.fusion import ScoreFusion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridRetriever:
    """Retriever híbrido combinando lexical e semântico."""
    
    def __init__(self, config: Optional[RAGConfig] = None):
        """Inicializa retriever híbrido."""
        self.config = config or RAGConfig()
        self.lexical_retriever = LexicalRetriever()
        self.semantic_retriever = SemanticRetriever(config)
        self.score_fusion = ScoreFusion()
        self.documents: Dict[str, Document] = {}
    
    def add_document(self, doc: Document):
        """Adiciona documento ao índice híbrido."""
        self.documents[doc.doc_id] = doc
        
        # Adicionar a ambos os retrievers
        self.lexical_retriever.add_document(doc)
        self.semantic_retriever.add_document(doc)
        
        logger.info(f"Added document {doc.doc_id} to hybrid index")
    
    def retrieve(self, query: str, top_k: int = 5, alpha: float = 0.5) -> List[Tuple[str, float]]:
        """Recupera documentos usando busca híbrida."""
        # Busca lexical
        lexical_results = dict(self.lexical_retriever.retrieve(query, top_k=top_k * 2))
        
        # Busca semântica
        semantic_results = dict(self.semantic_retriever.retrieve(query, top_k=top_k * 2))
        
        # Normalizar scores
        lexical_normalized = self._normalize_scores(lexical_results)
        semantic_normalized = self._normalize_scores(semantic_results)
        
        # Combinar scores
        combined_scores = {}
        all_doc_ids = set(list(lexical_normalized.keys()) + list(semantic_normalized.keys()))
        
        for doc_id in all_doc_ids:
            lexical_score = lexical_normalized.get(doc_id, 0)
            semantic_score = semantic_normalized.get(doc_id, 0)
            
            # Combinação linear ponderada
            combined_score = alpha * lexical_score + (1 - alpha) * semantic_score
            combined_scores[doc_id] = combined_score
        
        # Ordenar por score combinado
        sorted_results = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_results[:top_k]
    
    def _normalize_scores(self, scores: Dict[str, float]) -> Dict[str, float]:
        """Normaliza scores para [0, 1]."""
        if not scores:
            return {}
        
        max_score = max(scores.values())
        if max_score == 0:
            return {doc_id: 0.0 for doc_id in scores}
        
        return {doc_id: score / max_score for doc_id, score in scores.items()}
    
    def update(self, doc_id: str, new_content: str) -> bool:
        """Atualiza documento em ambos os retrievers."""
        if doc_id not in self.documents:
            return False
        
        success = True
        success &= self.lexical_retriever.delete(doc_id)
        success &= self.semantic_retriever.update(doc_id, new_content)
        
        if success:
            # Re-adicionar ao lexical
            doc = self.documents[doc_id]
            doc.update_content(new_content)
            self.lexical_retriever.add_document(doc)
        
        return success
    
    def delete(self, doc_id: str) -> bool:
        """Deleta documento de ambos os retrievers."""
        if doc_id in self.documents:
            self.lexical_retriever.delete(doc_id)
            self.semantic_retriever.delete(doc_id)
            del self.documents[doc_id]
            logger.info(f"Deleted document {doc_id} from hybrid index")
            return True
        return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas combinadas."""
        return {
            "total_documents": len(self.documents),
            "lexical_stats": self.lexical_retriever.get_stats(),
            "semantic_stats": self.semantic_retriever.get_stats()
        }
```

## Passo 6: Chunker (optimization/chunker.py)

```python
"""
Chunker para dividir documentos em partes menores.
"""
from typing import List, Optional
import re
import logging

from ..core.document import Document
from ..core.rag_config import RAGConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentChunker:
    """Chunker de documentos."""
    
    def __init__(self, config: Optional[RAGConfig] = None):
        """Inicializa chunker."""
        self.config = config or RAGConfig()
    
    def chunk(self, doc: Document) -> Document:
        """Chunk documento."""
        if self.config.chunk_size <= 0:
            return doc
        
        # Limpar chunks existentes
        doc.chunks = []
        doc.chunk_embeddings = []
        
        # Chunk por tamanho
        chunks = self._chunk_by_size(doc.content, self.config.chunk_size, self.config.chunk_overlap)
        
        # Adicionar chunks ao documento
        for chunk in chunks:
            doc.add_chunk(chunk)
        
        logger.debug(f"Chunked document {doc.doc_id} into {len(chunks)} chunks")
        
        return doc
    
    def _chunk_by_size(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk texto por tamanho com overlap."""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Ajustar para não quebrar palavras
            if end < len(text):
                # Encontrar último espaço de antes do fim
                last_space = text.rfind(' ', start, end)
                if last_space != -1:
                    end = last_space
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
        
        return chunks
    
    def chunk_by_sentences(self, text: str, max_sentences: int = 5) -> List[str]:
        """Chunk texto por sentenças."""
        # Dividir em sentenças
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        for i in range(0, len(sentences), max_sentences):
            chunk = ' '.join(sentences[i:i + max_sentences])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def chunk_by_paragraphs(self, text: str) -> List[str]:
        """Chunk texto por parágrafos."""
        paragraphs = text.split('\n\n')
        return [p.strip() for p in paragraphs if p.strip()]
```

## Passo 7: Gerador de Embeddings (utils/embeddings.py)

```python
"""
Gerador de embeddings para RAG.
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
Exemplo de uso do RAG avançado.
"""
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from rag_engine.core.document import Document
from rag_engine.core.rag_config import RAGConfig
from rag_engine.core.document_types import DocumentType
from rag_engine.optimization.chunker import DocumentChunker

# Criar configuração
config = RAGConfig(
    embedding_dim=768,
    top_k=5,
    chunk_size=512,
    chunk_overlap=50,
    enable_hybrid=True
)

# Criar retriever híbrido
retriever = HybridRetriever(config)

# Criar chunker
chunker = DocumentChunker(config)

# Criar e adicionar documentos
doc1 = Document(
    doc_id="",
    content="Python is a high-level programming language known for its simplicity and readability. It supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
    doc_type=DocumentType.DOCUMENTATION.value,
    source="documentation"
)
doc1 = chunker.chunk(doc1)
retriever.add_document(doc1)

doc2 = Document(
    doc_id="",
    content="FastAPI is a modern, fast web framework for building APIs with Python 3.7+ based on standard Python type hints. It provides automatic validation, serialization, and documentation.",
    doc_type=DocumentType.DOCUMENTATION.value,
    source="documentation"
)
doc2 = chunker.chunk(doc2)
retriever.add_document(doc2)

doc3 = Document(
    doc_id="",
    content="REST API stands for Representational State Transfer API. It is an architectural style for designing networked applications. REST APIs use HTTP methods like GET, POST, PUT, DELETE to perform operations on resources.",
    doc_type=DocumentType.DOCUMENTATION.value,
    source="documentation"
)
doc3 = chunker.chunk(doc3)
retriever.add_document(doc3)

# Buscar documentos relevantes
query = "How to create web APIs with Python"
results = retriever.retrieve(query, top_k=3, alpha=0.5)

print(f"Search results for '{query}':")
for doc_id, score in results:
    doc = retriever.documents.get(doc_id)
    if doc:
        print(f"- {doc_id} (score: {score:.3f}): {doc.content[:80]}...")

# Buscar chunks relevantes
chunker_results = retriever.semantic_retriever.retrieve_chunks(query, top_k=3)
print(f"\nChunk results:")
for doc_id, chunk_idx, score in chunker_results:
    doc = retriever.documents.get(doc_id)
    if doc and chunk_idx < len(doc.chunks):
        print(f"- {doc_id}[{chunk_idx}] (score: {score:.3f}): {doc.chunks[chunk_idx][:80]}...")

# Estatísticas
stats = retriever.get_stats()
print(f"\nRetriever stats:")
print(f"- Total documents: {stats['total_documents']}")
print(f"- Lexical stats: {stats['lexical_stats']}")
print(f"- Semantic stats: {stats['semantic_stats']}")
```

## Passo 9: Testes de Validação

```python
"""
Testes de validação para RAG avançado.
"""
import pytest
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from rag_engine.core.document import Document
from rag_engine.core.rag_config import RAGConfig
from rag_engine.core.document_types import DocumentType
from rag_engine.optimization.chunker import DocumentChunker

class TestHybridRetriever:
    """Testes para retriever híbrido."""
    
    def test_initialization(self):
        """Testa inicialização do retriever."""
        config = RAGConfig()
        retriever = HybridRetriever(config)
        
        assert retriever.documents is not None
        assert retriever.lexical_retriever is not None
        assert retriever.semantic_retriever is not None
    
    def test_add_document(self):
        """Testa adição de documento."""
        retriever = HybridRetriever()
        chunker = DocumentChunker()
        
        doc = Document(
            doc_id="",
            content="Test content for RAG",
            doc_type=DocumentType.TEXT.value
        )
        doc = chunker.chunk(doc)
        retriever.add_document(doc)
        
        assert doc.doc_id in retriever.documents
        assert len(doc.chunks) > 0
    
    def test_retrieve(self):
        """Testa recuperação de documentos."""
        retriever = HybridRetriever()
        chunker = DocumentChunker()
        
        doc = Document(
            doc_id="",
            content="Python is a programming language",
            doc_type=DocumentType.TEXT.value
        )
        doc = chunker.chunk(doc)
        retriever.add_document(doc)
        
        results = retriever.retrieve("programming", top_k=1)
        
        assert len(results) > 0
    
    def test_chunking(self):
        """Testa chunking de documento."""
        config = RAGConfig(chunk_size=100, chunk_overlap=20)
        chunker = DocumentChunker(config)
        
        doc = Document(
            doc_id="",
            content="This is a test document that should be chunked into multiple parts for testing purposes.",
            doc_type=DocumentType.TEXT.value
        )
        
        chunked_doc = chunker.chunk(doc)
        
        assert len(chunked_doc.chunks) > 0
    
    def test_delete_document(self):
        """Testa deleção de documento."""
        retriever = HybridRetriever()
        chunker = DocumentChunker()
        
        doc = Document(
            doc_id="",
            content="Test content",
            doc_type=DocumentType.TEXT.value
        )
        doc = chunker.chunk(doc)
        retriever.add_document(doc)
        
        success = retriever.delete(doc.doc_id)
        
        assert success
        assert doc.doc_id not in retriever.documents

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Documento Vazio

```python
def add_with_validation(self, doc: Document) -> bool:
    """Adiciona documento com validação."""
    if not doc.content or len(doc.content.strip()) == 0:
        logger.warning(f"Document {doc.doc_id} is empty, skipping")
        return False
    
    return self.add_document(doc)
```

### 2. Embedding Generation Falha

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

### 3. Query Muito Longa

```python
def retrieve_with_truncation(self, query: str, top_k: int = 5, max_query_length: int = 500) -> List[Tuple[str, float]]:
    """Recupera documentos com truncamento de query."""
    if len(query) > max_query_length:
        query = query[:max_query_length]
        logger.warning(f"Query truncated to {max_query_length} characters")
    
    return self.retrieve(query, top_k=top_k)
```

## Integrações com Outros Componentes

### 1. Integração com Sistema de Memória

```python
from memory_system.core.hierarchy import MemoryHierarchy
from rag_engine.retrieval.hybrid_retriever import HybridRetriever

class RAGEnhancedMemory(MemoryHierarchy):
    """Sistema de memória com RAG."""
    
    def __init__(self, rag_retriever: HybridRetriever):
        super().__init__()
        self.rag_retriever = rag_retriever
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera memórias usando RAG."""
        # Buscar RAG
        rag_results = self.rag_retriever.retrieve(query, top_k=top_k)
        
        # Converter para MemoryEntry
        results = []
        for doc_id, score in rag_results:
            doc = self.rag_retriever.documents.get(doc_id)
            if doc:
                # Criar MemoryEntry a partir de Document
                entry = MemoryEntry(
                    entry_id=doc.doc_id,
                    content=doc.content,
                    memory_type="rag",
                    metadata={"rag_score": score}
                )
                results.append(entry)
        
        return results
```

### 2. Integração com Context Management

```python
from context_management.indexing.hybrid_indexer import HybridIndexer
from rag_engine.retrieval.hybrid_retriever import HybridRetriever

class RAGContextIndexer(HybridIndexer):
    """Indexador de contexto com RAG."""
    
    def __init__(self, config, rag_retriever: HybridRetriever):
        super().__init__(config)
        self.rag_retriever = rag_retriever
    
    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca contexto usando RAG."""
        # Busca RAG
        rag_results = self.rag_retriever.retrieve(query, top_k=top_k)
        
        # Indexar resultados RAG temporariamente
        for doc_id, score in rag_results:
            doc = self.rag_retriever.documents.get(doc_id)
            if doc:
                self.add(
                    content=doc.content,
                    context_type="rag",
                    source="external",
                    metadata={"rag_score": score}
                )
        
        # Busca no contexto
        context_results = super().search(query, top_k=top_k)
        
        return context_results
```

### 3. Integração com Orquestração de Agentes

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from rag_engine.retrieval.hybrid_retriever import HybridRetriever

class RAGAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com RAG."""
    
    def __init__(self, llm_client, rag_retriever: HybridRetriever):
        super().__init__(llm_client)
        self.rag_retriever = rag_retriever
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando RAG."""
        # Recuperar documentos relevantes
        rag_docs = self.rag_retriever.retrieve(state["task"], top_k=3)
        
        # Adicionar contexto ao prompt
        context = "\n".join([
            self.rag_retriever.documents[doc_id].content
            for doc_id, _ in rag_docs
        ])
        
        state["context"]["rag"] = context
        
        # Chamar implementação base
        return super().code_generation_node(state)
```

## Próximos Passos

1. Implementar re-ranking com cross-encoder
2. Adicionar expansão de query por LLM
3. Implementar deduplicação de resultados
4. Adicionar sistema de feedback
5. Implementar métricas de avaliação RAG
6. Adicionar suporte a multi-modal
7. Implementar testes de performance
8. Adicionar documentação de API
