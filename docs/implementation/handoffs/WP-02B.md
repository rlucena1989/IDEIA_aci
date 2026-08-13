# Handoff WP-02B — IDs tipados e geração injetável

Você está implementando um pacote estritamente limitado do P0 do projeto IDEIA.

## Pré-condição

WP-01 deve estar integrado e seu smoke test deve passar. Caso contrário, pare sem editar.

## Objetivo

Implementar todos os IDs internos dos ADR-003/007, com representação única, tipos opacos e geração UUIDv4 injetável.

## Leia antes de editar

- docs/implementation/adr/ADR-001-runtime-p0.md
- docs/implementation/adr/ADR-003-identificadores-e-versao-de-contratos.md
- docs/implementation/adr/ADR-007-identificadores-operacionais-adicionais.md
- docs/implementation/contracts/vectors/id-vectors.json
- docs/implementation/contracts/v1/_defs.schema.json

## Arquivos autorizados

- p0/src/domain/ids.ts
- p0/src/ports/id-generator.ts
- p0/src/adapters/node-id-generator.ts
- p0/test/domain/ids.test.ts
- p0/test/adapters/node-id-generator.test.ts

## Implemente

- tipos opacos para todos os tipos e prefixos da tabela ADR-003;
- parse específico por tipo, recebendo unknown e retornando o tipo opaco;
- InvalidIdError com code estável invalid.id, tipo esperado e sem ecoar valor sensível;
- UuidV4Generator como port injetável;
- funções create por tipo que prefixam um UUID recebido do port e validam a saída;
- adapter Node usando crypto.randomUUID.

## Critérios de aceite

- todos os vetores de id-vectors.json passam;
- cada prefixo válido é testado;
- prefixo trocado entre dois IDs válidos falha;
- maiúsculas, whitespace, UUID sem hífens, versão diferente e variante diferente falham;
- parser não corrige nem normaliza;
- domínio não importa node:crypto;
- adapter é o único arquivo autorizado a importar node:crypto;
- gerador fake nos testes prova determinismo e colisão não é tratada como upsert.

## Regras

- Não edite packages, docs ou arquivos fora da lista.
- Não acesse a rede e não adicione dependências.
- Use ESM, extensão .ts e sintaxe TypeScript apagável.
- Não use enum, any, ts-ignore, cast duplo para contornar validação, fallback permissivo ou TODO.
- Não use timestamp, contador ou Math.random para ID.
- Se o baseline divergir do ADR, pare sem editar e relate.

## Resposta obrigatória

1. resumo;
2. arquivos alterados;
3. testes executados e resultado;
4. requisitos atendidos;
5. limitações;
6. confirmação de que não editou fora do escopo.
