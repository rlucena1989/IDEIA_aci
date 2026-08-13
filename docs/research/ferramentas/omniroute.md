# OmniRoute

## 1. Resumo rápido
- Nome: OmniRoute
- Categoria: gateway/router de LLMs, proxy OpenAI-compatible e plataforma de operações de inferência
- Repositório original/canônico: https://github.com/diegosouzapw/OmniRoute
- Instalação local consultada: `C:\Users\Usuario\.omniroute`
- Pacote local observado: `omniroute` v3.8.49; homepage `https://omniroute.online`
- Status: ativo e em uso local
- Licença: MIT conforme `package.json` local; confirmar também o arquivo `LICENSE` do commit distribuído antes de redistribuir.
- Público-alvo: desenvolvedores, operadores de agentes e equipes que precisam de gateway multi-provider
- Maturidade: 3/5 — projeto ativo e funcional segundo documentação pública, mas claims de quantidade de providers/free tiers devem ser validados.
- Reaproveitamento: inspiração/adaptação após revisão de licença e segurança.

## 2. Descrição
OmniRoute é um gateway local/OpenAI-compatible para múltiplos provedores, com routing, retries, fallback, políticas, rate limits, compressão, persistência e observabilidade. A instalação local confirmou que o serviço expõe dashboard e API em `localhost:20128`.

## 3. Funcionalidades principais
- Endpoint compatível com OpenAI em `/v1`.
- Dashboard local.
- Routing entre providers e modelos.
- Fallback, aliases e pools automáticos.
- Políticas e limites por modelo/API key.
- OAuth/PKCE e perfis de credenciais.
- Logs de chamadas e armazenamento local SQLite.
- Controle de quotas/spend e sincronização periódica de limites.
- Compressão RTK+Caveman indicada no pacote.
- Avaliações próprias de compressão e router no `package.json` (`eval:compression`, `eval:router`).
- MCP/A2A conforme descrição do pacote.
- Integração com Cursor, Cline, Codex e outros clientes OpenAI-compatible.


## 4. Arquitetura ou funcionamento provável
Fatos observados na instalação local:
- runtime Node com pacote ESM e requisito `node >=22.22.2 <23 || >=24.0.0 <27`;
- CLI `omniroute` e `omniroute-reset-password`;
- persistência local em `storage.sqlite`, com backups em `db_backups/`;
- diretórios locais para `oauth/`, `codex-profiles/`, `call_logs/`, `logs/`, `tls-client/` e `cloudflared/`;
- servidor em `http://localhost:20128`, API em `http://localhost:20128/v1`, WebSocket de dashboard em `127.0.0.1:20132` e proxy WebSocket em `127.0.0.1:20131`;
- schedulers de spend, quotas, limites de providers, modelos e saúde de credenciais;
- scripts de avaliação de compressão e router.

Hipótese: a arquitetura possui gateway HTTP, camada de adapters/providers, router/pool builder, persistência SQLite, scheduler de quotas, gestão de credenciais/OAuth, compressão, WebSocket de monitoramento e painel web.

## 5. Pontos fortes
- Reduz integração direta com vários providers.
- Fallback e routing centralizados.
- Instalação local observada e API compatível com clientes existentes.
- SQLite, backups, logs de chamadas e schedulers operacionais.
- Avaliações de compressão e router incluídas no pacote.
- Útil para quotas, spend, modelos e observabilidade.

## 6. Pontos fracos e limitações
- Gateway vira ponto crítico e concentração de secrets.
- A instalação local expôs warning de senha de gestão padrão `CHANGEME`; isso deve ser corrigido antes de qualquer exposição de rede.
- Logs locais indicam `REQUIRE_API_KEY=false` e fallback de bearer inválido para acesso anônimo; revisar imediatamente em ambientes não isolados.
- Logs indicam rate limiting em memória quando `REDIS_URL` não está configurado; reinícios podem perder estado de limitação.
- O runtime registrou warning Node `DEP0190` sobre processo filho com `shell: true`; revisar risco de escaping/command injection.
- OAuth/proxy de providers exige revisão de termos e segurança.
- Routing errado pode reduzir qualidade.

## 7. Maturidade
Nota: 4/5 para uso local técnico; 3/5 para exposição enterprise sem hardening adicional. A instalação real mostra um produto operacional com persistência, schedulers, API, logs, testes/evals e integração com clientes. Os warnings observados demonstram que configuração de segurança é parte essencial da maturidade operacional.

## 8. Possibilidade de reaproveitamento
Reaproveitar como inspiração ou integrar por API. Adaptação direta somente depois de confirmar licença, segurança, tratamento de chaves e dependências.

## 9. Gaps e oportunidades
- Hardening guiado no primeiro start: bloquear senha padrão, exigir API key e recomendar Redis.
- Diagnóstico de segurança no dashboard.
- Router baseado em benchmark real de tarefas, não apenas regras.
- Políticas de privacidade por arquivo/tenant.
- Failover sem repetir efeitos colaterais.
- Catálogo de preços/capabilities versionado.
- Redação e retenção configuráveis para `call_logs`, SQLite, OAuth e backups.

## 10. Ideias de implementação
Usar gateway interno com interface OpenAI-compatible, adapters, budgets, circuit breakers, logs e routing por capacidade/privacidade. Prioridade: alta; dificuldade: média.

## 10.1. Achados de segurança da instalação local
- O arquivo `.env` contém uma chave de criptografia de armazenamento. Ela não foi reproduzida nesta documentação. Tratar como segredo e não versionar/copiar.
- O log registrou senha de gestão padrão `CHANGEME`. Trocar imediatamente pelo dashboard ou procedimento oficial.
- O log registrou `REQUIRE_API_KEY=false` e bearer inválido aceito como anônimo. Manter o serviço estritamente local até habilitar autenticação adequada.
- O log registrou rate limiting em memória por ausência de `REDIS_URL`. Para exposição compartilhada/produção, configurar backend persistente.
- O log registrou warning sobre `shell: true` em processo filho. Revisar quoting e origem de todos os argumentos antes de permitir comandos externos.
- Não alterar a chave de criptografia sem procedimento de migração/backup: uma troca indiscriminada pode tornar dados existentes ilegíveis.

## 11. Evidências locais consultadas
- `C:\Users\Usuario\.omniroute\server.log`
- `C:\Users\Usuario\.omniroute\logs\application\app.log`
- `C:\Users\Usuario\.omniroute\coding_persona.txt`
- `C:\Users\Usuario\.omniroute\storage.sqlite` (existência observada; conteúdo não foi reproduzido)
- `C:\Users\Usuario\AppData\Roaming\npm\node_modules\omniroute\package.json`

## 12. Referências
- https://github.com/diegosouzapw/OmniRoute
- https://omniroute.online
