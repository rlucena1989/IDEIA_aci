# Estratégias de Compressão de Embeddings

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e implementações de compressão de embeddings para reduzir armazenamento e custo

## Visão geral

Compressão de embeddings é essencial para reduzir custos de armazenamento, melhorar performance de busca e otimizar uso de memória. Diferentes estratégias oferecem trade-offs entre taxa de compressão, qualidade de recuperação e overhead computacional.

## Estratégias de compressão

### 1. Quantização (Quantization)

**Princípio:** Reduzir precisão dos valores (ex: float32 → float16 → int8)

**Características:**
- Taxa de compressão: 2-4x
- Perda de qualidade: Baixa-Média
- Overhead computacional: Baixo
- Adequado para: Redução de memória

**Implementação com NumPy:**
```python
import numpy as np

def quantize_to_float16(embeddings):
    """Quantizar embeddings de float32 para float16"""
    return embeddings.astype(np.float16)

def quantize_to_int8(embeddings):
    """Quantizar embeddings de float32 para int8"""
    # Normalizar para [-128, 127]
    min_val = np.min(embeddings)
    max_val = np.max(embeddings)
    
    normalized = (embeddings - min_val) / (max_val - min_val)
    quantized = (normalized * 255 - 128).astype(np.int8)
    
    return quantized

def dequantize_from_int8(quantized, min_val, max_val):
    """Dequantizar de int8 para float32"""
    normalized = (quantized.astype(np.float32) + 128) / 255
    dequantized = normalized * (max_val - min_val) + min_val
    
    return dequantized

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)

# Float16
embeddings_f16 = quantize_to_float16(embeddings)
print(f"Original: {embeddings.nbytes} bytes")
print(f"Float16: {embeddings_f16.nbytes} bytes")

# Int8
embeddings_i8 = quantize_to_int8(embeddings)
print(f"Int8: {embeddings_i8.nbytes} bytes")
```

**Implementação com FAISS:**
```python
import faiss
import numpy as np

def quantize_with_faiss(embeddings, nbits=8):
    """Quantizar embeddings com FAISS"""
    d = embeddings.shape[1]  # Dimensão
    
    # Criar quantizador
    quantizer = faiss.IndexFlatL2(d)
    index = faiss.IndexIVFPQ(quantizer, d, 100, nbits, 8)
    
    # Treinar
    index.train(embeddings)
    
    # Adicionar embeddings
    index.add(embeddings)
    
    return index

# Uso
embeddings = np.random.randn(10000, 768).astype(np.float32)
index = quantize_with_faiss(embeddings, nbits=8)
```

### 2. PCA (Principal Component Analysis)

**Princípio:** Reduzir dimensionalidade mantendo variância

**Características:**
- Taxa de compressão: 2-10x
- Perda de qualidade: Média
- Overhead computacional: Médio
- Adequado para: Redução de dimensionalidade

**Implementação com scikit-learn:**
```python
from sklearn.decomposition import PCA
import numpy as np

def compress_with_pca(embeddings, n_components=256):
    """Comprimir embeddings com PCA"""
    # Treinar PCA
    pca = PCA(n_components=n_components)
    compressed = pca.fit_transform(embeddings)
    
    return compressed, pca

def decompress_with_pca(compressed, pca):
    """Descomprimir embeddings com PCA"""
    return pca.inverse_transform(compressed)

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)

# Comprimir para 256 dimensões
compressed, pca = compress_with_pca(embeddings, n_components=256)

print(f"Original: {embeddings.shape}")
print(f"Comprimido: {compressed.shape}")

# Descomprimir
decompressed = decompress_with_pca(compressed, pca)
```

