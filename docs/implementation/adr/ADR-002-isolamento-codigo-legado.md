# ADR-002 — Isolamento do código legado durante a implementação do P0

- Status: aceita
- Data: 2026-08-13
- Escopo: implementação do P0

## Contexto

A árvore packages contém trabalho anterior que não corresponde integralmente à arquitetura P0 atualmente documentada. A auditoria local encontrou:

- 20 manifestos package.json;
- 265 arquivos TypeScript;
- 70 arquivos de teste;
- ausência de repositório Git, package.json raiz, lockfile, node_modules, tsconfig.base.json e compilador TypeScript instalado;
- 9 dependências internas @ideia ausentes;
- componentes de coordenação multiagente, memória, MCP, plugins, LangGraph, PostgreSQL, compliance e outras capacidades posteriores ao P0.

Alguns módulos contêm ideias aproveitáveis, mas seus contratos, estados, decisões de política, persistência e garantias de segurança não são os contratos normativos do P0.

## Decisão

1. A árvore packages será tratada como somente leitura e referência histórica.
2. A implementação vigente começará em uma nova árvore p0.
3. Nenhum pacote de trabalho será formulado como “reutilize um pacote existente”.
4. Não serão permitidos imports de packages para p0.
5. Um componente legado só poderá ser promovido depois de:
   - mapear seus comportamentos para RFs e RNFs vigentes;
   - passar por testes de contrato independentes;
   - remover dependências ausentes ou pertencentes a P1/P2;
   - passar por revisão de segurança quando tocar efeitos, credenciais, política ou persistência;
   - demonstrar custo de adaptação menor que uma implementação mínima nova.

## Classificação inicial

| Área existente | Uso no P0 |
|---|---|
| packages/src e coordenação de agentes | Não reutilizar; arquitetura diferente |
| policy-engine | Apenas exemplos e casos adversariais |
| audit-trail | Fonte de casos adversariais; não é o registro canônico |
| context-provenance | Fonte de ideias de metadados; não reutilizar hashes |
| test-orchestrator | Fonte de ideias de parsing; não reutilizar execução bloqueante |
| resource-manager | Fonte de nomes de métricas |
| memória, MCP, plugins, LangGraph, LSP e quantização | Fora do P0 |
| benchmark_fixture | Reutilização parcial após alinhar esquema e critérios |

## Consequências

- Haverá alguma duplicação deliberada de código pequeno e determinístico.
- A superfície inicial de dependências e de revisão será menor.
- Comparações com o legado deverão ocorrer por comportamento e testes, nunca por importação incidental.
- A quarentena poderá ser removida seletivamente por uma ADR posterior.

