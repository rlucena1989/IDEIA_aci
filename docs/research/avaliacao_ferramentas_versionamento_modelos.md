# Avaliação de Ferramentas de Versionamento de Modelos

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de versionamento de modelos (MLflow, DVC, Hugging Face Hub) e recomendar a melhor opção

## Visão geral

Versionamento de modelos é crítico para rastrear experimentos, comparar performance, reverter para versões anteriores e garantir reprodutibilidade. Diferentes ferramentas oferecem abordagens distintas para gerenciar modelos, dados e metadados.

## Ferramentas comparadas

### 1. MLflow Model Registry

**Foco:** Model registry e experiment tracking  
**GitHub stars:** ~15k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** MLOps completo  
**Language support:** Python, R, Java  
**Model formats:** Todos (via MLflow Models)  
**Storage:** Local, S3, Azure Blob, GCS, DBFS  
**Pricing:** Free (open source), paid cloud tier

**Prós:**
- Model registry completo
- Experiment tracking integrado
- Versioning automático
- Staging e production stages
- Model serving (MLflow Models)
- Integration com CI/CD
- UI para visualização
- Multi-language support
- Model signatures
- Artifact logging

**Contras:**
- Requer setup de tracking server
- Curva de aprendizado
- Overhead para projetos simples
- UI pode ser limitada
- Requer integração manual com Git

**Best for:**
- MLOps completo
- Experiment tracking
- Model registry
- Multi-language projects
- Equipes que precisam de MLOps

**Implementação básica:**
```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier

# Iniciar experiment
mlflow.set_experiment("my-experiment")

# Treinar modelo
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Logar métricas
mlflow.log_metric("accuracy", 0.95)
mlflow.log_metric("precision", 0.93)

# Logar modelo
mlflow.sklearn.log_model(
    model,
    "model",
    registered_model_name="my-model"
)

# Logar parâmetros
mlflow.log_param("n_estimators", 100)
mlflow.log_param("max_depth", 10)

# Logar artefatos
mlflow.log_artifact("config.yaml")
```

**Features avançadas:**
```python
import mlflow
from mlflow.tracking import MlflowClient

# Client para model registry
client = MlflowClient()

# Criar modelo registrado
client.create_registered_model(
    name="my-model",
    description="Modelo para classificação"
)

# Criar versão do modelo
model_version = client.create_model_version(
    name="my-model",
    source="runs:/<run-id>/model",
    run_id="<run-id>"
)

# Transicionar para staging
client.transition_model_version_stage(
    name="my-model",
    version=model_version.version,
    stage="Staging"
)

# Transicionar para production
client.transition_model_version_stage(
    name="my-model",
    version=model_version.version,
    stage="Production"
)

# Carregar modelo do registry
import mlflow.pyfunc

model = mlflow.pyfunc.load_model(
    model_uri="models:/my-model/Production"
)

predictions = model.predict(X_test)
```

### 2. DVC (Data Version Control)

**Foco:** Versionamento de dados e modelos  
**GitHub stars:** ~12k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** Data versioning + ML pipelines  
**Language support:** Python, CLI  
**Model formats:** Todos (via Git + DVC)  
**Storage:** Local, S3, Azure Blob, GCS, SSH  
**Pricing:** Free (open source), paid cloud tier

**Prós:**
- Git-like para dados e modelos
- Versionamento de datasets grandes
- Pipeline orquestration
- Metrics tracking
- Remote storage support
- Integration com Git
- Lightweight
- Data caching
- Experiment tracking básico

**Contras:**
- Curva de aprendizado
- Requer configuração de remote storage
- Sem model registry nativo
- UI limitada (VS Code extension)
- Menos features que MLflow

**Best for:**
- Versionamento de dados
- ML pipelines
- Projetos com datasets grandes
- Equipes usando Git
- Data science teams

**Implementação básica:**
```bash
# Inicializar DVC
dvc init

# Adicionar dataset
dvc add data/train.csv

# Commit no Git
git add data/train.csv.dvc .gitignore
git commit -m "Add training data"

# Push para remote storage
dvc remote add -d myremote s3://my-bucket/dvc
dvc push

# Pull de remote storage
dvc pull
```

**Features avançadas:**
```yaml
# dvc.yaml
stages:
  train:
    cmd: python train.py
    deps:
      - data/train.csv
      - src/train.py
    params:
      - model.n_estimators
      - model.max_depth
    metrics:
      - metrics.json:
          cache: false
    outs:
      - models/model.pkl:
          cache: true
```

```python
# train.py
import dvc.api
import json
import joblib
from sklearn.ensemble import RandomForestClassifier

# Carregar dados via DVC
train_data = dvc.api.open('data/train.csv', mode='r')

# Carregar parâmetros
with open('params.yaml') as f:
    params = yaml.safe_load(f)

# Treinar modelo
model = RandomForestClassifier(
    n_estimators=params['model']['n_estimators'],
    max_depth=params['model']['max_depth']
)
model.fit(X_train, y_train)

# Salvar modelo
joblib.dump(model, 'models/model.pkl')

# Salvar métricas
metrics = {
    'accuracy': 0.95,
    'precision': 0.93
}
with open('metrics.json', 'w') as f:
    json.dump(metrics, f)
```

