# CI/CD

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar CI/CD baseado em gaps competitivos

## Visão Geral

CI/CD é crítico para deploy automatizado. Diferente de deploy manual, CI/CD permite integração contínua e entrega contínua.

## Arquitetura de CI/CD

### Componentes

```
┌─────────────────────────────────────┐
│   CI Pipeline                        │  ← Pipeline de Integração Contínua
├─────────────────────────────────────┤
│   CD Pipeline                        │  ← Pipeline de Entrega Contínua
├─────────────────────────────────────┤
│   Build Cache                        │  ← Cache de builds
├─────────────────────────────────────┤
│   Test Automation                    │  ← Automação de testes
├─────────────────────────────────────┤
│   Deployment Automation              │  ← Automação de deploy
└─────────────────────────────────────┘
```

## Gap 1: CI Pipeline

### Conceito

Pipeline de CI com testes automatizados. Diferente de sem CI, CI Pipeline detecta problemas antes do deploy.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com CI Pipeline

```python
from typing import Dict, List, Callable, Optional
from dataclasses import dataclass
from enum import Enum

class CIStage(Enum):
    LINT = "lint"
    TEST = "test"
    BUILD = "build"
    PACKAGE = "package"

@dataclass
class CIJob:
    """Job de CI"""
    job_id: str
    name: str
    stage: CIStage
    handler: Callable
    dependencies: List[str]
    status: str = "pending"
    result: Optional[Dict] = None

class CIPipeline:
    """Pipeline de CI"""
    
    def __init__(self, name: str):
        self.name = name
        self.jobs: Dict[str, CIJob] = {}
        self.execution_order: List[str] = []
    
    def add_job(self, job: CIJob):
        """Adiciona job"""
        self.jobs[job.job_id] = job
    
    def build_execution_order(self) -> List[str]:
        """Constrói ordem de execução"""
        visited = set()
        order = []
        
        def visit(job_id: str):
            if job_id in visited:
                return
            
            visited.add(job_id)
            
            if job_id in self.jobs:
                for dep_id in self.jobs[job_id].dependencies:
                    visit(dep_id)
            
            order.append(job_id)
        
        for job_id in self.jobs:
            visit(job_id)
        
        self.execution_order = order
        return order
    
    def execute(self) -> Dict:
        """Executa pipeline"""
        self.build_execution_order()
        
        results = {
            "pipeline": self.name,
            "jobs": {},
            "success": True,
            "errors": []
        }
        
        for job_id in self.execution_order:
            job = self.jobs[job_id]
            
            # Verificar dependências
            dependencies_met = True
            for dep_id in job.dependencies:
                if dep_id in self.jobs and self.jobs[dep_id].status != "success":
                    dependencies_met = False
                    job.status = "skipped"
                    break
            
            if not dependencies_met:
                continue
            
            # Executar job
            try:
                job.status = "running"
                print(f"Executing job: {job.name}")
                
                result = job.handler()
                job.result = result
                job.status = "success"
                
                results["jobs"][job_id] = {
                    "status": "success",
                    "result": str(result)
                }
            
            except Exception as e:
                job.status = "failed"
                results["success"] = False
                results["errors"].append(f"Job {job_id} failed: {e}")
                break
        
        return results

# Uso
pipeline = CIPipeline("IDEIA_aci CI")

# Adicionar jobs
pipeline.add_job(CIJob(
    job_id="lint",
    name="Lint Code",
    stage=CIStage.LINT,
    handler=lambda: {"errors": 0, "warnings": 2},
    dependencies=[]
))

pipeline.add_job(CIJob(
    job_id="test",
    name="Run Tests",
    stage=CIStage.TEST,
    handler=lambda: {"passed": 42, "failed": 0},
    dependencies=["lint"]
))

pipeline.add_job(CIJob(
    job_id="build",
    name="Build Project",
    stage=CIStage.BUILD,
    handler=lambda: {"build_time": "2m30s"},
    dependencies=["test"]
))

pipeline.add_job(CIJob(
    job_id="package",
    name="Package Artifacts",
    stage=CIStage.PACKAGE,
    handler=lambda: {"artifacts": ["package.tar.gz"]},
    dependencies=["build"]
))

# Executar pipeline
result = pipeline.execute()
print(f"CI result: {result}")
```

## Gap 2: CD Pipeline

### Conceito

Pipeline de CD com deploy automatizado. Diferente de deploy manual, CD Pipeline automatiza o deploy.

### Implementação com CD Pipeline

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class CDEnvironment(Enum):
    DEV = "dev"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class CDDeployment:
    """Deploy de CD"""
    deployment_id: str
    environment: CDEnvironment
    version: str
    handler: Callable
    status: str = "pending"
    result: Optional[Dict] = None

class CDPipeline:
    """Pipeline de CD"""
    
    def __init__(self, name: str):
        self.name = name
        self.deployments: Dict[str, CDDeployment] = {}
        self.deployment_order: List[str] = []
    
    def add_deployment(self, deployment: CDDeployment):
        """Adiciona deployment"""
        self.deployments[deployment.deployment_id] = deployment
    
    def set_deployment_order(self, order: List[str]):
        """Define ordem de deployment"""
        self.deployment_order = order
    
    def execute(self) -> Dict:
        """Executa pipeline"""
        results = {
            "pipeline": self.name,
            "deployments": {},
            "success": True,
            "errors": []
        }
        
        for deployment_id in self.deployment_order:
            deployment = self.deployments[deployment_id]
            
            try:
                deployment.status = "running"
                print(f"Deploying to {deployment.environment.value}: {deployment.version}")
                
                result = deployment.handler()
                deployment.result = result
                deployment.status = "success"
                
                results["deployments"][deployment_id] = {
                    "environment": deployment.environment.value,
                    "version": deployment.version,
                    "status": "success"
                }
            
            except Exception as e:
                deployment.status = "failed"
                results["success"] = False
                results["errors"].append(f"Deployment {deployment_id} failed: {e}")
                break
        
        return results

