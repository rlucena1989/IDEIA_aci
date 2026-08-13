# Backup e Recuperação do OmniRoute

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Procedimento seguro de backup e recuperação do OmniRoute

## Visão geral

OmniRoute usa SQLite com WAL journaling como armazenamento principal, com criptografia AES-256-GCM em repouso para campos sensíveis.

### Localização do banco de dados

| OS | Caminho |
|---|---|
| Linux | `~/.omniroute/storage.sqlite` |
| macOS | `~/.omniroute/storage.sqlite` |
| Windows | `%USERPROFILE%\.omniroute\storage.sqlite` |
| Docker | `/app/data/storage.sqlite` (configurável via `DATA_DIR`) |

### Arquivos críticos para backup

- **storage.sqlite** - Providers, combos, API keys, settings, aliases (DB principal)
- **db_backups/** - Snapshots automáticos
- **call_logs/** - Artifacts de requisições (grande, opcional)
- **.env** - Variáveis de ambiente (incluindo `STORAGE_ENCRYPTION_KEY`)

## Procedimento de backup

### 1. Backup manual (hot backup - zero downtime)

```bash
# Linux/macOS
sqlite3 ~/.omniroute/storage.sqlite ".backup /backups/omniroute-hot.db"

# Windows
sqlite3 C:\Users\Usuario\.omniroute\storage.sqlite ".backup C:\backups\omniroute-hot.db"
```

Este comando usa a API de backup online do SQLite - seguro para executar enquanto o OmniRoute está rodando.

### 2. Backup via CLI

```bash
# Criar backup manual
omniroute backup create --name pre-migration

# Listar backups
omniroute backup list

# Deletar backup
omniroute backup delete <backup-id>
```

### 3. Backup via API

```bash
# Criar backup
curl -X POST http://localhost:20128/api/db-backups/create \
  -H "Authorization: Bearer $MANAGEMENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "pre-migration"}'

# Listar backups
curl http://localhost:20128/api/db-backups \
  -H "Authorization: Bearer $MANAGEMENT_KEY"
```

### 4. Backup completo do diretório

```bash
# Linux/macOS
cp -r ~/.omniroute ~/.omniroute-backup-$(date +%Y%m%d)

# Windows
xcopy C:\Users\Usuario\.omniroute C:\Users\Usuario\.omniroute-backup-%date:~0,10% /E /I /H
```

### 5. Desabilitar backups automáticos (opcional)

Para deployments que já têm backups de infraestrutura:

```bash
# Adicionar ao .env
DISABLE_SQLITE_AUTO_BACKUP=true
```

## Procedimento de recuperação

### 1. Recuperação via CLI

```bash
# Restaurar backup
omniroute restore pre-migration

# Sincronizar e mesclar (se aplicável)
omniroute sync pull --merge
```

**Aviso:** Restore sobrescreve todo o DB. Pare todos os clientes primeiro.

### 2. Recuperação via API

```bash
curl -X POST http://localhost:20128/api/db-backups/restore \
  -H "Authorization: Bearer $MANAGEMENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "pre-migration"}'
```

### 3. Recuperação de arquivo corrompido

Se o SQLite não conseguir recuperar automaticamente:

```bash
# Linux/macOS
sqlite3 ~/.omniroute/storage.sqlite ".recover" > recovered.sql
sqlite3 recovered.db < recovered.sql
mv recovered.db ~/.omniroute/storage.sqlite

# Windows
sqlite3 C:\Users\Usuario\.omniroute\storage.sqlite ".recover" > recovered.sql
sqlite3 recovered.db < recovered.sql
move recovered.db C:\Users\Usuario\.omniroute\storage.sqlite
```

### 4. Recuperação de backup manual

```bash
# Parar servidor OmniRoute
omniroute stop

# Restaurar backup
cp /backups/omniroute-hot.db ~/.omniroute/storage.sqlite

# Reiniciar servidor
omniroute serve --daemon
```

## Procedimento antes de hardening

### 1. Criar backup antes de alterações

```bash
# Criar backup com timestamp
sqlite3 C:\Users\Usuario\.omniroute\storage.sqlite ".backup C:\backups\omniroute-pre-hardening.db"

# Backup do diretório completo
xcopy C:\Users\Usuario\.omniroute C:\Users\Usuario\.omniroute-backup-pre-hardening /E /I /H
```

### 2. Recuperação da chave de criptografia

**CRÍTICO:** uma versão anterior deste documento continha uma chave literal. Ela foi removida em 13/08/2026 e a chave correspondente deve ser tratada como exposta e rotacionada.

Não copie `.env` nem escreva a chave em arquivo texto de backup. O procedimento deve usar o secret store aprovado, acesso mínimo, criptografia independente, teste de restauração e registro de rotação sem o valor. O mecanismo concreto permanece pendente de threat model e autorização operacional.

### 3. Testar recuperação

```bash
# Testar restore em ambiente de teste
cp C:\backups\omniroute-pre-hardening.db C:\temp\test-storage.sqlite
# Configurar OmniRoute para usar o DB de teste
# Verificar se tudo funciona
```

## Procedimento de rotação de chave de criptografia

### 1. Gerar nova chave

```bash
# Gerar nova chave de 64 caracteres hex
openssl rand -hex 32
```

### 2. Atualizar .env

```bash
# Adicionar nova chave
STORAGE_ENCRYPTION_KEY=nova_chave_aqui
STORAGE_ENCRYPTION_KEY_VERSION=v2
```

### 3. Backup antes da rotação

```bash
sqlite3 ~/.omniroute/storage.sqlite ".backup /backups/omniroute-pre-key-rotation.db"
```

### 4. Reiniciar OmniRoute

```bash
omniroute stop
omniroute serve --daemon
```

## Procedimento de migração

### 1. Backup antes da migração

```bash
# Backup automático é criado antes de migrações
# Mas é recomendado criar backup manual adicional
omniroute backup create --name pre-migration
```

### 2. Desabilitar backup automático (opcional)

```bash
# Adicionar ao .env
DISABLE_SQLITE_AUTO_BACKUP=true
```

### 3. Executar migração

```bash
# OmniRoute executa migrações automaticamente no startup
# Se necessário, forçar migração
omniroute migrate
```

## Procedimento de desinstalação limpa

### 1. Criar backup final

```bash
# Backup completo
cp -r ~/.omniroute ~/.omniroute-backup-final
```

### 2. Parar todos os serviços

```bash
omniroute stop
```

### 3. Desinstalar

```bash
# npm global
npm uninstall -g omniroute

# Bash install
rm $(which omniroute)

# Docker
docker stop omniroute
docker rm omniroute
```

### 4. Limpar dados (opcional)

```bash
# Apenas se você tiver certeza
rm -rf ~/.omniroute
```

## Melhores práticas

### 1. Backup regular
- Criar backup diário ou semanal
- Usar hot backup para zero downtime
- Armazenar backups em local seguro

### 2. Teste de recuperação
- Testar recuperação mensalmente
- Verificar integridade do backup
- Documentar procedimento de recuperação

### 3. Retenção de backups
- Manter backups por 30-90 dias
- Armazenar backups off-site
- Criptografar backups sensíveis

### 4. Monitoramento
- Monitorar tamanho do banco de dados
- Monitorar espaço em disco
- Alertar em caso de falha de backup

## Solução de problemas

### Problema: Banco de dados corrompido

**Sintomas:** OmniRoute não inicia, erros de SQLite

**Solução:**
```bash
# Tentar recuperação automática
sqlite3 ~/.omniroute/storage.sqlite ".recover" > recovered.sql
sqlite3 recovered.db < recovered.sql
mv recovered.db ~/.omniroute/storage.sqlite
```

### Problema: Chave de criptografia perdida

**Sintomas:** Dados ilegíveis, erros de descriptografia

**Solução:** IRRECUPERÁVEL - Restaurar backup com chave correta

### Problema: Backup não funciona

**Sintomas:** Erro ao criar backup

**Solução:**
```bash
# Verificar permissões
ls -la ~/.omniroute
chmod 700 ~/.omniroute
chmod 600 ~/.omniroute/storage.sqlite
```

## Referências

- OmniRoute Database Guide: https://github.com/diegosouzapw/OmniRoute/wiki/Database-Guide
- OmniRoute Environment Variables: https://github.com/diegosouzapw/OmniRoute/blob/main/docs/ENVIRONMENT.md
- OmniRoute Discussion #2696: https://github.com/diegosouzapw/OmniRoute/discussions/2696
