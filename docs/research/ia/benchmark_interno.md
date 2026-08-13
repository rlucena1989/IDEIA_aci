# Benchmark interno de engenharia agentic

## Objetivo
Medir se a plataforma melhora a entrega de software real, e não apenas a capacidade de gerar trechos sintéticos.

## Dataset inicial
Criar um conjunto versionado de 40 tarefas em repositórios autorizados:

| Classe | Quantidade | Exemplo |
|---|---:|---|
| Bugfix | 8 | reproduzir e corrigir falha |
| Feature | 8 | endpoint, UI ou regra de negócio |
| Refatoração | 6 | modularização sem mudança de comportamento |
| Testes | 5 | cobertura de módulo existente |
| Dependências | 4 | atualização com compatibilidade |
| Documentação | 3 | README/API/ADR |
| Segurança | 3 | corrigir secret/SAST |
| Legado/monorepo | 3 | mudança com dependências cruzadas |

Cada tarefa deve ter commit inicial, descrição, critérios de aceite, testes de referência e solução humana revisada. Não incluir secrets ou dados pessoais.

## Métricas
- taxa de conclusão sem intervenção;
- taxa de conclusão com intervenção;
- testes de aceite e regressão;
- qualidade do diff por revisão cega;
- tempo até PR aceitável;
- tokens, custo e compute;
- número de retries e tool calls;
- rollback e incidentes;
- arquivos alterados fora do escopo;
- taxa de aprovação de plano/diff.

## Protocolo
1. Fixar commit, ambiente, modelo, prompt, tools e orçamento.
2. Executar baseline manual e agente concorrente quando legalmente possível.
3. Repetir tarefas estocásticas pelo menos três vezes.
4. Registrar falhas e não apenas o melhor resultado.
5. Separar sucesso funcional, qualidade, segurança e custo.
6. Publicar dataset, versão e limitações internas.

## Gates sugeridos
- **Bloqueante:** teste de aceite falha, secret detectado, alteração fora do workspace ou comando não autorizado.
- **Revisão:** aumento de complexidade, cobertura reduzida, diff amplo ou custo acima do p95.
- **Aprovação:** testes passam, diff dentro do escopo e reviewer humano aceita.

## Critério de melhoria
Uma release é superior quando aumenta a taxa de tarefas aceitáveis sem degradar segurança, regressão, custo por sucesso ou tempo p95. Comparar intervalos e distribuição, não apenas média.

## Referências
- https://www.swebench.com/
- https://github.com/SWE-agent/SWE-agent
- https://github.com/All-Hands-AI/OpenHands