# Uso
cd_pipeline = CDPipeline("IDEIA_aci CD")

# Adicionar deployments
cd_pipeline.add_deployment(CDDeployment(
    deployment_id="dev_deploy",
    environment=CDEnvironment.DEV,
    version="v1.0.0-dev",
    handler=lambda: {"url": "https://dev.ideia.aci"}
))

cd_pipeline.add_deployment(CDDeployment(
    deployment_id="staging_deploy",
    environment=CDEnvironment.STAGING,
    version="v1.0.0-staging",
    handler=lambda: {"url": "https://staging.ideia.aci"}
))

cd_pipeline.add_deployment(CDDeployment(
    deployment_id="prod_deploy",
    environment=CDEnvironment.PRODUCTION,
    version="v1.0.0",
    handler=lambda: {"url": "https://ideia.aci"}
))

# Definir ordem
cd_pipeline.set_deployment_order(["dev_deploy", "staging_deploy", "prod_deploy"])

# Executar pipeline
result = cd_pipeline.execute()
print(f"CD result: {result}")
```

## Gap 3: Build Cache

### Conceito

Cache de builds para acelerar CI/CD. Diferente de sem cache, build cache reduz tempo de build.

### Implementação com Build Cache

```python
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib
import json

@dataclass
class BuildCacheEntry:
    """Entrada de cache de build"""
    cache_key: str
    build_hash: str
    artifacts: Dict
    created_at: datetime
    size_bytes: int

class BuildCache:
    """Cache de builds"""
    
    def __init__(self, max_size_mb: int = 1000):
        self.cache: Dict[str, BuildCacheEntry] = {}
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.current_size_bytes = 0
    
    def generate_cache_key(self, source_files: Dict[str, str], dependencies: List[str]) -> str:
        """Gera chave de cache"""
        # Hash dos arquivos fonte
        source_hash = hashlib.sha256(
            json.dumps(source_files, sort_keys=True).encode()
        ).hexdigest()
        
        # Hash das dependências
        deps_hash = hashlib.sha256(
            json.dumps(sorted(dependencies)).encode()
        ).hexdigest()
        
        return f"{source_hash}_{deps_hash}"
    
    def get(self, cache_key: str) -> Optional[BuildCacheEntry]:
        """Retorna entrada do cache"""
        return self.cache.get(cache_key)
    
    def put(self, cache_key: str, artifacts: Dict, size_bytes: int):
        """Adiciona entrada ao cache"""
        # Verificar se cabe no cache
        if self.current_size_bytes + size_bytes > self.max_size_bytes:
            self._evict_lru()
        
        entry = BuildCacheEntry(
            cache_key=cache_key,
            build_hash=hashlib.sha256(json.dumps(artifacts).encode()).hexdigest(),
            artifacts=artifacts,
            created_at=datetime.now(),
            size_bytes=size_bytes
        )
        
        self.cache[cache_key] = entry
        self.current_size_bytes += size_bytes
    
    def _evict_lru(self):
        """Remove entrada menos recentemente usada"""
        if not self.cache:
            return
        
        # Encontrar entrada mais antiga
        oldest_key = min(
            self.cache.keys(),
            key=lambda k: self.cache[k].created_at
        )
        
        entry = self.cache[oldest_key]
        self.current_size_bytes -= entry.size_bytes
        del self.cache[oldest_key]
    
    def clear(self):
        """Limpa cache"""
        self.cache.clear()
        self.current_size_bytes = 0

# Uso
build_cache = BuildCache(max_size_mb=500)

# Gerar chave de cache
source_files = {"main.py": "content", "utils.py": "content"}
dependencies = ["langchain", "openai"]
cache_key = build_cache.generate_cache_key(source_files, dependencies)

# Verificar cache
cached = build_cache.get(cache_key)
if cached:
    print(f"Cache hit: {cached.artifacts}")
else:
    print("Cache miss, building...")
    
    # Simular build
    artifacts = {"binary": "binary_data"}
    size_bytes = 1024
    
    # Adicionar ao cache
    build_cache.put(cache_key, artifacts, size_bytes)
    print("Added to cache")
```

## Recomendações de Implementação

### Para MVP
1. **CI pipeline básico:** Implementar com lint, test, build
2. **CD pipeline básico:** Implementar com deploy para dev
3. **Build cache básico:** Implementar com cache simples

### Para Produção
1. **CI pipeline avançado:** Implementar com testes de integração e e2e
2. **CD pipeline avançado:** Implementar com blue-green deployment
3. **Build cache avançado:** Implementar com cache distribuído

## Integração com IDEIA-master

O package `release-automation` do IDEIA-master pode ser usado como base para implementação de CI/CD no IDEIA_aci.

## Referências

- GitHub Actions: https://github.com/features/actions
- GitLab CI: https://docs.gitlab.com/ee/ci/
