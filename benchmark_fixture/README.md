# Fixture de Benchmark

**Snapshot documental:** 13 de agosto de 2026

**Status:** a fixture possui fontes versionadas e um `package-lock.json`; a instalação limpa e a execução ponta a ponta do runner T01 foram verificadas em checkout limpo. Ela está pronta para executar a fixture, mas os resultados ainda não devem ser tratados como evidência válida do schema até que o contrato de resultado e o runner sejam alinhados.

## Estrutura observada

```text
benchmark_fixture/
├── package.json                    # versionado
├── run_t01.js                      # versionado; produz resultado não aderente ao schema atual
├── src/                            # fontes .js versionados pela exceção específica da fixture
│   ├── index.js
│   ├── email-validator.js
│   ├── pagination.js
│   └── email-validator.test.js
├── package-lock.json               # versionado; instalação reproduzível com npm ci
├── results/                        # criado pelo runner quando ele executa; não versionar resultados locais
└── validate_benchmark.mjs          # ausente
```

O padrão global `.gitignore` (`**/src/**/*.js`) é sobrescrito pela exceção `!benchmark_fixture/src/**/*.js`. Os quatro arquivos de `src/` estão versionados e aparecem em `git ls-files`; a fixture pode ser reconstruída a partir de um checkout limpo.

## Situação das tarefas

### T01 — compreensão (read-only)

- **Objetivo:** explicar a estrutura e o fluxo principal sem alterar arquivos.
- **Runner existente:** `node run_t01.js`.
- **Estado:** runner executado ponta a ponta em checkout limpo com `node run_t01.js` e Enter alimentado via pipe; o baseline foi executado e o runner emitiu o registro. A execução confirma a operabilidade da fixture, mas o registro ainda não cumpre o [schema de resultados](../docs/research/benchmarks/schema_resultados.md).
- **Limite importante:** o runner atual fixa `status: 'success'`; ele não captura evidência da resposta humana nem compara o diff antes/depois. Uma execução dele não prova T01.

### T02 — bugfix de email

- **Alvo local:** `src/email-validator.js`.
- **Oráculo local:** `src/email-validator.test.js` contém casos de regressão que devem falhar com o bug atual e passar após a correção.
- **Estado:** cenário definido, porém não executado nem versionado. Não há evidência de instalação limpa ou de baseline registrado.

### T03 — feature backend

- **Fonte local:** `src/index.js` possui a rota `GET /api/users`; `src/pagination.js` implementa a paginação básica.
- **Estado:** não verificado. Faltam testes de contrato/validação da rota e uma execução registrada; a afirmação de que a paginação está “correta” não é demonstrada.

### T04–T10

Não há cenários implementados ou oráculos documentados neste snapshot.

## Pré-condições para qualquer execução

1. Os quatro arquivos `.js` de `src/` devem permanecer versionados pela exceção específica no `.gitignore`.
2. `package-lock.json` deve permanecer versionado e compatível com `package.json`.
3. Em cópia limpa, executar `npm ci --ignore-scripts` e verificar o resultado.
4. Executar e registrar o baseline (`npm test`) antes de expor uma tarefa a uma ferramenta.
5. Resolver a semântica de status e criar um schema executável/validador antes de aceitar JSON em `results/`.

As quatro primeiras condições de instalação e execução já foram verificadas para a fixture atual. A quinta permanece pendente; portanto, resultados em `results/` ainda não são evidência válida do schema.

## Comandos previstos após a recuperação

```bash
cd benchmark_fixture
npm ci --ignore-scripts
npm test -- --runInBand
node run_t01.js
```

## Próxima implementação necessária

As alterações de código e configuração estão fora do escopo do WP-10. O inventário, as decisões pendentes e a sequência segura de implementação estão em [P0_ALIGNMENT.md](P0_ALIGNMENT.md).
