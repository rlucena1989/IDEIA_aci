# Handoff WP-09A — fixtures de forma dos contratos

Você está preparando corpus de teste, sem alterar código de produção.

## Pré-condições

WP-05 deve estar integrado e os validators standalone devem passar. Se não estiverem, pare sem editar.

## Objetivo

Criar uma fixture schema-valid para cada contrato de instância e mutações inválidas transversais reproduzíveis.

## Leia antes de editar

- docs/implementation/contracts/README.md
- docs/implementation/contracts/matriz_testes_contrato_v1.md
- todos os schemas em docs/implementation/contracts/v1

## Diretório autorizado

- p0/test/fixtures/contracts/v1/

## Implemente

- um JSON schema-valid por schema de instância; _defs não possui instância;
- index.json listando fixture, contract, schema_id e escopo shape_only;
- mutations.json com CT-X02 a CT-X10 e transformação declarativa;
- valores consistentes de tipo e prefixo;
- timestamps UTC canônicos;
- digests sintaticamente válidos marcados como placeholders de shape.

Formato de mutação:

~~~json
{
  "case_id": "CT-X02-task-manifest-objective",
  "base_fixture": "task-manifest.valid.json",
  "operation": "remove",
  "json_pointer": "/objective",
  "expected_code": "invalid.required"
}
~~~

## Critérios de aceite

- cada fixture válida passa exatamente em seu validator;
- cada mutação falha pelo motivo esperado;
- /2, campo desconhecido, required ausente, tipo incorreto, range, timestamp e ID inválido têm cobertura;
- fixture não é chamada semantic_valid;
- nenhum digest placeholder é tratado como hash verificado;
- nenhum secret, path real, username ou dado pessoal aparece;
- execução duas vezes produz mesmos arquivos.

## Regras

- Não edite código, schemas, package.json, docs ou packages.
- Não acesse rede e não adicione dependência.
- Não invente limite sem fonte.
- Não altere validator para aceitar fixture.
- Não use snapshot opaco como único assert; valide code e instance path.
- Em conflito entre schema e matriz, pare e relate.

## Resposta obrigatória

1. inventário de fixtures;
2. arquivos criados;
3. validators executados e resultado;
4. mutações e códigos observados;
5. lacunas semânticas;
6. confirmação de escopo.

