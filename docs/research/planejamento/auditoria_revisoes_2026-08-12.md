# Auditoria das primeiras revisões — 12/08/2026

**Escopo:** protocolo de pesquisa, visão do produto, casos de uso, requisitos funcionais, requisitos não funcionais e os quatro estudos-base de arquitetura  
**Tipo:** revisão documental interna  
**Status:** achados materiais corrigidos; validação empírica continua pendente

## 1. Procedimento

Os documentos do escopo foram confrontados com o [protocolo de pesquisa rigorosa](protocolo_pesquisa_rigorosa.md): pergunta e decisão, classes de afirmação, fonte primária, evidência contrária, confiança, volatilidade, condição de refutação e critério de encerramento. Também foram examinados IDs, links locais, termos absolutos e coerência entre tese, casos e gates.

Esta auditoria avalia consistência documental; não replica estudos externos nem substitui entrevistas ou benchmark.

## 2. Achados e resolução

| ID | Severidade | Achado | Efeito possível | Resolução |
|---|---|---|---|---|
| AR-01 | Média | `VP-C03` juntava um resultado causal restrito de 2025 e a incerteza sobre ferramentas atuais, atribuindo dois níveis de confiança à mesma linha | Generalização indevida e registro não atômico | Separado em `VP-C03` (resultado da amostra) e `VP-C08` (incerteza atual) |
| AR-02 | Média | A matriz de casos dava notas de recorrência 3–4 sem entrevistas ou telemetria própria | Prioridade parecia mais validada do que era | Notas reduzidas; ranking mantido apenas pelos outros critérios; `CU-C04` permanece confiança baixa |
| AR-03 | Baixa | Gates com `100%` e `zero` poderiam parecer alegações universais | Confusão entre meta normativa e resultado observado | Mantidos quando são condições explícitas de segurança, sempre descritos como gates provisórios, não evidência |
| AR-04 | Baixa | A cronologia depende de metadados locais porque não há histórico Git | Ordem pode não representar autoria original | Limitação já registrada na fila; nenhuma mudança necessária |
| AR-05 | Baixa | O validador automatizado cobre links relativos, não disponibilidade externa | Fonte externa pode desaparecer ou mudar | Consulta externa permanece datada; arquivamento de fontes ainda é pendência |
| AR-06 | Alta | Requisitos funcionais agregavam comportamentos, prioridade e aceite subjetivo | Implementações diferentes poderiam alegar o mesmo requisito | Preservados 24 grupos e criadas 99 cláusulas atômicas com fase e verificação |
| AR-07 | Alta | Requisitos não funcionais usavam números sem perfil de carga, hardware, janela ou denominador | Metas eram irrefutáveis ou manipuláveis pelo ensaio | Criado perfil obrigatório de medição; números sem baseline foram marcados provisórios |
| AR-08 | Média | Escalabilidade prescrevia API, fila e workers | Uma decisão arquitetural aparecia como atributo de qualidade | Substituída por invariantes observáveis de concorrência, backpressure e perda de eventos |
| AR-09 | Alta | Disponibilidade de 99,5% aparecia antes de existir serviço, SLI ou necessidade observada | Compromisso sem população/janela e provável sobreconstrução do P0 | Meta suspensa até P1; P0 mede recuperação após reinício e perda de estado |
| AR-10 | Alta | Privacidade e exclusão podiam ser lidas como conclusão de conformidade LGPD/GDPR | Alegação jurídica sem inventário, papéis ou jurisdição | Controles tratados como requisitos de engenharia; claim exige revisão jurídica própria |
| AR-11 | Alta | Arquitetura original colocava subagentes, RAG, router, plugins/MCP, PostgreSQL, Redis e workers no MVP sem derivação | Sobreengenharia e dependências antes dos gates de produto | P0 reduzido a processo local modular, single-agent e ports mínimos |
| AR-12 | Crítica | Persistência transacional e efeitos externos apareciam como se checkpoint/retry garantissem atomicidade | Duplicação ou perda silenciosa após crash | Criado protocolo `intent → invoke → result/reconcile`; ambiguidade termina inconclusiva |
| AR-13 | Alta | Aprovação de plano/diff era tratada como autorização | Mudança de parâmetros poderia reutilizar consentimento amplo | Approval agora vincula request normalizado, alvo, limite, versão, expiração e nonce |
| AR-14 | Alta | “Docker sandbox” era recomendação apesar de a PoC validar apenas restrições lógicas | Claim de isolamento não demonstrado | Contenção passou a perfil por capabilities; fixture hostil bloqueada sem PoC real |
| AR-15 | Média | Estados do protótipo divergiam de RF e tratavam rollback como estado final | Relatórios e recovery incompatíveis | Fluxo auxiliar alinhado aos cinco estados finais; rollback virou operação verificável |
| AR-16 | Alta | A estratégia de implantação misturava localidade, runtime, topologia e responsabilidade em uma tabela | Comparações não eram mutuamente exclusivas nem reproduzíveis | Substituída por vetor de controle, workspace, tools, inferência, estado, secrets e operação |
| AR-17 | Alta | “Local” sugeria privacidade alta mesmo com possível LLM remoto | Egress de código/contexto ficava invisível na decisão | Criados DPL-01 local+remoto e DPL-02 integral/offline, com fluxo de dados explícito |
| AR-18 | Média | Cloud/híbrido/self-hosted eram recomendados por fase sem problema causal | Infraestrutura poderia preceder recorrência e necessidade | Criados gates GM-01–06 e critérios de rejeição |
| AR-19 | Alta | “Artefatos equivalentes” podia exigir saídas idênticas entre modelos/ambientes | Meta impossível ou incentivo a comparação inválida | Equivalência redefinida como semântica de contrato, estado e segurança |
| AR-20 | Alta | O modelo original incluía tenants, memória, embeddings, plugins e bancos futuros sem consulta ou requisito P0 | Schema e operação cresceriam antes da aprendizagem | Modelo reduzido a dez entidades lógicas ligadas ao vertical slice |
| AR-21 | Crítica | PostgreSQL + pgvector e Redis eram chamados de núcleo sem volume, concorrência ou acesso remoto demonstrados | Topologia distribuída contradizia o P0 local | SQLite de escritor único + artefatos locais; alternativas agora dependem de gates medidos |
| AR-22 | Crítica | Banco, filesystem e efeitos externos não tinham fronteiras de commit/recovery | Crash poderia criar resultado falso, duplicata ou referência ausente | Definidos journal e transações por operação, publicação staged e reconciliação |
| AR-23 | Alta | Append-only e hash poderiam ser lidos como imutabilidade/não repúdio | Confiança maior que a ameaça suportada pelo host local | Claims limitados a API comum, detecção de corrupção/edição parcial e verificador independente |
| AR-24 | Alta | Backup era implícito e não havia teste de restauração | Cópia viva inconsistente poderia ser tratada como recuperação | Backup condicionado a RPO/RTO, API consistente, manifesto e restore validado |
| AR-25 | Crítica | Retenção, secrets e exclusão não tinham classes nem alcance sobre artifacts/exports/backups | Vazamento ou promessa falsa de apagamento | Criadas classes D0–D6, redação pré-storage, canários, recibo e limites forenses explícitos |
| AR-26 | Média | Integridade física, FK, hash e semântica eram confundidos | Um check verde poderia ocultar referência ou estado inválido | Quatro camadas de validação e testes DP-T01–12 separados |
| AR-27 | Alta | Migração futura era presumida pela escolha de interfaces | Portabilidade alegada sem equivalência | Contract suite, export/import e reconciliação de contagem/digests viraram gate |
| AR-28 | Alta | queued, paused, failed e succeeded divergiam da máquina de estados canônica | Consumidores e recovery poderiam interpretar a mesma tarefa de modos incompatíveis | Estado de domínio, dispatch e causa foram separados; aliases proibidos |
| AR-29 | Alta | Duração da tarefa era usada para justificar API, Redis e worker | Complexidade distribuída sem backlog, detach ou carga observados | Baseline virou processo local anexado; topologia progride por TL-0–4 |
| AR-30 | Crítica | Cancelamento não distinguia fechar admissão, sinalizar, terminar, reconciliar e desfazer | Efeito desconhecido poderia ser apresentado como cancelado limpo | Protocolo em fases; efeito material desconhecido agora termina inconclusivo |
| AR-31 | Crítica | Retry com backoff “por tipo de erro” não dizia quando o efeito já podia ter ocorrido | Repetição de escrita/API não idempotente | Whitelist por classe e ausência de retry para timeout pós-invocação/ambiguidade |
| AR-32 | Alta | Checkpoint após toda etapa era tratado como retomada | Estado parcial ou não determinístico poderia ser repetido como seguro | Classes CP-0–4 e P0 limitado a reconstrução/reconciliação |
| AR-33 | Média | Progresso, heartbeat e estado durável eram um único fluxo de UI | Liveness ou percentual poderia aparentar conclusão | Canais factual e transitório separados; denominador obrigatório para percentual |
| AR-34 | Alta | “kill após timeout” ignorava árvore de processos e diferenças de SO | Filhos órfãos continuariam efeitos silenciosamente | Contrato Job Object/process group, grace, hard kill, reap e survivor report |
| AR-35 | Alta | O estudo aceitava backlog sem política de admissão/backpressure | Trabalho poderia ser aceito sem capacidade de rastreá-lo | Segunda tarefa mutante é rejeitada; fila só após métrica/gate |
| AR-36 | Média | Comparação BullMQ/Celery/SQS/Temporal considerava features, não semântica de redelivery | Broker seria confundido com exactly-once | Evidência primária de at-least-once/lease/replay e contract suite TL-T15 |

