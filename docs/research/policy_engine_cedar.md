# Policy Engine com Cedar

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Policy Engine com Cedar baseado em gaps competitivos

## Visão Geral

Cedar é um linguagem de políticas da AWS para authorization. IDEIA-master já tem implementação de Cedar adapter. IDEIA_aci precisa expandir com policy marketplace, policy testing, policy governance e policy automation.

## Arquitetura de Policy Engine

### Componentes

```
┌─────────────────────────────────────┐
│   Policy Store                      │  ← Armazenamento de policies
├─────────────────────────────────────┤
│   Policy Evaluator                  │  ← Avaliação de policies
├─────────────────────────────────────┤
│   Policy Validator                  │  ← Validação de policies
├─────────────────────────────────────┤
│   Policy Auditor                    │  ← Auditoria de decisões
├─────────────────────────────────────┤
│   Policy Governor                   │  ← Governança de policies
└─────────────────────────────────────┘
```

## Gap 1: Policy Marketplace

### Conceito

Marketplace de policies reutilizáveis. Diferente de policies hard-coded, marketplace permite compartilhamento e descoberta.

### Implementação com Policy Marketplace

```python
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PolicyTemplate:
    """Template de policy"""
    template_id: str
    name: str
    description: str
    category: str  # security, compliance, access_control, etc.
    policy_content: str  # Cedar policy
    parameters: Dict[str, str] = field(default_factory=dict)
    author: str = ""
    version: str = "1.0.0"
    downloads: int = 0
    rating: float = 0.0
    tags: List[str] = field(default_factory=list)

class PolicyMarketplace:
    """Marketplace de policies"""
    
    def __init__(self):
        self.templates: Dict[str, PolicyTemplate] = {}
        self.categories: Dict[str, List[str]] = {}
    
    def publish_template(self, template: PolicyTemplate):
        """Publica template no marketplace"""
        self.templates[template.template_id] = template
        
        # Indexar por categoria
        if template.category not in self.categories:
            self.categories[template.category] = []
        self.categories[template.category].append(template.template_id)
        
        logger.info(f"Published policy template {template.template_id}")
    
    def search_templates(self, query: str, category: Optional[str] = None) -> List[PolicyTemplate]:
        """Busca templates"""
        results = []
        
        for template_id, template in self.templates.items():
            # Filtrar por categoria
            if category and template.category != category:
                continue
            
            # Busca por nome, descrição e tags
            query_lower = query.lower()
            if (query_lower in template.name.lower() or
                query_lower in template.description.lower() or
                any(query_lower in tag.lower() for tag in template.tags)):
                results.append(template)
        
        # Ordenar por rating e downloads
        results.sort(key=lambda t: (t.rating, t.downloads), reverse=True)
        
        return results
    
    def get_template(self, template_id: str) -> Optional[PolicyTemplate]:
        """Recupera template"""
        return self.templates.get(template_id)
    
    def instantiate_template(self, template_id: str, parameters: Dict[str, str]) -> str:
        """Instancia template com parâmetros"""
        template = self.get_template(template_id)
        
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Substituir parâmetros
        policy_content = template.policy_content
        
        for param_name, param_value in parameters.items():
            placeholder = f"${{{param_name}}}"
            policy_content = policy_content.replace(placeholder, param_value)
        
        # Incrementar downloads
        template.downloads += 1
        
        return policy_content
    
    def rate_template(self, template_id: str, rating: float):
        """Avalia template"""
        template = self.get_template(template_id)
        
        if not template:
            return
        
        # Atualizar rating (média ponderada)
        template.rating = (template.rating * template.downloads + rating) / (template.downloads + 1)
        
        logger.info(f"Rated template {template_id}: {rating}")

# Uso
marketplace = PolicyMarketplace()

# Publicar templates
marketplace.publish_template(PolicyTemplate(
    template_id="allow_admin_access",
    name="Allow Admin Access",
    description="Allows admin users full access to all resources",
    category="access_control",
    policy_content="""
        permit(principal == Admin, action, resource);
    """,
    parameters={},
    author="security_team",
    tags=["admin", "access", "security"]
))

marketplace.publish_template(PolicyTemplate(
    template_id="require_mfa",
    name="Require MFA",
    description="Requires MFA for sensitive operations",
    category="security",
    policy_content="""
        permit(principal, action, resource) when {
            has_mfa(principal) and
            is_sensitive_action(action)
        };
    """,
    parameters={},
    author="security_team",
    tags=["mfa", "security", "authentication"]
))

# Buscar templates
results = marketplace.search_templates("admin")
print(f"Search results: {[t.name for t in results]}")

# Instanciar template
policy = marketplace.instantiate_template("allow_admin_access", {})
print(f"Instantiated policy:\n{policy}")
```

