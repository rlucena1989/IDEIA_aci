# Requisitos funcionais — especificação rastreável

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 12 de agosto de 2026  
**Data de corte das fontes:** 12 de agosto de 2026  
**Versão:** 2.0  
**Status:** requisitos especificados; implementação não auditada  
**Método:** [Protocolo de pesquisa rigorosa v1.0](../planejamento/protocolo_pesquisa_rigorosa.md)  
**Origem:** [Visão do produto](visao_do_produto.md) e [Casos de uso](casos_de_uso.md)

## 1. Resultado da revisão

Os 24 requisitos originais eram um catálogo útil de capacidades, mas não uma especificação pronta para implementação. Eles agregavam múltiplos comportamentos, marcavam quase tudo como prioridade alta e usavam critérios como “testado”, “verificável” ou “respeita permissões” sem definir estímulo, resultado ou evidência.

Esta versão preserva os IDs `RF-001` a `RF-024` como **grupos de capacidade** e introduz cláusulas atômicas (`RF-001.1`, por exemplo). Cada cláusula tem fase e verificação objetiva. A prioridade passa a ser determinada pela fase de aprendizagem, não pela quantidade de funcionalidades desejáveis.

Decisão principal: o P0 é um executor local, single-user, para UC-01–05. Autenticação corporativa, editor próprio, marketplace e notificações externas não bloqueiam esse experimento.

## 2. Escopo e força normativa

### Fases

| Fase | Objetivo | Usuário/ambiente | Condição de saída |
|---|---|---|---|
| P0 — Protótipo controlado | Testar execução governada nos cinco casos prioritários | Um usuário local; repositórios autorizados; sem deploy produtivo | Gates G1 e G2 da visão avaliados |
| P1 — Piloto | Testar continuidade, mais de um provider e integrações delimitadas | Pequena equipe; ambientes não produtivos | Uso recorrente e controles operacionais aprovados |
| P2 — Produto | Colaboração, distribuição e superfícies adicionais | Equipes e organizações | Requisitos próprios de operação e compliance definidos |

Uma cláusula P1/P2 não está “descartada”; ela não pode ser usada para atrasar ou declarar incompleto o P0, salvo se uma dependência real for demonstrada.

### Termos

Por convenção local, inspirada no BCP 14 ([S4]):

- **DEVE / NÃO DEVE:** obrigatório na fase indicada;
- **DEVERIA / NÃO DEVERIA:** recomendado; desvio exige justificativa registrada;
- **PODE:** opcional.

Cada `DEVE` descreve comportamento observável. Decisão de arquitetura aparece como restrição somente quando necessária para segurança, interoperabilidade ou teste.

### Regras de qualidade

Uma cláusula só pode ser marcada como implementada quando possuir:

1. teste ou inspeção identificável;
2. fixture e pré-condições versionadas;
3. resultado esperado inequívoco;
4. evidência associada a commit/build;
5. tratamento de falha, bloqueio e inconclusão.

“O teste passou” sem comando, versão, saída e vínculo com a cláusula não é evidência suficiente.

## 3. Invariantes do P0

| ID | Invariante | Gate |
|---|---|---|
| INV-01 | Toda tarefa e efeito pertence a um principal, projeto e execução identificáveis | G2 |
| INV-02 | Toda chamada de ferramenta passa por decisão de política antes da invocação | G2 |
| INV-03 | Escritas usam precondição de versão/hash e são recuperáveis | G2 |
| INV-04 | Efeito externo ou destrutivo exige aprovação específica e não reutilizável | G2 |
| INV-05 | Resultado sem evidência verificável termina como falha, bloqueado ou inconclusivo | G1 |
| INV-06 | Secret detectado é redigido antes de persistência ou envio | G2 |
| INV-07 | Retry não repete efeito não idempotente sem prova de resultado ou nova aprovação | G2 |
| INV-08 | Cancelamento impede novas invocações e registra processos/efeitos cujo estado ficou desconhecido | G2 |

## 4. Mapa de capacidade e fase

