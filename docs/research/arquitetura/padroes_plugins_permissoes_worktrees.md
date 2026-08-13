# Padrões de plugins, permissões e worktrees

## Plugins
O plugin local do OmniRoute para OpenCode sugere um padrão simples:

```text
manifest/package.json
  -> entrypoint dist/index.js
  -> schema/configuração
  -> provider adapter
  -> auth/connect flow
  -> testes de contrato
```

Para IDEIA:
- manifesto com `id`, versão, capabilities, permissões e entrypoint;
- schemas Zod/JSON Schema;
- lifecycle `install -> validate -> enable -> execute -> disable`;
- versão e hash registrados em auditoria;
- sem acesso a secrets/rede por padrão.

## Permissões
Separar:

1. **Capacidade declarada:** o que o plugin pede.
2. **Política do projeto:** o que é permitido.
3. **Aprovação da tarefa:** o que pode ocorrer agora.
4. **Sandbox:** onde o código executa.

Exemplo:

```json
{
  "id": "provider.omniroute",
  "permissions": ["network:localhost", "provider:discover"],
  "secrets": ["provider_token"],
  "writeScopes": []
}
```

## Worktrees
Padrão recomendado para tarefas de edição:

```text
repo principal
  ├── worktree/task-001
  ├── worktree/task-002
  └── worktree/task-003
```

Regras:
- uma tarefa por worktree;
- não alterar arquivos do usuário fora do worktree;
- capturar commit-base;
- lock por repo/branch;
- diff e testes no worktree;
- merge/PR apenas após aprovação;
- remover worktree somente após snapshot/relatório.

## Aplicação
O MVP pode usar uma branch temporária por tarefa. Worktrees paralelos ficam para a fase multiagente, quando locks e resolução de conflitos estiverem testados.
