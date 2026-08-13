# Avaliação de Ferramentas de Teste de Agentes

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de teste de agentes (LangSmith, Promptfoo, Evals) e recomendar a melhor opção

## Visão geral

Teste de agentes é fundamental para garantir que sistemas de IA multi-agente funcionem corretamente. Diferentes ferramentas oferecem abordagens distintas para testar comportamento, traçar execução e avaliar resultados.

## Ferramentas comparadas

### 1. LangSmith

**Foco:** Tracing, evaluation e debugging de LLMs e agentes  
**GitHub stars:** ~15k (julho 2026)  
**Licença:** MIT (core), paid cloud tier  
**Primary focus:** LLM application observability  
**Language support:** Python, TypeScript  
**Agent testing:** Native support  
**Tracing:** OpenTelemetry-based  
**Evaluation:** Built-in evaluators  
**Integration:** LangChain, LlamaIndex, custom agents  
**Pricing:** Free tier (10k runs/mo), paid from $49/mo

**Prós:**
- Tracing detalhado de cada passo do agente
- Visualização de trajetórias de execução
- Avaliação automática com LLM-as-a-judge
- Integração nativa com LangChain
- Dataset management para golden sets
- Comparação de runs side-by-side
- Feedback loops para coletar feedback humano
- Suporte a multi-turn conversations
- Export de traces para análise offline

**Contras:**
- Cloud tier tem custo
- Requer integração com LangChain para máximo benefício
- Curva de aprendizado para configuração avançada
- Limitações no free tier (10k runs/mo)

**Best for:**
- LangChain agents e LangGraph workflows
- Debugging de trajetórias complexas
- Avaliação contínua de qualidade
- Equipes usando ecossistema LangChain

**Implementação básica:**
```python
from langsmith import Client, traceable
from langchain_openai import ChatOpenAI

# Inicializar cliente
client = Client()

# Criar dataset
dataset = client.create_dataset(
    name="agent-tasks",
    description="Golden set de tarefas para o agente"
)

# Adicionar exemplos
client.create_example(
    dataset_id=dataset.id,
    inputs={"task": "Criar endpoint de login"},
    outputs={"expected_files": ["login.py", "auth.py"]}
)

# Decorar função do agente para tracing
@traceable(name="agent-execution")
def run_agent(task):
    llm = ChatOpenAI(model="gpt-4")
    response = llm.invoke(task)
    return response

# Executar com tracing
result = run_agent("Criar endpoint de login")

# Avaliar com LangSmith evaluators
from langsmith.evaluators import run_evaluator

def evaluate_agent(run, example):
    expected = example.outputs["expected_files"]
    actual = run.outputs["files_created"]
    return {"score": len(set(expected) & set(actual)) / len(expected)}

results = run_evaluator(
    dataset_name="agent-tasks",
    evaluator=evaluate_agent
)
```

**Dashboard features:**
- Timeline de execução com timestamps
- Visualização de tool calls
- Análise de token usage por step
- Comparação de diferentes runs
- Feedback collection de usuários

### 2. Promptfoo

**Foco:** Testing de prompts e LLM outputs  
**GitHub stars:** ~8k (julho 2026)  
**Licença:** MIT  
**Primary focus:** Prompt testing e evaluation  
**Language support:** CLI, JavaScript/TypeScript, Python  
**Agent testing:** Basic support (via custom evaluators)  
**Tracing:** Limited  
**Evaluation:** Custom evaluators, assertions  
**Integration:** OpenAI, Anthropic, custom providers  
**Pricing:** Free (open source)

**Prós:**
- CLI simples e poderosa
- Suporta múltiplos providers simultaneamente
- Assertions flexíveis (regex, JSON schema, similarity)
- Visual diff de outputs
- CI/CD integration nativa
- Configuração via YAML
- Suporta variáveis e templates
- Local execution (sem cloud dependency)
- Comparação de modelos side-by-side

**Contras:**
- Menos focado em agentes específicos
- Tracing limitado comparado a LangSmith
- Requer configuração manual para cada teste
- Menos recursos de visualização
- Sem dataset management nativo

**Best for:**
- Testing de prompts individuais
- Comparação de modelos
- CI/CD gates para prompts
- Equipes que preferem CLI
- Local development e testing

