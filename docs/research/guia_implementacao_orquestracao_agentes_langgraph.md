# Guia de Implementação - Orquestração de Agentes LangGraph

**Data:** 12 de agosto de 2026  
**Status:** Guia completo  
**Objetivo:** Implementação detalhada de orquestração de agentes com LangGraph para LLMs 20B

## Visão Geral

Este guia fornece implementação completa e detalhada de orquestração de agentes usando LangGraph, incluindo estrutura de diretórios, código funcional, testes, edge cases e integrações.

## Pré-requisitos

### Dependências

```bash
pip install langgraph langchain langchain-openai langchain-anthropic
```

### Estrutura de Diretórios

```
packages/
├── agent_orchestrator/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── state.py              # Definições de estado
│   │   ├── nodes.py              # Implementação de nós
│   │   ├── edges.py              # Implementação de edges
│   │   └── graph.py              # Construção do grafo
│   ├── checkpointer/
│   │   ├── __init__.py
│   │   ├── memory.py             # Implementação de checkpointer
│   │   └── storage.py            # Storage para checkpoints
│   ├── streaming/
│   │   ├── __init__.py
│   │   ├── streamer.py           # Implementação de streaming
│   │   └── handlers.py           # Handlers de eventos
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── llm.py                # Wrapper para LLMs
│   │   └── validators.py         # Validadores de estado
│   └── config/
│       ├── __init__.py
│       └── settings.py           # Configurações
```

## Passo 1: Implementação do Estado (state.py)

```python
"""
Definições de estado para orquestração de agentes.
"""
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from operator import add
from datetime import datetime

class AgentState(TypedDict):
    """Estado principal do agente."""
    # Input
    task: str
    task_type: str  # "code", "review", "test", "docs", "refactor"
    complexity: float  # 0.0 a 1.0
    
    # Progresso
    current_step: str
    steps_completed: Annotated[List[str], add]
    steps_remaining: List[str]
    
    # Resultados
    intermediate_results: Annotated[Dict[str, Any], add]
    final_result: str
    
    # Erros
    errors: Annotated[List[str], add]
    warnings: Annotated[List[str], add]
    
    # Metadados
    start_time: datetime
    end_time: Optional[datetime]
    execution_time: Optional[float]
    
    # Contexto
    context: Dict[str, Any]
    metadata: Dict[str, Any]

class CodeGenerationState(TypedDict):
    """Estado específico para geração de código."""
    task: str
    language: str
    requirements: List[str]
    code: str
    tests: str
    documentation: str
    
class CodeReviewState(TypedDict):
    """Estado específico para review de código."""
    code: str
    review_comments: List[str]
    issues_found: List[str]
    suggestions: List[str]
    approved: bool

class TestingState(TypedDict):
    """Estado específico para testes."""
    code: str
    test_cases: List[str]
    test_results: List[Dict[str, Any]]
    coverage: float
    passed: bool
```

## Passo 2: Implementação de Nós (nodes.py)

