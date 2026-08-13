# Visão do produto — revisão orientada por evidências

**Estudo original:** 10 de agosto de 2026  
**Revisão:** 12 de agosto de 2026  
**Data de corte das fontes:** 12 de agosto de 2026  
**Status:** tese de produto; pendente de discovery e experimento comparativo  
**Método:** [Protocolo de pesquisa rigorosa v1.0](../planejamento/protocolo_pesquisa_rigorosa.md)

## 1. Conclusão executiva

Existe um problema plausível, mas ainda não uma oportunidade comercial validada. Desenvolvedores usam muitas ferramentas, relatam ganhos com IA e, ao mesmo tempo, demonstram baixa confiança em sua exatidão e preocupação com segurança e privacidade. A produtividade observada varia por período, ferramenta, experiência e tipo de tarefa; autorrelato não deve ser a métrica principal.

A tese mais defensável não é “uma IDE com mais autonomia”. Capacidades como pesquisa do repositório, planejamento, edição, terminal, execução assíncrona e criação de pull request já estão presentes em produtos estabelecidos. A hipótese de diferenciação passa a ser:

> **Delegar mudanças de software delimitadas a agentes, preservando controle local, política explícita e evidência reproduzível de cada ação e resultado.**

Para aprender com baixo custo, a decisão provisória continua sendo um **core local acionado por CLI, com API interna estável**. CLI é veículo de validação, não diferencial. Extensão de editor e control plane web só entram após evidência de uso e de tarefas assíncronas.

## 2. Perguntas e escopo

### Perguntas de pesquisa

1. Há dor recorrente em delegar, verificar e governar mudanças feitas por agentes?
2. Qual segmento sente essa dor com frequência e tem autoridade para adotar uma solução?
3. “Execução verificável e governada” melhora resultados frente ao fluxo atual?
4. Qual superfície entrega aprendizado suficiente com menor custo e risco?

### Dentro do escopo

- desenvolvimento, manutenção, teste e revisão de software;
- fluxos local, self-hosted e híbrido;
- tarefas delimitadas, com resultado verificável;
- CLI, extensão, web e backend como superfícies possíveis.

### Fora do escopo desta revisão

- tamanho de mercado, preço e modelo comercial;
- afirmação de conformidade regulatória;
- escolha definitiva de runtime, banco ou fornecedor de modelo;
- autonomia irrestrita e operação em produção sem aprovação.

## 3. Método e busca

Foram consultadas fontes primárias de três tipos: pesquisa com desenvolvedores, estudo empírico de produtividade e documentação oficial de produtos/segurança. Consultas principais combinaram `AI developer productivity`, `agent adoption trust security`, `coding agent plan branch pull request`, `background agent security` e os domínios oficiais. Foram incluídas fontes com método ou documentação verificável e data/estado identificável. Páginas de fornecedores sustentam apenas capacidades declaradas, não superioridade ou impacto.

Foram excluídos como sustentação: notícias que apenas resumiam a METR, homepages comerciais sem definição operacional, rankings sem protocolo e preços/planos que não informam a decisão deste estudo. A busca foi encerrada por limite de escopo após cobrir problema, produtividade, paridade competitiva e segurança; não por saturação bibliográfica.

Limitações: a Stack Overflow Developer Survey é autorrelatada e sujeita a seleção; o ensaio da METR tem população específica; a atualização posterior da METR declara viés de seleção; documentação comercial muda rapidamente; não foram feitas entrevistas próprias nem teste de usabilidade nesta rodada.

## 4. O que a evidência sustenta

### 4.1 Fragmentação existe; o dano específico ainda é hipótese

A Stack Overflow Developer Survey 2025 registrou que 54% dos respondentes da pergunta usavam seis ou mais aplicativos/plataformas no trabalho ([S1]). Isso sustenta multiplicidade de ferramentas, mas não demonstra que integrar tudo em um produto reduz retrabalho ou custo. Essa relação deve ser testada, não presumida.

### 4.2 Interesse e confiança coexistem em tensão

Na mesma pesquisa, 52% dos respondentes da pergunta disseram que ferramentas/agentes de IA tiveram efeito positivo em sua produtividade. Porém, 52% não usavam agentes ou permaneciam em ferramentas mais simples, e 38% não planejavam adotá-los. Entre todos os respondentes da pergunta sobre desafios, 87% demonstraram preocupação com exatidão e 81% com segurança/privacidade ([S2]). Em outra questão, 46% desconfiavam da exatidão das ferramentas, contra 33% que confiavam ([S3]).

