# Indexação de codebase

> **Revisão de abordagem — 12/08/2026:** a adoção será incremental (`rg` → parser → símbolos → grafo → vetor), e cada camada precisa melhorar consulta/tarefa concreta com política de frescor. Ver [RAT-08](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-08--indexação-de-codebase).

## 1. Descrição
Converte arquivos, símbolos e relações em índices lexicais, estruturais e vetoriais.

## 2. Importância para a plataforma
Viabiliza monorepos e tarefas multi-arquivo.

## 3. Ferramentas relacionadas
tree-sitter, LSP, ripgrep, SCIP, pgvector.

## 4. Abordagens existentes
Indexação incremental por hash e dependência.

## 5. Grau de maturidade
Maduro em busca; entendimento semântico é parcial.

## 6. Tecnologias recomendadas
AST + símbolos LSP + FTS + embeddings.

## 7. Riscos e desafios
Linguagens incompletas, arquivos gerados e custo.

## 8. Oportunidades de inovação
Grafo de impacto para selecionar testes e arquivos.

## 9. Próximos passos
Benchmark em monorepo real.

## 10. Referências
https://microsoft.github.io/language-server-protocol/
