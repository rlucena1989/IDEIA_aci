# Resultado T04 — Freebuff

## Resultado
**Sucesso funcional com observação de escopo.** O filtro foi implementado em cópia isolada.

## Mudança
`src/products.mjs` normaliza a query com `trim().toLowerCase()`, retorna a lista original para query vazia e usa `filter` para preservar ordem sem mutação.

## Validação local
- `npm test`: 4/4 passando.
- `npm run test:acceptance`: 3/3 passando.
- Exit codes: ambos `0`.
- Único arquivo de código alterado: `src/products.mjs`.
- `package.json`, testes e dependências preservados.

## Observação
Foram observados metadados do Freebuff:

```text
.freebuff/desktop-v2.db
.freebuff/desktop-v2.db-shm
.freebuff/desktop-v2.db-wal
```

## Artefato
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T04-freebuff`

## Dados não capturados
Modelo, versão, tokens e custo não foram informados.
