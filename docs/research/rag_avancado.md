# RAG Avançado - Retrieval-Augmented Generation

**Data:** 12 de agosto de 2026  
**Status:** Documentação complementar  
**Objetivo:** Aprofundar RAG baseado em gaps competitivos

## Visão Geral

RAG (Retrieval-Augmented Generation) é essencial para acesso a conhecimento. Windsurf usa semantic graph (AST parsing) para navegação, Cursor usa Merkle tree + semantic chunking. IDEIA_aci precisa de RAG avançado com advanced retrieval, knowledge graph RAG, RAG optimization e RAG evaluation.

## Gap 1: Advanced Retrieval

### Conceito

Recuperação avançada com hybrid search, re-ranking, multi-vector retrieval e query expansion. Diferente de retrieval básico, advanced retrieval melhora significativamente a qualidade.

### Dependências

```python
pip install numpy
```

### Implementação com Hybrid Search

```python
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Document:
    """Documento para RAG"""
    doc_id: str
    content: str
    embedding: Optional[np.ndarray] = None
    keywords: List[str] = None
    metadata: Dict = None

class HybridRetriever:
    """Retriever híbrido (lexical + semântico)"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.keyword_index: Dict[str, List[str]] = {}  # keyword -> doc_ids
        self.embedding_index: Dict[str, np.ndarray] = {}  # doc_id -> embedding
    
    def add_document(self, doc: Document):
        """Adiciona documento ao índice"""
        self.documents[doc.doc_id] = doc
        
        # Indexar keywords
        if doc.keywords:
            for keyword in doc.keywords:
                if keyword not in self.keyword_index:
                    self.keyword_index[keyword] = []
                self.keyword_index[keyword].append(doc.doc_id)
        
        # Indexar embedding
        if doc.embedding is not None:
            self.embedding_index[doc.doc_id] = doc.embedding
        
        logger.info(f"Added document {doc.doc_id}")
    
    def lexical_search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca lexical (keyword-based)"""
        query_keywords = query.lower().split()
        scores = {}
        
        for keyword in query_keywords:
            if keyword in self.keyword_index:
                for doc_id in self.keyword_index[keyword]:
                    scores[doc_id] = scores.get(doc_id, 0) + 1
        
        # Normalizar scores
        max_score = max(scores.values()) if scores else 1
        normalized_scores = [(doc_id, score / max_score) for doc_id, score in scores.items()]
        
        # Retornar top_k
        normalized_scores.sort(key=lambda x: x[1], reverse=True)
        return normalized_scores[:top_k]
    
    def semantic_search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        """Busca semântica (embedding-based)"""
        similarities = []
        
        for doc_id, doc_embedding in self.embedding_index.items():
            # Similaridade cosseno
            similarity = np.dot(query_embedding, doc_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
            )
            similarities.append((doc_id, float(similarity)))
        
        # Retornar top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    def hybrid_search(self, query: str, query_embedding: np.ndarray, top_k: int = 5, alpha: float = 0.5) -> List[Tuple[str, float]]:
        """Busca híbrida combinando lexical e semântico"""
        lexical_results = dict(self.lexical_search(query, top_k=top_k * 2))
        semantic_results = dict(self.semantic_search(query_embedding, top_k=top_k * 2))
        
        # Combinar scores
        combined_scores = {}
        
        for doc_id in set(list(lexical_results.keys()) + list(semantic_results.keys())):
            lexical_score = lexical_results.get(doc_id, 0)
            semantic_score = semantic_results.get(doc_id, 0)
            
            # Combinação linear ponderada
            combined_score = alpha * lexical_score + (1 - alpha) * semantic_score
            combined_scores[doc_id] = combined_score
        
        # Retornar top_k
        sorted_results = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]

# Uso
hybrid_retriever = HybridRetriever()

# Adicionar documentos
doc1 = Document(
    doc_id="doc1",
    content="Python is a programming language",
    embedding=np.random.randn(768),
    keywords=["python", "programming", "language"]
)

doc2 = Document(
    doc_id="doc2",
    content="JavaScript is used for web development",
    embedding=np.random.randn(768),
    keywords=["javascript", "web", "development"]
)

hybrid_retriever.add_document(doc1)
hybrid_retriever.add_document(doc2)

# Busca híbrida
query = "programming language"
query_embedding = np.random.randn(768)
results = hybrid_retriever.hybrid_search(query, query_embedding, alpha=0.5)

print(f"Hybrid search results: {results}")
```

