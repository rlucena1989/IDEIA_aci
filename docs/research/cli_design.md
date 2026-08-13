# CLI Design

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar CLI Design baseado em gaps competitivos

## Visão Geral

CLI é o ponto de entrada principal para IDEIA_aci. Diferente de CLIs básicas, IDEIA_aci precisa de CLI avançada com interactive mode, streaming output, progress tracking, auto-completion e plugin system.

## Arquitetura de CLI

### Componentes

```
┌─────────────────────────────────────┐
│   CLI Parser                         │  ← Parsing de comandos
├─────────────────────────────────────┤
│   Command Executor                   │  ← Execução de comandos
├─────────────────────────────────────┤
│   Output Formatter                   │  ← Formatação de output
├─────────────────────────────────────┤
│   Progress Tracker                   │  ← Tracking de progresso
├─────────────────────────────────────┤
│   Plugin System                      │  ← Sistema de plugins
└─────────────────────────────────────┘
```

## Gap 1: Interactive Mode

### Conceito

Modo interativo para workflows complexos. Diferente de CLI batch-only, interactive mode permite feedback em tempo real.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Interactive Mode

```python
from typing import Dict, Optional
import cmd
import sys

class InteractiveCLI(cmd.Cmd):
    """CLI interativo"""
    
    intro = "IDEIA_aci Interactive CLI. Type 'help' for commands."
    prompt = "(ideia) "
    
    def __init__(self):
        super().__init__()
        self.session_state: Dict = {}
    
    def do_task(self, args: str):
        """Executa tarefa: task <description>"""
        if not args:
            print("Error: task description required")
            return
        
        print(f"Executing task: {args}")
        # Lógica de execução aqui
    
    def do_plan(self, args: str):
        """Gera plano: plan <description>"""
        if not args:
            print("Error: task description required")
            return
        
        print(f"Generating plan for: {args}")
        # Lógica de geração de plano aqui
    
    def do_status(self, args: str):
        """Mostra status: status"""
        print(f"Session state: {self.session_state}")
    
    def do_exit(self, args: str):
        """Sai do CLI: exit"""
        print("Exiting...")
        return True
    
    def default(self, line: str):
        """Comando não reconhecido"""
        print(f"Unknown command: {line}")
        print("Type 'help' for available commands")

# Uso
if __name__ == "__main__":
    cli = InteractiveCLI()
    cli.cmdloop()
```

## Gap 2: Streaming Output

### Conceito

Output streaming para feedback em tempo real. Diferente de output batch, streaming permite visualização progressiva.

### Implementação com Streaming Output

```python
import sys
import time
from typing import Iterator

def stream_output(generator: Iterator[str]):
    """Stream output de um generator"""
    for chunk in generator:
        sys.stdout.write(chunk)
        sys.stdout.flush()
        time.sleep(0.1)  # Simular latência

def task_generator() -> Iterator[str]:
    """Generator que simula output de tarefa"""
    yield "Analyzing codebase...\n"
    time.sleep(0.5)
    yield "Found 10 files\n"
    time.sleep(0.5)
    yield "Generating plan...\n"
    time.sleep(0.5)
    yield "Plan complete: 5 steps\n"

# Uso
print("Streaming output:")
stream_output(task_generator())
```

## Gap 3: Progress Tracking

### Conceito

Tracking de progresso para tarefas longas. Diferente de sem feedback, progress tracking mostra status detalhado.

### Implementação com Progress Tracking

