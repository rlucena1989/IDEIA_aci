# Orquestração de Agentes com LangGraph

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar orquestração de agentes com LangGraph baseado em gaps competitivos

## Visão Geral

LangGraph é um framework de orquestração de agentes da LangChain que permite criar workflows complexos com state management, checkpointing, e streaming. Este documento foca em gaps identificados na comparação com Devin, Cursor e Windsurf.

## Arquitetura do LangGraph

### Componentes Principais

```
StateGraph
    ↓ define
Nodes (Agent Functions)
    ↓ connect
Edges (Conditional/Static)
    ↓ manage
State (TypedDict)
    ↓ persist
Checkpointer
    ↓ stream
Streaming
```

### Dependências

```python
pip install langgraph
```

### StateGraph Básico

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from operator import add
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== STUB IMPLEMENTATIONS =====
# Estas são implementações mínimas para demonstração.
# Em produção, substituir com implementações reais usando LLMs.

def process_step1(task: str) -> str:
    """Processa primeiro passo do workflow (STUB)"""
    # Em produção, chamar LLM para processar
    return f"Step 1 result for: {task}"

def process_step2(input_data: str) -> str:
    """Processa segundo passo do workflow (STUB)"""
    # Em produção, chamar LLM para processar
    return f"Step 2 result from: {input_data}"

def process_step3(input_data: str) -> str:
    """Processa terceiro passo do workflow (STUB)"""
    # Em produção, chamar LLM para processar
    return f"Step 3 final result from: {input_data}"
# ===== END STUB IMPLEMENTATIONS =====

class AgentState(TypedDict):
    task: str
    steps: Annotated[list[str], add]
    current_step: str
    result: str
    errors: list[str]

def step1_node(state: AgentState):
    """Primeiro passo do workflow"""
    task = state["task"]
    logger.info(f"Step 1 processing: {task}")
    
    try:
        result = process_step1(task)
        logger.info("Step 1 completed")
        return {
            "steps": ["step1"],
            "current_step": "step2",
            "result": result
        }
    except Exception as e:
        logger.error(f"Step 1 error: {e}")
        return {"errors": [f"Step 1 failed: {str(e)}"]}

def step2_node(state: AgentState):
    """Segundo passo do workflow"""
    current_step = state["current_step"]
    logger.info(f"Step 2 processing from {current_step}")
    
    try:
        result = process_step2(state["result"])
        logger.info("Step 2 completed")
        return {
            "steps": ["step2"],
            "current_step": "step3",
            "result": result
        }
    except Exception as e:
        logger.error(f"Step 2 error: {e}")
        return {"errors": [f"Step 2 failed: {str(e)}"]}

def step3_node(state: AgentState):
    """Terceiro passo do workflow"""
    current_step = state["current_step"]
    logger.info(f"Step 3 processing from {current_step}")
    
    try:
        result = process_step3(state["result"])
        logger.info("Step 3 completed")
        return {
            "steps": ["step3"],
            "current_step": "complete",
            "result": result
        }
    except Exception as e:
        logger.error(f"Step 3 error: {e}")
        return {"errors": [f"Step 3 failed: {str(e)}"]}

def should_continue(state: AgentState):
    """Decide se deve continuar para o próximo passo"""
    if state["errors"]:
        return END  # Para em caso de erro
    
    current_step = state["current_step"]
    
    if current_step == "step2":
        return "step3"
    elif current_step == "step3":
        return END
    else:
        return "step2"

# Criar workflow
workflow = StateGraph(AgentState)
workflow.add_node("step1", step1_node)
workflow.add_node("step2", step2_node)
workflow.add_node("step3", step3_node)

workflow.add_conditional_edges(
    "step1",
    should_continue,
    {"step2": "step2", END: END}
)
workflow.add_conditional_edges(
    "step2",
    should_continue,
    {"step3": "step3", END: END}
)
workflow.add_edge("step3", END)

workflow.set_entry_point("step1")
app = workflow.compile()

