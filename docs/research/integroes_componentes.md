# Integrações entre Componentes - IDEIA_aci

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Documentar integrações entre todos os componentes do IDEIA_aci

## Visão Geral

Este documento descreve como os componentes do IDEIA_aci se integram entre si, fornecendo exemplos de código, padrões de integração e arquitetura de comunicação.

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                            │
│                    (cli_design.md)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Orchestration Layer                         │
│         (orquestracao_agentes_langgraph.md)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Orchestrator                                  │  │
│  │  - Task Analyzer                                     │  │
│  │  - Code Generator                                    │  │
│  │  - Code Reviewer                                     │  │
│  │  - Testing Agent                                     │  │
│  │  - Documentation Agent                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────┬──────────┬──────────┬──────────┬──────────┬───────────┘
     │          │          │          │          │
┌────▼──────┐ ┌─▼────────┐ ┌─▼────────┐ ┌─▼────────┐ ┌─▼─────────┐
│   LLM     │ │ Memory   │ │ Context  │ │   RAG    │ │  Safety   │
│ Provider  │ │ System   │ │ Management│ │  Engine   │ │  System   │
└───────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘
     │          │          │          │          │
┌────▼──────┐ ┌─▼────────┐ ┌─▼────────┐ ┌─▼────────┐ ┌─▼─────────┐
│   Cache   │ │  Redis   │ │  Merkle  │ │  Vector  │ │  Audit    │
│  System   │ │ Storage  │ │   Tree   │ │  Index   │ │   Log     │
└───────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘
```

## Integração 1: Orquestração + LLM Provider

### Descrição
O orquestrador de agentes utiliza o gateway de providers LLM para gerar código, reviews e documentação.

### Exemplo de Integração

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from llm_provider.core.provider_gateway import ProviderGateway

class ProviderAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com gateway de providers."""
    
    def __init__(self, provider_gateway: ProviderGateway):
        super().__init__(llm_client=None)  # LLM client gerenciado pelo gateway
        self.provider_gateway = provider_gateway
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando gateway de providers."""
        task = state["task"]
        complexity = state.get("complexity", 0.5)
        
        # Usar gateway para gerar código
        result = self.provider_gateway.generate(
            prompt=task,
            task_type="code_generation",
            complexity=complexity
        )
        
        return {
            "intermediate_results": {"code": result},
            "steps_completed": ["code_generation"]
        }
    
    def code_review_node(self, state: AgentState) -> Dict[str, Any]:
        """Review código usando gateway de providers."""
        code = state["intermediate_results"].get("code", "")
        
        result = self.provider_gateway.generate(
            prompt=f"Review this code:\n{code}",
            task_type="code_review",
            complexity=0.5
        )
        
        return {
            "intermediate_results": {"review": result},
            "steps_completed": ["code_review"]
        }
```

### Benefícios
- **Routing inteligente:** Seleção automática de provider baseado em complexidade e custo
- **Fallback automático:** Se um provider falha, outro é usado automaticamente
- **Cost optimization:** Balanceamento entre custo e qualidade

## Integração 2: Orquestração + Sistema de Memória

### Descrição
O orquestrador utiliza o sistema de memória para recuperar contexto relevante e armazenar resultados intermediários.

### Exemplo de Integração

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from memory_system.core.hierarchy import MemoryHierarchy
from memory_system.core.memory_types import MemoryType

class MemoryAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com sistema de memória."""
    
    def __init__(self, llm_client, memory_system: MemoryHierarchy):
        super().__init__(llm_client)
        self.memory_system = memory_system
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa usando memória."""
        # Recuperar contexto relevante da memória
        relevant_memories = self.memory_system.retrieve(
            state["task"],
            memory_type=MemoryType.GLOBAL,
            top_k=5
        )
        
        # Adicionar contexto ao estado
        state["context"]["memory"] = [m.content for m in relevant_memories]
        
        # Chamar implementação base
        result = super().task_analyzer_node(state)
        
        # Armazenar tarefa na memória de trabalho
        self.memory_system.add(
            content=state["task"],
            memory_type=MemoryType.WORKING,
            tags=["task", state.get("task_type", "")]
        )
        
        return result
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando memória."""
        # Recuperar exemplos de código similares da memória
        code_memories = self.memory_system.retrieve(
            f"code {state['task']}",
            memory_type=MemoryType.PROJECT,
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

### Benefícios
- **Contexto persistente:** Informações são mantidas entre sessões
- **Aprendizado contínuo:** Exemplos anteriores são reutilizados
- **Hierarquia de memória:** Dados são organizados por relevância temporal

## Integração 3: Orquestração + Context Management

### Descrição
O orquestrador utiliza o gerenciamento de contexto para rastrear mudanças e manter consistência.

### Exemplo de Integração

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
        # Indexar tarefa no contexto
        self.context_indexer.add(
            content=state["task"],
            context_type="task",
            source="orchestrator"
        )
        
        # Recuperar contexto relacionado
        related_context = self.context_indexer.search(state["task"], top_k=5)
        
        # Adicionar contexto ao estado
        state["context"]["related"] = [e.content for e in related_context]
        
        # Chamar implementação base
        return super().task_analyzer_node(state)
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando contexto."""
        # Obter snapshot antes da geração
        snapshot_before = self.context_indexer.get_snapshot()
        
        # Chamar implementação base
        result = super().code_generation_node(state)
        
        # Obter snapshot após a geração
        snapshot_after = self.context_indexer.get_snapshot()
        
        # Detectar mudanças
        diff = self.context_indexer.get_diff(snapshot_before)
        
        # Logar mudanças
        state["context"]["changes"] = diff
        
        return result
```

### Benefícios
- **Rastreamento de mudanças:** Detecta quando contexto muda
- **Busca semântica:** Encontra contexto relacionado automaticamente
- **Real-time awareness:** Entradas hot são priorizadas

## Integração 4: Orquestração + RAG

### Descrição
O orquestrador utiliza RAG para recuperar documentação relevante antes de gerar código.

### Exemplo de Integração

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
        
        # Adicionar documentos ao prompt
        context = "\n".join([
            f"Document: {doc.content}"
            for doc_id, score in rag_docs
            if (doc := self.rag_retriever.documents.get(doc_id))
        ])
        
        state["context"]["rag_docs"] = context
        
        # Chamar implementação base
        result = super().code_generation_node(state)
        
        return result
    
    def documentation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera documentação usando RAG."""
        code = state["intermediate_results"].get("code", "")
        
        # Recuperar documentação similar
        rag_docs = self.rag_retriever.retrieve(
            f"documentation for {state['task']}",
            top_k=3
        )
        
        # Adicionar exemplos ao prompt
        context = "\n".join([
            f"Example: {doc.content}"
            for doc_id, score in rag_docs
            if (doc := self.rag_retriever.documents.get(doc_id))
        ])
        
        state["context"]["doc_examples"] = context
        
        # Chamar implementação base
        return super().documentation_node(state)
```

### Benefícios
- **Documentação contextual:** Usa docs relevantes para gerar código
- **Busca híbrida:** Combina lexical e semântico
- **Chunking inteligente:** Divide documentos em partes gerenciáveis

## Integração 5: Orquestração + AI Safety

### Descrição
O orquestrador utiliza AI Safety para validar tarefas e resultados antes de processar.

### Exemplo de Integração

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from ai_safety.enforcement.policy_enforcer import PolicyEnforcer

class SafeOrchestrator(AgentOrchestrator):
    """Orquestrador com segurança."""
    
    def __init__(self, llm_client, safety_enforcer: PolicyEnforcer):
        super().__init__(llm_client)
        self.safety_enforcer = safety_enforcer
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa com verificação de segurança."""
        task = state["task"]
        
        # Verificar segurança da tarefa
        safety_result = self.safety_enforcer.enforce(
            task,
            context={"node": "task_analyzer"}
        )
        
        if not safety_result["allowed"]:
            return {
                "errors": [f"Task blocked by safety policy: {safety_result['message']}"],
                "current_step": "error"
            }
        
        # Continuar com análise normal
        return super().task_analyzer_node(state)
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código com verificação de segurança."""
        # Chamar implementação base
        result = super().code_generation_node(state)
        
        # Verificar segurança do resultado
        if "code" in result.get("intermediate_results", {}):
            code = result["intermediate_results"]["code"]
            safety_result = self.safety_enforcer.enforce(
                code,
                context={"node": "code_generation"}
            )
            
            if not safety_result["allowed"]:
                return {
                    "errors": [f"Generated code blocked by safety policy: {safety_result['message']}"],
                    "current_step": "error"
                }
        
        return result
