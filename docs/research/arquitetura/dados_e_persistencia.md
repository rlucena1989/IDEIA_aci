# Dados e persistência — catálogo, evidência e recuperação do P0

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 12 de agosto de 2026  
**Data de corte das fontes:** 12 de agosto de 2026  
**Versão:** 2.0  
**Status:** desenho documental; schema, política de retenção e ensaios de falha ainda não implementados  
**Método:** [Protocolo de pesquisa rigorosa](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Base:** [Arquitetura de referência v2](arquitetura_de_referencia.md), [estratégia local/cloud](local_cloud_hibrido.md), [RF](../produto/requisitos_funcionais.md) e [RNF](../produto/requisitos_nao_funcionais.md)

## 1. Resultado da revisão

O estudo original antecipava users, organizations, tenants, subtasks, embeddings, memória global, plugins, MCP, avaliações e múltiplos bancos. A recomendação “PostgreSQL + pgvector e Redis” contradizia o P0 local e não estava ligada a volume, concorrência, disponibilidade ou consulta observados. Também faltavam fronteiras transacionais, recuperação entre banco e filesystem, prova de integridade, restauração e uma definição honesta de exclusão.

A decisão revisada é:

> **usar um arquivo SQLite como catálogo transacional de escritor único e um diretório local de artefatos endereçados por hash, ambos fora do repositório por padrão. Eventos canônicos explicam o ciclo de vida da tarefa; projeções aceleram leitura; efeitos externos usam o protocolo intent → invoke → result/reconcile.**

O P0 não inclui PostgreSQL, Redis, DuckDB, vector database, embeddings, event bus, object storage remoto ou réplica. “Append-only” é uma restrição da API da aplicação, não imutabilidade contra o operador do host. “Hash” detecta corrupção e alteração parcial, não prova autoria nem impede reescrita completa por quem controla o host.

## 2. Perguntas, decisões e limites

### Perguntas

1. Qual é o menor conjunto de fatos duráveis necessário para reconstruir tarefa, aprovação, efeito e verificação?
2. Onde termina uma transação do catálogo e como o sistema reage quando filesystem, processo ou provider falha entre registros?
3. Quais bytes precisam ser armazenados, por qual finalidade, durante quanto tempo e com que caminho de exclusão?
4. Como demonstrar que backup, restauração, migração e limpeza preservam ou removem exatamente o escopo declarado?
5. Que evidência mensurável justificaria migrar do storage local?

### Decisões que este estudo informa

- modelo lógico e autoridade de cada registro;
- limites de transação e reconciliação após crash;
- layout e protocolo de publicação de artefatos;
- integridade de eventos e referências;
- migração de schema, backup, restauração, retenção e exclusão;
- testes obrigatórios e gates para tecnologias posteriores.

### Premissas P0

- um processo local possui o catálogo;
- no máximo uma tarefa mutante por workspace;
- o principal é derivado do ambiente hospedeiro;
- uma instalação não compartilha escrita do banco por rede;
- o workspace não é o banco e não recebe metadados internos por padrão;
- conteúdo de modelo, tool, stdout, stderr e repositório é não confiável e pode conter secrets;
- nenhum requisito atual exige consulta vetorial ou análise OLAP.

### Fora de escopo

Multi-tenant, colaboração simultânea, replicação, alta disponibilidade, sincronização entre dispositivos, data warehouse, armazenamento remoto, busca vetorial, memória cross-task e retenção regulatória certificada. Esses problemas exigem estudos próprios quando um gate observável for atingido.

## 3. Autoridade dos dados

O P0 usa um modelo híbrido deliberado, não “event sourcing de tudo”:

| Classe | Fonte autoritativa | Regra |
|---|---|---|
| ciclo de vida da tarefa | task_events | sequência canônica permite reconstruir estados e decisões |
| estado atual consultável | task_runs | projeção transacional; deve ser reconstruível a partir dos eventos aplicáveis |
| intenção e resultado de efeitos | effect_journal | nunca inferir resultado externo apenas do estado da tarefa |
| aprovação | approvals | concessão vinculada e consumo registrados atomicamente |
| verificação | verifications | resultado e evidência independem da afirmação do modelo |
| bytes volumosos | artifact store | catálogo guarda digest, tamanho, classe, mídia e referências |
| identidade/configuração efetiva | snapshots referenciados | conteúdo canônico ou artefato imutável por digest |
| telemetria operacional | projeção descartável | nunca é a única prova de efeito, aprovação ou sucesso |

Eventos não substituem as tabelas que exigem unicidade, consumo único, orçamento ou consulta atual. Projeções não podem criar fatos ausentes da trilha canônica. Logs de observabilidade podem ser derivados e descartados; eventos obrigatórios não.

## 4. Modelo mínimo do P0

### 4.1 Entidades

| Tabela lógica | Conteúdo mínimo | Restrições essenciais |
|---|---|---|
| projects | ID, root canônico, fingerprint de policy, estado, timestamps | root normalizado único; arquivar não apaga workspace |
| task_runs | ID, project, principal, estado atual, manifesto/config snapshot, orçamento, timestamps | estado em enum; transição somente pelo serviço de domínio |
| task_events | ID, task, sequência, tipo, tempo, payload canônico, digest anterior e atual | único por task+sequência; sem update/delete pela API comum |
| effect_journal | ID, task/passo, fingerprint da request, classe, status, approval, request/result refs | fingerprint único por tentativa lógica; estados explícitos |
| approvals | ID, principal, action fingerprint, alvo, limites, policy version, nonce, expiração, consumo | nonce único; consumo no máximo uma vez |
| verifications | ID, task, critério, verificador/versão, status, evidence refs, tempo | status pass/fail/blocked/inconclusive |
| artifacts | algoritmo, digest, tamanho, mídia, classe, estado, timestamps | digest+algoritmo únicos; tamanho conferido |
| artifact_refs | artifact, owner type/id, purpose | FK válida; propósito enumerado |
| usage_events | task/call, provider/model, unidade, medido/estimado/desconhecido, valor, moeda/tabela | estimativa nunca marcada como medição |
| schema_migrations | versão, checksum, aplicação, versão do app | versão/checksum únicos |

Manifesto, plano, configuração, request/result de tool e relatório podem começar como payloads versionados ou artefatos referenciados. Só ganham tabela própria quando uma consulta, constraint ou ciclo de vida demonstrar necessidade. Users, organizations e tenant_id não existem no P0; principal_id ainda é obrigatório nos fatos de autorização e efeito.

### 4.2 Relações e índices

Índices iniciais devem responder apenas às consultas do vertical slice:

- project por root canônico;
- task por project, estado e atualização;
- evento por task e sequência;
- efeito por task, status e fingerprint;
- approval por action fingerprint, expiração e consumo;
- artifact por digest e referência por owner;
- verification e usage por task.

Índice sem consulta medida não entra “por precaução”. Chaves estrangeiras devem ser ativadas e testadas em toda conexão; a aplicação falha ao iniciar se a configuração efetiva divergir.

### 4.3 Estados do journal de efeitos

| Estado | Significado | Retomada |
|---|---|---|
| prepared | intenção e precondições persistidas; ainda não há resultado confirmado | reconciliar antes de retry, pois o crash pode ter ocorrido antes ou depois da invocação |
| observed_success | resposta e prova mínima confirmam aplicação | não repetir |
| observed_failure | tool confirmou que o efeito não ocorreu ou falhou de forma classificada | retry somente se política, limite e idempotência permitirem |
| ambiguous | não é possível provar se ocorreu | tarefa inconclusiva; intervenção/reconciliação |
| compensated | efeito confirmado foi compensado e a compensação verificada | preservar ambos os fatos |

Não existe exatamente uma vez entre SQLite e um sistema externo. Idempotency key reduz duplicação quando o destino honra o contrato, mas não cria atomicidade distribuída.

## 5. Eventos canônicos e integridade

Cada envelope de evento inclui, quando aplicável: domain separator, versão do schema, event_id, task_id, sequência, timestamp, principal_id, project_id, step_id, type, correlation_id, payload redigido, payload digest, previous_event_digest e event_digest.

O cálculo deve:

1. validar o payload no schema versionado;
2. redigir antes da persistência;
3. serializar o envelope pelo JSON Canonicalization Scheme do RFC 8785 ([S12]);
4. calcular digest criptográfico com algoritmo e versão registrados;
5. encadear o digest anterior da mesma tarefa;
6. inserir evento e atualizar a projeção na mesma transação.

O verificador independente confere schema, sequência contígua, cadeia de digests, referências, estado derivado e hashes de artefato. Ele deve distinguir:

- integridade física do banco;
- integridade referencial;
- integridade criptográfica dos bytes;
- consistência semântica da máquina de estados.

Uma cadeia local detecta corrupção e edição parcial. Um operador com controle de banco e aplicação pode reescrever toda a cadeia; não alegar não repúdio. Âncora externa assinada é alternativa P1 somente se uma ameaça ou comprador exigir.

Correção não altera um evento anterior: emite evento relacionado que explica a correção. Purga autorizada pode remover conteúdo segundo a política; nesse caso, a trilha residual registra escopo e digests sem republicar o dado excluído.

## 6. Layout e protocolo de artefatos

### 6.1 Layout

~~~text
data-root/
  metadata.sqlite3
  artifacts/
    algoritmo/
      prefixo/
        digest
  staging/
  exports/
  locks/
~~~

O data-root é canônico, com permissões restritas, fora do workspace e no mesmo volume para staging e destino final. O catálogo guarda paths relativos internos, nunca um path fornecido sem normalização. Exportações são uma operação separada e redigida.

### 6.2 Publicação

1. criar arquivo de staging único dentro do data-root;
2. escrever, fechar/flush conforme contrato suportado, calcular digest e conferir tamanho;
3. mover para o path endereçado pelo conteúdo no mesmo volume, sem sobrescrever bytes divergentes;
4. em transação, inserir metadata/ref/evento ou reutilizar o mesmo digest existente;
5. somente então tornar a referência visível ao leitor.

Crash antes do passo 4 pode deixar órfão, nunca referência válida para arquivo ausente. A varredura de recuperação compara staging, paths finais e catálogo; órfão é posto em quarentena ou removido somente após regra de idade e retenção. Leitura confere existência, tamanho e digest antes de usar evidência material.

Atomicidade de rename, flush e durabilidade varia por sistema de arquivos/SO e precisa de fault injection nos ambientes suportados. A estratégia é recuperável, não uma promessa abstrata de atomicidade entre arquivo e banco.

Workspace, Git e outputs externos não pertencem ao artifact store. Seus efeitos seguem o journal e as precondições da [arquitetura](arquitetura_de_referencia.md).

## 7. Fronteiras transacionais

| Operação | Uma transação SQLite deve conter | Efeito fora da transação |
|---|---|---|
| criar tarefa | task_run, snapshots já publicados, primeiro evento e orçamento | nenhum |
| decidir policy | fingerprint da request, decisão, evento e eventual vínculo de approval | nenhum |
| consumir approval e preparar efeito | consumo único, effect intent prepared e evento | invocação ocorre depois do commit |
| observar tool | status/result ref, uso e evento | bytes já publicados; processo/destino já respondeu |
| registrar verificação | verification, evidence refs e evento | comando de verificação terminou antes |
| finalizar tarefa | transição final e evento, após todos os guards | relatório pode ser projetado/exportado depois |

Sequência de um efeito:

~~~mermaid
sequenceDiagram
    participant A as Application Core
    participant D as SQLite
    participant T as Tool/External System
    A->>D: commit prepared + approval consumed
    A->>T: invoke(request, fingerprint/idempotency key)
    alt resposta confirmada
      T-->>A: result + evidence
      A->>D: commit observed result + event
    else timeout/crash/resposta perdida
      A->>D: mark ambiguous quando possível
      A->>T: reconcile sem repetir efeito
      A->>D: commit reconciled result ou inconclusive
    end
~~~

Ao reiniciar, todo prepared sem resultado é suspeito. A aplicação não pode assumir “não invocado” nem repetir automaticamente. Primeiro consulta estado verificável do destino; sem prova, termina inconclusivo.

Falha ao persistir um evento obrigatório bloqueia o próximo efeito. Falha de telemetria opcional não pode alterar uma decisão autoritativa.

## 8. Configuração SQLite e concorrência

SQLite oferece transações ACID inclusive após falhas, dentro das premissas documentadas ([S5]), e serializa escritas concorrentes: há apenas um escritor por arquivo por vez ([S6]). Isso se ajusta ao P0 de processo único, mas não prova que qualquer combinação de filesystem, PRAGMA e host terá a durabilidade desejada.

Configuração candidata deve ser decidida por ADR e ensaio, registrando pelo menos:

- journal_mode efetivo;
- synchronous efetivo;
- foreign_keys habilitado;
- busy timeout limitado;
- temp store e data-root;
- versão do SQLite e do driver.

journal_mode=OFF é proibido porque desativa rollback/commit atômico e pode corromper o banco; níveis de synchronous têm compromissos diferentes, inclusive em WAL ([S11]). O baseline deve testar perda abrupta do processo e, quando viável, falha de energia/volume. Um timeout de lock não pode ser convertido em perda silenciosa: aplica backpressure, registra falha e preserva o estado anterior.

Não abrir o mesmo arquivo para escrita por compartilhamento de rede nem permitir duas instâncias proprietárias sem lock verificável. Leituras longas devem ser medidas; WAL não é adotado apenas por popularidade.

## 9. Ciclo de vida, minimização e secrets

### 9.1 Classes

| Classe | Exemplos | Persistência P0 | Regra mínima |
|---|---|---|---|
| D0 — identificadores | IDs, versões, digests, timestamps | catálogo | retenção ligada à tarefa |
| D1 — decisão/evidência | manifesto, plano, policy, approval, evento, verificação | catálogo/artefato redigido | owner, purpose, retenção e export definidos |
| D2 — conteúdo de IA | contexto enviado, request/response, stream parcial | somente mínimo necessário e redigido | retenção curta/configurável; registrar destino |
| D3 — saída de tool | stdout/stderr, diff, patch, resultado | artefato redigido, truncado e limitado | tamanho/TTL; preservar prova sem guardar excesso |
| D4 — uso/custo | tokens reportados, duração, estimativa rotulada | catálogo | nunca inventar medição ausente |
| D5 — secret | token, chave, senha, credential material | nunca | persistir apenas handle/identificador seguro |
| D6 — derivado descartável | índice, cache, embedding | ausente no P0 | se futuro, reconstruível e com proveniência |

Cada classe precisa de responsável, finalidade, localização, base de retenção, prazo, método de exclusão e presença em backup antes do piloto com repositório real. “Guardar tudo para auditoria” viola minimização e aumenta o impacto de incidente.

Redação ocorre antes do banco, artefato, erro, relatório ou exportação. Como stdout e resposta do modelo podem carregar um secret inesperado, o pipeline usa canários e limite de memória/spool. Se a redação obrigatória falhar, não persiste o conteúdo e bloqueia o fluxo material conforme QG-02.

### 9.2 Proteção em repouso

SQLite padrão não implica criptografia. Permissão do arquivo e criptografia de volume do sistema operacional podem reduzir exposição, mas devem ser declaradas como dependências do host, não como propriedade comprovada da aplicação.

Se criptografia do banco for requisito, a solução e sua licença precisam ser escolhidas, testadas e operadas com chave separada dos dados, rotação e restore. Guardar a chave ao lado do banco não atende ao objetivo.

## 10. Retenção e exclusão verificável

Exclusão tem escopo explícito: conteúdo ativo, projeções, artefatos, staging, exports e backups. Fluxo:

1. bloquear novas referências e registrar pedido/escopo autorizado;
2. tombstone lógico quando necessário para consistência;
3. remover conteúdo e referências ativas na ordem segura;
4. coletar artefato sem referências após a janela definida;
5. verificar por IDs, digests e secret-canaries que o conteúdo não é mais recuperável pela aplicação;
6. propagar a backups conforme sua política ou registrar a data máxima residual;
7. emitir recibo redigido com escopo, exceções, verificações e prazo residual.

SQLite normalmente não apaga imediatamente o conteúdo das páginas liberadas; VACUUM pode reconstruir o arquivo e purgar conteúdo removido ([S8]). secure_delete pode sobrescrever conteúdo em tabelas comuns, mas não garante remover todo vestígio de tabelas virtuais, backups, filesystem ou SSD ([S10]). Portanto:

- “excluído da aplicação” não equivale a apagamento forense;
- VACUUM/secure_delete são controles possíveis, não prova universal;
- backup e export têm retenção e deleção próprias;
- o recibo deve declarar resíduos conhecidos e prazo, sem alegação jurídica automática.

## 11. Backup e restauração

Backup não entra automaticamente no P0: primeiro se define RPO/RTO e se a perda local precisa ser coberta. Quando habilitado:

- não copiar ingenuamente o arquivo vivo;
- usar SQLite Online Backup API ou mecanismo equivalente de snapshot consistente; VACUUM INTO é alternativa com cuidados próprios ([S7], [S8]);
- incluir manifesto de artefatos, versões, digests, configuração não secreta e versão do app/schema;
- proteger backup no mínimo como o original;
- não incluir valores de secret;
- limpar saída incompleta de backup interrompido;
- testar restauração em data-root temporário, nunca sobre a instalação ativa.

Validação de restore:

1. abrir com a versão suportada;
2. executar integrity_check e foreign_key_check;
3. validar schema/migrations;
4. verificar sequência e digests de eventos;
5. verificar presença, tamanho e digest de todos os artefatos referenciados;
6. reconstruir projeções e comparar invariantes;
7. abrir uma tarefa em modo somente leitura;
8. medir RPO/RTO real.

integrity_check encontra problemas físicos e de consistência do arquivo, mas não valida foreign keys nem a semântica do domínio; foreign_key_check e o verificador da aplicação continuam obrigatórios ([S9]).

## 12. Migrações

Migração é código de produto e deve ter versão, checksum, compatibilidade mínima e teste:

- banco novo converge para o schema atual;
- cada versão suportada atualiza pelo caminho previsto;
- versão futura desconhecida falha fechada, sem escrita;
- migração transacional é preferida quando a operação permite;
- antes de migração destrutiva, criar e testar cópia restaurável;
- validação pós-migração cobre integridade, FKs, cadeia, projeções e artifacts;
- rollback é restauração da cópia anterior quando down migration segura não existe.

A aplicação mantém schema_migrations próprio; não usa PRAGMA schema_version como histórico de negócio. Migração interrompida deve ser reiniciável ou detectada de modo inequívoco.

## 13. Gates para tecnologias futuras

| Alternativa | Só avaliar se | Contraprova/rejeição |
|---|---|---|
| PostgreSQL | mais de um serviço/escritor ou acesso remoto compartilhado for requisito demonstrado | complexidade operacional supera ganho; contrato P0 ainda passa em SQLite |
| Redis/queue | job assíncrono distribuído, coordenação ou backpressure não couber no [processo único](tarefas_longas_assincronas.md) | processo local atende carga e recuperação sem perda |
| object storage | artefatos excederem capacidade/localidade ou precisarem compartilhamento remoto | egress, custo, retenção e consistência pioram o risco |
| DuckDB/warehouse | consultas analíticas reais degradarem o catálogo operacional | export offline simples responde às perguntas |
| FTS/índice próprio | busca lexical medida não atender corpus-alvo | rg/filesystem continua suficiente |
| vector database/embeddings | experimento versionado superar baseline lexical em recall útil, latência e custo | ganho não reproduzível, provenance fraca ou risco de dados maior |

Gatilhos de migração são medidos: frequência/duração de SQLITE_BUSY, p95/p99 de transação, tamanho/crescimento, tempo de backup/restore, concorrência requerida e SLO do perfil. “Pode escalar um dia” não é gate.

Migrar storage exige contract suite comum, ferramenta de export/import, reconciliação de contagem/digests e plano de retorno. Ports facilitam substituição; não garantem equivalência por si só.

## 14. Hipóteses e condições de refutação

| ID | Hipótese | Teste | Refutada se |
|---|---|---|---|
| DP-H01 | SQLite atende o vertical slice com escritor único | carga MP-P0 + fault injection | locks/latência/perda excedem limiar aprovado sob perfil válido |
| DP-H02 | eventos + projeção reconstroem o estado sem ambiguidade interna | apagar projeção e replay de fixtures | estado diverge ou transição depende de dado não registrado |
| DP-H03 | protocolo de artefato nunca expõe referência para bytes ausentes | kill em cada etapa | consulta válida retorna referência ausente/corrompida sem detecção |
| DP-H04 | journal impede retry cego após crash | kill antes/depois da tool e resposta perdida | efeito não idempotente é repetido sem prova/nova aprovação |
| DP-H05 | pipeline impede persistência de secrets conhecidos | corpus de canários em todas as entradas/erros | qualquer canário chega a DB, artifact, export ou backup |
| DP-H06 | backup restaurado preserva fatos e artefatos | restore periódico independente | contagem, cadeia, referência ou estado reconstruído diverge |
| DP-H07 | exclusão cumpre o escopo declarado | canários por classe e backup | canário continua acessível após prazo sem exceção registrada |

Resultados devem registrar hardware, SO/filesystem, versão do SQLite/driver, PRAGMAs, fixture, seed, volume, concorrência, kill point e hash do código.

## 15. Testes de aceitação do estudo

| ID | Teste | Aceite |
|---|---|---|
| DP-T01 | schema novo e upgrade de cada versão | mesmo schema/checksum/invariantes finais |
| DP-T02 | crash em cada fronteira transacional | nenhum estado final falso nem transição parcial silenciosa |
| DP-T03 | edição, remoção e reordenação de evento | verificador detecta e localiza a primeira divergência |
| DP-T04 | crash em cada passo de publicação de artefato | somente órfão recuperável; nunca referência válida ausente |
| DP-T05 | artifact ausente, truncado ou trocado | leitura falha fechada e tarefa/evidência fica inconclusiva |
| DP-T06 | backup concorrente e restore limpo | snapshot consistente, cadeia/referências válidas e RPO/RTO medidos |
| DP-T07 | retenção/exclusão por classe | canários somem do escopo prometido; resíduos/exceções constam no recibo |
| DP-T08 | secret-canary ponta a ponta | zero ocorrência persistida/exportada/backup |
| DP-T09 | dois escritores e lock prolongado | segunda instância é negada ou recebe backpressure sem corrupção |
| DP-T10 | schema futuro, migração interrompida e checksum divergente | abertura para escrita falha com diagnóstico seguro |
| DP-T11 | FK órfã, projeção divergente e sequência quebrada | verificadores físico, referencial e semântico distinguem falhas |
| DP-T12 | disco cheio, permissão negada e erro de fsync/rename simulado | nenhum sucesso é emitido e o estado é recuperável ou inconclusivo |

## 16. Decisões

| ID | Decisão | Estado | Motivo/revisão |
|---|---|---|---|
| DP-D01 | SQLite é o catálogo P0 de escritor único | aceita para protótipo | reavaliar por métricas do gate, não por preferência |
| DP-D02 | artifacts ficam fora do repo e são endereçados por digest | aceita | reduz duplicação e torna corrupção detectável |
| DP-D03 | task_events são canônicos apenas para ciclo/decisão; projeções servem leitura | aceita | evita tanto CRUD opaco quanto event sourcing total |
| DP-D04 | todo efeito usa effect_journal e reconciliação | aceita | banco e mundo externo não compartilham transação |
| DP-D05 | conteúdo é redigido e minimizado antes da persistência | aceita | deriva INV-06 e QG-02 |
| DP-D06 | nenhum valor de secret é persistido | aceita | apenas handle seguro pode aparecer |
| DP-D07 | sem embeddings/vector DB no P0 | aceita | não há baseline ou necessidade demonstrada |
| DP-D08 | integridade é física + referencial + criptográfica + semântica | aceita | um único check não cobre as quatro |
| DP-D09 | backup só existe com política e restore testado | aceita | cópia não restaurada não é evidência de recuperação |
| DP-D10 | exclusão declara escopo e resíduos; não promete apagamento forense | aceita | limites de SQLite/filesystem/backup |
| DP-D11 | migração futura passa pela mesma contract suite | aceita | abstração não prova portabilidade |
| DP-D12 | configuração SQLite é ADR empírica por SO/filesystem | pendente | falta runtime e fault injection |

## 17. Questões abertas

| ID | Questão | Método para fechar | Bloqueia |
|---|---|---|---|
| OD-DP-01 | linguagem, driver e versão SQLite? | ADR após escolha do runtime e contract test | implementação |
| OD-DP-02 | journal mode/synchronous por SO suportado? | matriz de crash/durabilidade | release P0 |
| OD-DP-03 | quais payloads D2/D3 são realmente necessários e por quanto tempo? | inventário de dados + pilotos consentidos | piloto real |
| OD-DP-04 | RPO/RTO e necessidade de backup P0? | entrevista/risco + restore medido | claim de recuperação de instalação |
| OD-DP-05 | política de exclusão, VACUUM e backups? | threat model + requisito jurídico contextual | claim de exclusão |
| OD-DP-06 | algoritmo/formato canônico e compatibilidade de hash? | ADR + vetores de teste RFC 8785 | export/verificador |
| OD-DP-07 | DPL-01 ou DPL-02? | decisão de perfil e inventário de egress | conteúdo armazenado |
| OD-DP-08 | quais limites de tamanho, quota e TTL? | MP-P0 + fault tests de disco | release P0 |

Atualização de implementação em 13/08/2026: OD-DP-01 foi fechado provisoriamente pela [ADR-001](../../implementation/adr/ADR-001-runtime-p0.md). OD-DP-06 foi fechado pela [ADR-004](../../implementation/adr/ADR-004-json-canonico-e-fingerprints.md). OD-DP-02 recebeu perfil WAL/FULL, DDL e faults na [ADR-008](../../implementation/adr/ADR-008-perfil-sqlite-p0.md); OD-DP-03 e parte de OD-DP-08 receberam lifecycle/limites obrigatórios na [ADR-009](../../implementation/adr/ADR-009-lifecycle-de-artifacts.md); recovery foi fechado documentalmente pela [ADR-010](../../implementation/adr/ADR-010-recovery-e-reconciliacao.md). Todas reabrem se contract/fault tests falharem; valores de quota/TTL, data root real, exclusão/backup drill e MP-P0 continuam abertos.

## 18. Registro de evidências

| ID | Classe | Afirmação delimitada | Fonte | Confiança | Validade/revisão |
|---|---|---|---|---|---|
| DP-C01 | fato documental | SQLite implementa transações ACID inclusive sob crash, dentro das premissas documentadas | [S5] | alta | estável; revisar com versão |
| DP-C02 | fato documental | SQLite serializa escritas; há apenas um escritor por arquivo em um instante | [S6] | alta | estável; revisar com modo |
| DP-C03 | fato documental | Online Backup API produz snapshot consistente de banco ativo; cópia ingênua tem riscos | [S7] | alta | estável; validar driver |
| DP-C04 | fato documental | VACUUM reconstrói o banco e pode purgar conteúdo previamente removido; VACUUM INTO gera snapshot alternativo | [S8] | alta | estável; testar espaço/falha |
| DP-C05 | fato documental | integrity_check não substitui foreign_key_check | [S9] | alta | estável |
| DP-C06 | fato documental | secure_delete tem limites, especialmente para tabelas virtuais e camadas externas | [S10] | alta | estável; dependente de schema |
| DP-C07 | fato documental | journal/synchronous alteram atomicidade e durabilidade; journal OFF é inseguro | [S11] | alta | revalidar por versão/SO |
| DP-C08 | fato documental | RFC 8785 define representação JSON canônica repetível para hashing/assinatura | [S12] | alta | estável |
| DP-C09 | inferência | SQLite + artifacts é a menor arquitetura coerente com o P0 atual | [S1]–[S4], DP-H01–07 | média | expira após benchmarks/gate |
| DP-C10 | desconhecido | configuração SQLite, RPO/RTO, retenção e quota adequados ao produto | OD-DP-01–08 | baixa | fechar antes do claim |

## 19. Fontes

- <a id="s1"></a>**[S1]** ACI Arena. [Arquitetura de referência v2](arquitetura_de_referencia.md). Revisão de 12 ago. 2026.
- <a id="s2"></a>**[S2]** ACI Arena. [Estratégia local, cloud e híbrida](local_cloud_hibrido.md). Revisão de 12 ago. 2026.
- <a id="s3"></a>**[S3]** ACI Arena. [Requisitos funcionais](../produto/requisitos_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s4"></a>**[S4]** ACI Arena. [Requisitos não funcionais](../produto/requisitos_nao_funcionais.md). Revisão de 12 ago. 2026.
- <a id="s5"></a>**[S5]** SQLite. [SQLite Is Transactional](https://www.sqlite.org/transactional.html). Consulta em 12 ago. 2026.
- <a id="s6"></a>**[S6]** SQLite. [Isolation In SQLite](https://www.sqlite.org/isolation.html). Consulta em 12 ago. 2026.
- <a id="s7"></a>**[S7]** SQLite. [Online Backup API](https://www.sqlite.org/backup.html). Consulta em 12 ago. 2026.
- <a id="s8"></a>**[S8]** SQLite. [VACUUM](https://www.sqlite.org/lang_vacuum.html). Consulta em 12 ago. 2026.
- <a id="s9"></a>**[S9]** SQLite. [PRAGMA integrity_check e foreign_key_check](https://www.sqlite.org/pragma.html#pragma_integrity_check). Consulta em 12 ago. 2026.
- <a id="s10"></a>**[S10]** SQLite. [PRAGMA secure_delete](https://www.sqlite.org/pragma.html#pragma_secure_delete). Consulta em 12 ago. 2026.
- <a id="s11"></a>**[S11]** SQLite. [PRAGMA synchronous e journal_mode](https://www.sqlite.org/pragma.html#pragma_synchronous). Consulta em 12 ago. 2026.
- <a id="s12"></a>**[S12]** Rundgren, A.; Jordan, B.; Erdtman, S. [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785). June 2020. Consulta em 12 ago. 2026.

## 20. Critério de encerramento

Esta revisão documental está encerrada porque pergunta, escopo, autoridade, transações, recuperação, lifecycle, contraprova, hipóteses, testes, decisões e fontes estão explícitos. A decisão tecnológica continua provisória até:

- DP-T01–12 passarem nos SO/filesystems suportados;
- decisões restantes de data root, retenção/exclusão e backup real serem registradas; OD-DP-01/02/03/06 e parte de 08 já possuem ADR provisória;
- MP-P0 registrar carga e limites;
- restore independente e secret-canary passarem;
- requisitos jurídicos de retenção/exclusão, se aplicáveis, serem analisados no contexto real.

Até lá, o documento autoriza um protótipo verificável; não autoriza alegar durabilidade universal, inviolabilidade, apagamento forense, conformidade, alta disponibilidade ou escala.
