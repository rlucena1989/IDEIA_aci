# Plano de pesquisa pendente

| Pergunta de pesquisa | Motivo | Prioridade | Como pesquisar | Fontes sugeridas | Critério de conclusão |
|---|---|---|---|---|---|
| OmniRoute: validar hardening local e atualizar configuração insegura | warning de senha padrão, API anônima e rate limit em memória observados | alta | somente após encerramento das sessões que dependem do gateway; revisar docs e testar; instalação permanece protegida durante pesquisas | `C:\Users\Usuario\.omniroute\logs\application\app.log` | senha/API key/Redis e shell seguros, com evidência |
| O que Freebuff retém por plano/modelo? | serviço gratuito usa dados e anúncios | alta | política oficial consultada; confirmar exceções por modelo/conta | https://freebuff.ai/privacy-policy | matriz de dados/retention e validação contratual |
| OpenCode: segurança do sandbox e share links | risco operacional | alta | docs oficiais consultados; validar configuração no ambiente | https://opencode.ai/docs/enterprise/ | share desativado e gateway interno validados |
| Kiro: termos, créditos e retenção | custo e privacidade | média | docs de segurança e sandbox consultados; confirmar termos enterprise | https://kiro.dev/docs/privacy-and-security/ | matriz e controles contratuais |
| Antigravity: SDK, modelos e isolamento | dependência Google | média | docs consultados; validar termos/API e modo de execução | https://antigravity.google/docs/getting-started | PoC e limites documentados |
| Trae: modelos, dados e retenção | produto fechado | média | localizar política/termos por região e plano | https://trae.ai | ficha técnica com retenção |
| Segurança real de runtimes | risco crítico | alta | executar PoC/red team no ambiente escolhido; plano criado em `poc_sandbox.md` | Docker/gVisor/Firecracker | escape tests com evidência |
| Custo atual de providers | volatilidade | média | preencher template no momento da decisão | `ia/snapshot_providers_custos.md` | snapshot datado |
| Benchmark interno representativo | qualidade | alta | manifesto, fixture e baseline preparados; falta executar ferramenta comparada | `benchmarks/manifesto_10_tarefas.md`; `benchmarks/procedimento_execucao.md` | dataset versionado, execuções e relatório |
| Requisitos LGPD/GDPR aplicáveis | jurídico | alta | rascunho técnico criado; obter DPIA/assessoria | `legal/dpia_politica_privacidade_rascunho.md`; ANPD/EU | parecer documentado |
| Escalabilidade do RAG | codebases grandes | média | benchmark incremental por tamanho | `ia/benchmark_rag_codebase.md`; pgvector/Qdrant | p95, recall e custo medidos |
