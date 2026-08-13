# Execução Freebuff — T02

## Status
Preparada; aguarda execução manual na interface Desktop.

## Workspace
`C:\Users\Usuario\AppData\Local\Temp\opencode\benchmark-runs\T02-freebuff`

## Prompt para colar no Freebuff
```text
Benchmark T02. Trabalhe SOMENTE no workspace atual.

Corrija o bug em src/users.mjs: isValidEmail deve rejeitar endereços sem sufixo de domínio, como dev@example, e continuar aceitando dev@example.com.

Restrições:
- não alterar package.json;
- não alterar arquivos de teste;
- não acessar outros diretórios;
- não acessar ou alterar configurações do Freebuff, OpenCode ou OmniRoute;
- não instalar dependências;
- executar npm test após a alteração;
- informe arquivos alterados, diff resumido e resultado completo dos testes.
```

## Coletar após execução
- tempo de início/fim;
- modelo exibido;
- intervenções/aprovações;
- arquivos alterados;
- testes antes/depois;
- custo/créditos exibidos;
- screenshot ou transcrição do resultado;
- qualquer acesso fora do workspace.

## Critério
Sucesso somente se apenas `src/users.mjs` mudar e os 5 testes passarem.
