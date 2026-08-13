# Sistemas de Memória para IA

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar sistemas de memória para IA baseado em gaps competitivos

## Visão Geral

Sistemas de memória para IA são críticos para manter contexto, aprendizado e estado ao longo de sessões. Windsurf tem "Memories" básicas, mas IDEIA_aci precisa de um sistema de memória mais avançado com multi-level hierarchy, compression, versioning, sharing, privacy, graphs, learning e analytics.

## Arquitetura de Memória Multi-Level

### Níveis de Memória

```
┌─────────────────────────────────────┐
│   Institutional Memory (Enterprise)  │  ← Long-term, cross-project
├─────────────────────────────────────┤
│   Global Memory (User Preferences)   │  ← Long-term, cross-session
├─────────────────────────────────────┤
│   Project Memory (Project-specific)  │  ← Medium-term, project-scoped
├─────────────────────────────────────┤
│   Working Memory (Session)           │  ← Short-term, session-scoped
└─────────────────────────────────────┘
```

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação de Memory Hierarchy

```python
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryLevel(Enum):
    WORKING = "working"
    PROJECT = "project"
    GLOBAL = "global"
    INSTITUTIONAL = "institutional"

@dataclass
class MemoryEntry:
    """Entrada de memória"""
    key: str
    value: Any
    level: MemoryLevel
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    ttl: Optional[timedelta] = None
    access_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def is_expired(self) -> bool:
        """Verifica se a entrada expirou"""
        if self.ttl is None:
            return False
        return datetime.now() > self.created_at + self.ttl
    
    def touch(self):
        """Atualiza timestamp de acesso"""
        self.updated_at = datetime.now()
        self.access_count += 1

class MemoryHierarchy:
    """Hierarquia de memória multi-level"""
    
    def __init__(self):
        self.working_memory: Dict[str, MemoryEntry] = {}
        self.project_memory: Dict[str, MemoryEntry] = {}
        self.global_memory: Dict[str, MemoryEntry] = {}
        self.institutional_memory: Dict[str, MemoryEntry] = {}
    
    def _get_memory(self, level: MemoryLevel) -> Dict[str, MemoryEntry]:
        """Retorna o dicionário de memória para um nível"""
        if level == MemoryLevel.WORKING:
            return self.working_memory
        elif level == MemoryLevel.PROJECT:
            return self.project_memory
        elif level == MemoryLevel.GLOBAL:
            return self.global_memory
        elif level == MemoryLevel.INSTITUTIONAL:
            return self.institutional_memory
        else:
            raise ValueError(f"Invalid memory level: {level}")
    
    def set(self, key: str, value: Any, level: MemoryLevel, ttl: Optional[timedelta] = None, metadata: Optional[Dict] = None):
        """Define uma entrada de memória"""
        memory = self._get_memory(level)
        
        entry = MemoryEntry(
            key=key,
            value=value,
            level=level,
            ttl=ttl,
            metadata=metadata or {}
        )
        
        memory[key] = entry
        logger.info(f"Set {key} in {level.value} memory")
    
    def get(self, key: str, level: Optional[MemoryLevel] = None) -> Optional[Any]:
        """Recupera uma entrada de memória"""
        if level is not None:
            memory = self._get_memory(level)
            entry = memory.get(key)
            
            if entry:
                if entry.is_expired():
                    del memory[key]
                    logger.warning(f"Key {key} expired in {level.value} memory")
                    return None
                
                entry.touch()
                return entry.value
            
            return None
        
        # Buscar em todos os níveis (do mais específico ao mais geral)
        for search_level in [MemoryLevel.WORKING, MemoryLevel.PROJECT, MemoryLevel.GLOBAL, MemoryLevel.INSTITUTIONAL]:
            memory = self._get_memory(search_level)
            entry = memory.get(key)
            
            if entry:
                if entry.is_expired():
                    del memory[key]
                    continue
                
                entry.touch()
                logger.info(f"Found {key} in {search_level.value} memory")
                return entry.value
        
        logger.warning(f"Key {key} not found in any memory level")
        return None
    
    def delete(self, key: str, level: Optional[MemoryLevel] = None):
        """Remove uma entrada de memória"""
        if level is not None:
            memory = self._get_memory(level)
            if key in memory:
                del memory[key]
                logger.info(f"Deleted {key} from {level.value} memory")
        else:
            # Remover de todos os níveis
            for search_level in [MemoryLevel.WORKING, MemoryLevel.PROJECT, MemoryLevel.GLOBAL, MemoryLevel.INSTITUTIONAL]:
                memory = self._get_memory(search_level)
                if key in memory:
                    del memory[key]
                    logger.info(f"Deleted {key} from {search_level.value} memory")
    
    def clear(self, level: Optional[MemoryLevel] = None):
        """Limpa um nível específico ou todos"""
        if level is not None:
            memory = self._get_memory(level)
            memory.clear()
            logger.info(f"Cleared {level.value} memory")
        else:
            self.working_memory.clear()
            self.project_memory.clear()
            self.global_memory.clear()
            self.institutional_memory.clear()
            logger.info("Cleared all memory levels")
    
    def cleanup_expired(self):
        """Remove entradas expiradas de todos os níveis"""
        for level in [MemoryLevel.WORKING, MemoryLevel.PROJECT, MemoryLevel.GLOBAL, MemoryLevel.INSTITUTIONAL]:
            memory = self._get_memory(level)
            expired_keys = [key for key, entry in memory.items() if entry.is_expired()]
            
            for key in expired_keys:
                del memory[key]
                logger.info(f"Cleaned up expired key {key} from {level.value} memory")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de uso de memória"""
        return {
            "working": {
                "count": len(self.working_memory),
                "total_access": sum(e.access_count for e in self.working_memory.values())
            },
            "project": {
                "count": len(self.project_memory),
                "total_access": sum(e.access_count for e in self.project_memory.values())
            },
            "global": {
                "count": len(self.global_memory),
                "total_access": sum(e.access_count for e in self.global_memory.values())
            },
            "institutional": {
                "count": len(self.institutional_memory),
                "total_access": sum(e.access_count for e in self.institutional_memory.values())
            }
        }

# Uso
memory = MemoryHierarchy()

# Working memory (sessão atual)
memory.set("current_task", "Analyze codebase", MemoryLevel.WORKING, ttl=timedelta(hours=1))
memory.set("last_error", "Timeout error", MemoryLevel.WORKING)

# Project memory (específico do projeto)
memory.set("tech_stack", ["Python", "FastAPI", "PostgreSQL"], MemoryLevel.PROJECT)
memory.set("arch_decision", "Use microservices", MemoryLevel.PROJECT, metadata={"reason": "scalability"})

# Global memory (preferências do usuário)
memory.set("preferred_model", "gpt-4o", MemoryLevel.GLOBAL)
memory.set("code_style", "PEP8", MemoryLevel.GLOBAL)

# Institutional memory (enterprise-wide)
memory.set("security_policy", "MFA required", MemoryLevel.INSTITUTIONAL)
memory.set("compliance_standard", "SOC2", MemoryLevel.INSTITUTIONAL)

# Recuperar (busca em todos os níveis)
task = memory.get("current_task")
print(f"Current task: {task}")

# Estatísticas
stats = memory.get_stats()
print(f"Memory stats: {stats}")
```

