# Protocolo vinculante de execucao por LLM

**Status:** obrigatorio para qualquer pacote de trabalho em `handoffs/`.
**Uso:** o operador entrega este protocolo, o arquivo `WP-*.md` selecionado e somente os documentos que o WP manda ler. O WP define o escopo especifico; este documento define o comportamento transversal.

## Regra de autoridade

1. ADRs, contratos, schemas, vetores e testes listados pelo WP sao a fonte de verdade.
2. A arvore `packages/` e legado em quarentena: nao editar, importar, copiar comportamento ou usar como autoridade.
3. O LLM nao decide arquitetura, seguranca, retencao, permissao, schema, efeito externo ou criterio de aceite ausente.
4. Um documento que diz "planejado", "draft", "blocked" ou "exploratory" nao autoriza inferir comportamento de producao.

## Limites de edicao

- Editar apenas os arquivos/diretorios autorizados pelo WP.
- Nao criar dependencia, instalar pacote, acessar rede, ler credencial ou executar efeito externo sem autorizacao explicita no WP.
- Nao editar ADR, contrato, schema, vetor, DDL ou documento normativo para fazer o proprio codigo passar, salvo se o WP os listar explicitamente como alvo.
- Nao fazer alteracao oportunista, formatacao ampla ou refatoracao fora do objetivo.

## Regras de implementacao

- Ler todos os documentos indicados antes de editar.
- Preferir implementacao pequena, deterministica e testavel.
- Nao usar `any`, `@ts-ignore`, catch vazio, fallback permissivo, TODO como substituto de comportamento, stub que retorna sucesso ou suprime erro.
- Validar entradas e falhar fechada para dado, estado, versao, permissao ou dependencia desconhecidos.
- Nunca registrar prompt bruto, output bruto, secret, credencial, PII real, caminho de operador ou dado de outro projeto.
- Nao alegar garantia que o WP, teste e ambiente nao demonstraram.

## Regra de parada obrigatoria

Parar sem editar e reportar `blocked` quando ocorrer qualquer um dos casos abaixo:

- pre-condicao ou dependencia do WP nao esta satisfeita;
- arquivo normativo citado esta ausente ou contradiz outro artefato;
- a mudanca exige arquivo fora do escopo;
- a implementacao exige nova dependencia, rede, segredo, permissao, efeito externo ou decisao arquitetural nao autorizada;
- o comportamento seguro depende de suposicao nao documentada;
- teste e contrato divergem e nao ha prioridade declarada;
- o ambiente nao permite executar o comando de aceite ou reproduzir o resultado.

`blocked` e um resultado correto. O LLM nao deve improvisar uma solucao para esconder o bloqueio.

## Verificacao antes de entrega

1. Executar somente os comandos de teste permitidos pelo WP e pelo ambiente.
2. Conferir a lista de arquivos alterados contra o escopo autorizado.
3. Conferir que o resultado nao criou secret, artefato grande, dependencia nao autorizada ou alteracao em `packages/`.
4. Registrar comando, exit code, versao de runtime e resultado; teste nao executado deve ser declarado como `not_run`, com motivo.

## Resposta obrigatoria do LLM

1. `status`: `complete`, `blocked` ou `failed`.
2. Objetivo entregue ou bloqueio encontrado.
3. Lista exata de arquivos alterados/criados.
4. Lista de requisitos, invariantes e IDs de caso atendidos.
5. Comandos executados, exit code e resultado; separar `not_run`.
6. Limites, riscos residuais e itens nao implementados.
7. Confirmacao explicita de que nao houve edicao fora do escopo e que `packages/` nao foi usado.
