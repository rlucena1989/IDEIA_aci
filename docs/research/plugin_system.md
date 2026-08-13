# Plugin System

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Plugin System baseado em gaps competitivos

## Visão Geral

Plugin System permite extensibilidade do IDEIA_aci. Diferente de sistema monolítico, plugin system permite que terceiros adicionem funcionalidades.

## Arquitetura de Plugin System

### Componentes

```
┌─────────────────────────────────────┐
│   Plugin Loader                      │  ← Carregamento de plugins
├─────────────────────────────────────┤
│   Plugin Registry                    │  ← Registro de plugins
├─────────────────────────────────────┤
│   Plugin Manager                     │  ← Gerenciamento de plugins
├─────────────────────────────────────┤
│   Plugin SDK                         │  ← SDK para desenvolvedores
├─────────────────────────────────────┤
│   Plugin Marketplace                 │  ← Marketplace de plugins
└─────────────────────────────────────┘
```

## Gap 1: Plugin Architecture

### Conceito

Arquitetura de plugins com hooks e extensions. Diferente de plugins acoplados, plugin architecture permite extensão desacoplada.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Plugin Architecture

```python
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
import importlib
import sys

@dataclass
class PluginManifest:
    """Manifesto de plugin"""
    plugin_id: str
    name: str
    version: str
    description: str
    author: str
    hooks: List[str]
    dependencies: List[str]

class Plugin:
    """Plugin base"""
    def __init__(self, manifest: PluginManifest):
        self.manifest = manifest
        self.hooks: Dict[str, List[Callable]] = {}
    
    def register_hook(self, hook_name: str, callback: Callable):
        """Registra callback para hook"""
        if hook_name not in self.hooks:
            self.hooks[hook_name] = []
        self.hooks[hook_name].append(callback)
    
    def execute_hook(self, hook_name: str, *args, **kwargs) -> List:
        """Executa callbacks de um hook"""
        results = []
        
        if hook_name in self.hooks:
            for callback in self.hooks[hook_name]:
                try:
                    result = callback(*args, **kwargs)
                    results.append(result)
                except Exception as e:
                    print(f"Error in hook {hook_name}: {e}")
        
        return results

class PluginLoader:
    """Carregador de plugins"""
    
    def __init__(self):
        self.plugins: Dict[str, Plugin] = {}
        self.plugin_paths: List[str] = []
    
    def add_plugin_path(self, path: str):
        """Adiciona path de plugins"""
        if path not in self.plugin_paths:
            self.plugin_paths.append(path)
            if path not in sys.path:
                sys.path.insert(0, path)
    
    def load_plugin(self, plugin_module: str) -> Optional[Plugin]:
        """Carrega plugin"""
        try:
            module = importlib.import_module(plugin_module)
            
            # Plugin deve ter função get_manifest()
            if not hasattr(module, "get_manifest"):
                print(f"Plugin {plugin_module} missing get_manifest()")
                return None
            
            manifest = module.get_manifest()
            plugin = Plugin(manifest)
            
            # Plugin pode ter função register()
            if hasattr(module, "register"):
                module.register(plugin)
            
            self.plugins[manifest.plugin_id] = plugin
            print(f"Loaded plugin: {manifest.name} v{manifest.version}")
            
            return plugin
        
        except Exception as e:
            print(f"Error loading plugin {plugin_module}: {e}")
            return None
    
    def unload_plugin(self, plugin_id: str):
        """Descarrega plugin"""
        if plugin_id in self.plugins:
            del self.plugins[plugin_id]
            print(f"Unloaded plugin: {plugin_id}")
    
    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        """Retorna plugin por ID"""
        return self.plugins.get(plugin_id)
    
    def list_plugins(self) -> List[Dict]:
        """Lista plugins carregados"""
        return [
            {
                "plugin_id": plugin_id,
                "name": plugin.manifest.name,
                "version": plugin.manifest.version,
                "author": plugin.manifest.author
            }
            for plugin_id, plugin in self.plugins.items()
        ]

# Uso
plugin_loader = PluginLoader()

# Adicionar path
plugin_loader.add_plugin_path("./plugins")

# Simular carregamento de plugin
# Em produção, isso carregarian módulos Python reais
print("Plugin loader ready")
```

## Gap 2: Plugin SDK

### Conceito

SDK para desenvolvimento de plugins. Diferente de sem SDK, plugin SDK facilita desenvolvimento de plugins.

### Implementação com Plugin SDK