### Implementação com Re-ranking

```python
from typing import List, Tuple
import numpy as np

class ReRanker:
    """Re-ranker para resultados de busca"""
    
    def __init__(self):
        self.reranker_model = None  # Em produção, usar modelo de re-ranking real
    
    def rerank(self, query: str, documents: List[Document], initial_results: List[Tuple[str, float]], top_k: int = 5) -> List[Tuple[str, float]]:
        """Re-rankea resultados iniciais"""
        reranked_scores = []
        
        for doc_id, initial_score in initial_results:
            if doc_id not in documents:
                continue
            
            doc = documents[doc_id]
            
            # Calcular score de re-ranking (simulado)
            # Em produção, usar modelo de re-ranking (Cohere Rerank, BGE Rerank, etc.)
            rerank_score = self._calculate_rerank_score(query, doc)
            
            # Combinar score inicial e re-rank score
            combined_score = 0.3 * initial_score + 0.7 * rerank_score
            reranked_scores.append((doc_id, combined_score))
        
        # Retornar top_k
        reranked_scores.sort(key=lambda x: x[1], reverse=True)
        return reranked_scores[:top_k]
    
    def _calculate_rerank_score(self, query: str, doc: Document) -> float:
        """Calcula score de re-ranking (simulado)"""
        # Em produção, usar modelo de re-ranking real
        query_lower = query.lower()
        content_lower = doc.content.lower()
        
        # Simular score baseado em overlap de palavras
        query_words = set(query_lower.split())
        content_words = set(content_lower.split())
        
        overlap = len(query_words & content_words)
        score = overlap / len(query_words) if query_words else 0
        
        return score

# Uso
reranker = ReRanker()

documents = {
    "doc1": doc1,
    "doc2": doc2
}

initial_results = [("doc1", 0.8), ("doc2", 0.6)]
reranked = reranker.rerank("programming language", documents, initial_results)

print(f"Reranked results: {reranked}")
```

## Gap 2: Knowledge Graph RAG

### Conceito

RAG com knowledge graphs para representação estruturada de conhecimento. Diferente de retrieval flat, knowledge graph RAG permite navegação e inferência.

### Implementação com Knowledge Graph RAG

