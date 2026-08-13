# Arquitetura de Sistemas Multi-Agente

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir padrões de arquitetura e frameworks para sistemas multi-agente

## Visão geral

Sistemas multi-agente coordenam múltiplos agentes de IA para resolver problemas que excedem a capacidade de qualquer agente único. A escolha da arquitetura e framework é crítica para sucesso em produção.

## Padrões de orquestração

### 1. Orchestrator-Worker (Supervisor)

**Arquitetura:** Um supervisor central classifica a tarefa, decompõe em subtarefas, despacha para workers especializados e agrega resultados

**Quando usar:**
- Subtarefas independentes com saída única
- Decomposição clara em especialistas
- Requer accountability centralizada

**Prós:**
- Accountability clara (um ponto de responsabilidade)
- Fácil de debugar
- Workers podem usar modelos menores e mais baratos
- Padrão dominante em produção (2026)

**Contras:**
- Supervisor como single point of failure
- Overhead de coordenação
- Workers não se comunicam entre si

**Implementação:**
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
from operator import add
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    task: str
    subtasks: Sequence[str]
    current_subtask: str
    results: Annotated[Sequence[str], add]
    final: str
    errors: Sequence[str]
    retry_count: int

def supervisor_node(state: AgentState):
    """Supervisor que decompõe a tarefa em subtarefas"""
    task = state["task"]
    logger.info(f"Supervisor decomposing task: {task}")
    
    try:
        subtasks = decompose_task(task)
        logger.info(f"Decomposed into {len(subtasks)} subtasks")
        return {
            "subtasks": subtasks,
            "current_subtask": subtasks[0] if subtasks else "",
            "retry_count": 0
        }
    except Exception as e:
        logger.error(f"Supervisor error: {e}")
        return {"errors": [f"Supervisor failed: {str(e)}"]}

def worker_node(state: AgentState):
    """Worker que executa subtarefas individuais"""
    subtask = state["current_subtask"]
    retry_count = state["retry_count"]
    
    logger.info(f"Worker executing subtask (attempt {retry_count + 1}): {subtask}")
    
    try:
        result = execute_subtask(subtask)
        logger.info(f"Worker completed: {subtask}")
        
        # Próxima subtarefa
        subtasks = list(state["subtasks"])
        current_idx = subtasks.index(subtask) if subtask in subtasks else -1
        next_subtask = subtasks[current_idx + 1] if current_idx + 1 < len(subtasks) else ""
        
        return {
            "results": [result],
            "current_subtask": next_subtask,
            "retry_count": 0
        }
    except Exception as e:
        logger.error(f"Worker error: {e}")
        if retry_count < 3:
            return {"retry_count": retry_count + 1}
        return {"errors": [f"Worker failed after retries: {str(e)}"]}

def aggregator_node(state: AgentState):
    """Aggregator que combina resultados de todos os workers"""
    results = state["results"]
    logger.info(f"Aggregator combining {len(results)} results")
    
    try:
        final = aggregate_results(results)
        logger.info(f"Aggregator completed")
        return {"final": final}
    except Exception as e:
        logger.error(f"Aggregator error: {e}")
        return {"errors": [f"Aggregator failed: {str(e)}"]}

# Criar grafo com routing condicional
def should_continue(state: AgentState):
    """Decide se deve continuar para o worker ou ir para aggregator"""
    if state["errors"]:
        return "aggregator"  # Agregar mesmo com erros
    if state["current_subtask"]:
        return "worker"
    return "aggregator"

workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("worker", worker_node)
workflow.add_node("aggregator", aggregator_node)

workflow.add_conditional_edges(
    "supervisor",
    should_continue,
    {"worker": "worker", "aggregator": "aggregator"}
)
workflow.add_conditional_edges(
    "worker",
    should_continue,
    {"worker": "worker", "aggregator": "aggregator"}
)
workflow.add_edge("aggregator", END)

workflow.set_entry_point("supervisor")
app = workflow.compile()

