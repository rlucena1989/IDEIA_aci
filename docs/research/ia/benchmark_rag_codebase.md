# Benchmark RAG incremental em codebases de tamanhos distintos

## Objetivo
Medir desempenho, custo e qualidade de recuperação de RAG (Retrieval-Augmented Generation) em codebases de diferentes tamanhos, com foco em indexação incremental e consultas relevantes para agentes de coding.

## Hipóteses de carga

| Tamanho | Arquivos | Linhas de código | Caso de uso |
|---|---|---|---|
| Pequeno | 1–10 mil | 50–500 mil | Projetos individuais, microserviços |
| Médio | 10–100 mil | 500 mil–5 milhões | Monorepos médios, aplicações enterprise |
| Grande | 100 mil+ | 5 milhões+ | Monorepos grandes, plataformas |

## Fixtures sintéticas

### Fixture pequena (small-repo)
- **Estrutura:** Aplicação web típica (React + Node.js)
- **Arquivos:** ~2.000 arquivos
- **Loc:** ~100 mil linhas
- **Componentes:** Frontend, backend, tests, docs
- **Fonte:** Gerar com scaffolding tool ou usar repo open source pequeno

### Fixture média (medium-repo)
- **Estrutura:** Monorepo com 3–5 serviços
- **Arquivos:** ~25.000 arquivos
- **Loc:** ~1.5 milhões de linhas
- **Componentes:** Múltiplos serviços, shared libs, infra
- **Fonte:** Monorepo open source médio (ex: Turborepo example)

### Fixture grande (large-repo)
- **Estrutura:** Plataforma enterprise
- **Arquivos:** ~150.000 arquivos
- **Loc:** ~8 milhões de linhas
- **Componentes:** Dezenas de serviços, legacy code, docs
- **Fonte:** Monorepo grande open source (ex: Microsoft VS Code, Facebook React)

## Pipeline de indexação

### 1. Filtragem
- Respeitar `.gitignore`
- Excluir binários, assets gerados, `node_modules`, `dist`, `build`
- Excluir secrets (`.env`, `.pem`, `.key`)
- Limitar tamanho de arquivo (ex: max 1MB por arquivo)
- Excluir arquivos sem extensão de código

### 2. Hash e tracking
- Calcular hash SHA-256 por arquivo
- Armazenar hash em banco de dados
- Detectar alterações por comparação de hash
- Marcar arquivos deletados para invalidação

### 3. Parsing incremental
- Parsear apenas arquivos alterados desde última indexação
- Usar tree-sitter para parsing estrutural
- Extrair: símbolos, imports, exports, classes, funções
- Mantém grafo de dependências

### 4. Chunking
- Estratégia: chunk por função/classe + contexto
- Tamanho: 500–1.000 tokens por chunk
- Overlap: 100 tokens entre chunks
- Preservar estrutura hierárquica

### 5. Embeddings
- Modelo: `text-embedding-3-small` (OpenAI) ou equivalente
- Batch size: 100 chunks por request
- Cache: embeddings em SQLite/PostgreSQL
- Invalidar embeddings de arquivos alterados

### 6. Índices híbridos
- **FTS (SQLite/PostgreSQL):** Busca textual exata
- **Índice estrutural:** Símbolos, dependências
- **Vetorial (pgvector):** Busca semântica
- **Graph:** Relações entre arquivos/símbolos

### 7. Busca e re-ranking
- Query: prompt do usuário + contexto da tarefa
- Busca híbrida: FTS + vetorial + estrutural
- Re-ranking: por relevância, proximidade no grafo
- Limite: max 10.000 tokens por contexto

## Métricas a medir

### Indexação
| Métrica | Descrição | Target |
|---|---|---|
| Tempo de indexação inicial | Tempo para indexar codebase do zero | < 5 min (pequeno), < 30 min (médio), < 2h (grande) |
| Tempo de indexação incremental | Tempo para indexar apenas alterações | < 30s (pequeno), < 2 min (médio), < 10 min (grande) |
| Memória pico | RAM usada durante indexação | < 2GB (pequeno), < 8GB (médio), < 32GB (grande) |
| Disco usado | Espaço em disco para índices | < 100MB (pequeno), < 1GB (médio), < 10GB (grande) |
| Custo de embeddings | Custo USD por indexação completa | < $0.50 (pequeno), < $5 (médio), < $50 (grande) |

