# API Integration

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar API Integration baseado em gaps competitivos

## Visão Geral

API Integration é crítico para integração externa. Diferente de sem integração, API integration permite conectar IDEIA_aci com serviços externos.

## Arquitetura de API Integration

### Componentes

```
┌─────────────────────────────────────┐
│   API Gateway                        │  ← Gateway de APIs
├─────────────────────────────────────┤
│   API Client                         │  ← Cliente de APIs
├─────────────────────────────────────┤
│   API Rate Limiter                   │  ← Rate limiting
├─────────────────────────────────────┤
│   API Cache                          │  ← Cache de APIs
├─────────────────────────────────────┤
│   API Monitor                       │  ← Monitoramento de APIs
└─────────────────────────────────────┘
```

## Gap 1: API Gateway

### Conceito

API Gateway centraliza e gerencia chamadas de API. Diferente de chamadas diretas, API Gateway adiciona segurança, rate limiting e monitoramento.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com API Gateway

```python
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class APIRoute:
    """Rota de API"""
    path: str
    method: str
    handler: Callable
    rate_limit: Optional[int] = None  # requests per minute
    auth_required: bool = False

class APIGateway:
    """Gateway de APIs"""
    
    def __init__(self):
        self.routes: Dict[str, APIRoute] = {}
        self.rate_limits: Dict[str, List[datetime]] = {}
    
    def add_route(self, route: APIRoute):
        """Adiciona rota"""
        route_key = f"{route.method}:{route.path}"
        self.routes[route_key] = route
    
    def check_rate_limit(self, route_key: str, client_id: str) -> bool:
        """Verifica rate limit"""
        route = self.routes.get(route_key)
        
        if not route or not route.rate_limit:
            return True
        
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        key = f"{route_key}:{client_id}"
        
        if key not in self.rate_limits:
            self.rate_limits[key] = []
        
        # Limpar requests antigos
        self.rate_limits[key] = [
            timestamp for timestamp in self.rate_limits[key]
            if timestamp > minute_ago
        ]
        
        # Verificar se excedeu limite
        if len(self.rate_limits[key]) >= route.rate_limit:
            return False
        
        # Adicionar request atual
        self.rate_limits[key].append(now)
        
        return True
    
    def handle_request(self, method: str, path: str, client_id: str, data: Dict = None) -> Dict:
        """Handle request"""
        route_key = f"{method}:{path}"
        
        if route_key not in self.routes:
            return {"error": "Route not found", "status": 404}
        
        route = self.routes[route_key]
        
        # Verificar rate limit
        if not self.check_rate_limit(route_key, client_id):
            return {"error": "Rate limit exceeded", "status": 429}
        
        # Verificar autenticação
        if route.auth_required and not self._check_auth(client_id):
            return {"error": "Unauthorized", "status": 401}
        
        # Executar handler
        try:
            result = route.handler(data or {})
            return {"data": result, "status": 200}
        except Exception as e:
            return {"error": str(e), "status": 500}
    
    def _check_auth(self, client_id: str) -> bool:
        """Verifica autenticação (simulado)"""
        # Em produção, validar token real
        return client_id == "valid_token"

# Uso
gateway = APIGateway()

# Adicionar rotas
gateway.add_route(APIRoute(
    path="/api/llm/generate",
    method="POST",
    handler=lambda data: {"response": "Generated text"},
    rate_limit=10,
    auth_required=True
))

gateway.add_route(APIRoute(
    path="/api/context/get",
    method="GET",
    handler=lambda data: {"context": "Context data"},
    rate_limit=20,
    auth_required=False
))

# Handle requests
response = gateway.handle_request("POST", "/api/llm/generate", "valid_token", {"prompt": "test"})
print(f"Response: {response}")
```

## Gap 2: API Client

### Conceito

Cliente de API com retry e fallback. Diferente de HTTP simples, API Client adiciona resiliência.

### Implementação com API Client