**Implementação básica:**
```yaml
# promptfooconfig.yaml
prompts:
  - prompt: "Você é um assistente de código. {{task}}"
    provider: openai:gpt-4
  - prompt: "Como desenvolvedor sênior, {{task}}"
    provider: anthropic:claude-3-5-sonnet

providers:
  - id: openai:gpt-4
  - id: anthropic:claude-3-5-sonnet

tests:
  - description: "Criar endpoint de login"
    vars:
      task: "Crie um endpoint de login em Python"
    assertions:
      - type: icontains
        value: "def login"
      - type: icontains
        value: "authentication"
      - type: javascript
        value: "output.includes('password') || output.includes('token')"
```

**Execução:**
```bash
# Executar testes
npx promptfoo eval

# Visualizar resultados
npx promptfoo view

# Integrar no CI
npx promptfoo eval --share
```

**Assertions disponíveis:**
- `contains`: Verifica se output contém substring
- `icontains`: Case-insensitive contains
- `regex`: Match com regex
- `javascript`: Custom JavaScript assertion
- `json-schema`: Valida JSON schema
- `similaridade`: Similaridade de texto (cosine, Jaccard)
- `llm-rubric`: Avaliação via LLM

### 3. Evals (OpenAI)

**Foco:** Avaliação de modelos OpenAI  
**GitHub stars:** ~5k (julho 2026)  
**Licença:** MIT  
**Primary focus:** OpenAI model evaluation  
**Language support:** Python  
**Agent testing:** Limited (model-focused)  
**Tracing:** None  
**Evaluation:** Built-in metrics  
**Integration:** OpenAI API only  
**Pricing:** Free (open source)

**Prós:**
- Mantido pela OpenAI
- Métricas específicas para OpenAI models
- Benchmarking de modelos
- Suporte a custom evaluators
- Integração direta com OpenAI API
- Leve e rápido

**Contras:**
- Limitado a OpenAI models
- Menos recursos de tracing
- Não focado em agentes específicos
- Menor comunidade
- Limitações em custom workflows

**Best for:**
- Avaliação de modelos OpenAI
- Benchmarking entre modelos OpenAI
- Equipes usando exclusivamente OpenAI
- Avaliação de qualidade de outputs

**Implementação básica:**
```python
from openai import OpenAI
from openai.evals import evaluate

client = OpenAI()

# Definir dataset
dataset = [
    {
        "input": "Crie um endpoint de login",
        "expected": "def login(username, password):"
    }
]

# Definir evaluator
def custom_evaluator(output, expected):
    return {
        "score": expected in output,
        "reason": "Contains expected function signature"
    }

# Executar avaliação
results = evaluate(
    dataset=dataset,
    model="gpt-4",
    evaluator=custom_evaluator
)

print(results)
```

## Comparativo detalhado

### Features

| Feature | LangSmith | Promptfoo | Evals |
|---|---|---|---|
| Tracing detalhado | ✅ Best | ⚠️ Limited | ❌ None |
| Agent testing | ✅ Native | ⚠️ Basic | ❌ Limited |
| Multi-provider | ✅ Yes | ✅ Yes | ❌ OpenAI only |
| CI/CD integration | ✅ Yes | ✅ Best | ⚠️ Manual |
| Dataset management | ✅ Yes | ⚠️ Manual | ❌ None |
| Visual dashboard | ✅ Best | ⚠️ Basic | ❌ None |
| Local execution | ⚠️ Cloud+local | ✅ Yes | ✅ Yes |
| Custom evaluators | ✅ Yes | ✅ Yes | ✅ Yes |
| LLM-as-a-judge | ✅ Native | ✅ Yes | ⚠️ Manual |
| Cost | Free + paid | Free | Free |

### Performance

| Metric | LangSmith | Promptfoo | Evals |
|---|---|---|---|
| Setup time | 10-15 min | 5-10 min | 5-10 min |
| Test execution speed | Fast (cloud) | Fast (local) | Fast (local) |
| Learning curve | Medium | Low | Low |
| Maintenance overhead | Medium | Low | Low |

### Casos de uso