```python
"""
Implementação de nós para orquestração de agentes.
"""
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from .state import AgentState, CodeGenerationState, CodeReviewState, TestingState

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentNodes:
    """Coleção de nós para orquestração de agentes."""
    
    def __init__(self, llm_client):
        """Inicializa nós com cliente LLM."""
        self.llm_client = llm_client
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa e determina tipo e complexidade."""
        task = state["task"]
        logger.info(f"Analyzing task: {task}")
        
        try:
            # Classificar tipo de tarefa
            task_type = self._classify_task_type(task)
            
            # Calcular complexidade
            complexity = self._calculate_complexity(task, task_type)
            
            # Determinar passos necessários
            steps = self._determine_steps(task_type, complexity)
            
            logger.info(f"Task type: {task_type}, Complexity: {complexity}")
            
            return {
                "task_type": task_type,
                "complexity": complexity,
                "steps_remaining": steps,
                "current_step": steps[0] if steps else "complete",
                "steps_completed": ["task_analysis"],
                "context": {"task_type": task_type, "complexity": complexity}
            }
        except Exception as e:
            logger.error(f"Task analysis error: {e}")
            return {
                "errors": [f"Task analysis failed: {str(e)}"],
                "current_step": "error"
            }
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código baseado na tarefa."""
        task = state["task"]
        context = state.get("context", {})
        logger.info(f"Generating code for: {task}")
        
        try:
            # Preparar prompt para LLM
            prompt = self._build_code_generation_prompt(task, context)
            
            # Chamar LLM
            code = self.llm_client.generate(prompt)
            
            # Validar código gerado
            if not self._validate_code(code):
                raise ValueError("Generated code is invalid")
            
            logger.info("Code generation completed")
            
            return {
                "intermediate_results": {"code": code},
                "steps_completed": ["code_generation"],
                "current_step": state["steps_remaining"][1] if len(state["steps_remaining"]) > 1 else "complete"
            }
        except Exception as e:
            logger.error(f"Code generation error: {e}")
            return {
                "errors": [f"Code generation failed: {str(e)}"],
                "current_step": "error"
            }
    
    def code_review_node(self, state: AgentState) -> Dict[str, Any]:
        """Review de código gerado."""
        code = state["intermediate_results"].get("code", "")
        logger.info("Reviewing code")
        
        try:
            # Preparar prompt de review
            prompt = self._build_review_prompt(code)
            
            # Chamar LLM para review
            review = self.llm_client.generate(prompt)
            
            # Parse review
            review_data = self._parse_review(review)
            
            logger.info(f"Code review completed: {review_data.get('approved', False)}")
            
            return {
                "intermediate_results": {"review": review_data},
                "steps_completed": ["code_review"],
                "current_step": state["steps_remaining"][2] if len(state["steps_remaining"]) > 2 else "complete"
            }
        except Exception as e:
            logger.error(f"Code review error: {e}")
            return {
                "errors": [f"Code review failed: {str(e)}"],
                "current_step": "error"
            }
    
    def testing_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera e executa testes."""
        code = state["intermediate_results"].get("code", "")
        logger.info("Generating and running tests")
        
        try:
            # Gerar testes
            test_prompt = self._build_test_generation_prompt(code)
            tests = self.llm_client.generate(test_prompt)
            
            # Executar testes (simulado)
            test_results = self._execute_tests(code, tests)
            
            logger.info(f"Testing completed: {test_results.get('passed', False)}")
            
            return {
                "intermediate_results": {"tests": test_results},
                "steps_completed": ["testing"],
                "current_step": state["steps_remaining"][3] if len(state["steps_remaining"]) > 3 else "complete"
            }
        except Exception as e:
            logger.error(f"Testing error: {e}")
            return {
                "errors": [f"Testing failed: {str(e)}"],
                "current_step": "error"
            }
    
    def documentation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera documentação."""
        code = state["intermediate_results"].get("code", "")
        logger.info("Generating documentation")
        
        try:
            # Gerar documentação
            doc_prompt = self._build_documentation_prompt(code)
            docs = self.llm_client.generate(doc_prompt)
            
            logger.info("Documentation generation completed")
            
            return {
                "intermediate_results": {"documentation": docs},
                "steps_completed": ["documentation"],
                "current_step": "complete"
            }
        except Exception as e:
            logger.error(f"Documentation error: {e}")
            return {
                "errors": [f"Documentation failed: {str(e)}"],
                "current_step": "error"
            }
    
    def aggregator_node(self, state: AgentState) -> Dict[str, Any]:
        """Agrega resultados finais."""
        results = state["intermediate_results"]
        logger.info("Aggregating final results")
        
        try:
            # Construir resultado final
            final_result = self._build_final_result(results)
            
            # Calcular tempo de execução
            end_time = datetime.now()
            execution_time = (end_time - state["start_time"]).total_seconds()
            
            logger.info(f"Aggregation completed in {execution_time:.2f}s")
            
            return {
                "final_result": final_result,
                "end_time": end_time,
                "execution_time": execution_time,
                "current_step": "complete"
            }
        except Exception as e:
            logger.error(f"Aggregation error: {e}")
            return {
                "errors": [f"Aggregation failed: {str(e)}"],
                "current_step": "error"
            }
    
    # ===== Métodos Auxiliares =====
    
    def _classify_task_type(self, task: str) -> str:
        """Classifica tipo de tarefa."""
        task_lower = task.lower()
        
        if "test" in task_lower:
            return "test"
        elif "review" in task_lower:
            return "review"
        elif "doc" in task_lower or "documentation" in task_lower:
            return "docs"
        elif "refactor" in task_lower:
            return "refactor"
        else:
            return "code"
    
    def _calculate_complexity(self, task: str, task_type: str) -> float:
        """Calcula complexidade da tarefa (0.0 a 1.0)."""
        # Base complexity
        base_complexity = 0.3
        
        # Adjust based on task type
        type_multiplier = {
            "code": 1.0,
            "review": 0.5,
            "test": 0.7,
            "docs": 0.4,
            "refactor": 0.8
        }
        
        # Adjust based on task length
        length_factor = min(len(task) / 500, 1.0)
        
        complexity = base_complexity * type_multiplier.get(task_type, 1.0) + (length_factor * 0.4)
        return min(complexity, 1.0)
    
    def _determine_steps(self, task_type: str, complexity: float) -> List[str]:
        """Determina passos necessários baseado em tipo e complexidade."""
        base_steps = ["task_analysis", "code_generation"]
        
        if complexity > 0.5:
            base_steps.append("code_review")
        
        if complexity > 0.7:
            base_steps.append("testing")
        
        if task_type in ["code", "refactor"]:
            base_steps.append("documentation")
        
        return base_steps
    
    def _build_code_generation_prompt(self, task: str, context: Dict[str, Any]) -> str:
        """Constrói prompt para geração de código."""
        return f"""
Task: {task}
Context: {context}

Generate clean, well-documented code that solves this task.
Include proper error handling and follow best practices.
"""
    
    def _build_review_prompt(self, code: str) -> str:
        """Constrói prompt para review de código."""
        return f"""
Review the following code:

{code}

Provide:
1. Overall assessment
2. Issues found (if any)
3. Suggestions for improvement
4. Approval decision (yes/no)
"""
    
    def _build_test_generation_prompt(self, code: str) -> str:
        """Constrói prompt para geração de testes."""
        return f"""
Generate comprehensive tests for the following code:

{code}

Include:
1. Unit tests
2. Edge cases
3. Error scenarios
"""
    
    def _build_documentation_prompt(self, code: str) -> str:
        """Constrói prompt para geração de documentação."""
        return f"""
Generate documentation for the following code:

{code}

Include:
1. Function/class descriptions
2. Parameter documentation
3. Return value documentation
4. Usage examples
"""
    
    def _validate_code(self, code: str) -> bool:
        """Valida código gerado."""
        # Basic validation
        if not code or len(code) < 10:
            return False
        
        # Check for basic structure
        if "def " not in code and "class " not in code:
            return False
        
        return True
    
    def _parse_review(self, review: str) -> Dict[str, Any]:
        """Parse resultado de review."""
        return {
            "approved": "yes" in review.lower(),
            "comments": review,
            "issues": [],
            "suggestions": []
        }
    
    def _execute_tests(self, code: str, tests: str) -> Dict[str, Any]:
        """Executa testes (simulado)."""
        return {
            "passed": True,
            "coverage": 0.85,
            "test_count": 5,
            "failed_count": 0
        }
    
    def _build_final_result(self, results: Dict[str, Any]) -> str:
        """Constrói resultado final."""
        parts = []
        
        if "code" in results:
            parts.append(f"Code:\n{results['code']}")
        
        if "review" in results:
            parts.append(f"Review: {results['review']}")
        
        if "tests" in results:
            parts.append(f"Tests: {results['tests']}")
        
        if "documentation" in results:
            parts.append(f"Documentation:\n{results['documentation']}")
        
        return "\n\n".join(parts)
```

