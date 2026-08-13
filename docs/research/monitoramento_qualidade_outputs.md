# Estratégias de Monitoramento de Qualidade de Outputs

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e ferramentas para monitoramento de qualidade de outputs de LLM

## Visão geral

Monitoramento de qualidade de outputs é essencial para garantir que sistemas de LLM produzam respostas precisas, relevantes e fidedignas. Diferentes ferramentas e métricas são usadas para avaliar diferentes aspectos da qualidade.

## Métricas principais

### 1. Faithfulness (Fidelidade)

**Definição:** Mede se a resposta gerada é suportada pelo contexto recuperado

**Como funciona:**
- Verifica se cada claim na resposta aparece no contexto ou segue diretamente dele
- Usa LLM-as-a-judge para avaliar a fidelidade
- Escala: 0-1 (maior é melhor)

**Implementação:**
```python
from deepeval.metrics import FaithfulnessMetric
from deepeval.test_case import LLMTestCase

metric = FaithfulnessMetric(threshold=0.75)
test_case = LLMTestCase(
    input="Qual é a capital da França?",
    actual_output="A capital da França é Paris.",
    retrieval_context=["Paris é a capital e cidade mais populosa da França."]
)

result = metric.measure(test_case)
print(result.score)  # 0.0-1.0
print(result.reason)  # Explicação do LLM judge
```

**Threshold recomendado:** ≥0.75

### 2. Answer Relevance (Relevância da resposta)

**Definição:** Mede se a resposta é relevante para a pergunta

**Como funciona:**
- Verifica se a resposta aborda o assunto da pergunta
- Verifica se a resposta aborda o foco/perspectiva da pergunta
- Usa LLM-as-a-judge para avaliar a relevância
- Escala: 0-1 (maior é melhor)

**Implementação:**
```python
from deepeval.metrics import AnswerRelevancyMetric

metric = AnswerRelevancyMetric(threshold=0.80)
test_case = LLMTestCase(
    input="Como funciona o RAG?",
    actual_output="RAG é uma técnica que combina recuperação de informações com geração de texto."
)

result = metric.measure(test_case)
print(result.score)  # 0.0-1.0
print(result.reason)  # Explicação do LLM judge
```

**Threshold recomendado:** ≥0.80

### 3. Context Relevance (Relevância do contexto)

**Definição:** Mede se o contexto recuperado é relevante para a pergunta

**Como funciona:**
- Quantifica a proporção de chunks recuperados relevantes para a pergunta
- Usa LLM-as-a-judge para avaliar a relevância
- Escala: 0-1 (maior é melhor)

**Implementação:**
```python
from deepeval.metrics import ContextRelevancyMetric

metric = ContextRelevancyMetric(threshold=0.70)
test_case = LLMTestCase(
    input="O que é machine learning?",
    retrieval_context=[
        "Machine learning é um subcampo da IA.",
        "Paris é a capital da França."  # Irrelevante
    ]
)

result = metric.measure(test_case)
print(result.score)  # 0.0-1.0
```

**Threshold recomendado:** ≥0.70

### 4. Context Recall (Recall do contexto)

**Definição:** Mede se o contexto recuperado contém todas as informações necessárias

**Como funciona:**
- Métrica baseada em referência (requer output esperado)
- Quantifica a proporção de fatos do output esperado presentes no contexto
- Usa LLM-as-a-judge para avaliar
- Escala: 0-1 (maior é melhor)

**Implementação:**
```python
from ragas.metrics import ContextRecall

metric = ContextRecall()
result = metric.score(
    question="O que é RAG?",
    contexts=["RAG combina recuperação e geração."],
    ground_truth="RAG é Retrieval-Augmented Generation, uma técnica que combina recuperação de informações com geração de texto."
)
```

**Threshold recomendado:** ≥0.80

### 5. Context Precision (Precisão do contexto)

**Definição:** Mede se os chunks relevantes são classificados mais altos

**Como funciona:**
- Métrica baseada em referência (requer output esperado)
- Verifica se chunks relevantes são classificados mais altos que irrelevantes
- Avalia a qualidade do reranker
- Escala: 0-1 (maior é melhor)

**Implementação:**
```python
from ragas.metrics import ContextPrecision

metric = ContextPrecision()
result = metric.score(
    question="O que é RAG?",
    contexts=[
        "RAG combina recuperação e geração.",  # Relevante
        "Paris é a capital da França."  # Irrelevante
    ],
    ground_truth="RAG é Retrieval-Augmented Generation."
)
```

