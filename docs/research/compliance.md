# Compliance

**Data:** 12 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Aprofundar Compliance baseado em gaps competitivos

## Visão Geral

Compliance é crítico para regulatórios (GDPR, SOC2, HIPAA). Diferente de sistemas sem compliance, IDEIA_aci precisa de compliance com policy enforcement, compliance monitoring, compliance reporting e compliance automation.

## Arquitetura de Compliance

### Componentes

```
┌─────────────────────────────────────┐
│   Policy Engine                      │  ← Engine de políticas
├─────────────────────────────────────┤
│   Compliance Monitor                 │  ← Monitoramento de compliance
├─────────────────────────────────────┤
│   Compliance Reporter                 │  ← Relatórios de compliance
├─────────────────────────────────────┤
│   Compliance Automator               │  ← Automação de compliance
├─────────────────────────────────────┤
│   Compliance Evidence Store           │  ← Armazenamento de evidências
└─────────────────────────────────────┘
```

## Gap 1: Policy Enforcement

### Conceito

Enforcement de políticas de compliance em tempo real. Diferente de políticas passivas, policy enforcement previne violações.

### Dependências

```python
# Sem dependências externas para este exemplo
```

### Implementação com Policy Enforcement

```python
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class CompliancePolicy(Enum):
    GDPR = "gdpr"
    SOC2 = "soc2"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"

@dataclass
class PolicyRule:
    """Regra de política"""
    rule_id: str
    policy: CompliancePolicy
    condition: str  # Condição em formato simples
    action: str  # allow, deny, log, alert
    severity: str  # low, medium, high, critical

class PolicyEnforcer:
    """Enforcer de políticas de compliance"""
    
    def __init__(self):
        self.rules: List[PolicyRule] = []
        self.violations: List[Dict] = []
    
    def add_rule(self, rule: PolicyRule):
        """Adiciona regra"""
        self.rules.append(rule)
    
    def evaluate(self, context: Dict) -> Dict:
        """Avalia contexto contra regras"""
        results = {
            "allowed": True,
            "violations": [],
            "warnings": []
        }
        
        for rule in self.rules:
            if self._evaluate_condition(rule.condition, context):
                if rule.action == "deny":
                    results["allowed"] = False
                    results["violations"].append({
                        "rule_id": rule.rule_id,
                        "policy": rule.policy.value,
                        "severity": rule.severity,
                        "condition": rule.condition
                    })
                elif rule.action == "alert":
                    results["warnings"].append({
                        "rule_id": rule.rule_id,
                        "policy": rule.policy.value,
                        "severity": rule.severity,
                        "condition": rule.condition
                    })
        
        return results
    
    def _evaluate_condition(self, condition: str, context: Dict) -> bool:
        """Avalia condição (simplificado)"""
        # Em produção, usar engine de regras real
        if "data.contains_pii" in condition and context.get("contains_pii"):
            return True
        if "data.is_encrypted" in condition and not context.get("is_encrypted"):
            return True
        if "user.has_consent" in condition and not context.get("has_consent"):
            return True
        return False

# Uso
enforcer = PolicyEnforcer()

# Adicionar regras GDPR
enforcer.add_rule(PolicyRule(
    rule_id="gdpr_pii_encryption",
    policy=CompliancePolicy.GDPR,
    condition="data.contains_pii AND NOT data.is_encrypted",
    action="deny",
    severity="critical"
))

enforcer.add_rule(PolicyRule(
    rule_id="gdpr_consent",
    policy=CompliancePolicy.GDPR,
    condition="NOT user.has_consent",
    action="deny",
    severity="high"
))

# Avaliar contexto
context = {
    "contains_pii": True,
    "is_encrypted": False,
    "has_consent": True
}

result = enforcer.evaluate(context)
print(f"Compliance result: {result}")
```

## Gap 2: Compliance Monitoring

### Conceito

Monitoramento contínuo de compliance. Diferente de checks pontuais, compliance monitoring detecta violações em tempo real.

### Implementação com Compliance Monitoring

```python
from typing import Dict, List
from datetime import datetime, timedelta

class ComplianceMonitor:
    """Monitor de compliance"""
    
    def __init__(self):
        self.enforcer = PolicyEnforcer()
        self.compliance_history: List[Dict] = []
        self.alerts: List[Dict] = []
    
    def check_compliance(self, context: Dict) -> Dict:
        """Verifica compliance"""
        result = self.enforcer.evaluate(context)
        
        # Registrar histórico
        self.compliance_history.append({
            "timestamp": datetime.now(),
            "context": context,
            "result": result
        })
        
        # Gerar alertas para violações
        for violation in result["violations"]:
            if violation["severity"] in ["high", "critical"]:
                self.alerts.append({
                    "timestamp": datetime.now(),
                    "violation": violation,
                    "context": context
                })
        
        return result
    
    def get_compliance_score(self, policy: CompliancePolicy, time_window: int = 86400) -> float:
        """Calcula score de compliance (0-1)"""
        cutoff = datetime.now() - timedelta(seconds=time_window)
        
        recent_checks = [
            h for h in self.compliance_history
            if h["timestamp"] > cutoff
        ]
        
        if not recent_checks:
            return 1.0
        
        total = len(recent_checks)
        compliant = sum(1 for h in recent_checks if h["result"]["allowed"])
        
        return compliant / total
    
    def get_violation_summary(self, time_window: int = 86400) -> Dict:
        """Resumo de violações"""
        cutoff = datetime.now() - timedelta(seconds=time_window)
        
        recent_alerts = [
            a for a in self.alerts
            if a["timestamp"] > cutoff
        ]
        
        summary = {}
        for alert in recent_alerts:
            policy = alert["violation"]["policy"]
            severity = alert["violation"]["severity"]
            
            if policy not in summary:
                summary[policy] = {}
            
            if severity not in summary[policy]:
                summary[policy][severity] = 0
            
            summary[policy][severity] += 1
        
        return summary

# Uso
monitor = ComplianceMonitor()

# Adicionar regras
monitor.enforcer.add_rule(PolicyRule(
    rule_id="test_rule",
    policy=CompliancePolicy.GDPR,
    condition="data.contains_pii AND NOT data.is_encrypted",
    action="deny",
    severity="high"
))

# Verificar compliance
result = monitor.check_compliance({"contains_pii": True, "is_encrypted": False})
print(f"Compliance check: {result}")

# Obter score
score = monitor.get_compliance_score(CompliancePolicy.GDPR)
print(f"Compliance score: {score}")
```

