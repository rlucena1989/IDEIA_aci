# Arquitetura de Dados

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Arquitetura de Dados baseado em gaps competitivos

## Visão Geral

Arquitetura de dados é crítica para sistemas de IA. Diferente de arquiteturas monolíticas, polyglot persistence permite usar o melhor banco para cada caso de uso.

## Arquitetura de Dados

### Componentes

```
┌─────────────────────────────────────┐
│   Vector Store                       │  ← Embeddings e similarity search
├─────────────────────────────────────┤
│   Graph Database                     │  ← Knowledge graphs
├─────────────────────────────────────┤
│   Document Store                     │  ← Context e memória
├─────────────────────────────────────┤
│   Relational Database                │  ← Metadados e transações
├─────────────────────────────────────┤
│   Event Store                        │  ← Audit trail e event sourcing
├─────────────────────────────────────┤
│   Object Storage                     │  ← Arquivos e artefatos
└─────────────────────────────────────┘
```

## Gap 1: Polyglot Persistence

### Conceito

Polyglot persistence usa diferentes bancos para diferentes casos de uso. Diferente de single database, polyglot persistence otimiza cada workload.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Polyglot Persistence

```python
from typing import Dict, Optional, Any
from abc import ABC, abstractmethod
import json

class DatabaseAdapter(ABC):
    """Adapter base para banco de dados"""
    
    @abstractmethod
    def connect(self):
        """Conecta ao banco"""
        pass
    
    @abstractmethod
    def disconnect(self):
        """Desconecta do banco"""
        pass
    
    @abstractmethod
    def query(self, query: str, params: Dict = None) -> Any:
        """Executa query"""
        pass

class VectorStoreAdapter(DatabaseAdapter):
    """Adapter para Vector Store (ex: Pinecone, Weaviate)"""
    
    def __init__(self, api_key: str, index_name: str):
        self.api_key = api_key
        self.index_name = index_name
        self.client = None
    
    def connect(self):
        """Conecta ao Vector Store"""
        # Em produção, usar cliente real
        print(f"Connected to Vector Store: {self.index_name}")
    
    def disconnect(self):
        """Desconecta"""
        print(f"Disconnected from Vector Store")
    
    def query(self, query: str, params: Dict = None) -> Any:
        """Executa query de similaridade"""
        # Em produção, executar query real
        return {"results": []}
    
    def upsert(self, vectors: list):
        """Upsert de vetores"""
        print(f"Upserting {len(vectors)} vectors")

class GraphDatabaseAdapter(DatabaseAdapter):
    """Adapter para Graph Database (ex: Neo4j)"""
    
    def __init__(self, uri: str, user: str, password: str):
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
    
    def connect(self):
        """Conecta ao Graph Database"""
        print(f"Connected to Graph Database: {self.uri}")
    
    def disconnect(self):
        """Desconecta"""
        print(f"Disconnected from Graph Database")
    
    def query(self, query: str, params: Dict = None) -> Any:
        """Executa query Cypher"""
        # Em produção, executar query real
        return {"nodes": [], "relationships": []}

class DocumentStoreAdapter(DatabaseAdapter):
    """Adapter para Document Store (ex: MongoDB)"""
    
    def __init__(self, connection_string: str, database: str):
        self.connection_string = connection_string
        self.database = database
        self.client = None
    
    def connect(self):
        """Conecta ao Document Store"""
        print(f"Connected to Document Store: {self.database}")
    
    def disconnect(self):
        """Desconecta"""
        print(f"Disconnected from Document Store")
    
    def query(self, query: str, params: Dict = None) -> Any:
        """Executa query"""
        # Em produção, executar query real
        return {"documents": []}

class PolyglotPersistence:
    """Gerenciador de polyglot persistence"""
    
    def __init__(self):
        self.adapters: Dict[str, DatabaseAdapter] = {}
    
    def register_adapter(self, name: str, adapter: DatabaseAdapter):
        """Registra adapter"""
        self.adapters[name] = adapter
    
    def connect_all(self):
        """Conecta todos os adapters"""
        for name, adapter in self.adapters.items():
            adapter.connect()
    
    def disconnect_all(self):
        """Desconecta todos os adapters"""
        for name, adapter in self.adapters.items():
            adapter.disconnect()
    
    def get_adapter(self, name: str) -> Optional[DatabaseAdapter]:
        """Retorna adapter por nome"""
        return self.adapters.get(name)

# Uso
polyglot = PolyglotPersistence()

# Registrar adapters
polyglot.register_adapter("vector", VectorStoreAdapter("api_key", "index"))
polyglot.register_adapter("graph", GraphDatabaseAdapter("uri", "user", "password"))
polyglot.register_adapter("documents", DocumentStoreAdapter("conn_str", "db"))

# Conectar todos
polyglot.connect_all()

# Usar adapters
vector_adapter = polyglot.get_adapter("vector")
vector_adapter.upsert([])

# Desconectar
polyglot.disconnect_all()
```

## Gap 2: Data Consistency

### Conceito

Consistência de dados entre diferentes bancos. Diferente de sem sincronização, data consistency garante integridade.

### Implementação com Data Consistency

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib

@dataclass
class DataConsistencyEvent:
    """Evento de consistência de dados"""
    event_id: str
    timestamp: datetime
    source: str
    target: str
    operation: str
    data: Dict
    checksum: str

