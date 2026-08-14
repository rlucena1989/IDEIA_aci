# Requisitos não funcionais — especificação mensurável

**Estudo original:** 10 de agosto de 2026
**Revisão:** 12 de agosto de 2026
**Data de corte das fontes:** 12 de agosto de 2026
**Versão:** 2.0
**Status:** requisitos especificados; metas provisórias ainda não benchmarkadas; implementação não auditada
**Método:** [Protocolo de pesquisa rigorosa v1.0](../planejamento/protocolo_pesquisa_rigorosa.md)
**Dependências:** [Visão do produto](visao_do_produto.md), [Casos de uso](casos_de_uso.md) e [Requisitos funcionais](requisitos_funcionais.md)

## 1. Resultado da revisão

Os 24 itens originais identificavam riscos relevantes, porém misturavam qualidade, funcionalidade e decisões de arquitetura. Metas como “99,5%”, “até 1 s”, “100k arquivos” e “imediatamente” não definiam carga, hardware, janela, população ou método. Assim, poderiam ser aprovadas ou reprovadas conforme a interpretação do avaliador.

Esta versão preserva `RNF-001` a `RNF-024` como **grupos de qualidade**, cria cláusulas atômicas e obriga cada medição a declarar perfil, fase e evidência. Metas numéricas sem baseline são marcadas como **hipóteses provisórias**, não como fatos nem SLOs contratados.

Decisão principal: o P0 mede segurança, correção, recuperabilidade e experiência mínima em execução local single-user. Não se declara disponibilidade de serviço, escala organizacional, equivalência cloud ou conformidade legal antes de existir o respectivo sistema e cenário de operação.

## 2. Modelo, fases e força normativa

As categorias foram organizadas com apoio do modelo de qualidade de produto da ISO/IEC 25010:2023, que serve para especificar, medir e avaliar qualidade, sem alegar certificação ou reprodução integral da norma ([S4]). Os termos **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** usam a mesma convenção local dos [requisitos funcionais](requisitos_funcionais.md).

| Fase | Contexto de qualidade | O que pode ser afirmado |
|---|---|---|
| P0 — protótipo controlado | um usuário, execução local, repositórios autorizados, fixtures versionadas | resultado dos gates no perfil exato ensaiado |
| P1 — piloto | pequena equipe, operação observada, integrações delimitadas | SLIs e SLOs internos com janela, população e exclusões explícitas |
| P2 — produto | serviço/superfícies e obrigações organizacionais definidas | compromissos operacionais e regulatórios aprovados pelos responsáveis |

Uma cláusula de qualidade não substitui o comportamento funcional que mede. Quando o comportamento já está em `RF`, este documento referencia-o e define cobertura, limite ou método.

## 3. Regra obrigatória de medição

Nenhum número é comparável sem um perfil de medição. Todo relatório de benchmark ou teste de qualidade DEVE registrar:

| Campo | Conteúdo mínimo |
|---|---|
| Artefato | commit/build, configuração, versão de schema, modelo/provider quando aplicável |
| Ambiente | SO/build, CPU, RAM, disco, runtime, limites e processos concorrentes |
| Fixture | ID e hash do repositório/dataset; quantidade e distribuição de arquivos/bytes |
| Carga | operação, concorrência, tamanho de entrada, estado frio/quente e rede |
| Amostra | repetições, aquecimento, falhas/exclusões e relógio usado |
| Estatística | unidade, população, janela, percentil e método de cálculo |
| Resultado | valor bruto/agregado, incerteza pertinente e comparação com baseline |
| Proveniência | comando/harness, logs redigidos e vínculo com commit/build |

O perfil inicial chama-se `MP-P0`. Seus valores de hardware e fixtures permanecem `TBD` até o primeiro baseline aprovado. Resultado sem esses campos é exploratório e NÃO DEVE ser usado como gate.

Para P1/P2, um SLO DEVE indicar o SLI, alvo, janela, população, condições válidas, origem da medição e ação quando violado. Isso segue a distinção entre SLI e SLO e evita percentuais sem denominador ([S5], [S6]).

## 4. Gates transversais do P0

