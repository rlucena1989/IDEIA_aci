# Convenções de Código - IDEIA_aci

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Padronizar nomenclatura e estilo de código para LLMs 20B

## Convenções de Nomenclatura

### Classes
- **Padrão:** PascalCase
- **Exemplos:** `AgentState`, `MultiSidekickState`, `MemoryHierarchy`, `HybridRetriever`
- **Exceções:** Nenhuma

### Funções e Métodos
- **Padrão:** snake_case
- **Exemplos:** `process_step1()`, `generate_code()`, `classify_subtask_type()`, `add_document()`
- **Exceções:** Nenhuma

### Variáveis
- **Padrão:** snake_case
- **Exemplos:** `task_type`, `complexity`, `budget`, `primary_provider`
- **Exceções:** Nenhuma

### Constantes
- **Padrão:** UPPER_SNAKE_CASE
- **Exemplos:** `MAX_TOKENS`, `SIMILARITY_THRESHOLD`, `FAILURE_THRESHOLD`
- **Exceções:** Nenhuma

### Módulos e Pacotes
- **Padrão:** snake_case
- **Exemplos:** `agent_coordinator`, `memory_hierarchy`, `rag_engine`
- **Exceções:** Nenhuma

## Convenções de Estado

### Estados de Agentes
- **Padrão:** Enum com UPPER_CASE
- **Exemplos:** `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `SKIPPED`
- **Uso:** `TaskStatus.PENDING`, `CircuitState.CLOSED`

### Estados de Circuit Breaker
- **Padrão:** Enum com UPPER_CASE
- **Exemplos:** `CLOSED`, `OPEN`, `HALF_OPEN`
- **Uso:** `CircuitState.CLOSED`

## Convenções de Configuração

### Classes de Configuração
- **Sufixo:** `Config`
- **Exemplos:** `ProviderConfig`, `QuantizationConfig`, `CircuitBreakerConfig`
- **Campos:** snake_case

### Classes de Estado
- **Sufixo:** `State`
- **Exemplos:** `AgentState`, `MultiSidekickState`, `MemoryState`
- **Campos:** snake_case

## Convenções de Estruturas de Dados

### Dataclasses
- **Uso:** Para estruturas de dados simples
- **Exemplos:** `Document`, `GraphNode`, `GraphEdge`, `APIRoute`
- **Campos:** snake_case

### TypedDict
- **Uso:** Para estruturas de estado complexas
- **Exemplos:** `AgentState`, `MultiSidekickState`
- **Campos:** snake_case

## Convenções de Logging

### Logger
- **Padrão:** `logger = logging.getLogger(__name__)`
- **Níveis:** `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Uso:** `logger.info()`, `logger.error()`

## Convenções de Stubs

### Marcação de Stubs
- **Comentário:** `# ===== STUB IMPLEMENTATIONS =====`
- **Documentação:** `"""Função X (STUB)"""`
- **Instrução:** `# Em produção, substituir com implementação real`

### Exemplo de Stub
```python
# ===== STUB IMPLEMENTATIONS =====
# Estas são implementações mínimas para demonstração.
# Em produção, substituir com implementações reais usando LLMs.

def generate_code(task: str) -> str:
    """Gera código baseado na tarefa (STUB)"""
    # Em produção, chamar LLM para gerar código
    return f"# Generated code for: {task}\ndef solution():\n    pass"
# ===== END STUB IMPLEMENTATIONS =====
```

## Convenções de Dependências

### Documentação de Dependências
- **Localização:** Topo de cada documento, antes do código
- **Formato:** 
```python
### Dependências

```python
pip install <package>
```
```

### Exemplos de Dependências
- `langgraph` - Orquestração de agentes
- `numpy` - Operações numéricas
- `opentelemetry-api` - Observabilidade
- `opentelemetry-sdk` - Observabilidade
- `pyyaml` - Configuração YAML

## Convenções de Erro Handling

### Try-Except
- **Padrão:** Logar erro e retornar valor de erro
- **Exemplo:**
```python
try:
    result = process_step1(task)
    logger.info("Step 1 completed")
    return {"result": result}
except Exception as e:
    logger.error(f"Step 1 error: {e}")
    return {"errors": [f"Step 1 failed: {str(e)}"]}
```

## Convenções de Type Hints

### Uso de Type Hints
- **Obrigatório:** Para todas as funções públicas
- **Recomendado:** Para todas as funções
- **Exemplos:**
```python
def process_step1(task: str) -> str:
    """Processa primeiro passo do workflow"""
    pass

def route(self, task_type: str, complexity: float, budget: Optional[float] = None) -> RoutingDecision:
    """Roteia tarefa para providers apropriados"""
    pass
```

## Convenções de Documentação

### Docstrings
- **Formato:** Google Style ou Sphinx Style
- **Obrigatório:** Para todas as classes e funções públicas
- **Exemplo:**
```python
def generate_code(task: str) -> str:
    """Gera código baseado na tarefa.
    
    Args:
        task: Descrição da tarefa.
        
    Returns:
        Código gerado.
    """
    pass
```

## Convenções de Testes

### Funções de Teste
- **Prefixo:** `test_`
- **Exemplos:** `test_generate_code()`, `test_route()`
- **Asserts:** Usar `assert` com mensagens descritivas

## Convenções Específicas para LLMs 20B

### Modularização
- **Limite:** Funções < 50 linhas quando possível
- **Classes:** < 200 linhas quando possível
- **Módulos:** < 500 linhas quando possível

### Contexto
- **Evitar:** Funções muito longas que excedem contexto
- **Preferir:** Múltiplas funções menores
- **Benefício:** Melhor para LLMs 20B com contexto limitado

### Claridade
- **Evitar:** Lógica complexa em uma linha
- **Preferir:** Múltiplas linhas com comentários
- **Benefício:** Melhor para LLMs 20B entenderem

## Exemplo Completo

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== STUB IMPLEMENTATIONS =====
def process_task(task: str) -> str:
    """Processa tarefa (STUB)"""
    # Em produção, chamar LLM
    return f"Result for: {task}"
# ===== END STUB IMPLEMENTATIONS =====

@dataclass
class TaskResult:
    """Resultado de tarefa"""
    task: str
    result: str
    success: bool

class TaskProcessor:
    """Processador de tarefas"""
    
    def __init__(self):
        self.tasks: List[str] = []
    
    def add_task(self, task: str):
        """Adiciona tarefa"""
        self.tasks.append(task)
        logger.info(f"Added task: {task}")
    
    def process_all(self) -> List[TaskResult]:
        """Processa todas as tarefas"""
        results = []
        
        for task in self.tasks:
            try:
                result = process_task(task)
                logger.info(f"Processed task: {task}")
                results.append(TaskResult(task=task, result=result, success=True))
            except Exception as e:
                logger.error(f"Error processing task {task}: {e}")
                results.append(TaskResult(task=task, result="", success=False))
        
        return results
```

## Referências

- PEP 8: https://peps.python.org/pep-0008/
- PEP 484: https://peps.python.org/pep-0484/
- Google Style Docstrings: https://google.github.io/styleguide/pyguide.html
