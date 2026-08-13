# Segurança de runtimes e estratégia de sandbox

## 1. Conclusão executiva
Não existe uma única camada suficiente para executar código produzido por agentes. A recomendação é defesa em profundidade: processo sem privilégios, filesystem restrito, rede bloqueada, limites de recursos, imagem/artefato verificado, auditoria e, para código hostil ou multi-tenant, uma barreira de virtualização.

## 2. Comparação

| Tecnologia | Isolamento principal | Vantagem | Limitação | Uso recomendado |
|---|---|---|---|---|
| Docker rootless | namespaces/cgroups | simples e difundido | kernel compartilhado; configuração pode vazar host | MVP local confiável |
| Devcontainer | ambiente declarativo | reprodutibilidade | não é, sozinho, fronteira forte contra hostil | desenvolvimento |
| gVisor | kernel/user-space adicional | reduz superfície do kernel | compatibilidade e overhead | worker com risco médio |
| Firecracker | microVM/KVM + jailer | barreira mais forte e baixa sobrecarga | Linux/KVM, operação mais complexa | cloud/multi-tenant |
| VM completa | hypervisor | isolamento amplo | custo e latência maiores | código altamente hostil |
| WASM | sandbox de runtime | portável para workloads compatíveis | não serve para shell arbitrário/qualquer toolchain | plugins restritos |
| Windows Sandbox | virtualização leve | nativo Windows | Windows 10/11 Pro/Enterprise apenas | ambientes Windows |
| WSL 2 | VM leve | integração Windows/Linux | kernel compartilhado com host | desenvolvimento Windows |

## 3. Recomendação por estágio

### MVP local
- **Linux/macOS:** Docker rootless ou devcontainer
- **Windows:** Windows Sandbox ou WSL 2 + Docker
- **Configuração:** Sem Docker socket, sem mounts amplos, rede bloqueada, workspace dedicado

### Worker compartilhado
- **Linux:** gVisor ou microVM
- **Windows:** Hyper-V containers ou VMs isoladas
- **Configuração:** Cada tarefa com identidade, filesystem e rede próprios

### Código não confiável/multi-tenant
- **Linux:** Firecracker ou VM completa
- **Windows:** Hyper-V VMs com Enhanced Security Mode
- **Configuração:** Não confiar apenas em filtros de comandos

### Plugins declarativos
- **Todas plataformas:** WASM quando o conjunto de capacidades permitir
- **Configuração:** Runtime WASM com capabilities restritas

## 4. Controles obrigatórios

### Processo e usuário
1. Usuário/processo sem privilégio
2. Seccomp/AppArmor/SELinux quando disponíveis (Linux)
3. Windows Defender Application Control (Windows)

### Recursos
4. Cgroups para CPU, memória, PIDs, disco e tempo (Linux)
5. Job Objects para limites de recursos (Windows)
6. Timeout absoluto por tarefa

### Rede
7. Rede deny-by-default; egress por allowlist
8. DNS restrito ou DNS over HTTPS
9. Proxy obrigatório para egress (quando permitido)

### Filesystem
10. Workspace montado como escopo mínimo
11. Preferencialmente cópia descartável (tmpfs/volume efêmero)
12. Readonly para dependências do sistema
13. No access a diretórios sensíveis (`/etc`, `C:\Windows\System32`, etc.)

### Secrets
14. Secrets nunca montados como arquivo legível pelo agente
15. Injeção controlada apenas em processos autorizados
16. Variáveis de ambiente com prefixo específico (ex: `AGENT_SECRET_`)

### Imagens e artefatos
17. Imagens pinadas por digest
18. SBOM e scanner de vulnerabilidades
19. Assinatura de imagens (cosign/sigstore)

### Runtime
20. Sem acesso ao socket Docker
21. Sem host PID namespace
22. Sem acesso a dispositivos não autorizados
23. Kill switch e destruição após conclusão

### Auditoria
24. Logs de todas as syscalls relevantes
25. Registro de comandos executados
26. Captura de stdout/stderr
27. Snapshot de filesystem antes/depois (opcional)

## 5. Testes mínimos de aceitação

### Isolamento de filesystem
- ✅ Não ler arquivo fora do workspace
- ✅ Não escrever fora do workspace
- ✅ Path traversal bloqueado (`../../../etc/passwd`)
- ✅ Symlink attacks prevenidos

### Isolamento de rede
- ✅ Não alcançar rede não permitida
- ✅ DNS queries bloqueadas (exceto allowlist)
- ✅ Port scanning detectado e bloqueado
- ✅ Exfiltração de dados bloqueada