## Gap 1: Memory Compression

### Conceito

Compressão de memória para reduzir uso de tokens e armazenamento. Diferente de Windsurf que apenas armazena memórias, IDEIA_aci deve comprimir memórias automaticamente.

### Implementação com Summarization

```python
from typing import Dict, List
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryCompressor:
    """Compressor de memória usando summarization"""
    
    def __init__(self, compression_threshold: int = 1000):
        self.compression_threshold = compression_threshold
    
    def should_compress(self, value: Any) -> bool:
        """Decide se deve comprimir baseado no tamanho"""
        if isinstance(value, str):
            return len(value) > self.compression_threshold
        elif isinstance(value, (list, dict)):
            return len(json.dumps(value)) > self.compression_threshold
        return False
    
    def compress(self, value: Any) -> str:
        """Comprime um valor usando summarization"""
        if not self.should_compress(value):
            return value
        
        logger.info(f"Compressing value of size {len(str(value))}")
        
        # Simular summarization (em produção, usar LLM)
        if isinstance(value, str):
            compressed = self._summarize_text(value)
        elif isinstance(value, list):
            compressed = self._summarize_list(value)
        elif isinstance(value, dict):
            compressed = self._summarize_dict(value)
        else:
            compressed = str(value)
        
        logger.info(f"Compressed to size {len(compressed)}")
        return compressed
    
    def _summarize_text(self, text: str) -> str:
        """Sumariza texto (simulado)"""
        # Em produção, usar LLM para summarization
        words = text.split()
        if len(words) > 100:
            return " ".join(words[:50]) + "... [summarized]"
        return text
    
    def _summarize_list(self, items: List) -> str:
        """Sumariza lista"""
        if len(items) > 10:
            return f"List of {len(items)} items (first 5: {items[:5]})"
        return str(items)
    
    def _summarize_dict(self, data: Dict) -> str:
        """Sumariza dicionário"""
        if len(data) > 10:
            keys = list(data.keys())[:5]
            return f"Dict with {len(data)} keys (first 5: {keys})"
        return str(data)

class CompressedMemoryHierarchy(MemoryHierarchy):
    """Hierarquia de memória com compressão automática"""
    
    def __init__(self):
        super().__init__()
        self.compressor = MemoryCompressor()
    
    def set(self, key: str, value: Any, level: MemoryLevel, ttl: Optional[timedelta] = None, metadata: Optional[Dict] = None):
        """Define entrada com compressão automática"""
        compressed_value = self.compressor.compress(value)
        super().set(key, compressed_value, level, ttl, metadata)

# Uso
compressed_memory = CompressedMemoryHierarchy()

# Entrada longa será comprimida
long_text = "This is a very long text that should be compressed " * 50
compressed_memory.set("long_entry", long_text, MemoryLevel.PROJECT)

# Entrada curta não será comprimida
short_text = "Short text"
compressed_memory.set("short_entry", short_text, MemoryLevel.PROJECT)
```

