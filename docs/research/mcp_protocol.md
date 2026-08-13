# MCP (Model Context Protocol)

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar MCP baseado em gaps competitivos

## Visão Geral

MCP (Model Context Protocol) é um protocolo para comunicação entre LLMs e ferramentas externas. Diferente de integrações custom, MCP permite interoperabilidade padronizada.

## Arquitetura de MCP

### Componentes

```
┌─────────────────────────────────────┐
│   MCP Client                         │  ← Cliente MCP
├─────────────────────────────────────┤
│   MCP Server                         │  ← Servidor MCP
├─────────────────────────────────────┤
│   MCP Transport                      │  ← Transporte (stdio, SSE, WebSocket)
├─────────────────────────────────────┤
│   MCP Resource Provider              │  ← Provider de recursos
├─────────────────────────────────────┤
│   MCP Tool Provider                  │  ← Provider de ferramentas
└─────────────────────────────────────┘
```

## Gap 1: MCP Server Implementation

### Conceito

Implementação de servidor MCP customizado. Diferente de usar servidor existente, custom MCP server permite ferramentas específicas de IDEIA_aci.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com MCP Server

```python
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
import json

@dataclass
class MCPTool:
    """Ferramenta MCP"""
    name: str
    description: str
    input_schema: Dict
    handler: Callable

@dataclass
class MCPResource:
    """Recurso MCP"""
    uri: str
    name: str
    description: str
    mime_type: str

class MCPServer:
    """Servidor MCP"""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.tools: Dict[str, MCPTool] = {}
        self.resources: Dict[str, MCPResource] = {}
        self.prompts: Dict[str, Dict] = {}
    
    def register_tool(self, tool: MCPTool):
        """Registra ferramenta"""
        self.tools[tool.name] = tool
    
    def register_resource(self, resource: MCPResource):
        """Registra recurso"""
        self.resources[resource.uri] = resource
    
    def register_prompt(self, prompt_id: str, prompt: Dict):
        """Registra prompt"""
        self.prompts[prompt_id] = prompt
    
    def handle_request(self, request: Dict) -> Dict:
        """Handle requisição MCP"""
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "initialize":
            return self._handle_initialize(params)
        elif method == "tools/list":
            return self._handle_tools_list()
        elif method == "tools/call":
            return self._handle_tools_call(params)
        elif method == "resources/list":
            return self._handle_resources_list()
        elif method == "resources/read":
            return self._handle_resources_read(params)
        elif method == "prompts/list":
            return self._handle_prompts_list()
        else:
            return {
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }
    
    def _handle_initialize(self, params: Dict) -> Dict:
        """Handle initialize"""
        return {
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {},
                    "prompts": {}
                },
                "serverInfo": {
                    "name": self.name,
                    "version": self.version
                }
            }
        }
    
    def _handle_tools_list(self) -> Dict:
        """Handle tools/list"""
        return {
            "result": {
                "tools": [
                    {
                        "name": tool.name,
                        "description": tool.description,
                        "inputSchema": tool.input_schema
                    }
                    for tool in self.tools.values()
                ]
            }
        }
    
    def _handle_tools_call(self, params: Dict) -> Dict:
        """Handle tools/call"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name not in self.tools:
            return {
                "error": {
                    "code": -32602,
                    "message": f"Tool not found: {tool_name}"
                }
            }
        
        tool = self.tools[tool_name]
        
        try:
            result = tool.handler(**arguments)
            return {"result": {"content": [{"type": "text", "text": str(result)}]}}
        except Exception as e:
            return {
                "error": {
                    "code": -32603,
                    "message": str(e)
                }
            }
    
    def _handle_resources_list(self) -> Dict:
        """Handle resources/list"""
        return {
            "result": {
                "resources": [
                    {
                        "uri": resource.uri,
                        "name": resource.name,
                        "description": resource.description,
                        "mimeType": resource.mime_type
                    }
                    for resource in self.resources.values()
                ]
            }
        }
    
    def _handle_resources_read(self, params: Dict) -> Dict:
        """Handle resources/read"""
        uri = params.get("uri")
        
        if uri not in self.resources:
            return {
                "error": {
                    "code": -32602,
                    "message": f"Resource not found: {uri}"
                }
            }
        
        # Em produção, ler conteúdo real
        return {
            "result": {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": self.resources[uri].mime_type,
                        "text": "Resource content"
                    }
                ]
            }
        }
    
    def _handle_prompts_list(self) -> Dict:
        """Handle prompts/list"""
        return {
            "result": {
                "prompts": [
                    {
                        "name": prompt_id,
                        **prompt
                    }
                    for prompt_id, prompt in self.prompts.items()
                ]
            }
        }

# Uso
mcp_server = MCPServer(name="IDEIA_aci MCP Server", version="1.0.0")

# Registrar ferramenta
mcp_server.register_tool(MCPTool(
    name="read_file",
    description="Read file content",
    input_schema={
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "File path"}
        },
        "required": ["path"]
    },
    handler=lambda path: f"Content of {path}"
))

# Registrar recurso
mcp_server.register_resource(MCPResource(
    uri="file:///project/README.md",
    name="README",
    description="Project README",
    mime_type="text/markdown"
))

# Handle request
request = {
    "method": "tools/list",
    "params": {}
}

response = mcp_server.handle_request(request)
print(f"Response: {json.dumps(response, indent=2)}")
```

## Gap 2: MCP Client Implementation

### Conceito

Implementação de cliente MCP para conectar a servidores. Diferente de sem cliente, MCP client permite comunicação bidirecional.

### Implementação com MCP Client