| ID | Critério | Natureza | Método |
|---|---|---|---|
| QG-01 | 100% das invocações instrumentadas de ferramenta possuem decisão de política anterior | gate normativo | contract test + consulta de eventos |
| QG-02 | zero secret-canário em prompt externo, storage, log, erro ou relatório | gate normativo no corpus ensaiado | varredura byte a byte e decodificações previstas |
| QG-03 | zero efeito material duplicado nos cenários de retry/falha definidos | gate normativo no corpus ensaiado | fault injection + contador externo |
| QG-04 | 100% das fixtures de escrita recuperáveis retornam ao estado esperado ou terminam com resíduo explícito | gate normativo | hashes antes/depois + relatório de rollback |
| QG-05 | primeiro evento local de progresso em p95 ≤ 1 s | hipótese provisória | benchmark `MP-P0`; reter, revisar ou rejeitar após baseline |
| QG-06 | leitura da visão de metadados do repositório em p95 < 500 ms | hipótese provisória | benchmark `MP-P0`; operação e cache definidos no harness |

“Zero” e “100%” referem-se somente ao corpus e instrumentação declarados; não provam ausência universal de falhas.

## 5. Requisitos detalhados

### RNF-001 — Segurança por padrão

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-001.1 | P0 | QG-01 DEVE ser satisfeito para toda ferramenta registrada. | Tool call sem evento de decisão anterior falha o build. |
| RNF-001.2 | P0 | Ação, recurso ou campo de política desconhecido DEVE resultar em negação. | Fuzzing de enums/versões desconhecidas produz `deny`, sem handler. |
| RNF-001.3 | P0 | Nenhum caminho alternativo de execução DEVE contornar validação, política ou auditoria. | Testes chamam CLI, API interna, retry e retomada; todos geram a mesma sequência mínima. |

### RNF-002 — Isolamento e contenção

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-002.1 | P0 | Cada execução DEVE declarar capacidades de filesystem, processo, rede, recursos e secrets efetivamente isoladas pelo host. | Relatório do perfil lista controles presentes, ausentes e degradados. |
| RNF-002.2 | P0 | Zero canário de outro projeto/principal DEVE aparecer na saída do corpus cross-scope. | Corpus tenta path traversal, link, variável, processo-filho, cache e memória cruzada. |
| RNF-002.3 | P0 | Fixture hostil NÃO DEVE rodar em perfil cujo isolamento necessário não foi demonstrado. | Matriz risco × perfil bloqueia antes do primeiro efeito. |
| RNF-002.4 | P1 | Isolamento multiusuário/tenant DEVE ter teste negativo independente por superfície compartilhada. | Suite cobre storage, fila, cache, telemetria, secrets e artefatos. |

### RNF-003 — Privacidade e minimização de dados

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-003.1 | P0 | Todo fluxo de dado DEVE identificar origem, finalidade técnica, destino, retenção e classe de sensibilidade. | Inventário cobre inputs, prompts, logs, diffs, embeddings, snapshots e telemetria. |
| RNF-003.2 | P0 | QG-02 DEVE ser satisfeito antes de qualquer release do P0. | Corpus inclui formatos literal, URL/base64 quando previstos e stack traces. |
| RNF-003.3 | P0 | O modo local padrão NÃO DEVE criar egress não declarado. | Teste de rede compara conexões observadas com allowlist versionada. |
| RNF-003.4 | P1 | Base legal, direitos, transferências e retenção aplicáveis DEVEM ser aprovados por responsável jurídico/privacidade antes de tratar dados pessoais reais. | Registro de decisão por jurisdição e fluxo; este documento não serve como parecer. |

### RNF-004 — Identidade e autenticação

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-004.1 | P0 | A identidade local DEVE herdar o limite de confiança do host e não ampliar privilégios silenciosamente. | Execução com usuário sem acesso não lê/escreve o recurso. |
| RNF-004.2 | P1 | Credencial revogada DEVE falhar na próxima operação protegida após propagação máxima declarada. | Teste registra revogação, propagação e primeira tentativa; limite consta do SLO interno. |
| RNF-004.3 | P1 | Sessões remotas DEVEM ter expiração, escopo e resistência a replay verificáveis. | Vetores expirado, escopo incorreto, nonce reutilizado e assinatura inválida são negados. |