# Executar
result = app.invoke({
    "task": "Analyze codebase",
    "steps": [],
    "current_step": "",
    "result": "",
    "errors": []
})
```

## Gap 1: Checkpointing Avançado

### Conceito

Devin usa checkpointing para persistir estado. LangGraph tem checkpointing nativo, mas pode ser expandido com features avançadas como time travel, branching e merge.

### Implementação com Checkpointer

```python
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, END
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Checkpointer SQLite (persistente)
checkpointer = SqliteSaver.from_conn_string(":memory:")

# Checkpointer em memória (não persistente)
# checkpointer = MemorySaver()

class CheckpointState(TypedDict):
    task: str
    step: int
    data: dict
    checkpoint_id: str

def step1_node(state: CheckpointState):
    logger.info(f"Step 1 (checkpoint: {state['checkpoint_id']})")
    return {"step": 1, "data": {"step1": "completed"}}

def step2_node(state: CheckpointState):
    logger.info(f"Step 2 (checkpoint: {state['checkpoint_id']})")
    return {"step": 2, "data": {"step2": "completed"}}

def step3_node(state: CheckpointState):
    logger.info(f"Step 3 (checkpoint: {state['checkpoint_id']})")
    return {"step": 3, "data": {"step3": "completed"}}

# Criar workflow com checkpointer
workflow = StateGraph(CheckpointState)
workflow.add_node("step1", step1_node)
workflow.add_node("step2", step2_node)
workflow.add_node("step3", step3_node)

workflow.add_edge("step1", "step2")
workflow.add_edge("step2", "step3")
workflow.add_edge("step3", END)

workflow.set_entry_point("step1")
app = workflow.compile(checkpointer=checkpointer)

# Executar com thread_id para checkpointing
config = {"configurable": {"thread_id": "session_123"}}
result = app.invoke({
    "task": "Process data",
    "step": 0,
    "data": {},
    "checkpoint_id": ""
}, config)

# Listar checkpoints
checkpoints = list(checkpointer.list(config))
logger.info(f"Checkpoints: {len(checkpoints)}")

# Retomar de checkpoint específico
state = checkpointer.get(config, checkpoints[-1].config["checkpoint_id"])
logger.info(f"Resumed from checkpoint: {state}")
```

### Time Travel

```python
def get_checkpoint_history(thread_id: str, checkpointer):
    """Retorna histórico de checkpoints"""
    config = {"configurable": {"thread_id": thread_id}}
    checkpoints = list(checkpointer.list(config))
    
    history = []
    for checkpoint in checkpoints:
        state = checkpointer.get(config, checkpoint.config["checkpoint_id"])
        history.append({
            "checkpoint_id": checkpoint.config["checkpoint_id"],
            "step": state.values.get("step"),
            "data": state.values.get("data"),
            "timestamp": checkpoint.ts
        })
    
    return history

def resume_from_checkpoint(thread_id: str, checkpoint_id: str, checkpointer, app):
    """Retoma execução de checkpoint específico"""
    config = {"configurable": {"thread_id": thread_id}}
    
    # Carregar estado do checkpoint
    state = checkpointer.get(config, checkpoint_id)
    
    # Continuar execução
    result = app.invoke(state.values, config)
    
    return result

# Uso
history = get_checkpoint_history("session_123", checkpointer)
for entry in history:
    logger.info(f"Checkpoint {entry['checkpoint_id']}: step {entry['step']}")

# Retomar de checkpoint específico
result = resume_from_checkpoint("session_123", history[1]["checkpoint_id"], checkpointer, app)
```

### Branching e Merge

```python
from langgraph.graph import StateGraph, END
from typing import Literal

class BranchState(TypedDict):
    task: str
    branch: Literal["a", "b", "c"]
    results: dict
    merged_result: str

def branch_a_node(state: BranchState):
    logger.info("Branch A executing")
    return {"results": {"a": "completed"}}

def branch_b_node(state: BranchState):
    logger.info("Branch B executing")
    return {"results": {"b": "completed"}}

def branch_c_node(state: BranchState):
    logger.info("Branch C executing")
    return {"results": {"c": "completed"}}

