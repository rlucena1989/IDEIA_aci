# Arquitetura geral

> **Revisão de abordagem — 12/08/2026:** as tecnologias abaixo são inventário histórico, não stack aprovada. O baseline vigente é monólito modular local e storage simples; serviços só entram após limitação reproduzida. Ver [RAT-01](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-01--arquitetura-geral).

Descrição: camadas de interface, orquestração, execução, dados e governança.

Importância: separa risco e permite local/cloud.

Ferramentas: Theia, VS Code, LangGraph, Temporal, Docker.

Abordagens: monólito modular no MVP; serviços depois.

Maturidade: Maduro nos componentes; composição agentic parcialmente madura.

Tecnologias recomendadas: TypeScript/Node ou Python, PostgreSQL, Redis, OpenTelemetry.

Riscos: complexidade prematura e fronteiras de segurança falsas.

Oportunidades: execução auditável e híbrida.

Próximos passos: vertical slice e ADRs.

Referências: https://opentelemetry.io; https://langchain-ai.github.io/langgraph/
