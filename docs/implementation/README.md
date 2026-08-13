# Implementação do P0

**Data de controle:** 13 de agosto de 2026  
**Status:** preparação de implementação; nenhum claim de P0 implementado ou validado

Este diretório transforma a especificação documental do P0 em unidades de trabalho verificáveis.

## Documentos

- [Prontidão e estratégia de delegação](p0_prontidao_delegacao.md)
- [Pacotes de trabalho](p0_pacotes_de_trabalho.md)
- [Prompts da primeira onda](p0_prompts_primeira_onda.md)
- [Handoffs autocontidos prontos para distribuição](handoffs/README.md)
- [Fila de preparação futura](fila_preparacao_futura.md)
- [ADR-001 — runtime do vertical slice](adr/ADR-001-runtime-p0.md)
- [ADR-002 — isolamento do código legado](adr/ADR-002-isolamento-codigo-legado.md)
- [ADR-003 — identificadores e versão de contratos](adr/ADR-003-identificadores-e-versao-de-contratos.md)
- [ADR-004 — JSON canônico e fingerprints](adr/ADR-004-json-canonico-e-fingerprints.md)
- [ADR-005 — validação JSON Schema no build](adr/ADR-005-validacao-json-schema.md)
- [ADR-006 — ports e ciclo do provider](adr/ADR-006-portas-e-ciclo-do-provider.md)
- [ADR-007 — IDs operacionais adicionais](adr/ADR-007-identificadores-operacionais-adicionais.md)
- [ADR-008 — perfil SQLite](adr/ADR-008-perfil-sqlite-p0.md)
- [ADR-009 — lifecycle de artifacts](adr/ADR-009-lifecycle-de-artifacts.md)
- [ADR-010 — recovery/reconciliação](adr/ADR-010-recovery-e-reconciliacao.md)
- [ADR-011 — preços/orçamento exatos](adr/ADR-011-valores-exatos-precos-e-orcamentos.md)
- [ADR-012 — sandbox/capabilities](adr/ADR-012-perfis-de-sandbox-e-capabilities.md)
- [Contratos P0 v1](contracts/README.md)
- [DDL SQLite rc](persistence/p0_v1.sql)
- [Mapeamento contratos ↔ SQLite](persistence/schema_mapping_v1.md)
- [Artifact lifecycle](artifacts/lifecycle_v1.md)
- [Admissão de GovernanceBundle](governance/admission_v1.md)
- [Pre-admissão e criação da task](admission/preflight_v1.md)
- [Recovery protocol](recovery/protocol_v1.md)
- [Matriz de gates](gates/p0_gate_matrix.md)
- [Rastreabilidade P0](traceability/p0_matrix.md)
- [Perfil MP-P0](measurement/README.md)
- [Incidente aberto SEC-INC-001](security/SEC-INC-001-chave-em-documentacao.md)

## Regra de autoridade

A fonte normativa continua sendo: [visão](../research/produto/visao_do_produto.md), [casos de uso](../research/produto/casos_de_uso.md), [RF](../research/produto/requisitos_funcionais.md), [RNF](../research/produto/requisitos_nao_funcionais.md), estudos v2 de arquitetura/IA/segurança e ADRs aceitas deste diretório.

Um pacote de trabalho não pode ampliar o escopo nem reinterpretar requisito. Divergência bloqueia o pacote e retorna para decisão; não é resolvida por improvisação do modelo.