```

### Benefícios
- **Validação de entrada:** Tarefas maliciosas são bloqueadas
- **Validação de saída:** Código gerado é verificado
- **Auditoria completa:** Todas as violações são logadas

## Integração 6: Orquestração + Observabilidade

### Descrição
O orquestrador utiliza observabilidade para rastrear execução e coletar métricas.

### Exemplo de Integração

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from observability.tracing.agent_tracer import AgentTracer
from observability.tracing.llm_tracer import LLMTracer
from observability.metrics.llm_metrics import LLMMetrics

class ObservableOrchestrator(AgentOrchestrator):
    """Orquestrador com observabilidade."""
    
    def __init__(self, llm_client, agent_tracer: AgentTracer, llm_tracer: LLMTracer, llm_metrics: LLMMetrics):
        super().__init__(llm_client)
        self.agent_tracer = agent_tracer
        self.llm_tracer = llm_tracer
        self.llm_metrics = llm_metrics
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa com tracing."""
        import time
        start_time = time.time()
        
        try:
            result = super().task_analyzer_node(state)
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_execution(
                agent_name="task_analyzer",
                task=state["task"],
                result="Task analyzed successfully",
                latency_ms=latency_ms
            )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_execution(
                agent_name="task_analyzer",
                task=state["task"],
                error=e,
                latency_ms=latency_ms
            )
            
            raise
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código com tracing de LLM."""
        import time
        start_time = time.time()
        
        try:
            result = super().code_generation_node(state)
            latency_ms = (time.time() - start_time) * 1000
            
            # Traçar chamada LLM
            if "code" in result.get("intermediate_results", {}):
                code = result["intermediate_results"]["code"]
                self.llm_tracer.trace_llm_call(
                    provider="orchestrator",
                    model="routed",
                    prompt=state["task"],
                    response=code,
                    tokens_used=len(code) // 4,
                    latency_ms=latency_ms
                )
                
                self.llm_metrics.record_llm_call(
                    provider="orchestrator",
                    model="routed",
                    tokens=len(code) // 4,
                    latency_ms=latency_ms,
                    cost=0.0
                )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.llm_tracer.trace_llm_call(
                provider="orchestrator",
                model="routed",
                prompt=state["task"],
                error=e,
                latency_ms=latency_ms
            )
            
            raise
```

### Benefícios
- **Distributed tracing:** Rastreia execução através de componentes
- **Métricas detalhadas:** Coleta latência, tokens, custo
- **Debugging facilitado:** Problemas são facilmente identificados

## Integração 7: LLM Provider + Cache

### Descrição
O gateway de providers utiliza cache para evitar chamadas duplicadas.

### Exemplo de Integração

```python
from llm_provider.core.provider_gateway import ProviderGateway
from cache_system.multi_level.multi_level_cache import MultiLevelCache
import hashlib

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

### Benefícios
- **Redução de custo:** Chamadas duplicadas são evitadas
- **Melhor performance:** Respostas cacheadas são instantâneas
- **Cache semântico:** Queries similares retornam resultados cacheados

## Integração 8: RAG + Sistema de Memória

### Descrição
O RAG utiliza o sistema de memória para armazenar e recuperar documentos.

### Exemplo de Integração

```python
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from memory_system.core.hierarchy import MemoryHierarchy
from memory_system.core.memory_types import MemoryType

class RAGEnhancedMemory(MemoryHierarchy):
    """Sistema de memória com RAG."""
    
    def __init__(self, rag_retriever: HybridRetriever):
        super().__init__()
        self.rag_retriever = rag_retriever
    
    def retrieve(self, query: str, memory_type: Optional[MemoryType] = None, top_k: int = 5, **kwargs) -> List[MemoryEntry]:
        """Recupera memórias usando RAG."""
        # Buscar RAG
        rag_docs = self.rag_retriever.retrieve(query, top_k=top_k)
        
        # Converter para MemoryEntry
        results = []
        for doc_id, score in rag_docs:
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
    
    def add(self, content: str, memory_type: MemoryType, **kwargs) -> MemoryEntry:
        """Adiciona entrada e indexa no RAG."""
        entry = super().add(content, memory_type, **kwargs)
        
        # Indexar no RAG
        from rag_engine.core.document import Document
        from rag_engine.core.document_types import DocumentType
        
        rag_doc = Document(
            doc_id=entry.entry_id,
            content=content,
            doc_type=DocumentType.TEXT.value,
            source="memory"
        )
        
        self.rag_retriever.add_document(rag_doc)
        
        return entry