## Gap 3: Compliance Reporting

### Conceito

Relatórios de compliance para auditorias. Diferente de sem relatórios, compliance reporting facilita auditorias.

### Implementação com Compliance Reporting

```python
from typing import Dict, List
from datetime import datetime, timedelta
import json

class ComplianceReporter:
    """Gerador de relatórios de compliance"""
    
    def __init__(self, monitor: ComplianceMonitor):
        self.monitor = monitor
    
    def generate_report(self, policy: CompliancePolicy, start_date: datetime, end_date: datetime) -> Dict:
        """Gera relatório de compliance"""
        # Filtrar histórico por período
        checks = [
            h for h in self.monitor.compliance_history
            if start_date <= h["timestamp"] <= end_date
        ]
        
        # Calcular métricas
        total_checks = len(checks)
        compliant_checks = sum(1 for h in checks if h["result"]["allowed"])
        non_compliant_checks = total_checks - compliant_checks
        
        # Agrupar violações por tipo
        violations_by_type = {}
        for check in checks:
            for violation in check["result"]["violations"]:
                policy_type = violation["policy"]
                if policy_type not in violations_by_type:
                    violations_by_type[policy_type] = 0
                violations_by_type[policy_type] += 1
        
        return {
            "policy": policy.value,
            "report_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_checks": total_checks,
                "compliant_checks": compliant_checks,
                "non_compliant_checks": non_compliant_checks,
                "compliance_rate": compliant_checks / total_checks if total_checks > 0 else 0
            },
            "violations_by_type": violations_by_type,
            "recommendations": self._generate_recommendations(violations_by_type)
        }
    
    def _generate_recommendations(self, violations_by_type: Dict) -> List[str]:
        """Gera recomendações baseado em violações"""
        recommendations = []
        
        for policy_type, count in violations_by_type.items():
            if count > 0:
                recommendations.append(
                    f"Address {count} violations for {policy_type} policy"
                )
        
        if not recommendations:
            recommendations.append("No violations detected. Maintain current practices.")
        
        return recommendations
    
    def export_report(self, report: Dict, format: str = "json") -> str:
        """Exporta relatório"""
        if format == "json":
            return json.dumps(report, indent=2)
        elif format == "markdown":
            return self._to_markdown(report)
        else:
            raise ValueError(f"Unknown format: {format}")
    
    def _to_markdown(self, report: Dict) -> str:
        """Converte relatório para Markdown"""
        md = f"# Compliance Report: {report['policy'].upper()}\n\n"
        md += f"**Period:** {report['report_period']['start']} to {report['report_period']['end']}\n\n"
        md += "## Summary\n\n"
        md += f"- Total Checks: {report['summary']['total_checks']}\n"
        md += f"- Compliant: {report['summary']['compliant_checks']}\n"
        md += f"- Non-Compliant: {report['summary']['non_compliant_checks']}\n"
        md += f"- Compliance Rate: {report['summary']['compliance_rate']:.2%}\n\n"
        md += "## Violations by Type\n\n"
        
        for policy_type, count in report['violations_by_type'].items():
            md += f"- {policy_type}: {count}\n"
        
        md += "\n## Recommendations\n\n"
        for rec in report['recommendations']:
            md += f"- {rec}\n"
        
        return md

# Uso
reporter = ComplianceReporter(monitor)

# Gerar relatório
start_date = datetime.now() - timedelta(days=30)
end_date = datetime.now()

report = reporter.generate_report(CompliancePolicy.GDPR, start_date, end_date)
print(f"Compliance report: {json.dumps(report, indent=2)}")
```

## Recomendações de Implementação

### Para MVP
1. **Policy enforcement básico:** Implementar com regras simples
2. **Compliance monitoring básico:** Implementar com checks periódicos
3. **Compliance reporting básico:** Implementar com relatórios JSON/Markdown

### Para Produção
1. **Policy enforcement avançado:** Implementar com engine de regras complexo
2. **Compliance monitoring avançado:** Implementar com monitoramento em tempo real
3. **Compliance reporting avançado:** Implementar com relatórios detalhados e evidências
4. **Compliance automation:** Implementar com auto-remediação de violações

## Integração com IDEIA-master

O package `compliance` do IDEIA-master pode ser usado como base para implementação de compliance no IDEIA_aci.

## Referências

- GDPR: https://gdpr.eu/
- SOC2: https://www.aicpa.org/soc4so
- HIPAA: https://www.hhs.gov/hipaa/