## Passo 3: Implementação de Edges (edges.py)

```python
"""
Implementação de edges (condicionais) para orquestração de agentes.
"""
from typing import Literal
from langgraph.graph import END

from .state import AgentState

class AgentEdges:
    """Coleção de edges para orquestração de agentes."""
    
    @staticmethod
    def should_continue(state: AgentState) -> Literal[str, "END"]:
        """Decide se deve continuar para o próximo passo."""
        # Se houver erros, parar
        if state.get("errors"):
            return END
        
        # Se não houver mais passos, terminar
        if not state.get("steps_remaining") or len(state["steps_remaining"]) == 0:
            return END
        
        # Continuar para próximo passo
        current_step = state.get("current_step", "")
        
        if current_step == "task_analysis":
            return "code_generation"
        elif current_step == "code_generation":
            return "code_review" if "code_review" in state.get("steps_remaining", []) else "testing"
        elif current_step == "code_review":
            return "testing" if "testing" in state.get("steps_remaining", []) else "documentation"
        elif current_step == "testing":
            return "documentation" if "documentation" in state.get("steps_remaining", []) else "aggregator"
        elif current_step == "documentation":
            return "aggregator"
        else:
            return END
    
    @staticmethod
    def route_after_code_generation(state: AgentState) -> Literal["code_review", "testing", "documentation", "aggregator"]:
        """Roteia após geração de código baseado em complexidade."""
        complexity = state.get("complexity", 0.0)
        steps_remaining = state.get("steps_remaining", [])
        
        if "code_review" in steps_remaining and complexity > 0.5:
            return "code_review"
        elif "testing" in steps_remaining and complexity > 0.7:
            return "testing"
        elif "documentation" in steps_remaining:
            return "documentation"
        else:
            return "aggregator"
    
    @staticmethod
    def route_after_review(state: AgentState) -> Literal["testing", "documentation", "aggregator", "code_generation"]:
        """Roteia após review baseado em aprovação."""
        review = state.get("intermediate_results", {}).get("review", {})
        approved = review.get("approved", False)
        
        if not approved:
            # Se não aprovado, voltar para geração de código
            return "code_generation"
        
        steps_remaining = state.get("steps_remaining", [])
        
        if "testing" in steps_remaining:
            return "testing"
        elif "documentation" in steps_remaining:
            return "documentation"
        else:
            return "aggregator"
    
    @staticmethod
    def route_after_testing(state: AgentState) -> Literal["documentation", "aggregator", "code_generation"]:
        """Roteia após testes baseado em resultados."""
        tests = state.get("intermediate_results", {}).get("tests", {})
        passed = tests.get("passed", False)
        
        if not passed:
            # Se testes falharam, voltar para geração de código
            return "code_generation"
        
        steps_remaining = state.get("steps_remaining", [])
        
        if "documentation" in steps_remaining:
            return "documentation"
        else:
            return "aggregator"
```

