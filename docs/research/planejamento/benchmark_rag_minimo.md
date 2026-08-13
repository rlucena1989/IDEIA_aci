# Benchmark de RAG — protocolo mínimo

## Objetivo
Medir se a recuperação fornece contexto correto, suficiente e atualizado sem inflar custo.

## Corpus
Usar três repositórios autorizados ou sintéticos:
- pequeno: até 10 mil arquivos;
- médio: 10–100 mil arquivos;
- monorepo/legado: relações cruzadas e documentação incompleta.

## Consultas gold
Criar 30 perguntas com respostas/referências conhecidas:
- localização de símbolo;
- dependência entre módulos;
- fluxo de API;
- teste relacionado;
- configuração de build;
- impacto de mudança;
- decisão documentada;
- causa de erro.

## Variantes
- busca lexical;
- AST/LSP;
- embeddings;
- híbrida com reranking;
- híbrida com contexto Git/terminal.

## Métricas
- recall@5 e recall@10 de arquivos/chunks relevantes;
- precisão das citações;
- p50/p95 de latência;
- tempo de indexação inicial/incremental;
- custo de embeddings;
- tokens enviados ao modelo;
- taxa de índice obsoleto;
- respostas sem evidência.

## Critério de decisão
Adotar a menor arquitetura que atingir recall e latência aceitáveis no corpus médio sem vazamento de tenant. Qdrant só entra se pgvector/SQLite não atenderem carga medida.

## Segurança
Filtrar secrets, respeitar permissões e impedir recuperação cross-project. Documentos recuperados são dados, não instruções confiáveis.
