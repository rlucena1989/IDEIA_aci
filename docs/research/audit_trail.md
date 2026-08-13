# Audit Trail

**Data:** 12 de agosto de 2026  
**Status:** Rascunho conceitual; exemplos não validados e não executáveis como escritos  
**Objetivo:** Aprofundar Audit Trail baseado em gaps competitivos

> **Aviso de revisão — 12/08/2026:** este documento não satisfaz os requisitos RF-019 e contém falhas concretas de construção, recomputação de hash e mutabilidade. Não usar os snippets como implementação. Consulte a [meta-auditoria](planejamento/auditoria_revisao_adversarial_2026-08-12.md).

## Visão Geral

Audit Trail é crítico para compliance e debugging. Diferente de sem rastreamento, audit trail permite reconstrução completa de ações.

## Arquitetura de Audit Trail

### Componentes

```
┌─────────────────────────────────────┐
│   Event Store                        │  ← Armazenamento de eventos
├─────────────────────────────────────┤
│   Event Logger                       │  ← Logging de eventos
├─────────────────────────────────────┤
│   Event Query                        │  ← Query de eventos
├─────────────────────────────────────┤
│   Event Validator                    │  ← Validação de integridade
└─────────────────────────────────────┘
```

## Gap 1: Event Sourcing

### Conceito

Event Sourcing armazena todos os eventos como log imutável. Diferente de estado atual, event sourcing permite reconstrução completa.

### Implementação com Event Sourcing

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib
import json

@dataclass
class AuditEvent:
    """Evento de audit"""
    event_id: str
    timestamp: datetime
    actor: str
    resource: str
    action: str
    details: Dict
    previous_hash: str
    current_hash: str

class EventStore:
    """Store de eventos com event sourcing"""
    
    def __init__(self):
        self.events: List[AuditEvent] = []
    
    def append(self, event: AuditEvent):
        """Adiciona evento ao log"""
        # Calcular hash
        previous_hash = self.events[-1].current_hash if self.events else "0"
        event_str = json.dumps({
            "timestamp": event.timestamp.isoformat(),
            "actor": event.actor,
            "resource": event.resource,
            "action": event.action,
            "details": event.details,
            "previous_hash": previous_hash
        }, sort_keys=True)
        
        current_hash = hashlib.sha256(event_str.encode()).hexdigest()
        event.current_hash = current_hash
        event.previous_hash = previous_hash
        
        self.events.append(event)
    
    def get_events(self, resource=None, actor=None, action=None, from_time=None, to_time=None) -> List[AuditEvent]:
        """Filtra eventos"""
        filtered = self.events
        
        if resource:
            filtered = [e for e in filtered if e.resource == resource]
        
        if actor:
            filtered = [e for e in filtered if e.actor == actor]
        
        if action:
            filtered = [e for e in filtered if e.action == action]
        
        if from_time:
            filtered = [e for e in filtered if e.timestamp >= from_time]
        
        if to_time:
            filtered = [e for e in filtered if e.timestamp <= to_time]
        
        return filtered
    
    def verify_integrity(self) -> bool:
        """Verifica integridade do log"""
        for i, event in enumerate(self.events):
            if i > 0:
                if event.previous_hash != self.events[i-1].current_hash:
                    return False
        
        return True

# Uso
event_store = EventStore()

# Adicionar eventos
event_store.append(AuditEvent(
    event_id="evt_1",
    timestamp=datetime.now(),
    actor="user_1",
    resource="file_1",
    action="read",
    details={"path": "/path/to/file"}
))

event_store.append(AuditEvent(
    event_id="evt_2",
    timestamp=datetime.now(),
    actor="user_1",
    resource="file_1",
    action="write",
    details={"path": "/path/to/file", "content": "new content"}
))

# Verificar integridade
is_valid = event_store.verify_integrity()
print(f"Integrity check: {is_valid}")
```

## Gap 2: Immutable Logs

### Conceito

Logs imutáveis garantem que eventos não podem ser alterados. Diferente de logs mutáveis, immutable logs garantem integridade.

### Implementação com Immutable Logs

```python
from typing import Dict, List
from dataclasses import dataclass
import hashlib

@dataclass
class ImmutableLogEntry:
    """Entrada de log imutável"""
    entry_id: str
    data: Dict
    hash: str
    signature: Optional[str] = None