# Executar
result = app.invoke({
    "task": "Analyze the codebase for security vulnerabilities",
    "subtasks": [],
    "results": [],
    "errors": [],
    "retry_count": 0
})
```

### 2. Pipeline (Sequential)

**Arquitetura:** Agentes executam em sequência fixa, cada um consumindo a saída do anterior

**Quando usar:**
- Estágios sequenciais com dependências claras
- Requer audit trail
- Processamento de documentos em etapas

**Prós:**
- Mais simples e barato
- Fácil de debugar
- Audit trail natural
- Latência previsível

**Contras:**
- Falha em qualquer estágio bloqueia tudo
- Erros propagam para frente
- Latência é soma de todas as etapas

**Implementação:**
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PipelineState(TypedDict):
    input_text: str
    extracted: Optional[dict]
    transformed: Optional[dict]
    validated: Optional[dict]
    errors: list
    stage: str

def extract_node(state: PipelineState):
    """Extrai informações do texto de entrada"""
    text = state["input_text"]
    logger.info(f"Extract stage processing {len(text)} chars")
    
    try:
        extracted = extract_info(text)
        logger.info(f"Extracted {len(extracted)} entities")
        return {
            "extracted": extracted,
            "stage": "extract",
            "errors": []
        }
    except Exception as e:
        logger.error(f"Extract failed: {e}")
        return {"errors": [f"Extract failed: {str(e)}"], "stage": "extract_failed"}

def transform_node(state: PipelineState):
    """Transforma as informações extraídas"""
    extracted = state["extracted"]
    if not extracted:
        logger.warning("Transform stage: no extracted data")
        return {"errors": ["No data to transform"], "stage": "transform_failed"}
    
    logger.info("Transform stage processing extracted data")
    
    try:
        transformed = transform_info(extracted)
        logger.info(f"Transformed {len(transformed)} fields")
        return {
            "transformed": transformed,
            "stage": "transform",
            "errors": []
        }
    except Exception as e:
        logger.error(f"Transform failed: {e}")
        return {"errors": [f"Transform failed: {str(e)}"], "stage": "transform_failed"}

def validate_node(state: PipelineState):
    """Valida as informações transformadas"""
    transformed = state["transformed"]
    if not transformed:
        logger.warning("Validate stage: no transformed data")
        return {"errors": ["No data to validate"], "stage": "validate_failed"}
    
    logger.info("Validate stage processing transformed data")
    
    try:
        validated = validate_info(transformed)
        validation_errors = validated.get("errors", [])
        
        if validation_errors:
            logger.warning(f"Validation found {len(validation_errors)} errors")
            return {
                "validated": validated,
                "stage": "validate",
                "errors": validation_errors
            }
        
        logger.info("Validation passed")
        return {
            "validated": validated,
            "stage": "validate",
            "errors": []
        }
    except Exception as e:
        logger.error(f"Validate failed: {e}")
        return {"errors": [f"Validate failed: {str(e)}"], "stage": "validate_failed"}

def should_continue(state: PipelineState):
    """Decide se deve continuar para o próximo estágio"""
    if state["errors"]:
        return END  # Para em caso de erro
    if state["stage"] == "extract":
        return "transform"
    if state["stage"] == "transform":
        return "validate"
    return END

# Criar pipeline com routing condicional
workflow = StateGraph(PipelineState)
workflow.add_node("extract", extract_node)
workflow.add_node("transform", transform_node)
workflow.add_node("validate", validate_node)

workflow.add_conditional_edges(
    "extract",
    should_continue,
    {"transform": "transform", END: END}
)
workflow.add_conditional_edges(
    "transform",
    should_continue,
    {"validate": "validate", END: END}
)
workflow.add_edge("validate", END)

workflow.set_entry_point("extract")
app = workflow.compile()

# Executar
result = app.invoke({
    "input_text": "John Doe, 30 years old, lives in New York",
    "extracted": None,
    "transformed": None,
    "validated": None,
    "errors": [],
    "stage": "start"
})
```

### 3. Peer-to-Peer (Debate)

**Arquitetura:** Agentes comunicam diretamente via shared state ou message bus, propõem, criticam e refinam outputs colaborativamente

**Quando usar:**
- Qualidade através de perspectivas diversas
- Code review, workflows editoriais
- Validação adversarial

**Prós:**
- Melhor qualidade através de debate
- Sem single point of failure
- Flexível e adaptável

**Contras:**
- Deadlock possível
- Alto custo de tokens
- Difícil de debugar
- Convergência não garantida

