# Avaliação de Ferramentas de RAG

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar frameworks de RAG (LangChain, LlamaIndex, Haystack) e recomendar a melhor opção

## Visão geral

Três frameworks dominam o ecossistema de RAG em 2026: LangChain, LlamaIndex e Haystack. Cada um tem especializações distintas e escolher o certo depende do caso de uso.

## Comparativo de frameworks

### LangChain

**Foco:** Orquestração geral de LLM (chains, agents, tools, workflows)  
**GitHub stars:** ~142k (julho 2026)  
**Licença:** MIT  
**Primary focus:** General LLM orchestration  
**Language support:** Python, TypeScript  
**Vector store integrations:** 50+  
**LLM provider support:** 60+  
**Built-in evaluation:** LangSmith (paid)  
**Streaming support:** Yes  
**Async support:** Full  
**Framework overhead:** ~10-14ms  
**Token usage per request:** ~2.4k  
**Docker image size delta:** +200-400MB

**Prós:**
- Maior ecossistema (mais integrações, recursos da comunidade)
- LangGraph para agentes complexos com stateful multi-step workflows
- LCEL (LangChain Expression Language) intuitivo e Pythonic
- LangSmith e LangServe para tracing e serving
- Maior familiaridade no mercado de contratação
- LangChain 1.0 estabilizado (sem breaking changes antes de 2.0)
- Middleware system para human-in-the-loop, summarization, PII redaction

**Contras:**
- Abstraction tax (overhead de abstração)
- Churn de API (histórico de breaking changes)
- langchain-community está sendo deprecated
- Requer mais código para RAG básico comparado a LlamaIndex
- Maior overhead de framework (~10-14ms)
- Maior uso de tokens (~2.4k/request)
- Docker image maior (+200-400MB)

**Best for:**
- Aplicações complexas com multi-step agents
- Orquestração de tools e long-horizon memory
- Equipes que precisam do maior ecossistema possível
- Sistemas que requerem LangGraph para stateful agents

**Implementação básica:**
```python
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Load documents
loader = TextLoader("document.txt")
documents = loader.load()

# Split documents
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(documents)

# Create embeddings and store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)

# Create retrieval chain
retriever = vectorstore.as_retriever()
qa_chain = RetrievalQA.from_chain_type(llm=OpenAI(), chain_type="stuff", retriever=retriever)

# Query
result = qa_chain.run("Qual é o conteúdo do documento?")
```

### LlamaIndex

**Foco:** Data indexing & retrieval (RAG-native)  
**GitHub stars:** ~51k (julho 2026)  
**Licença:** MIT  
**Primary focus:** Data indexing & retrieval  
**Language support:** Python (TypeScript deprecated)  
**Vector store integrations:** 40+  
**LLM provider support:** 40+  
**Built-in evaluation:** Built-in eval module  
**Streaming support:** Yes  
**Async support:** Full  
**Framework overhead:** ~6ms  
**Token usage per request:** ~1.60k  
**Docker image size delta:** baseline

**Prós:**
- RAG-native desde o início
- Menos código para RAG básico (~10 linhas vs ~18 em LangChain)
- Melhor qualidade de recuperação (hierarchical chunking, auto-merging)
- LlamaParse e LlamaCloud para parsing de documentos complexos
- Advanced retrieval patterns built-in (SubQuestion, HyDE, RAG Fusion)
- Hierarchical chunking preserva estrutura de documentos
- Auto-merging retrieval reduz alucinações
- Sub-question decomposition para queries complexas
- Menor overhead (~6ms)
- Menor uso de tokens (~1.60k/request)
- 80+ document readers (PDF, DOCX, HTML, images, video)

**Contras:**
- Limitações em agent orchestration (Workflows são stateless por padrão)
- Settings global state pode conflitar em múltiplos pipelines
- Deep abstraction torna debugging mais difícil
- 28 core dependencies (mais que LangChain)
- TypeScript deprecated