**Inferência:** o espaço de produto não depende apenas de ampliar autonomia; reduzir o custo de verificar e controlar resultados pode ser um trabalho mais universal. Confiança: média, porque os dados são transversais e autorrelatados.

### 4.3 Ganho de produtividade não pode ser assumido

Um ensaio randomizado da METR com 16 desenvolvedores experientes, 246 tarefas reais e codebases conhecidas encontrou tarefas 19% mais lentas com ferramentas do início de 2025; o intervalo reportado para a desaceleração foi de 2% a 39% ([S4]). Em fevereiro de 2026, a METR relatou sinais de ganho com ferramentas do fim de 2025, mas considerou o tamanho do efeito pouco confiável devido a seleção de participantes e medição de trabalho com múltiplos agentes ([S5]).

**Decorrência:** o produto deve medir tempo até resultado **verificado**, retrabalho, taxa de aceitação, custo e incidentes. Percepção de velocidade é métrica secundária. Não é válido generalizar o resultado de 2025 para todas as ferramentas ou equipes de 2026.

### 4.4 Capacidades genéricas já são paridade competitiva

- O GitHub Copilot cloud agent declara pesquisa de repositório, plano revisável, mudanças em branch, diff iterativo e criação de pull request ([S6]).
- Cursor declara agente em editor, CLI e agentes assíncronos em VMs remotas; seus background agents editam, executam comandos e aceitam acompanhamento ([S7], [S8]).
- Devin declara IDE, shell, browser e histórico unificado de comandos/ações durante sessões ([S9]).

**Inferência:** “planejar + editar + executar + abrir PR” e “ter CLI” são requisitos de entrada, não diferenciais demonstrados. Diferenciação precisa ser provada por resultado, controle, implantação ou custo total.

### 4.5 Segurança é propriedade central, não complemento

A própria documentação de background agents do Cursor registra execução automática de comandos, acesso à internet e risco de exfiltração por prompt injection ([S7]). O OWASP Top 10 for Agentic Applications 2026 foi desenvolvido com mais de 100 especialistas e trata riscos de agentes que planejam e agem em fluxos complexos ([S10]).

**Decorrência:** identidade da ferramenta, menor privilégio, limite de efeitos, isolamento, aprovação, trilha e contenção de saída fazem parte do produto mínimo. “Local-first” reduz algumas superfícies, mas não prova segurança.

## 5. Problema e segmento — formulação testável

### Problema

Equipes que usam ou avaliam agentes de código precisam delegar tarefas sem perder controle sobre escopo, dados, comandos, custo e qualidade. Hoje, revisar logs, diffs, testes e permissões pode consumir o benefício obtido na geração.

### Segmento inicial — hipótese H1

**Usuário:** desenvolvedor sênior, tech lead ou platform engineer que trabalha em repositório existente e pode instalar uma ferramenta local.  
**Contexto:** equipe já experimenta ao menos um agente e possui testes/CI suficientes para avaliar resultado.  
**Exclusão inicial:** usuário sem repositório verificável; fluxo exclusivamente no-code; implantação produtiva autônoma.

**Refutação de H1:** em 12 entrevistas qualificadas, menos de 8 apresentarem um episódio dos últimos 30 dias em que verificação, permissão, custo ou recuperação limitou a delegação; ou menos de 6 classificarem a dor entre as três principais do fluxo com agentes.

Esses limiares são decisão de triagem, não estimativa de mercado.

### Jobs to be done

- delimitar objetivo, arquivos, ferramentas, orçamento e condições de parada;
- inspecionar plano, risco e efeitos antes de autorizar;
- executar em workspace recuperável sem expor dados fora da política;
- verificar testes, critérios de aceite e evidências antes de aceitar o diff;
- reproduzir, auditar ou reverter uma execução;
- trocar modelo/provider sem perder o contrato de tarefa e a trilha.

## 6. Proposta de valor e diferenciais como hipóteses

| ID | Hipótese de valor | Como testar | Refutação |
|---|---|---|---|
| H2 | Manifesto de tarefa e política reduzem ações fora de escopo | benchmark com tarefas e ataques iguais, com/sem política | não reduzir violações ou aumentar tempo verificado >20% sem ganho de qualidade |
| H3 | Relatório de evidências reduz esforço de revisão | estudo cruzado medindo tempo e defeitos encontrados | revisão igual/mais lenta sem aumento de detecção ou confiança calibrada |
| H4 | Execução local recuperável habilita adoção em código sensível | entrevistas + piloto com política real | dados ainda impedem piloto ou isolamento não satisfaz controles mínimos |
| H5 | Contrato neutro de provider reduz lock-in operacional | executar suíte equivalente em dois providers | adaptação exigir mudança no core/artefatos ou produzir trilhas incompatíveis |

