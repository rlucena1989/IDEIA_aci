# P0 — Prompts da primeira onda

## Cabeçalho obrigatório para todos os prompts

Copie este cabeçalho antes do prompt específico.

~~~text
Você está implementando um pacote estritamente limitado do P0 do projeto IDEIA.

Diretório autorizado: [PREENCHER]
Arquivos autorizados: [PREENCHER]

Regras:
- Leia os documentos indicados antes de editar.
- A árvore packages é legado em quarentena: não edite nem importe nada dela.
- Não edite documentos normativos.
- Não acesse a rede e não adicione dependências.
- Não altere arquivos fora da lista autorizada.
- Use Node ESM e imports locais com extensão .ts.
- Escreva TypeScript compatível com remoção nativa de tipos; não use recursos que dependam de transformação.
- Não use any, ts-ignore, catch vazio, fallback permissivo ou TODO.
- Entradas inválidas devem falhar de modo explícito e fechado.
- Não invente campos, estados, decisões ou regras.
- Se houver conflito, ambiguidade relevante ou arquivo ausente, pare sem editar e relate.

Saída obrigatória:
1. resumo;
2. arquivos alterados;
3. testes executados e resultado;
4. requisitos atendidos;
5. limitações;
6. confirmação de que não editou fora do escopo.
~~~

## WP-01 — Esqueleto isolado

~~~text
Objetivo: criar a menor base executável e testável para p0.

Leia:
- docs/implementation/adr/ADR-001-runtime-p0.md
- docs/implementation/adr/ADR-002-isolamento-codigo-legado.md

Arquivos autorizados:
- p0/package.json
- p0/tsconfig.json
- p0/.gitignore
- p0/src/index.ts
- p0/test/smoke.test.ts
- p0/README.md

Implemente:
- package ESM privado;
- script de smoke test sem pós-instalação;
- configuração TypeScript aderente à ADR-001;
- export mínimo e smoke test com node:test;
- README com versões requeridas e comandos.

Aceite:
- nenhum runtime dependency;
- node --test test/smoke.test.ts executa o smoke test;
- import local usa extensão .ts;
- nenhum arquivo de packages é importado.
- não declare que houve typecheck; ele será habilitado com compilador e lockfile em pacote posterior.
~~~

## WP-02A — Relógios injetáveis

~~~text
Objetivo: separar tempo de auditoria e tempo monotônico com fakes determinísticos.

Leia:
- docs/implementation/adr/ADR-001-runtime-p0.md
- docs/research/arquitetura/tarefas_longas_assincronas.md

Arquivos autorizados:
- p0/src/domain/clock.ts
- p0/test/domain/clock.test.ts

Implemente:
- AuditClock com nowUtc, retornando instante defensivamente copiado;
- MonotonicClock com nowMs não decrescente;
- FakeAuditClock e FakeMonotonicClock com avanço explícito;
- rejeição de recuo no fake monotônico.

Aceite:
- os fakes não leem Date.now nem performance.now;
- valores retornados não permitem mutar o estado interno;
- testes cobrem avanço zero, avanço positivo e tentativa de recuo;
- não implemente ainda formatos de identificador.
~~~

## WP-03 — Estados e transições

~~~text
Objetivo: implementar a máquina de estados pura da tarefa.

Leia:
- docs/research/arquitetura/arquitetura_de_referencia.md
- docs/research/produto/requisitos_funcionais.md

Arquivos autorizados:
- p0/src/domain/task-state.ts
- p0/src/domain/task-transition.ts
- p0/test/domain/task-transition.test.ts

Estados permitidos:
- created
- preflight
- contextualizing
- planned
- running
- waiting_approval
- verifying
- sucesso_verificado
- falha
- bloqueado
- cancelado
- inconclusivo

Implemente:
- união fechada dos estados;
- função pura de validação de transição;
- erro tipado para transição inválida;
- finais irreversíveis;
- exatamente as transições publicadas na seção “Máquina de estados” do documento de arquitetura.

Aceite:
- teste cartesiano de todos os pares;
- aliases, capitalização diferente e estados desconhecidos são rejeitados;
- nenhum estado final pode ser reaberto;
- não acrescente estados.
~~~

## WP-06 — Orçamento puro

~~~text
Objetivo: calcular consumo e decisões de limite sem chamar provider ou ferramenta.