| Grupo | Capacidade | P0 | P1 | P2 |
|---|---|:---:|:---:|:---:|
| RF-001 | Projetos/workspaces | Essencial | ampliar | ampliar |
| RF-002 | Identidade e autenticação | identidade local | sessões de equipe | OIDC/RBAC |
| RF-003 | Configuração de agente | Essencial | ampliar | ampliar |
| RF-004 | Tarefas e sessões | Essencial | continuidade | colaboração |
| RF-005 | Planejamento | Essencial | ampliar | ampliar |
| RF-006 | Execução de ferramentas | Essencial | ampliar | ampliar |
| RF-007 | Terminal | Essencial | ampliar | ampliar |
| RF-008 | Filesystem | Essencial | ampliar | ampliar |
| RF-009 | Git | local | remoto controlado | políticas de organização |
| RF-010 | Editor/LSP | não | adaptador opcional | superfície dedicada |
| RF-011 | Contexto/indexação | mínimo rastreável | incremental | escala |
| RF-012 | Memória | sessão mínima | projeto | opt-in global |
| RF-013 | Providers | um adaptador | dois ou mais | catálogo governado |
| RF-014 | Roteamento/fallback | regra fixa | política multi-provider | otimização |
| RF-015 | Plugins/skills | não | skills confiáveis | distribuição governada |
| RF-016 | MCP | não obrigatório | servidores aprovados | governança de catálogo |
| RF-017 | Confinamento | Essencial | isolamento ampliado | perfis organizacionais |
| RF-018 | Política e aprovação | Essencial | ampliar | RBAC/SoD |
| RF-019 | Evidência e auditoria | Essencial | exportação | retenção organizacional |
| RF-020 | Uso, custo e orçamento | medição mínima | cobrança comparável | quotas organizacionais |
| RF-021 | Verificação | Essencial | ampliar | políticas por equipe |
| RF-022 | Testes | Essencial | ampliar | matrizes distribuídas |
| RF-023 | Recuperação | Essencial | efeitos remotos | continuidade avançada |
| RF-024 | Notificações | progresso local | opcional | canais externos |

## 5. Requisitos detalhados

### RF-001 — Projetos e workspaces

**Derivação:** INV-01, UC-01–05, SF-01.  
**Riscos:** path traversal, confusão entre projeto e workspace, perda de alterações alheias.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-001.1 | P0 | O sistema DEVE registrar cada projeto com ID imutável, root canônico e política associada. | Abrir duas grafias do mesmo path resulta no mesmo root/ID ou conflito explícito. |
| RF-001.2 | P0 | O sistema DEVE rejeitar root inexistente, arquivo no lugar de diretório e path cujo destino resolvido fique fora dos roots autorizados. | Fixtures com `..`, symlink/junction e path inexistente são negadas antes de leitura/escrita. |
| RF-001.3 | P0 | O sistema DEVE capturar commit-base, estado dirty e hash do manifesto ao iniciar tarefa. | Alteração posterior do repositório não modifica o snapshot registrado. |
| RF-001.4 | P1 | Arquivar um projeto NÃO DEVE excluir arquivos, repositório ou evidências sem operação separada e aprovada. | Arquivamento remove o projeto das listas ativas e preserva bytes/hashes. |

### RF-002 — Identidade, sessão e autorização de usuário

**Derivação:** INV-01 e INV-04. OIDC é padrão de identidade interoperável ([S10]), mas não é dependência do P0 single-user.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-002.1 | P0 | O sistema DEVE associar cada tarefa, aprovação e efeito ao principal local autenticado pelo ambiente hospedeiro. | Evento sem `principal_id` válido é rejeitado pelo schema. |
| RF-002.2 | P0 | O perfil local NÃO DEVE expor endpoint de autenticação de rede por padrão. | Instalação padrão não abre listener de login; teste de portas confirma. |
| RF-002.3 | P1 | Sessões remotas DEVEM ter expiração, revogação e escopos verificáveis. | Token expirado, revogado ou sem escopo falha antes do acesso. |
| RF-002.4 | P2 | Integração corporativa DEVE usar OIDC/OAuth com validação de issuer, audience, assinatura, tempo e nonce/state aplicável. | Vetores com issuer/audience/assinatura incorretos são negados; fluxo válido identifica o mesmo subject. |

### RF-003 — Configuração de agentes

**Derivação:** rastreabilidade da visão e INV-01.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-003.1 | P0 | O sistema DEVE versionar prompt/instruções, modelo, provider, tools permitidas, limites e política do agente. | Configuração válida produz fingerprint estável; mudança de um campo altera o fingerprint. |
| RF-003.2 | P0 | A execução DEVE referenciar snapshot imutável da configuração efetivamente usada. | Editar configuração durante tarefa não altera o snapshot nem o histórico. |
| RF-003.3 | P0 | Configuração inválida ou capability ausente DEVE bloquear a tarefa antes da primeira chamada ao modelo/tool. | Fixtures sem modelo, policy ou schema terminam `bloqueado`, sem efeito. |

### RF-004 — Tarefas, estados e sessões