### Implementação com Quantization

```python
import numpy as np
from typing import Any

class MemoryQuantizer:
    """Quantizador de memória para embeddings"""
    
    def __init__(self, bits: int = 8):
        self.bits = bits
        self.scale = 2 ** (bits - 1) - 1
    
    def quantize(self, embedding: np.ndarray) -> np.ndarray:
        """Quantiza embedding para int8"""
        # Normalizar para [-1, 1]
        normalized = embedding / np.linalg.norm(embedding)
        
        # Quantizar para int8
        quantized = np.round(normalized * self.scale).astype(np.int8)
        
        return quantized
    
    def dequantize(self, quantized: np.ndarray) -> np.ndarray:
        """Dequantiza de int8 para float32"""
        # Dequantizar
        normalized = quantized.astype(np.float32) / self.scale
        
        # Denormalizar
        embedding = normalized  # Assume unit norm
        
        return embedding
    
    def compress_embedding(self, embedding: np.ndarray) -> bytes:
        """Comprime embedding para bytes"""
        quantized = self.quantize(embedding)
        return quantized.tobytes()
    
    def decompress_embedding(self, compressed: bytes, shape: tuple) -> np.ndarray:
        """Descomprime embedding de bytes"""
        quantized = np.frombuffer(compressed, dtype=np.int8).reshape(shape)
        return self.dequantize(quantized)

# Uso
quantizer = MemoryQuantizer(bits=8)

# Embedding original (float32)
embedding = np.random.randn(768).astype(np.float32)
original_size = embedding.nbytes  # 3072 bytes

# Comprimir (int8)
compressed = quantizer.compress_embedding(embedding)
compressed_size = len(compressed)  # 768 bytes

# Descomprimir
decompressed = quantizer.decompress_embedding(compressed, embedding.shape)

print(f"Original size: {original_size} bytes")
print(f"Compressed size: {compressed_size} bytes")
print(f"Compression ratio: {original_size / compressed_size:.2f}x")
```