```python
from typing import Dict, List, Optional
import json

class MCPClient:
    """Cliente MCP"""
    
    def __init__(self, transport: str = "stdio"):
        self.transport = transport
        self.server_capabilities: Optional[Dict] = None
        self.request_id = 0
    
    def _send_request(self, method: str, params: Dict = None) -> Dict:
        """Envia requisição (simulado)"""
        self.request_id += 1
        
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params or {}
        }
        
        # Em produção, enviar via transporte real
        print(f"Sending: {json.dumps(request)}")
        
        # Simular resposta
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": self.request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {},
                        "resources": {},
                        "prompts": {}
                    }
                }
            }
        
        return {"jsonrpc": "2.0", "id": self.request_id, "result": {}}
    
    def initialize(self, server_name: str, server_version: str) -> Dict:
        """Inicializa conexão com servidor"""
        response = self._send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "IDEIA_aci Client",
                "version": "1.0.0"
            }
        })
        
        self.server_capabilities = response.get("result", {}).get("capabilities", {})
        
        return response
    
    def list_tools(self) -> List[Dict]:
        """Lista ferramentas disponíveis"""
        response = self._send_request("tools/list")
        return response.get("result", {}).get("tools", [])
    
    def call_tool(self, tool_name: str, arguments: Dict) -> Dict:
        """Chama ferramenta"""
        response = self._send_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
        return response.get("result", {})
    
    def list_resources(self) -> List[Dict]:
        """Lista recursos disponíveis"""
        response = self._send_request("resources/list")
        return response.get("result", {}).get("resources", [])
    
    def read_resource(self, uri: str) -> Dict:
        """Lê recurso"""
        response = self._send_request("resources/read", {"uri": uri})
        return response.get("result", {})

# Uso
mcp_client = MCPClient()

# Inicializar
init_response = mcp_client.initialize("IDEIA_aci Server", "1.0.0")
print(f"Initialize response: {init_response}")

# Listar ferramentas
tools = mcp_client.list_tools()
print(f"Available tools: {tools}")

# Chamar ferramenta
result = mcp_client.call_tool("read_file", {"path": "main.py"})
print(f"Tool result: {result}")
```

## Gap 3: MCP Marketplace

### Conceito

Marketplace de servidores MCP para extensibilidade. Diferente de servidores hard-coded, marketplace permite descoberta e instalação de servidores.

### Implementação com MCP Marketplace

```python
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class MCPServerManifest:
    """Manifesto de servidor MCP"""
    server_id: str
    name: str
    description: str
    version: str
    author: str
    capabilities: List[str]
    install_command: str
    config_schema: Dict

class MCPMarketplace:
    """Marketplace de servidores MCP"""
    
    def __init__(self):
        self.servers: Dict[str, MCPServerManifest] = {}
        self.installed_servers: Dict[str, Dict] = {}
    
    def register_server(self, manifest: MCPServerManifest):
        """Registra servidor no marketplace"""
        self.servers[manifest.server_id] = manifest
    
    def search_servers(self, query: str) -> List[MCPServerManifest]:
        """Busca servidores"""
        results = []
        query_lower = query.lower()
        
        for server_id, manifest in self.servers.items():
            if (query_lower in manifest.name.lower() or
                query_lower in manifest.description.lower() or
                any(query_lower in cap.lower() for cap in manifest.capabilities)):
                results.append(manifest)
        
        return results
    
    def install_server(self, server_id: str, config: Dict) -> bool:
        """Instala servidor"""
        if server_id not in self.servers:
            return False
        
        manifest = self.servers[server_id]
        
        # Em produção, executar comando de instalação real
        self.installed_servers[server_id] = {
            "manifest": manifest,
            "config": config,
            "installed_at": "2026-08-12"
        }
        
        return True
    
    def get_installed_servers(self) -> List[Dict]:
        """Retorna servidores instalados"""
        return [
            {
                "server_id": server_id,
                "name": info["manifest"].name,
                "version": info["manifest"].version,
                "config": info["config"]
            }
            for server_id, info in self.installed_servers.items()
        ]

# Uso
marketplace = MCPMarketplace()

# Registrar servidores
marketplace.register_server(MCPServerManifest(
    server_id="filesystem",
    name="Filesystem Server",
    description="Provides filesystem access",
    version="1.0.0",
    author="IDEIA_aci",
    capabilities=["read", "write", "list"],
    install_command="npm install @ideia/mcp-filesystem",
    config_schema={"rootPath": {"type": "string"}}
))

marketplace.register_server(MCPServerManifest(
    server_id="git",
    name="Git Server",
    description="Provides Git operations",
    version="1.0.0",
    author="IDEIA_aci",
    capabilities=["status", "commit", "branch"],
    install_command="npm install @ideia/mcp-git",
    config_schema={"repoPath": {"type": "string"}}
))

# Buscar servidores
results = marketplace.search_servers("filesystem")
print(f"Search results: {[r.name for r in results]}")

# Instalar servidor
success = marketplace.install_server("filesystem", {"rootPath": "/project"})
print(f"Install success: {success}")

# Listar instalados
installed = marketplace.get_installed_servers()
print(f"Installed servers: {installed}")
```

## Recomendações de Implementação

### Para MVP
1. **MCP server básico:** Implementar com tools e resources essenciais
2. **MCP client básico:** Implementar com transporte stdio
3. **MCP marketplace básico:** Implementar com registro manual

### Para Produção
1. **MCP server avançado:** Implementar com todas as features MCP
2. **MCP client avançado:** Implementar com transporte SSE/WebSocket
3. **MCP marketplace avançado:** Implementar com marketplace real e instalação automática

## Integração com IDEIA-master

O package `mcp` do IDEIA-master pode ser usado como base para implementação de MCP no IDEIA_aci.

## Referências

- MCP Specification: https://modelcontextprotocol.io/
- MCP SDK: https://github.com/modelcontextprotocol/python-sdk
