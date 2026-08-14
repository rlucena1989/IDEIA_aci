# Automação de revisões e quality gates locais

**Status:** estudo operacional inicial

**Data do snapshot:** 2026-08-13
**Objetivo:** deslocar validações repetíveis para mecanismos determinísticos e reservar modelos de IA para análise de arquitetura, segurança de fronteiras, concorrência, recuperação e aderência ao produto.

## Decisão de abordagem

O projeto adota uma pirâmide de revisão. A base é local, reprodutível e sem custo por execução; camadas opcionais são ativadas somente quando houver evidência de que agregam sinal.

```text
revisão humana / IA: invariantes, ameaças, decisões e lacunas conceituais
-------------------------------------------------------------------
testes de integração, falhas injetadas, mutação e análise semântica
-------------------------------------------------------------------
contratos, escopo, geração determinística, lint/políticas, unit tests
-------------------------------------------------------------------
Git, lockfile, secret scan, hashes, diff whitespace e evidência
```

Nenhuma camada superior substitui a inferior. Uma análise de IA não aprova um artefato sem instalação reproduzível, teste verde e escopo conferido.

## Núcleo implementado

O diretório [`review/`](../../../review/README.md) contém um runner em Node 24 sem dependências adicionais. Ele produz relatório JSON e avalia:

- saúde do diff e presença do hook de segredo;
- políticas estáticas mínimas para TypeScript, rede, legado e fronteiras de relógio;
- igualdade SHA-256 entre schemas aprovados e a cópia de build;
- lockfile obrigatório se o P0 declarar dependência;
- testes e drift dos validators;
- manifests por WP com artefatos e escopo explícito.

O runner não deduz arquivos alterados a partir de uma árvore que recebe WPs em paralelo. A lista `--path` é a unidade de evidência de escopo. Assim, uma modificação de outro modelo não cria falso negativo ou falso positivo no WP que está sendo revisado.

## Scorecard de aprovação

| Categoria | Peso | Regra de aprovação |
|---|---:|---|
| Bloqueadores determinísticos | obrigatório | zero `fail` |
| Escopo e rastreabilidade | obrigatório | manifest + arquivos explícitos + teste indicado |
| Testes e contratos | obrigatório para WP aplicável | suíte/geração verde; schemas preservados |
| Supply chain | obrigatório quando há dependências | lockfile + instalação limpa + audit revisável |
| Cobertura | informativo inicialmente | linha de base antes de meta numérica |
| Mutação/fault injection | progressivo | obrigatório apenas nos domínios de risco já estabilizados |
| Revisão humana/IA | obrigatório em WPs S | parecer independente sobre invariantes não mecanizados |

Não usar percentual de cobertura como aprovação isolada: cobertura mede execução, não prova oráculo, atomicidade, autorização ou recuperação. A meta é primeiro publicar baseline por módulo e, depois, impor crescimento não regressivo onde o teste for confiável.

## Sequência recomendada

1. Todo WP recebe manifesto de escopo e comando de aceitação. O perfil isolado não executa `git diff --check` global porque uma árvore com WPs concorrentes não permite atribuir esse resultado a um único autor; esse gate roda no perfil de integração.
2. Antes de merge: `npm test`, check de drift, scanner de segredos, scope gate e `git diff --check`.
3. Ao adicionar uma dependência: gerar e versionar lockfile com scripts desabilitados; testar `npm ci --ignore-scripts` em cópia limpa; só então executar `npm audit --omit=dev`.
4. Em domínio puro (IDs, estados, valores exatos, gates): criar property tests/geradores determinísticos e mutation testing em execução separada.
5. Em persistência, efeitos e recuperação: usar fakes que registram ordem de chamadas, injeção de falha em cada ponto de commit e casos de ambiguidade. Não se deve medir apenas cobertura.
6. Somente depois disso, modelos de IA recebem o relatório determinístico e revisam o que os checks não conseguem decidir.

## Ferramentas pesquisadas e decisão

| Recurso | Custo/licença | Papel | Decisão atual |
|---|---|---|---|
| `node:test` e cobertura nativa | já incluído no Node 24 | unit, integração pequena, mocks e cobertura | usar agora |
| npm `ci` / `audit` | já incluído no npm | reprodutibilidade e advisories | bloquear até haver lockfile; depois usar |
| Semgrep CE | open source/local | SAST e regras próprias | piloto após estabilizar convenções de import |
| Gitleaks | open source/local | defesa adicional contra segredos | instalar como binário local opcional; hook atual permanece |
| Stryker | open source | qualidade de testes de lógica pura | adiar até evitar ruído em WPs ainda móveis |
| GitHub Actions | franquia/plano variável para privado | espelho remoto do runner | opt-in, não base do processo |
| OpenSSF Scorecard | open source; resultados/integrações têm limites de visibilidade | higiene de repositório | opcional após o repositório ter sinais estáveis |
| CodeQL | disponibilidade depende do plano e da visibilidade | análise semântica avançada | não assumir disponibilidade gratuita para privado |

## Limites conscientes

- Scanner textual não prova ausência de vulnerabilidade; serve para evitar regressões óbvias e manter fronteiras visíveis.
- JSON Schema não valida invariantes transacionais, igualdade entre registros ou ordem de I/O. Esses requisitos exigem teste de aplicação e fake/SQLite.
- Audit de dependência sem lockfile não pode ser tratado como resultado de segurança.
- Um check verde não substitui a revisão do handoff: ele apenas torna a revisão humana mais curta, concreta e auditável.

## Fontes primárias

- [Node.js Test runner](https://nodejs.org/api/test.html) — runner estável, cobertura e mocks.
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) e [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) — instalação limpa e auditoria de dependências.
- [Semgrep CI configurations](https://semgrep.dev/docs/semgrep-ci/sample-ci-configs) — execução de regras em CI/local.
- [OpenSSF Scorecard](https://github.com/ossf/scorecard/blob/main/README.md) — sinais de postura de supply chain.
- [GitHub usage included](https://docs.github.com/en/billing/reference/product-usage-included) — franquias de Actions devem ser conferidas antes de habilitar automação remota em repositório privado.