**Derivação:** UC-01–05, estados finais dos casos e INV-08.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-004.1 | P0 | Criar tarefa DEVE exigir manifesto versionado com objetivo, escopo, critérios, orçamento e política. | Campo obrigatório ausente falha na validação antes de persistir tarefa executável. |
| RF-004.2 | P0 | O sistema DEVE impor máquina de estados com transições válidas e estados finais `sucesso_verificado`, `falha`, `bloqueado`, `cancelado` e `inconclusivo`. | Teste de tabela nega toda transição não declarada. |
| RF-004.3 | P0 | Cancelamento DEVE impedir novas invocações e tentar encerrar operações canceláveis. | Após o evento de cancelamento não há nova tool call; operação incerta é registrada como tal. |
| RF-004.4 | P1 | Retomada DEVE continuar de checkpoint compatível, após revalidar workspace, configuração, permissões e orçamento. | Mudança incompatível em qualquer precondição bloqueia retomada e indica o campo divergente. |

### RF-005 — Planejamento e alteração de plano

**Derivação:** fluxo mínimo da visão e UC-01/03/05.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-005.1 | P0 | O plano DEVE representar passos ordenados com precondições, tools, efeitos previstos, riscos e critérios relacionados. | Plano sem qualquer atributo obrigatório falha no schema. |
| RF-005.2 | P0 | O plano DEVE ser validado por schema versionado antes de execução. | Fixture válida aceita; tipos, enum e referência de critério inválidos são rejeitados. |
| RF-005.3 | P0 | Passo com efeito material DEVE exigir decisão de política e, quando indicado, aprovação antes da invocação. | Simulação prova que geração do plano não concede autorização ao passo. |
| RF-005.4 | P0 | Mudança que altere efeito, alvo, tool, risco ou orçamento DEVE invalidar a aprovação correspondente. | Alterar um parâmetro aprovado força nova decisão e não reutiliza o approval ID. |

### RF-006 — Registro e execução de ferramentas

**Derivação:** INV-02, INV-04, INV-07 e riscos de tool misuse do OWASP ([S7]).

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-006.1 | P0 | Toda ferramenta DEVE declarar ID, versão, schemas de entrada/saída, classe de efeito, cancelabilidade e política padrão. | Registro incompleto não é ativado. |
| RF-006.2 | P0 | Entrada DEVE ser validada e normalizada antes da decisão de política. | Campo adicional proibido, tipo incorreto e path ambíguo são negados sem invocar handler. |
| RF-006.3 | P0 | A decisão de política DEVE ocorrer antes de cada invocação, inclusive retries. | Mock confirma zero chamadas do handler para decisão `deny`/`approval_required` não satisfeita. |
| RF-006.4 | P0 | Cada invocação DEVE registrar request redigido, resultado normalizado, timestamps, status, versão, decisão e IDs de correlação. | Evento valida no schema e permite ligar tool call a tarefa/passo. |
| RF-006.5 | P0 | Timeout de ação externa cujo resultado não pode ser confirmado DEVE terminar como `inconclusivo`, sem retry automático. | Mock “efeito aplicado + resposta perdida” não executa segunda chamada. |

### RF-007 — Terminal e processos

**Derivação:** UC-01–05, SF-02 e MU-02.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-007.1 | P0 | A chamada DEVE declarar executável/comando, argumentos, cwd, timeout, ambiente permitido e perfil de confinamento. | Campo ausente bloqueia execução; o log redigido preserva a forma efetiva. |
| RF-007.2 | P0 | O cwd resolvido DEVE permanecer dentro do workspace autorizado. | `..`, symlink/junction e cwd removido/trocado são negados antes de spawn. |
| RF-007.3 | P0 | O sistema DEVE capturar stdout, stderr, exit code, duração e indicação de truncamento. | Fixture gera ambos os streams, código não zero e saída acima do limite; todos aparecem corretamente. |
| RF-007.4 | P0 | Cancelamento/timeout DEVE tentar encerrar a árvore de processos e registrar sobreviventes detectados. | Fixture com processo-filho não permanece silenciosamente ativa após cancelamento. |

### RF-008 — Filesystem e patches

**Derivação:** INV-03, SF-03 e MU-06.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-008.1 | P0 | Toda operação DEVE validar o path canônico após resolver links suportados pelo sistema operacional. | Corpus cross-platform não permite escapar do root por link, `..` ou alias. |
| RF-008.2 | P0 | Leitura usada como evidência/contexto DEVE registrar path relativo, hash e versão/mtime observada. | Alteração posterior torna a evidência detectavelmente stale. |
| RF-008.3 | P0 | Escrita DEVE usar precondição de hash/versão e produzir patch ou artefato equivalente reversível. | Alteração concorrente causa conflito, sem sobrescrita silenciosa. |
| RF-008.4 | P0 | Exclusão, move sobrescritivo e escrita fora da lista planejada DEVEM exigir aprovação específica. | Approval de edição comum não autoriza delete/move e não aceita alvo diferente. |