## 3. Conformidade após correções

| Critério | Protocolo | Visão | Casos de uso | RF | RNF |
|---|---|---|---|---|---|
| Pergunta/decisão explícita | Atende | Atende | Atende | Atende | Atende |
| Classes de afirmação | Atende | Atende | Atende | Atende | Atende |
| Fonte e escopo | Normativo | Atende com limitações | Atende com evidência indireta | Atende | Atende; jurídico delimitado |
| Evidência contrária | Normativo | Atende | Parcial; ausência de dados próprios explícita | Atende | Atende nos contrapontos |
| Hipótese refutável | Normativo | Atende | Atende nos gates | Critérios atômicos | Metas provisórias separadas |
| Confiança por afirmação | Normativo | Corrigido | Atende | Atende | Atende |
| Validade/revalidação | Normativo | Atende | Atende por data de corte | Atende | Atende por data de corte |
| Reprodutibilidade | Normativo | Parcial: consultas registradas | Parcial: fixture ainda não criada | Especificada, não executada | `MP-P0` ainda precisa ser preenchido |

### Estudos arquiteturais

| Critério | Arquitetura | Local/cloud | Dados/persistência | Tarefas longas |
|---|---|---|---|---|
| Pergunta, escopo e não decisões | Atende | Atende | Atende | Atende |
| Alternativas e critérios de rejeição | Atende | Atende por gates GM | Atende por gates de storage | Atende por TL-0–4 |
| Falha e recuperação explícitas | Atende | Atende por perfil | Atende; journal, artifacts e restore | Atende; cancel/retry/recovery |
| Privacidade/segurança sem claim jurídico | Atende com lacunas | Atende com inventário pendente | Atende com política pendente | Atende; payload futuro sem secret |
| Hipóteses refutáveis e testes | AR-T01–10 | DPL/GM + testes | DP-H01–07 e DP-T01–12 | TL-H01–08 e TL-T01–15 |
| Implementação/resultado empírico | Pendente | Pendente | Pendente | Pendente |

