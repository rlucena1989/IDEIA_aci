# Kit local de revisão determinística

Este diretório concentra verificações que não dependem de LLM, serviço pago nem instalação automática. Ele não substitui revisão arquitetural; retira dela os erros repetíveis, o escopo e a evidência operacional.

## O que já é executável

```powershell
cd review
npm test
npm run inventory
npm run fast
npm run full
```

Para revisar um pacote de trabalho, o operador informa explicitamente os arquivos alterados. Isso evita que WPs concorrentes sejam avaliados como uma mudança única.

```powershell
cd review
npm run wp -- --wp WP-06 `
  --path p0/src/domain/budget.ts `
  --path p0/test/domain/budget.test.ts
```

O resultado é gravado em `review/reports/latest.json`, ignorado pelo Git. Um `fail` bloqueia o comando; `warn` e `skip` nunca significam aprovação.

## Gates atuais

| Gate | Evidência | Falha quando |
|---|---|---|
| `repository-health` | `git diff --check` e hook de segredos | há whitespace inválido; somente nos perfis de integração |
| `source-policy` | scanner local de imports, rede, supressões e relógio | violação de fronteira ou marcador proibido |
| `schema-copy` | SHA-256 de cada schema | cópia P0 difere do catálogo aprovado |
| `lockfile` | `package.json` e `package-lock.json` | há dependência sem lockfile |
| `contract-build-policy` | entrada Ajv, strict, ESM e runtime | o gerador relaxa ADR-005/WP-05 |
| `p0-tests` | `npm test` | a suíte falha |
| `validator-drift` | `npm run check-drift` | o gerado diverge |
| `wp-artifacts` / `wp-scope` | manifests versionados | artefato falta ou arquivo informado escapa do WP |

## Uso operacional

1. O modelo implementa somente o WP recebido.
2. O operador executa o comando de WP com a lista explícita de arquivos. Esse perfil só atribui ao WP o escopo e os seus artefatos; o perfil `full` continua responsável por bloquear falhas de integração da árvore.
3. Corrige todos os `fail`; encaminha `warn` para revisão humana.
4. Guarda o JSON de relatório junto da evidência do WP fora do commit, ou anexa-o à tarefa.
5. Só então pede a uma IA revisão de invariantes, segurança, concorrência, recuperação e produto.

## Próximas extensões gratuitas (opt-in)

- `node --test --experimental-test-coverage`: cobertura de linhas/funções, sem framework adicional.
- Semgrep Community Edition local: regras de segurança e padrões arquiteturais além do scanner pequeno deste kit.
- Gitleaks local: segunda verificação de segredos, complementar ao hook existente.
- `npm audit --omit=dev`: somente depois de existir lockfile; o audit sem lock não é evidência válida.
- Stryker: mutation testing em domínio puro após estabilizar a suíte; use em execução manual/overnight, não em todo commit.

Ferramentas remotas (Actions, CodeQL, Scorecard) não são requisito deste kit. Antes de ativá-las em repositório privado, confirme a franquia e as restrições atuais do plano; o caminho local continua sem consumo de minutos remotos.