### RF-009 — Git local e remoto

**Derivação:** SF-01, SF-05 e SF-07.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-009.1 | P0 | O sistema DEVE registrar repositório, commit-base, branch e estado dirty antes da primeira escrita. | Relatório reproduz exatamente o baseline da fixture. |
| RF-009.2 | P0 | Alterações DEVEM ocorrer em branch/worktree/snapshot isolado sem apagar mudanças preexistentes. | Fixture dirty mantém bytes e status originais após execução/rollback. |
| RF-009.3 | P0 | O relatório DEVE distinguir diff da tarefa, alterações preexistentes e alterações concorrentes detectadas. | Cada origem aparece separada no relatório de fixture mista. |
| RF-009.4 | P1 | Push, criação de PR, comentário e merge DEVEM exigir aprovação que identifique host, repo, ref, ação e visibilidade. | Trocar qualquer alvo invalida aprovação; chamada idempotente não duplica PR/comentário. |
| RF-009.5 | P1 | Force push e merge automático DEVEM permanecer desabilitados até política específica e testes destrutivos isolados. | Configuração padrão nega ambas as ações. |

### RF-010 — Integração com editor e linguagem

**Derivação:** decisão D1 da visão: CLI primeiro; editor não integra o core por dependência reversa.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-010.1 | P1 | O core DEVERIA expor seleção, diagnóstico e localização de símbolo por contratos independentes de um editor. | Adapter fake executa o contrato sem VS Code/Monaco. |
| RF-010.2 | P2 | Uma extensão DEVE exibir plano, diff, risco, aprovação e estado sem reinterpretar a decisão de política. | Mesmo evento produz decisão idêntica em CLI e extensão. |
| RF-010.3 | P2 | Falha ou ausência de LSP NÃO DEVE impedir operações básicas de leitura, diff e terminal. | Fixture sem servidor de linguagem mantém fluxo degradado explícito. |

### RF-011 — Contexto, busca e indexação

**Derivação:** UC-01/03/04 e INV-05.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-011.1 | P0 | Todo trecho de contexto DEVE carregar origem, path/URI, versão/hash, intervalo e escopo de acesso. | Item sem proveniência é recusado pelo pacote de contexto. |
| RF-011.2 | P0 | Recuperação DEVE respeitar os mesmos roots e permissões da tarefa. | Arquivo fora do escopo não aparece mesmo quando é lexicalmente mais relevante. |
| RF-011.3 | P0 | A execução DEVE registrar consulta, estratégia/versão e IDs dos resultados usados. | Relatório permite repetir busca lexical da fixture. |
| RF-011.4 | P1 | Índice incremental DEVE invalidar ou atualizar entrada quando conteúdo, permissão ou versão mudar. | Mudança de arquivo e revogação removem resultado stale no próximo ciclo definido. |

### RF-012 — Memória

**Derivação:** rastreabilidade; memória global não é necessária no P0.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-012.1 | P0 | Memória de sessão DEVE guardar origem, timestamp, escopo, TTL e classe da afirmação. | Entrada sem metadado obrigatório não é recuperável como fato. |
| RF-012.2 | P0 | Memória NÃO DEVE atravessar projeto/principal sem regra explícita. | Canário de projeto A nunca é retornado no projeto B no perfil padrão. |
| RF-012.3 | P1 | Usuário autorizado DEVE poder corrigir, expirar e excluir memória, preservando evento de auditoria redigido. | Após exclusão, recuperação não retorna conteúdo; trilha registra operação sem republicá-lo. |
| RF-012.4 | P2 | Memória global DEVE ser opt-in e informar ao usuário os escopos consumidores. | Padrão é desabilitado; ativação e revogação são testáveis. |

### RF-013 — Providers e modelos

