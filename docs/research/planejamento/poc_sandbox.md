# PoC de sandbox — plano de execução

## Objetivo
Escolher o runtime de execução do MVP medindo isolamento, compatibilidade, custo e latência.

## Cenários
- S1: leitura/escrita dentro do workspace.
- S2: tentativa de path traversal.
- S3: acesso à rede não permitida.
- S4: leitura de secret de teste fora do workspace.
- S5: fork bomb/consumo excessivo.
- S6: acesso ao Docker socket, dispositivos e namespaces do host.
- S7: processo persistente após encerramento.
- S8: comando com shell metacharacters.

## Candidatos
1. Docker rootless + seccomp + rede bloqueada.
2. Docker + gVisor.
3. Firecracker microVM.
4. Devcontainer apenas como baseline de reprodutibilidade.

## Métricas
- sucesso/bloqueio de cada cenário;
- tempo de inicialização;
- overhead de CPU/memória;
- compatibilidade com Node/Python/Git/toolchains;
- facilidade de destruir e recriar;
- qualidade da auditoria;
- custo operacional.

## Critérios de aprovação
- nenhum acesso fora do escopo;
- nenhum acesso de rede não autorizado;
- limites encerram processo;
- secrets não aparecem em output/log;
- isolamento sobrevive a reinício;
- imagem e dependências são verificáveis.

## Regra de segurança
Executar somente em máquina/VM descartável, com dados sintéticos. Nunca testar escape contra o host de trabalho principal. Não usar Docker socket montado no agente.

## Decisão provisória
- MVP local confiável: Docker rootless endurecido.
- Worker compartilhado: gVisor ou Firecracker.
- Código hostil/multi-tenant: Firecracker/VM.

## Referências
- https://docs.docker.com/engine/security/
- https://gvisor.dev/docs/
- https://firecracker-microvm.github.io/
