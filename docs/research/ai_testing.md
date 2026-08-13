# AI Testing

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar AI Testing baseado em gaps competitivos

## Visão Geral

AI Testing é crítico para qualidade de sistemas de IA. Diferente de testing tradicional, AI testing requer abordagens específicas para validar comportamento de LLMs e agentes.

## Arquitetura de AI Testing

### Componentes

```
┌─────────────────────────────────────┐
│   Test Generator                     │  ← Geração de testes
├─────────────────────────────────────┤
│   Test Executor                      │  ← Execução de testes
├─────────────────────────────────────┤
│   Test Evaluator                     │  ← Avaliação de resultados
├─────────────────────────────────────┤
│   Test Reporter                      │  ← Relatórios de testes
├─────────────────────────────────────┤
│   Regression Detector                │  ← Detecção de regressão
└─────────────────────────────────────┘
```

## Gap 1: LLM Testing

### Conceito

Testing específico para LLMs (validação de outputs, alucinações, toxicidade). Diferente de testing tradicional, LLM testing requer validação semântica.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com LLM Testing

```python
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class LLMTestCase:
    """Test case para LLM"""
    test_id: str
    prompt: str
    expected_output: Optional[str]
    expected_categories: List[str]
    forbidden_content: List[str]
    max_tokens: int = 1000

@dataclass
class LLMTestResult:
    """Resultado de teste LLM"""
    test_id: str
    passed: bool
    actual_output: str
    metrics: Dict[str, float]
    violations: List[str]

class LLMTester:
    """Testador de LLM"""
    
    def __init__(self):
        self.test_cases: List[LLMTestCase] = []
        self.results: List[LLMTestResult] = []
    
    def add_test_case(self, test_case: LLMTestCase):
        """Adiciona test case"""
        self.test_cases.append(test_case)
    
    def run_test(self, test_case: LLMTestCase, llm_function) -> LLMTestResult:
        """Executa teste"""
        # Executar LLM
        output = llm_function(test_case.prompt, max_tokens=test_case.max_tokens)
        
        # Validar
        violations = []
        metrics = {}
        
        # Verificar conteúdo proibido
        for forbidden in test_case.forbidden_content:
            if forbidden.lower() in output.lower():
                violations.append(f"Contains forbidden content: {forbidden}")
        
        # Verificar categorias esperadas (simulado)
        if test_case.expected_categories:
            category_match = self._check_categories(output, test_case.expected_categories)
            metrics["category_match"] = category_match
            
            if not category_match:
                violations.append("Output doesn't match expected categories")
        
        # Verificar output esperado (se fornecido)
        if test_case.expected_output:
            similarity = self._calculate_similarity(output, test_case.expected_output)
            metrics["similarity"] = similarity
            
            if similarity < 0.7:
                violations.append(f"Output similarity too low: {similarity:.2f}")
        
        result = LLMTestResult(
            test_id=test_case.test_id,
            passed=len(violations) == 0,
            actual_output=output,
            metrics=metrics,
            violations=violations
        )
        
        self.results.append(result)
        return result
    
    def _check_categories(self, output: str, categories: List[str]) -> bool:
        """Verifica se output contém categorias esperadas"""
        output_lower = output.lower()
        return any(cat.lower() in output_lower for cat in categories)
    
    def _calculate_similarity(self, output1: str, output2: str) -> float:
        """Calcula similaridade (simulado)"""
        # Em produção, usar embeddings reais
        words1 = set(output1.lower().split())
        words2 = set(output2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        overlap = len(words1 & words2)
        union = len(words1 | words2)
        
        return overlap / union if union > 0 else 0.0
    
    def get_test_summary(self) -> Dict:
        """Retorna resumo dos testes"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": passed / total if total > 0 else 0
        }

# Uso
llm_tester = LLMTester()

# Adicionar test cases
llm_tester.add_test_case(LLMTestCase(
    test_id="test_1",
    prompt="What is Python?",
    expected_output="Python is a programming language",
    expected_categories=["programming", "language"],
    forbidden_content=["harmful", "illegal"]
))

llm_tester.add_test_case(LLMTestCase(
    test_id="test_2",
    prompt="Explain recursion",
    expected_output=None,
    expected_categories=["function", "call"],
    forbidden_content=["confusing", "incorrect"]
))

# Simular função LLM
def mock_llm(prompt: str, max_tokens: int) -> str:
    return f"Response to: {prompt}"

# Executar testes
for test_case in llm_tester.test_cases:
    result = llm_tester.run_test(test_case, mock_llm)
    print(f"Test {result.test_id}: {'PASS' if result.passed else 'FAIL'}")

# Resumo
summary = llm_tester.get_test_summary()
print(f"Test summary: {summary}")
```

## Gap 2: Agent Testing

### Conceito

Testing de agentes multi-step. Diferente de LLM testing, agent testing valida workflows completos.

### Implementação com Agent Testing

