# Resultado T06 — OpenCode

## Resultado
**Sucesso.** A cobertura foi ampliada sem alterar a implementação.

## Mudança
Somente `tests/service.test.mjs` foi alterado. Foram adicionados cenários de:
- nomes com whitespace;
- nomes vazios;
- `null` e `undefined` no usuário;
- subdomínio de email;
- múltiplos `@`, preservando o comportamento atual;
- email ausente;
- email sem domínio;
- email terminando em `@`.

## Validação
- `npm test`: 15/15 passando.
- `npm run test:acceptance`: 3/3 passando.
- Exit codes: ambos `0`.
- `src/service.mjs` e `package.json` não alterados.

## Dados adicionais
O agente reportou cobertura de `src/service.mjs`: 100% linhas, branches e funções. Modelo, custo e tokens não foram capturados.
