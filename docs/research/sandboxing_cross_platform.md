# Sandboxing Cross-Platform com Isolamento Forte

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar tecnologias de sandboxing cross-platform para execução segura de código

## Visão geral

Sandboxing cross-platform permite execução segura de código em Windows, Linux e macOS com isolamento forte. Diferentes tecnologias oferecem trade-offs entre segurança, performance e compatibilidade.

## Tecnologias comparadas

### 1. Docker (runc)

**Isolamento:** Shared kernel (containers)  
**Cold start:** ~50ms (cached image)  
**Memory overhead:** Tens of MB  
**Security boundary:** Shared kernel  
**Compatibilidade:** Full Linux syscall support  
**Cross-platform:** Linux, macOS, Windows (via WSL2)  
**CPU overhead:** 4%  
**Best for:** Legacy apps, stateful, full Linux compat

**Prós:**
- Compatibilidade completa com Linux
- Ecossistema maduro
- Baixo overhead de CPU
- Fácil de usar

**Contras:**
- Isolamento fraco (shared kernel)
- Vulnerável a kernel CVEs
- Não adequado para código não confiável

### 2. gVisor (runsc)

**Isolamento:** User-space kernel (Sentry)  
**Cold start:** ~180ms  
**Memory overhead:** Tens of MB  
**Security boundary:** User-space kernel  
**Compatibilidade:** ~80% Linux syscall support  
**Cross-platform:** Linux, macOS, Windows (via WSL2)  
**CPU overhead:** 18%  
**Best for:** Untrusted code, multi-tenant, compliance

**Prós:**
- Reduz superfície de ataque (syscalls não chegam ao host kernel)
- OCI-compatible (drop-in replacement para runc)
- Adequado para compliance (HIPAA, PCI-DSS)
- Suporta GPU (A100/H100 via vGPU passthrough)

**Contras:**
- Overhead de CPU significativo (18%)
- Compatibilidade limitada (~80% syscalls)
- Não suporta eBPF, advanced ioctl
- Não adequado para microservices internos

**Modos de execução:**
- **Systrap:** usa seccomp para interceptar syscalls (melhor compatibilidade)
- **KVM:** usa hardware virtualization (melhor performance em bare-metal)

### 3. Firecracker (microVM)

**Isolamento:** Hardware virtualization (KVM)  
**Cold start:** ~125ms  
**Memory overhead:** <5 MB VMM + guest kernel  
**Security boundary:** Hardware-enforced kernel isolation  
**Compatibilidade:** Full Linux (guest OS completo)  
**Cross-platform:** Linux apenas (KVM)  
**CPU overhead:** ~5%  
**Best for:** Arbitrary, unpredictable, full-OS workloads

**Prós:**
- Isolamento mais forte (hardware-enforced)
- Guest kernel dedicado
- Cold start rápido (125ms)
- Baixo overhead de memória

**Contras:**
- Linux apenas (sem suporte nativo para macOS/Windows)
- Não suporta GPU passthrough
- Device compatibility limitada
- Requer KVM

**Uso em produção:**
- AWS Lambda
- AWS Fargate
- Fly.io Machines

### 4. WebAssembly (WASM)

**Isolamento:** Capability-based, deny-by-default sandbox  
**Cold start:** <1ms  
**Memory overhead:** <1 MB to few MB  
**Security boundary:** In-process capability VM  
**Compatibilidade:** WASI 0.2.0 (limited)  
**Cross-platform:** Windows, Linux, macOS  
**CPU overhead:** 0.5%  
**Best for:** Serverless, stateless, latency-sensitive

**Prós:**
- Cold start extremamente rápido (<1ms)
- Overhead mínimo de CPU e memória
- Cross-platform portável
- Capability-based security (deny-by-default)

**Contras:**
- Requer compilação para WASM
- Compatibilidade limitada (WASI)
- Não suporta subprocessos (fork/exec)
- Runtime faz parte do TCB (trusted computing base)

**Limitações em 2026:**
- Não pode rodar código nativo não compilado
- Sem suporte a subprocessos arbitrários
- Sem suporte a eBPF
- Limitações de networking (WASI Preview 2 adicionou TCP/UDP/HTTP)