def merge_node(state: BranchState):
    logger.info("Merging results")
    results = state["results"]
    merged = f"Merged: {', '.join(results.values())}"
    return {"merged_result": merged}

def route_branch(state: BranchState):
    """Roteia para branch apropriado"""
    branch = state["branch"]
    if branch == "a":
        return "branch_a"
    elif branch == "b":
        return "branch_b"
    else:
        return "branch_c"

# Criar workflow com branching
workflow = StateGraph(BranchState)
workflow.add_node("branch_a", branch_a_node)
workflow.add_node("branch_b", branch_b_node)
workflow.add_node("branch_c", branch_c_node)
workflow.add_node("merge", merge_node)

workflow.add_conditional_edges(
    "start",
    route_branch,
    {"branch_a": "branch_a", "branch_b": "branch_b", "branch_c": "branch_c"}
)
workflow.add_edge("branch_a", "merge")
workflow.add_edge("branch_b", "merge")
workflow.add_edge("branch_c", "merge")
workflow.add_edge("merge", END)

workflow.set_entry_point("start")
app = workflow.compile()

# Executar branch A
result = app.invoke({
    "task": "Process",
    "branch": "a",
    "results": {},
    "merged_result": ""
})
```

## Gap 2: Sub-Graphs

### Conceito

LangGraph suporta sub-graphs para modularidade e reuso. Diferente de workflows monolíticos, sub-graphs permitem composição de workflows complexos.

### Implementação de Sub-Graphs

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

# Sub-graph para processamento de código
class CodeProcessingState(TypedDict):
    code: str
    analyzed: bool
    tested: bool
    documented: bool

def analyze_node(state: CodeProcessingState):
    logger.info("Analyzing code")
    return {"analyzed": True}

def test_node(state: CodeProcessingState):
    logger.info("Testing code")
    return {"tested": True}

def document_node(state: CodeProcessingState):
    logger.info("Documenting code")
    return {"documented": True}

# Criar sub-graph
subgraph = StateGraph(CodeProcessingState)
subgraph.add_node("analyze", analyze_node)
subgraph.add_node("test", test_node)
subgraph.add_node("document", document_node)

subgraph.add_edge("analyze", "test")
subgraph.add_edge("test", "document")
subgraph.add_edge("document", END)

subgraph.set_entry_point("analyze")
code_processing_app = subgraph.compile()

# Workflow principal que usa sub-graph
class MainState(TypedDict):
    task: str
    code: str
    subgraph_result: dict
    final_result: str

def main_node(state: MainState):
    logger.info("Main node preparing code")
    return {"code": "function example() { return 1; }"}

def subgraph_wrapper(state: MainState):
    """Wrapper para executar sub-graph"""
    logger.info("Executing code processing sub-graph")
    
    # Executar sub-graph
    subgraph_result = code_processing_app.invoke({
        "code": state["code"],
        "analyzed": False,
        "tested": False,
        "documented": False
    })
    
    return {"subgraph_result": subgraph_result}

def finalize_node(state: MainState):
    logger.info("Finalizing result")
    return {"final_result": "Code processed successfully"}

# Criar workflow principal com sub-graph
main_workflow = StateGraph(MainState)
main_workflow.add_node("main", main_node)
main_workflow.add_node("subgraph", subgraph_wrapper)
main_workflow.add_node("finalize", finalize_node)

main_workflow.add_edge("main", "subgraph")
main_workflow.add_edge("subgraph", "finalize")
main_workflow.add_edge("finalize", END)

main_workflow.set_entry_point("main")
main_app = main_workflow.compile()

# Executar
result = main_app.invoke({
    "task": "Process code",
    "code": "",
    "subgraph_result": {},
    "final_result": ""
})
```

## Gap 3: Paralelismo

### Conceito

LangGraph suporta execução paralela de nós para performance. Diferente de execução sequencial, paralelismo reduz latência significativamente.

### Implementação com Paralelismo

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from operator import add
import asyncio

class ParallelState(TypedDict):
    task: str
    results: Annotated[dict[str, str], add]
    errors: list[str]