## Gap 2: Memory Versioning

### Conceito

Versionamento de memória permite rollback, diff e histórico. Diferente de Windsurf que apenas armazena memórias, IDEIA_aci deve versionar automaticamente.

### Implementação com Versioning

```python
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import hashlib
import json

@dataclass
class MemoryVersion:
    """Versão de uma entrada de memória"""
    version_id: str
    value: Any
    created_at: datetime = field(default_factory=datetime.now)
    checksum: str = ""
    parent_version_id: Optional[str] = None
    
    def __post_init__(self):
        """Calcula checksum do valor"""
        self.checksum = self._calculate_checksum()
    
    def _calculate_checksum(self) -> str:
        """Calcula checksum do valor"""
        value_str = json.dumps(self.value, sort_keys=True, default=str)
        return hashlib.sha256(value_str.encode()).hexdigest()

class VersionedMemoryEntry:
    """Entrada de memória com versionamento"""
    
    def __init__(self, key: str, initial_value: Any):
        self.key = key
        self.versions: List[MemoryVersion] = []
        self.current_version_id: Optional[str] = None
        
        # Criar versão inicial
        self._add_version(initial_value)
    
    def _add_version(self, value: Any, parent_version_id: Optional[str] = None) -> str:
        """Adiciona uma nova versão"""
        version_id = hashlib.md5(f"{self.key}_{datetime.now().isoformat()}".encode()).hexdigest()
        
        version = MemoryVersion(
            version_id=version_id,
            value=value,
            parent_version_id=parent_version_id
        )
        
        self.versions.append(version)
        self.current_version_id = version_id
        
        return version_id
    
    def update(self, new_value: Any) -> str:
        """Atualiza valor criando nova versão"""
        parent_version_id = self.current_version_id
        return self._add_version(new_value, parent_version_id)
    
    def get(self, version_id: Optional[str] = None) -> Optional[Any]:
        """Recupera valor de uma versão específica"""
        if version_id is None:
            version_id = self.current_version_id
        
        for version in self.versions:
            if version.version_id == version_id:
                return version.value
        
        return None
    
    def rollback(self, version_id: str) -> bool:
        """Rollback para uma versão específica"""
        target_version = None
        for version in self.versions:
            if version.version_id == version_id:
                target_version = version
                break
        
        if target_version is None:
            return False
        
        # Criar nova versão com o valor da versão alvo
        self._add_version(target_version.value, target_version.parent_version_id)
        return True
    
    def get_history(self) -> List[Dict]:
        """Retorna histórico de versões"""
        return [
            {
                "version_id": v.version_id,
                "created_at": v.created_at.isoformat(),
                "checksum": v.checksum,
                "parent_version_id": v.parent_version_id
            }
            for v in self.versions
        ]
    
    def diff(self, version_id_1: str, version_id_2: str) -> Dict:
        """Calcula diff entre duas versões"""
        value1 = self.get(version_id_1)
        value2 = self.get(version_id_2)
        
        if value1 is None or value2 is None:
            return {"error": "One or both versions not found"}
        
        return {
            "version_id_1": version_id_1,
            "version_id_2": version_id_2,
            "changed": value1 != value2,
            "value_1": value1,
            "value_2": value2
        }

class VersionedMemoryHierarchy(MemoryHierarchy):
    """Hierarquia de memória com versionamento"""
    
    def __init__(self):
        super().__init__()
        self.versioned_entries: Dict[str, VersionedMemoryEntry] = {}
    
    def set(self, key: str, value: Any, level: MemoryLevel, ttl: Optional[timedelta] = None, metadata: Optional[Dict] = None):
        """Define entrada com versionamento"""
        if key not in self.versioned_entries:
            self.versioned_entries[key] = VersionedMemoryEntry(key, value)
        else:
            self.versioned_entries[key].update(value)
        
        # Armazenar valor atual na hierarquia
        super().set(key, value, level, ttl, metadata)
    
    def get_version(self, key: str, version_id: str) -> Optional[Any]:
        """Recupera valor de uma versão específica"""
        if key not in self.versioned_entries:
            return None
        
        return self.versioned_entries[key].get(version_id)
    
    def rollback(self, key: str, version_id: str) -> bool:
        """Rollback para uma versão específica"""
        if key not in self.versioned_entries:
            return False
        
        success = self.versioned_entries[key].rollback(version_id)
        
        if success:
            # Atualizar valor atual na hierarquia
            current_value = self.versioned_entries[key].get()
            # Encontrar nível onde a chave está armazenada
            for level in [MemoryLevel.WORKING, MemoryLevel.PROJECT, MemoryLevel.GLOBAL, MemoryLevel.INSTITUTIONAL]:
                memory = self._get_memory(level)
                if key in memory:
                    memory[key].value = current_value
                    break
        
        return success
    
    def get_history(self, key: str) -> List[Dict]:
        """Retorna histórico de versões de uma chave"""
        if key not in self.versioned_entries:
            return []
        
        return self.versioned_entries[key].get_history()
    
    def diff(self, key: str, version_id_1: str, version_id_2: str) -> Dict:
        """Calcula diff entre duas versões"""
        if key not in self.versioned_entries:
            return {"error": "Key not found"}
        
        return self.versioned_entries[key].diff(version_id_1, version_id_2)

# Uso
versioned_memory = VersionedMemoryHierarchy()

# Criar entrada
versioned_memory.set("config", {"timeout": 30}, MemoryLevel.PROJECT)

# Atualizar (cria nova versão)
versioned_memory.set("config", {"timeout": 60, "retries": 3}, MemoryLevel.PROJECT)

# Atualizar novamente
versioned_memory.set("config", {"timeout": 45, "retries": 5}, MemoryLevel.PROJECT)

# Ver histórico
history = versioned_memory.get_history("config")
print(f"History: {history}")

# Diff entre versões
if len(history) >= 2:
    diff = versioned_memory.diff("config", history[0]["version_id"], history[-1]["version_id"])
    print(f"Diff: {diff}")

# Rollback para primeira versão
if len(history) >= 2:
    success = versioned_memory.rollback("config", history[0]["version_id"])
    print(f"Rollback success: {success}")
```