## Gap 2: Policy Testing

### Conceito

Testar policies automaticamente para garantir correção. Diferente de policies não testadas, policy testing previne bugs de authorization.

### Implementação com Policy Testing

```python
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class PolicyTestCase:
    """Test case de policy"""
    test_id: str
    principal: str
    action: str
    resource: str
    expected_decision: str  # allow, deny
    description: str

@dataclass
class PolicyTestResult:
    """Resultado de teste de policy"""
    test_id: str
    passed: bool
    actual_decision: str
    expected_decision: str
    error: Optional[str] = None

class PolicyTester:
    """Testador de policies"""
    
    def __init__(self):
        self.test_cases: Dict[str, PolicyTestCase] = []
    
    def add_test_case(self, test_case: PolicyTestCase):
        """Adiciona test case"""
        self.test_cases.append(test_case)
    
    def run_tests(self, policy_content: str) -> List[PolicyTestResult]:
        """Executa testes contra policy"""
        results = []
        
        for test_case in self.test_cases:
            try:
                # Avaliar policy (simulado)
                actual_decision = self._evaluate_policy(
                    policy_content,
                    test_case.principal,
                    test_case.action,
                    test_case.resource
                )
                
                passed = actual_decision == test_case.expected_decision
                
                result = PolicyTestResult(
                    test_id=test_case.test_id,
                    passed=passed,
                    actual_decision=actual_decision,
                    expected_decision=test_case.expected_decision
                )
                
                results.append(result)
                
                if not passed:
                    logger.warning(f"Test {test_case.test_id} failed: expected {test_case.expected_decision}, got {actual_decision}")
                else:
                    logger.info(f"Test {test_case.test_id} passed")
            
            except Exception as e:
                result = PolicyTestResult(
                    test_id=test_case.test_id,
                    passed=False,
                    actual_decision="error",
                    expected_decision=test_case.expected_decision,
                    error=str(e)
                )
                results.append(result)
                logger.error(f"Test {test_case.test_id} error: {e}")
        
        return results
    
    def _evaluate_policy(self, policy: str, principal: str, action: str, resource: str) -> str:
        """Avalia policy (simulado)"""
        # Em produção, usar Cedar evaluator real
        if "permit" in policy and principal in policy:
            return "allow"
        return "deny"
    
    def generate_test_report(self, results: List[PolicyTestResult]) -> Dict:
        """Gera relatório de testes"""
        passed = sum(1 for r in results if r.passed)
        failed = len(results) - passed
        
        return {
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "pass_rate": passed / len(results) if results else 0,
            "failed_tests": [r.test_id for r in results if not r.passed]
        }

# Uso
tester = PolicyTester()

# Adicionar test cases
tester.add_test_case(PolicyTestCase(
    test_id="test_1",
    principal="Admin",
    action="read",
    resource="document",
    expected_decision="allow",
    description="Admin should be able to read documents"
))

tester.add_test_case(PolicyTestCase(
    test_id="test_2",
    principal="User",
    action="delete",
    resource="document",
    expected_decision="deny",
    description="Regular user should not be able to delete documents"
))

# Executar testes
policy = """
    permit(principal == Admin, action, resource);
    deny(principal == User, action == "delete", resource);
"""

results = tester.run_tests(policy)
report = tester.generate_test_report(results)

print(f"Test report: {report}")
```

## Gap 3: Policy Governance

### Conceito

Governança de policies de enterprise com approval workflows, versioning e compliance tracking. Diferente de policies sem governança, policy governance garantez controle e compliance.

### Implementação com Policy Governance