**Implementação:**
```python
from autogen import ConversableAgent, GroupChat

# Criar agentes
agent_a = ConversableAgent("agent_a", llm_config=llm_config)
agent_b = ConversableAgent("agent_b", llm_config=llm_config)
agent_c = ConversableAgent("agent_c", llm_config=llm_config)

# Criar grupo de chat
groupchat = GroupChat(
    agents=[agent_a, agent_b, agent_c],
    messages=[],
    max_round=10,
)

# Executar debate
result = agent_a.initiate_chat(
    groupchat,
    message="Analisar este código...",
    summary_method="last_msg",
)
```

### 4. Hierarchical (Tree)

**Arquitetura:** Múltiplos níveis de supervisão, onde supervisores de nível superior coordenam supervisores de nível inferior

**Quando usar:**
- Processos cross-domain complexos
- Equipes de equipes
- Escala muito grande

**Prós:**
- Escala para problemas complexos
- Separação de domínios
- Coordenação distribuída

**Contras:**
- Overhead de coordenação muito alto
- Difícil de debugar
- Custo 10x maior que necessário na maioria dos casos

**Implementação:**
```python
from langgraph.graph import StateGraph, END

def top_supervisor(state):
    goal = state["goal"]
    # Decompor em subgoals
    subgoals = decompose_goal(goal)
    return {"subgoals": subgoals}

def mid_supervisor(state):
    subgoal = state["subgoal"]
    # Decompor em tarefas
    tasks = decompose_subgoal(subgoal)
    return {"tasks": tasks}

def worker(state):
    task = state["task"]
    # Executar tarefa
    result = execute_task(task)
    return {"result": result}

# Criar hierarquia
top_workflow = StateGraph()
top_workflow.add_node("top_supervisor", top_supervisor)
top_workflow.add_node("mid_supervisor", mid_supervisor)
top_workflow.add_node("worker", worker)

top_workflow.add_edge("top_supervisor", "mid_supervisor")
top_workflow.add_edge("mid_supervisor", "worker")
top_workflow.add_edge("worker", END)

top_workflow.set_entry_point("top_supervisor")
app = top_workflow.compile()
```

### 5. Swarm

**Arquitetura:** Muitos agentes simples seguindo regras locais, sem coordenação central

**Quando usar:**
- Exploração de espaço de problema grande
- Caminho ótimo desconhecido
- Scraping em larga escala

**Prós:**
- Escalável
- Sem single point of failure
- Emergente e adaptável

**Contras:**
- Difícil de debugar
- Convergência não garantida
- Requer condições de terminação explícitas

**Implementação:**
```python
from openai import OpenAI

client = OpenAI()

def swarm_agent(task, shared_state):
    # Agente segue regras locais
    if should_handoff(task):
        next_agent = select_next_agent(task)
        return handoff(task, next_agent)
    else:
        result = execute_task(task)
        shared_state.append(result)
        return result

# Executar swarm
shared_state = []
agents = [swarm_agent for _ in range(50)]

for agent in agents:
    agent(task, shared_state)
```

## Comparativo de padrões

| Padrão | Best For | Main Failure Mode | Relative Cost |
|---|---|---|---|
| Orchestrator-Worker | Decomposição clara em especialistas | Supervisor single point of failure | Medium |
| Peer-to-Peer | Validação adversarial, debate | Deadlock, alto custo de tokens | High |
| Pipeline | Processamento sequencial de documentos | Propagação de erro, bloqueio de estágio | Low |
| Hierarchical Tree | Processos cross-domain enterprise | Overhead de coordenação, dificuldade de debug | Very High |
| Swarm | Exploração de espaço de problema grande | Convergência não garantida | Medium-High |

## Frameworks

### LangGraph

**Arquitetura:** Graph-based state machines  
**Best for:** Production agents com state, retries, human-in-the-loop  
**Learning curve:** Steepest  
**Control level:** Highest  
**License:** MIT (v1.0)

**Prós:**
- Controle total sobre fluxo de agentes
- Execução determinística
- Suporte nativo a human-in-the-loop
- Streaming com partial outputs
- Observabilidade via LangSmith
- State persistence across sessions
- Menor latência (14.1s median vs 18.4s CrewAI)
- Menor overhead de tokens (9% vs 18% CrewAI, 31% AutoGen)

