# Configuration Management

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar configuration management baseado em gaps competitivos

## Visão Geral

Configuration management é crítico para flexibilidade e deployability. Diferente de configuração hard-coded, IDEIA_aci precisa de config management com hierarchical config, config validation, config hot-reload e config encryption.

## Arquitetura de Configuration Management

### Componentes

```
┌─────────────────────────────────────┐
│   Config Loader                      │  ← Carregamento de config
├─────────────────────────────────────┤
│   Config Validator                   │  ← Validação de config
├─────────────────────────────────────┤
│   Config Merger                      │  ← Merge de configs
├─────────────────────────────────────┤
│   Config Encryptor                   │  ← Criptografia de secrets
├─────────────────────────────────────┤
│   Config Watcher                     │  ← Hot-reload de config
└─────────────────────────────────────┘
```

## Gap 1: Hierarchical Configuration

### Conceito

Configuração hierárquica com múltiplas fontes (default, user, project, environment). Diferente de config única, hierarchical config permite flexibilidade.

### Dependências

```python
pip install pyyaml
```

### Implementação com Hierarchical Config

```python
from typing import Dict, Any, Optional
from dataclasses import dataclass
import yaml
import json
import os

@dataclass
class ConfigSource:
    """Fonte de configuração"""
    name: str
    path: str
    priority: int  # Menor = maior prioridade

class HierarchicalConfig:
    """Configuração hierárquica"""
    
    def __init__(self):
        self.sources: list[ConfigSource] = []
        self.merged_config: Dict[str, Any] = {}
    
    def add_source(self, source: ConfigSource):
        """Adiciona fonte de config"""
        self.sources.append(source)
        self.sources.sort(key=lambda s: s.priority)
    
    def load(self) -> Dict[str, Any]:
        """Carrega e merge configs"""
        merged = {}
        
        for source in self.sources:
            config = self._load_source(source)
            merged = self._merge_configs(merged, config)
        
        self.merged_config = merged
        return merged
    
    def _load_source(self, source: ConfigSource) -> Dict[str, Any]:
        """Carrega config de uma fonte"""
        if not os.path.exists(source.path):
            return {}
        
        ext = os.path.splitext(source.path)[1].lower()
        
        if ext == ".yaml" or ext == ".yml":
            with open(source.path, "r") as f:
                return yaml.safe_load(f) or {}
        elif ext == ".json":
            with open(source.path, "r") as f:
                return json.load(f)
        
        return {}
    
    def _merge_configs(self, base: Dict, override: Dict) -> Dict:
        """Merge de configs (override sobrescreve base)"""
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def get(self, key: str, default: Any = None) -> Any:
        """Recupera valor de config"""
        keys = key.split(".")
        value = self.merged_config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value

# Uso
config = HierarchicalConfig()

# Adicionar fontes (ordem de prioridade)
config.add_source(ConfigSource(
    name="default",
    path="config/default.yaml",
    priority=3
))

config.add_source(ConfigSource(
    name="environment",
    path="config/production.yaml",
    priority=2
))

config.add_source(ConfigSource(
    name="user",
    path="config/user.yaml",
    priority=1
))

# Carregar
loaded_config = config.load()

# Recuperar valores
model = config.get("llm.model", "gpt-4o")
print(f"Model: {model}")
```

## Gap 2: Config Validation

### Conceito

Validação de configuração com schemas. Diferente de config sem validação, config validation previne erros de configuração.

### Implementação com Config Validation