async def task_a_node(state: ParallelState):
    logger.info("Task A starting")
    await asyncio.sleep(2)  # Simula trabalho
    logger.info("Task A completed")
    return {"results": {"task_a": "completed"}}

async def task_b_node(state: ParallelState):
    logger.info("Task B starting")
    await asyncio.sleep(1.5)  # Simula trabalho
    logger.info("Task B completed")
    return {"results": {"task_b": "completed"}}

async def task_c_node(state: ParallelState):
    logger.info("Task C starting")
    await asyncio.sleep(1)  # Simula trabalho
    logger.info("Task C completed")
    return {"results": {"task_c": "completed"}}

def aggregator_node(state: ParallelState):
    logger.info("Aggregating parallel results")
    results = state["results"]
    logger.info(f"Aggregated: {results}")
    return {}

# Criar workflow com paralelismo
workflow = StateGraph(ParallelState)
workflow.add_node("task_a", task_a_node)
workflow.add_node("task_b", task_b_node)
workflow.add_node("task_c", task_c_node)
workflow.add_node("aggregator", aggregator_node)

# Executar tarefas em paralelo usando send
workflow.set_entry_point("task_a")
workflow.add_edge("task_a", "task_b")
workflow.add_edge("task_b", "task_c")
workflow.add_edge("task_c", "aggregator")
workflow.add_edge("aggregator", END)

app = workflow.compile()

# Execução paralela manual
async def execute_parallel():
    state = {
        "task": "Parallel processing",
        "results": {},
        "errors": []
    }
    
    # Executar tarefas em paralelo
    results = await asyncio.gather(
        task_a_node(state),
        task_b_node(state),
        task_c_node(state)
    )
    
    # Agregar resultados
    for result in results:
        state["results"].update(result["results"])
    
    # Executar aggregator
    aggregator_node(state)
    
    return state

# Executar
result = asyncio.run(execute_parallel())
```

### Paralelismo com LangGraph Native

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from operator import add

class NativeParallelState(TypedDict):
    task: str
    results: Annotated[dict[str, str], add]
    status: str

def task_a_node(state: NativeParallelState):
    logger.info("Task A")
    return {"results": {"task_a": "done"}}

def task_b_node(state: NativeParallelState):
    logger.info("Task B")
    return {"results": {"task_b": "done"}}

def task_c_node(state: NativeParallelState):
    logger.info("Task C")
    return {"results": {"task_c": "done"}}

def aggregator_node(state: NativeParallelState):
    logger.info("Aggregator")
    return {"status": "completed"}

# Criar workflow com paralelismo nativo
workflow = StateGraph(NativeParallelState)
workflow.add_node("task_a", task_a_node)
workflow.add_node("task_b", task_b_node)
workflow.add_node("task_c", task_c_node)
workflow.add_node("aggregator", aggregator_node)

# Usar add_node com paralelismo
workflow.set_entry_point("task_a")
workflow.add_edge("task_a", "task_b")
workflow.add_edge("task_a", "task_c")  # Executa B e C em paralelo após A
workflow.add_edge("task_b", "aggregator")
workflow.add_edge("task_c", "aggregator")
workflow.add_edge("aggregator", END)

app = workflow.compile()

# Executar
result = app.invoke({
    "task": "Parallel",
    "results": {},
    "status": ""
})
```

## Gap 4: Error Handling Avançado

### Conceito

Devin usa error handling com retries e fallback. LangGraph pode ser expandido com error handling avançado incluindo circuit breakers, exponential backoff, e error recovery.

### Implementação com Retry e Exponential Backoff

