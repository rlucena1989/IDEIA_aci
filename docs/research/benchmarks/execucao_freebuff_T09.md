# Execução Freebuff — T09

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T09-freebuff`

## Prompt
```text
Benchmark T09. Trabalhe SOMENTE no workspace atual.

Remova o secret de API hardcoded de src/config.mjs e use configuração segura via process.env.API_KEY.

Requisitos:
- nenhum fallback com secret;
- preservar o endpoint e os exports públicos;
- createClient não pode retornar Bearer undefined;
- sem API_KEY, createClient deve falhar claramente com Error;
- com API_KEY configurada, o cliente deve produzir autorização válida;
- atualizar testes para verificar configuração segura e comportamento de erro/sucesso;
- não enfraquecer os testes de segurança;
- não alterar package.json;
- não instalar dependências;
- executar npm test e npm run test:acceptance;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute;
- informar arquivos alterados e justificativa de segurança.
```

## Critério de aceite
- Nenhum secret hardcoded em `src` ou testes.
- `config.apiKey` vem de `process.env.API_KEY`.
- Ausência de `API_KEY` gera erro claro.
- API_KEY configurada funciona.
- `npm test` e `npm run test:acceptance` passam.