Características candidatas, ainda não diferenciais comprovados:

- ledger append-only de ações, decisões, fontes, custos e resultados;
- policy-as-code por tool call, com negação por padrão;
- snapshot/branch e rollback testado antes de efeitos externos;
- verificação baseada em critérios, com procedência de evidência;
- implantação local/self-hosted e adaptadores de modelo;
- replay sem repetir automaticamente efeitos não idempotentes.

## 7. Decisão provisória de formato

Escala de 1 (fraco) a 5 (forte). Pesos e notas são julgamento do projeto e devem ser substituídos por dados de uso. O ranking permanece igual se “tempo para aprender” cair de 25% para 15% e “UX de tarefa longa” subir de 10% para 20%; portanto, a decisão não depende apenas de um peso.

| Formato | Aprender/entregar 25% | Integração local 20% | Controle/localidade 20% | Acesso ao usuário 15% | Tarefa longa 10% | Manutenção 10% | Total / 5 |
|---|---:|---:|---:|---:|---:|---:|---:|
| CLI + API local | 5 | 5 | 4 | 3 | 2 | 5 | **4,20** |
| Extensão VS Code | 3 | 4 | 3 | 5 | 3 | 3 | 3,50 |
| Backend agentic | 4 | 3 | 4 | 1 | 5 | 4 | 3,45 |
| Híbrido completo | 1 | 5 | 4 | 5 | 5 | 1 | 3,40 |
| IDE própria | 1 | 5 | 3 | 4 | 4 | 1 | 2,95 |
| Web app | 3 | 2 | 2 | 3 | 5 | 3 | 2,80 |

**Decisão D1:** iniciar com CLI + API local. Reavaliar quando houver: (a) cinco usuários recorrentes; (b) pelo menos 30 execuções reais; e (c) evidência de que revisão no terminal reduz conclusão ou retenção. Não construir IDE própria no estágio de descoberta.

## 8. MVP de aprendizagem

### Fluxo mínimo

1. receber manifesto com objetivo, escopo, risco, orçamento e critérios de aceite;
2. coletar contexto com origem e permissões;
3. propor plano e efeitos previstos;
4. criar branch/snapshot recuperável;
5. executar tools tipadas sob política deny-by-default;
6. validar critérios, testes e diff;
7. produzir relatório com comandos, arquivos, resultados, custo e desconhecidos;
8. aceitar, rejeitar ou reverter; push/PR apenas com aprovação separada.

### Não objetivos do MVP

- editor próprio, marketplace, swarm aberto ou microserviços;
- deploy autônomo em produção;
- suporte amplo a todas as linguagens e providers;
- memória global entre clientes;
- promessa de conformidade ou de produtividade universal.

## 9. Plano de validação e gates

### Gate G0 — problema

- 12 entrevistas, no máximo 4 pessoas da mesma organização;
- exigir exemplo recente e artefato quando possível, não somente opinião;
- H1 atende aos limiares definidos na seção 5.

### Gate G1 — solução

- protótipo testado em pelo menos 40 tarefas emparelhadas ou cruzadas;
- estratificar bug, feature pequena, teste e manutenção;
- comparar com o fluxo habitual do participante;
- métrica primária: tempo até todos os critérios verificáveis passarem;
- secundárias: aceitação sem retrabalho, defeitos escapados, minutos de revisão, custo e violações de política;
- registrar modelo, provider, versão, prompt, codebase e experiência.

### Gate G2 — segurança e recuperação

- 100% das tool calls com identidade, política, entrada, saída e decisão registradas;
- 100% dos testes de rollback restauram o estado de referência sem apagar trabalho fora do escopo;
- zero finding crítico aberto em testes de path traversal, secrets, prompt injection, rede e efeitos não idempotentes;
- falha de modelo/provider não pode repetir efeito externo sem idempotency key ou nova aprovação.

### Gate G3 — continuidade

Avançar para extensão/UI apenas se G0–G2 passarem e pelo menos 5 dos participantes usarem o fluxo novamente em 30 dias. Caso contrário, revisar segmento/problema antes de ampliar superfície.

## 10. Registro de evidências