```python
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class KGNode:
    """Nó do knowledge graph"""
    node_id: str
    node_type: str
    properties: Dict[str, str] = field(default_factory=dict)

@dataclass
class KGEdge:
    """Aresta do knowledge graph"""
    source: str
    target: str
    edge_type: str
    properties: Dict[str, str] = field(default_factory=dict)

class KnowledgeGraphRAG:
    """RAG com knowledge graph"""
    
    def __init__(self):
        self.nodes: Dict[str, KGNode] = {}
        self.edges: Dict[str, List[KGEdge]] = defaultdict(list)
        self.adjacency: Dict[str, Set[str]] = defaultdict(set)
    
    def add_node(self, node: KGNode):
        """Adiciona nó ao grafo"""
        self.nodes[node.node_id] = node
        logger.info(f"Added KG node {node.node_id} of type {node.node_type}")
    
    def add_edge(self, edge: KGEdge):
        """Adiciona aresta ao grafo"""
        self.edges[edge.source].append(edge)
        self.adjacency[edge.source].add(edge.target)
        logger.info(f"Added KG edge {edge.source} -> {edge.target} of type {edge.edge_type}")
    
    def retrieve_by_entity(self, entity_name: str) -> List[KGNode]:
        """Recupera nós por nome de entidade"""
        results = []
        
        for node_id, node in self.nodes.items():
            if entity_name.lower() in node.node_id.lower():
                results.append(node)
        
        return results
    
    def retrieve_by_relation(self, source: str, edge_type: str) -> List[KGNode]:
        """Recupera nós por relação"""
        results = []
        
        if source not in self.edges:
            return results
        
        for edge in self.edges[source]:
            if edge.edge_type == edge_type:
                target_node = self.nodes.get(edge.target)
                if target_node:
                    results.append(target_node)
        
        return results
    
    def retrieve_by_path(self, start: str, path: List[str], max_depth: int = 3) -> List[Dict]:
        """Recupera nós por caminho no grafo"""
        results = []
        
        def dfs(current: str, path_index: int, current_path: List[str]):
            if path_index >= len(path):
                # Caminho completo encontrado
                results.append({
                    "path": current_path,
                    "node": self.nodes.get(current)
                })
                return
            
            if len(current_path) > max_depth:
                return
            
            edge_type = path[path_index]
            
            if current not in self.edges:
                return
            
            for edge in self.edges[current]:
                if edge.edge_type == edge_type:
                    dfs(edge.target, path_index + 1, current_path + [edge.target])
        
        dfs(start, 0, [start])
        return results
    
    def retrieve_context(self, entity: str, context_window: int = 2) -> List[KGNode]:
        """Recupera contexto ao redor de uma entidade"""
        context_nodes = set()
        
        # Encontrar nós da entidade
        entity_nodes = self.retrieve_by_entity(entity)
        
        for node in entity_nodes:
            context_nodes.add(node.node_id)
            
            # Adicionar vizinhos (context window)
            for neighbor in list(self.adjacency[node.node_id])[:context_window]:
                context_nodes.add(neighbor)
        
        return [self.nodes[node_id] for node_id in context_nodes if node_id in self.nodes]

# Uso
kg_rag = KnowledgeGraphRAG()

# Adicionar nós
kg_rag.add_node(KGNode(node_id="Python", node_type="language", properties={"paradigm": "multi-paradigm"}))
kg_rag.add_node(KGNode(node_id="FastAPI", node_type="framework", properties={"language": "Python"}))
kg_rag.add_node(KGNode(node_id="REST", node_type="architecture", properties={"protocol": "HTTP"}))
kg_rag.add_node(KGNode(node_id="API", node_type="interface", properties={"style": "REST"}))

# Adicionar arestas
kg_rag.add_edge(KGEdge(source="FastAPI", target="Python", edge_type="built_with"))
kg_rag.add_edge(KGEdge(source="FastAPI", target="REST", edge_type="implements"))
kg_rag.add_edge(KGEdge(source="API", target="REST", edge_type="style"))

# Recuperar por entidade
python_nodes = kg_rag.retrieve_by_entity("Python")
print(f"Python nodes: {[n.node_id for n in python_nodes]}")

# Recuperar por relação
framework_nodes = kg_rag.retrieve_by_relation("FastAPI", "built_with")
print(f"FastAPI built with: {[n.node_id for n in framework_nodes]}")

# Recuperar por caminho
path_results = kg_rag.retrieve_by_path("FastAPI", ["built_with", "implements"])
print(f"Path results: {[r['path'] for r in path_results]}")

# Recuperar contexto
context = kg_rag.retrieve_context("FastAPI", context_window=2)
print(f"Context for FastAPI: {[n.node_id for n in context]}")
```

## Gap 3: RAG Optimization

### Conceito

Otimização de RAG para melhorar recall, precision e latência. Diferente de RAG básico, RAG optimization ajusta parâmetros automaticamente.

### Implementação com RAG Optimization

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import numpy as np

@dataclass
class RAGConfig:
    """Configuração de RAG"""
    top_k: int = 5
    chunk_size: int = 512
    chunk_overlap: int = 50
    retrieval_mode: str = "hybrid"  # hybrid, semantic, lexical
    rerank: bool = True
    alpha: float = 0.5  # Peso para hybrid search