## Gap 3: Memory Sharing

### Conceito

Compartilhamento de memória entre agentes e sessões. Diferente de Windsurf que tem memória isolada por sessão, IDEIA_aci deve permitir compartilhamento controlado.

### Implementação com Memory Sharing

```python
from typing import Dict, Set, Optional
from enum import Enum

class ShareScope(Enum):
    PRIVATE = "private"  # Apenas o agente/sessão atual
    SESSION = "session"  # Todos os agentes na sessão
    PROJECT = "project"  # Todos os agentes no projeto
    GLOBAL = "global"  # Todos os agentes do usuário
    INSTITUTIONAL = "institutional"  # Todos os agentes da organização

@dataclass
class ShareableMemoryEntry:
    """Entrada de memória compartilhável"""
    key: str
    value: Any
    owner: str  # ID do agente/sessão que criou
    scope: ShareScope
    allowed_consumers: Set[str] = field(default_factory=set)
    created_at: datetime = field(default_factory=datetime.now)
    
    def can_access(self, consumer: str) -> bool:
        """Verifica se consumidor pode acessar"""
        if self.scope == ShareScope.PRIVATE:
            return consumer == self.owner
        
        if self.scope == ShareScope.SESSION:
            # Verificar se estão na mesma sessão (simplificado)
            return consumer.startswith(self.owner.split("_")[0])
        
        if self.scope == ShareScope.PROJECT:
            # Verificar se estão no mesmo projeto (simplificado)
            return True
        
        if self.scope == ShareScope.GLOBAL:
            return True
        
        if self.scope == ShareScope.INSTITUTIONAL:
            return True
        
        # Verificar lista de permissões explícita
        return consumer in self.allowed_consumers

class SharedMemory:
    """Memória compartilhada entre agentes"""
    
    def __init__(self):
        self.entries: Dict[str, ShareableMemoryEntry] = {}
    
    def set(self, key: str, value: Any, owner: str, scope: ShareScope, allowed_consumers: Optional[Set[str]] = None):
        """Define entrada compartilhável"""
        entry = ShareableMemoryEntry(
            key=key,
            value=value,
            owner=owner,
            scope=scope,
            allowed_consumers=allowed_consumers or set()
        )
        
        self.entries[key] = entry
        logger.info(f"Shared memory entry {key} created by {owner} with scope {scope.value}")
    
    def get(self, key: str, consumer: str) -> Optional[Any]:
        """Recupera entrada se consumidor tem permissão"""
        entry = self.entries.get(key)
        
        if entry is None:
            return None
        
        if not entry.can_access(consumer):
            logger.warning(f"Consumer {consumer} denied access to {key}")
            return None
        
        return entry.value
    
    def grant_access(self, key: str, consumer: str):
        """Concede acesso explícito a um consumidor"""
        entry = self.entries.get(key)
        
        if entry:
            entry.allowed_consumers.add(consumer)
            logger.info(f"Granted access to {key} for {consumer}")
    
    def revoke_access(self, key: str, consumer: str):
        """Revoga acesso explícito de um consumidor"""
        entry = self.entries.get(key)
        
        if entry:
            entry.allowed_consumers.discard(consumer)
            logger.info(f"Revoked access to {key} for {consumer}")

# Uso
shared_memory = SharedMemory()

# Agente A cria entrada compartilhável no nível de projeto
shared_memory.set("api_endpoint", "https://api.example.com", "agent_A", ShareScope.PROJECT)

# Agente B pode acessar (mesmo projeto)
value_b = shared_memory.get("api_endpoint", "agent_B")
print(f"Agent B got: {value_b}")

# Agente C cria entrada privada
shared_memory.set("secret_key", "abc123", "agent_C", ShareScope.PRIVATE)

# Agente D não pode acessar (privado)
value_d = shared_memory.get("secret_key", "agent_D")
print(f"Agent D got: {value_d}")  # None

# Conceder acesso explícito
shared_memory.grant_access("secret_key", "agent_D")

# Agente D agora pode acessar
value_d = shared_memory.get("secret_key", "agent_D")
print(f"Agent D got: {value_d}")  # "abc123"
```

