# Resource Management

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar resource management baseado em gaps competitivos

## Visão Geral

Resource management é crítico para escalabilidade e custo. Diferente de sistemas sem gerenciamento, IDEIA_aci precisa de resource management com resource pooling, auto-scaling, resource quotas e resource monitoring.

## Arquitetura de Resource Management

### Componentes

```
┌─────────────────────────────────────┐
│   Resource Pool                     │  ← Pool de recursos
├─────────────────────────────────────┤
│   Resource Allocator                 │  ← Alocação de recursos
├─────────────────────────────────────┤
│   Resource Monitor                  │  ← Monitoramento de recursos
├─────────────────────────────────────┤
│   Auto-Scaler                       │  ← Auto-scaling
├─────────────────────────────────────┤
│   Resource Quota Manager             │  ← Gerenciamento de quotas
└─────────────────────────────────────┘
```

## Gap 1: Resource Pooling

### Conceito

Pooling de recursos para reuso eficiente. Diferente de alocação direta, pooling reduz overhead e melhora performance.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Resource Pool

```python
from typing import Dict, Optional, List
from dataclasses import dataclass
from queue import Queue
import threading

@dataclass
class Resource:
    """Recurso genérico"""
    resource_id: str
    type: str
    capacity: float
    used: float = 0.0
    
    @property
    def available(self) -> float:
        return self.capacity - self.used
    
    def allocate(self, amount: float) -> bool:
        """Aloca recurso"""
        if self.available >= amount:
            self.used += amount
            return True
        return False
    
    def release(self, amount: float):
        """Libera recurso"""
        self.used = max(0, self.used - amount)

class ResourcePool:
    """Pool de recursos"""
    
    def __init__(self):
        self.resources: Dict[str, Resource] = {}
        self.lock = threading.Lock()
    
    def add_resource(self, resource: Resource):
        """Adiciona recurso ao pool"""
        with self.lock:
            self.resources[resource.resource_id] = resource
    
    def allocate(self, resource_type: str, amount: float) -> Optional[str]:
        """Aloca recurso do tipo especificado"""
        with self.lock:
            # Encontrar recurso disponível
            for resource_id, resource in self.resources.items():
                if resource.type == resource_type and resource.allocate(amount):
                    return resource_id
            
            return None
    
    def release(self, resource_id: str, amount: float):
        """Libera recurso"""
        with self.lock:
            if resource_id in self.resources:
                self.resources[resource_id].release(amount)
    
    def get_status(self) -> Dict[str, Dict]:
        """Retorna status de todos os recursos"""
        with self.lock:
            return {
                resource_id: {
                    "type": resource.type,
                    "capacity": resource.capacity,
                    "used": resource.used,
                    "available": resource.available,
                    "utilization": resource.used / resource.capacity if resource.capacity > 0 else 0
                }
                for resource_id, resource in self.resources.items()
            }

# Uso
pool = ResourcePool()

# Adicionar recursos
pool.add_resource(Resource(resource_id="gpu_1", type="gpu", capacity=1.0))
pool.add_resource(Resource(resource_id="gpu_2", type="gpu", capacity=1.0))
pool.add_resource(Resource(resource_id="cpu_1", type="cpu", capacity=8.0))

# Alocar
gpu_id = pool.allocate("gpu", 0.5)
print(f"Allocated GPU: {gpu_id}")

# Verificar status
status = pool.get_status()
print(f"Resource status: {status}")

# Liberar
if gpu_id:
    pool.release(gpu_id, 0.5)
```

## Gap 2: Auto-Scaling

### Conceito

Auto-scaling baseado em carga. Diferente de scaling manual, auto-scaling ajusta automaticamente.

### Implementação com Auto-Scaling