## Passo 4: Implementação do Grafo (graph.py)

```python
"""
Construção do grafo de orquestração de agentes.
"""
from langgraph.graph import StateGraph, END
from datetime import datetime

from .state import AgentState
from .nodes import AgentNodes
from .edges import AgentEdges

class AgentOrchestrator:
    """Orquestrador de agentes com LangGraph."""
    
    def __init__(self, llm_client):
        """Inicializa orquestrador."""
        self.llm_client = llm_client
        self.nodes = AgentNodes(llm_client)
        self.edges = AgentEdges()
        self.graph = None
        self.app = None
    
    def build_graph(self) -> StateGraph:
        """Constrói o grafo de orquestração."""
        # Criar grafo
        graph = StateGraph(AgentState)
        
        # Adicionar nós
        graph.add_node("task_analyzer", self.nodes.task_analyzer_node)
        graph.add_node("code_generation", self.nodes.code_generation_node)
        graph.add_node("code_review", self.nodes.code_review_node)
        graph.add_node("testing", self.nodes.testing_node)
        graph.add_node("documentation", self.nodes.documentation_node)
        graph.add_node("aggregator", self.nodes.aggregator_node)
        
        # Adicionar edges
        graph.set_entry_point("task_analyzer")
        
        # Edge condicional após task_analyzer
        graph.add_conditional_edges(
            "task_analyzer",
            self.edges.should_continue,
            {
                "code_generation": "code_generation",
                END: END
            }
        )
        
        # Edge condicional após code_generation
        graph.add_conditional_edges(
            "code_generation",
            self.edges.route_after_code_generation,
            {
                "code_review": "code_review",
                "testing": "testing",
                "documentation": "documentation",
                "aggregator": "aggregator"
            }
        )
        
        # Edge condicional após code_review
        graph.add_conditional_edges(
            "code_review",
            self.edges.route_after_review,
            {
                "testing": "testing",
                "documentation": "documentation",
                "aggregator": "aggregator",
                "code_generation": "code_generation"
            }
        )
        
        # Edge condicional após testing
        graph.add_conditional_edges(
            "testing",
            self.edges.route_after_testing,
            {
                "documentation": "documentation",
                "aggregator": "aggregator",
                "code_generation": "code_generation"
            }
        )
        
        # Edge de documentation para aggregator
        graph.add_edge("documentation", "aggregator")
        
        # Edge de aggregator para END
        graph.add_edge("aggregator", END)
        
        self.graph = graph
        return graph
    
    def compile(self):
        """Compila o grafo para execução."""
        if not self.graph:
            self.build_graph()
        
        self.app = self.graph.compile()
        return self.app
    
    def invoke(self, task: str, config: dict = None) -> dict:
        """Invoca o orquestrador com uma tarefa."""
        if not self.app:
            self.compile()
        
        # Estado inicial
        initial_state = {
            "task": task,
            "task_type": "",
            "complexity": 0.0,
            "current_step": "",
            "steps_completed": [],
            "steps_remaining": [],
            "intermediate_results": {},
            "final_result": "",
            "errors": [],
            "warnings": [],
            "start_time": datetime.now(),
            "end_time": None,
            "execution_time": None,
            "context": {},
            "metadata": {}
        }
        
        # Executar
        result = self.app.invoke(initial_state, config)
        
        return result
    
    def stream(self, task: str, config: dict = None):
        """Executa o orquestrador com streaming de eventos."""
        if not self.app:
            self.compile()
        
        # Estado inicial
        initial_state = {
            "task": task,
            "task_type": "",
            "complexity": 0.0,
            "current_step": "",
            "steps_completed": [],
            "steps_remaining": [],
            "intermediate_results": {},
            "final_result": "",
            "errors": [],
            "warnings": [],
            "start_time": datetime.now(),
            "end_time": None,
            "execution_time": None,
            "context": {},
            "metadata": {}
        }
        
        # Executar com streaming
        for event in self.app.stream(initial_state, config):
            yield event
```