## Gap 4: Memory Privacy

### Conceito

Privacidade de memória com PII detection, anonymization e encryption. Diferente de Windsurf que não tem privacidade explícita, IDEIA_aci deve garantir privacidade.

### Implementação com PII Detection

```python
import re
from typing import List, Dict, Optional

class PIIDetector:
    """Detector de PII (Personally Identifiable Information)"""
    
    def __init__(self):
        # Padrões de PII
        self.patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
            "credit_card": r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
            "ip_address": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
            "date_of_birth": r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b'
        }
    
    def detect(self, text: str) -> Dict[str, List[str]]:
        """Detecta PII no texto"""
        findings = {}
        
        for pii_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                findings[pii_type] = matches
        
        return findings
    
    def has_pii(self, text: str) -> bool:
        """Verifica se texto contém PII"""
        findings = self.detect(text)
        return len(findings) > 0

class PIIRedactor:
    """Redator de PII"""
    
    def __init__(self, detector: PIIDetector):
        self.detector = detector
    
    def redact(self, text: str) -> str:
        """Remove PII do texto"""
        redacted = text
        
        for pii_type, pattern in self.detector.patterns.items():
            redacted = re.sub(pattern, f"[{pii_type.upper()}]", redacted)
        
        return redacted

class PrivateMemory(MemoryHierarchy):
    """Hierarquia de memória com privacidade"""
    
    def __init__(self):
        super().__init__()
        self.pii_detector = PIIDetector()
        self.pii_redactor = PIIRedactor(self.pii_detector)
    
    def set(self, key: str, value: Any, level: MemoryLevel, ttl: Optional[timedelta] = None, metadata: Optional[Dict] = None):
        """Define entrada com verificação de PII"""
        # Converter valor para string para verificação
        value_str = str(value)
        
        if self.pii_detector.has_pii(value_str):
            logger.warning(f"PII detected in {key}, redacting")
            findings = self.pii_detector.detect(value_str)
            
            # Redatar PII
            if isinstance(value, str):
                value = self.pii_redactor.redact(value)
            elif isinstance(value, dict):
                value = {k: self.pii_redactor.redact(str(v)) if isinstance(v, str) else v for k, v in value.items()}
            
            # Adicionar metadata sobre PII
            if metadata is None:
                metadata = {}
            metadata["pii_detected"] = True
            metadata["pii_types"] = list(findings.keys())
        
        super().set(key, value, level, ttl, metadata)

# Uso
private_memory = PrivateMemory()

# Entrada com PII será redatada
private_memory.set("user_contact", "Email: john@example.com, Phone: 555-1234", MemoryLevel.PROJECT)

# Recuperar valor redatado
value = private_memory.get("user_contact")
print(f"Redacted value: {value}")  # "Email: [EMAIL], Phone: [PHONE]"
```