```python
from typing import Dict, Any, List
from dataclasses import dataclass
import jsonschema

@dataclass
class ConfigSchema:
    """Schema de configuração"""
    schema: Dict[str, Any]

class ConfigValidator:
    """Validador de configuração"""
    
    def __init__(self):
        self.schemas: Dict[str, ConfigSchema] = {}
        self._load_schemas()
    
    def _load_schemas(self):
        """Carrega schemas padrão"""
        self.schemas["llm"] = ConfigSchema({
            "type": "object",
            "properties": {
                "model": {"type": "string"},
                "provider": {"type": "string"},
                "api_key": {"type": "string"},
                "max_tokens": {"type": "integer", "minimum": 1}
            },
            "required": ["model", "provider"]
        })
        
        self.schemas["agent"] = ConfigSchema({
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "max_retries": {"type": "integer", "minimum": 0},
                "timeout": {"type": "number", "minimum": 0}
            },
            "required": ["type"]
        })
    
    def validate(self, config: Dict[str, Any], schema_name: str) -> tuple[bool, List[str]]:
        """Valida config contra schema"""
        if schema_name not in self.schemas:
            return False, [f"Schema {schema_name} not found"]
        
        schema = self.schemas[schema_name].schema
        
        try:
            jsonschema.validate(config, schema)
            return True, []
        except jsonschema.ValidationError as e:
            return False, [str(e)]
    
    def validate_all(self, config: Dict[str, Any]) -> Dict[str, tuple[bool, List[str]]]:
        """Valida config contra todos os schemas aplicáveis"""
        results = {}
        
        for section in config:
            if section in self.schemas:
                results[section] = self.validate(config[section], section)
        
        return results

# Uso
validator = ConfigValidator()

config = {
    "llm": {
        "model": "gpt-4o",
        "provider": "openai",
        "api_key": "sk-...",
        "max_tokens": 4096
    },
    "agent": {
        "type": "code_generator",
        "max_retries": 3,
        "timeout": 30.0
    }
}

# Validar
results = validator.validate_all(config)

for section, (valid, errors) in results.items():
    if valid:
        print(f"{section}: Valid")
    else:
        print(f"{section}: Invalid - {errors}")
```

## Gap 3: Config Hot-Reload

### Conceito

Hot-reload de configuração sem restart. Diferente de config estática, hot-reload permite atualização em tempo real.

### Implementação com Config Hot-Reload

```python
import os
import time
from typing import Callable, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ConfigWatcher(FileSystemEventHandler):
    """Watcher de mudanças de config"""
    
    def __init__(self, config_path: str, on_change: Callable):
        self.config_path = config_path
        self.on_change = on_change
    
    def on_modified(self, event):
        """Chamado quando arquivo é modificado"""
        if event.src_path == self.config_path:
            print(f"Config file changed: {self.config_path}")
            self.on_change()

class ConfigHotReload:
    """Hot-reload de configuração"""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.observer = Observer()
        self.watcher = ConfigWatcher(config_path, self._on_config_change)
        self.config: Optional[Dict] = None
        self.callbacks: list[Callable] = []
    
    def _on_config_change(self):
        """Callback quando config muda"""
        print("Reloading configuration...")
        self.config = self._load_config()
        
        # Notificar callbacks
        for callback in self.callbacks:
            callback(self.config)
    
    def _load_config(self) -> Dict:
        """Carrega config do arquivo"""
        # Implementação de carregamento aqui
        return {}
    
    def add_callback(self, callback: Callable):
        """Adiciona callback para mudanças de config"""
        self.callbacks.append(callback)
    
    def start(self):
        """Inicia watcher"""
        self.observer.schedule(self.watcher, path=os.path.dirname(self.config_path))
        self.observer.start()
        print(f"Watching config file: {self.config_path}")
    
    def stop(self):
        """Para watcher"""
        self.observer.stop()
        self.observer.join()

# Uso
def on_config_change(config: Dict):
    """Callback de exemplo"""
    print(f"Config updated: {config}")

hot_reload = ConfigHotReload("config/production.yaml")
hot_reload.add_callback(on_config_change)
hot_reload.start()

# Manter rodando
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    hot_reload.stop()
```

## Recomendações de Implementação

### Para MVP
1. **Hierarchical config básico:** Implementar com 2-3 fontes
2. **Config validation básico:** Implementar com jsonschema
3. **Config hot-reload básico:** Implementar com watchdog

### Para Produção
1. **Hierarchical config avançado:** Implementar com 5+ fontes e merge complexo
2. **Config validation avançado:** Implementar com schemas detalhados
3. **Config hot-reload avançado:** Implementar com reload seletivo e rollback
4. **Config encryption:** Implementar criptografia de secrets

## Integração com IDEIA-master

O package `config-engine` do IDEIA-master pode ser usado como base para implementação de configuration management no IDEIA_aci.

## Referências

- Pydantic: https://pydantic-docs.helpmanual.io/
- JSON Schema: https://json-schema.org/
- Watchdog: https://python-watchdog.readthedocs.io/
