# Protótipo vertical — CLI → plan → diff → test → report

> **Revisão de alinhamento — 12/08/2026:** este plano operacional deve seguir a [arquitetura de referência v2](../arquitetura/arquitetura_de_referencia.md). Revisão de plano não concede capability; cada efeito passa por policy e, quando material, por aprovação específica. Os estados e gates abaixo foram corrigidos para os RF/RNF vigentes.

## Objetivo
Validar o núcleo do produto antes de construir IDE, marketplace ou multiagentes.

## Fluxo
```text
ideia task "objetivo"
  -> detectar workspace
  -> coletar contexto mínimo
  -> gerar plano estruturado
  -> mostrar plano
  -> criar recovery point (branch/worktree/snapshot conforme perfil)
  -> normalizar patch -> decidir policy -> aprovar efeito quando exigido
  -> registrar intenção -> aplicar patch -> registrar resultado
  -> mostrar diff
  -> executar testes/lint
  -> verificar critérios
  -> gerar relatório
```

## Entradas
- objetivo textual;
- diretório do projeto;
- modelo/provider configurado;
- budget e timeout;
- comandos de verificação permitidos.

## Saídas
- `plan.json`;
- patch/diff;
- resultados de testes;
- custo e tokens;
- eventos de auditoria;
- relatório Markdown/JSON;
- status final, recovery point e resíduos conhecidos.

## Tools mínimas
- `workspace.inspect`;
- `file.read`;
- `file.patch`;
- `git.status`;
- `recovery.create` e `recovery.rollback`;
- `test.run`;
- `report.write`.

Todas as tools são registradas e só podem ser alcançadas pelo `ToolBroker`; policy, aprovação, auditoria e verificação são módulos obrigatórios, não tools opcionais do modelo.

## Estados
Estados internos podem incluir `created -> preflight -> contextualizing -> planned -> running|waiting_approval -> verifying`. Estados finais persistidos: `sucesso_verificado|falha|bloqueado|cancelado|inconclusivo`. Rollback é operação, não estado final.

## Contratos
Toda tool recebe JSON validado e devolve:

```json
{
  "ok": true,
  "tool": "test.run",
  "taskId": "...",
  "stdout": "...",
  "stderr": "...",
  "exitCode": 0,
  "durationMs": 0
}
```

## Fora do protótipo
- deploy;
- push/merge automático;
- browser;
- secrets do projeto/workload; credencial do provider é apenas handle resolvido no adapter;
- multiagentes;
- marketplace;
- alteração em instalações externas;
- execução de comandos destrutivos.

## Critérios de aceite
- funciona em projeto sintético autorizado;
- não edita fora do workspace;
- 100% das tool calls possuem decisão anterior; efeito material exige approval específico;
- testes são executados em ambiente controlado;
- escrita tem recovery point; falha tenta rollback e lista qualquer resíduo;
- relatório permite reproduzir a decisão;
- texto do modelo não satisfaz critério sem evidência do verifier;
- nenhuma configuração do OmniRoute ou de outra ferramenta é modificada.

## Estimativa
Não estimada sem runtime, linguagem, `MP-P0` e decomposição implementável. O primeiro baseline deve medir a fatia read-only; o maior risco técnico conhecido é reconciliar patch/rollback e processos interrompidos sem apagar trabalho preexistente.