## Gap 5: Memory Graphs

### Conceito

Knowledge graphs para memória estruturada. Diferente de memória key-value, graphs permitem navegação e inferência.

### Implementação com Memory Graph

```python
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class MemoryNode:
    """Nó no grafo de memória"""
    id: str
    value: Any
    node_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MemoryEdge:
    """Aresta no grafo de memória"""
    source: str
    target: str
    edge_type: str
    weight: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

class MemoryGraph:
    """Grafo de memória"""
    
    def __init__(self):
        self.nodes: Dict[str, MemoryNode] = {}
        self.edges: Dict[str, List[MemoryEdge]] = defaultdict(list)
        self.adjacency: Dict[str, Set[str]] = defaultdict(set)
    
    def add_node(self, node_id: str, value: Any, node_type: str, metadata: Optional[Dict] = None):
        """Adiciona nó ao grafo"""
        node = MemoryNode(
            id=node_id,
            value=value,
            node_type=node_type,
            metadata=metadata or {}
        )
        
        self.nodes[node_id] = node
        logger.info(f"Added node {node_id} of type {node_type}")
    
    def add_edge(self, source: str, target: str, edge_type: str, weight: float = 1.0, metadata: Optional[Dict] = None):
        """Adiciona aresta ao grafo"""
        edge = MemoryEdge(
            source=source,
            target=target,
            edge_type=edge_type,
            weight=weight,
            metadata=metadata or {}
        )
        
        self.edges[source].append(edge)
        self.adjacency[source].add(target)
        logger.info(f"Added edge {source} -> {target} of type {edge_type}")
    
    def get_node(self, node_id: str) -> Optional[MemoryNode]:
        """Recupera nó"""
        return self.nodes.get(node_id)
    
    def get_neighbors(self, node_id: str) -> List[str]:
        """Recupera vizinhos de um nó"""
        return list(self.adjacency[node_id])
    
    def bfs(self, start: str, max_depth: int = 3) -> List[str]:
        """Busca em largura"""
        visited = set()
        queue = [(start, 0)]
        result = []
        
        while queue:
            node, depth = queue.pop(0)
            
            if node in visited or depth > max_depth:
                continue
            
            visited.add(node)
            result.append(node)
            
            for neighbor in self.adjacency[node]:
                if neighbor not in visited:
                    queue.append((neighbor, depth + 1))
        
        return result
    
    def dfs(self, start: str, max_depth: int = 3) -> List[str]:
        """Busca em profundidade"""
        visited = set()
        result = []
        
        def dfs_recursive(node: str, depth: int):
            if node in visited or depth > max_depth:
                return
            
            visited.add(node)
            result.append(node)
            
            for neighbor in self.adjacency[node]:
                dfs_recursive(neighbor, depth + 1)
        
        dfs_recursive(start, 0)
        return result
    
    def shortest_path(self, start: str, end: str) -> Optional[List[str]]:
        """Encontra caminho mais curto"""
        from collections import deque
        
        queue = deque([(start, [start])])
        visited = {start}
        
        while queue:
            node, path = queue.popleft()
            
            if node == end:
                return path
            
            for neighbor in self.adjacency[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        return None

# Uso
memory_graph = MemoryGraph()

# Adicionar nós
memory_graph.add_node("user_1", {"name": "John", "role": "developer"}, "user")
memory_graph.add_node("project_1", {"name": "API Project", "language": "Python"}, "project")
memory_graph.add_node("skill_1", {"name": "Python", "level": "expert"}, "skill")
memory_graph.add_node("task_1", {"name": "Implement API", "status": "in_progress"}, "task")

# Adicionar arestas
memory_graph.add_edge("user_1", "project_1", "works_on")
memory_graph.add_edge("user_1", "skill_1", "has_skill")
memory_graph.add_edge("project_1", "skill_1", "requires")
memory_graph.add_edge("user_1", "task_1", "assigned_to")
memory_graph.add_edge("task_1", "project_1", "belongs_to")

# Navegar no grafo
neighbors = memory_graph.get_neighbors("user_1")
print(f"Neighbors of user_1: {neighbors}")

# BFS
bfs_result = memory_graph.bfs("user_1", max_depth=2)
print(f"BFS from user_1: {bfs_result}")

# Caminho mais curto
path = memory_graph.shortest_path("skill_1", "task_1")
print(f"Shortest path from skill_1 to task_1: {path}")
```

