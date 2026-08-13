# Procedimento de execução isolada

## Pré-condições
- workspace sintético ou autorizado;
- commit-base registrado;
- ferramenta instalada, mas sem alterar sua configuração;
- orçamento e timeout definidos;
- rede bloqueada por padrão;
- diretório temporário criado fora das instalações.

## Execução
1. Clonar/copiar o fixture para diretório temporário.
2. Registrar hash do commit e árvore inicial.
3. Executar testes baseline.
4. Iniciar ferramenta apontando somente para a cópia.
5. Registrar prompt, plano, comandos, diff e resultado.
6. Executar testes de aceite.
7. Fazer revisão do diff.
8. Registrar métricas no schema.
9. Descartar cópia ou preservar como artefato identificado.

## Proibições
- não apontar agente para `C:\Users\Usuario\.omniroute`;
- não modificar configuração de OpenCode, Freebuff, Cursor, Devin ou Antigravity;
- não executar `npm install -g`, atualizações ou resets;
- não fazer push, deploy ou merge;
- não enviar conteúdo privado para providers sem autorização;
- não executar comandos destrutivos no host.

## Rollback
A cópia temporária pode ser descartada. Para tarefas que exigem comparação antes/depois, usar branch/worktree e preservar o commit-base.

## Evidência mínima
Manifesto, versão, commit, logs sanitizados, diff, testes antes/depois, score e motivo de falha.
