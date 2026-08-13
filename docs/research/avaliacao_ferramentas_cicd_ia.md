# Avaliação de Ferramentas de CI/CD para IA

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de CI/CD para IA (GitHub Actions, GitLab CI, CircleCI) e recomendar a melhor opção

## Visão geral

CI/CD para IA tem requisitos específicos como treinamento de modelos, avaliação de qualidade, deployment de modelos e monitoramento contínuo. Diferentes ferramentas oferecem abordagens distintas para orquestrar pipelines de ML.

## Ferramentas comparadas

### 1. GitHub Actions

**Foco:** CI/CD nativo do GitHub  
**GitHub stars:** ~50k (julho 2026)  
**Licença:** Proprietário (free para repos públicos, paid para privados)  
**Primary focus:** General CI/CD  
**Language support:** Multi-plataforma (YAML workflows)  
**ML-specific features:** Limited (requer custom actions)  
**Pricing:** Free (2000 min/mo para privados), paid from $4/mo

**Prós:**
- Integração nativa com GitHub
- Marketplace com muitas actions
- Suporte a self-hosted runners
- Matrix builds para testes paralelos
- Caching de dependências
- Secrets management
- Suporte a containers
- Workflow dispatch para triggers manuais
- Artifacts e logs

**Contras:**
- Recursos ML limitados (requer custom actions)
- Curva de aprendizado para workflows complexos
- Limites de minutos em free tier
- Sem features nativas de ML (experiment tracking, model registry)
- Requer configuração manual para pipelines de ML

**Best for:**
- Projetos no GitHub
- CI/CD geral
- Integração com código
- Equipes usando GitHub

**Implementação básica:**
```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  train:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install scikit-learn pandas
      
      - name: Train model
        run: |
          python train.py
      
      - name: Evaluate model
        run: |
          python evaluate.py
      
      - name: Upload model
        uses: actions/upload-artifact@v3
        with:
          name: model
          path: model.pkl
```

**Features avançadas:**
```yaml
name: Advanced ML Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  train-and-evaluate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        model: ['random-forest', 'gradient-boosting']
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Train model
        run: python train.py --model ${{ matrix.model }}
      
      - name: Evaluate model
        run: python evaluate.py --model ${{ matrix.model }}
      
      - name: Upload metrics
        uses: actions/upload-artifact@v3
        with:
          name: metrics-${{ matrix.model }}
          path: metrics.json
  
  deploy:
    needs: train-and-evaluate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Download model
        uses: actions/download-artifact@v3
        with:
          name: model
      
      - name: Deploy to production
        run: |
          python deploy.py
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### 2. GitLab CI/CD

**Foco:** CI/CD nativo do GitLab  
**GitHub stars:** ~30k (julho 2026)  
**Licença:** Proprietário (free tier, paid para enterprise)  
**Primary focus:** DevOps completo (CI/CD + registry + monitoring)  
**Language support:** Multi-plataforma (YAML pipelines)  
**ML-specific features:** Limited (requer custom scripts)  
**Pricing:** Free (400 min/mo), paid from $19/mo

**Prós:**
- Integração nativa com GitLab
- Built-in container registry
- Built-in monitoring (Prometheus)
- Artifacts e cache
- Variables e secrets
- Auto DevOps (CI/CD automático)
- Review Apps para preview
- Pipeline scheduling
- Merge request approvals
- DAST e SAST integrados

**Contras:**
- Recursos ML limitados
- Curva de aprendizado para features avançadas
- Limites de minutos em free tier
- Sem features nativas de ML
- Requer GitLab (não funciona com GitHub)

**Best for:**
- Projetos no GitLab
- Equipes usando GitLab
- DevOps completo
- Integração com registry

**Implementação básica:**
```yaml
# .gitlab-ci.yml
stages:
  - train
  - evaluate
  - deploy

train:
  stage: train
  image: python:3.10
  script:
    - pip install -r requirements.txt
    - python train.py
  artifacts:
    paths:
      - model.pkl
    expire_in: 1 week