```

### Benefícios
- **Busca semântica:** Memórias são encontradas por significado
- **Recuperação híbrida:** Combina lexical e semântico
- **Consolidação:** Memórias e documentos são unificados

## Integração 9: Context Management + Sistema de Memória

### Descrição
O gerenciamento de contexto utiliza o sistema de memória para persistir contexto.

### Exemplo de Integração

```python
from context_management.indexing.hybrid_indexer import HybridIndexer
from memory_system.core.hierarchy import MemoryHierarchy
from memory_system.core.memory_types import MemoryType

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
        # Buscar no contexto
        context_results = self.context_indexer.search(query, top_k=top_k)
        
        # Recuperar memórias correspondentes
        results = []
        for entry_id, score in context_results:
            entry = self.get(entry_id)
            if entry:
                results.append(entry)
        
        return results
```

### Benefícios
- **Rastreamento de mudanças:** Detecta quando memória muda
- **Busca avançada:** Combina Merkle tree e semântica
- **Real-time awareness:** Entradas hot são priorizadas

## Integração 10: AI Safety + Observabilidade

### Descrição
O sistema de segurança utiliza observabilidade para rastrear violações.

### Exemplo de Integração

```python
from ai_safety.enforcement.policy_enforcer import PolicyEnforcer
from observability.tracing.agent_tracer import AgentTracer
from observability.metrics.llm_metrics import LLMMetrics