```python
from typing import Optional
from dataclasses import dataclass
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class TaskProgress:
    """Progresso de tarefa"""
    task_id: str
    status: TaskStatus
    current_step: int
    total_steps: int
    message: str
    percentage: float = 0.0
    
    def update(self, step: int, message: str):
        """Atualiza progresso"""
        self.current_step = step
        self.message = message
        self.percentage = (step / self.total_steps) * 100 if self.total_steps > 0 else 0

class ProgressTracker:
    """Rastreador de progresso"""
    
    def __init__(self):
        self.tasks: Dict[str, TaskProgress] = {}
    
    def create_task(self, task_id: str, total_steps: int) -> TaskProgress:
        """Cria tarefa"""
        progress = TaskProgress(
            task_id=task_id,
            status=TaskStatus.PENDING,
            current_step=0,
            total_steps=total_steps,
            message="Pending"
        )
        self.tasks[task_id] = progress
        return progress
    
    def update_task(self, task_id: str, step: int, message: str):
        """Atualiza tarefa"""
        if task_id not in self.tasks:
            return
        
        self.tasks[task_id].update(step, message)
        self._display_progress(task_id)
    
    def complete_task(self, task_id: str):
        """Marca tarefa como completa"""
        if task_id not in self.tasks:
            return
        
        self.tasks[task_id].status = TaskStatus.COMPLETED
        self.tasks[task_id].message = "Completed"
        self._display_progress(task_id)
    
    def fail_task(self, task_id: str, error: str):
        """Marca tarefa como falha"""
        if task_id not in self.tasks:
            return
        
        self.tasks[task_id].status = TaskStatus.FAILED
        self.tasks[task_id].message = f"Failed: {error}"
        self._display_progress(task_id)
    
    def _display_progress(self, task_id: str):
        """Exibe progresso"""
        progress = self.tasks[task_id]
        
        # Barra de progresso
        bar_length = 50
        filled = int(bar_length * progress.percentage / 100)
        bar = "█" * filled + "░" * (bar_length - filled)
        
        print(f"\r[{bar}] {progress.percentage:.1f}% - {progress.message}", end="")
        
        if progress.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            print()  # Nova linha ao completar

# Uso
tracker = ProgressTracker()

# Criar tarefa
progress = tracker.create_task("task_1", total_steps=5)

# Atualizar progresso
for i in range(1, 6):
    tracker.update_task("task_1", i, f"Step {i} of 5")
    time.sleep(0.5)

# Completar
tracker.complete_task("task_1")
```

## Gap 4: Auto-Completion

### Conceito

Auto-completion de comandos e argumentos. Diferente de CLI sem completion, auto-completion melhora UX.

### Implementação com Auto-Completion

```python
import readline
import rlcompleter

class AutoCompleter:
    """Auto-completer para CLI"""
    
    def __init__(self):
        self.commands = {
            "task": ["--model", "--provider", "--budget", "--timeout"],
            "plan": ["--model", "--provider", "--output"],
            "status": [],
            "help": [],
            "exit": []
        }
    
    def complete(self, text: str, state: int) -> Optional[str]:
        """Função de completion"""
        buffer = readline.get_line_buffer()
        line = readline.get_line_buffer().split()
        
        if not line:
            return None
        
        # Completar comando
        if len(line) == 1:
            matches = [cmd for cmd in self.commands.keys() if cmd.startswith(text)]
            if state < len(matches):
                return matches[state]
        
        # Completar argumentos
        elif len(line) > 1:
            cmd = line[0]
            if cmd in self.commands:
                args = self.commands[cmd]
                matches = [arg for arg in args if arg.startswith(text)]
                if state < len(matches):
                    return matches[state]
        
        return None

# Configurar readline
completer = AutoCompleter()
readline.set_completer(completer.complete)
readline.parse_and_bind("tab: complete")

# Loop de input
while True:
    cmd = input("(ideia) ")
    
    if cmd == "exit":
        break
    
    print(f"Executed: {cmd}")
```

## Recomendações de Implementação

### Para MVP
1. **Interactive mode básico:** Implementar com cmd.Cmd
2. **Streaming output básico:** Implementar com generators
3. **Progress tracking básico:** Implementar com barra de progresso

### Para Produção
1. **Interactive mode avançado:** Implementar com rich, prompt_toolkit
2. **Streaming output avançado:** Implementar com streaming real de LLM
3. **Progress tracking avançado:** Implementar com tracking detalhado de sub-tarefas
4. **Auto-completion:** Implementar com completion de comandos e argumentos
5. **Plugin system:** Implementar com extensibilidade de comandos

## Integração com IDEIA-master

Os packages do IDEIA-master relevantes:
- `cli`: Para CLI básica
- `cli-framework`: Para framework de CLI

## Referências

- Click: https://click.palletsprojects.com/
- Typer: https://typer.tiangolo.com/
- Rich: https://rich.readthedocs.io/
- Prompt Toolkit: https://python-prompt-toolkit.readthedocs.io/