## Passo 5: Implementação de Checkpointer (checkpointer/memory.py)

```python
"""
Implementação de checkpointer para persistência de estado.
"""
from typing import Dict, Any, Optional
from datetime import datetime
import json
import hashlib

class MemoryCheckpointer:
    """Checkpointer baseado em memória."""
    
    def __init__(self):
        """Inicializa checkpointer."""
        self.checkpoints: Dict[str, Dict[str, Any]] = {}
        self.current_checkpoint_id: Optional[str] = None
    
    def put(self, config: Dict[str, Any], checkpoint: Dict[str, Any]) -> str:
        """Salva checkpoint."""
        checkpoint_id = self._generate_checkpoint_id(config, checkpoint)
        
        self.checkpoints[checkpoint_id] = {
            "id": checkpoint_id,
            "config": config,
            "checkpoint": checkpoint,
            "timestamp": datetime.now().isoformat()
        }
        
        self.current_checkpoint_id = checkpoint_id
        return checkpoint_id
    
    def get(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Recupera checkpoint."""
        checkpoint_id = self._generate_checkpoint_id(config, {})
        return self.checkpoints.get(checkpoint_id)
    
    def list(self, config: Dict[str, Any] = None, limit: int = 10) -> list:
        """Lista checkpoints."""
        checkpoints = list(self.checkpoints.values())
        
        if config:
            # Filtrar por config
            filtered = [
                cp for cp in checkpoints
                if cp.get("config") == config
            ]
            return filtered[:limit]
        
        return checkpoints[:limit]
    
    def delete(self, checkpoint_id: str) -> bool:
        """Deleta checkpoint."""
        if checkpoint_id in self.checkpoints:
            del self.checkpoints[checkpoint_id]
            return True
        return False
    
    def _generate_checkpoint_id(self, config: Dict[str, Any], checkpoint: Dict[str, Any]) -> str:
        """Gera ID único para checkpoint."""
        content = json.dumps(config, sort_keys=True) + json.dumps(checkpoint, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
```