class DataConsistencyManager:
    """Gerenciador de consistência de dados"""
    
    def __init__(self):
        self.events: List[DataConsistencyEvent] = []
        self.checksums: Dict[str, str] = {}
    
    def calculate_checksum(self, data: Dict) -> str:
        """Calcula checksum dos dados"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def sync_data(self, source: str, target: str, data: Dict, operation: str = "sync"):
        """Sincroniza dados entre fontes"""
        checksum = self.calculate_checksum(data)
        
        event = DataConsistencyEvent(
            event_id=f"evt_{len(self.events)}",
            timestamp=datetime.now(),
            source=source,
            target=target,
            operation=operation,
            data=data,
            checksum=checksum
        )
        
        self.events.append(event)
        self.checksums[f"{source}:{target}"] = checksum
        
        print(f"Synced data from {source} to {target}")
    
    def verify_consistency(self, source: str, target: str, data: Dict) -> bool:
        """Verifica consistência entre fontes"""
        current_checksum = self.calculate_checksum(data)
        expected_checksum = self.checksums.get(f"{source}:{target}")
        
        return current_checksum == expected_checksum
    
    def get_sync_history(self, source: str, target: str) -> List[DataConsistencyEvent]:
        """Retorna histórico de sincronização"""
        return [
            event for event in self.events
            if event.source == source and event.target == target
        ]

# Uso
consistency_manager = DataConsistencyManager()

# Sincronizar dados
data = {"key": "value", "timestamp": "2026-08-12"}
consistency_manager.sync_data("vector_store", "graph_db", data)

# Verificar consistência
is_consistent = consistency_manager.verify_consistency("vector_store", "graph_db", data)
print(f"Consistency check: {is_consistent}")
```

## Gap 3: Data Migration

### Conceito

Migração de dados entre diferentes bancos. Diferente de migração manual, data migration automatiza o processo.

### Implementação com Data Migration

```python
from typing import Dict, List, Callable, Optional

class DataMigration:
    """Migração de dados"""
    
    def __init__(self, name: str):
        self.name = name
        self.steps: List[Callable] = []
        self.rollback_steps: List[Callable] = []
    
    def add_step(self, step: Callable, rollback: Callable = None):
        """Adiciona passo de migração"""
        self.steps.append(step)
        if rollback:
            self.rollback_steps.insert(0, rollback)
    
    def execute(self) -> Dict:
        """Executa migração"""
        results = {
            "migration": self.name,
            "steps_executed": 0,
            "steps_failed": 0,
            "success": True,
            "errors": []
        }
        
        for i, step in enumerate(self.steps):
            try:
                print(f"Executing step {i + 1}/{len(self.steps)}")
                step()
                results["steps_executed"] += 1
            except Exception as e:
                results["steps_failed"] += 1
                results["success"] = False
                results["errors"].append(str(e))
                print(f"Step {i + 1} failed: {e}")
                break
        
        return results
    
    def rollback(self):
        """Executa rollback"""
        print(f"Rolling back migration: {self.name}")
        
        for i, step in enumerate(self.rollback_steps):
            try:
                print(f"Executing rollback step {i + 1}/{len(self.rollback_steps)}")
                step()
            except Exception as e:
                print(f"Rollback step {i + 1} failed: {e}")

class DataMigrationManager:
    """Gerenciador de migrações de dados"""
    
    def __init__(self):
        self.migrations: Dict[str, DataMigration] = {}
        self.executed_migrations: List[str] = []
    
    def register_migration(self, migration: DataMigration):
        """Registra migração"""
        self.migrations[migration.name] = migration
    
    def execute_migration(self, name: str) -> Dict:
        """Executa migração"""
        if name not in self.migrations:
            return {"success": False, "error": "Migration not found"}
        
        migration = self.migrations[name]
        result = migration.execute()
        
        if result["success"]:
            self.executed_migrations.append(name)
        
        return result
    
    def rollback_migration(self, name: str):
        """Rollback de migração"""
        if name in self.migrations:
            self.migrations[name].rollback()
            if name in self.executed_migrations:
                self.executed_migrations.remove(name)

# Uso
migration_manager = DataMigrationManager()

# Criar migração
migration = DataMigration("vector_to_graph")

# Adicionar passos
migration.add_step(
    step=lambda: print("Step 1: Export from Vector Store"),
    rollback=lambda: print("Rollback Step 1")
)

migration.add_step(
    step=lambda: print("Step 2: Transform data"),
    rollback=lambda: print("Rollback Step 2")
)

migration.add_step(
    step=lambda: print("Step 3: Import to Graph DB"),
    rollback=lambda: print("Rollback Step 3")
)

# Registrar e executar
migration_manager.register_migration(migration)
result = migration_manager.execute_migration("vector_to_graph")
print(f"Migration result: {result}")
```

## Recomendações de Implementação

### Para MVP
1. **Polyglot persistence básico:** Implementar com Vector Store + Document Store
2. **Data consistency básico:** Implementar com checksum simples
3. **Data migration básico:** Implementar com migrações manuais

### Para Produção
1. **Polyglot persistence avançado:** Implementar com 5+ bancos
2. **Data consistency avançado:** Implementar com CDC (Change Data Capture)
3. **Data migration avançado:** Implementar com migrações automatizadas

## Integração com IDEIA-master

O package `data-layer` do IDEIA-master pode ser usado como base para implementação de arquitetura de dados no IDEIA_aci.

## Referências

- Polyglot Persistence: https://martinfowler.com/bliki/PolyglotPersistence.html
- CDC: https://debezium.io/