### RNF-005 — Responsividade interativa

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-005.1 | P0 | A hipótese QG-05 DEVE ser medida em execução fria e quente, separadamente. | Relatório apresenta p50/p95, n, falhas e perfil completo. |
| RNF-005.2 | P0 | O primeiro evento DEVE representar estado persistido ou explicitamente transitório, sem sugerir progresso inexistente. | Fixture bloqueada não emite estado enganoso de execução. |
| RNF-005.3 | P1 | Metas de interação DEVEM derivar de tarefa e usuário observados, não apenas do desempenho existente. | Decisão liga SLI a entrevista/ensaio de usabilidade. |

### RNF-006 — Eficiência de desempenho

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-006.1 | P0 | A hipótese QG-06 DEVE definir exatamente “leitura de metadados”, cache e fixture. | Harness versionado impede trocar a operação após medir. |
| RNF-006.2 | P0 | Operações longas NÃO DEVEM bloquear emissão de progresso, cancelamento ou persistência de checkpoint. | Stress test mede heartbeat e cancelamento durante indexação/testes. |
| RNF-006.3 | P1 | Regressão de desempenho DEVE ser comparada ao baseline no mesmo perfil ou normalizada por perfil justificado. | CI recusa comparação entre ambientes não equivalentes. |

### RNF-007 — Capacidade para codebases grandes

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-007.1 | P0 | O benchmark de 100 mil arquivos é uma fixture de exploração, não uma alegação de suporte até haver limites de tempo, memória e frescor aprovados. | Relatório marca resultado `baseline`, não `pass`, enquanto limiares forem `TBD`. |
| RNF-007.2 | P1 | Indexação incremental NÃO DEVE reler conteúdo inalterado salvo invalidação registrada. | Contadores de I/O em mudança de um arquivo mostram conjunto reprocessado e causa. |
| RNF-007.3 | P1 | Resultado de recuperação DEVE informar versão/frescor e uso máximo de recursos no perfil. | Alteração concorrente torna item stale ou força atualização detectável. |

### RNF-008 — Correção em monorepos

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-008.1 | P0 | Zero escrita fora do grafo/escopo autorizado DEVE ocorrer nas fixtures de monorepo. | Hashes dos pacotes fora do escopo permanecem iguais. |
| RNF-008.2 | P1 | Seleção de testes afetados DEVE publicar precisão/recall contra oráculo versionado; o limiar será decidido após baseline. | Matriz de confusão e casos perdidos integram o relatório. |
| RNF-008.3 | P1 | Dependência dinâmica ou grafo inconclusivo DEVE ampliar escopo ou bloquear, nunca declarar cobertura completa sem evidência. | Fixture com carregamento dinâmico produz aviso/decisão prevista. |

### RNF-009 — Capacidade e concorrência

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-009.1 | P0 | A arquitetura NÃO é obrigada a separar API, fila e workers; DEVE preservar eventos e invariantes na concorrência suportada. | Teste no nível de carga declarado detecta perdas, duplicações e ordenação inválida. |
| RNF-009.2 | P1 | Cada classe de carga DEVE definir chegadas, concorrência, duração, backpressure, timeout e recursos. | Relatório de carga reproduz o perfil e os pontos de saturação. |
| RNF-009.3 | P1 | Sob sobrecarga, o sistema DEVE degradar por política explícita, sem aceitar trabalho que não possa rastrear. | Teste provoca saturação e verifica rejeição/fila/pausa declarada. |

### RNF-010 — Disponibilidade e continuidade

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-010.1 | P0 | Reinício do processo NÃO DEVE perder tarefa/checkpoint já confirmado como persistido. | Kill injection compara IDs e hashes antes/depois. |
| RNF-010.2 | P0 | Estado de efeito externo desconhecido DEVE reaparecer como `inconclusivo`, não como sucesso ou retry automático. | Resposta perdida após efeito produz estado e intervenção previstos. |
| RNF-010.3 | P1 | A antiga meta de 99,5% fica suspensa até existir serviço, SLI de disponibilidade, janela, população, exclusões e necessidade de usuário. | Aprovação do SLO contém todos os campos da seção 3. |

### RNF-011 — Confiabilidade e idempotência

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-011.1 | P0 | QG-03 DEVE ser satisfeito no catálogo de cenários de falha. | Contador no alvo confirma uma aplicação material por intenção autorizada. |
| RNF-011.2 | P0 | Operação sem idempotência ou prova de resultado NÃO DEVE ser repetida automaticamente. | Timeout ambíguo termina inconclusivo e registra decisão humana necessária. |
| RNF-011.3 | P0 | Checkpoint corrompido/incompatível DEVE ser detectado antes da retomada. | Bit flip e mudança de schema/config bloqueiam com diagnóstico. |