**Contras:**
- Curva de aprendizado íngreme
- Mais boilerplate para casos simples
- Debugging de grafos complexos requer skills

**Implementação:**
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    task: str
    subtasks: list
    results: list
    final: str

def planner(state: AgentState):
    task = state["task"]
    subtasks = decompose(task)
    return {"subtasks": subtasks}

def worker(state: AgentState):
    subtask = state["subtasks"][0]
    result = execute(subtask)
    return {"results": [result]}

def synthesizer(state: AgentState):
    results = state["results"]
    final = synthesize(results)
    return {"final": final}

workflow = StateGraph(AgentState)
workflow.add_node("planner", planner)
workflow.add_node("worker", worker)
workflow.add_node("synthesizer", synthesizer)

workflow.add_edge("planner", "worker")
workflow.add_edge("worker", "synthesizer")
workflow.add_edge("synthesizer", END)

workflow.set_entry_point("planner")
app = workflow.compile()

result = app.invoke({"task": "Pesquisar X"})
```

### CrewAI

**Arquitetura:** Role-based crews  
**Best for:** Protótipos rápidos de multi-agente  
**Learning curve:** Easiest  
**Control level:** Medium  
**License:** Open source

**Prós:**
- Time-to-working-demo mais rápido (~25 min vs ~55 min LangGraph)
- Abstração role-based intuitiva
- Built-in task delegation
- 100+ built-in tools
- Flows event-driven API
- Integração com observabilidade

**Contras:**
- Menos controle sobre fluxo de execução
- State management limitado em workflows longos
- Hierarchical mode pode produzir cadeias imprevisíveis
- Case studies de produção anonimizados

**Implementação:**
```python
from crewai import Agent, Task, Crew

# Definir agentes
researcher = Agent(
    role="Researcher",
    goal="Find information",
    backstory="Expert researcher"
)

writer = Agent(
    role="Writer",
    goal="Write content",
    backstory="Expert writer"
)

# Definir tarefas
research_task = Task(
    description="Research topic X",
    agent=researcher
)

write_task = Task(
    description="Write about X",
    agent=writer
)

# Criar crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task]
)

# Executar
result = crew.kickoff()
```

### AutoGen

**Arquitetura:** Conversational multi-agent  
**Best for:** Multi-agent research  
**Learning curve:** Medium  
**Control level:** Medium  
**License:** Open source (maintenance mode)

**Prós:**
- Colaboração conversacional dinâmica
- Suporte async nativo
- Integração forte com Azure OpenAI
- Excelente para code generation e execution

**Contras:**
- Conversation loops podem ser caros e lentos
- Custo imprevisível (loops sem terminação clara)
- Menos suporte nativo a workflows stateful
- Em maintenance mode (Microsoft migrou para MAF)

**Implementação:**
```python
from autogen import ConversableAgent, GroupChat

# Criar agentes
planner = ConversableAgent("planner", llm_config=llm_config)
researcher = ConversableAgent("researcher", llm_config=llm_config)
writer = ConversableAgent("writer", llm_config=llm_config)

# Criar grupo
groupchat = GroupChat(
    agents=[planner, researcher, writer],
    messages=[],
    max_round=10,
)