## Passo 6: Implementação de Streaming (streaming/streamer.py)

```python
"""
Implementação de streaming para orquestração de agentes.
"""
from typing import Generator, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AgentStreamer:
    """Streamer para eventos de orquestração."""
    
    def __init__(self):
        """Inicializa streamer."""
        self.event_handlers = {}
    
    def on(self, event_type: str, handler):
        """Registra handler para evento."""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def emit(self, event_type: str, data: Dict[str, Any]):
        """Emite evento."""
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    handler(data)
                except Exception as e:
                    logger.error(f"Handler error for {event_type}: {e}")
    
    def stream_events(self, events: Generator) -> Generator[Dict[str, Any], None, None]:
        """Processa eventos e emite para handlers."""
        for event in events:
            for node_name, node_state in event.items():
                self.emit("node_start", {"node": node_name, "state": node_state})
                
                # Processar estado
                if node_state.get("errors"):
                    self.emit("error", {"node": node_name, "errors": node_state["errors"]})
                
                if node_state.get("steps_completed"):
                    self.emit("step_completed", {
                        "node": node_name,
                        "steps": node_state["steps_completed"]
                    })
                
                self.emit("node_complete", {"node": node_name, "state": node_state})
                
                yield event
```

## Passo 7: Wrapper para LLM (utils/llm.py)

```python
"""
Wrapper para LLMs (OpenAI, Anthropic, etc.).
"""
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    """Cliente LLM genérico."""
    
    def __init__(self, provider: str = "openai", model: str = "gpt-4o", api_key: str = None):
        """Inicializa cliente LLM."""
        self.provider = provider
        self.model = model
        self.api_key = api_key
        self.client = self._initialize_client()
    
    def _initialize_client(self):
        """Inicializa cliente específico do provider."""
        if self.provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model=self.model, api_key=self.api_key)
        elif self.provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model=self.model, api_key=self.api_key)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    def generate(self, prompt: str, max_tokens: int = 2000) -> str:
        """Gera resposta do LLM."""
        try:
            response = self.client.invoke(prompt, max_tokens=max_tokens)
            return response.content
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            raise
    
    def generate_stream(self, prompt: str, max_tokens: int = 2000):
        """Gera resposta do LLM com streaming."""
        try:
            for chunk in self.client.stream(prompt, max_tokens=max_tokens):
                yield chunk.content
        except Exception as e:
            logger.error(f"LLM streaming error: {e}")
            raise
```

