# LSP Integration

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar LSP Integration baseado em gaps competitivos

## Visão Geral

LSP (Language Server Protocol) permite integração com IDEs. Diferente de sem integração, LSP integration permite que IDEIA_aci forneça features de IDE (autocomplete, diagnostics, etc.).

## Arquitetura de LSP Integration

### Componentes

```
┌─────────────────────────────────────┐
│   LSP Server                         │  ← Servidor LSP
├─────────────────────────────────────┤
│   LSP Client                         │  ← Cliente LSP
├─────────────────────────────────────┤
│   LSP Protocol Handler               │  ← Handler de protocolo
├─────────────────────────────────────┤
│   LSP Feature Provider               │  ← Provider de features
├─────────────────────────────────────┤
│   LSP Adapter                        │  ← Adapter para IDEs
└─────────────────────────────────────┘
```

## Gap 1: LSP Server Implementation

### Conceito

Implementação de servidor LSP customizado. Diferente de usar LSP existente, custom LSP permite features específicas de IA.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com LSP Server

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import json

@dataclass
class LSPMessage:
    """Mensagem LSP"""
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict] = None
    result: Optional[any] = None
    error: Optional[Dict] = None

class LSPServer:
    """Servidor LSP"""
    
    def __init__(self):
        self.capabilities = {
            "textDocumentSync": 1,
            "completionProvider": {
                "triggerCharacters": [".", "(", "["],
                "resolveProvider": True
            },
            "hoverProvider": True,
            "definitionProvider": True,
            "referencesProvider": True,
            "codeActionProvider": True
        }
        self.documents: Dict[str, str] = {}  # uri -> content
    
    def handle_message(self, message: str) -> str:
        """Handle mensagem LSP"""
        msg = json.loads(message)
        lsp_msg = LSPMessage(**msg)
        
        if lsp_msg.method == "initialize":
            return self._handle_initialize(lsp_msg)
        elif lsp_msg.method == "initialized":
            return self._handle_initialized(lsp_msg)
        elif lsp_msg.method == "textDocument/didOpen":
            return self._handle_did_open(lsp_msg)
        elif lsp_msg.method == "textDocument/completion":
            return self._handle_completion(lsp_msg)
        elif lsp_msg.method == "textDocument/hover":
            return self._handle_hover(lsp_msg)
        else:
            return self._error_response(lsp_msg.id, -32601, "Method not found")
    
    def _handle_initialize(self, msg: LSPMessage) -> str:
        """Handle initialize"""
        response = LSPMessage(
            id=msg.id,
            result={
                "capabilities": self.capabilities,
                "serverInfo": {
                    "name": "IDEIA_aci LSP",
                    "version": "1.0.0"
                }
            }
        )
        return json.dumps(response.__dict__)
    
    def _handle_initialized(self, msg: LSPMessage) -> str:
        """Handle initialized"""
        return json.dumps(LSPMessage(id=msg.id, result={}).__dict__)
    
    def _handle_did_open(self, msg: LSPMessage) -> str:
        """Handle didOpen"""
        uri = msg.params["textDocument"]["uri"]
        content = msg.params["textDocument"]["text"]
        self.documents[uri] = content
        return json.dumps(LSPMessage(id=msg.id, result={}).__dict__)
    
    def _handle_completion(self, msg: LSPMessage) -> str:
        """Handle completion"""
        uri = msg.params["textDocument"]["uri"]
        line = msg.params["position"]["line"]
        character = msg.params["position"]["character"]
        
        # Gerar sugestões (simulado)
        completions = [
            {
                "label": "function_name",
                "kind": 3,  # Function
                "detail": "Custom function",
                "documentation": "A custom function from IDEIA_aci"
            },
            {
                "label": "variable_name",
                "kind": 6,  # Variable
                "detail": "Custom variable",
                "documentation": "A custom variable from IDEIA_aci"
            }
        ]
        
        response = LSPMessage(
            id=msg.id,
            result={
                "isIncomplete": False,
                "items": completions
            }
        )
        return json.dumps(response.__dict__)
    
    def _handle_hover(self, msg: LSPMessage) -> str:
        """Handle hover"""
        uri = msg.params["textDocument"]["uri"]
        
        # Gerar hover info (simulado)
        hover_info = {
            "contents": {
                "kind": "markdown",
                "value": "## IDEIA_aci Context\n\nThis is AI-generated context."
            }
        }
        
        response = LSPMessage(id=msg.id, result=hover_info)
        return json.dumps(response.__dict__)
    
    def _error_response(self, msg_id: str, code: int, message: str) -> str:
        """Gera resposta de erro"""
        response = LSPMessage(
            id=msg_id,
            error={
                "code": code,
                "message": message
            }
        )
        return json.dumps(response.__dict__)

# Uso
lsp_server = LSPServer()

# Simular mensagem initialize
init_msg = {
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
        "processId": 1234,
        "rootUri": "file:///path/to/project"
    }
}

response = lsp_server.handle_message(json.dumps(init_msg))
print(f"Initialize response: {response}")
```

## Gap 2: AI-Aware Features

### Conceito

Features LSP específicas para IA (sugestões baseadas em contexto, diagnostics de IA). Diferente de LSP padrão, AI-aware features integra IA no IDE.

### Implementação com AI-Aware Features

```python
from typing import Dict, List