### Isolamento de runtime
- ✅ Não acessar socket/container runtime
- ✅ Não escapar para host
- ✅ Não acessar outros containers/VMs

### Limites de recursos
- ✅ Limites de CPU/memória/PIDs encerram tarefa
- ✅ Fork bomb detectada e bloqueada
- ✅ Memory exhaustion não afeta host

### Segurança de secrets
- ✅ Secret de teste não aparece em stdout
- ✅ Secret não aparece em logs
- ✅ Secret não acessível via environment dump

### Recuperação
- ✅ Reinício não perde auditoria
- ✅ Não duplica efeitos externos
- ✅ Cleanup completo após falha

## 6. Integração com OmniRoute

### Considerações
- OmniRoute roda como gateway local em `localhost:20128`
- Deve ser executado fora do sandbox do agente
- Comunicação via HTTP/HTTPS do sandbox para OmniRoute

### Configuração recomendada
```yaml
sandbox:
  network:
    egress:
      allow:
        - host: localhost
          port: 20128
          protocol: https
    dns:
      disabled: true
```

### Riscos
- Agente pode tentar acessar outros serviços locais
- OmniRoute contém chaves de API em `storage.sqlite`
- Recomendação: OmniRoute em container separado com isolamento próprio

## 7. Considerações específicas por plataforma

### Linux
- **Melhor isolamento:** gVisor + Firecracker
- **Controles:** Seccomp, AppArmor, SELinux, cgroups v2
- **Monitoramento:** eBPF, auditd, systemd

### macOS
- **Melhor isolamento:** Docker Desktop com VM isolada
- **Controles:** Sandbox macOS, SIP
- **Limitação:** Kernel compartilhado com host

### Windows
- **Melhor isolamento:** Windows Sandbox + Hyper-V
- **Controles:** Windows Defender Application Control, PowerShell Constrained Language
- **Limitação:** Requer Windows 10/11 Pro/Enterprise para Sandbox
- **WSL 2:** Bom para desenvolvimento, mas não isolamento forte

## 8. Exemplo de configuração Docker (MVP)

```dockerfile
FROM node:20-alpine AS agent-runtime

# Usuário não privilegiado
RUN adduser -D -u 1000 agent

# Instalar dependências mínimas
RUN apk add --no-cache git curl bash

# Configurar cgroups (se disponível)
RUN apk add --no-cache libseccomp

# Switch para usuário não privilegiado
USER agent
WORKDIR /workspace

# Configurar seccomp (via docker-compose)
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  agent:
    build: .
    volumes:
      - ./workspace:/workspace:rw
      - ./deps:/deps:ro
    environment:
      - AGENT_SECRET_KEY=${SECRET_KEY}
    security_opt:
      - seccomp:seccomp-profile.json
      - apparmor:docker-default
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
    networks:
      - none
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    pids_limit: 100
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
```

## 9. Checklist de validação

### Antes do deploy
- [ ] Imagem pinada por digest
- [ ] SBOM gerado e revisado
- [ ] Scanner de vulnerabilidades executado
- [ ] Seccomp profile configurado
- [ ] AppArmor/SELinux profile configurado
- [ ] Limites de recursos definidos
- [ ] Rede bloqueada por default
- [ ] Secrets não montados como arquivos
- [ ] Logs configurados e persistidos
- [ ] Kill switch implementado

### Durante execução
- [ ] Monitoramento de recursos ativo
- [ ] Logs de segurança sendo capturados
- [ ] Alertas configurados para anomalias
- [ ] Backup de auditoria em tempo real

### Após execução
- [ ] Cleanup completo de recursos
- [ ] Auditoria revisada
- [ ] Logs arquivados
- [ ] Vulnerabilidades reportadas (se encontradas)

## 10. Referências
- Docker Security: https://docs.docker.com/engine/security/
- gVisor: https://gvisor.dev/docs/
- Firecracker: https://firecracker-microvm.github.io/
- OCI Runtime Spec: https://github.com/opencontainers/runtime-spec
- Seccomp: https://www.kernel.org/doc/html/latest/userspace-api/seccomp.html
- AppArmor: https://gitlab.com/apparmor/apparmor
- Windows Sandbox: https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview
- WSL 2: https://learn.microsoft.com/en-us/windows/wsl/about

**Nota:** Fontes descrevem capacidades dos projetos; segurança efetiva depende da configuração, testes próprios e contexto de uso.