### RNF-012 — Auditabilidade e integridade de evidência

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-012.1 | P0 | 100% das fixtures padrão DEVEM permitir reconstruir a máquina de estados a partir dos eventos aceitos. | Replay reproduz estado e identifica lacuna/ordem inválida. |
| RNF-012.2 | P0 | Alteração, remoção, inserção ou reordenação de evento DEVE ser detectável no limite do mecanismo declarado. | Testes de adulteração cobrem conteúdo, ID, posição e elo. |
| RNF-012.3 | P0 | O sistema NÃO DEVE chamar log de “imutável” quando o operador/storage ainda pode reescrevê-lo sem âncora independente. | Documentação e relatório descrevem o domínio de confiança real. |
| RNF-012.4 | P1 | Se não repúdio for requisito, âncora, chave, rotação, retenção e verificação externa DEVEM ser especificadas separadamente. | Threat model e teste independente cobrem comprometimento do storage primário. |

### RNF-013 — Observabilidade segura

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-013.1 | P0 | 100% dos eventos de tarefa, modelo, ferramenta, política e verificação aplicáveis DEVEM compartilhar IDs de correlação válidos. | Consulta por execução encontra a cadeia ou aponta evento órfão. |
| RNF-013.2 | P0 | Falha de telemetria NÃO DEVE converter ação insegura em permitida nem esconder falha de auditoria obrigatória. | Sink indisponível aciona fail-closed/fila local conforme classe. |
| RNF-013.3 | P0 | Telemetria DEVE passar pela mesma redação e retenção dos demais dados. | QG-02 inclui traces, métricas com atributos e exportação. |
| RNF-013.4 | P1 | Semântica e versões de telemetria DEVEM ser fixadas; adoção de OpenTelemetry não prova observabilidade adequada. | Contract test valida schema/atributos necessários no SDK fixado. |

### RNF-014 — Modularidade e substituibilidade

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-014.1 | P0 | Adapter de provider DEVE passar uma suite de contrato sem alterar o orquestrador. | Provider fake cobre sucesso, erro, stream, timeout, cancelamento e uso. |
| RNF-014.2 | P0 | Dependências entre módulos DEVEM respeitar grafo permitido e não criar ciclos proibidos. | Analisador de imports bloqueia aresta/ciclo não autorizado. |
| RNF-014.3 | P1 | “Trocar provider” só pode ser declarado após executar o mesmo contrato com dois adapters reais e registrar diferenças semânticas. | Relatório compara capabilities e resultados; não exige saídas textuais idênticas. |

### RNF-015 — Extensibilidade governada

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-015.1 | P1 | Tool externa DEVE integrar-se sem modificar o core e passar validação, política, auditoria e cancelamento aplicáveis. | Plugin de referência executa contract suite end-to-end. |
| RNF-015.2 | P1 | Contrato de extensão DEVE declarar versão, compatibilidade e capabilities; desconhecido falha fechado. | Matriz de versões cobre compatível, incompatível e campo desconhecido. |
| RNF-015.3 | P2 | Distribuição de plugins/MCP DEVE ter proveniência, assinatura/verificação e política de confiança definidas antes de marketplace. | Pacote adulterado/não confiável não é carregado. |

### RNF-016 — Portabilidade

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-016.1 | P0 | A matriz de SO suportado DEVE distinguir “desenvolvido”, “testado” e “suportado”; nenhum SO é inferido apenas por linguagem/runtime. | Documento de release aponta builds e resultados por SO. |
| RNF-016.2 | P0 | Paths, links, árvore de processos, shell e permissões DEVEM ter fixtures específicas para cada SO declarado no P0. | Smoke/negative tests registram runner e build do SO. |
| RNF-016.3 | P1 | Windows, Linux ou macOS só entra como suportado após gates de segurança, recuperação e casos prioritários naquele sistema. | Matriz impede badge/claim sem evidência vinculada. |

