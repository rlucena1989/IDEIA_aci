# Resultado T06 — Freebuff

## Resultado
**Sucesso funcional com observação de escopo.** A cobertura foi ampliada sem alterar a implementação.

## Mudança
Somente `tests/service.test.mjs` foi alterado. A suíte passou a 27 testes comportamentais, cobrindo:
- sucesso, bordas e erros em `getUserDisplayName`;
- nomes vazios, whitespace e não-ASCII;
- domínio padrão, lowercase, subdomínio e hífen;
- email vazio, ausente, não-string, sem `@` e múltiplos `@`;
- `null` e `undefined`.

## Validação local
- `npm test`: 27/27 passando.
- `npm run test:acceptance`: 3/3 passando.
- Exit codes: ambos `0`.
- `src/service.mjs`, `package.json` e dependências preservados.

## Observação
Foram observados metadados do Freebuff:

```text
.freebuff/desktop-v2.db
.freebuff/desktop-v2.db-shm
.freebuff/desktop-v2.db-wal
```

## Artefato
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T06-freebuff`

## Dados não capturados
Modelo, versão, tokens e custo não foram informados.