## Passo 8: Configurações (config/settings.py)

```python
"""
Configurações para orquestração de agentes.
"""
from typing import Dict, Any

class Settings:
    """Configurações do orquestrador."""
    
    # LLM Settings
    LLM_PROVIDER = "openai"
    LLM_MODEL = "gpt-4o"
    LLM_API_KEY = None  # Set from environment
    LLM_MAX_TOKENS = 2000
    LLM_TEMPERATURE = 0.7
    
    # Checkpointer Settings
    CHECKPOINTER_TYPE = "memory"  # "memory" or "file"
    CHECKPOINT_DIR = "./checkpoints"
    MAX_CHECKPOINTS = 100
    
    # Streaming Settings
    ENABLE_STREAMING = True
    STREAM_EVENTS = ["node_start", "node_complete", "error", "step_completed"]
    
    # Timeout Settings
    NODE_TIMEOUT = 300  # seconds
    TOTAL_TIMEOUT = 3600  # seconds
    
    # Retry Settings
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # seconds
    
    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "Settings":
        """Cria settings a partir de dicionário."""
        settings = cls()
        for key, value in config.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        return settings
```

## Passo 9: Exemplo de Uso

```python
"""
Exemplo de uso do orquestrador de agentes.
"""
from agent_orchestrator.core.graph import AgentOrchestrator
from agent_orchestrator.utils.llm import LLMClient
from agent_orchestrator.checkpointer.memory import MemoryCheckpointer
from agent_orchestrator.streaming.streamer import AgentStreamer

# Inicializar cliente LLM
llm_client = LLMClient(
    provider="openai",
    model="gpt-4o",
    api_key="your-api-key"
)

# Criar orquestrador
orchestrator = AgentOrchestrator(llm_client)

# Compilar grafo
app = orchestrator.compile()

# Executar tarefa
result = orchestrator.invoke("Create a REST API endpoint for user authentication")

print(f"Result: {result['final_result']}")
print(f"Execution time: {result['execution_time']}s")

# Executar com streaming
streamer = AgentStreamer()

@streamer.on("step_completed")
def handle_step_completed(data):
    print(f"Step completed: {data['steps']}")

for event in orchestrator.stream("Create a REST API endpoint"):
    streamer.stream_events([event])
```

## Passo 10: Testes de Validação

```python
"""
Testes de validação para orquestrador de agentes.
"""
import pytest
from agent_orchestrator.core.graph import AgentOrchestrator
from agent_orchestrator.utils.llm import LLMClient

class TestAgentOrchestrator:
    """Testes para orquestrador de agentes."""
    
    def test_initialization(self):
        """Testa inicialização do orquestrador."""
        llm_client = LLMClient(provider="openai", model="gpt-4o")
        orchestrator = AgentOrchestrator(llm_client)
        
        assert orchestrator.llm_client is not None
        assert orchestrator.nodes is not None
        assert orchestrator.edges is not None
    
    def test_graph_building(self):
        """Testa construção do grafo."""
        llm_client = LLMClient(provider="openai", model="gpt-4o")
        orchestrator = AgentOrchestrator(llm_client)
        
        graph = orchestrator.build_graph()
        
        assert graph is not None
        assert orchestrator.graph is not None
    
    def test_compilation(self):
        """Testa compilação do grafo."""
        llm_client = LLMClient(provider="openai", model="gpt-4o")
        orchestrator = AgentOrchestrator(llm_client)
        
        app = orchestrator.compile()
        
        assert app is not None
        assert orchestrator.app is not None
    
    def test_state_structure(self):
        """Testa estrutura do estado."""
        from agent_orchestrator.core.state import AgentState
        
        state = {
            "task": "Test task",
            "task_type": "",
            "complexity": 0.0,
            "current_step": "",
            "steps_completed": [],
            "steps_remaining": [],
            "intermediate_results": {},
            "final_result": "",
            "errors": [],
            "warnings": [],
            "start_time": None,
            "end_time": None,
            "execution_time": None,
            "context": {},
            "metadata": {}
        }
        
        assert "task" in state
        assert "errors" in state
        assert "steps_completed" in state

# Executar testes
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Edge Cases e Tratamento de Erros

### 1. Timeout em Nós

```python
import signal
from contextlib import contextmanager