### 3. Hugging Face Hub

**Foco:** Model hub e dataset hub  
**GitHub stars:** ~25k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** Sharing e collaboration de modelos  
**Language support:** Python, JavaScript  
**Model formats:** PyTorch, TensorFlow, JAX, Flax  
**Storage:** Hugging Face Hub (cloud)  
**Pricing:** Free (public), paid (private)

**Prós:**
- Model hub público
- Dataset hub
- Integration com Transformers
- Versioning automático
- Model cards
- Community sharing
- Inference API
- Spaces para demos
- Easy to use

**Contras:**
- Vendor lock-in (Hugging Face)
- Limitado a modelos de ML
- Sem experiment tracking
- Sem model registry avançado
- Privado tem custo

**Best for:**
- Sharing modelos públicos
- Transformers models
- Datasets públicos
- Collaboration
- Demos (Spaces)

**Implementação básica:**
```python
from huggingface_hub import login, upload_file, ModelCard
from transformers import AutoModel, AutoTokenizer

# Login
login(token="your-token")

# Carregar modelo
model = AutoModel.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Fine-tune
# ... fine-tuning logic ...

# Upload para Hub
model.push_to_hub("my-model")
tokenizer.push_to_hub("my-model")

# Criar model card
card = ModelCard.load("my-model")
card.text = """
# My Model

This is my fine-tuned BERT model.
"""
card.push_to_hub("my-model")
```

**Features avançadas:**
```python
from huggingface_hub import HfApi, Repository
import json

# API para gerenciamento
api = HfApi()

# Criar repositório
api.create_repo(
    repo_id="my-org/my-model",
    repo_type="model",
    private=True
)

# Upload de arquivos
api.upload_file(
    path_or_fileobj="model.pkl",
    path_in_repo="model.pkl",
    repo_id="my-org/my-model",
    repo_type="model"
)

# Upload de métricas
api.upload_file(
    path_or_fileobj=json.dumps({"accuracy": 0.95}),
    path_in_repo="metrics.json",
    repo_id="my-org/my-model",
    repo_type="model"
)

# Listar versões
model_info = api.model_info("my-org/my-model")
print(model_info.modelId)

# Download de versão específica
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="my-org/my-model",
    revision="v1.0.0"
)
```

## Ferramentas adicionais

### 1. Weights & Biases

**Foco:** Experiment tracking e model registry  
**GitHub stars:** ~8k (julho 2026)  
**Licença:** Proprietário (free tier, paid)  
**Primary focus:** Experiment tracking  
**Language support:** Python, R, Julia  
**Model formats:** Todos  
**Storage:** W&B cloud  
**Pricing:** Free (100GB storage), paid from $108/mo

**Prós:**
- Experiment tracking avançado
- Model registry
- Artifacts logging
- Hyperparameter sweeps
- Collaboration features
- UI rica
- Integration com frameworks

**Contras:**
- Vendor lock-in
- Custo para scale
- Curva de aprendizado
- Cloud-only (sem self-host)

**Implementação:**
```python
import wandb

# Iniciar experiment
wandb.init(project="my-project")

# Logar métricas
wandb.log({"accuracy": 0.95, "loss": 0.05})

# Logar modelo
wandb.save("model.pkl")

# Logar artefatos
wandb.log_artifact("config.yaml")

# Finalizar
wandb.finish()
```

### 2. ClearML

**Foco:** Experiment tracking e MLOps  
**GitHub stars:** ~5k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** MLOps completo  
**Language support:** Python, MATLAB  
**Model formats:** Todos  
**Storage:** Local, S3, Azure, GCS  
**Pricing:** Free (open source), paid cloud tier

**Prós:**
- Experiment tracking
- Model registry
- Hyperparameter optimization
- Data management
- Orquestration
- UI rica
- Self-host possível

**Contras:**
- Curva de aprendizado
- Comunidade menor
- Documentação limitada

**Implementação:**
```python
from clearml import Task

# Iniciar task
task = Task.init(project_name="my-project", task_name="train")

# Logar parâmetros
task.connect({"lr": 0.001, "epochs": 10})

# Logar métricas
logger = task.get_logger()
logger.report_scalar("accuracy", iteration=1, value=0.95)

# Upload de modelo
task.upload_artifact("model", artifact_object="model.pkl")
```

## Comparativo detalhado

### Features