**Threshold recomendado:** ≥0.70

## Ferramentas de avaliação

### 1. DeepEval

**Foco:** CI/CD testing, agentes, chatbots  
**Métricas:** 50+ métricas  
**Integração CI:** Nativa (Pytest)  
**Custo:** Free + cloud tier  
**Best for:** SDETs, QA teams, CI regression gates

**Prós:**
- Pytest-native (falha build automaticamente)
- 50+ métricas (RAG, agentes, multi-turn, MCP, safety)
- Suporte a agentes e tool calling
- Custom metrics (G-Eval)
- Integração CI/CD nativa

**Contras:**
- Custo real (LLM-as-a-judge consome tokens)
- Requer setup de Pytest

**Implementação:**
```python
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric

def test_rag_quality():
    test_case = LLMTestCase(
        input="Qual é a capital da França?",
        actual_output="A capital da França é Paris.",
        retrieval_context=["Paris é a capital da França."]
    )
    
    assert_test(
        test_case,
        [FaithfulnessMetric(threshold=0.75), AnswerRelevancyMetric(threshold=0.80)]
    )
```

### 2. RAGAS

**Foco:** RAG pipeline evaluation  
**Métricas:** 4 core RAG metrics (faithfulness, answer relevancy, context precision, context recall)  
**Integração CI:** Manual (requer wrapper)  
**Custo:** Free (open source)  
**Best for:** RAG researchers, fast experimentation

**Prós:**
- Reference-free por padrão
- 4 core RAG metrics bem definidas
- Leve e rápido
- Foco em RAG

**Contras:**
- Sem integração CI nativa
- Métricas limitadas a RAG
- Requer wrapper manual para pass/fail

**Implementação:**
```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

result = evaluate(
    dataset=rag_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)

print(result)
```

### 3. TruLens

**Foco:** Production monitoring, observability  
**Métricas:** TruLens Triad (context relevance, groundedness, answer relevance)  
**Integração CI:** Moderate (Snowflake CLI + GitHub Action)  
**Custo:** Free-beta cloud + local  
**Best for:** MLOps teams, continuous production monitoring

**Prós:**
- OpenTelemetry tracing integrado
- Step-level instrumentation
- Feedback functions flexíveis
- Built-in Bias provider
- Melhor para localização de falhas em produção

**Contras:**
- Menos métricas que DeepEval
- Requer mais assembly
- Menos estrelas no GitHub

**Implementação:**
```python
from trulens_eval import TruBasic
from trulens_eval.feedback import Groundedness

tru = TruBasic()
feedback = Groundedness()

with tru as recorder:
    response = rag_system.query("Qual é a capital da França?")
    
    score = feedback(response, response.context)
    print(score)
```

## Comparativo de ferramentas

| Dimensão | DeepEval | RAGAS | TruLens |
|---|---|---|---|
| Primary use | CI/CD testing | RAG evaluation | Production monitoring |
| Pytest-native | Yes | No | No |
| Custom metrics | Yes (G-Eval) | Limited | Feedback functions |
| Agent testing | Yes | No | Partial |
| Reference-free | Yes | Yes | Yes |
| Tracing | Component-level | Minimal | OpenTelemetry-based |
| CI/CD integration | Native | Manual | Moderate |
| Cost | Free + cloud | Free | Free-beta cloud |
| Best for | SDETs, QA teams | RAG researchers | MLOps teams |

## Framework de avaliação

### 1. Avaliação de RAG

**Métricas principais:**
- Faithfulness (fidelidade)
- Answer relevancy (relevância da resposta)
- Context precision (precisão do contexto)
- Context recall (recall do contexto)

**Pipeline de avaliação:**
```python
from deepeval import evaluate
from deepeval.metrics import (
    FaithfulnessMetric,
    AnswerRelevancyMetric,
    ContextRelevancyMetric
)

def evaluate_rag(rag_system, test_questions):
    results = []
    
    for question in test_questions:
        # Executar RAG
        response = rag_system.query(question)
        
        # Criar test case
        test_case = LLMTestCase(
            input=question,
            actual_output=response.answer,
            retrieval_context=response.context
        )
        
        # Avaliar
        metrics = [
            FaithfulnessMetric(threshold=0.75),
            AnswerRelevancyMetric(threshold=0.80),
            ContextRelevancyMetric(threshold=0.70)
        ]
        
        for metric in metrics:
            result = metric.measure(test_case)
            results.append({
                question: question,
                metric: metric.__class__.__name__,
                score: result.score,
                reason: result.reason
            })
    
    return results
```