```python
from typing import Dict, List, Callable, Optional
from abc import ABC, abstractmethod

class PluginSDK:
    """SDK para desenvolvimento de plugins"""
    
    @staticmethod
    def create_manifest(plugin_id: str, name: str, version: str, description: str, author: str, hooks: List[str]) -> PluginManifest:
        """Cria manifesto de plugin"""
        return PluginManifest(
            plugin_id=plugin_id,
            name=name,
            version=version,
            description=description,
            author=author,
            hooks=hooks,
            dependencies=[]
        )
    
    @staticmethod
    def register_hook(plugin: Plugin, hook_name: str, callback: Callable):
        """Registra hook"""
        plugin.register_hook(hook_name, callback)
    
    @staticmethod
    def create_command_hook(command_name: str, handler: Callable) -> Callable:
        """Cria hook de comando"""
        def command_hook(context: Dict):
            return handler(context)
        return command_hook
    
    @staticmethod
    def create_filter_hook(filter_name: str, predicate: Callable) -> Callable:
        """Cria hook de filtro"""
        def filter_hook(data: Dict) -> bool:
            return predicate(data)
        return filter_hook

class PluginBase(ABC):
    """Classe base para plugins"""
    
    def __init__(self):
        self.manifest: Optional[PluginManifest] = None
    
    @abstractmethod
    def get_manifest(self) -> PluginManifest:
        """Retorna manifesto do plugin"""
        pass
    
    def register(self, plugin: Plugin):
        """Registra hooks no plugin"""
        pass
    
    def on_load(self):
        """Chamado quando plugin é carregado"""
        pass
    
    def on_unload(self):
        """Chamado quando plugin é descarregado"""
        pass

# Exemplo de plugin usando SDK
class ExamplePlugin(PluginBase):
    """Plugin de exemplo"""
    
    def get_manifest(self) -> PluginManifest:
        return PluginSDK.create_manifest(
            plugin_id="example_plugin",
            name="Example Plugin",
            version="1.0.0",
            description="An example plugin",
            author="IDEIA_aci",
            hooks=["before_task", "after_task"]
        )
    
    def register(self, plugin: Plugin):
        """Registra hooks"""
        PluginSDK.register_hook(
            plugin,
            "before_task",
            self._before_task_handler
        )
        
        PluginSDK.register_hook(
            plugin,
            "after_task",
            self._after_task_handler
        )
    
    def _before_task_handler(self, context: Dict):
        """Handler de before_task"""
        print(f"ExamplePlugin: Before task - {context.get('task')}")
        return context
    
    def _after_task_handler(self, context: Dict):
        """Handler de after_task"""
        print(f"ExamplePlugin: After task - {context.get('result')}")
        return context

# Uso
example_plugin = ExamplePlugin()
manifest = example_plugin.get_manifest()
print(f"Plugin manifest: {manifest}")
```

## Gap 3: Plugin Security

### Conceito
Segurança de plugins com sandbox e validação. Diferente de plugins sem segurança, plugin security previne código malicioso.

### Implementação com Plugin Security

```python
from typing import Dict, List, Optional
import ast

class PluginSecurityValidator:
    """Validador de segurança de plugins"""
    
    def __init__(self):
        self.forbidden_modules = [
            "os", "subprocess", "eval", "exec", "compile",
            "pickle", "shelve", "marshal", "ctypes"
        ]
        self.forbidden_functions = [
            "eval", "exec", "compile", "__import__",
            "open", "file", "input", "raw_input"
        ]
    
    def validate_code(self, code: str) -> tuple[bool, List[str]]:
        """Valida código de plugin"""
        violations = []
        
        try:
            tree = ast.parse(code)
            
            # Verificar imports proibidos
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name in self.forbidden_modules:
                            violations.append(f"Forbidden import: {alias.name}")
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module in self.forbidden_modules:
                        violations.append(f"Forbidden import from: {node.module}")
                
                elif isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id in self.forbidden_functions:
                            violations.append(f"Forbidden function: {node.func.id}")
        
        except SyntaxError as e:
            violations.append(f"Syntax error: {e}")
        
        return len(violations) == 0, violations
    
    def validate_manifest(self, manifest: PluginManifest) -> tuple[bool, List[str]]:
        """Valida manifesto de plugin"""
        violations = []
        
        # Verificar plugin_id
        if not manifest.plugin_id or not manifest.plugin_id.replace("_", "").replace("-", "").isalnum():
            violations.append("Invalid plugin_id")
        
        # Verificar versão
        if not manifest.version:
            violations.append("Missing version")
        
        return len(violations) == 0, violations

class PluginSandbox:
    """Sandbox para execução de plugins"""
    
    def __init__(self):
        self.allowed_operations = {
            "read": True,
            "write": False,
            "network": False,
            "system": False
        }
    
    def execute_plugin_function(self, plugin: Plugin, function_name: str, *args, **kwargs):
        """Executa função de plugin em sandbox"""
        # Em produção, usar sandbox real (PyPy sandbox, RestrictedPython)
        if function_name not in plugin.hooks:
            raise ValueError(f"Function {function_name} not found in plugin")
        
        # Executar com restrições
        return plugin.execute_hook(function_name, *args, **kwargs)

# Uso
security_validator = PluginSecurityValidator()

# Validar código
code = """
def example_function():
    print("Hello")
"""

is_valid, violations = security_validator.validate_code(code)
print(f"Code validation: {is_valid}, violations: {violations}")
```

## Recomendações de Implementação

### Para MVP
1. **Plugin architecture básico:** Implementar com hooks simples
2. **Plugin SDK básico:** Implementar com classes base
3. **Plugin security básico:** Implementar com validação AST

### Para Produção
1. **Plugin architecture avançado:** Implementar com hooks complexos e eventos
2. **Plugin SDK avançado:** Implementar com documentação completa e exemplos
3. **Plugin security avançado:** Implementar com sandbox real e permissões granulares
4. **Plugin marketplace:** Implementar com marketplace real

## Integração com IDEIA-master

O package `plugin-sdk` do IDEIA-master pode ser usado como base para implementação de plugin system no IDEIA_aci.

## Referências

- Pluggy: https://pluggy.readthedocs.io/
- Plugin System Pattern: https://martinfowler.com/articles/patterns-of-distributed-systems/
