# Plano de hardening — storage.sqlite do OmniRoute

## Contexto
Verificado em 11/08: `C:\Users\Usuario\.omniroute\storage.sqlite` (e WAL) armazena **chaves de API em texto** em `provider_connections` (colunas `api_key`, `access_token`, `refresh_token`, `provider_specific_data` com `extraApiKeys`) e em `api_keys`. Nenhum conteúdo desse banco foi copiado para a documentação do benchmark.

## Riscos
- Exfiltração por leitura indevida (RT02 mostrou que o OpenCode tenta ler `.omniroute/.env`; só o auto-reject impede — shell não é restrito).
- Backup ou sincronização não intencional do diretório.
- Quem tiver acesso à conta do Windows lê as chaves em claro.

## Mitigações recomendadas (por prioridade)
1. **Restringir ACL do arquivo** (Windows): somente o usuário e Administradores.
   ```powershell
   icacls "C:\Users\Usuario\.omniroute\storage.sqlite*" /inheritance:r /grant:r "$env:USERNAME:(R,W)" /grant:r "Administrators:(F)"
   ```
2. **Excluir o diretório de backups/sincronização**: garantir que `.omniroute` não entre em OneDrive/nuvem nem em backups com acesso amplo.
3. **Rotação de chaves** para provedores com `extraApiKeys`/`api_key` em texto (opencode-go, llm7, openrouter, api-airforce, nanogpt, ollama-cloud, glm) — reemitir nos painéis dos provedores e atualizar a conexão.
4. **Criptografia em repouso** (médio prazo): se o OmniRoute não oferecer, usar BitLocker no volume ou DPAPI para a pasta de segredos.
5. **Monitorar leitura**: registrar no antivírus/EDR acessos a `storage.sqlite` por processos não listados (freebuff/omniroute).
6. **Usar variáveis de ambiente** para chaves quando o provedor permitir, reduzindo duplicação em `provider_specific_data`.

## Não fazer
- Não alterar o esquema do banco do OmniRoute sem suporte do produto (pode quebrar o roteamento).
- Não mover/renomear o arquivo enquanto o serviço estiver ativo.
- Não copiar `storage.sqlite` para a documentação ou repositórios.

## Verificação de aplicação
- [x] ACL restrita — APLICADO em 11/08 via .NET (`FileSecurity`, sem herança): `storage.sqlite`, `storage.sqlite-wal`, `storage.sqlite-shm`, `.env` → apenas `Administrators:(F)` e `DESKTOP-6V43VQU\Usuario:(RX,W)`. Observação: a regra herdada `NT AUTHORITY\SYSTEM:(F)` foi removida; se algum serviço rodar como SYSTEM, restaurar com `SetAccessRuleProtection($false,$true)` ou regra explícita para SYSTEM.
- [x] `.omniroute` fora de sincronização de nuvem — verificado: perfil tem OneDrive, mas `.omniroute` não está dentro dele.
- [ ] Chaves rotacionadas listadas no item 3 (requer acesso aos painéis dos provedores — manual).
- [ ] Acesso monitorado (item 5) (depende de EDR/antivírus — manual).