```python
import time
from typing import Optional

class RetryState(TypedDict):
    task: str
    attempt: int
    max_attempts: int
    result: str
    error: Optional[str]

def retry_node(state: RetryState):
    attempt = state["attempt"]
    max_attempts = state["max_attempts"]
    task = state["task"]
    
    logger.info(f"Attempt {attempt + 1}/{max_attempts} for task: {task}")
    
    try:
        result = execute_with_retry(task)
        logger.info(f"Success on attempt {attempt + 1}")
        return {"result": result, "error": None}
    except Exception as e:
        logger.error(f"Attempt {attempt + 1} failed: {e}")
        
        if attempt < max_attempts - 1:
            # Exponential backoff
            backoff_time = 2 ** attempt
            logger.info(f"Waiting {backoff_time}s before retry")
            time.sleep(backoff_time)
            
            return {
                "attempt": attempt + 1,
                "error": str(e)
            }
        else:
            return {
                "error": f"Max attempts ({max_attempts}) exceeded: {str(e)}"
            }

def should_retry(state: RetryState):
    """Decide se deve retry ou terminar"""
    if state["error"] is None:
        return END  # Sucesso, terminar
    
    if state["attempt"] < state["max_attempts"]:
        return "retry"  # Retry
    else:
        return END  # Max attempts, terminar

# Criar workflow com retry
workflow = StateGraph(RetryState)
workflow.add_node("retry", retry_node)

workflow.add_conditional_edges(
    "retry",
    should_retry,
    {"retry": "retry", END: END}
)

workflow.set_entry_point("retry")
app = workflow.compile()

# Executar
result = app.invoke({
    "task": "Execute task",
    "attempt": 0,
    "max_attempts": 3,
    "result": "",
    "error": None
})
```

### Circuit Breaker

```python
from typing import Literal

class CircuitBreakerState(TypedDict):
    task: str
    circuit_state: Literal["closed", "open", "half-open"]
    failure_count: int
    threshold: int
    result: str
    error: Optional[str]

def circuit_breaker_node(state: CircuitBreakerState):
    circuit_state = state["circuit_state"]
    failure_count = state["failure_count"]
    threshold = state["threshold"]
    
    logger.info(f"Circuit state: {circuit_state}, Failures: {failure_count}/{threshold}")
    
    if circuit_state == "open":
        logger.warning("Circuit is open, blocking request")
        return {"error": "Circuit breaker is open"}
    
    try:
        result = execute_with_circuit_breaker(state["task"])
        logger.info("Success, resetting circuit")
        return {
            "circuit_state": "closed",
            "failure_count": 0,
            "result": result,
            "error": None
        }
    except Exception as e:
        logger.error(f"Failure: {e}")
        new_failure_count = failure_count + 1
        
        if new_failure_count >= threshold:
            logger.warning("Threshold reached, opening circuit")
            return {
                "circuit_state": "open",
                "failure_count": new_failure_count,
                "error": str(e)
            }
        else:
            return {
                "failure_count": new_failure_count,
                "error": str(e)
            }

def reset_circuit(state: CircuitBreakerState):
    """Reseta circuit para half-open após timeout"""
    logger.info("Resetting circuit to half-open")
    return {"circuit_state": "half-open", "failure_count": 0}

# Criar workflow com circuit breaker
workflow = StateGraph(CircuitBreakerState)
workflow.add_node("circuit_breaker", circuit_breaker_node)
workflow.add_node("reset", reset_circuit)

workflow.add_conditional_edges(
    "circuit_breaker",
    lambda s: "reset" if s["circuit_state"] == "open" else END,
    {"reset": "reset", END: END}
)
workflow.add_edge("reset", END)

workflow.set_entry_point("circuit_breaker")
app = workflow.compile()

# Executar
result = app.invoke({
    "task": "Execute task",
    "circuit_state": "closed",
    "failure_count": 0,
    "threshold": 3,
    "result": "",
    "error": None
})
```

## Gap 5: Streaming de Respostas

### Conceito

LangGraph suporta streaming de respostas para tempo real. Diferente de respostas batch, streaming permite feedback imediato ao usuário.

### Implementação com Streaming