**Derivação:** H5 da visão; um provider basta para P0, dois são necessários para testar neutralidade.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-013.1 | P0 | Adapter DEVE normalizar request, streaming, timeout, cancelamento, erro e uso reportado. | Contract test do provider fake cobre sucesso, stream parcial, rate limit, timeout e cancelamento. |
| RF-013.2 | P0 | Credencial DEVE ser referenciada por identificador seguro e NÃO DEVE entrar em prompt, config exportada ou log. | Secret-canário não aparece nos artefatos após fluxo completo. |
| RF-013.3 | P0 | A execução DEVE registrar provider, endpoint lógico, modelo, versão quando disponível e capacidades declaradas. | Relatório contém snapshot e marca campo não fornecido como desconhecido, não estimado. |
| RF-013.4 | P1 | Um segundo adapter DEVE passar a mesma suíte de contrato antes de alegar portabilidade. | Dois adapters aprovados sem branch específico no agente central. |

### RF-014 — Roteamento e fallback

**Derivação:** H5, INV-07; otimização não bloqueia P0.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-014.1 | P0 | Seleção de modelo PODE ser fixa, mas DEVE ser registrada e compatível com as capacidades exigidas. | Modelo sem tool use/contexto requerido é recusado antes da chamada. |
| RF-014.2 | P1 | Política de roteamento DEVE considerar lista elegível, capacidade, privacidade, orçamento e estado de saúde. | Tabela de decisão produz escolha/negação esperada para fixtures. |
| RF-014.3 | P1 | Fallback NÃO DEVE reduzir restrição de dados ou capacidade obrigatória silenciosamente. | Provider incompatível é excluído e motivo aparece na trilha. |
| RF-014.4 | P1 | Fallback após efeito material DEVE retomar de estado confirmado ou bloquear; NÃO DEVE repetir o efeito. | Teste de falha pós-efeito não invoca ação novamente. |

### RF-015 — Skills e plugins

**Derivação:** fora do MVP; riscos de supply chain e tool misuse ([S6], [S7]).

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-015.1 | P1 | Skill declarativa confiável DEVE ter ID, versão, origem, hash, instruções e tools requeridas. | Alteração de conteúdo sem mudança de manifesto invalida hash/aprovação. |
| RF-015.2 | P2 | Plugin executável DEVE declarar publisher, entrypoint, artefatos, permissões e compatibilidade. | Manifesto incompleto não instala/ativa. |
| RF-015.3 | P2 | Instalação NÃO DEVE conceder permissão nem ativar código antes de revisão/aprovação. | Fixture maliciosa não executa hook durante inspeção. |
| RF-015.4 | P2 | Remoção DEVE desativar novas invocações e preservar trilha/artefatos conforme retenção. | Tool removida não é resolvida; histórico antigo continua interpretável. |

### RF-016 — MCP e ferramentas remotas

**Derivação:** MCP possui autorização no transporte ([S9]); autorização de negócio e política local continuam responsabilidade do sistema.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-016.1 | P1 | Servidor DEVE ter identidade, transporte, versão/protocolo, origem e capabilities registradas. | Mudança de identidade/capability exige nova aprovação conforme política. |
| RF-016.2 | P1 | Descrições e schemas descobertos DEVEM ser tratados como entrada não confiável e validados antes de registro. | Nome/schema malicioso não altera política nem executa conteúdo. |
| RF-016.3 | P1 | Cada chamada MCP DEVE passar pelo mesmo fluxo RF-006 de schema, política, timeout e auditoria. | Bypass direto ao transporte falha em teste de arquitetura/integração. |
| RF-016.4 | P1 | Token remoto DEVE usar menor escopo disponível e referência segura; falha de autorização não deve expor o token. | Logs e mensagens de erro passam por teste de secret-canário. |

### RF-017 — Confinamento de execução

**Derivação:** INV-02/06, MU-01–04 e OWASP ([S7]). “Local” não equivale a isolado.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-017.1 | P0 | Toda execução DEVE selecionar perfil explícito de filesystem, processo, rede, recursos e secrets. | Ausência de perfil bloqueia tool de código/terminal. |
| RF-017.2 | P0 | Rede DEVE ser negada por padrão; exceção identifica destino, protocolo, duração e motivo. | Egress para destino não listado falha; permitido gera evento. |
| RF-017.3 | P0 | Apenas secrets concedidos à tarefa DEVEM entrar no ambiente, pelo menor tempo e escopo possíveis. | Inventário do processo não contém secret fora da allowlist. |
| RF-017.4 | P0 | Ambiente sem isolamento forte DEVE ser rotulado e NÃO DEVE executar fixture hostil ou dado não confiável fora do perfil aprovado. | Política nega classe de risco incompatível e explica limitação. |
| RF-017.5 | P1 | Teardown DEVE destruir ou reter ambiente segundo política, registrando resíduos e razão. | Após destruição, artefatos efêmeros não são acessíveis; retenção autorizada é enumerada. |

### RF-018 — Política, risco e aprovação humana

