# Pesquisa de Tecnologias para Plataforma de Engenharia Autônoma com IA/ACI

**Data da pesquisa:** 10 de agosto de 2026  
**Última revisão de controle:** 13 de agosto de 2026  
**Status:** Em andamento; existência de arquivo não implica validação

> **Fonte canônica de andamento:** [fila de revisão cronológica](planejamento/fila_revisao_cronologica.md). A árvore abaixo registra a taxonomia original e pode ficar atrás do [índice geral](00_indice_geral.md). Visão, casos de uso e requisitos já foram revisados documentalmente; implementação e resultados empíricos continuam não demonstrados.

> **Abordagens dos temas:** os 20 temas técnicos receberam uma [segunda revisão transversal](planejamento/revisao_abordagens_temas_2026-08-12.md). Recomendações de ferramentas nos rascunhos originais devem ser lidas como inventário até passarem pelo baseline e gate RAT correspondente.

> **Implementação P0:** a auditoria de prontidão, o isolamento do código anterior e os pacotes delegáveis estão em [docs/implementation](../implementation/README.md). Essa preparação autoriza apenas a primeira onda determinística; não constitui evidência de P0 implementado.

## Objetivo

Realizar levantamento completo de tecnologias, plataformas, IDEs, agentes, ferramentas e funcionalidades relacionadas à construção de uma Plataforma de Engenharia Autônoma com IA/ACI.

## Estrutura da Documentação

```
docs/research/
├── 00_indice_geral.md                    # Índice de todos os documentos
├── 01_resumo_executivo.md                # Resumo executivo (a ser criado)
├── 02_comparativo_geral.md               # Comparação entre ferramentas
├── ferramentas/                          # Análise de ferramentas específicas
│   ├── devin.md
│   ├── cursor.md
│   ├── cline.md
│   ├── windsurf_devin_desktop.md
│   ├── freebuff.md
│   ├── opencode.md
│   ├── trae.md
│   ├── kiro.md
│   ├── ideia.md
│   ├── antigravity.md
│   ├── omniroute.md
│   └── outras_ferramentas.md
├── produto/                              # Visão de produto e estratégia
│   ├── visao_do_produto.md
│   ├── casos_de_uso.md
│   ├── ux_ui.md
│   ├── concorrencia_monetizacao.md
│   └── linguagens_e_frameworks.md
├── arquitetura/                          # Arquitetura e design
│   ├── arquitetura_de_referencia.md
│   ├── local_cloud_hibrido.md
│   ├── dados_e_persistencia.md
│   └── tarefas_longas_assincronas.md
├── ia/                                   # IA, agentes e governança
│   ├── governanca_de_ia.md
│   ├── avaliacao_e_benchmarks.md
│   ├── contexto_memoria_rag_estrategia.md
│   ├── estado_e_ciclo_agentic.md
│   └── gerenciamento_de_custos.md
├── seguranca/                            # Segurança e permissões
│   ├── threat_model.md
│   └── permissoes_e_sandbox.md
├── integracoes/                          # Integrações
│   └── integracoes_dev.md
├── extensibilidade/                      # Plugins e marketplace
│   └── plugins_skills_marketplace.md
├── engenharia/                           # Práticas de engenharia
│   ├── testes.md
│   ├── versionamento_diff_rollback.md
│   └── requisitos_funcionais.md
│   └── requisitos_nao_funcionais.md
├── legal/                                # Aspectos legais
│   └── legal_licencas_privacidade.md
├── planejamento/                         # Planejamento e decisões
│   ├── build_buy_adapt.md
│   ├── criterios_decisao_tecnologica.md
│   ├── matriz_de_riscos.md
│   ├── roadmap_tecnico.md
│   ├── plano_de_pesquisa_pendente.md
│   └── criterios_encerramento_pesquisa.md
├── temas/                                # Temas técnicos transversais
│   ├── arquitetura_geral.md
│   ├── orquestracao_de_agentes.md
│   ├── planejamento_e_decomposicao.md
│   ├── execucao_segura_de_codigo.md
│   ├── terminal_e_sistema_de_arquivos.md
│   ├── integracao_git.md
│   ├── memoria_contexto_rag.md
│   ├── indexacao_codebase.md
│   ├── roteamento_llms_provedores.md
│   ├── controle_de_custos.md
│   ├── avaliacao_verificacao.md
│   ├── testes_automatizados_por_ia.md
│   ├── seguranca_e_permissoes.md
│   ├── human_in_the_loop.md
│   ├── logs_auditoria_observabilidade.md
│   ├── skills_plugins_ferramentas.md
│   ├── mcp_protocolos_integracao.md
│   ├── multiagentes.md
│   ├── ux_ui_ide_ia.md
│   └── devcontainers_docker_sandboxes.md
├── oportunidades/                        # Análise de oportunidades
│   ├── gaps_e_janelas_de_oportunidade.md
│   ├── ideias_inovadoras.md
│   └── roadmap_funcional.md
└── backlog/                              # Pendências
    ├── temas_para_pesquisar_depois.md
    ├── duvidas_em_aberto.md
    └── referencias.md
```