```python
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

class PolicyStatus(Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    DEPRECATED = "deprecated"

@dataclass
class PolicyVersion:
    """Versão de policy"""
    version_id: str
    policy_id: str
    version: str
    content: str
    status: PolicyStatus
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = ""
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    change_log: str = ""

class PolicyGovernance:
    """Governança de policies"""
    
    def __init__(self):
        self.policies: Dict[str, List[PolicyVersion]] = {}  # policy_id -> versions
        self.approvers: Dict[str, List[str]] = {}  # policy_id -> approvers
        self.approval_threshold: int = 1  # Número de aprovações necessárias
    
    def create_policy(self, policy_id: str, content: str, created_by: str) -> str:
        """Cria nova policy (draft)"""
        version_id = f"{policy_id}_v1.0.0"
        
        version = PolicyVersion(
            version_id=version_id,
            policy_id=policy_id,
            version="1.0.0",
            content=content,
            status=PolicyStatus.DRAFT,
            created_by=created_by
        )
        
        if policy_id not in self.policies:
            self.policies[policy_id] = []
        
        self.policies[policy_id].append(version)
        
        logger.info(f"Created policy {policy_id} version 1.0.0 (draft)")
        return version_id
    
    def submit_for_approval(self, policy_id: str, version: str):
        """Submete policy para aprovação"""
        versions = self.policies.get(policy_id, [])
        
        for v in versions:
            if v.version == version and v.status == PolicyStatus.DRAFT:
                v.status = PolicyStatus.PENDING_APPROVAL
                logger.info(f"Submitted policy {policy_id} version {version} for approval")
                return
        
        logger.warning(f"Policy {policy_id} version {version} not found or not in draft")
    
    def approve_policy(self, policy_id: str, version: str, approver: str):
        """Aprova policy"""
        versions = self.policies.get(policy_id, [])
        
        for v in versions:
            if v.version == version and v.status == PolicyStatus.PENDING_APPROVAL:
                # Registrar aprovação
                if policy_id not in self.approvers:
                    self.approvers[policy_id] = []
                
                if approver not in self.approvers[policy_id]:
                    self.approvers[policy_id].append(approver)
                
                # Verificar se atingiu threshold
                if len(self.approvers[policy_id]) >= self.approval_threshold:
                    v.status = PolicyStatus.APPROVED
                    v.approved_by = approver
                    v.approved_at = datetime.now()
                    logger.info(f"Policy {policy_id} version {version} approved by {approver}")
                else:
                    logger.info(f"Policy {policy_id} version {version} pending more approvals ({len(self.approvers[policy_id])}/{self.approval_threshold})")
                
                return
        
        logger.warning(f"Policy {policy_id} version {version} not found or not pending approval")
    
    def reject_policy(self, policy_id: str, version: str, approver: str, reason: str):
        """Rejeita policy"""
        versions = self.policies.get(policy_id, [])
        
        for v in versions:
            if v.version == version and v.status == PolicyStatus.PENDING_APPROVAL:
                v.status = PolicyStatus.REJECTED
                v.change_log = f"Rejected by {approver}: {reason}"
                logger.info(f"Policy {policy_id} version {version} rejected")
                return
        
        logger.warning(f"Policy {policy_id} version {version} not found or not pending approval")
    
    def get_active_version(self, policy_id: str) -> Optional[PolicyVersion]:
        """Retorna versão ativa de uma policy"""
        versions = self.policies.get(policy_id, [])
        
        for v in reversed(versions):
            if v.status == PolicyStatus.APPROVED:
                return v
        
        return None
    
    def deprecate_policy(self, policy_id: str, version: str):
        """Depreca policy"""
        versions = self.policies.get(policy_id, [])
        
        for v in versions:
            if v.version == version and v.status == PolicyStatus.APPROVED:
                v.status = PolicyStatus.DEPRECATED
                logger.info(f"Deprecated policy {policy_id} version {version}")
                return
        
        logger.warning(f"Policy {policy_id} version {version} not found or not approved")

# Uso
governance = PolicyGovernance()

# Criar policy
version_id = governance.create_policy(
    policy_id="access_policy",
    content="permit(principal == Admin, action, resource);",
    created_by="security_team"
)

# Submeter para aprovação
governance.submit_for_approval("access_policy", "1.0.0")

# Aprovar
governance.approve_policy("access_policy", "1.0.0", "manager_1")

# Verificar versão ativa
active = governance.get_active_version("access_policy")
print(f"Active version: {active.version if active else None}")
```

## Recomendações de Implementação

### Para MVP
1. **Policy marketplace básico:** Implementar com templates simples
2. **Policy testing básico:** Implementar testes unitários de policies
3. **Policy governance básico:** Implementar approval workflow simples

### Para Produção
1. **Policy marketplace avançado:** Implementar com rating, reviews, versioning
2. **Policy testing avançado:** Implementar com Cedar evaluator real, property testing
3. **Policy governance avançado:** Implementar com multi-level approval, audit trail, compliance tracking

## Integração com IDEIA-master

O package `policy-engine` do IDEIA-master já implementa:
- Cedar adapter
- Policy loader
- Approval flow
- Audit policies
- Compliance

Estes podem ser usados como base para implementação no IDEIA_aci.

## Referências

- Cedar Documentation: https://cedar.dev/docs/
- Cedar GitHub: https://github.com/cedar-policy/cedar
- AWS Verified Access: https://aws.amazon.com/verified-access/