class RAGOptimizer:
    """Otimizador de RAG"""
    
    def __init__(self):
        self.config_history: List[Dict] = []
        self.best_config: Optional[RAGConfig] = None
        self.best_score: float = 0.0
    
    def evaluate_config(self, config: RAGConfig, queries: List[str], ground_truth: List[List[str]], retriever) -> float:
        """Avalia configuração de RAG"""
        total_recall = 0.0
        total_precision = 0.0
        
        for query, relevant_docs in zip(queries, ground_truth):
            # Recuperar com configuração
            results = retriever.retrieve(query, config)
            retrieved_ids = [doc_id for doc_id, _ in results]
            
            # Calcular recall
            recall = len(set(retrieved_ids) & set(relevant_docs)) / len(relevant_docs) if relevant_docs else 0
            total_recall += recall
            
            # Calcular precision
            precision = len(set(retrieved_ids) & set(relevant_docs)) / len(retrieved_ids) if retrieved_ids else 0
            total_precision += precision
        
        avg_recall = total_recall / len(queries)
        avg_precision = total_precision / len(queries)
        
        # F1 score
        f1 = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall) if (avg_precision + avg_recall) > 0 else 0
        
        return f1
    
    def optimize(self, retriever, queries: List[str], ground_truth: List[List[str]], iterations: int = 10):
        """Otimiza configuração de RAG"""
        best_score = 0.0
        best_config = None
        
        for i in range(iterations):
            # Gerar configuração aleatória
            config = RAGConfig(
                top_k=np.random.randint(3, 10),
                chunk_size=np.random.randint(256, 1024),
                chunk_overlap=np.random.randint(0, 100),
                retrieval_mode=np.random.choice(["hybrid", "semantic", "lexical"]),
                rerank=np.random.choice([True, False]),
                alpha=np.random.uniform(0.3, 0.7)
            )
            
            # Avaliar configuração
            score = self.evaluate_config(config, queries, ground_truth, retriever)
            
            # Registrar histórico
            self.config_history.append({
                "config": config,
                "score": score,
                "iteration": i
            })
            
            # Atualizar melhor configuração
            if score > best_score:
                best_score = score
                best_config = config
            
            logger.info(f"Iteration {i}: score={score:.3f}, best={best_score:.3f}")
        
        self.best_config = best_config
        self.best_score = best_score
        
        logger.info(f"Optimization complete. Best score: {best_score:.3f}")
        logger.info(f"Best config: top_k={best_config.top_k}, chunk_size={best_config.chunk_size}")
        
        return best_config

# Uso
rag_optimizer = RAGOptimizer()

# Simular queries e ground truth
queries = ["Python programming", "FastAPI framework", "REST API"]
ground_truth = [["doc1"], ["doc2"], ["doc2"]]

# Otimizar (simulado)
best_config = rag_optimizer.optimize(hybrid_retriever, queries, ground_truth, iterations=5)

print(f"Best config: {best_config}")
```

## Gap 4: RAG Evaluation

### Conceito

Avaliação de RAG com métricas específicas. Diferente de avaliação básica, RAG evaluation usa métricas como faithfulness, answer relevance, context relevance.

### Implementação com RAG Evaluation

```python
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class RAGEvaluationResult:
    """Resultado de avaliação de RAG"""
    faithfulness: float  # Fidelidade ao contexto
    answer_relevance: float  # Relevância da resposta
    context_relevance: float  # Relevância do contexto
    context_precision: float  # Precisão do contexto
    context_recall: float  # Recall do contexto
    overall_score: float