**Derivação:** núcleo da tese; INV-02/04 e riscos de agência excessiva ([S7]).

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-018.1 | P0 | Policy engine DEVE retornar `allow`, `deny` ou `approval_required`, com versão e razão. | Mesma entrada/policy produz decisão estável; evento contém fingerprint. |
| RF-018.2 | P0 | Risco DEVE ser calculado a partir de tool, efeito, alvo, dados e contexto; afirmação do modelo NÃO DEVE reduzi-lo. | Modelo rotula delete como seguro e a política ainda exige aprovação/nega. |
| RF-018.3 | P0 | Aprovação DEVE vincular principal, ação, parâmetros normalizados, limite, expiração e nonce. | Alteração/replay/expiração falha antes da tool call. |
| RF-018.4 | P0 | Timeout ou rejeição DEVE negar a ação e manter tarefa em estado coerente. | Nenhum handler é chamado após rejeição/expiração. |
| RF-018.5 | P0 | O sistema DEVE oferecer parada de emergência que impeça novas invocações e revogue approvals pendentes. | Teste concorrente não inicia ação após o corte lógico definido. |

### RF-019 — Evidência, eventos e auditoria

**Derivação:** H3 e INV-01–08; correlação segue conceitos estáveis de OpenTelemetry ([S8]).

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-019.1 | P0 | Todo evento DEVE seguir schema versionado com ID, tipo, timestamps, principal, projeto, tarefa, passo e correlação aplicáveis. | Eventos válidos/ inválidos passam por contract test. |
| RF-019.2 | P0 | Tool calls, modelo, policy, aprovação, diff e verificação DEVEM ser navegáveis por uma mesma execução/trace. | Consulta por task ID recupera cadeia completa e ordenável da fixture. |
| RF-019.3 | P0 | Redação de secrets/PII configurada DEVE ocorrer antes da persistência/exportação. | Canários não aparecem em storage, erro, relatório ou export. |
| RF-019.4 | P0 | Evento persistido NÃO DEVE ser alterado silenciosamente; correção gera novo evento relacionado. | Tentativa de update é negada ou detectada; correção preserva ambos os IDs. |
| RF-019.5 | P1 | Exportação DEVE preservar schema, ordem, hashes e IDs sem exigir acesso ao banco interno. | Export/import em verificador independente mantém contagem e integridade. |

### RF-020 — Uso, custo e orçamento

**Derivação:** medição do G1 e contenção de recurso.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-020.1 | P0 | Cada chamada DEVE registrar uso reportado pelo provider ou `desconhecido`; estimativa deve ser rotulada separadamente. | Provider sem usage não produz número apresentado como medido. |
| RF-020.2 | P0 | Orçamento DEVE definir unidade, limite, moeda quando aplicável e ação no limiar. | Schema rejeita limite sem unidade; fixture cruza limiar e aciona política. |
| RF-020.3 | P0 | Ao atingir limite duro, o sistema NÃO DEVE iniciar nova chamada cobrável e DEVE tentar cancelar a atual quando suportado. | Mock confirma ausência de chamada subsequente. |
| RF-020.4 | P1 | Tabela de preço usada em estimativa DEVE registrar fonte, versão/data e região. | Alterar tabela muda fingerprint; relatório identifica a tabela efetiva. |

### RF-021 — Critérios e verificação

**Derivação:** INV-05 e definição de sucesso dos casos.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-021.1 | P0 | Cada critério obrigatório DEVE apontar para verificador executável ou método de inspeção explícito. | Critério sem método impede `sucesso_verificado`. |
| RF-021.2 | P0 | Resultado DEVE registrar `pass`, `fail`, `blocked` ou `inconclusive`, evidência e versão do verificador. | Todos os ramos são cobertos por fixture e schema. |
| RF-021.3 | P0 | Verificação DEVERIA ser independente do agente executor; quando não for, a dependência DEVE ser declarada. | Relatório identifica executor/verificador e conflito potencial. |
| RF-021.4 | P0 | Resposta textual do modelo NÃO DEVE satisfazer critério que requer comando, estado externo ou artefato. | Afirmação “testes passaram” sem execução não muda status do critério. |

### RF-022 — Execução e geração de testes