evaluate:
  stage: evaluate
  image: python:3.10
  script:
    - pip install -r requirements.txt
    - python evaluate.py
  artifacts:
    paths:
      - metrics.json
    expire_in: 1 week

deploy:
  stage: deploy
  image: python:3.10
  script:
    - python deploy.py
  only:
    - main
  when: manual
```

**Features avançadas:**
```yaml
stages:
  - train
  - evaluate
  - deploy

variables:
  MODEL_TYPE: "random-forest"

train:
  stage: train
  image: python:3.10
  parallel:
    matrix:
      - MODEL_TYPE: ["random-forest", "gradient-boosting"]
  script:
    - pip install -r requirements.txt
    - python train.py --model $MODEL_TYPE
  artifacts:
    paths:
      - model-$MODEL_TYPE.pkl
    expire_in: 1 week
  cache:
    paths:
      - ~/.cache/pip

evaluate:
  stage: evaluate
  image: python:3.10
  needs:
    - train
  script:
    - pip install -r requirements.txt
    - python evaluate.py --model $MODEL_TYPE
  artifacts:
    paths:
      - metrics-$MODEL_TYPE.json
    expire_in: 1 week

deploy:
  stage: deploy
  image: python:3.10
  needs:
    - evaluate
  script:
    - python deploy.py
  only:
    - main
  environment:
    name: production
    url: https://api.example.com
  when: manual
```

### 3. CircleCI

**Foco:** CI/CD cloud-first  
**GitHub stars:** ~15k (julho 2026)  
**Licença:** Proprietário (free tier, paid para scale)  
**Primary focus:** CI/CD rápido e confiável  
**Language support:** Multi-plataforma (YAML config)  
**ML-specific features:** Limited (requer custom orbs)  
**Pricing:** Free (6000 min/mo), paid from $15/mo

**Prós:**
- Setup rápido
- Performance consistente
- Docker support nativo
- Workflows complexos
- Caching avançado
- Contexts para compartilhar secrets
- Orbs para reuso de configuração
- Self-hosted runners
- Parallelism
- Resource classes

**Contras:**
- Recursos ML limitados
- Curva de aprendizado para workflows complexos
- Limites de minutos em free tier
- Sem features nativas de ML
- Custo para scale

**Best for:**
- Performance crítica
- Workflows complexos
- Docker-heavy workflows
- Equipes que querem setup rápido

**Implementação básica:**
```yaml
# .circleci/config.yml
version: 2.1

jobs:
  train:
    docker:
      - image: python:3.10
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: pip install -r requirements.txt
      - run:
          name: Train model
          command: python train.py
      - persist_to_workspace:
          root: .
          paths:
            - model.pkl

  evaluate:
    docker:
      - image: python:3.10
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Evaluate model
          command: python evaluate.py
      - store_artifacts:
          path: metrics.json

workflows:
  ml-pipeline:
    jobs:
      - train
      - evaluate:
          requires:
            - train
```

**Features avançadas:**
```yaml
version: 2.1

orbs:
  python: circleci/python@2.0.0

jobs:
  train:
    parameters:
      model:
        type: string
        default: "random-forest"
    docker:
      - image: python:3.10
    steps:
      - checkout
      - python/install-packages:
          pkg-manager: pip
          pip-dependency-file: requirements.txt
      - run:
          name: Train model
          command: python train.py --model << parameters.model >>
      - persist_to_workspace:
          root: .
          paths:
            - model-<< parameters.model >>.pkl

  evaluate:
    parameters:
      model:
        type: string
        default: "random-forest"
    docker:
      - image: python:3.10
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Evaluate model
          command: python evaluate.py --model << parameters.model >>
      - store_artifacts:
          path: metrics-<< parameters.model >>.json

workflows:
  ml-pipeline:
    jobs:
      - train:
          matrix:
            parameters:
              model: ["random-forest", "gradient-boosting"]
      - evaluate:
          matrix:
            parameters:
              model: ["random-forest", "gradient-boosting"]
          requires:
            - train