### RNF-017 — Modos local, cloud e híbrido

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-017.1 | P0 | O único modo obrigatório é local; ausência de cloud/híbrido NÃO reprova o P0. | Matriz de escopo e release não lista dependência remota não justificada. |
| RNF-017.2 | P1 | Modos adicionais DEVEM preservar contrato de tarefa, estados e evidência, admitindo política mais restrita. | Contract suite compara semântica; não exige bytes/saídas de modelo idênticos. |
| RNF-017.3 | P1 | Mudança de trust boundary DEVE produzir threat model e inventário de dados próprios. | Gate bloqueia worker remoto sem análise e aprovação. |

### RNF-018 — Manutenibilidade e verificabilidade do código

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-018.1 | P0 | Build de release DEVE passar typecheck, lint configurado, testes P0 e validação de contratos. | CI preserva comando, versões, saída e vínculo com commit. |
| RNF-018.2 | P0 | Dependência interna/externa ausente ou manifesto inválido DEVE impedir alegação de pacote compilável/integrado. | Instalação limpa e build reproduzível são pré-condições da alegação. |
| RNF-018.3 | P0 | Cobertura de teste DEVE ser reportada por risco/requisito; percentual global isolado NÃO é critério de suficiência. | Relatório mapeia QG/RF a cenários e lacunas. |
| RNF-018.4 | P1 | Exceção de dívida técnica DEVE ter dono, risco, prazo e condição de remoção. | Registro sem campo obrigatório não libera gate. |

### RNF-019 — Usabilidade e revisão humana

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-019.1 | P0 | Plano, decisão de política, diff, verificação, risco e custo DEVEM ser revisáveis sem leitura de log bruto. | Ensaio moderado registra conclusão, erro, tempo e dúvidas por tarefa. |
| RNF-019.2 | P0 | Status final DEVE distinguir sucesso verificado, falha, bloqueio, cancelamento e inconclusão. | Teste de compreensão não aceita rótulo genérico para cinco fixtures. |
| RNF-019.3 | P1 | Limiar de sucesso de usabilidade DEVE ser definido após piloto com população e tarefas-alvo, não inventado nesta especificação. | Protocolo pré-registra métrica antes da rodada confirmatória. |

### RNF-020 — Governança e reprodutibilidade de IA

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-020.1 | P0 | 100% das execuções DEVEM registrar fingerprint de instruções, modelo/provider, tools, políticas, critérios e avaliadores usados. | Campo ausente impede status `sucesso_verificado`. |
| RNF-020.2 | P0 | “Replay” DEVE significar reconstrução de entradas, versões, eventos e efeitos observados; NÃO implica reproduzir texto estocástico idêntico. | Documentação e teste distinguem replay de reexecução. |
| RNF-020.3 | P1 | Mudança de modelo/prompt/policy DEVE executar avaliação versionada antes de promoção. | Gate compara baseline, incerteza e regressões por caso. |

### RNF-021 — Previsibilidade de custo

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-021.1 | P0 | Uso reportado, estimado e desconhecido DEVEM aparecer separadamente; estimativa não pode ser rotulada como fatura. | Provider com/sem usage cobre os três estados. |
| RNF-021.2 | P0 | Ao atingir limite duro, nenhuma nova operação cobrável DEVE iniciar; custo em voo/atrasado DEVE aparecer como possível excedente. O possível excedente é informativo e separado do valor contabilizado pelo gate (`accounted = confirmed + reserved`); não pode ser somado ao limite nem alterar a decisão. | Mock cruza limiar durante stream, mede chamadas posteriores e comprova que `possibleOverage` não altera `accounted` nem a decisão. |
| RNF-021.3 | P1 | Acurácia de estimativa DEVE ser medida contra cobrança conciliada por provider/modelo/janela antes de prometer previsibilidade. | Relatório apresenta erro e cobertura; limiar permanece `TBD` até baseline. |

### RNF-022 — Tolerância a falhas

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-022.1 | P0 | Falha injetada em provider, processo, storage e transporte DEVE terminar em estado válido e preservar última confirmação persistida. | Matriz de kill points verifica estado e evidência. |
| RNF-022.2 | P0 | Retomada DEVE revalidar workspace, configuração, autorização, orçamento e estado dos efeitos. | Divergência em cada precondição bloqueia isoladamente. |
| RNF-022.3 | P0 | Circuit breaker/backoff só é exigido onde houver operação repetível; seu estado e política DEVEM ser observáveis. | Teste de falha transitória confirma limite e recuperação sem tempestade. |