```python
from langgraph.graph import StateGraph, END

class StreamingState(TypedDict):
    task: str
    chunks: list[str]
    complete: bool

def streaming_node(state: StreamingState):
    task = state["task"]
    logger.info(f"Streaming response for: {task}")
    
    # Simular streaming de chunks
    chunks = generate_streaming_chunks(task)
    
    for chunk in chunks:
        logger.info(f"Streaming chunk: {chunk}")
        yield {"chunks": [chunk]}
    
    return {"complete": True}

# Criar workflow com streaming
workflow = StateGraph(StreamingState)
workflow.add_node("streaming", streaming_node)
workflow.add_edge("streaming", END)

workflow.set_entry_point("streaming")
app = workflow.compile()

# Executar com streaming
config = {"configurable": {"thread_id": "stream_session"}}
async for event in app.astream(
    {"task": "Generate response", "chunks": [], "complete": False},
    config
):
    if "chunks" in event:
        print(f"Chunk: {event['chunks']}")
```

### Streaming com Async

```python
async def async_streaming_node(state: StreamingState):
    task = state["task"]
    logger.info(f"Async streaming for: {task}")
    
    # Simular streaming assíncrono
    async for chunk in async_generate_chunks(task):
        logger.info(f"Async chunk: {chunk}")
        yield {"chunks": [chunk]}
    
    return {"complete": True}

# Criar workflow com async streaming
workflow = StateGraph(StreamingState)
workflow.add_node("async_streaming", async_streaming_node)
workflow.add_edge("async_streaming", END)

workflow.set_entry_point("async_streaming")
app = workflow.compile()

# Executar com async streaming
async def execute_async_streaming():
    config = {"configurable": {"thread_id": "async_stream_session"}}
    async for event in app.astream(
        {"task": "Generate async response", "chunks": [], "complete": False},
        config
    ):
        if "chunks" in event:
            print(f"Async chunk: {event['chunks']}")

asyncio.run(execute_async_streaming())
```

## Recomendações de Implementação

### Para MVP
1. **Checkpointing básico:** Implementar com SQLite checkpointer
2. **Sub-graphs simples:** Criar 2-3 sub-graphs modulares
3. **Paralelismo básico:** Implementar paralelismo com asyncio.gather
4. **Error handling:** Implementar retry com exponential backoff

### Para Produção
1. **Checkpointing avançado:** Adicionar time travel, branching, merge
2. **Sub-graphs complexos:** Criar biblioteca de sub-graphs reutilizáveis
3. **Paralelismo nativo:** Usar paralelismo nativo do LangGraph
4. **Error handling avançado:** Adicionar circuit breaker, fallback strategies
5. **Streaming:** Implementar streaming com async para tempo real

## Integração com IDEIA-master

O package `agent-coordinator` do IDEIA-master pode ser integrado com LangGraph para:

1. **Skill-based matching:** Usar TaskAgentMatcher para routing de agentes
2. **Load balancing:** Usar LoadBalancer para distribuição de tarefas
3. **Agent registry:** Usar AgentCoordinator para gerenciar agentes

```python
from agent_coordinator import AgentCoordinator, createAgentCoordinator
from agent_coordinator.types import AgentCapability, TaskProfile

# Integrar com LangGraph
class LangGraphAgentCoordinator:
    """Coordenador de agentes integrado com LangGraph"""
    
    def __init__(self, coordinator: AgentCoordinator):
        self.coordinator = coordinator
    
    def route_to_langgraph_node(self, task: TaskProfile) -> str:
        """Roteia tarefa para nó LangGraph apropriado"""
        result = self.coordinator.assignTask(task)
        
        if result.status == "assigned":
            return f"agent_{result.assignedAgent}"
        elif result.status == "fallback":
            return f"agent_{result.fallbackAgent}"
        else:
            return "error_handler"

# Uso
coordinator = createAgentCoordinator(matcher, load_balancer)
langgraph_coordinator = LangGraphAgentCoordinator(coordinator)

# Integrar no workflow LangGraph
def routing_node(state):
    task = create_task_profile(state["task"])
    node_id = langgraph_coordinator.route_to_langgraph_node(task)
    return {"next_node": node_id}
```

## Referências

- LangGraph Documentation: https://langchain-ai.github.io/langgraph/
- LangGraph GitHub: https://github.com/langchain-ai/langgraph
- Checkpointing: https://langchain-ai.github.io/langgraph/concepts/persistence/
- Streaming: https://langchain-ai.github.io/langgraph/concepts/streaming/
