# Knowledge Graphs

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Knowledge Graphs baseado em gaps competitivos

## Visão Geral

Knowledge Graphs representam conhecimento estruturado com entidades e relações. Windsurf usa semantic graph (AST parsing) para navegação. IDEIA_aci precisa de knowledge graphs avançados com graph embeddings, graph reasoning, graph visualization e graph evolution.

## Arquitetura de Knowledge Graphs

### Componentes

```
┌─────────────────────────────────────┐
│   Graph Builder                      │  ← Construção do grafo
├─────────────────────────────────────┤
│   Graph Embedding Engine             │  ← Embeddings de nós/arestas
├─────────────────────────────────────┤
│   Graph Reasoning Engine             │  ← Inferência no grafo
├─────────────────────────────────────┤
│   Graph Query Engine                 │  ← Query do grafo
├─────────────────────────────────────┤
│   Graph Visualizer                   │  ← Visualização do grafo
└─────────────────────────────────────┘
```

## Gap 1: Graph Embeddings

### Conceito

Embeddings de nós e arestas para representação vetorial. Diferente de grafo sem embeddings, graph embeddings permite similaridade semântica.

### Dependências

```python
pip install numpy
```

### Implementação com Graph Embeddings

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import numpy as np

@dataclass
class GraphNode:
    """Nó do grafo"""
    node_id: str
    node_type: str
    properties: Dict[str, any]
    embedding: Optional[np.ndarray] = None

@dataclass
class GraphEdge:
    """Aresta do grafo"""
    source: str
    target: str
    edge_type: str
    properties: Dict[str, any]
    embedding: Optional[np.ndarray] = None