### RNF-023 — Compatibilidade de integrações

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-023.1 | P1 | Cada integração habilitada DEVE passar contrato versionado de autenticação, erro, rate limit, idempotência e degradação. | Fake + sandbox oficial, quando disponível, preservam evidência. |
| RNF-023.2 | P1 | GitHub pode ser o primeiro adapter; GitLab ou outro só se torna requisito após demanda ou teste de neutralidade aprovado. | Decisão de escopo aponta evidência, não simetria presumida. |
| RNF-023.3 | P2 | Mudança incompatível de contrato DEVE seguir política de versão e migração. | Consumer contract detecta breaking change antes de release. |

### RNF-024 — Retenção e exclusão verificável

| ID | Fase | Requisito de qualidade | Verificação |
|---|---|---|---|
| RNF-024.1 | P0 | Cada classe de dado DEVE ter dono, finalidade, storage, retenção padrão e caminho de exclusão; `TBD` explícito bloqueia dado pessoal real. | Inventário é comparado aos schemas/storages encontrados. |
| RNF-024.2 | P1 | Exclusão DEVE produzir recibo e remover ou tornar inacessíveis dados ativos e derivados conforme política; backup, legal hold e prazo residual DEVEM ser declarados. | Canários deixam de ser consultáveis; exceções aparecem no recibo. |
| RNF-024.3 | P1 | O projeto NÃO DEVE alegar conformidade LGPD/GDPR apenas porque implementou exclusão ou retenção. | Claim público exige revisão jurídica documentada por jurisdição e operação. |

## 6. Rastreabilidade e fronteira P0

| Qualidade | Comportamentos medidos | Casos prioritários |
|---|---|---|
| segurança, isolamento, privacidade | RF-006–008, RF-013, RF-017–019 | UC-01–05 |
| confiabilidade, auditoria, recuperação | RF-004, RF-019, RF-021–023 | UC-01–05 |
| desempenho e usabilidade | RF-005, RF-011, RF-024 | UC-01–05 |
| custo e governança de IA | RF-003, RF-013–014, RF-020–021 | UC-01–05 |
| extensibilidade, cloud e integrações | RF-015–016, RF-023–024 | predominantemente P1/P2 |

Não bloqueiam o P0: multi-tenant, SSO/OIDC, marketplace, MCP obrigatório, GitLab, serviço 24×7, cloud/híbrido, três sistemas operacionais simultaneamente e compliance formal. A exclusão é de fase, não uma conclusão de irrelevância futura.

## 7. Decisões e medições abertas

| ID | Lacuna | Como fechar | Afeta |
|---|---|---|---|
| OD-RNF-01 | hardware, SO e fixtures de `MP-P0` | inventário do ambiente + hashes dos repositórios sintéticos/reais autorizados | QG-05/06, RNF-006/007 |
| OD-RNF-02 | SO oficialmente suportado no P0 | PoC dos controles de confinamento e recuperação por SO | RNF-002/016 |
| OD-RNF-03 | limiares de memória, tempo e frescor para 100k arquivos | baseline + necessidade observada de usuário | RNF-007 |
| OD-RNF-04 | população e tarefa de ensaio de usabilidade | entrevistas e protocolo pré-registrado | RNF-005/019 |
| OD-RNF-05 | necessidade de operação remota e disponibilidade | piloto e mapa de jornada; então definir SLI/SLO | RNF-004/010/017 |
| OD-RNF-06 | jurisdições, papéis e dados pessoais tratados | inventário real + revisão jurídica/privacidade | RNF-003/024 |
| OD-RNF-07 | trust model de integridade/não repúdio | threat model e decisão sobre âncora independente | RNF-012 |

## 8. Registro de evidências