class ImmutableLog:
    """Log imutável"""
    
    def __init__(self):
        self.entries: List[ImmutableLogEntry] = []
        self.chain_hash = "0"
    
    def append(self, data: Dict, signature: str = None):
        """Adiciona entrada imutável"""
        # Calcular hash da entrada
        data_str = json.dumps(data, sort_keys=True)
        entry_hash = hashlib.sha256(data_str.encode()).hexdigest()
        
        # Calcular hash da chain
        chain_input = f"{self.chain_hash}:{entry_hash}"
        self.chain_hash = hashlib.sha256(chain_input.encode()).hexdigest()
        
        entry = ImmutableLogEntry(
            entry_id=f"entry_{len(self.entries)}",
            data=data,
            hash=entry_hash,
            signature=signature
        )
        
        self.entries.append(entry)
    
    def verify_chain(self) -> bool:
        """Verifica integridade da chain"""
        current_hash = "0"
        
        for entry in self.entries:
            chain_input = f"{current_hash}:{entry.hash}"
            current_hash = hashlib.sha256(chain_input.encode()).hexdigest()
        
        return current_hash == self.chain_hash
    
    def get_entry(self, entry_id: str) -> Optional[ImmutableLogEntry]:
        """Retorna entrada por ID"""
        for entry in self.entries:
            if entry.entry_id == entry_id:
                return entry
        return None

# Uso
immutable_log = ImmutableLog()

# Adicionar entradas
immutable_log.append({"action": "login", "user": "user_1"})
immutable_log.append({"action": "read", "user": "user_1", "resource": "file_1"})

# Verificar chain
is_valid = immutable_log.verify_chain()
print(f"Chain integrity: {is_valid}")
```

## Gap 3: Audit Queries

### Conceito

Queries avançadas sobre audit trail. Diferente de queries simples, audit queries permitem análise complexa.

### Implementação com Audit Queries

```python
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class QueryResult:
    """Resultado de query"""
    events: List[AuditEvent]
    count: int
    execution_time_ms: float

class AuditQuery:
    """Query de audit trail"""
    
    def __init__(self, event_store: EventStore):
        self.event_store = event_store
    
    def query_by_actor(self, actor: str, time_range: timedelta = None) -> QueryResult:
        """Query por ator"""
        start_time = datetime.now()
        
        from_time = datetime.now() - time_range if time_range else None
        events = self.event_store.get_events(actor=actor, from_time=from_time)
        
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return QueryResult(
            events=events,
            count=len(events),
            execution_time_ms=execution_time
        )
    
    def query_by_resource(self, resource: str, time_range: timedelta = None) -> QueryResult:
        """Query por recurso"""
        start_time = datetime.now()
        
        from_time = datetime.now() - time_range if time_range else None
        events = self.event_store.get_events(resource=resource, from_time=from_time)
        
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return QueryResult(
            events=events,
            count=len(events),
            execution_time_ms=execution_time
        )
    
    def query_by_action(self, action: str, time_range: timedelta = None) -> QueryResult:
        """Query por ação"""
        start_time = datetime.now()
        
        from_time = datetime.now() - time_range if time_range else None
        events = self.event_store.get_events(action=action, from_time=from_time)
        
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return QueryResult(
            events=events,
            count=len(events),
            execution_time_ms=execution_time
        )
    
    def custom_query(self, filter_func: Callable[[AuditEvent], bool]) -> QueryResult:
        """Query customizada"""
        start_time = datetime.now()
        
        events = [e for e in self.event_store.events if filter_func(e)]
        
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return QueryResult(
            events=events,
            count=len(events),
            execution_time_ms=execution_time
        )

# Uso
audit_query = AuditQuery(event_store)

# Query por ator
result = audit_query.query_by_actor("user_1", timedelta(hours=1))
print(f"Actor query result: {result.count} events")

# Query customizada
result = audit_query.custom_query(lambda e: e.action == "read" and e.resource == "file_1")
print(f"Custom query result: {result.count} events")
```

## Recomendações de Implementação

### Para MVP
1. **Event sourcing básico:** Implementar com hash chain
2. **Immutable logs básico:** Implementar com chain hash
3. **Audit queries básico:** Implementar com filtros simples

### Para Produção
1. **Event sourcing avançado:** Implementar com assinaturas digitais
2. **Immutable logs avançado:** Implementar com armazenamento distribuído
3. **Audit queries avançado:** Implementar com agregações e analytics

## Integração com IDEIA-master

O package `audit-trail` do IDEIA-master pode ser usado como base para implementação de audit trail no IDEIA_aci.

## Referências

- Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
