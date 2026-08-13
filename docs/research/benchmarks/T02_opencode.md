# Resultado T02 — OpenCode

## Resultado
**Sucesso funcional.** OpenCode alterou somente `src/users.mjs` na cópia isolada e executou `npm test` com 5/5 testes passando.

## Mudança observada
A implementação passou de uma verificação global de ponto para uma verificação de ponto após `@`:

```js
const at = value.indexOf("@");
return at > 0 && value.includes(".", at + 1);
```

## Métricas
- Ferramenta: OpenCode 1.18.11.
- Tarefa: T02.
- Testes antes: 5 passando.
- Testes depois: 5 passando.
- Aceite: 2 passando.
- Arquivos alterados: 1.
- Alterações fora do escopo: 0.
- Retries: 0.
- Intervenções humanas: 0.
- Custo/tokens: não capturados pelo CLI nesta execução.

## Limitações
A fixture não era um repositório Git; portanto, o diff foi capturado pela saída do agente, inventário de arquivos e hashes, não por `git diff`. A execução usou o endpoint OmniRoute já configurado, sem alterar OmniRoute ou OpenCode.

## Artefato
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T02-opencode`
