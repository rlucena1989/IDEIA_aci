# Hardening do OmniRoute

**Data:** 11 de agosto de 2026  
**Status:** Em andamento  
**Objetivo:** Validar e corrigir vulnerabilidades de segurança no OmniRoute

## Estado atual

### Configuração identificada
- **Localização:** `C:\Users\Usuario\.omniroute`
- **Versão:** v3.8.49
- **Endpoint:** http://localhost:20128
- **API Base:** http://localhost:20128/v1

### Arquivos de configuração
- **.env:** Contém `STORAGE_ENCRYPTION_KEY` (chave de 64 caracteres hex)
- **storage.sqlite:** Banco de dados (~23MB) com chaves de API
- **server.log:** Logs de inicialização
- **server/.pid:** PID do processo em execução

### Variáveis de ambiente de segurança (documentação OmniRoute v3.8.50)

| Variável | Default | Descrição |
|---|---|---|
| `MACHINE_ID_SALT` | `endpoint-proxy-salt` | Salt para fingerprinting de máquina |
| `OMNIROUTE_CLI_SALT` | `omniroute-cli-auth-v1` | Salt para token de auth CLI |
| `AUTH_COOKIE_SECURE` | `false` | Flag Secure em cookies (deve ser true com HTTPS) |
| `REQUIRE_API_KEY` | `false` | Requer API key para todas as requisições `/v1/*` |
| `ALLOW_API_KEY_REVEAL` | `false` | Permite revelar API keys no Dashboard |
| `NO_LOG_API_KEY_IDS` | _(empty)_ | IDs de API keys que bypass logging (GDPR) |
| `DEFAULT_RATE_LIMIT_PER_DAY` | `1000` | Rate limit por dia para API keys |

### Hardening checklist (documentação OmniRoute)
```bash
# Production security minimum:
AUTH_COOKIE_SECURE=true        # Requires HTTPS
REQUIRE_API_KEY=true           # Authenticate all proxy calls
ALLOW_API_KEY_REVEAL=false     # Never expose keys in UI
CORS_ALLOWED_ORIGINS=https://your.domain.com
MAX_BODY_SIZE_BYTES=5242880    # 5 MB limit
```

### Vulnerabilidades identificadas

#### 1. Chave de criptografia em texto plano
- **Localização:** `.env` → `STORAGE_ENCRYPTION_KEY`
- **Risco:** Chave exposta em arquivo de texto
- **Severidade:** Alta
- **Mitigação:** Mover para secret manager ou variável de ambiente segura

#### 2. Endpoint HTTP não autenticado
- **Endpoint:** http://localhost:20128
- **Risco:** Qualquer processo local pode acessar o gateway
- **Severidade:** Alta
- **Mitigação:** Configurar `REQUIRE_API_KEY=true`

#### 3. AUTH_COOKIE_SECURE=false
- **Risco:** Cookies sem flag Secure (vulnerável a MITM)
- **Severidade:** Alta
- **Mitigação:** Configurar `AUTH_COOKIE_SECURE=true` e usar HTTPS

#### 4. Rate limiting em memória
- **Risco:** Rate limit pode ser bypassado reiniciando o serviço
- **Severidade:** Média
- **Mitigação:** Rate limit persistente em banco de dados (já implementado via storage.sqlite)

#### 5. ALLOW_API_KEY_REVEAL não configurado
- **Risco:** API keys podem ser expostas no Dashboard
- **Severidade:** Média
- **Mitigação:** Configurar `ALLOW_API_KEY_REVEAL=false` explicitamente

#### 6. Sem HTTPS
- **Risco:** Tráfego não criptografado
- **Severidade:** Alta
- **Mitigação:** Configurar HTTPS com certificado SSL

## Status de implementação

### Concluído (11/08/2026)
- [x] Verificar documentação oficial de segurança
- [x] Identificar variáveis de ambiente de segurança
- [x] Adicionar `REQUIRE_API_KEY=true` ao .env
- [x] Adicionar `ALLOW_API_KEY_REVEAL=false` ao .env
- [x] Adicionar `CORS_ALLOWED_ORIGINS=http://localhost:20128` ao .env
- [x] Adicionar `MAX_BODY_SIZE_BYTES=5242880` ao .env
- [x] Reiniciar servidor OmniRoute para aplicar configurações
- [x] Servidor rodando com PID 21732

### Pendente (requer reverse proxy)
- [ ] Configurar reverse proxy (nginx/Caddy) para HTTPS
- [ ] Adicionar `AUTH_COOKIE_SECURE=true` ao .env (após configurar HTTPS)
- [ ] Gerar nova `STORAGE_ENCRYPTION_KEY` forte (opcional)
- [ ] Gerar novo `OMNIROUTE_CLI_SALT` (opcional)
- [ ] Gerar novo `MACHINE_ID_SALT` (opcional)
- [ ] Validar acesso sem API key (deve falhar)
- [ ] Validar acesso com API key (deve funcionar)

