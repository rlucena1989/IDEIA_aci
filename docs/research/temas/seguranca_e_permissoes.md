# Segurança e permissões

> **Revisão de abordagem — 12/08/2026:** autorização determinística fica fora do modelo e é aplicada no ponto de efeito. Regras simples são o baseline; OPA/Cedar/Vault não entram como pacote por antecipação. Ver [RAT-13](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-13--segurança-e-permissões).

## 1. Descrição
Controla identidade, recursos, ações e aprovações.

## 2. Importância para a plataforma
Agente tem poder operacional.

## 3. Ferramentas relacionadas
RBAC, OPA/Cedar, Vault, Docker, SBOM.

## 4. Abordagens existentes
Deny-by-default, capability tokens e HITL.

## 5. Grau de maturidade
Maduro em controles clássicos; prompt injection parcial.

## 6. Tecnologias recomendadas
OPA/Cedar, Vault, seccomp, OTel.

## 7. Riscos e desafios
Confundir output do modelo com política.

## 8. Oportunidades de inovação
Policy-as-code que entende diff e impacto.

## 9. Próximos passos
Threat modeling e testes adversariais.

## 10. Referências
https://owasp.org/www-project-top-10-for-large-language-model-applications/