class AIAwareLSPFeatures:
    """Features LSP aware de IA"""
    
    def __init__(self):
        self.context_store: Dict[str, Dict] = {}
    
    def generate_ai_completion(self, uri: str, position: Dict, context: str) -> List[Dict]:
        """Gera completion baseado em IA"""
        # Em produção, usar LLM real
        completions = []
        
        # Analisar contexto
        if "def " in context:
            completions.append({
                "label": "def ai_function():",
                "kind": 3,
                "detail": "AI-generated function",
                "documentation": "Function generated by AI based on context"
            })
        
        if "class " in context:
            completions.append({
                "label": "class AIClass:",
                "kind": 5,
                "detail": "AI-generated class",
                "documentation": "Class generated by AI based on context"
            })
        
        return completions
    
    def generate_ai_diagnostics(self, uri: str, content: str) -> List[Dict]:
        """Gera diagnostics baseado em IA"""
        diagnostics = []
        
        # Detectar padrões (simulado)
        if "TODO" in content:
            diagnostics.append({
                "range": {
                    "start": {"line": 0, "character": 0},
                    "end": {"line": 0, "character": 4}
                },
                "severity": 2,  # Warning
                "message": "TODO detected - consider implementing",
                "source": "IDEIA_aci AI"
            })
        
        if "FIXME" in content:
            diagnostics.append({
                "range": {
                    "start": {"line": 0, "character": 0},
                    "end": {"line": 0, "character": 5}
                },
                "severity": 1,  # Error
                "message": "FIXME detected - needs attention",
                "source": "IDEIA_aci AI"
            })
        
        return diagnostics
    
    def generate_ai_code_actions(self, uri: str, range: Dict, content: str) -> List[Dict]:
        """Gera code actions baseado em IA"""
        actions = []
        
        # Sugerir refatoração (simulado)
        actions.append({
            "title": "AI: Refactor this function",
            "kind": "refactor",
            "edit": {
                "range": range,
                "newText": "# AI-refactored code\npass"
            }
        })
        
        actions.append({
            "title": "AI: Add documentation",
            "kind": "quickfix",
            "edit": {
                "range": range,
                "newText": '"""\nAI-generated documentation\n"""\n'
            }
        })
        
        return actions

# Uso
ai_features = AIAwareLSPFeatures()

# Gerar completion
completions = ai_features.generate_ai_completion("file.py", {"line": 5, "character": 10}, "def ")
print(f"AI completions: {completions}")

# Gerar diagnostics
diagnostics = ai_features.generate_ai_diagnostics("file.py", "# TODO: implement this")
print(f"AI diagnostics: {diagnostics}")
```

## Gap 3: Multi-Language Support

### Conceito

Suporte a múltiplas linguagens via LSP. Diferente de single-language, multi-language permite uso com diferentes stacks.

### Implementação com Multi-Language

```python
from typing import Dict, Optional

class MultiLanguageLSP:
    """LSP multi-linguagem"""
    
    def __init__(self):
        self.language_servers: Dict[str, LSPServer] = {}
        self.language_configs: Dict[str, Dict] = {
            "python": {
                "extensions": [".py"],
                "command": "pylsp",
                "args": []
            },
            "javascript": {
                "extensions": [".js", ".jsx"],
                "command": "typescript-language-server",
                "args": ["--stdio"]
            },
            "typescript": {
                "extensions": [".ts", ".tsx"],
                "command": "typescript-language-server",
                "args": ["--stdio"]
            },
            "go": {
                "extensions": [".go"],
                "command": "gopls",
                "args": ["serve"]
            }
        }
    
    def detect_language(self, uri: str) -> Optional[str]:
        """Detecta linguagem do arquivo"""
        for lang, config in self.language_configs.items():
            for ext in config["extensions"]:
                if uri.endswith(ext):
                    return lang
        return None
    
    def get_server_for_language(self, language: str) -> Optional[LSPServer]:
        """Retorna servidor LSP para linguagem"""
        if language not in self.language_servers:
            # Criar servidor customizado ou usar existente
            self.language_servers[language] = LSPServer()
        
        return self.language_servers[language]
    
    def handle_message(self, uri: str, message: str) -> str:
        """Roteia mensagem para servidor apropriado"""
        language = self.detect_language(uri)
        
        if not language:
            return self._error_response("Unsupported language")
        
        server = self.get_server_for_language(language)
        
        if not server:
            return self._error_response("Server not available")
        
        return server.handle_message(message)
    
    def _error_response(self, message: str) -> str:
        """Gera resposta de erro"""
        return json.dumps({
            "jsonrpc": "2.0",
            "error": {
                "code": -32600,
                "message": message
            }
        })

# Uso
multi_lsp = MultiLanguageLSP()

# Detectar linguagem
lang = multi_lsp.detect_language("file:///path/to/main.py")
print(f"Detected language: {lang}")

lang = multi_lsp.detect_language("file:///path/to/app.js")
print(f"Detected language: {lang}")
```

## Recomendações de Implementação

### Para MVP
1. **LSP server básico:** Implementar com features essenciais (completion, hover)
2. **AI-aware features básico:** Implementar com sugestões simples
3. **Multi-language básico:** Implementar com Python e JavaScript

### Para Produção
1. **LSP server avançado:** Implementar com todas as features LSP
2. **AI-aware features avançado:** Implementar com LLM real para sugestões
3. **Multi-language avançado:** Implementar com 10+ linguagens
4. **LSP adapter:** Implementar adapter para IDEs específicos (VS Code, JetBrains)

## Integração com IDEIA-master

O package `lsp-integration` do IDEIA-master pode ser usado como base para implementação de LSP integration no IDEIA_aci.

## Referências

- LSP Specification: https://microsoft.github.io/language-server-protocol/
- PyLSP: https://github.com/python-lsp/python-lsp-server
- TypeScript LSP: https://github.com/typescript-language-server/typescript-language-server
