# Execução Freebuff — T08

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T08-freebuff`

## Prompt
```text
Benchmark T08. Trabalhe SOMENTE no workspace atual.

Corrija a documentação README/API.

Requisitos:
- todos os links Markdown relativos devem apontar para arquivos existentes;
- instruções devem ser reproduzíveis;
- exemplos devem corresponder aos exports de src/client.mjs;
- criar o arquivo mínimo necessário se houver link quebrado;
- não alterar src/client.mjs;
- não alterar package.json ou testes;
- executar npm run docs:check e npm test;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute.
```

## Critério de aceite
- `npm run docs:check` passa.
- `npm test` passa.
- Link `docs/API.md` válido.
- Exemplos coerentes com `createClient` e `healthUrl`.
- Apenas documentação alterada.