**Best for:**
- Sistemas RAG onde qualidade de recuperação é crítica
- Documentos complexos (PDFs, tabelas, charts)
- Prototipagem rápida (time-to-first-answer menor)
- Equipes pequenas ou solo developers

**Implementação básica:**
```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index.embeddings import OpenAIEmbedding
from llama_index.llms import OpenAI

# Load documents
documents = SimpleDirectoryReader("data").load_data()

# Create index
index = VectorStoreIndex.from_documents(documents)

# Query engine
query_engine = index.as_query_engine()

# Query
response = query_engine.query("Qual é o conteúdo dos documentos?")
```

### Haystack (deepset)

**Foco:** Production NLP pipelines, enterprise deployment  
**GitHub stars:** ~26k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** Production NLP pipelines  
**Language support:** Python  
**Vector store integrations:** 30+  
**LLM provider support:** 25+  
**Built-in evaluation:** Built-in eval pipeline  
**Streaming support:** Yes  
**Async support:** Full  
**Framework overhead:** ~5.9ms  
**Token usage per request:** ~1.57k  
**Docker image size delta:** baseline

**Prós:**
- Pipeline explícito e tipado (transparência total)
- Type safety forte (reduz incidentes operacionais)
- Pipeline serializável para YAML e visualizável como diagrama
- Hayhooks transforma qualquer pipeline em REST API ou MCP server
- Sovereign AI (on-prem, VPC, air-gapped deployment)
- EU data residency (deepset é empresa alemã)
- Menor overhead (~5.9ms)
- Menor uso de tokens (~1.57k/request)
- Mais previsível sob load (latência consistente)
- Technology-agnostic (swap LLM, vector DB, retriever sem rewrites)

**Contras:**
- Menor comunidade (26k stars vs 142k LangChain)
- Menos integrações que LangChain
- Requer mais código que LlamaIndex para RAG básico
- Menos recursos da comunidade e Stack Overflow

**Best for:**
- Indústrias reguladas (finance, healthcare, public sector)
- Equipes com cultura de engenharia tipada
- Deployments que requerem EU data residency
- Sistemas onde audibilidade e conformidade são críticas

**Implementação básica:**
```python
from haystack import Pipeline
from haystack.components.readers import TextFileReader
from haystack.components.preprocessors import TextCleaner
from haystack.components.embedders import OpenAIDocumentEmbedder, OpenAITextEmbedder
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.builders import AnswerBuilder
from haystack.document_stores import InMemoryDocumentStore

# Create document store
document_store = InMemoryDocumentStore()

# Create pipeline
pipeline = Pipeline()
pipeline.add_component("reader", TextFileReader())
pipeline.add_component("cleaner", TextCleaner())
pipeline.add_component("embedder", OpenAIDocumentEmbedder())
pipeline.add_component("retriever", InMemoryEmbeddingRetriever(document_store=document_store))
pipeline.add_component("text_embedder", OpenAITextEmbedder())
pipeline.add_component("answer_builder", AnswerBuilder())

# Connect components
pipeline.connect("reader.documents", "cleaner.documents")
pipeline.connect("cleaner.documents", "embedder.documents")
pipeline.connect("embedder.documents", "retriever.documents")
pipeline.connect("retriever.documents", "answer_builder.documents")
pipeline.connect("text_embedder.embedding", "retriever.query_embedding")

# Run pipeline
result = pipeline.run({"text_embedder": {"text": "Qual é o conteúdo?"}})
```

## Comparativo detalhado

### Performance

| Metric | LangChain | LlamaIndex | Haystack |
|---|---|---|---|
| Framework overhead per query | ~10-14ms | ~6ms | ~5.9ms |
| Token usage per request | ~2.4k | ~1.60k | ~1.57k |
| Docker image size delta | +200-400MB | baseline | baseline |
| Latency variance under load | Higher | Moderate | Lowest |
| Indexing throughput | Moderate | Fastest (15-25% faster) | Consistent |

