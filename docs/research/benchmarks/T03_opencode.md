# Resultado T03 — OpenCode

## Resultado
**Sucesso funcional.** OpenCode implementou validação de paginação em uma cópia isolada.

## Mudança
Adicionou duas guard clauses em `src/products.mjs`:

```js
if (page < 1) throw new Error("page must be at least 1");
if (pageSize < 1) throw new Error("pageSize must be at least 1");
```

A lógica de slice e o formato do retorno permaneceram inalterados.

## Métricas
- Ferramenta: OpenCode 1.18.11.
- Testes antes: 1 passando, 2 falhando — falha esperada dos critérios de aceite.
- Testes depois: 3 passando.
- Testes de aceite: 2 passando.
- Arquivos alterados: 1.
- Alterações fora do escopo: 0.
- Retries: 0.
- Intervenções humanas: 0.
- Custo/tokens: não capturados.

## Artefato
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T03-opencode`

## Limitação
A fixture não é repositório Git; o diff foi obtido pela saída do agente e pelo inventário/hash local.
