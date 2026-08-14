# Fixture de Benchmark

**Snapshot documental:** 13 de agosto de 2026

**Status:** a fixture possui fontes locais, mas elas estão ignoradas pelo Git; as dependências não estão instaladas, não há lockfile e não existe execução limpa registrada. Portanto, ela **não está pronta para produzir resultados de benchmark**.

## Estrutura observada

```text
benchmark_fixture/
├── package.json                    # versionado
├── run_t01.js                      # versionado; produz resultado não aderente ao schema atual
├── src/                            # existe localmente, mas .js está ignorado pelo Git
│   ├── index.js
│   ├── email-validator.js
│   ├── pagination.js
│   └── email-validator.test.js
├── results/                        # criado pelo runner quando ele executa; ausente neste snapshot
└── validate_benchmark.mjs          # ausente
```

O padrão global `.gitignore` (`**/src/**/*.js`) exclui os quatro arquivos de `src/`. Eles não aparecem em `git ls-files`, `git status` ou em inventários que respeitam `.gitignore`; isso torna a fixture não reproduzível a partir do repositório atual.

## Situação das tarefas

### T01 — compreensão (read-only)

- **Objetivo:** explicar a estrutura e o fluxo principal sem alterar arquivos.
- **Runner existente:** `node run_t01.js`.
- **Estado:** não verificado. O runner exige `jest`, atualmente ausente, e grava um registro que não cumpre o [schema de resultados](../docs/research/benchmarks/schema_resultados.md).
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

1. Corrigir o versionamento de `src/` e revisar o diff antes de adicioná-lo ao Git.
2. Gerar e versionar `package-lock.json` com scripts de instalação desabilitados.
3. Em cópia limpa, executar `npm ci --ignore-scripts` e registrar o resultado.
4. Executar e registrar o baseline (`npm test`) antes de expor uma tarefa a uma ferramenta.
5. Resolver a semântica de status e criar um schema executável/validador antes de aceitar JSON em `results/`.

Enquanto essas pré-condições não forem atendidas, comandos mostrados abaixo são apenas comandos previstos, não instruções de que a fixture já é executável.

## Comandos previstos após a recuperação

```bash
cd benchmark_fixture
npm ci --ignore-scripts
npm test -- --runInBand
node run_t01.js
```

## Próxima implementação necessária

As alterações de código e configuração estão fora do escopo do WP-10. O inventário, as decisões pendentes e a sequência segura de implementação estão em [P0_ALIGNMENT.md](P0_ALIGNMENT.md).