# Executar
result = planner.initiate_chat(
    groupchat,
    message="Research X",
    summary_method="last_msg",
)
```

### Microsoft Agent Framework (MAF)

**Arquitetura:** Production-oriented successor to AutoGen  
**Best for:** Microsoft-stack enterprises  
**Learning curve:** Medium  
**Control level:** Medium-High  
**License:** Open source

**Prós:**
- Suporta Python e .NET
- WorkflowContext, typed edges
- FileCheckpointStorage
- Middleware support
- Fault-tolerant supersteps
- Pode ser hostado no Azure Foundry

**Contras:**
- Framework mais novo (10.9k stars vs 58.5k AutoGen)
- Ecosystem menor

## Comparativo de frameworks

| Metric | LangGraph | CrewAI | AutoGen | MAF |
|---|---|---|---|---|
| Median latency (research) | 14.1s | 18.4s | 22.7s | N/A |
| P95 latency (research) | 19.8s | 31.2s | 41.5s | N/A |
| Cost per 1k tasks (GPT-4o) | $41.70 | $48.20 | $67.40 | N/A |
| Token overhead | +9% | +18% | +31% | N/A |
| Time-to-first-agent | ~55 min | ~25 min | ~45 min | N/A |
| Integration complexity | 6.8/10 | 3.5/10 | 5.9/10 | N/A |
| State persistence | Native | Partial | Limited | Native |
| Human-in-the-loop | Native | Add-on | Add-on | Native |
| Streaming | Yes | Yes | Partial | Yes |
| Cyclic graph support | Native | Limited | Yes | Yes |
| Production deployments | Klarna, Uber, Replit | Anonimizados | N/A | N/A |

## Monitoramento individual de agentes

### Métricas por agente

**Métricas essenciais:**
- **Latência:** Tempo de execução de cada nó do agente
- **Token usage:** Tokens consumidos por agente (input/output)
- **Success rate:** Taxa de sucesso das tarefas do agente
- **Error rate:** Taxa de erros e tipos de erros
- **Retry count:** Número de retries por agente
- **Tool usage:** Frequência e sucesso de tool calls

**Implementação com LangGraph:**
```python
from langgraph.graph import StateGraph
from typing import TypedDict, Optional
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentMetrics(TypedDict):
    node_name: str
    latency_ms: float
    input_tokens: int
    output_tokens: int
    success: bool
    error: Optional[str]
    retry_count: int
    tool_calls: int

class MonitoredState(TypedDict):
    task: str
    metrics: list[AgentMetrics]
    current_node: str

def monitored_node(node_name: str):
    """Decorator para monitorar execução de nós"""
    def decorator(func):
        def wrapper(state: MonitoredState):
            start_time = time.time()
            logger.info(f"[{node_name}] Starting execution")
            
            try:
                result = func(state)
                latency_ms = (time.time() - start_time) * 1000
                
                metric = AgentMetrics(
                    node_name=node_name,
                    latency_ms=latency_ms,
                    input_tokens=state.get("input_tokens", 0),
                    output_tokens=result.get("output_tokens", 0),
                    success=True,
                    error=None,
                    retry_count=state.get("retry_count", 0),
                    tool_calls=result.get("tool_calls", 0)
                )
                
                logger.info(f"[{node_name}] Completed in {latency_ms:.2f}ms")
                return {**result, "metrics": [metric], "current_node": node_name}
                
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                
                metric = AgentMetrics(
                    node_name=node_name,
                    latency_ms=latency_ms,
                    input_tokens=state.get("input_tokens", 0),
                    output_tokens=0,
                    success=False,
                    error=str(e),
                    retry_count=state.get("retry_count", 0),
                    tool_calls=0
                )
                
                logger.error(f"[{node_name}] Failed after {latency_ms:.2f}ms: {e}")
                return {"metrics": [metric], "current_node": node_name, "errors": [str(e)]}
        
        return wrapper
    return decorator

# Uso
@monitored_node("supervisor")
def supervisor_node(state: MonitoredState):
    task = state["task"]
    subtasks = decompose_task(task)
    return {"subtasks": subtasks, "input_tokens": len(task.split())}

@monitored_node("worker")
def worker_node(state: MonitoredState):
    subtask = state["current_subtask"]
    result = execute_subtask(subtask)
    return {"result": result, "output_tokens": len(result.split()), "tool_calls": 2}
```

### Alertas e thresholds

**Configuração de alertas:**
```python
from dataclasses import dataclass
from enum import Enum

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class AlertThreshold:
    metric: str
    warning_threshold: float
    critical_threshold: float
    severity: AlertSeverity

# Configurar thresholds
THRESHOLDS = [
    AlertThreshold("latency_ms", 5000, 10000, AlertSeverity.WARNING),
    AlertThreshold("error_rate", 0.1, 0.3, AlertSeverity.ERROR),
    AlertThreshold("retry_count", 2, 5, AlertSeverity.WARNING),
]

def check_alerts(metrics: list[AgentMetrics], thresholds: list[AlertThreshold]):
    """Verifica se métricas excedem thresholds"""
    alerts = []
    
    for metric in metrics:
        for threshold in thresholds:
            value = getattr(metric, threshold.metric, 0)
            
            if value >= threshold.critical_threshold:
                alerts.append({
                    "severity": threshold.severity.value,
                    "node": metric.node_name,
                    "metric": threshold.metric,
                    "value": value,
                    "threshold": threshold.critical_threshold
                })
            elif value >= threshold.warning_threshold:
                alerts.append({
                    "severity": AlertSeverity.WARNING.value,
                    "node": metric.node_name,
                    "metric": threshold.metric,
                    "value": value,
                    "threshold": threshold.warning_threshold
                })
    
    return alerts
