# P0 — Prontidão para delegação de implementação

## Veredito

Há trabalho útil que pode começar antes da conclusão de todos os estudos do P0, desde que a implementação seja aberta em p0, orientada por contratos e testes, e mantenha packages em quarentena.

Modelos locais fracos podem produzir a primeira onda de código mecânico e determinístico. Eles não devem decidir contratos, segurança, efeitos, recuperação ou critérios de aceitação.

## Evidências da auditoria

| Verificação | Resultado | Implicação |
|---|---:|---|
| Manifestos package.json em packages | 20 | Há código anterior fragmentado |
| Arquivos TypeScript | 265 | O volume não significa prontidão de integração |
| Arquivos de teste | 70 | Podem fornecer casos, não autoridade normativa |
| Dependências internas ausentes | 9 | A árvore antiga não é instalável de forma confiável |
| Lockfiles | 0 | Não existe resolução reprodutível |
| tsconfig.base.json esperado | ausente | Vários pacotes não compilam como estão |
| Git no diretório do projeto | ausente | Falta uma fronteira segura para delegação concorrente |
| Node local | 24.16.0 | Compatível com a base proposta |
| node:sqlite | funcional no ambiente | Candidato viável atrás de CatalogPort |

As dependências internas declaradas e não encontradas são: @ideia/acceleration, @ideia/agent-runtime, @ideia/contracts, @ideia/control-tower, @ideia/event-bus, @ideia/health-check, @ideia/logger, @ideia/resilience-v2 e @ideia/safety-circuit.

## O que já pode ser implementado

### Pronto para modelos fracos

- esqueleto isolado do projeto p0;
- relógio injetável e utilitários determinísticos sem I/O;
- estados e transições puras da tarefa;
- gate puro do limite duro de orçamento;
- inventário e alinhamento documental da fixture de benchmark.

### Pronto somente depois de um freeze forte

- contratos de dados congelados por um revisor forte;
- projeções puras derivadas de eventos;
- fakes em memória para provider, catálogo, artifacts, verifier, tool catalog e ferramentas;
- corpus de testes derivado dos contratos congelados;
- documentação de comandos e formatos de saída já decididos.

### Exige contrato congelado e revisão independente

- JSON canônico, impressão digital e encadeamento de hashes;
- eventos, migrações, SQLite, backup e restauração;
- escrita atômica de artefatos;
- validação de caminhos, symlinks, patches e Git;
- aprovação vinculada à intenção, ToolBroker e diário de efeitos;
- redação de segredos, egress e política de rede;
- subprocessos, timeout, cancelamento e encerramento da árvore de processos;
- rollback e reconciliação depois de falhas;
- provider real;
- admissão de governança, budget transacional e runner de avaliação;
- gates G2 e injeção de falhas.

## Classes de execução

| Classe | Perfil | Trabalho autorizado |
|---|---|---|
| L | modelo local fraco | Funções puras, tipos simples, testes tabelados, fixtures e documentação mecânica |
| F | free tier intermediário | Adaptadores limitados, testes de integração read-only e revisão por contrato |
| S | modelo forte ou revisão humana | Contratos, segurança, persistência, efeitos, concorrência, recuperação e aceite |

Um modelo L não recebe tarefas com credenciais, rede, shell mutável, concorrência, recuperação ou decisões arquiteturais.

## Fluxo obrigatório por pacote

~~~mermaid
flowchart LR
    A["S/F congela contrato e testes"] --> B["L implementa pacote limitado"]
    B --> C["F/S executa revisão independente"]
    C --> D{"Critérios atendidos?"}
    D -- "não" --> B
    D -- "sim" --> E["Integração na linha P0"]
~~~

O autor não pode ser o único revisor. Testes criados apenas pelo mesmo modelo que criou a implementação não bastam para promoção.

## Preparação antes de distribuir tarefas

1. Criar um snapshot recuperável ou inicializar Git antes da primeira edição concorrente.
2. Executar WP-01 para criar p0 e fixar a versão de runtime.
3. Manter cada modelo em uma cópia, branch ou worktree separada.
4. Não permitir alterações em docs normativos nem em packages.
5. Fornecer somente os documentos indispensáveis ao pacote.
6. Integrar em ordem de dependência, nunca por ordem de chegada.

## Regras de tamanho e escopo

Cada entrega para modelo L deve conter:

- um único objetivo;
- um pacote ou diretório;
- no máximo 3 a 5 arquivos de produção;
- testes e critérios de aceite explícitos;
- proibição de novas dependências e acesso à rede;
- proibição de editar fora da lista;
- proibição de any, ts-ignore, catches vazios, fallbacks permissivos e TODOs;
- relatório de arquivos, testes, limitações e decisões não tomadas.

Conflito entre prompt e documentação normativa exige parada e relato. O modelo não pode “resolver” o conflito inventando comportamento.

## Documentação concluída e evidência ainda ausente

Governança, avaliação, contexto, ciclo, custos, threat model, sandbox, SQLite, artifacts e recovery possuem estudos/ADRs/contracts v2/rc.7. Isso encerra as decisões documentais necessárias para preparar os pacotes, não seus gates empíricos.

Continuam ausentes: implementação P0, corpus integral, MP-P0 preenchido, fault suites, PoC de isolamento, provider real e G0/G1/G2 executados. Componentes de efeito continuam bloqueados até seus pré-requisitos específicos.

## Critérios de promoção

Um pacote só entra na linha P0 se:

- tiver contrato normativo rastreável;
- compilar e passar pelos testes previstos;
- não importar packages;
- não acrescentar dependências sem ADR;
- falhar de forma fechada para entrada inválida;
- possuir revisão independente;
- registrar limitações conhecidas sem mascará-las com fallback.

Passar nos testes de um pacote produz evidência apenas para aquele pacote. Não satisfaz sozinho um RF, RNF, quality gate ou o P0 completo.

## Autorização atual

Podem ser delegados a modelos L agora: WP-01, WP-02A, WP-02B, WP-03, WP-06 e WP-10.

WP-04 pode ser iniciado por modelo F, com revisão S obrigatória. WP-05 pode começar por F/S depois de WP-01 e WP-02B e requer autorização explícita para instalar Ajv 8.20.0 como única dependência de runtime dessa etapa.

WP-08 já possui taxonomia rc.7 e pode ser produzido depois de WP-03, mas só integra após WP-05. WP-05B segue WP-05; WP-07A segue WP-05B. WP-07B exige WP-11 e revisão forte; WP-07C segue WP-07B e permite o slice sem filesystem real. WP-09A segue WP-05; WP-09B cresce com cada componente transacional. WP-15B/15C e WP-21B agora possuem handoffs próprios para governança, budget e avaliação. WP-12+ continuam condicionados aos pré-requisitos individuais, MP/fault/isolation e revisão S.

SEC-INC-001 bloqueia provider real e qualquer credencial até rotação/invalidação externa; não bloqueia trabalho puro/fake/sintético.