## Ferramentas Pesquisadas

### Obrigatórias
- ✅ **Devin** (Cognition AI) - Agente autônomo para engenharia de software
- ✅ **Cursor** (Anysphere) - IDE com agentes de IA e Composer
- ✅ **Cline** (Open Source) - Agente de coding open source
- ✅ **Windsurf/Devin Desktop** - IDE com gerenciamento multi-agente
- ⏳ **FreeBuff** - (pesquisa pendente)
- ⏳ **OpenCode** - (pesquisa pendente)
- ⏳ **Trae** - (pesquisa pendente)
- ⏳ **Kiro** - (pesquisa pendente)
- ✅ **IDEIA** - IDE inteligente (projeto de referência local)
- ⏳ **Antigravity** - (pesquisa pendente)
- ⏳ **OmniRoute** - (pesquisa pendente)

### Adicionais Relevantes
- GitHub Copilot
- Replit Agent
- Continue
- Aider
- SWE-agent
- OpenHands
- Outros (em pesquisa)

## Status da Pesquisa

| Categoria | Status | Progresso |
|-----------|--------|-----------|
| Ferramentas obrigatórias | 🟡 Em andamento | 4/11 concluídas |
| Estudos mais antigos de produto | 🟢 Revisados documentalmente | visão, casos de uso, RF e RNF em v2 |
| Documentos de arquitetura | 🟢 Revisados documentalmente | quatro estudos-base em v2; implementação e testes empíricos pendentes |
| Documentos de IA | 🟡 Revisão rigorosa em andamento | governança de IA é o próximo item cronológico |
| Requisitos | 🟢 Especificados | 2/2; implementação não auditada |
| Temas técnicos | 🟢 Abordagens revisadas; experimentos pendentes | 20/20 ligados a baseline e gate RAT |
| Planejamento | 🟡 Em uso | protocolo, fila e auditorias ativos |
| Resumo executivo | 🟡 Existente | deve ser reconciliado após os estudos-base |

## Próximos Passos

1. ✅ Criar estrutura de diretórios
2. 🟡 Completar pesquisa de ferramentas obrigatórias
3. 🟡 Finalizar documentos de produto
4. ⏳ Criar documentos de arquitetura
5. ⏳ Criar documentos de IA e governança
6. ⏳ Criar documentos de segurança
7. ⏳ Criar documentos de temas técnicos
8. ⏳ Criar documentos de planejamento
9. ⏳ Consolidar resumo executivo final

## Metodologia

- **Protocolo normativo**: aplicar o [protocolo de pesquisa rigorosa](planejamento/protocolo_pesquisa_rigorosa.md)
- **Classes explícitas**: separar fato, resultado empírico, inferência, hipótese, decisão e desconhecido
- **Fontes e contraprova**: priorizar fontes primárias, registrar escopo e procurar evidência contrária
- **Volatilidade**: datar consultas e revalidar preço, funcionalidade, política, biblioteca e norma na janela definida
- **Refutabilidade**: toda hipótese material deve ter métrica, teste e condição de refutação
- **Ordem de revisão**: seguir a [fila cronológica dos estudos](planejamento/fila_revisao_cronologica.md)
- **Pragmatismo**: converter evidência em decisão ou experimento, sem apresentar decisão interna como fato externo

## Contato

Pesquisa realizada para o projeto **ACI Arena**.