### Validação prática (11/08/2026)
- [x] Verificar servidor rodando: ✅ OmniRoute v3.8.49 rodando em http://localhost:20128
- [x] Verificar configuração .env: ✅ Configurações aplicadas
- [x] Testar acesso sem API key: ❌ **VULNERABILIDADE CRÍTICA** - retorna 200 OK mesmo sem API key
- [x] Reiniciar servidor para aplicar configurações: ❌ Vulnerabilidade persiste após reinício
- [x] Testar com API key inválida: ❌ Retorna 200 OK mesmo com API key inválida
- [ ] Instalar sqlite3 para Windows para verificar banco de dados
- [ ] Investigar por que REQUIRE_API_KEY=true não está funcionando
- [ ] Verificar se há API key padrão configurada no banco de dados

### Vulnerabilidade confirmada
**Problema:** `REQUIRE_API_KEY=true` não está funcionando corretamente
- Servidor retorna 200 OK mesmo sem API key
- Servidor retorna 200 OK mesmo com API key inválida
- Isso indica que a autenticação por API key não está sendo aplicada

**Possíveis causas:**
1. Bug na versão v3.8.49 do OmniRoute
2. API key padrão configurada no banco de dados (necessário verificar)
3. Configuração requer API keys pré-existentes no banco de dados
4. Middleware de autenticação não está habilitado por padrão

**Workaround imediato:**
1. Usar firewall do Windows para restringir acesso ao port 20128
2. Configurar reverse proxy com autenticação (nginx/Caddy)
3. Limitar acesso a localhost apenas (já é o padrão)

**Próximos passos:**
1. Instalar sqlite3 para verificar banco de dados
2. Verificar se há API keys configuradas
3. Reportar bug ao maintainers do OmniRoute
4. Considerar upgrade para versão mais recente

### Limitação identificada
OmniRoute não suporta HTTPS nativo em ambiente local sem reverse proxy. Para ambiente local, as opções são:
1. Usar reverse proxy local (nginx, Caddy, etc.)
2. Usar Cloudflare Tunnel para HTTPS
3. Aceitar HTTP para ambiente local (risco aceitável para desenvolvimento)

Para produção, a documentação recomenda usar reverse proxy (nginx + Cloudflare) com:
- `AUTH_COOKIE_SECURE=true`
- `REQUIRE_API_KEY=true`
- `NEXT_PUBLIC_BASE_URL=https://omniroute.example.com`
- `BASE_URL=http://127.0.0.1:20128`

## Comandos de verificação

### Verificar tabelas do banco de dados
```bash
# Linux/macOS
sqlite3 ~/.omniroute/storage.sqlite ".tables"

# Windows (requer sqlite3 instalado)
sqlite3 C:\Users\Usuario\.omniroute\storage.sqlite ".tables"
```

### Verificar configuração de autenticação
```bash
# Verificar se há arquivo de configuração
ls ~/.omniroute/config.yaml
ls ~/.omniroute/config.json

# Verificar variáveis de ambiente
env | grep OMNIRoute
env | grep STORAGE
```

### Verificar permissões
```bash
# Linux/macOS
ls -la ~/.omniroute
chmod 700 ~/.omniroute
chmod 600 ~/.omniroute/.env

# Windows
icacls C:\Users\Usuario\.omniroute
```

## Recomendações

### Imediato
1. **Gerar nova chave de criptografia:**
   ```bash
   # Gerar chave de 64 caracteres hex
   openssl rand -hex 32
   ```

2. **Restringir permissões do diretório:**
   ```bash
   # Linux/macOS
   chmod 700 ~/.omniroute
   chmod 600 ~/.omniroute/.env
   chmod 600 ~/.omniroute/storage.sqlite
   ```

3. **Verificar se há autenticação habilitada:**
   - Revisar documentação do OmniRoute
   - Verificar se há opção de autenticação
   - Configurar se disponível

### Curto prazo
1. **Implementar autenticação por token:**
   - Gerar token forte
   - Configurar no OmniRoute
   - Atualizar clientes para usar token

2. **Habilitar TLS/SSL:**
   - Gerar certificado SSL
   - Configurar OmniRoute para usar HTTPS
   - Atualizar clientes para usar HTTPS

3. **Configurar rate limit persistente:**
   - Mover rate limit para banco de dados
   - Configurar limites por IP/token
   - Implementar backoff exponencial

### Longo prazo
1. **Mover para secret manager:**
   - Usar HashiCorp Vault
   - Usar AWS Secrets Manager
   - Usar Azure Key Vault

2. **Implementar auditoria:**
   - Logs de acesso
   - Logs de autenticação
   - Logs de erros

3. **Implementar monitoramento:**
   - Alertas de acesso não autorizado
   - Alertas de rate limit excedido
   - Alertas de erros de criptografia

## Riscos se não corrigido

- **Exposição de chaves de API:** Chaves de armazenadas no storage.sqlite podem ser expostas
- **Acesso não autorizado:** Qualquer processo local pode acessar o gateway
- **Bypass de rate limit:** Rate limit pode ser contornado reiniciando o serviço
- **Ataques de força bruta:** Sem autenticação, o gateway está vulnerável

## Próximos passos

1. Instalar sqlite3 para Windows para verificar o banco de dados
2. Verificar documentação do OmniRoute para opções de autenticação
3. Implementar correções imediatas
4. Validar segurança após correções
5. Documentar procedimento de hardening

## Referências
- OmniRoute GitHub: https://github.com/diegosouzapw/OmniRoute
- OmniRoute Docs: https://github.com/diegosouzapw/OmniRoute/blob/main/README.md