### 5. Windows Sandbox (WSB)

**Isolamento:** Hardware-based virtualization (Microsoft hypervisor)  
**Cold start:** Few seconds  
**Memory overhead:** Dynamic (compartilha memória com host)  
**Security boundary:** Hardware-enforced kernel isolation  
**Compatibilidade:** Full Windows  
**Cross-platform:** Windows apenas  
**CPU overhead:** Minimal  
**Best for:** Testing untrusted Windows apps

**Prós:**
- Parte do Windows (Pro, Enterprise, Education)
- Isolamento forte (hypervisor-based)
- Compartilha memória com host (direct map)
- Suporta GPU virtualization (WDDM 2.5+)
- Disposable (nada persiste)

**Contras:**
- Windows apenas
- Não permite múltiplas instâncias simultâneas
- Networking habilitado por padrão (risco de segurança)
- Inbox apps não suportadas

### 6. Docker Sandboxes (Docker Desktop)

**Isolamento:** MicroVM com Docker daemon privado  
**Cold start:** Fast (não documentado, mas rápido)  
**Memory overhead:** VMM + guest kernel  
**Security boundary:** Hardware-enforced (VM boundary)  
**Compatibilidade:** Full Docker support  
**Cross-platform:** macOS, Windows, Linux (hypervisors nativos)  
**CPU overhead:** Minimal  
**Best for:** Coding agents requiring full Docker environment

**Prós:**
- Cross-platform (usa hypervisors nativos de cada OS)
- Full Docker support no sandbox
- Kernel-level isolation otimizado para cada OS
- Cold starts rápidos (sem abstraction tax)
- Adequado para coding agents

**Contras:**
- Requer Docker Desktop
- Proprietário
- Documentação limitada

**Hypervisors nativos:**
- macOS: Apple Hypervisor.framework
- Windows: Windows Hypervisor Platform
- Linux: KVM

### 7. AerolVM

**Isolamento:** Multi-runtime (containerd, gVisor, Firecracker, WASM, V8 isolate)  
**Cold start:** Isolate ~4ms, WASM ~22ms, Firecracker ~34ms, containerd ~189ms  
**Memory overhead:** Variável por runtime  
**Security boundary:** Variável por runtime  
**Compatibilidade:** Variável por runtime  
**Cross-platform:** Linux (self-host), managed multi-tenant  
**CPU overhead:** Variável por runtime  
**Best for:** AI agent pipelines, ephemeral CI

**Prós:**
- Multi-runtime (escolha por workload)
- Self-host ou managed SaaS
- Suporta GPU
- HA cluster mode
- Drop-in SDK compat

**Contras:**
- Linux apenas (self-host)
- Complexo de configurar
- Documentação limitada

## Comparativo de performance

| Tecnologia | Cold start | Memory overhead | CPU overhead | Security | Compatibilidade | Cross-platform |
|---|---|---|---|---|---|---|
| **Docker (runc)** | ~50ms | Tens of MB | 4% | Fraco (shared kernel) | Full Linux | Linux, macOS (WSL2), Windows (WSL2) |
| **gVisor** | ~180ms | Tens of MB | 18% | Forte (user-space kernel) | ~80% Linux | Linux, macOS (WSL2), Windows (WSL2) |
| **Firecracker** | ~125ms | <5 MB + guest kernel | ~5% | Muito forte (hardware) | Full Linux | Linux apenas |
| **WASM** | <1ms | <1-2 MB | 0.5% | Forte (capability-based) | WASI limited | Windows, Linux, macOS |
| **Windows Sandbox** | Few seconds | Dynamic (shared) | Minimal | Muito forte (hardware) | Full Windows | Windows apenas |
| **Docker Sandboxes** | Fast | VMM + guest kernel | Minimal | Muito forte (hardware) | Full Docker | macOS, Windows, Linux |
| **AerolVM** | 4-189ms | Variável | Variável | Variável | Variável | Linux apenas |

## Hierarquia de segurança