| ID | Afirmação | Classe | Evidência | Contraponto/limite | Confiança | Decisão |
|---|---|---|---|---|---|---|
| RNF-C01 | ISO/IEC 25010:2023 fornece modelo de qualidade aplicável a especificação, medição e avaliação | fato normativo | [S4] | texto integral não foi reproduzido; uso não implica certificação | Alta | organizar categorias e critérios |
| RNF-C02 | SLO é alvo medido por SLI e precisa declarar método/condições | fato técnico | [S5], [S6] | exemplos do Google não são metas deste produto | Alta | suspender 99,5% sem denominador |
| RNF-C03 | Metas de 1 s, 500 ms e 100k não são verificáveis no documento original | fato observado | versão anterior deste arquivo; auditoria de 12/08/2026 | podem ser boas hipóteses após perfil | Alta | rebaixar a provisórias/baseline |
| RNF-C04 | Separar API, fila e workers é escolha arquitetural, não definição de escalabilidade | inferência | análise do requisito original + neutralidade de solução | pode tornar-se necessária após carga medida | Média | exigir resultado, não topologia |
| RNF-C05 | P0 local não sustenta SLO de serviço 24×7 nem equivalência cloud | decisão | [S1], [S2], [S3] | precisa ser revista se o piloto exigir assíncrono/remoto | Alta para o escopo atual | adiar RNF-010.3/017.2 |
| RNF-C06 | Implementar controles isolados não demonstra conformidade LGPD/GDPR | inferência prudencial | [S8], [S9] | aplicabilidade depende de operação, papéis e jurisdição; requer revisão jurídica | Alta | proibir claim automático |
| RNF-C07 | Telemetria padronizada não garante, sozinha, cobertura, redação ou segurança | inferência | [S7] + requisitos internos | depende da instrumentação adotada | Alta | contract tests e QG-02 |

## 9. Fontes e busca

- **[S1]** Estudo local, [Visão do produto — revisão orientada por evidências](visao_do_produto.md), 12/08/2026.
- **[S2]** Estudo local, [Casos de uso — seleção e critérios verificáveis](casos_de_uso.md), 12/08/2026.
- **[S3]** Estudo local, [Requisitos funcionais — especificação rastreável](requisitos_funcionais.md), 12/08/2026.
- **[S4]** ISO, *ISO/IEC 25010:2023 — Product quality model*, edição 2, publicada em 11/2023, consultada em 12/08/2026: https://www.iso.org/standard/78176.html
- **[S5]** Google, *Site Reliability Engineering — Service Level Objectives*, consultado em 12/08/2026: https://sre.google/sre-book/service-level-objectives/
- **[S6]** Google, *The Site Reliability Workbook — SLO Documents*, consultado em 12/08/2026: https://sre.google/workbook/slo-document/
- **[S7]** OpenTelemetry, *Specification 1.60.0*, consultada em 12/08/2026: https://opentelemetry.io/docs/specs/otel/
- **[S8]** Brasil, *Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais, texto compilado*, consultada em 12/08/2026: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- **[S9]** União Europeia, *Regulamento (UE) 2016/679 — GDPR, texto oficial*, consultado em 12/08/2026: https://eur-lex.europa.eu/eli/reg/2016/679/oj

**Busca executada em 12/08/2026:** páginas oficiais da ISO, Google SRE, NIST, OpenTelemetry, Planalto e EUR-Lex. Termos centrais: `ISO 25010 2023 product quality model`, `SLI SLO measurement conditions`, `software quality requirement measurable`, `LGPD texto compilado`, `GDPR official journal`. Foram incluídas fontes primárias/oficiais. Não foram usados blogs de fornecedores ou percentuais sem método. A legislação foi consultada apenas para limitar alegações de conformidade; sua aplicabilidade não foi decidida aqui.

## 10. Critério de encerramento e mudança

Esta revisão documental está concluída quando todos os 24 grupos têm cláusula, fase, método e fronteira de alegação. Isso **não** significa que os gates passaram. Para iniciar implementação do P0:

1. preencher `MP-P0` e versionar fixtures/harnesses;
2. transformar QG-01–06 e cláusulas P0 em testes rastreáveis;
3. medir baseline antes de congelar metas provisórias;
4. registrar `pass`, `fail`, `blocked` ou `inconclusive` por build;
5. impedir que pacote não instalado/compilado seja descrito como integrado.

**Mudança de 12/08/2026:** preservados `RNF-001`–`RNF-024`; removida a topologia obrigatória de escalabilidade; suspensa a meta de disponibilidade de 99,5%; metas de latência e escala passaram a hipóteses com perfil obrigatório; local/cloud e portabilidade foram faseados; privacidade/compliance deixaram de ser alegações implícitas; auditabilidade passou a declarar o domínio de confiança.