```python
from typing import Dict, Optional, Callable
import time
import random

class APIClient:
    """Cliente de API com retry"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.max_retries = 3
        self.retry_delay = 1.0
    
    def request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Executa request com retry"""
        url = f"{self.base_url}/{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                print(f"Attempt {attempt + 1}/{self.max_retries}")
                
                # Simular request HTTP
                response = self._mock_request(method, url, data)
                
                if response.get("status") == 200:
                    return response
                
                # Se erro, tentar novamente
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    delay = delay * (0.5 + random.random() * 0.5)  # Jitter
                    print(f"Retrying in {delay:.2f}s...")
                    time.sleep(delay)
            
            except Exception as e:
                if attempt < self.max_retries - 1:
                    delay = self.retry_delay * (2 ** attempt)
                    time.sleep(delay)
                else:
                    return {"error": str(e), "status": 500}
        
        return {"error": "Max retries exceeded", "status": 500}
    
    def _mock_request(self, method: str, url: str, data: Dict) -> Dict:
        """Simula request HTTP"""
        # Em produção, usar requests ou httpx
        return {"data": "Response data", "status": 200}

class APIClientPool:
    """Pool de clientes de API"""
    
    def __init__(self):
        self.clients: Dict[str, APIClient] = {}
    
    def register_client(self, name: str, client: APIClient):
        """Registra cliente"""
        self.clients[name] = client
    
    def get_client(self, name: str) -> Optional[APIClient]:
        """Retorna cliente"""
        return self.clients.get(name)

# Uso
client_pool = APIClientPool()

# Registrar clientes
client_pool.register_client(
    "openai",
    APIClient("https://api.openai.com", "sk-xxx")
)

client_pool.register_client(
    "anthropic",
    APIClient("https://api.anthropic.com", "sk-yyy")
)

# Usar cliente
client = client_pool.get_client("openai")
response = client.request("POST", "v1/completions", {"prompt": "test"})
print(f"Response: {response}")
```

## Gap 3: API Monitoring

### Conceito

Monitoramento de APIs com métricas e alertas. Diferente de sem monitoramento, API monitoring detecta problemas.

### Implementação com API Monitoring

```python
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class APICall:
    """Chamada de API"""
    call_id: str
    api_name: str
    endpoint: str
    method: str
    timestamp: datetime
    status_code: int
    duration_ms: float
    error: Optional[str] = None

class APIMonitor:
    """Monitor de APIs"""
    
    def __init__(self):
        self.calls: List[APICall] = []
    
    def record_call(self, api_name: str, endpoint: str, method: str, status_code: int, duration_ms: float, error: str = None):
        """Registra chamada de API"""
        call = APICall(
            call_id=f"call_{len(self.calls)}",
            api_name=api_name,
            endpoint=endpoint,
            method=method,
            timestamp=datetime.now(),
            status_code=status_code,
            duration_ms=duration_ms,
            error=error
        )
        
        self.calls.append(call)
    
    def get_api_metrics(self, api_name: str, time_window_minutes: int = 60) -> Dict:
        """Retorna métricas de API"""
        from datetime import timedelta
        cutoff = datetime.now() - timedelta(minutes=time_window_minutes)
        
        api_calls = [
            call for call in self.calls
            if call.api_name == api_name and call.timestamp > cutoff
        ]
        
        if not api_calls:
            return {}
        
        total_calls = len(api_calls)
        successful_calls = sum(1 for call in api_calls if call.status_code == 200)
        failed_calls = total_calls - successful_calls
        
        avg_duration = sum(call.duration_ms for call in api_calls) / total_calls
        
        return {
            "api": api_name,
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": successful_calls / total_calls if total_calls > 0 else 0,
            "average_duration_ms": avg_duration
        }
    
    def get_error_summary(self, time_window_minutes: int = 60) -> Dict:
        """Retorna resumo de erros"""
        from datetime import timedelta
        cutoff = datetime.now() - timedelta(minutes=time_window_minutes)
        
        error_calls = [
            call for call in self.calls
            if call.error and call.timestamp > cutoff
        ]
        
        errors_by_api = {}
        for call in error_calls:
            if call.api_name not in errors_by_api:
                errors_by_api[call.api_name] = 0
            errors_by_api[call.api_name] += 1
        
        return {
            "total_errors": len(error_calls),
            "errors_by_api": errors_by_api
        }

# Uso
monitor = APIMonitor()

# Registrar chamadas
monitor.record_call("openai", "/v1/completions", "POST", 200, 150.5)
monitor.record_call("anthropic", "/v1/messages", "POST", 200, 200.3)
monitor.record_call("openai", "/v1/completions", "POST", 500, 1000.0, "Rate limit exceeded")

# Obter métricas
metrics = monitor.get_api_metrics("openai")
print(f"OpenAI metrics: {metrics}")

# Obter resumo de erros
errors = monitor.get_error_summary()
print(f"Error summary: {errors}")
```

## Recomendações de Implementação

### Para MVP
1. **API gateway básico:** Implementar com routing e rate limiting
2. **API client básico:** Implementar com retry simples
3. **API monitoring básico:** Implementar com métricas simples

### Para Produção
1. **API gateway avançado:** Implementar com autenticação real e caching
2. **API client avançado:** Implementar com circuit breaker
3. **API monitoring avançado:** Implementar com alertas e dashboards

## Integração com IDEIA-master

O package `api-server` do IDEIA-master pode ser usado como base para implementação de API integration no IDEIA_aci.

## Referências

- Kong: https://konghq.com/
- Tyk: https://tyk.io/