```

## Ferramentas ML-specific

### 1. MLflow

**Foco:** MLOps platform (experiment tracking, model registry, deployment)  
**GitHub stars:** ~15k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** MLOps completo  
**Language support:** Python, R, Java  
**CI/CD integration:** Via hooks e API  
**Pricing:** Free (open source), paid cloud tier

**Prós:**
- Experiment tracking completo
- Model registry
- Deployment (MLflow Models)
- Hyperparameter tracking
- Artifact logging
- UI para visualização
- Integration com CI/CD
- Multi-language support

**Contras:**
- Requer setup adicional
- Curva de aprendizado
- Não é CI/CD nativo
- Requer integração manual

**Implementação com GitHub Actions:**
```yaml
name: MLflow Pipeline

on:
  push:
    branches: [main]

jobs:
  train:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install mlflow scikit-learn pandas
      
      - name: Train model with MLflow
        run: |
          mlflow run . --no-conda
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_TRACKING_USERNAME }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_TRACKING_PASSWORD }}
```

### 2. Kubeflow Pipelines

**Foco:** ML pipelines em Kubernetes  
**GitHub stars:** ~13k (julho 2026)  
**Licença:** Apache 2.0  
**Primary focus:** ML pipelines em escala  
**Language support:** Python, Argo workflows  
**CI/CD integration:** Via Kubernetes  
**Pricing:** Free (self-host), paid cloud tier

**Prós:**
- Escalabilidade nativa (Kubernetes)
- Pipeline UI
- Component reusability
- Experiment tracking
- Hyperparameter tuning
- Distributed training
- Integration com Kubeflow

**Contras:**
- Requer Kubernetes
- Complexo de setup
- Curva de aprendizado íngreme
- Overhead para projetos pequenos

**Implementação:**
```python
from kfp import dsl, compiler

@dsl.component
def train_model(data_path: str, model_path: dsl.OutputPath(str)):
    import mlflow.sklearn
    from sklearn.ensemble import RandomForestClassifier
    import joblib
    
    # Treinar modelo
    model = RandomForestClassifier()
    # ... training logic ...
    
    # Salvar modelo
    joblib.dump(model, model_path)

@dsl.pipeline
def ml_pipeline(data_path: str):
    train_task = train_model(data_path=data_path)

# Compilar pipeline
compiler.Compiler().compile(ml_pipeline, 'pipeline.yaml')
```

### 3. Vertex AI Pipelines

**Foco:** ML pipelines no Google Cloud  
**GitHub stars:** ~2k (julho 2026)  
**Licença:** Proprietário  
**Primary focus:** GCP ML pipelines  
**Language support:** Python  
**CI/CD integration:** Via GCP  
**Pricing:** Usage-based

**Prós:**
- Integração nativa com GCP
- Escalabilidade automática
- Managed service
- Integration com Vertex AI
- Auto ML
- Hyperparameter tuning

**Contras:**
- Vendor lock-in (GCP)
- Custo
- Curva de aprendizado
- Limitado a GCP

## Comparativo detalhado

### Features

| Feature | GitHub Actions | GitLab CI | CircleCI | MLflow | Kubeflow |
|---|---|---|---|---|---|
| CI/CD nativo | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Experiment tracking | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Model registry | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Container registry | ⚠️ GHCR | ✅ Built-in | ❌ No | ⚠️ Via MLflow | ⚠️ Via K8s |
| Self-hosted | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| ML-specific | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Free tier | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Learning curve | Low | Medium | Low-Medium | Medium | High |

### Performance

| Metric | GitHub Actions | GitLab CI | CircleCI |
|---|---|---|---|
| Setup time | 5-10 min | 10-20 min | 5-10 min |
| Pipeline speed | Fast | Medium | Fast |
| Parallelism | ✅ Yes | ✅ Yes | ✅ Yes |
| Caching | ✅ Yes | ✅ Yes | ✅ Yes |

### Casos de uso

| Caso de uso | GitHub Actions | GitLab CI | CircleCI | MLflow | Kubeflow |
|---|---|---|---|---|---|
| General CI/CD | ✅ Best | ✅ Good | ✅ Good | ❌ No | ❌ No |
| ML pipelines | ⚠️ Custom | ⚠️ Custom | ⚠️ Custom | ✅ Good | ✅ Best |
| Experiment tracking | ❌ No | ❌ No | ❌ No | ✅ Best | ✅ Good |
| Model registry | ❌ No | ❌ No | ❌ No | ✅ Best | ✅ Good |
| Scale | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ✅ Best |

## Recomendações por caso de uso

### General CI/CD (GitHub)
**Recomendado:** GitHub Actions
- Integração nativa
- Marketplace rico
- Setup rápido
- Custo baixo

### General CI/CD (GitLab)
**Recomendado:** GitLab CI/CD
- Integração nativa
- Built-in registry
- Auto DevOps
- Monitoring integrado

### Performance crítica
**Recomendado:** CircleCI
- Performance consistente
- Setup rápido
- Docker nativo
- Workflows complexos

### ML pipelines pequenos
**Recomendado:** GitHub Actions + MLflow
- CI/CD nativo
- Experiment tracking
- Model registry
- Custo baixo

### ML pipelines em escala
**Recomendado:** Kubeflow Pipelines
- Escalabilidade nativa
- Component reusability
- Distributed training
- Kubernetes integration

### MLOps completo
**Recomendado:** MLflow + CI/CD tool
- Experiment tracking
- Model registry
- Deployment
- Integration com CI/CD

## Arquitetura híbrida

**Padrão recomendado:** GitHub Actions para CI/CD + MLflow para MLOps

**Implementação:**
```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline with MLflow