### Código

| Metric | LangChain | LlamaIndex | Haystack |
|---|---|---|---|
| RAG pipeline code (lines) | ~18 | ~10 | ~18 |
| Core dependencies | 9 | 28 | 19 |
| Type safety | Medium | Weak | Strong |
| Pipeline serialization | None (default) | 5 JSON files | Single YAML |

### Recursos

| Feature | LangChain | LlamaIndex | Haystack |
|---|---|---|---|
| Vector store integrations | 50+ | 40+ | 30+ |
| LLM provider support | 60+ | 40+ | 25+ |
| Document loaders | Mais formatos exóticos | 80+ readers | 30+ |
| Built-in reranking | Via integrations | Native support | Native support |
| Hybrid search | Ensemble Retriever | Query Fusion | Pipeline composition |
| Query routing | Supported | Supported | Supported |

### Recuperação

| Feature | LangChain | LlamaIndex | Haystack |
|---|---|---|---|
| Retrieval quality | Good | Best (hierarchical chunking) | Good |
| Chunking strategies | Basic | Advanced (hierarchical, semantic) | Basic |
| Auto-merging | Manual | Native | Manual |
| Sub-question decomposition | Manual (LangGraph) | Native | Manual |

### Orquestração

| Feature | LangChain | LlamaIndex | Haystack |
|---|---|---|---|
| Agent orchestration | Best (LangGraph) | Good (Workflows) | Good (pipelines) |
| Stateful workflows | Best (checkpoints) | Stateless (explicit) | Good |
| Human-in-the-loop | Native middleware | Manual | Manual |
| Multi-step reasoning | Best | Good | Good |

## Recomendações por caso de uso

### RAG simples (document Q&A)
**Recomendado:** LlamaIndex
- Menos código (~10 linhas)
- Melhor qualidade de recuperação
- Hierarchical chunking built-in
- Time-to-first-answer menor

### RAG complexo (multi-step agents)
**Recomendado:** LangChain (+ LangGraph)
- Melhor orquestração de agentes
- Stateful workflows com checkpoints
- Human-in-the-loop nativo
- Maior flexibilidade

### Enterprise/Regulado
**Recomendado:** Haystack
- Type safety forte
- Pipeline explícito e auditável
- EU data residency
- Air-gapped deployment

### Documentos complexos (PDFs, tabelas)
**Recomendado:** LlamaIndex
- LlamaParse para parsing avançado
- Hierarchical chunking preserva estrutura
- Auto-merging retrieval
- Melhor qualidade de recuperação

### Production scalability
**Recomendado:** Haystack
- Latência mais previsível
- Menor overhead
- Technology-agnostic
- Pipeline serializável

## Arquitetura híbrida

**Padrão dominante em 2026:** LlamaIndex para recuperação + LangGraph para orquestração

**Implementação:**
```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from langgraph import StateGraph, END

# LlamaIndex para recuperação
documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)
retriever = index.as_retriever()

# LangGraph para orquestração
def retrieve_node(state):
    query = state["query"]
    context = retriever.retrieve(query)
    return {"context": context}

def generate_node(state):
    # Gerar resposta usando contexto
    pass

# Criar grafo
workflow = StateGraph()
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

workflow.set_entry_point("retrieve")
app = workflow.compile()

# Executar
result = app.invoke({"query": "Qual é o conteúdo?"})
```

## Próximos passos

1. **Escolher framework:** Selecionar baseado em caso de uso
2. **Implementar protótipo:** Criar proof-of-concept
3. **Avaliar performance:** Medir latência, custo, qualidade
4. **Escalar para produção:** Configurar monitoramento e logging
5. **Otimizar:** Ajustar chunking, embeddings, reranking

## Referências

- LangChain: https://docs.langchain.com/
- LlamaIndex: https://docs.llamaindex.ai/
- Haystack: https://haystack.deepset.ai/