## 4. Pendências que não devem ser preenchidas por inferência

- executar as entrevistas G0 antes de afirmar recorrência ou disposição a pagar;
- versionar manifests e oráculos para UC-01–05;
- arquivar snapshots das fontes externas materiais quando a política do projeto for definida;
- distinguir implementação existente de requisito especificado;
- transformar cláusulas P0 de RF/RNF em manifests e testes executáveis;
- preencher o perfil `MP-P0` antes de aprovar metas de latência ou escala.
- implementar fault injection nos kill points de `EffectIntent`, invocação e `ToolResult`;
- resolver linguagem/runtime, SO suportado e configuração SQLite sem assumir packages copiados;
- executar isolamento real antes de usar o termo sandbox para input hostil.
- escolher DPL-01 ou DPL-02 para o primeiro vertical slice, sem implementar ambos por antecipação;
- inventariar bytes/destinos/retenção antes de piloto com repositório real;
- fechar OD-DP-01–08, inclusive driver, PRAGMAs, RPO/RTO, quotas e retenção;
- executar DP-T01–12 com kill points, disco cheio, dois writers e restore independente;
- definir política contextual de exclusão antes de alegar eliminação além da interface da aplicação;
- fechar OD-TL-01–10, sobretudo runtime, SO, árvore de processos e limites;
- executar TL-T01–14 antes de claim de cancelamento/recovery e TL-T15 antes de qualquer broker;
- medir abandono, backlog e necessidade de detach antes de promover TL-1–4.

## 5. Decisão

Os documentos podem orientar o próximo estudo, mas não sustentam compromisso comercial, promessa de produtividade nem alegação de implementação. Os quatro estudos-base de arquitetura v2 podem orientar o vertical slice, porém sua validação depende de AR-T01–10, DP-T01–12, TL-T01–14, dos gates G1/G2 e de `MP-P0`. O primeiro perfil ainda precisa ser escolhido entre DPL-01/DPL-02; a revisão cronológica prossegue para governança de IA.