## Recomendações de Implementação

### Para MVP
1. **Memory hierarchy básica:** Implementar 4 níveis (working, project, global, institutional)
2. **Memory compression:** Implementar summarization básica
3. **Memory versioning:** Implementar versionamento simples
4. **Memory privacy:** Implementar PII detection básica

### Para Produção
1. **Memory hierarchy avançada:** Adicionar cache entre níveis, prefetching
2. **Memory compression:** Adicionar quantization de embeddings
3. **Memory versioning:** Adicionar diff avançado, merge de versões
4. **Memory sharing:** Implementar sharing com ACLs
5. **Memory privacy:** Adicionar encryption, differential privacy
6. **Memory graphs:** Implementar knowledge graphs completos
7. **Memory learning:** Implementar continuous learning
8. **Memory analytics:** Implementar analytics de uso

## Integração com IDEIA-master

O package `memory-hierarchy` do IDEIA-master já implementa:
- WorkingMemory
- ProjectMemory
- GlobalMemory
- InstitutionalMemory
- MemoryCurator

Estes podem ser usados como base para implementação no IDEIA_aci.

## Referências

- Mem0: https://github.com/mem0ai/mem0
- LangChain Memory: https://python.langchain.com/docs/modules/memory/
- Knowledge Graphs: https://neo4j.com/docs/
- Differential Privacy: https://www.microsoft.com/en-us/research/project/differential-privacy/
