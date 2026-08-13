# Tarefas longas e assíncronas — controle, cancelamento e retomada

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 12 de agosto de 2026  
**Data de corte das fontes:** 12 de agosto de 2026  
**Versão:** 2.0  
**Status:** contrato documental; duração, limites, runtime e comportamento por SO ainda não medidos  
**Método:** [Protocolo de pesquisa rigorosa](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Base:** [Arquitetura de referência v2](arquitetura_de_referencia.md), [dados/persistência v2](dados_e_persistencia.md), [estratégia local/cloud](local_cloud_hibrido.md), [RF](../produto/requisitos_funcionais.md) e [RNF](../produto/requisitos_nao_funcionais.md)

## 1. Resultado da revisão

O estudo original assumia API, fila, worker, sandbox, SSE/WebSocket, webhook e BullMQ + Redis como MVP. Seus estados queued, paused, failed e succeeded divergiam da máquina de estados canônica; “checkpoint após cada etapa” sugeria retomada sem provar que a operação era reiniciável; e “persistir antes de agir” não resolvia o crash entre invocação e resultado.

A revisão separa problemas que não são sinônimos:

- tarefa demorada;
- I/O não bloqueante;
- execução destacada do terminal;
- continuidade após crash;
- retomada de um ponto seguro;
- fila com backlog;
- worker remoto/distribuído.

Decisão:

> **o P0 executa uma tarefa mutante por workspace no mesmo processo local do core. Operações de I/O e child processes não podem bloquear progresso, cancelamento ou persistência, mas não existe API de rede, fila distribuída, daemon ou promessa de continuar após o terminal encerrar.**

Crash recovery, cancelamento e reconciliação pertencem ao P0. Retomada arbitrária, pausa, execução destacada, múltiplos workers e entrega remota são P1/P2 condicionados a necessidade observada. Nenhuma fila transforma efeito externo em “exatamente uma vez”.

## 2. Perguntas, decisões e limites

### Perguntas

1. Como uma operação demorada preserva responsividade, orçamento e evidência no processo local?
2. O que “cancelar” garante antes, durante e depois de um efeito?
3. Que estado constitui checkpoint válido e quando ele autoriza recomputar, retomar ou apenas reconciliar?
4. Como timeout, retry e crash evitam duplicar efeitos e esconder resíduos?
5. Que problema medido justificaria daemon, fila, lease ou worker remoto?

### Decisões que este estudo informa

- contrato do coordenador local e dos adapters demorados;
- semântica de progresso, heartbeat, cancelamento, timeout e deadline;
- classificação de checkpoint/retry/recovery;
- backpressure e concorrência do P0;
- gates e contratos mínimos para topologias futuras;
- testes cross-platform de árvore de processos.

### Fora de escopo P0

Fila compartilhada, agendamento futuro, prioridade entre usuários, execução 24×7, múltiplos writers, worker remoto, webhook, SSE/WebSocket, push notification, workflow engine, multi-repositório transacional e SLO de serviço. Também não há claim de pausa/retomada transparente de processo ou chamada de modelo arbitrária.

## 3. Vocabulário operacional

| Termo | Definição verificável | Não implica |
|---|---|---|
| longa | excede limiar de interação ou recurso declarado no perfil de medição | background, fila ou distribuição |
| não bloqueante | progresso, cancelamento e persistência continuam atendidos durante a operação | paralelismo ou múltiplos processos do core |
| destacada | continua depois que o cliente/terminal se desconecta | durabilidade ou retomada correta |
| durável | fato confirmado reaparece após reinício | operação em voo continuou |
| checkpoint | fronteira persistida de estado confirmado com precondições e referências | snapshot de memória ou retry seguro |
| retomável | existe continuação definida e revalidada a partir do checkpoint | determinismo de todo o workflow |
| idempotente | repetir a mesma intenção não produz efeito material adicional, no escopo declarado | exatamente uma vez |
| lease | concessão temporária de execução renovável | lock eterno ou exclusão de duplicatas |
| fencing token | época monotônica usada pelo recurso para rejeitar owner antigo | suporte automático de todo destino |
| heartbeat | sinal recente de liveness/progresso operacional | sucesso, commit ou ausência de stall |

O documento evita chamar operação de “assíncrona” sem dizer qual dessas propriedades ela possui.

## 4. Baseline P0

### 4.1 Topologia

~~~mermaid
flowchart LR
    U["CLI anexada"] --> C["Coordinator no Application Core"]
    C --> S["Task State"]
    C --> P["Policy + Approval"]
    C --> B["ToolBroker"]
    C --> M["Model Adapter"]
    C --> E["Evidence Recorder"]
    B --> X["Child process gerenciado"]
    B --> F["Filesystem/Git"]
    E --> D["SQLite + artifacts"]
    D --> R["Projeção local de progresso"]
    R --> U
~~~

Regras:

- um owner local mantém o catálogo;
- uma tarefa com escrita por workspace;
- segunda solicitação mutante para o mesmo workspace é rejeitada com backpressure explícito, não aceita em fila invisível;
- chamadas de modelo e processos usam adapters canceláveis quando a plataforma permite;
- trabalho CPU-bound do próprio core é dividido em unidades que devolvem controle; se isso não for possível, precisa de adapter/processo gerenciado e novo teste de contenção;
- o stdout/stderr é drenado continuamente, limitado e redigido para não bloquear o child process nem exaurir memória;
- o consumidor de progresso é local/in-process; desconexão não altera a verdade persistida.

Uma tarefa pode durar minutos no P0. Isso não justifica Redis. Se o requisito real for “continuar quando o terminal fecha”, a primeira alternativa é um supervisor local mínimo; worker remoto é uma decisão diferente.

### 4.2 Admissão

Antes de marcar running, o coordenador confirma:

1. manifesto, root, política, provider, orçamento e deadline válidos;
2. exclusão de outro writer para o workspace;
3. espaço/quota e storage obrigatório disponíveis;
4. ausência ou reconciliação de effects prepared/ambiguous anteriores;
5. perfil de processo/contenção compatível;
6. handler de cancelamento e timeout disponível para toda operação planejada.

Trabalho que não pode ser rastreado é bloqueado antes de executar. Não usar queued como estado de domínio no P0.

## 5. Estado de tarefa e estado de entrega

A máquina canônica continua sendo a da [arquitetura](arquitetura_de_referencia.md): created, preflight, contextualizing, planned, running, waiting_approval, verifying e os finais sucesso_verificado, falha, bloqueado, cancelado e inconclusivo.

Não entram como estados finais alternativos:

- succeeded e failed: aliases proibidos;
- queued: futuro estado de dispatch, não verdade da tarefa;
- paused: capacidade ausente no P0;
- retrying: evento/tentativa, não novo resultado final;
- timed_out: causa registrada; o final depende do que pode ser provado;
- interrupted: observação de recovery, não sucesso/falha por si só.

Um futuro dispatcher mantém dispatch_status separado de task_state. Redelivery de mensagem não pode retroceder tarefa final nem criar segunda execução lógica.

### 5.1 Corridas de estado

Transição final usa compare-and-set/constraint transacional. O primeiro commit final válido vence. Comando tardio de cancelamento, aprovação ou resultado:

- não reabre estado final;
- gera resposta no-op/rejeitada com o estado observado;
- preserva correlação para auditoria;
- nunca reaproveita approval ou tentativa anterior.

## 6. Progresso e heartbeat

Há dois canais semanticamente diferentes:

| Canal | Persistido | Pode ser prova | Exemplos |
|---|---|---|---|
| progresso factual | sim, como evento/projeção | apenas do fato descrito | fase iniciada, artifact publicado, teste concluído, approval requerido |
| liveness/stream | opcional e amostrado | não | spinner, chunk de stdout, pulso do adapter, bytes lidos |

Regras:

- o primeiro progresso representa estado já persistido ou é rotulado transitório;
- “90%” só aparece quando denominador e unidade são estáveis;
- replanning não reduz porcentagem silenciosamente: muda versão/escopo e explica o novo denominador;
- “ainda executando” não significa “sem falha”;
- perda do consumidor não cancela nem conclui a tarefa;
- output truncado registra bytes observados, armazenados e descartados;
- persistência de cada heartbeat é evitada; checkpoint/evento material não pode depender de telemetria efêmera.

Heartbeat mede liveness de uma operação que coopera. Processo travado pode parar de emitir; processo malicioso pode emitir e não progredir. Por isso, deadline, medição de recurso e verificação posterior continuam necessários.

## 7. Checkpoint e retomada

### 7.1 Conteúdo mínimo

Um TaskCheckpoint versionado referencia:

- task, step, event sequence e digest;
- manifesto, configuração, policy e tool/provider versions;
- baseline e hashes relevantes do workspace;
- budget consumido/restante e deadline;
- artifacts confirmados;
- effects prepared, observed ou ambiguous;
- approvals consumidas, pendentes, expiradas ou revogadas;
- cursor de unidade apenas quando o algoritmo define semântica;
- classe de retomada e instante.

Checkpoint só é anunciado depois do commit e da verificação das referências. Frequência é escolhida por custo de recomputação, duração, tamanho e risco; “após cada etapa” não é uma regra universal.

### 7.2 Classes

| Classe | Exemplo | Após crash |
|---|---|---|
| CP-0 evidência | stream parcial, modelo interrompido, processo arbitrário | não retomar; preservar o observado |
| CP-1 recomputável | cálculo puro ou busca read-only com inputs versionados | pode recomputar sob nova tentativa registrada |
| CP-2 segmentável | lote com cursor e commit idempotente por unidade | P1 pode continuar após validar cursor e unidades |
| CP-3 efeito reconciliável | API/filesystem com intent e consulta de resultado | reconciliar; repetir somente com prova |
| CP-4 não reconciliável | efeito não idempotente sem consulta confiável | inconclusivo; decisão humana |

O P0 restaura evidência e reconcilia; não promete continuação automática de CP-1/2. Retomada P1 revalida workspace, config, policy, approval, budget, artifacts e effects antes de qualquer novo passo. Drift incompatível bloqueia e indica exatamente a precondição alterada.

Resposta de LLM não é checkpoint determinístico. Repetir a chamada pode mudar conteúdo e custo; é uma nova tentativa vinculada ao contexto/fingerprint anterior.

## 8. Cancelamento

Cancelamento é protocolo, não rollback:

~~~mermaid
sequenceDiagram
    participant U as Principal/Deadline
    participant C as Coordinator
    participant D as SQLite
    participant A as Adapter
    participant V as Verifier
    U->>C: request cancel(reason)
    C->>D: commit admission closed + revoke pending approvals
    C->>A: cooperative cancel
    alt encerra no grace period
      A-->>C: observed termination/result
    else não coopera
      C->>A: terminate process tree / abort transport
      A-->>C: exit, survivors ou unknown
    end
    C->>V: reconcile effects + residues
    V-->>C: known or inconclusive
    C->>D: commit final state + evidence
~~~

### 8.1 Garantia mínima

Depois do commit de admission closed:

- o ToolBroker não prepara nem invoca nova operação;
- approvals pendentes são revogadas;
- adapters recebem token/sinal de cancelamento;
- após grace period, processos canceláveis sofrem terminação forte conforme o perfil;
- processos sobreviventes, bytes parciais e efeitos incertos são enumerados;
- cleanup/rollback é operação separada e verificável.

Estado final cancelado exige que nenhuma invocação material permaneça com resultado desconhecido. Se não for possível provar o desfecho de um efeito, o final é inconclusivo, com cancellation_requested registrado como causa.

Cancelamento de request de provider pode não impedir processamento/cobrança depois que o destino o aceitou. O sistema registra uso desconhecido/observado e não interpreta abort local como “nada aconteceu”.

### 8.2 Árvore de processos

Matar apenas o PID pai é insuficiente. No Windows, Job Objects agrupam processos, permitem limites e TerminateJobObject encerra os processos associados; flags de breakaway e compatibilidade exigem teste ([S9]). Em sistemas POSIX, processo/grupo precisam ser criados e sinalizados segundo o contrato de process groups ([S10]).

Sequência candidata:

1. spawn sem shell quando possível, com argv/cwd/env tipados;
2. associar ao Job Object ou novo process group/session antes de liberar trabalho;
3. enviar sinal cooperativo;
4. aguardar grace period monotonicamente;
5. terminar o grupo/job;
6. reap e capturar exit/signal;
7. verificar descendentes e recursos conhecidos;
8. registrar sobreviventes e impossibilidade de inspeção.

Wrappers, processos que escapam do grupo/job e limitações de permissão devem aparecer nas fixtures por SO. Terminação forte não executa cleanup confiável e não desfaz efeitos já realizados.

## 9. Timeout, deadline e orçamento

Cada operação declara:

- connect/start timeout quando aplicável;
- idle/heartbeat timeout;
- execution/start-to-close timeout;
- grace period de cancelamento;
- hard termination timeout;
- deadline absoluto da tarefa;
- política para tempo em waiting_approval;
- limites de tentativas, custo, output, disco, processo e chamadas.

Tempo decorrido usa relógio monotônico; timestamps de auditoria usam UTC. Ajuste do relógio do sistema não deve estender orçamento silenciosamente.

Timeout é observação local, não resultado do efeito. Classificação:

| Ponto | Resultado padrão |
|---|---|
| antes de invocação confirmada | falha transitória ou bloqueado, conforme causa |
| leitura/cálculo puro | falha; retry pode ser permitido |
| processo local terminado e efeito verificável | sucesso/falha conforme verificação, nunca só pelo exit |
| depois de enviar efeito externo | reconciliar; sem prova, inconclusivo |
| cancelamento não confirmou término | inconclusivo e survivor/resíduo |

Deadline alcançado fecha admissão como cancelamento por limite. Limite duro de custo impede nova chamada cobrável, mas não falsifica o custo de chamada em voo.

## 10. Retry

Toda tentativa tem attempt_id, parent intent, fingerprint, causa, timestamps, budget debit, decisão e resultado. Backoff não mantém lock de workspace externo nem approval além da validade.

| Classe de falha | Retry automático P0 | Condição |
|---|---|---|
| schema, policy, permission, path ou capability inválida | não | corrigir input/config |
| erro transitório provado antes da invocação | limitado | deadline/budget e mesma precondição |
| rate limit de provider | limitado | respeitar Retry-After quando válido; sem fallback silencioso |
| cálculo puro/read-only idempotente | limitado | inputs e versão iguais |
| teste/processo read-only terminado antes de resultado | por política | novo attempt; output anterior preservado |
| escrita com resultado confirmado como não aplicado | por política | revalidar baseline, policy e approval |
| idempotency key aceita pelo destino | limitado | ainda reconciliar resposta e uso |
| timeout pós-invocação ou efeito ambiguous | não | reconciliar ou decisão humana |
| cancelamento, deadline ou limite duro | não | nova execução explícita |
| erro determinístico repetido | não | evitar loop/consumo |

Backoff exponencial com jitter é candidato apenas para falha transitória. Seus valores dependem da API/Retry-After e precisam de teto; não são copiados de um framework.

## 11. Recovery após crash

Na inicialização:

1. adquirir owner lock do catálogo;
2. validar banco, schema e artifacts necessários;
3. localizar tarefas não finais;
4. registrar recovery_started sem fingir retomada;
5. comparar checkpoint com manifesto, config, policy, budget e workspace;
6. reconciliar todo effect prepared/ambiguous;
7. detectar child processes/resíduos por identidade forte quando suportado, sem matar PID possivelmente reutilizado;
8. reconstruir projeção de eventos;
9. finalizar falha/bloqueado/inconclusivo ou oferecer ação P1 permitida;
10. publicar relatório de recovery.

O P0 não inicia nova tool/model call automaticamente depois de crash. Espera por approval não sobrevive como autorização: approval expirada/revogada é negada, e uma aprovação ainda válida só poderá ser consumida conforme política de retomada futura.

Se o core cai, Job Object com kill-on-close pode ajudar no Windows; em outros perfis, processos órfãos continuam risco. O comportamento suportado só será declarado depois de kill tests no SO/filesystem/runtime escolhidos.

## 12. Backpressure, concorrência e fairness

O P0 não precisa de prioridade porque não mantém backlog:

- uma tarefa mutante ativa por workspace;
- limite global inicial declarado pelo perfil, possivelmente uma única tarefa;
- nova solicitação acima do limite retorna busy/bloqueado com retry manual;
- operações read-only paralelas ficam desabilitadas até provar isolamento de estado, orçamento e output;
- waiting_approval não libera o workspace automaticamente, pois o baseline pode ficar stale;
- nenhum buffer de eventos/output cresce sem limite.

Antes de introduzir fila, medir:

- taxa de chegada e rejeição;
- duração e distribuição por fase;
- tempo em approval;
- abandono porque o terminal precisa permanecer aberto;
- contenção por workspace;
- CPU, memória, disco, egress e custo;
- necessidade de fairness/prioridade e owner.

## 13. Escada de topologia

| Degrau | Solução | Gate |
|---|---|---|
| TL-0 | processo local anexado, sem backlog | P0 |
| TL-1 | supervisor/daemon local + catálogo existente | usuários precisam desconectar e continuar no mesmo host |
| TL-2 | dispatcher local durável com fila pequena | backlog/prioridade local são problema medido |
| TL-3 | broker + workers | múltiplos hosts/serviços, throughput ou isolamento exigem |
| TL-4 | workflow engine durável | workflow de dias, timers, sinais e recovery complexo justificam operação |

Pular TL-1/2 para cloud porque “tarefas são longas” confunde duração com distribuição. Cada degrau precisa preservar os invariantes de policy, approval, effect journal, evidência e estados finais.

### 13.1 Alternativas futuras

| Alternativa | Capacidade relevante | Semântica/risco que o experimento deve cobrir | Situação |
|---|---|---|---|
| SQLite + supervisor próprio | reusa catálogo local; menor trust boundary | owner lock, wakeup, crash, upgrade e terminal detach | primeiro candidato TL-1 |
| BullMQ + Redis | jobs, retries, locks, eventos no ecossistema Node | job stalled volta a waiting e pode ser processado novamente ([S5]) | inventário TL-3 |
| Celery + broker/backend | amplo ecossistema Python | late ack pode causar múltiplas execuções; ack/retry variam por falha ([S6]) | inventário TL-3 |
| Amazon SQS | fila gerenciada e visibility timeout | entrega at-least-once; timeout expirado permite redelivery; limite de visibilidade ([S7]) | somente perfil cloud |
| Temporal | event history, replay, timers, signals e workflow durável | workflow determinístico; activities externas recomendam idempotência e heartbeat/cancelamento ([S8a], [S8b]) | TL-4, não default |

Escolha depende primeiro do runtime, topologia, operação e requisito. Comparação por checklist de features não promove ferramenta.

## 14. Contrato distribuído futuro

Se TL-3/4 for atingido, o desenho precisa especificar antes da tecnologia:

- job envelope com IDs e refs redigidos, nunca secret value;
- outbox/dispatch idempotente entre catálogo e broker;
- delivery_id separado de task_id e attempt_id;
- lease com owner, época/fencing token, início, expiração e heartbeat;
- validação do fencing token imediatamente antes de cada efeito;
- redelivery presumida e teste de duplicata concorrente;
- ack somente depois de resultado durável e evento;
- retry/DLQ/quarentena por classe, sem loop infinito;
- cancel command versionado e confirmação do worker;
- perda do control plane fecha novos efeitos ao expirar lease/grant;
- relógio, skew e fonte de tempo definidos;
- upgrade de worker compatível com job/schema;
- observabilidade não substitui fila, catálogo ou event history;
- cópia de workspace, artifact e secret dentro do perfil DPL aprovado.

Lease vencido não prova que o worker antigo parou. Sem fencing aceito pelo recurso ou outra exclusão forte, dois workers podem executar. Para filesystem Git local, isso normalmente exige posse exclusiva do workspace, não apenas lock no broker.

## 15. Hipóteses e condições de refutação

| ID | Hipótese | Teste | Refutada se |
|---|---|---|---|
| TL-H01 | processo anexado suporta durações P0 sem perder responsividade | stress MP-P0 com model/process/output | progresso, cancelamento ou checkpoint excede limiar aprovado |
| TL-H02 | admission closed impede nova invocação após cancelamento | corrida em cada fronteira/attempt | qualquer handler começa depois do commit de fechamento |
| TL-H03 | terminação gerenciada não deixa descendente silencioso | fixtures por SO com filhos/wrappers | survivor não é encerrado nem reportado |
| TL-H04 | checkpoint permite recovery honesto sem sucesso falso | kill em cada fronteira | estado confirmado some ou operação ambígua vira sucesso/retry |
| TL-H05 | matriz de retry evita duplicação material | destino contador + resposta perdida | mais de um efeito ocorre por intenção sem autorização |
| TL-H06 | progresso não exagera conclusão | replan, truncamento, consumer loss e stall | UI mostra percentual/status não derivável dos fatos |
| TL-H07 | não há necessidade de fila no P0 | piloto UC-01–05 | abandono/rejeição/backlog por execução anexada excede limiar decidido |
| TL-H08 | topology gate seleciona o menor degrau suficiente | benchmark TL-0–candidato | candidato complexo não melhora o problema causal |

O relatório registra SO, runtime, hardware, duração, concorrência, volume de output, kill point, signal/API usada, grace period, child tree, fixture e hashes.

## 16. Testes de aceitação

| ID | Teste | Aceite |
|---|---|---|
| TL-T01 | tabela completa de transições e aliases | somente estados canônicos; final não reabre |
| TL-T02 | child process longo com stdout/stderr intenso | sem deadlock/OOM; progresso/cancelamento/checkpoint responsivos |
| TL-T03 | cancel em cada instante entre policy, intent, invoke e result | zero nova invocação pós-fechamento; resultado correto/reconciliado |
| TL-T04 | processo pai, filhos, netos, shell e breakaway por SO | todos encerrados ou survivor explicitamente reportado |
| TL-T05 | timeout antes/depois do efeito e resposta perdida | classificação segue matriz; nenhuma repetição cega |
| TL-T06 | crash antes/depois de cada checkpoint | apenas checkpoint confirmado reaparece; refs válidas |
| TL-T07 | checkpoint truncado, bit flip e versão incompatível | retomada bloqueada antes de efeito |
| TL-T08 | drift de workspace/config/policy/approval/budget | campo divergente bloqueia continuação |
| TL-T09 | cada classe de retry, backoff e teto | attempts/custo/eventos corretos; determinístico não repete |
| TL-T10 | progresso factual vs heartbeat | consumidor reconstrói fatos; perda de pulse não muda estado |
| TL-T11 | deadline/custo/output/disco atingidos | admissão fecha; cleanup e causa ficam registrados |
| TL-T12 | approval expira/rejeita durante espera | handler não inicia e workspace é revalidado |
| TL-T13 | duas tarefas mutantes no mesmo workspace | apenas uma admitida; segunda não fica em fila oculta |
| TL-T14 | queda do core e processos órfãos | perfil detecta/encerra/report; nenhum PID é morto só por reutilização |
| TL-T15 | futuro broker redelivery + lease vencido | duplicata/fence/ack/DLQ seguem contract suite antes da promoção |

## 17. Decisões

| ID | Decisão | Estado | Motivo/revisão |
|---|---|---|---|
| TL-D01 | sem broker/Redis/worker no P0 | aceita | duração não demonstra distribuição |
| TL-D02 | core local anexado, internamente responsivo | aceita para protótipo | menor baseline de RNF-006.2 |
| TL-D03 | uma tarefa mutante por workspace; excedente rejeitado | aceita | backpressure explícito e writer único |
| TL-D04 | estados canônicos não incluem queued/paused/retrying/timed_out | aceita | separar domínio, dispatch e causa |
| TL-D05 | cancelamento fecha admissão antes de sinalizar adapters | aceita | previne novos efeitos na corrida |
| TL-D06 | efeito material desconhecido termina inconclusivo | aceita | cancelamento não apaga ambiguidade |
| TL-D07 | checkpoint é estado confirmado classificado, não snapshot mágico | aceita | retomada depende da natureza da operação |
| TL-D08 | P0 reconcilia após crash, mas não auto-retoma trabalho | aceita | RF-004.4 deixa retomada para P1 |
| TL-D09 | retry é whitelist por classe | aceita | default seguro para efeitos |
| TL-D10 | progresso factual e heartbeat são canais distintos | aceita | evita UI enganosa |
| TL-D11 | Job Object/process group formam contrato por SO | pendente de PoC | API e escapes diferem |
| TL-D12 | supervisor local precede fila remota no gate | aceita | resolve detach sem ampliar trust boundary |
| TL-D13 | BullMQ, Celery, SQS e Temporal permanecem inventário | aceita | runtime/requisito/carga ainda abertos |

## 18. Questões abertas

| ID | Questão | Método para fechar | Bloqueia |
|---|---|---|---|
| OD-TL-01 | qual runtime/event loop e API de subprocesso? | ADR + TL-T02–04 | implementação |
| OD-TL-02 | quais SOs são suportados e como conter árvore? | matriz Windows/POSIX real | claim de cancelamento |
| OD-TL-03 | limites de responsividade, grace e timeout? | MP-P0 + teste de usabilidade | release P0 |
| OD-TL-04 | quais tarefas/durações/outputs reais? | pilotos UC-01–05 | TL-H01/07 |
| OD-TL-05 | terminal detach é necessidade de usuário? | entrevistas/telemetria de abandono | TL-1 |
| OD-TL-06 | checkpoint CP-1/2 vale o custo? | medir recomputação vs persistência | retomada P1 |
| OD-TL-07 | waiting_approval conta no deadline e mantém exclusividade? | política + teste de drift | UX/recurso |
| OD-TL-08 | como identificar órfão sem risco de PID reuse? | PoC por SO/runtime | recovery |
| OD-TL-09 | qual gate quantitativo promove TL-2/3/4? | carga/piloto + custo operacional | tecnologia futura |
| OD-TL-10 | tarefas multi-repo são necessárias? | casos reais + protocolo de compensação | P1/P2 |

## 19. Registro de evidências

| ID | Classe | Afirmação delimitada | Fonte | Confiança | Validade/revisão |
|---|---|---|---|---|---|
| TL-C01 | fato documental | BullMQ renova lock; job stalled pode voltar a waiting e ser processado por outro worker | [S5] | alta | volátil; revisar por versão |
| TL-C02 | fato documental | Celery late ack pode redeliver/executar múltiplas vezes; idempotência é responsabilidade da task | [S6] | alta | volátil; revisar por versão/broker |
| TL-C03 | fato documental | SQS usa at-least-once e visibility timeout não impede toda entrega duplicada | [S7] | alta | volátil; revisar AWS |
| TL-C04 | fato documental | Temporal reconstitui workflow por event history/replay determinístico | [S8a] | alta | volátil; revisar produto |
| TL-C05 | fato documental | Temporal activities externas recomendam idempotência; heartbeat participa de checkpoint/cancelamento | [S8b] | alta | volátil; revisar SDK |
| TL-C06 | fato documental | Windows Job Objects gerenciam grupos de processos, limites e terminação; breakaway altera cobertura | [S9] | alta | revisar matriz Windows |
| TL-C07 | fato documental | POSIX kill pode sinalizar processo ou process group | [S10] | alta | semântica estável; testar runtime |
| TL-C08 | inferência | fila não elimina ambiguidade entre execução e efeito externo | [S2], [S5]–[S8b] | alta | revisar se destino oferecer transação/fence real |
| TL-C09 | decisão | processo anexado é o baseline de menor custo para P0 | [S1]–[S4], TL-H01–08 | média | expira após piloto |
| TL-C10 | desconhecido | duração, responsividade, cancelamento cross-platform e necessidade de detach | OD-TL-01–09 | baixa | fechar antes de claim |

## 20. Fontes

- <a id="s1"></a>**[S1]** ACI Arena. [Arquitetura de referência v2](arquitetura_de_referencia.md). Revisão de 12 ago. 2026.
- <a id="s2"></a>**[S2]** ACI Arena. [Dados e persistência v2](dados_e_persistencia.md). Revisão de 12 ago. 2026.
- <a id="s3"></a>**[S3]** ACI Arena. [Requisitos funcionais](../produto/requisitos_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s4"></a>**[S4]** ACI Arena. [Requisitos não funcionais](../produto/requisitos_nao_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s5"></a>**[S5]** BullMQ. [Stalled Jobs](https://docs.bullmq.io/guide/workers/stalled-jobs). Consulta em 12 ago. 2026.
- <a id="s6"></a>**[S6]** Celery. [Tasks — acknowledgements, idempotence and retry](https://docs.celeryq.dev/en/stable/userguide/tasks.html). Consulta em 12 ago. 2026.
- <a id="s7"></a>**[S7]** Amazon Web Services. [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html). Consulta em 12 ago. 2026.
- <a id="s8a"></a>**[S8a]** Temporal. [Temporal Workflow — replay and event history](https://docs.temporal.io/workflows). Consulta em 12 ago. 2026.
- <a id="s8b"></a>**[S8b]** Temporal. [What is a Temporal Activity?](https://docs.temporal.io/activities) e [Activity Execution](https://docs.temporal.io/activity-execution). Consulta em 12 ago. 2026.
- <a id="s9"></a>**[S9]** Microsoft. [Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects). Atualizado em 14 jul. 2025; consulta em 12 ago. 2026.
- <a id="s10"></a>**[S10]** The Open Group. [kill — send a signal to a process or a group of processes](https://pubs.opengroup.org/onlinepubs/009604499/functions/kill.html). Consulta em 12 ago. 2026.

## 21. Critério de encerramento

Esta revisão documental está encerrada porque conceitos, baseline, estados, cancelamento, checkpoint, retry, recovery, alternativas, contraprova e testes estão explícitos. A capacidade não está validada até:

- TL-T01–14 passarem no runtime e nos SOs suportados;
- MP-P0 fixar limites e cargas;
- OD-TL-01–08 serem decididas;
- pilotos medirem duração, abandono e necessidade de detach;
- qualquer promoção TL-1–4 passar seu gate e, para broker, TL-T15.

Até lá, o documento autoriza construir o coordenador local e seu fault harness. Não autoriza alegar execução destacada, retomada transparente, cancelamento sem resíduos, exactly-once, durabilidade distribuída ou suporte a tarefas de duração ilimitada.