```python
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class AgentTestCase:
    """Test case para agente"""
    test_id: str
    task: str
    expected_actions: List[str]
    expected_final_state: Dict
    max_steps: int = 10

@dataclass
class AgentTestResult:
    """Resultado de teste de agente"""
    test_id: str
    passed: bool
    actual_actions: List[str]
    final_state: Dict
    metrics: Dict[str, float]
    violations: List[str]

class AgentTester:
    """Testador de agentes"""
    
    def __init__(self):
        self.test_cases: List[AgentTestCase] = []
        self.results: List[AgentTestResult] = []
    
    def add_test_case(self, test_case: AgentTestCase):
        """Adiciona test case"""
        self.test_cases.append(test_case)
    
    def run_test(self, test_case: AgentTestCase, agent_function) -> AgentTestResult:
        """Executa teste de agente"""
        # Executar agente
        actions, final_state = agent_function(test_case.task, max_steps=test_case.max_steps)
        
        # Validar
        violations = []
        metrics = {}
        
        # Verificar ações esperadas
        for expected_action in test_case.expected_actions:
            if expected_action not in actions:
                violations.append(f"Missing expected action: {expected_action}")
        
        # Verificar estado final
        for key, expected_value in test_case.expected_final_state.items():
            if key not in final_state:
                violations.append(f"Missing final state key: {key}")
            elif final_state[key] != expected_value:
                violations.append(f"Final state mismatch for {key}: expected {expected_value}, got {final_state[key]}")
        
        # Métricas
        metrics["num_actions"] = len(actions)
        metrics["action_efficiency"] = len(test_case.expected_actions) / len(actions) if actions else 0
        
        result = AgentTestResult(
            test_id=test_case.test_id,
            passed=len(violations) == 0,
            actual_actions=actions,
            final_state=final_state,
            metrics=metrics,
            violations=violations
        )
        
        self.results.append(result)
        return result

# Uso
agent_tester = AgentTester()

# Adicionar test case
agent_tester.add_test_case(AgentTestCase(
    test_id="agent_test_1",
    task="Create a REST API endpoint",
    expected_actions=["read_file", "generate_code", "write_file"],
    expected_final_state={"files_created": 1, "endpoint_implemented": True}
))

# Simular função de agente
def mock_agent(task: str, max_steps: int) -> tuple[List[str], Dict]:
    return ["read_file", "generate_code", "write_file"], {"files_created": 1, "endpoint_implemented": True}

# Executar teste
for test_case in agent_tester.test_cases:
    result = agent_tester.run_test(test_case, mock_agent)
    print(f"Agent test {result.test_id}: {'PASS' if result.passed else 'FAIL'}")
```

## Gap 3: Regression Detection

### Conceito

Detecção de regressão em IA. Diferente de sem detecção, regression detection previne degradação de qualidade.

### Implementação com Regression Detection

```python
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class RegressionTest:
    """Teste de regressão"""
    test_id: str
    baseline_score: float
    tolerance: float = 0.05  # 5% degradação permitida

class RegressionDetector:
    """Detetor de regressão"""
    
    def __init__(self):
        self.baselines: Dict[str, RegressionTest] = {}
        self.history: List[Dict] = []
    
    def set_baseline(self, test_id: str, baseline_score: float, tolerance: float = 0.05):
        """Define baseline"""
        self.baselines[test_id] = RegressionTest(
            test_id=test_id,
            baseline_score=baseline_score,
            tolerance=tolerance
        )
    
    def check_regression(self, test_id: str, current_score: float) -> Dict:
        """Verifica regressão"""
        if test_id not in self.baselines:
            return {"status": "no_baseline", "test_id": test_id}
        
        baseline = self.baselines[test_id]
        
        # Calcular degradação
        degradation = baseline.baseline_score - current_score
        degradation_pct = degradation / baseline.baseline_score if baseline.baseline_score > 0 else 0
        
        # Verificar se houve regressão
        has_regression = degradation_pct > baseline.tolerance
        
        # Registrar histórico
        self.history.append({
            "timestamp": datetime.now(),
            "test_id": test_id,
            "baseline_score": baseline.baseline_score,
            "current_score": current_score,
            "degradation_pct": degradation_pct,
            "has_regression": has_regression
        })
        
        return {
            "status": "regression" if has_regression else "ok",
            "test_id": test_id,
            "baseline_score": baseline.baseline_score,
            "current_score": current_score,
            "degradation_pct": degradation_pct,
            "tolerance": baseline.tolerance
        }
    
    def get_regression_summary(self) -> Dict:
        """Retorna resumo de regressões"""
        recent = [h for h in self.history if h["has_regression"]]
        
        return {
            "total_checks": len(self.history),
            "regressions": len(recent),
            "regression_rate": len(recent) / len(self.history) if self.history else 0,
            "affected_tests": list(set(h["test_id"] for h in recent))
        }

# Uso
regression_detector = RegressionDetector()

# Definir baselines
regression_detector.set_baseline("accuracy_test", 0.95, tolerance=0.03)
regression_detector.set_baseline("latency_test", 100.0, tolerance=0.10)  # 10% aumento permitido

# Verificar regressão (sem regressão)
result = regression_detector.check_regression("accuracy_test", 0.94)
print(f"Check result: {result}")

# Verificar regressão (com regressão)
result = regression_detector.check_regression("accuracy_test", 0.90)
print(f"Check result: {result}")

# Resumo
summary = regression_detector.get_regression_summary()
print(f"Regression summary: {summary}")
```

## Recomendações de Implementação

### Para MVP
1. **LLM testing básico:** Implementar com testes simples de output
2. **Agent testing básico:** Implementar com validação de ações
3. **Regression detection básico:** Implementar com baselines simples

### Para Produção
1. **LLM testing avançado:** Implementar com validação semântica real
2. **Agent testing avançado:** Implementar com validação complexa de workflows
3. **Regression detection avançado:** Implementar com detecção automática e alertas

## Integração com IDEIA-master

O package `test-orchestrator` do IDEIA-master pode ser usado como base para implementação de AI testing no IDEIA_aci.

## Referências

- RAGAS: https://github.com/explodinggradients/ragas
- DeepEval: https://github.com/confident-ai/deepeval
- Promptfoo: https://github.com/promptfoo/promptfoo