**Derivação:** UC-01–03/05 e SF-02.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-022.1 | P0 | Comando de teste DEVE vir do manifesto/configuração detectada e passar pela política de terminal. | Script de package alterado após aprovação é reavaliado. |
| RF-022.2 | P0 | O relatório DEVE separar baseline, testes adicionados, suíte final e falhas preexistentes. | Fixture com baseline vermelho não é apresentada como regressão nova nem sucesso pleno. |
| RF-022.3 | P0 | Retry DEVE registrar todas as tentativas e NÃO DEVE converter teste flaky em aprovação silenciosa. | Sequência fail/pass fica marcada flaky/inconclusiva conforme política. |
| RF-022.4 | P0 | Teste gerado DEVE ser identificado e, nos casos definidos, demonstrar poder de falha por regressão/mutação. | UC-02 não passa apenas porque teste tautológico executou verde. |

### RF-023 — Snapshot, rollback e compensação

**Derivação:** INV-03/07, SF-07 e MU-06.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-023.1 | P0 | O sistema DEVE criar ponto de recuperação verificável antes da primeira escrita. | Falha ao criar/verificar snapshot bloqueia escrita. |
| RF-023.2 | P0 | Rollback DEVE atuar somente nos paths/objetos da tarefa e usar precondição contra mudança concorrente. | Arquivo alheio ou alterado depois não é sobrescrito silenciosamente. |
| RF-023.3 | P0 | Após rollback, o sistema DEVE verificar hashes/estado esperado e listar resíduos. | Fixture confirma restauração e reporta arquivo não recuperável. |
| RF-023.4 | P1 | Efeito externo sem rollback DEVE declarar compensação possível ou irreversibilidade antes da aprovação. | Ação irreversível sem declaração é bloqueada. |

### RF-024 — Progresso e notificações

**Derivação:** útil para tarefas longas, mas canais externos não validam a tese do P0.

| ID | Fase | Requisito | Verificação de aceite |
|---|---|---|---|
| RF-024.1 | P0 | CLI DEVE expor progresso por eventos locais sem alterar o estado da tarefa. | Desconectar/reconectar consumidor não muda execução e permite recuperar estado atual. |
| RF-024.2 | P1 | Assinatura de evento DEVE permitir filtros por tarefa e tipo, com cursor/checkpoint. | Consumidor retoma sem perder nem duplicar evento lógico. |
| RF-024.3 | P2 | Webhook/email/chat DEVE redigir conteúdo e exigir destino aprovado. | Canário e dado fora da política não saem; destino trocado requer nova aprovação/configuração. |
| RF-024.4 | P2 | Entrega externa DEVE ter idempotency key, retry limitado e dead-letter/erro consultável. | Timeout não gera duplicata lógica; esgotamento fica visível. |

## 6. Rastreabilidade para casos prioritários

`X` indica uso direto no fluxo; `I` indica infraestrutura/invariante compartilhada.

| Grupo | UC-01 Bug | UC-02 Testes | UC-03 Feature | UC-04 Review | UC-05 Dependência |
|---|:---:|:---:|:---:|:---:|:---:|
| RF-001 Projetos | I | I | I | I | I |
| RF-003 Agente | I | I | I | I | I |
| RF-004 Tarefa | X | X | X | X | X |
| RF-005 Plano | X | X | X |  | X |
| RF-006 Tools | X | X | X | X | X |
| RF-007 Terminal | X | X | X | X | X |
| RF-008 Filesystem | X | X | X |  | X |
| RF-009 Git | X | X | X | X | X |
| RF-011 Contexto | X | X | X | X | X |
| RF-013 Provider | I | I | I | I | I |
| RF-017 Confinamento | I | I | I | I | I |
| RF-018 Política | I | I | I | I | I |
| RF-019 Auditoria | I | I | I | I | I |
| RF-020 Custo | I | I | I | I | I |
| RF-021 Verificação | X | X | X | X | X |
| RF-022 Testes | X | X | X | X | X |
| RF-023 Recuperação | X | X | X |  | X |

RF-002.1, RF-012.1 e RF-024.1 suportam o P0 transversalmente. RF-010, RF-015, RF-016 e canais externos de RF-024 não são necessários para executar UC-01–05.

## 7. Fora de escopo do P0

- cadastro de usuários/senhas, SSO, RBAC organizacional e multi-tenant;
- IDE própria, marketplace, instalação de plugin executável e memória global;
- deploy ou merge autônomo em produção;
- swarm aberto, delegação recursiva sem limite e autoelevação de permissão;
- promessa de conformidade jurídica, segurança absoluta ou produtividade universal;
- suporte simultâneo a todas as linguagens, providers e sistemas operacionais.

Remover estes itens do P0 é decisão de escopo, não conclusão de que sejam desnecessários no produto.

## 8. Decisões em aberto