### 2. Avaliação de agentes

**Métricas principais:**
- Tool correctness (correção de tool calls)
- Plan adherence (adesão ao plano)
- Trajectory correctness (correção da trajetória)
- Outcome correctness (correção do resultado)

**Pipeline de avaliação:**
```python
from deepeval.metrics import ToolCorrectnessMetric, PlanAdherenceMetric

def evaluate_agent(agent, test_tasks):
    results = []
    
    for task in test_tasks:
        # Executar agente
        trajectory = agent.execute(task)
        
        # Criar test case
        test_case = LLMTestCase(
            input=task.prompt,
            actual_output=trajectory.final_output,
            tool_calls=trajectory.tool_calls,
            expected_tools=task.expected_tools
        )
        
        # Avaliar
        metrics = [
            ToolCorrectnessMetric(threshold=0.95),
            PlanAdherenceMetric(threshold=0.85)
        ]
        
        for metric in metrics:
            result = metric.measure(test_case)
            results.append({
                task: task.name,
                metric: metric.__class__.__name__,
                score: result.score
            })
    
    return results
```

### 3. Monitoramento contínuo

**Implementação:**
```python
from trulens_eval import TruBasic
from trulens_eval.feedback import Groundedness, Relevance

class QualityMonitor:
    def __init__(self):
        self.tru = TruBasic()
        self.groundedness = Groundedness()
        self.relevance = Relevance()
    
    def monitor_rag_call(self, query, response, context):
        with self.tru as recorder:
            # Avaliar groundedness
            groundedness_score = self.groundedness(response, context)
            
            # Avaliar relevance
            relevance_score = self.relevance(response, query)
            
            # Registrar métricas
            self.record_metrics({
                query: query,
                groundedness: groundedness_score,
                relevance: relevance_score,
                timestamp: datetime.now()
            })
    
    def record_metrics(self, metrics):
        # Enviar para sistema de monitoramento
        pass
```

## Thresholds de produção

### RAG systems
- **Faithfulness:** ≥0.75
- **Answer relevancy:** ≥0.80
- **Context precision:** ≥0.70
- **Context recall:** ≥0.80

### Agent systems
- **Tool correctness:** ≥0.95
- **Plan adherence:** ≥0.85
- **Trajectory correctness:** ≥0.90

### Chatbots
- **Answer relevancy:** ≥0.80
- **Faithfulness:** ≥0.75 (se usar RAG)

## Estratégias de implementação

### Fase 1: Experimentação (RAGAS)
- Usar RAGAS para experimentação rápida
- Avaliar diferentes configurações de RAG
- Iterar rapidamente sem overhead de CI

### Fase 2: CI/CD (DeepEval)
- Migrar casos de teste para DeepEval
- Integrar com Pytest
- Configurar quality gates no CI

### Fase 3: Produção (TruLens)
- Implementar TruLens para monitoramento contínuo
- Integrar com OpenTelemetry tracing
- Configurar alertas para regressões

## Recomendações

### Para desenvolvimento
- **Usar RAGAS:** Para experimentação rápida de RAG
- **Usar DeepEval:** Para testes unitários de agentes
- **Implementar golden set:** Criar conjunto de testes de referência

### Para CI/CD
- **Usar DeepEval:** Para quality gates nativos
- **Configurar thresholds:** Definir thresholds baseados em requisitos
- **Automatizar testes:** Executar testes em cada commit

### Para produção
- **Usar TruLens:** Para monitoramento contínuo
- **Implementar tracing:** Integrar com OpenTelemetry
- **Configurar alertas:** Notificar sobre regressões de qualidade

## Próximos passos

1. **Implementar RAGAS:** Criar pipeline de avaliação de RAG
2. **Implementar DeepEval:** Criar testes unitários com Pytest
3. **Implementar TruLens:** Criar monitoramento contínuo
4. **Definir thresholds:** Configurar thresholds baseados em requisitos
5. **Integrar CI/CD:** Configurar quality gates
6. **Configurar alertas:** Notificar sobre regressões

## Referências

- DeepEval: https://docs.confident-ai.com/
- RAGAS: https://docs.ragas.io/
- TruLens: https://www.trulens.org/
- RAG Evaluation Metrics: https://www.confident-ai.com/blog/rag-evaluation-metrics
