# Logs, auditoria e observabilidade

> **Revisão de abordagem — 12/08/2026:** telemetria operacional, evidência de auditoria e relatório humano são produtos diferentes. Append-only não será chamado de imutável sem domínio de confiança/âncora. Ver [RAT-15](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-15--logs-auditoria-e-observabilidade).

## 1. Descrição
Registra execução, decisões, tools, tokens, custos e resultados.

## 2. Importância para a plataforma
Permite diagnóstico, compliance e replay.

## 3. Ferramentas relacionadas
OpenTelemetry, Prometheus, Grafana, Loki, ELK.

## 4. Abordagens existentes
Logs estruturados + traces + métricas correlacionadas.

## 5. Grau de maturidade
Maduro.

## 6. Tecnologias recomendadas
OTel, PostgreSQL append-only e export SIEM.

## 7. Riscos e desafios
Secrets/PII em logs e volume.

## 8. Oportunidades de inovação
Timeline humana de “o que mudou e por quê”.

## 9. Próximos passos
Definir schema de evento e redaction.

## 10. Referências
https://opentelemetry.io/
