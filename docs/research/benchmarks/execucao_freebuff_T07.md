# Execução Freebuff — T07

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T07-freebuff`

## Prompt
```text
Benchmark T07. Trabalhe SOMENTE no workspace atual.

Atualize a dependência local text-utils da versão vendor/text-utils-v1 para vendor/text-utils-v2, que é compatível.

Requisitos:
- atualizar package.json para file:vendor/text-utils-v2;
- atualizar package-lock.json consistentemente;
- não alterar src ou testes;
- não usar rede;
- executar npm install --offline --ignore-scripts;
- executar npm test;
- executar npm run build;
- confirmar dist.txt = hello-world;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute.
```

## Critério de aceite
- Lockfile consistente.
- Instalação offline passa.
- Testes 2/2 passam.
- Build passa e produz `hello-world`.
- Apenas `package.json` e `package-lock.json` alterados, além de artefatos normais de instalação/build.