```python
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import time

@dataclass
class ScalingPolicy:
    """Política de scaling"""
    min_instances: int
    max_instances: int
    target_cpu_utilization: float
    scale_up_threshold: float
    scale_down_threshold: float
    cooldown_period: timedelta

class AutoScaler:
    """Auto-scaler"""
    
    def __init__(self):
        self.policies: Dict[str, ScalingPolicy] = {}
        self.current_instances: Dict[str, int] = {}
        self.last_scale_time: Dict[str, datetime] = {}
        self.metrics: Dict[str, Dict] = {}
    
    def add_policy(self, resource_type: str, policy: ScalingPolicy):
        """Adiciona política de scaling"""
        self.policies[resource_type] = policy
        self.current_instances[resource_type] = policy.min_instances
    
    def update_metrics(self, resource_type: str, cpu_utilization: float, memory_utilization: float):
        """Atualiza métricas"""
        self.metrics[resource_type] = {
            "cpu_utilization": cpu_utilization,
            "memory_utilization": memory_utilization,
            "timestamp": datetime.now()
        }
    
    def evaluate_scaling(self, resource_type: str) -> Optional[str]:
        """Avalia se precisa de scaling"""
        if resource_type not in self.policies:
            return None
        
        policy = self.policies[resource_type]
        
        if resource_type not in self.metrics:
            return None
        
        metrics = self.metrics[resource_type]
        cpu_util = metrics["cpu_utilization"]
        
        # Verificar cooldown
        if resource_type in self.last_scale_time:
            time_since_scale = datetime.now() - self.last_scale_time[resource_type]
            if time_since_scale < policy.cooldown_period:
                return None
        
        # Scale up
        if cpu_util > policy.scale_up_threshold:
            current = self.current_instances[resource_type]
            if current < policy.max_instances:
                self.current_instances[resource_type] = current + 1
                self.last_scale_time[resource_type] = datetime.now()
                return f"Scale up {resource_type} to {current + 1}"
        
        # Scale down
        elif cpu_util < policy.scale_down_threshold:
            current = self.current_instances[resource_type]
            if current > policy.min_instances:
                self.current_instances[resource_type] = current - 1
                self.last_scale_time[resource_type] = datetime.now()
                return f"Scale down {resource_type} to {current - 1}"
        
        return None

# Uso
scaler = AutoScaler()

# Adicionar política
scaler.add_policy("gpu", ScalingPolicy(
    min_instances=1,
    max_instances=10,
    target_cpu_utilization=0.7,
    scale_up_threshold=0.8,
    scale_down_threshold=0.3,
    cooldown_period=timedelta(minutes=5)
))

# Atualizar métricas
scaler.update_metrics("gpu", cpu_utilization=0.85, memory_utilization=0.6)

# Avaliar scaling
action = scaler.evaluate_scaling("gpu")
print(f"Scaling action: {action}")
```

## Gap 3: Resource Quotas

### Conceito
Quotas de recursos por usuário/projeto. Diferente de sem limites, quotas previnem overuse.

### Implementação com Resource Quotas

```python
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class ResourceQuota:
    """Quota de recursos"""
    quota_id: str
    resource_type: str
    limit: float
    used: float = 0.0
    
    @property
    def remaining(self) -> float:
        return self.limit - self.used
    
    def can_consume(self, amount: float) -> bool:
        return self.used + amount <= self.limit
    
    def consume(self, amount: float) -> bool:
        if self.can_consume(amount):
            self.used += amount
            return True
        return False
    
    def release(self, amount: float):
        self.used = max(0, self.used - amount)

class QuotaManager:
    """Gerenciador de quotas"""
    
    def __init__(self):
        self.quotas: Dict[str, ResourceQuota] = {}
    
    def set_quota(self, quota_id: str, resource_type: str, limit: float):
        """Define quota"""
        self.quotas[quota_id] = ResourceQuota(
            quota_id=quota_id,
            resource_type=resource_type,
            limit=limit
        )
    
    def check_quota(self, quota_id: str, amount: float) -> bool:
        """Verifica se há quota suficiente"""
        if quota_id not in self.quotas:
            return False
        
        return self.quotas[quota_id].can_consume(amount)
    
    def consume_quota(self, quota_id: str, amount: float) -> bool:
        """Consome quota"""
        if quota_id not in self.quotas:
            return False
        
        return self.quotas[quota_id].consume(amount)
    
    def release_quota(self, quota_id: str, amount: float):
        """Libera quota"""
        if quota_id in self.quotas:
            self.quotas[quota_id].release(amount)
    
    def get_quota_status(self, quota_id: str) -> Optional[Dict]:
        """Retorna status da quota"""
        if quota_id not in self.quotas:
            return None
        
        quota = self.quotas[quota_id]
        return {
            "limit": quota.limit,
            "used": quota.used,
            "remaining": quota.remaining,
            "utilization": quota.used / quota.limit if quota.limit > 0 else 0
        }

# Uso
quota_manager = QuotaManager()

# Definir quotas
quota_manager.set_quota("user_1_gpu", "gpu", limit=2.0)
quota_manager.set_quota("user_1_tokens", "tokens", limit=1000000)

# Verificar quota
can_consume = quota_manager.check_quota("user_1_gpu", 1.0)
print(f"Can consume 1.0 GPU: {can_consume}")

# Consumir quota
success = quota_manager.consume_quota("user_1_gpu", 1.0)
print(f"Consume success: {success}")

# Verificar status
status = quota_manager.get_quota_status("user_1_gpu")
print(f"Quota status: {status}")
```

## Recomendações de Implementação

### Para MVP
1. **Resource pooling básico:** Implementar com pool simples
2. **Auto-scaling básico:** Implementar com scaling baseado em CPU
3. **Resource quotas básico:** Implementar com quotas por usuário

### Para Produção
1. **Resource pooling avançado:** Implementar com pooling hierárquico
2. **Auto-scaling avançado:** Implementar com scaling baseado em múltiplas métricas
3. **Resource quotas avançado:** Implementar com quotas granulares e alertas
4. **Resource monitoring:** Implementar com monitoramento detalhado

## Integração com IDEIA-master

O package `resource-manager` do IDEIA-master pode ser usado como base para implementação de resource management no IDEIA_aci.

## Referências

- Kubernetes Resource Management: https://kubernetes.io/docs/concepts/policy/resource-quotas/
- AWS Auto Scaling: https://aws.amazon.com/autoscaling/