| ID | Afirmação | Classe | Fonte | Escopo/contraponto | Confiança | Impacto |
|---|---|---|---|---|---|---|
| VP-C01 | 54% usavam 6+ ferramentas no trabalho | Resultado | S1 | respondentes da questão; não mede dor causal | Média | problema |
| VP-C02 | Há interesse em IA e forte preocupação com exatidão/segurança | Resultado | S2, S3 | autorrelato; perguntas/amostras diferentes | Média | proposta |
| VP-C03 | No cenário estudado no início de 2025, participantes levaram 19% mais tempo com IA | Resultado | S4 | 16 desenvolvedores experientes em projetos conhecidos; não generalizável | Alta para essa amostra | métricas |
| VP-C08 | O tamanho do efeito de produtividade com ferramentas do fim de 2025/início de 2026 permanece incerto | Resultado/inferência | S5 | seleção e medição impedem estimativa robusta | Alta | métricas |
| VP-C04 | Planejamento, branch, diff e PR já existem em incumbentes | Fato declarado | S6–S9 | documentação oficial; recursos e planos mudam | Alta para capacidade declarada | diferenciação |
| VP-C05 | Agentes remotos com terminal/rede criam risco de exfiltração | Fato/inferência | S7, S10 | não quantifica incidência | Média | segurança |
| VP-C06 | Execução verificável será diferencial valorizado | Hipótese H2–H4 | evidência indireta C02–C05 | sem teste próprio | Baixa | tese central |
| VP-C07 | CLI + API local é a melhor superfície inicial | Decisão D1 | matriz da seção 7 | notas internas; não preferência observada | Média | MVP |

## 11. Evidência contrária e desconhecidos

- A percepção positiva de produtividade em surveys contradiz uma leitura puramente negativa; o estudo não conclui que agentes são improdutivos em geral.
- Produtos existentes também adicionam auditoria, políticas e segurança; a diferenciação pode desaparecer antes do lançamento.
- Local-first pode aumentar fricção de instalação, suporte multiplataforma e inconsistência ambiental.
- Não sabemos frequência, disposição a pagar, segmento de entrada, custo de aquisição ou se a trilha reduz de fato o tempo de revisão.
- Não há benchmark próprio que compare o conceito ao fluxo atual.

## 12. Fontes

- **[S1]** Stack Overflow, *2025 Developer Survey — Work*, consultado em 12/08/2026: https://survey.stackoverflow.co/2025/work
- **[S2]** Stack Overflow, *2025 Developer Survey — AI Agents*, consultado em 12/08/2026: https://survey.stackoverflow.co/2025/ai#ai-agents
- **[S3]** Stack Overflow, *2025 Developer Survey — AI trust*, consultado em 12/08/2026: https://survey.stackoverflow.co/2025/ai
- **[S4]** Becker et al., *Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity*, dados de fev.–jun./2025: https://arxiv.org/abs/2507.09089
- **[S5]** METR, *We are Changing our Developer Productivity Experiment Design*, 24/02/2026: https://metr.org/blog/2026-02-24-uplift-update/
- **[S6]** GitHub Docs, *Research, plan, and iterate on code changes with Copilot cloud agent*, consultado em 12/08/2026: https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/research-plan-iterate
- **[S7]** Cursor Docs, *Background Agents*, consultado em 12/08/2026: https://docs.cursor.com/background-agent
- **[S8]** Cursor Docs, *Cursor CLI*, consultado em 12/08/2026: https://docs.cursor.com/en/cli/overview
- **[S9]** Devin Docs, *Devin Session Tools*, consultado em 12/08/2026: https://docs.devin.ai/work-with-devin/devin-session-tools
- **[S10]** OWASP, *Top 10 for Agentic Applications for 2026*, 09/12/2025: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- **Contexto adicional:** DORA, *State of AI-assisted Software Development 2025*, versão corrigida 2025.2: https://dora.dev/research/2025/dora-report/

## 13. Próxima revisão

Revalidar capacidades de fornecedores em até 30 dias ou antes de comparação/decisão. Atualizar a tese após G0; não avançar para arquitetura definitiva com base apenas neste estudo.

## 14. Registro de revisão

Em 12/08/2026, a auditoria separou a antiga afirmação `VP-C03` em duas proposições: resultado causal restrito à amostra de 2025 (`VP-C03`) e incerteza do efeito atual (`VP-C08`). A conclusão e a decisão D1 foram mantidas; a rastreabilidade da confiança foi corrigida. Ver [auditoria das revisões](../planejamento/auditoria_revisoes_2026-08-12.md).
