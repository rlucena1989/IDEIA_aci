# Matriz de riscos

| Risco | Categoria | Probabilidade | Impacto | Severidade | Mitigação | Prioridade |
|---|---|---:|---:|---:|---|---|
| execução destrutiva | segurança | média | crítico | crítica | sandbox/HITL/snapshot | alta |
| prompt injection | segurança | alta | alto | crítica | separar dados, políticas | alta |
| vazamento de secrets | segurança | média | crítico | crítica | Vault/redaction/local | alta |
| baixa qualidade do agente | IA/produto | alta | alto | alta | testes/reviewer/benchmark | alta |
| custo imprevisível | custo | alta | alto | alta | budgets/router/cache | alta |
| indisponibilidade provider | dependência | média | médio | média | fallback/local | média |
| escape de sandbox | técnico | baixa | crítico | alta | VM/gVisor/patching | alta |
| conflito multiagente | técnico | média | alto | alta | worktrees/locks | alta |
| RAG incorreto | qualidade | alta | médio | alta | citações/re-ranking | média |
| lock-in | produto | média | médio | média | adapters/open source | média |
| licenças incompatíveis | jurídico | baixa | alto | alta | SBOM/revisão jurídica | média |
| escopo excessivo | produto | alta | alto | alta | MVP focado | alta |
| adoção baixa | produto | média | alto | alta | extensão/CLI familiar | média |
| dados cross-tenant | segurança | baixa | crítico | alta | isolation/tests | alta |
| dependência vulnerável | supply chain | média | alto | alta | pin/audit/SBOM | alta |