Leia:
- docs/research/produto/requisitos_nao_funcionais.md
- docs/research/arquitetura/tarefas_longas_assincronas.md

Arquivos autorizados:
- p0/src/domain/budget.ts
- p0/test/domain/budget.test.ts

Implemente:
- tipo de quantidade em uma única unidade definida pelo chamador;
- validação de inteiros não negativos;
- soma segura de consumo confirmado, reservado e possível excedente;
- remaining saturado em zero;
- decisão fechada can_start ou hard_limit_reached;
- rejeição de NaN, infinito, negativos e overflow inseguro.

Aceite:
- nenhuma política de degradação ou constante de produto inventada;
- hard limit sempre chega por parâmetro;
- exatamente no limite, nenhuma nova operação cobrável pode iniciar;
- testes de zero, fronteiras, ultrapassagem e máximo seguro;
- funções puras e determinísticas.
~~~

## WP-07 — Fakes determinísticos

> **Superseded:** não use este prompt. O escopo foi dividido em `handoffs/WP-07A.md` e `handoffs/WP-07B.md` depois do freeze de ports/CatalogPort.

~~~text
Objetivo: criar fakes em memória para testes, obedecendo interfaces já congeladas.

Pré-condição: WP-05 integrado. Se as interfaces não existirem, pare.

Arquivos autorizados:
- p0/src/testing/fake-provider.ts
- p0/src/testing/fake-tool.ts
- p0/src/testing/fake-catalog.ts
- p0/test/testing/fakes.test.ts

Implemente:
- respostas enfileiradas e falhas injetáveis;
- registro somente leitura das chamadas recebidas;
- relógio nunca consultado implicitamente;
- reset explícito;
- cópias defensivas das entradas e saídas.

Aceite:
- ordem determinística;
- fila vazia falha explicitamente;
- nenhuma rede, filesystem, subprocesso ou SQLite;
- testes cobrem sucesso, falha injetada, ordem e isolamento de cópias.
~~~

## WP-08 — Projeções puras

~~~text
Objetivo: reduzir eventos congelados em uma projeção de tarefa sem I/O.

Pré-condição: contratos de evento e estado integrados. Se faltarem, pare.

Arquivos autorizados:
- p0/src/domain/task-projection.ts
- p0/test/domain/task-projection.test.ts

Implemente:
- projeção inicial explícita;
- reducer puro de um evento;
- fold determinístico de uma sequência;
- rejeição de sequência impossível, duplicata e regressão conforme contrato.

Aceite:
- mesma entrada produz valor estruturalmente igual;
- não ordenar silenciosamente eventos recebidos;
- eventos desconhecidos falham;
- testes cobrem replay, sequência inválida e estado final.
~~~

## WP-10 — Alinhamento do benchmark_fixture

~~~text
Objetivo: auditar e alinhar somente a documentação e os exemplos do benchmark_fixture aos estados finais vigentes.

Leia:
- docs/research/produto/requisitos_funcionais.md
- docs/research/produto/requisitos_nao_funcionais.md
- docs/research/arquitetura/dados_e_persistencia.md

Arquivos autorizados:
- benchmark_fixture/README.md
- benchmark_fixture/P0_ALIGNMENT.md

Não altere package.json, executores, código da fixture ou métricas.

Implemente:
- inventário de campos antigos e seus destinos;
- inventário dos exemplos que ainda usem success, partial, failed ou rolled_back;
- marcação explícita do que não possui mapeamento normativo;
- correção no README de caminhos ou afirmações operacionais não demonstradas.

Aceite:
- nenhuma tradução sem evidência documental;
- inconclusivo não é convertido em sucesso nem falha;
- saída contém tabela antes/depois e casos bloqueados.
~~~

## Prompt de revisão independente

~~~text
Revise a entrega como avaliador independente. Não reescreva a arquitetura.

Verifique:
- aderência exata aos arquivos e contrato autorizados;
- ausência de imports de packages e novas dependências;
- testes de fronteira e casos inválidos;
- comportamento fail-closed;
- determinismo e ausência de I/O escondido;
- any, ts-ignore, catch vazio, TODO e fallback permissivo;
- divergências entre implementação, testes e documentos.

Execute os testes disponíveis. Classifique cada achado como bloqueante, importante ou melhoria. Cite arquivo e linha. Termine com promover, corrigir ou rejeitar, incluindo justificativa verificável.
~~~