```

### Dashboard de monitoramento

**Implementação com Prometheus:**
```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Métricas Prometheus
agent_latency = Histogram(
    'agent_execution_latency_seconds',
    'Execution latency of agent nodes',
    ['node_name']
)

agent_tokens = Counter(
    'agent_tokens_total',
    'Total tokens consumed by agents',
    ['node_name', 'token_type']
)

agent_errors = Counter(
    'agent_errors_total',
    'Total errors by agents',
    ['node_name', 'error_type']
)

agent_success_rate = Gauge(
    'agent_success_rate',
    'Success rate of agents',
    ['node_name']
)

def instrumented_node(node_name: str):
    """Decorator para instrumentar nós com Prometheus"""
    def decorator(func):
        def wrapper(state):
            start_time = time.time()
            
            try:
                result = func(state)
                latency = time.time() - start_time
                
                agent_latency.labels(node_name=node_name).observe(latency)
                agent_success_rate.labels(node_name=node_name).set(1)
                
                return result
                
            except Exception as e:
                latency = time.time() - start_time
                
                agent_latency.labels(node_name=node_name).observe(latency)
                agent_errors.labels(node_name=node_name, error_type=type(e).__name__).inc()
                agent_success_rate.labels(node_name=node_name).set(0)
                
                raise
        
        return wrapper
    return decorator
```

## Estratégias de debugging multi-agente

### State inspection

**Inspeção de estado em tempo real:**
```python
from langgraph.graph import StateGraph
from typing import TypedDict
import json

class DebugState(TypedDict):
    task: str
    state_history: list[dict]
    current_step: str
    debug_mode: bool

def debuggable_node(node_name: str):
    """Decorator para habilitar debugging de nós"""
    def decorator(func):
        def wrapper(state: DebugState):
            if state.get("debug_mode", False):
                logger.info(f"[DEBUG] {node_name} input state: {json.dumps(state, indent=2)}")
            
            result = func(state)
            
            if state.get("debug_mode", False):
                logger.info(f"[DEBUG] {node_name} output state: {json.dumps(result, indent=2)}")
                result["state_history"] = state.get("state_history", []) + [{
                    "node": node_name,
                    "input": state,
                    "output": result
                }]
            
            return result
        return wrapper
    return decorator

# Uso
@debuggable_node("supervisor")
def supervisor_node(state: DebugState):
    task = state["task"]
    subtasks = decompose_task(task)
    return {"subtasks": subtasks}
```

### Replay de workflows

**Reproduzir workflows para debugging:**
```python
def replay_workflow(state_history: list[dict], workflow: StateGraph):
    """Reproduz um workflow a partir do histórico de estados"""
    app = workflow.compile()
    
    for step in state_history:
        logger.info(f"Replaying step: {step['node']}")
        # Reexecutar nó com o mesmo estado
        result = app.invoke(step["input"])
        
        # Comparar com resultado original
        if result != step["output"]:
            logger.warning(f"Replay mismatch at {step['node']}")
            logger.warning(f"Expected: {step['output']}")
            logger.warning(f"Got: {result}")
    
    return result

# Salvar histórico para replay
def save_state_history(state: DebugState, filename: str):
    """Salva o histórico de estados para replay"""
    with open(filename, "w") as f:
        json.dump(state["state_history"], f, indent=2)

# Carregar histórico para replay
def load_state_history(filename: str) -> list[dict]:
    """Carrega o histórico de estados para replay"""
    with open(filename, "r") as f:
        return json.load(f)
```

### Tracing distribuído

**Tracing com OpenTelemetry:**
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter
from opentelemetry.sdk.trace.export import SimpleSpanProcessor

# Configurar tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
trace.get_tracer_provider().add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)

def traced_node(node_name: str):
    """Decorator para tracing de nós com OpenTelemetry"""
    def decorator(func):
        def wrapper(state):
            with tracer.start_as_current_span(node_name) as span:
                span.set_attribute("task", state.get("task", ""))
                span.set_attribute("current_step", state.get("current_step", ""))
                
                try:
                    result = func(state)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator
```