### Consulta
| Métrica | Descrição | Target |
|---|---|---|
| p50 de latência | Mediana de tempo de consulta | < 100ms |
| p95 de latência | 95º percentil de tempo de consulta | < 500ms |
| Tokens recuperados | Número de tokens por contexto | < 10.000 |
| Recall@10 | % de arquivos relevantes nos top 10 | > 80% |
| Precisão@10 | % de arquivos recuperados relevantes | > 70% |
| Taxa de contexto incorreto | % de consultas com contexto irrelevante | < 10% |

### Qualidade
| Métrica | Descrição | Target |
|---|---|---|
| Tempo de invalidação | Tempo para propagar alteração | < 5s |
| Taxa de stale embeddings | % de embeddings desatualizados | < 5% |
| Vazamento entre projetos | % de resultados de outros projetos | 0% |

## Procedimento de benchmark

### Setup
1. Clonar/gerar fixtures (small, medium, large)
2. Configurar banco de dados (SQLite + pgvector)
3. Configurar modelo de embeddings
4. Implementar pipeline de indexação
5. Implementar pipeline de busca

### Execução
1. **Indexação inicial:** Medir tempo, memória, disco, custo
2. **Alterações simuladas:** Modificar 1%, 5%, 10% dos arquivos
3. **Indexação incremental:** Medir tempo de cada alteração
4. **Consultas de teste:** 100 queries por fixture
   - 50 queries de busca de função
   - 30 queries de bugfix
   - 20 queries de feature addition
5. **Avaliação manual:** Revisar qualidade de contexto para 20 queries

### Relatório
- Gráficos de tempo vs tamanho
- Gráficos de custo vs tamanho
- Tabela de recall/precisão por tipo de query
- Análise de bottlenecks
- Recomendações de otimização

## Decisão tecnológica

### Fase 1: MVP (SQLite FTS)
- **Banco:** SQLite com FTS5
- **Índice:** FTS textual + índice estrutural
- **Embeddings:** Opcional, apenas se necessário
- **Target:** Codebases pequenas/médias

### Fase 2: PostgreSQL + pgvector
- **Banco:** PostgreSQL com pgvector
- **Índice:** FTS + vetorial + estrutural
- **Embeddings:** Obrigatório
- **Target:** Codebases médias/grandes

### Fase 3: Qdrant (se necessário)
- **Banco:** Qdrant para embeddings escaláveis
- **Índice:** Vetorial otimizado para escala
- **Embeddings:** Obrigatório
- **Target:** Codebases grandes (> 500 mil arquivos)

**Regra:** Não indexar o repositório inteiro no prompt. Usar RAG para recuperar contexto relevante.

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Embeddings desatualizados | Alto | Invalidação automática por hash |
| Chunks sem relação semântica | Médio | Chunking estrutural por função/classe |
| Vazamento entre projetos | Crítico | Isolamento por project_id/tenant_id |
| Custo de reindexação alto | Médio | Indexação incremental |
| Consultas lentas em codebase grande | Alto | Índices híbridos + cache |
| Falsos positivos em busca | Médio | Re-ranking + filtros estruturais |

## Próximos passos

1. **Selecionar fixtures:** Identificar 3 repos open source ou gerar sintéticos
2. **Implementar pipeline MVP:** SQLite FTS + indexação básica
3. **Executar benchmark inicial:** Medir baseline em small-repo
4. **Expandir para pgvector:** Adicionar embeddings e busca vetorial
5. **Executar benchmark completo:** Testar small, medium, large
6. **Analisar resultados:** Identificar bottlenecks e otimizações
7. **Documentar recomendações:** Guia de arquitetura para RAG escalável

## Referências
- pgvector: https://github.com/pgvector/pgvector
- Qdrant: https://qdrant.tech
- tree-sitter: https://tree-sitter.github.io/tree-sitter/
- SQLite FTS5: https://www.sqlite.org/fts5.html