on:
  push:
    branches: [main]

jobs:
  train:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install mlflow scikit-learn pandas
      
      - name: Train model with MLflow
        run: |
          mlflow run . --no-conda
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_TRACKING_USERNAME }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_TRACKING_PASSWORD }}
      
      - name: Register model
        run: |
          mlflow models register-model \
            --name "my-model" \
            --run-id ${{ mlflow_run_id }}
```

## Estratégia de implementação

### Fase 1: Escolha e setup
- Selecionar ferramenta baseado em caso de uso
- Configurar CI/CD
- Integrar com repositório
- Criar primeiro pipeline

### Fase 2: ML integration
- Configurar MLflow (se necessário)
- Implementar experiment tracking
- Configurar model registry
- Integrar com CI/CD

### Fase 3: Deploy
- Configurar deployment
- Automatizar release
- Configurar monitoring
- Testar pipeline completo

### Fase 4: Otimização
- Otimizar performance
- Adicionar caching
- Configurar parallelism
- Escalar infraestrutura

## Checklist de implementação

### Para GitHub Actions
- [ ] Criar workflow YAML
- [ ] Configurar triggers
- [ ] Implementar jobs
- [ ] Configurar caching
- [ ] Adicionar secrets
- [ ] Testar pipeline
- [ ] Configurar artifacts
- [ ] Deploy para produção

### Para GitLab CI
- [ ] Criar .gitlab-ci.yml
- [ ] Configurar stages
- [ ] Implementar jobs
- [ ] Configurar cache
- [ ] Adicionar variables
- [ ] Testar pipeline
- [ ] Configurar artifacts
- [ ] Deploy para produção

### Para CircleCI
- [ ] Criar config.yml
- [ ] Configurar workflows
- [ ] Implementar jobs
- [ ] Configurar caching
- [ ] Adicionar contexts
- [ ] Testar pipeline
- [ ] Configurar orbs
- [ ] Deploy para produção

### Para MLflow
- [ ] Instalar MLflow
- [ ] Configurar tracking server
- [ ] Implementar experiment tracking
- [ ] Configurar model registry
- [ ] Integrar com CI/CD
- [ ] Configurar deployment

## Próximos passos

1. **Escolher ferramenta:** Selecionar baseado em caso de uso
2. **Implementar pipeline:** Criar primeiro workflow
3. **Integrar MLOps:** Adicionar MLflow se necessário
4. **Testar localmente:** Validar pipeline
5. **Deploy para produção:** Configurar automação
6. **Monitorar:** Configurar alertas e métricas

## Referências

- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
- CircleCI: https://circleci.com/docs/
- MLflow: https://mlflow.org/
- Kubeflow: https://www.kubeflow.org/
