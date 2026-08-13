# Resultado T09 — OpenCode

## Resultado
**Sucesso.** O secret hardcoded foi removido e substituído por configuração via ambiente.

## Mudanças
- `src/config.mjs`: `apiKey` usa `process.env.API_KEY`.
- `src/client.mjs`: `createClient()` lança `Error("API_KEY is required")` quando a variável está ausente.
- `tests/config.test.mjs` e `tests/acceptance.test.mjs`: validam ausência segura e erro explícito.

## Validação
- `npm test`: 7/7 passando.
- `npm run test:acceptance`: 2/2 passando.
- Exit codes: ambos `0`.
- Nenhum fallback secreto adicionado.
- `package.json` e dependências não alterados.

## Observação
A configuração de sucesso com `API_KEY` presente não foi exercitada por teste isolado; o contrato de ausência segura e o erro claro foram validados.

## Dados não capturados
Modelo, custo e tokens não foram capturados.