**Implementação com Autoencoder:**
```python
import tensorflow as np
from tensorflow import keras
from tensorflow.keras import layers

def build_autoencoder(input_dim, encoding_dim):
    """Construir autoencoder para compressão"""
    # Encoder
    input_layer = keras.Input(shape=(input_dim,))
    encoded = layers.Dense(512, activation='relu')(input_layer)
    encoded = layers.Dense(encoding_dim, activation='relu')(encoded)
    
    # Decoder
    decoded = layers.Dense(512, activation='relu')(encoded)
    decoded = layers.Dense(input_dim, activation='linear')(decoded)
    
    # Modelo
    autoencoder = keras.Model(input_layer, decoded)
    encoder = keras.Model(input_layer, encoded)
    
    autoencoder.compile(optimizer='adam', loss='mse')
    
    return autoencoder, encoder

def compress_with_autoencoder(embeddings, encoding_dim=256):
    """Comprimir embeddings com autoencoder"""
    input_dim = embeddings.shape[1]
    
    # Construir autoencoder
    autoencoder, encoder = build_autoencoder(input_dim, encoding_dim)
    
    # Treinar
    autoencoder.fit(embeddings, embeddings, epochs=10, batch_size=32)
    
    # Comprimir
    compressed = encoder.predict(embeddings)
    
    return compressed, autoencoder

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)
compressed, autoencoder = compress_with_autoencoder(embeddings, encoding_dim=256)
```

### 3. Product Quantization (PQ)

**Princípio:** Dividir vetor em subvetores e quantizar cada um

**Características:**
- Taxa de compressão: 8-32x
- Perda de qualidade: Média-Alta
- Overhead computacional: Médio
- Adequado para: Busca aproximada

**Implementação com FAISS:**
```python
import faiss
import numpy as np

def compress_with_pq(embeddings, nbits=8, m=8):
    """Comprimir embeddings com Product Quantization"""
    d = embeddings.shape[1]  # Dimensão
    
    # Criar índice PQ
    quantizer = faiss.IndexFlatL2(d)
    index = faiss.IndexIVFPQ(quantizer, d, 100, m, nbits)
    
    # Treinar
    index.train(embeddings)
    
    # Adicionar embeddings
    index.add(embeddings)
    
    return index

def search_with_pq(index, query, k=10):
    """Buscar com PQ"""
    D, I = index.search(query, k)
    return D, I

# Uso
embeddings = np.random.randn(10000, 768).astype(np.float32)
query = np.random.randn(1, 768).astype(np.float32)

# Comprimir
index = compress_with_pq(embeddings, nbits=8, m=8)

# Buscar
D, I = search_with_pq(index, query, k=10)
```

### 4. Binary Quantization

**Princípio:** Converter embeddings para binário (0/1)

**Características:**
- Taxa de compressão: 32x
- Perda de qualidade: Alta
- Overhead computacional: Baixo
- Adequado para: Busca muito aproximada

**Implementação:**
```python
import numpy as np

def binary_quantize(embeddings):
    """Quantizar embeddings para binário"""
    # Converter para binário baseado no sinal
    binary = (embeddings > 0).astype(np.uint8)
    
    return binary

def hamming_distance(a, b):
    """Calcular distância de Hamming"""
    return np.sum(a != b)

def search_binary(binary_embeddings, query, k=10):
    """Buscar com embeddings binários"""
    query_binary = binary_quantize(query)
    
    distances = []
    for i, embedding in enumerate(binary_embeddings):
        dist = hamming_distance(query_binary[0], embedding)
        distances.append((dist, i))
    
    # Ordenar por distância
    distances.sort(key=lambda x: x[0])
    
    # Retornar k mais próximos
    return distances[:k]

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)

# Comprimir para binário
binary_embeddings = binary_quantize(embeddings)

print(f"Original: {embeddings.nbytes} bytes")
print(f"Binary: {binary_embeddings.nbytes} bytes")

# Buscar
query = np.random.randn(1, 768).astype(np.float32)
results = search_binary(binary_embeddings, query, k=10)
```

### 5. Sparse Embeddings

**Princípio:** Manter apenas valores mais significativos (sparsidade)

**Características:**
- Taxa de compressão: 5-20x
- Perda de qualidade: Média
- Overhead computacional: Baixo
- Adequado para: Redução de armazenamento

**Implementação:**
```python
import numpy as np
from scipy import sparse

def sparse_embeddings(embeddings, threshold=0.1):
    """Converter embeddings para esparsos"""
    # Zerar valores abaixo do threshold
    sparse = np.where(np.abs(embeddings) > threshold, embeddings, 0)
    
    # Converter para formato esparsa
    sparse_matrix = sparse.csr_matrix(sparse)
    
    return sparse_matrix

def dense_from_sparse(sparse_matrix):
    """Converter de esparsa para densa"""
    return sparse_matrix.toarray()

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)

# Comprimir para esparsa
sparse_embeddings = sparse_embeddings(embeddings, threshold=0.1)

print(f"Original: {embeddings.nbytes} bytes")
print(f"Sparse: {sparse_embeddings.data.nbytes + sparse_embeddings.indptr.nbytes + sparse_embeddings.indices.nbytes} bytes")

# Descomprimir
dense_embeddings = dense_from_sparse(sparse_embeddings)
```

