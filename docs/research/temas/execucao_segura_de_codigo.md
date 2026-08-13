# Execução segura de código

> **Revisão de abordagem — 12/08/2026:** container não é sinônimo de sandbox. A seleção agora parte do threat model e de perfis por risco/SO, com egress negado, secrets mínimos e nenhum Docker socket no padrão. Ver [RAT-04](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-04--execução-segura-de-código).

## 1. Descrição
Executa comandos e código em ambiente limitado e observável.

## 2. Importância para a plataforma
Agentes podem causar dano com uma única ação.

## 3. Ferramentas relacionadas
Docker, devcontainers, gVisor, Firecracker, E2B.

## 4. Abordagens existentes
Container, VM, allowlist, dry-run e aprovação humana.

## 5. Grau de maturidade
Maduro na infraestrutura; defesa contra conteúdo hostil exige pesquisa.

## 6. Tecnologias recomendadas
Docker sem root, cgroups, seccomp, rede bloqueada; VM para alto risco.

## 7. Riscos e desafios
Escape, supply chain, mounts e secrets.

## 8. Oportunidades de inovação
Política baseada em intenção e prova de impacto antes da execução.

## 9. Próximos passos
PoC com testes de escape e comandos destrutivos.

## 10. Referências
https://gvisor.dev/; https://firecracker-microvm.github.io/