@contextmanager
def timeout(seconds):
    """Context manager para timeout."""
    def signal_handler(signum, frame):
        raise TimeoutError("Operation timed out")
    
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)

# Uso em nó
def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
    try:
        with timeout(300):  # 5 minutos
            # ... código de geração ...
            pass
    except TimeoutError:
        return {"errors": ["Code generation timed out"]}
```

### 2. Retry com Backoff

```python
import time
from typing import Callable

def retry_with_backoff(func: Callable, max_retries: int = 3, delay: float = 5.0):
    """Executa função com retry e backoff exponencial."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = delay * (2 ** attempt)
            time.sleep(wait_time)
```

### 3. Validação de Estado

```python
def validate_state(state: AgentState) -> bool:
    """Valida estado do agente."""
    required_fields = [
        "task", "task_type", "complexity", "current_step",
        "steps_completed", "steps_remaining", "intermediate_results",
        "final_result", "errors", "warnings", "start_time"
    ]
    
    for field in required_fields:
        if field not in state:
            return False
    
    return True
```

## Integrações com Outros Componentes

### 1. Integração com Sistema de Memória

```python
from agent_orchestrator.core.graph import AgentOrchestrator
from memory_system import MemoryHierarchy

class MemoryAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com sistema de memória."""
    
    def __init__(self, llm_client, memory_system: MemoryHierarchy):
        super().__init__(llm_client)
        self.memory_system = memory_system
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando memória."""
        # Recuperar contexto relevante da memória
        context = self.memory_system.retrieve(state["task"])
        
        # Adicionar contexto ao estado
        state["context"]["memory"] = context
        
        # Chamar implementação base
        return super().code_generation_node(state)
```

### 2. Integração com Context Management

```python
from context_management import HybridIndexer

class ContextAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com gerenciamento de contexto."""
    
    def __init__(self, llm_client, context_indexer: HybridIndexer):
        super().__init__(llm_client)
        self.context_indexer = context_indexer
    
    def task_analyzer_node(self, state: AgentState) -> Dict[str, Any]:
        """Analisa tarefa usando contexto."""
        # Indexar tarefa no contexto
        self.context_indexer.index(state["task"])
        
        # Recuperar contexto relacionado
        related_context = self.context_indexer.search(state["task"])
        
        # Adicionar contexto ao estado
        state["context"]["related"] = related_context
        
        # Chamar implementação base
        return super().task_analyzer_node(state)
```

### 3. Integração com RAG

```python
from rag_engine import HybridRetriever

class RAGAwareOrchestrator(AgentOrchestrator):
    """Orquestrador com RAG."""
    
    def __init__(self, llm_client, rag_retriever: HybridRetriever):
        super().__init__(llm_client)
        self.rag_retriever = rag_retriever
    
    def code_generation_node(self, state: AgentState) -> Dict[str, Any]:
        """Gera código usando RAG."""
        # Recuperar documentos relevantes
        docs = self.rag_retriever.search(state["task"])
        
        # Adicionar documentos ao prompt
        context = "\n".join([doc.content for doc in docs])
        state["context"]["rag_docs"] = context
        
        # Chamar implementação base
        return super().code_generation_node(state)
```

## Próximos Passos

1. Implementar checkpointer baseado em arquivo
2. Adicionar suporte a múltiplos providers LLM
3. Implementar sistema de logging avançado
4. Adicionar métricas e monitoramento
5. Implementar testes de integração
6. Adicionar documentação de API
7. Criar exemplos de uso avançados