### 6. Huffman Coding

**Princípio:** Compressão sem perda baseada em frequência

**Características:**
- Taxa de compressão: 1.5-3x
- Perda de qualidade: Nenhuma
- Overhead computacional: Médio
- Adequado para: Compressão sem perda

**Implementação:**
```python
import numpy as np
import heapq
from collections import defaultdict

class HuffmanNode:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None
    
    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_tree(frequencies):
    """Construir árvore de Huffman"""
    heap = []
    for char, freq in frequencies.items():
        heapq.heappush(heap, HuffmanNode(char, freq))
    
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        
        merged = HuffmanNode(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        
        heapq.heappush(heap, merged)
    
    return heap[0]

def build_codes(root, code="", codes=None):
    """Construir códigos de Huffman"""
    if codes is None:
        codes = {}
    
    if root is None:
        return
    
    if root.char is not None:
        codes[root.char] = code
        return
    
    build_codes(root.left, code + "0", codes)
    build_codes(root.right, code + "1", codes)
    
    return codes

def huffman_compress(data):
    """Comprimir dados com Huffman"""
    # Calcular frequências
    frequencies = defaultdict(int)
    for value in data:
        frequencies[value] += 1
    
    # Construir árvore
    root = build_huffman_tree(frequencies)
    
    # Construir códigos
    codes = build_codes(root)
    
    # Codificar dados
    encoded = ""
    for value in data:
        encoded += codes[value]
    
    return encoded, codes

def huffman_decompress(encoded, codes):
    """Descomprimir dados de Huffman"""
    # Inverter códigos
    reverse_codes = {v: k for k, v in codes.items()}
    
    # Decodificar dados
    decoded = []
    current_code = ""
    
    for bit in encoded:
        current_code += bit
        if current_code in reverse_codes:
            decoded.append(reverse_codes[current_code])
            current_code = ""
    
    return np.array(decoded)

# Uso
embeddings = np.random.randn(1000, 768).astype(np.float32)

# Quantizar para int8
quantized = quantize_to_int8(embeddings)

# Comprimir com Huffman
encoded, codes = huffman_compress(quantized.flatten())

print(f"Original: {embeddings.nbytes} bytes")
print(f"Quantizado: {quantized.nbytes} bytes")
print(f"Huffman: {len(encoded) // 8} bytes")
```

## Comparativo de estratégias

### Taxa de compressão vs Qualidade

| Estratégia | Taxa de compressão | Perda de qualidade | Overhead computacional |
|---|---|---|---|
| Float16 | 2x | Baixa | Baixo |
| Int8 | 4x | Média | Baixo |
| PCA (256d) | 3x | Média | Médio |
| Autoencoder | 3x | Média | Alto |
| Product Quantization | 8-32x | Média-Alta | Médio |
| Binary Quantization | 32x | Alta | Baixo |
| Sparse Embeddings | 5-20x | Média | Baixo |
| Huffman Coding | 1.5-3x | Nenhuma | Médio |

### Casos de uso recomendados

| Caso de uso | Estratégia recomendada |
|---|---|
| Redução de memória | Float16, Int8 |
| Redução de dimensionalidade | PCA, Autoencoder |
| Busca aproximada rápida | Product Quantization |
| Busca muito aproximada | Binary Quantization |
| Compressão sem perda | Huffman Coding |
| Redução de armazenamento | Sparse Embeddings |

## Implementação com Vector DBs

### Qdrant

```python
from qdrant_client import QdrantClient
import numpy as np

client = QdrantClient("localhost", port=6333)

# Criar coleção com quantização
client.create_collection(
    collection_name="compressed_embeddings",
    vectors_config={
        "size": 768,
        "distance": "Cosine",
        "hnsw_config": {
            "m": 16,
            "ef_construct": 100
        },
        "quantization_config": {
            "scalar": {
                "type": "int8",
                "always_ram": True
            }
        }
    }
)

# Inserir embeddings
embeddings = np.random.randn(1000, 768).astype(np.float32)
client.upload_collection(
    collection_name="compressed_embeddings",
    vectors=embeddings,
    ids=list(range(1000))
)
```