class RAGEvaluator:
    """Avaliador de RAG"""
    
    def __init__(self):
        self.evaluation_model = None  # Em produção, usar modelo de avaliação real
    
    def evaluate(self, query: str, retrieved_context: List[str], answer: str, ground_truth: str) -> RAGEvaluationResult:
        """Avalia resultado de RAG"""
        # Faithfulness: resposta é fiel ao contexto?
        faithfulness = self._evaluate_faithfulness(retrieved_context, answer)
        
        # Answer relevance: resposta é relevante para a query?
        answer_relevance = self._evaluate_answer_relevance(query, answer, ground_truth)
        
        # Context relevance: contexto é relevante para a query?
        context_relevance = self._evaluate_context_relevance(query, retrieved_context)
        
        # Context precision: proporção de contexto relevante
        context_precision = self._evaluate_context_precision(query, retrieved_context)
        
        # Context recall: proporção de contexto relevante recuperado
        context_recall = self._evaluate_context_recall(query, retrieved_context, ground_truth)
        
        # Overall score (média ponderada)
        overall_score = (
            0.3 * faithfulness +
            0.3 * answer_relevance +
            0.2 * context_relevance +
            0.1 * context_precision +
            0.1 * context_recall
        )
        
        return RAGEvaluationResult(
            faithfulness=faithfulness,
            answer_relevance=answer_relevance,
            context_relevance=context_relevance,
            context_precision=context_precision,
            context_recall=context_recall,
            overall_score=overall_score
        )
    
    def _evaluate_faithfulness(self, context: List[str], answer: str) -> float:
        """Avalia fidelidade (simulado)"""
        # Em produção, usar modelo de avaliação real (RAGAS, DeepEval)
        context_text = " ".join(context)
        answer_words = set(answer.lower().split())
        context_words = set(context_text.lower().split())
        
        overlap = len(answer_words & context_words)
        faithfulness = overlap / len(answer_words) if answer_words else 0
        
        return faithfulness
    
    def _evaluate_answer_relevance(self, query: str, answer: str, ground_truth: str) -> float:
        """Avalia relevância da resposta (simulado)"""
        # Em produção, usar similaridade semântica
        query_words = set(query.lower().split())
        answer_words = set(answer.lower().split())
        ground_truth_words = set(ground_truth.lower().split())
        
        # Similaridade com ground truth
        overlap = len(answer_words & ground_truth_words)
        relevance = overlap / len(ground_truth_words) if ground_truth_words else 0
        
        return relevance
    
    def _evaluate_context_relevance(self, query: str, context: List[str]) -> float:
        """Avalia relevância do contexto (simulado)"""
        query_words = set(query.lower().split())
        context_text = " ".join(context)
        context_words = set(context_text.lower().split())
        
        overlap = len(query_words & context_words)
        relevance = overlap / len(query_words) if query_words else 0
        
        return relevance
    
    def _evaluate_context_precision(self, query: str, context: List[str]) -> float:
        """Avalia precisão do contexto (simulado)"""
        # Proporção de chunks relevantes
        relevant_chunks = 0
        
        for chunk in context:
            query_words = set(query.lower().split())
            chunk_words = set(chunk.lower().split())
            
            if len(query_words & chunk_words) > 0:
                relevant_chunks += 1
        
        precision = relevant_chunks / len(context) if context else 0
        return precision
    
    def _evaluate_context_recall(self, query: str, context: List[str], ground_truth: str) -> float:
        """Avalia recall do contexto (simulado)"""
        # Proporção de informações relevantes recuperadas
        ground_truth_words = set(ground_truth.lower().split())
        context_text = " ".join(context)
        context_words = set(context_text.lower().split())
        
        overlap = len(ground_truth_words & context_words)
        recall = overlap / len(ground_truth_words) if ground_truth_words else 0
        
        return recall

# Uso
rag_evaluator = RAGEvaluator()

# Avaliar resultado de RAG
result = rag_evaluator.evaluate(
    query="What is Python?",
    retrieved_context=["Python is a programming language", "Python is used for data science"],
    answer="Python is a programming language used for data science",
    ground_truth="Python is a programming language"
)

print(f"RAG Evaluation: {result}")
```

## Recomendações de Implementação

### Para MVP
1. **Hybrid search básico:** Implementar lexical + semantic search
2. **Knowledge graph básico:** Implementar grafo simples com navegação
3. **RAG evaluation básico:** Implementar métricas simples

### Para Produção
1. **Advanced retrieval:** Implementar re-ranking, multi-vector retrieval, query expansion
2. **Knowledge graph avançado:** Implementar graph embeddings, graph reasoning
3. **RAG optimization:** Implementar auto-tuning de parâmetros
4. **RAG evaluation:** Implementar avaliação com modelos reais (RAGAS, DeepEval)

## Integração com IDEIA-master

O package `rag-engine` do IDEIA-master pode ser usado como base para implementação de RAG no IDEIA_aci.

## Referências

- RAGAS: https://github.com/explodinggradients/ragas
- DeepEval: https://github.com/confident-ai/deepeval
- LangChain RAG: https://python.langchain.com/docs/v0.1/uses/rag/
- LlamaIndex RAG: https://docs.llamaindex.ai/en/stable/optimizing/rag/
