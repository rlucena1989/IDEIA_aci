# Devcontainers, Docker e sandboxes

> **Revisão de abordagem — 12/08/2026:** dev environment e security sandbox foram separados. Rootless/hardening é perfil a testar; gVisor/microVM depende de risco e compatibilidade, nunca de “maturidade” genérica. Ver [RAT-20](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-20--devcontainers-docker-e-sandboxes).

## 1. Descrição
Ambientes reproduzíveis e isolados para execução de tarefas.

## 2. Importância para a plataforma
Evita contaminar host e reduz diferenças de ambiente.

## 3. Ferramentas relacionadas
Docker, devcontainer spec, gVisor, Firecracker, Kubernetes.

## 4. Abordagens existentes
Imagem por projeto, mounts limitados, rede restrita e cgroups.

## 5. Grau de maturidade
Maduro; hardening para código hostil exige pesquisa.

## 6. Tecnologias recomendadas
Devcontainers para desenvolvimento; gVisor/VM para multi-tenant.

## 7. Riscos e desafios
Imagem comprometida, socket Docker, mounts e escape.

## 8. Oportunidades de inovação
Gerar ambiente mínimo a partir do lockfile e destruir após tarefa.

## 9. Próximos passos
PoC sem acesso ao Docker socket e sem privilégios.

## 10. Referências
https://containers.dev/; https://docs.docker.com/