1. **Hardware virtualization** (Firecracker, Windows Sandbox, Docker Sandboxes) - Isolamento mais forte
2. **User-space kernel** (gVisor) - Reduz superfície de ataque
3. **Shared kernel** (Docker runc) - Isolamento mais fraco
4. **Capability-based** (WASM) - Isolamento forte para workloads definidos

## Recomendações por plataforma

### Linux

**Para código não confiável:**
- **Recomendado:** Firecracker (melhor isolamento)
- **Alternativa:** gVisor (compatibilidade melhor)
- **High-end:** AerolVM (multi-runtime)

**Para código confiável:**
- **Recomendado:** Docker runc (melhor performance)
- **Alternativa:** gVisor (compliance)

**Para workloads serverless:**
- **Recomendado:** WASM (cold start mais rápido)
- **Alternativa:** AerolVM (multi-runtime)

### macOS

**Para código não confiável:**
- **Recomendado:** Docker Sandboxes (cross-platform)
- **Alternativa:** WASM (cold start rápido)

**Para código confiável:**
- **Recomendado:** Docker runc (via Docker Desktop)
- **Alternativa:** WASM (para workloads específicos)

### Windows

**Para código não confiável:**
- **Recomendado:** Windows Sandbox (nativo)
- **Alternativa:** Docker Sandboxes (cross-platform)
- **Opção:** WASM (para workloads específicos)

**Para código confiável:**
- **Recomendado:** Docker runc (via Docker Desktop/WSL2)
- **Alternativa:** Windows Sandbox (para testes)

## Recomendações por caso de uso

### Coding agents

**Requisitos:** Full Docker environment, cross-platform, isolamento forte

**Recomendado:** Docker Sandboxes
- Full Docker support no sandbox
- Cross-platform (macOS, Windows, Linux)
- Kernel-level isolation otimizado para cada OS
- Adequado para coding agents que precisam de ambiente de desenvolvimento real

### Serverless functions

**Requisitos:** Cold start rápido, baixo overhead, alta densidade

**Recomendado:** WASM
- Cold start <1ms
- Overhead mínimo
- Alta densidade
- Adequado para workloads stateless e latency-sensitive

### Multi-tenant SaaS

**Requisitos:** Isolamento forte, compliance, multi-tenancy

**Recomendado:** gVisor ou Firecracker
- gVisor: Adequado para compliance (HIPAA, PCI-DSS)
- Firecracker: Isolamento mais forte (hardware-enforced)
- Ambos suportam multi-tenancy

### CI/CD pipelines

**Requisitos:** Compatibilidade completa, isolamento moderado

**Recomendado:** Docker runc ou gVisor
- Docker runc: Melhor performance para workloads confiáveis
- gVisor: Adequado para código não confiável

### AI inference workloads

**Requisitos:** GPU support, isolamento moderado, performance

**Recomendado:** gVisor (com GPU support)
- Suporta GPU (A100/H100 via vGPU passthrough)
- Isolamento adequado para workloads de IA
- Compatibilidade razoável (~80% syscalls)

## Próximos passos

1. **Implementar Docker Sandboxes:** Para coding agents cross-platform
2. **Implementar gVisor:** Para workloads não confiáveis e compliance
3. **Implementar WASM:** Para workloads serverless e latency-sensitive
4. **Testar isolamento:** Validar isolamento em cada plataforma
5. **Otimizar performance:** Ajustar configurações baseado em workload
6. **Documentar procedimentos:** Criar guia de deployment por plataforma

## Referências

- gVisor: https://gvisor.dev/
- Firecracker: https://firecracker-microvm.github.io/
- Windows Sandbox: https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/
- Docker Sandboxes: https://www.docker.com/blog/why-microvms-the-architecture-behind-docker-sandboxes/
- AerolVM: https://microvm.aerol.ai/
- WASM vs Docker vs gVisor: https://johal.in/webassembly-vs-docker-vs-gvisor-sandboxing-overhead-benchmark
- Firecracker vs gVisor vs WASM: https://www.softwareseni.com/firecracker-gvisor-containers-and-webassembly-comparing-isolation-technologies-for-ai-agents/