| Feature | MLflow | DVC | Hugging Face | W&B | ClearML |
|---|---|---|---|---|---|
| Model registry | ✅ Best | ⚠️ Basic | ⚠️ Basic | ✅ Good | ✅ Good |
| Experiment tracking | ✅ Best | ⚠️ Basic | ❌ No | ✅ Best | ✅ Good |
| Data versioning | ⚠️ Via artifacts | ✅ Best | ❌ No | ⚠️ Via artifacts | ⚠️ Via artifacts |
| Model serving | ✅ Yes | ❌ No | ✅ Yes (Inference API) | ❌ No | ❌ No |
| Git integration | ⚠️ Manual | ✅ Native | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| Self-host | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Free tier | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| UI | ✅ Good | ⚠️ Basic | ✅ Good | ✅ Best | ✅ Good |
| Learning curve | Medium | Medium | Low | Low-Medium | Medium |

### Performance

| Metric | MLflow | DVC | Hugging Face |
|---|---|---|---|
| Setup time | 10-20 min | 5-10 min | 5 min |
| Storage overhead | Medium | Low | Low |
| Versioning speed | Fast | Fast | Fast |
| Scalability | High | High | High |

### Casos de uso

| Caso de uso | MLflow | DVC | Hugging Face | W&B |
|---|---|---|---|---|
| Model registry | ✅ Best | ⚠️ Basic | ⚠️ Basic | ✅ Good |
| Data versioning | ⚠️ Via artifacts | ✅ Best | ❌ No | ⚠️ Via artifacts |
| Experiment tracking | ✅ Best | ⚠️ Basic | ❌ No | ✅ Best |
| Sharing models | ⚠️ Via registry | ⚠️ Via Git | ✅ Best | ⚠️ Via registry |
| MLOps completo | ✅ Best | ⚠️ Good | ❌ No | ✅ Good |

## Recomendações por caso de uso

### MLOps completo
**Recomendado:** MLflow
- Model registry completo
- Experiment tracking
- Model serving
- Multi-language

### Versionamento de dados
**Recomendado:** DVC
- Git-like para dados
- Pipeline orquestration
- Remote storage
- Integration com Git

### Sharing modelos públicos
**Recomendado:** Hugging Face Hub
- Model hub público
- Dataset hub
- Integration com Transformers
- Community sharing

### Experiment tracking avançado
**Recomendado:** Weights & Biases
- Experiment tracking avançado
- Hyperparameter sweeps
- UI rica
- Collaboration features

### Self-host MLOps
**Recomendado:** MLflow ou ClearML
- Self-host possível
- Model registry
- Experiment tracking
- MLOps completo

## Arquitetura híbrida

**Padrão recomendado:** DVC para dados + MLflow para modelos + Hugging Face para sharing

**Implementação:**
```python
# DVC para dados
import dvc.api

# Carregar dados versionados
train_data = dvc.api.open('data/train.csv', mode='r')

# MLflow para modelos
import mlflow
import mlflow.sklearn

# Treinar modelo
model = train_model(train_data)

# Logar no MLflow
mlflow.sklearn.log_model(
    model,
    "model",
    registered_model_name="my-model"
)

# Upload para Hugging Face (opcional)
from huggingface_hub import login, push_to_hub
login(token="your-token")
model.push_to_hub("my-model")
```

## Estratégia de implementação

### Fase 1: Escolha e setup
- Selecionar ferramenta baseado em caso de uso
- Instalar e configurar
- Criar primeiro experiment/model
- Testar versionamento

### Fase 2: Integration
- Integrar com CI/CD
- Configurar automação
- Adicionar ao pipeline
- Testar integração

### Fase 3: Collaboration
- Configurar sharing (se necessário)
- Adicionar colaboradores
- Configurar permissões
- Documentar processo

### Fase 4: Otimização
- Otimizar storage
- Configurar caching
- Automatizar versionamento
- Monitorar uso

## Checklist de implementação

### Para MLflow
- [ ] Instalar MLflow
- [ ] Configurar tracking server
- [ ] Criar experiment
- [ ] Implementar logging
- [ ] Configurar model registry
- [ ] Integrar com CI/CD
- [ ] Testar versionamento
- [ ] Configurar serving

### Para DVC
- [ ] Instalar DVC
- [ ] Inicializar DVC
- [ ] Configurar remote storage
- [ ] Adicionar datasets
- [ ] Criar pipeline
- [ ] Integrar com Git
- [ ] Testar versionamento
- [ ] Configurar cache

### Para Hugging Face Hub
- [ ] Criar conta
- [ ] Gerar token
- [ ] Criar repositório
- [ ] Upload modelo
- [ ] Criar model card
- [ ] Testar download
- [ ] Configurar sharing

## Próximos passos

1. **Escolher ferramenta:** Selecionar baseado em caso de uso
2. **Implementar protótipo:** Criar primeiro experiment/model
3. **Testar versionamento:** Validar processo de versionamento
4. **Integrar CI/CD:** Automatizar versionamento
5. **Configurar sharing:** Se necessário
6. **Documentar processo:** Criar guia de uso

## Referências

- MLflow: https://mlflow.org/
- DVC: https://dvc.org/
- Hugging Face Hub: https://huggingface.co/docs/hub
- Weights & Biases: https://wandb.ai/
- ClearML: https://clear.ml/