class ObservableSafetyEnforcer(PolicyEnforcer):
    """Enforcer com observabilidade."""
    
    def __init__(self, config, agent_tracer: AgentTracer):
        super().__init__(config)
        self.agent_tracer = agent_tracer
    
    def enforce(self, text: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Enforça políticas com tracing."""
        import time
        start_time = time.time()
        
        try:
            result = super().enforce(text, context)
            latency_ms = (time.time() - start_time) * 1000
            
            # Traçar execução
            self.agent_tracer.trace_agent_step(
                agent_name="safety_enforcer",
                step_name="enforce",
                input_data={"text": text[:100]},
                output_data={"allowed": result["allowed"], "action": result["action"]},
                latency_ms=latency_ms
            )
            
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_step(
                agent_name="safety_enforcer",
                step_name="enforce",
                error=e,
                latency_ms=latency_ms
            )
            
            raise
```

### Benefícios
- **Auditoria completa:** Todas as verificações são rastreadas
- **Métricas de segurança:** Taxa de violações é monitorada
- **Alertas em tempo real:** Violações críticas são notificadas

## Padrões de Integração

### Padrão 1: Wrapper Pattern
Envolver componentes existentes com funcionalidade adicional.

```python
class EnhancedComponent(BaseComponent):
    def __init__(self, base_component, additional_feature):
        self.base_component = base_component
        self.additional_feature = additional_feature
    
    def method(self, *args, **kwargs):
        # Adicionar funcionalidade
        result = self.additional_feature.before(*args, **kwargs)
        
        # Chamar componente base
        base_result = self.base_component.method(*args, **kwargs)
        
        # Adicionar pós-processamento
        return self.additional_feature.after(base_result)
```

### Padrão 2: Middleware Pattern
Processar requisições/respostas através de camadas.

```python
class Middleware:
    def __init__(self, next_handler):
        self.next_handler = next_handler
    
    def handle(self, request):
        # Pré-processamento
        processed = self.preprocess(request)
        
        # Passar para próximo handler
        response = self.next_handler.handle(processed)
        
        # Pós-processamento
        return self.postprocess(response)

# Uso
pipeline = SafetyMiddleware(
    CacheMiddleware(
        ObservabilityMiddleware(
            BaseHandler()
        )
    )
)
```

### Padrão 3: Observer Pattern
Notificar componentes sobre eventos.

```python
class EventPublisher:
    def __init__(self):
        self.subscribers = []
    
    def subscribe(self, subscriber):
        self.subscribers.append(subscriber)
    
    def publish(self, event):
        for subscriber in self.subscribers:
            subscriber.handle(event)

# Uso
publisher = EventPublisher()
publisher.subscribe(ObservabilityHandler())
publisher.subscribe(SafetyHandler())
publisher.publish({"type": "llm_call", "data": {...}})
```

## Exemplo de Integração Completa

```python
"""
Exemplo de integração completa de todos os componentes.
"""
from agent_orchestrator.core.graph import AgentOrchestrator
from llm_provider.core.provider_gateway import ProviderGateway
from memory_system.core.hierarchy import MemoryHierarchy
from context_management.indexing.hybrid_indexer import HybridIndexer
from rag_engine.retrieval.hybrid_retriever import HybridRetriever
from ai_safety.enforcement.policy_enforcer import PolicyEnforcer
from observability.tracing.agent_tracer import AgentTracer
from observability.tracing.llm_tracer import LLMTracer
from observability.metrics.llm_metrics import LLMMetrics
from cache_system.multi_level.multi_level_cache import MultiLevelCache

# Inicializar componentes
provider_gateway = ProviderGateway()
memory_system = MemoryHierarchy()
context_indexer = HybridIndexer()
rag_retriever = HybridRetriever()
safety_enforcer = PolicyEnforcer()
cache = MultiLevelCache()

# Inicializar observabilidade
from observability.core.tracer import BaseTracer, TracerConfig
base_tracer = BaseTracer(TracerConfig(enable_console=True))
agent_tracer = AgentTracer(base_tracer)
llm_tracer = LLMTracer(base_tracer)
llm_metrics = LLMMetrics()

# Criar orquestrador completo
class CompleteOrchestrator(AgentOrchestrator):
    """Orquestrador com todas as integrações."""
    
    def __init__(
        self,
        provider_gateway: ProviderGateway,
        memory_system: MemoryHierarchy,
        context_indexer: HybridIndexer,
        rag_retriever: HybridRetriever,
        safety_enforcer: PolicyEnforcer,
        agent_tracer: AgentTracer,
        llm_tracer: LLMTracer,
        llm_metrics: LLMMetrics,
        cache: MultiLevelCache
    ):
        super().__init__(llm_client=None)
        self.provider_gateway = provider_gateway
        self.memory_system = memory_system
        self.context_indexer = context_indexer
        self.rag_retriever = rag_retriever
        self.safety_enforcer = safety_enforcer
        self.agent_tracer = agent_tracer
        self.llm_tracer = llm_tracer
        self.llm_metrics = llm_metrics
        self.cache = cache
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa com todas as integrações."""
        import time
        start_time = time.time()
        
        try:
            # 1. Verificar segurança
            safety_result = self.safety_enforcer.enforce(
                state["task"],
                context={"node": "task_analyzer"}
            )
            
            if not safety_result["allowed"]:
                return {
                    "errors": [f"Task blocked: {safety_result['message']}"],
                    "current_step": "error"
                }
            
            # 2. Recuperar contexto
            self.context_indexer.add(state["task"], "task", source="orchestrator")
            related_context = self.context_indexer.search(state["task"], top_k=5)
            state["context"]["related"] = [e.content for e in related_context]
            
            # 3. Recuperar memória
            relevant_memories = self.memory_system.retrieve(state["task"], top_k=5)
            state["context"]["memory"] = [m.content for m in relevant_memories]
            
            # 4. Recuperar RAG
            rag_docs = self.rag_retriever.retrieve(state["task"], top_k=3)
            state["context"]["rag"] = [d.content for d in rag_docs]
            
            # 5. Gerar usando provider
            result = self.provider_gateway.generate(
                state["task"],
                task_type="code_generation",
                complexity=state.get("complexity", 0.5)
            )
            
            # 6. Cache resultado
            self.cache.set(state["task"], result, query=state["task"])
            
            # 7. Salvar na memória
            self.memory_system.add(
                result,
                MemoryType.PROJECT,
                tags=["generated", state["task_type"]]
            )
            
            # 8. Traçar execução
            latency_ms = (time.time() - start_time) * 1000
            self.agent_tracer.trace_agent_execution(
                agent_name="complete_orchestrator",
                task=state["task"],
                result="Task completed successfully",
                latency_ms=latency_ms
            )
            
            return {
                "intermediate_results": {"result": result},
                "steps_completed": ["task_analysis"]
            }
            
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            self.agent_tracer.trace_agent_execution(
                agent_name="complete_orchestrator",
                task=state["task"],
                error=e,
                latency_ms=latency_ms
            )
            
            raise

# Usar orquestrador completo
orchestrator = CompleteOrchestrator(
    provider_gateway=provider_gateway,
    memory_system=memory_system,
    context_indexer=context_indexer,
    rag_retriever=rag_retriever,
    safety_enforcer=safety_enforcer,
    agent_tracer=agent_tracer,
    llm_tracer=llm_tracer,
    llm_metrics=llm_metrics,
    cache=cache
)

# Executar tarefa
result = orchestrator.invoke("Create a REST API endpoint for user authentication")
print(f"Result: {result}")
```

## Próximos Passos

1. Implementar testes de integração
2. Adicionar documentação de API
3. Criar diagramas de sequência
4. Implementar sistema de configuração unificado
5. Adicionar suporte a plugins
6. Implementar sistema de deployment
7. Criar guias de troubleshooting
8. Adicionar exemplos de uso avançados