class GraphEmbeddingEngine:
    """Engine de embeddings de grafo"""
    
    def __init__(self, embedding_dim: int = 128):
        self.embedding_dim = embedding_dim
        self.node_embeddings: Dict[str, np.ndarray] = {}
        self.edge_embeddings: Dict[str, np.ndarray] = {}
    
    def generate_node_embedding(self, node: GraphNode) -> np.ndarray:
        """Gera embedding para nó (simulado)"""
        # Em produção, usar GraphSAGE, GAT, ou node2vec
        # Aqui simulamos com hash das propriedades
        props_str = str(node.properties)
        hash_val = int(hash(props_str) % (2 ** 32))
        
        # Gerar embedding determinístico
        np.random.seed(hash_val)
        embedding = np.random.randn(self.embedding_dim)
        
        return embedding
    
    def generate_edge_embedding(self, edge: GraphEdge) -> np.ndarray:
        """Gera embedding para aresta (simulado)"""
        # Em produção, usar edge embeddings específicos
        props_str = f"{edge.edge_type}{edge.properties}"
        hash_val = int(hash(props_str) % (2 ** 32))
        
        np.random.seed(hash_val)
        embedding = np.random.randn(self.embedding_dim)
        
        return embedding
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Computa similaridade cosseno"""
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def find_similar_nodes(self, query_embedding: np.ndarray, top_k: int = 5) -> List[tuple[str, float]]:
        """Encontra nós similares"""
        similarities = []
        
        for node_id, embedding in self.node_embeddings.items():
            similarity = self.compute_similarity(query_embedding, embedding)
            similarities.append((node_id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]

# Uso
embedding_engine = GraphEmbeddingEngine(embedding_dim=128)

# Criar nó
node = GraphNode(
    node_id="func_main",
    node_type="function",
    properties={"name": "main", "file": "main.py"}
)

# Gerar embedding
embedding = embedding_engine.generate_node_embedding(node)
node.embedding = embedding

print(f"Node embedding shape: {embedding.shape}")
```

## Gap 2: Graph Reasoning

### Conceito

Inferência no grafo para descobrir relações implícitas. Diferente de navegação simples, graph reasoning permite dedução.

### Implementação com Graph Reasoning

```python
from typing import List, Set, Optional
from collections import deque

class GraphReasoningEngine:
    """Engine de reasoning em grafo"""
    
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: Dict[str, List[GraphEdge]] = {}
        self.adjacency: Dict[str, Set[str]] = {}
    
    def add_node(self, node: GraphNode):
        """Adiciona nó"""
        self.nodes[node.node_id] = node
        self.adjacency[node.node_id] = set()
    
    def add_edge(self, edge: GraphEdge):
        """Adiciona aresta"""
        if edge.source not in self.edges:
            self.edges[edge.source] = []
        
        self.edges[edge.source].append(edge)
        self.adjacency[edge.source].add(edge.target)
    
    def find_path(self, start: str, end: str, max_depth: int = 5) -> Optional[List[str]]:
        """Encontra caminho entre nós (BFS)"""
        if start not in self.nodes or end not in self.nodes:
            return None
        
        queue = deque([(start, [start])])
        visited = {start}
        
        while queue:
            current, path = queue.popleft()
            
            if current == end:
                return path
            
            if len(path) >= max_depth:
                continue
            
            for neighbor in self.adjacency.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        return None
    
    def find_related_nodes(self, node_id: str, relation_types: List[str], max_depth: int = 2) -> Set[str]:
        """Encontra nós relacionados por tipos de relação específicos"""
        related = set()
        queue = deque([(node_id, 0)])
        visited = {node_id}
        
        while queue:
            current, depth = queue.popleft()
            
            if depth >= max_depth:
                continue
            
            if current in self.edges:
                for edge in self.edges[current]:
                    if edge.edge_type in relation_types:
                        related.add(edge.target)
                        
                        if edge.target not in visited:
                            visited.add(edge.target)
                            queue.append((edge.target, depth + 1))
        
        return related
    
    def infer_implicit_relations(self, node_id: str) -> List[Dict]:
        """Infere relações implícitas (transitividade)"""
        implicit_relations = []
        
        # Exemplo: se A depende de B e B depende de C, então A depende indiretamente de C
        if node_id in self.edges:
            for edge in self.edges[node_id]:
                if edge.edge_type == "depends_on":
                    # Encontrar dependências transitivas
                    transitive_deps = self.find_related_nodes(
                        edge.target,
                        ["depends_on"],
                        max_depth=2
                    )
                    
                    for dep in transitive_deps:
                        if dep != node_id and dep != edge.target:
                            implicit_relations.append({
                                "source": node_id,
                                "target": dep,
                                "relation": "transitively_depends_on",
                                "via": edge.target
                            })
        
        return implicit_relations

# Uso
reasoning_engine = GraphReasoningEngine()

# Adicionar nós
reasoning_engine.add_node(GraphNode(node_id="func_main", node_type="function", properties={}))
reasoning_engine.add_node(GraphNode(node_id="func_helper", node_type="function", properties={}))
reasoning_engine.add_node(GraphNode(node_id="func_util", node_type="function", properties={}))

# Adicionar arestas
reasoning_engine.add_edge(GraphEdge(source="func_main", target="func_helper", edge_type="depends_on", properties={}))
reasoning_engine.add_edge(GraphEdge(source="func_helper", target="func_util", edge_type="depends_on", properties={}))

# Encontrar caminho
path = reasoning_engine.find_path("func_main", "func_util")
print(f"Path: {path}")

# Inferir relações implícitas
implicit = reasoning_engine.infer_implicit_relations("func_main")
print(f"Implicit relations: {implicit}")
```

## Gap 3: Graph Visualization

### Conceito

Visualização interativa do grafo para exploração. Diferente de grafo sem visualização, graph visualization permite debugging e análise.

### Implementação com Graph Visualization

```python
from typing import Dict, List
import json

class GraphVisualizer:
    """Visualizador de grafo"""
    
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
    
    def add_node(self, node: GraphNode):
        """Adiciona nó"""
        self.nodes[node.node_id] = node
    
    def add_edge(self, edge: GraphEdge):
        """Adiciona aresta"""
        self.edges.append(edge)
    
    def export_to_d3(self) -> Dict:
        """Exporta para formato D3.js"""
        nodes_data = []
        edges_data = []
        
        for node_id, node in self.nodes.items():
            nodes_data.append({
                "id": node_id,
                "type": node.node_type,
                "properties": node.properties
            })
        
        for edge in self.edges:
            edges_data.append({
                "source": edge.source,
                "target": edge.target,
                "type": edge.edge_type,
                "properties": edge.properties
            })
        
        return {
            "nodes": nodes_data,
            "links": edges_data
        }
    
    def export_to_cytoscape(self) -> Dict:
        """Exporta para formato Cytoscape.js"""
        elements = []
        
        for node_id, node in self.nodes.items():
            elements.append({
                "data": {
                    "id": node_id,
                    "type": node.node_type,
                    **node.properties
                }
            })
        
        for edge in self.edges:
            elements.append({
                "data": {
                    "source": edge.source,
                    "target": edge.target,
                    "type": edge.edge_type,
                    **edge.properties
                }
            })
        
        return {"elements": elements}
    
    def save_json(self, filename: str, format: str = "d3"):
        """Salva grafo como JSON"""
        if format == "d3":
            data = self.export_to_d3()
        elif format == "cytoscape":
            data = self.export_to_cytoscape()
        else:
            raise ValueError(f"Unknown format: {format}")
        
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)

# Uso
visualizer = GraphVisualizer()

visualizer.add_node(GraphNode(node_id="func_main", node_type="function", properties={"name": "main"}))
visualizer.add_node(GraphNode(node_id="func_helper", node_type="function", properties={"name": "helper"}))
visualizer.add_edge(GraphEdge(source="func_main", target="func_helper", edge_type="calls", properties={}))

# Exportar
d3_data = visualizer.export_to_d3()
print(f"D3 data: {json.dumps(d3_data, indent=2)}")
```

## Recomendações de Implementação

### Para MVP
1. **Graph embeddings básico:** Implementar com embeddings simples
2. **Graph reasoning básico:** Implementar com BFS e relações transitivas
3. **Graph visualization básico:** Implementar com export para D3/Cytoscape

### Para Produção
1. **Graph embeddings avançado:** Implementar com GraphSAGE, GAT
2. **Graph reasoning avançado:** Implementar com reasoning complexo e regras
3. **Graph visualization avançado:** Implementar com visualização interativa em tempo real
4. **Graph evolution:** Implementar com atualização incremental do grafo

## Integração com IDEIA-master

O package `memory-graph` do IDEIA-master pode ser usado como base para implementação de knowledge graphs no IDEIA_aci.

## Referências

- Neo4j: https://neo4j.com/
- NetworkX: https://networkx.org/
- GraphSAGE: https://arxiv.org/abs/1706.02216
- D3.js: https://d3js.org/
- Cytoscape.js: https://js.cytoscape.org/