| ID | Decisão necessária | Evidência para decidir | Impacto |
|---|---|---|---|
| OD-RF-01 | Perfil mínimo de confinamento em Windows/Linux/macOS | PoC e testes negativos por SO | RF-007/017 |
| OD-RF-02 | Mecanismo de integridade do event log | benchmark, modelo de ameaça e custo operacional | RF-019 |
| OD-RF-03 | Semântica de custo quando provider não reporta usage final | contract tests e APIs escolhidas | RF-020 |
| OD-RF-04 | TTL/retenção padrão de memória e evidência | entrevistas, threat model e política de privacidade | RF-012/019 |
| OD-RF-05 | Limites exatos de output, timeout e orçamento | benchmark UC-01–05 | RF-006/007/020 |

## 9. Registro de evidências

| ID | Afirmação | Classe | Fonte | Limitação/contraponto | Confiança | Impacto |
|---|---|---|---|---|---|---|
| RF-C01 | O documento original agrupava comportamentos e não definia testes objetivos por cláusula | Fato observado | versão original auditada em 12/08/2026 | avaliação interna; original substituído no workspace | Alta | estrutura |
| RF-C02 | ISO/IEC/IEEE 29148:2018 especifica processos e itens de informação para engenharia de requisitos | Fato normativo | S3 | texto integral é pago; página oficial confirma escopo e vigência | Alta | método |
| RF-C03 | BCP 14 define palavras para comunicar força de requisitos | Fato normativo | S4 | traduções DEVE/PODE são convenção local declarada | Alta | linguagem |
| RF-C04 | Práticas de segurança precisam ser incorporadas ao SDLC e mantidas | Recomendação normativa | S6 | SSDF é framework, não certificação automática | Alta | invariantes |
| RF-C05 | Aplicações agentic enfrentam goal hijack, tool misuse e abuso de identidade/privilégio | Framework de risco | S7 | lista não estima probabilidade no projeto | Alta | RF-006/017/018 |
| RF-C06 | P0 single-user e adiamento de editor/marketplace são as melhores fronteiras atuais | Decisão | S1, S2 e escopo desta revisão | não validado por uso próprio | Média | fases |

## 10. Fontes

- **[S1]** Estudo local, [Visão do produto — revisão orientada por evidências](visao_do_produto.md), 12/08/2026.
- **[S2]** Estudo local, [Casos de uso — seleção e critérios verificáveis](casos_de_uso.md), 12/08/2026.
- **[S3]** ISO, *ISO/IEC/IEEE 29148:2018 — Requirements engineering*, confirmada em 2024 e em revisão desde 2026: https://www.iso.org/standard/72089.html
- **[S4]** IETF, *BCP 14 — RFC 2119 e RFC 8174*: https://www.rfc-editor.org/info/rfc2119 e https://www.rfc-editor.org/info/rfc8174
- **[S5]** JSON Schema, *Draft 2020-12*, consultado em 12/08/2026: https://json-schema.org/draft/2020-12
- **[S6]** NIST, *SP 800-218 — Secure Software Development Framework 1.1*, final: https://csrc.nist.gov/pubs/sp/800/218/final
- **[S7]** OWASP, *Top 10 for Agentic Applications for 2026*: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- **[S8]** OpenTelemetry, *Specification 1.60.0*, consultado em 12/08/2026: https://opentelemetry.io/docs/specs/otel/
- **[S9]** Model Context Protocol, *Authorization — specification 2025-11-25*, consultado em 12/08/2026: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- **[S10]** OpenID Foundation, *OpenID Connect Core 1.0 incorporating errata set 2*: https://openid.net/specs/openid-connect-core-1_0.html

## 11. Critério de encerramento e próxima revisão

Esta especificação documental está concluída por limite de escopo quando todas as cláusulas P0 têm ID, verificação e rastreabilidade. Ela **não** está implementada nem validada apenas por existir.

Próximos passos:

1. converter cláusulas P0 em manifests de teste versionados;
2. auditar o código existente separadamente e produzir matriz `não iniciado/parcial/implementado/verificado` com evidência;
3. resolver OD-RF-01 antes de executar fixtures hostis;
4. revisar [requisitos não funcionais](requisitos_nao_funcionais.md), próximo estudo cronológico, sem duplicar comportamentos funcionais aqui.

## 12. Registro de revisão

Em 12/08/2026, os 24 IDs originais foram preservados como grupos; as capacidades foram decompostas em cláusulas verificáveis, priorizadas por P0/P1/P2 e ligadas a UC-01–05. Autenticação corporativa, editor, plugins e canais externos deixaram de ser bloqueadores do MVP. A implementação continua desconhecida até auditoria separada.