### pgvector

```sql
-- Criar tabela com quantização
CREATE TABLE compressed_embeddings (
    id SERIAL PRIMARY KEY,
    embedding VECTOR(768),
    embedding_int8 VECTOR(768)
);

-- Converter para int8
UPDATE compressed_embeddings
SET embedding_int8 = vector_quantize(embedding, 'int8');

-- Criar índice
CREATE INDEX ON compressed_embeddings USING ivfflat (embedding_int8 vector_cosine_ops);
```

### Pinecone

```python
import pinecone

pinecone.init(api_key="your-api-key")

# Criar índice com quantização
pinecone.create_index(
    name="compressed-embeddings",
    dimension=768,
    metric="cosine",
    pod_type="p1.x1"
)

# Upsert embeddings
index = pinecone.Index("compressed-embeddings")
index.upsert(
    vectors=[
        {"id": "1", "values": embedding.tolist()}
    ]
)
```

## Estratégias de avaliação

### Métricas de qualidade

```python
import numpy as np
from sklearn.metrics import pairwise_distances

def evaluate_compression(original, compressed, decompressed):
    """Avaliar qualidade da compressão"""
    # Taxa de compressão
    compression_ratio = original.nbytes / compressed.nbytes
    
    # Erro de reconstrução
    reconstruction_error = np.mean((original - decompressed) ** 2)
    
    # Similaridade de cosseno
    original_norm = original / np.linalg.norm(original, axis=1, keepdims=True)
    decompressed_norm = decompressed / np.linalg.norm(decompressed, axis=1, keepdims=True)
    cosine_similarity = np.mean(np.sum(original_norm * decompressed_norm, axis=1))
    
    # Recall@10
    original_distances = pairwise_distances(original, metric='cosine')
    decompressed_distances = pairwise_distances(decompressed, metric='cosine')
    
    original_top10 = np.argsort(original_distances, axis=1)[:, :10]
    decompressed_top10 = np.argsort(decompressed_distances, axis=1)[:, :10]
    
    recall = 0
    for i in range(len(original)):
        recall += len(set(original_top10[i]) & set(decompressed_top10[i])) / 10
    
    recall /= len(original)
    
    return {
        'compression_ratio': compression_ratio,
        'reconstruction_error': reconstruction_error,
        'cosine_similarity': cosine_similarity,
        'recall@10': recall
    }

# Uso
original = np.random.randn(1000, 768).astype(np.float32)
compressed = quantize_to_int8(original)
decompressed = dequantize_from_int8(compressed, np.min(original), np.max(original))

metrics = evaluate_compression(original, compressed, decompressed)
print(metrics)
```

## Recomendações

### Para redução de memória
- **Estratégia:** Float16 ou Int8
- **Taxa de compressão:** 2-4x
- **Perda de qualidade:** Baixa-Média
- **Implementação:** Simples

### Para redução de dimensionalidade
- **Estratégia:** PCA ou Autoencoder
- **Taxa de compressão:** 2-10x
- **Perda de qualidade:** Média
- **Implementação:** Média

### Para busca aproximada
- **Estratégia:** Product Quantization
- **Taxa de compressão:** 8-32x
- **Perda de qualidade:** Média-Alta
- **Implementação:** Média

### Para compressão sem perda
- **Estratégia:** Huffman Coding
- **Taxa de compressão:** 1.5-3x
- **Perda de qualidade:** Nenhuma
- **Implementação:** Média

## Próximos passos

1. **Escolher estratégia:** Selecionar baseado em requisitos
2. **Implementar compressão:** Criar função de compressão
3. **Avaliar qualidade:** Medir métricas de qualidade
4. **Testar busca:** Validar recall@k
5. **Deploy:** Integrar com vector DB
6. **Monitorar:** Acompanhar performance

## Referências

- FAISS: https://faiss.ai/
- PCA: https://scikit-learn.org/stable/modules/decomposition.html
- Product Quantization: https://lear.inrialpes.fr/pubs/2011/JDS11/jegou_searching_a_huge_database_with_kd_tree.pdf
- Qdrant Quantization: https://qdrant.tech/documentation/concepts/quantization/
