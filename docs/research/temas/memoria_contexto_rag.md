# Memória, contexto e RAG

> **Revisão de abordagem — 12/08/2026:** o baseline é contexto explícito + busca lexical com proveniência. FTS, símbolos e vetor entram por ablação; memória é afirmação com origem/TTL, não verdade persistente. Ver [RAT-07](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-07--memória-contexto-e-rag).

## 1. Descrição
Recupera informação relevante do projeto e registra conhecimento persistente.

## 2. Importância para a plataforma
Janela do modelo não equivale a compreensão do repositório.

## 3. Ferramentas relacionadas
pgvector, Qdrant, tree-sitter, LSP, embeddings.

## 4. Abordagens existentes
Busca híbrida, memória hierárquica e sumarização.

## 5. Grau de maturidade
Parcialmente maduro.

## 6. Tecnologias recomendadas
PostgreSQL/pgvector, SQLite FTS local, tree-sitter e LSP.

## 7. Riscos e desafios
Índice obsoleto e memória contaminada.

## 8. Oportunidades de inovação
Memória com proveniência, confiança, TTL e aprovação.

## 9. Próximos passos
Indexar repo de referência e medir recall.

## 10. Referências
https://github.com/pgvector/pgvector; https://tree-sitter.github.io/tree-sitter/