| Caso de uso | LangSmith | Promptfoo | Evals |
|---|---|---|---|
| Debugging de agentes | ✅ Best | ⚠️ Limited | ❌ No |
| Testing de prompts | ⚠️ Good | ✅ Best | ⚠️ Good |
| CI/CD gates | ✅ Yes | ✅ Best | ⚠️ Manual |
| Model comparison | ✅ Yes | ✅ Best | ⚠️ OpenAI only |
| Production monitoring | ✅ Best | ❌ No | ❌ No |

## Recomendações por caso de uso

### LangChain agents e LangGraph workflows
**Recomendado:** LangSmith
- Integração nativa com LangChain
- Tracing detalhado de trajetórias
- Visualização de tool calls
- Melhor para debugging complexo

### Testing de prompts e modelos
**Recomendado:** Promptfoo
- CLI simples e rápida
- Suporta múltiplos providers
- Assertions flexíveis
- CI/CD integration nativa
- Local execution

### OpenAI-only evaluation
**Recomendado:** Evals
- Mantido pela OpenAI
- Métricas específicas para OpenAI
- Leve e rápido
- Benchmarking de modelos

### Production monitoring
**Recomendado:** LangSmith
- Dashboard em tempo real
- Tracing contínuo
- Alertas e anomalias
- Feedback loops

### CI/CD gates
**Recomendado:** Promptfoo
- Configuração via YAML
- Execução local
- Share de resultados
- Integração com GitHub Actions

## Arquitetura híbrida

**Padrão recomendado:** Promptfoo para CI/CD + LangSmith para debugging e monitoring

**Implementação:**
```yaml
# CI/CD com Promptfoo
name: Agent Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: promptfoo/promptfoo-action@v0.0.1
        with:
          config: promptfooconfig.yaml
          share: true
```

```python
# LangSmith para debugging em desenvolvimento
from langsmith import Client, traceable

@traceable(name="agent-execution")
def run_agent(task):
    # Executar agente
    pass

# Em produção, LangSmith coleta traces automaticamente
```

## Estratégia de implementação

### Fase 1: Desenvolvimento (LangSmith)
- Configurar LangSmith para tracing
- Criar golden sets de tarefas
- Debugar trajetórias de execução
- Coletar feedback inicial

### Fase 2: CI/CD (Promptfoo)
- Migrar casos de teste para Promptfoo
- Configurar assertions
- Integrar com GitHub Actions
- Configurar quality gates

### Fase 3: Produção (LangSmith)
- Habilitar LangSmith em produção
- Configurar alertas de anomalias
- Monitorar qualidade contínua
- Coletar feedback de usuários

## Checklist de implementação

### Para LangSmith
- [ ] Criar conta LangSmith
- [ ] Configurar API key
- [ ] Instalar SDK (pip install langsmith)
- [ ] Criar dataset de golden sets
- [ ] Decorar funções do agente com @traceable
- [ ] Configurar evaluators customizados
- [ ] Testar tracing local
- [ ] Configurar dashboard

### Para Promptfoo
- [ ] Instalar CLI (npm install -g promptfoo)
- [ ] Criar promptfooconfig.yaml
- [ ] Definir prompts e providers
- [ ] Criar casos de teste
- [ ] Configurar assertions
- [ ] Executar testes localmente
- [ ] Integrar com CI/CD
- [ ] Configurar share de resultados

### Para Evals
- [ ] Instalar SDK (pip install openai-evals)
- [ ] Definir dataset de avaliação
- [ ] Criar evaluators customizados
- [ ] Executar avaliação
- [ ] Analisar resultados

## Próximos passos

1. **Escolher ferramenta primária:** Selecionar baseado em caso de uso
2. **Implementar protótipo:** Criar primeiros testes
3. **Definir golden sets:** Criar conjunto de referência
4. **Configurar CI/CD:** Integrar testes no pipeline
5. **Monitorar produção:** Habilitar tracing em produção
6. **Iterar:** Melhorar testes baseado em feedback

## Referências

- LangSmith: https://docs.langsmith.com/
- Promptfoo: https://promptfoo.dev/
- OpenAI Evals: https://github.com/openai/evals
- LangChain Testing: https://docs.langchain.com/docs/guides/evaluation