### Breakpoints condicionais

**Breakpoints baseados em condições:**
```python
class ConditionalBreakpoint:
    def __init__(self, condition: callable):
        self.condition = condition
        self.triggered = False
    
    def check(self, state: dict) -> bool:
        if not self.triggered and self.condition(state):
            self.triggered = True
            return True
        return False

def breakpoint_node(node_name: str, breakpoints: list[ConditionalBreakpoint]):
    """Decorator para breakpoints condicionais"""
    def decorator(func):
        def wrapper(state):
            for bp in breakpoints:
                if bp.check(state):
                    logger.warning(f"[BREAKPOINT] {node_name} triggered")
                    logger.warning(f"State: {json.dumps(state, indent=2)}")
                    input("Press Enter to continue...")
            
            return func(state)
        return wrapper
    return decorator

# Uso
breakpoints = [
    ConditionalBreakpoint(lambda s: s.get("error_count", 0) > 3),
    ConditionalBreakpoint(lambda s: "timeout" in s.get("errors", [])),
]

@breakpoint_node("worker", breakpoints)
def worker_node(state):
    result = execute_subtask(state["subtask"])
    return {"result": result}
```

### Visualização de grafos

**Visualização de workflows com LangGraph:**
```python
from langgraph.graph import StateGraph

# Criar workflow
workflow = StateGraph(AgentState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("worker", worker_node)
workflow.add_edge("supervisor", "worker")

# Compilar e visualizar
app = workflow.compile()

# Exportar grafo como imagem (requer graphviz)
try:
    app.get_graph().print_ascii()
    app.get_graph().draw_mermaid_png("workflow.png")
except ImportError:
    logger.warning("graphviz not installed, skipping graph visualization")
```

## Protocolos de comunicação

### A2A (Agent-to-Agent)

**Status:** Linux Foundation  
**Propósito:** Comunicação cross-vendor entre agentes  
**Padrão:** Open standard para cross-agent communication

**Características:**
- Interoperável entre frameworks
- Peer coordination, negotiation, delegation
- Escalável e auditable
- Policy-compliant

### MCP (Model Context Protocol)

**Propósito:** Comunicação entre agentes e external tools  
**Padrão:** Interface padronizada para tool interaction

**Características:**
- Medica todas as invocações externas
- Standardizado para tools, data services, contextual repositories
- Interoperável

## Recomendações

### Para prototipagem rápida
**Recomendado:** CrewAI
- Time-to-working-demo mais rápido
- Abstração intuitiva
- Menos código para MVP (~64 linhas vs 128 LangGraph)

### Para produção com branching
**Recomendado:** LangGraph
- Controle total sobre fluxo
- State persistence nativo
- Human-in-the-loop nativo
- Menor latência e custo
- Deployments verificados (Klarna, Uber, Replit)

### Para research multi-agent
**Recomendado:** AutoGen (ou MAF para Microsoft-stack)
- Colaboração conversacional dinâmica
- Excelente para code generation
- Suporte async nativo

### Para workflows simples
**Recomendado:** Pipeline pattern
- Mais simples e barato
- Fácil de debugar
- Audit trail natural

### Para workflows complexos
**Recomendado:** Orchestrator-Worker pattern
- Accountability clara
- Escalável
- Padrão dominante em produção

## Próximos passos

1. **Escolher framework:** Selecionar baseado em requisitos (protótipo vs produção)
2. **Definir padrão:** Escolher padrão de orquestração baseado em workflow
3. **Implementar comunicação:** Usar A2A e MCP para interoperabilidade
4. **Configurar observabilidade:** Implementar tracing em cada boundary de agente
5. **Testar escalabilidade:** Validar latência, custo e throughput
6. **Deploy para produção:** Usar LangGraph para production-grade systems

## Referências

- LangGraph: https://langchain-ai.github.io/langgraph/
- CrewAI: https://www.crewai.com/
- AutoGen: https://microsoft.github.io/autogen/
- Microsoft Agent Framework: https://github.com/microsoft/semantic-kernel
- A2A Protocol: Linux Foundation


Teste