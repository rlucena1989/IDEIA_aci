# Terminal e sistema de arquivos

> **Revisão de abordagem — 12/08/2026:** tools semânticas e processo sem shell são o baseline; shell/PTY é capability separada, promovida apenas quando o caso exigir. Ver [RAT-05](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-05--terminal-e-sistema-de-arquivos).

## 1. Descrição
Adapters para leitura/edição e shells Windows/POSIX.

## 2. Importância para a plataforma
É a fronteira operacional do agente.

## 3. Ferramentas relacionadas
node-pty, subprocess, ripgrep, chokidar, PowerShell.

## 4. Abordagens existentes
Tools tipadas, PTY, timeout, path boundary e snapshots.

## 5. Grau de maturidade
Maduro.

## 6. Tecnologias recomendadas
TypeScript/Node ou Python, schemas, Git snapshots.

## 7. Riscos e desafios
Path traversal, quoting, encoding e comandos perigosos.

## 8. Oportunidades de inovação
Mesma tool semântica traduzida para Windows/Linux/macOS.

## 9. Próximos passos
Suite cross-platform para paths e shell.

## 10. Referências
https://nodejs.org/api/child_process.html
