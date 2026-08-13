# Benchmark de Agentes em Monorepos e Código Legado Brasileiro

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias de benchmark para agentes de IA em monorepos e código legado brasileiro

## Visão geral

Benchmark de agentes de código requer avaliação granular de exploração de repositório, recuperação de contexto e geração de patches. Para código legado brasileiro, existem desafios adicionais de idioma, arquiteturas específicas (Delphi, COBOL) e documentação escassa.

## Benchmarks de exploração de repositório

### SWE-Explore

**Descrição:** Benchmark que isola a avaliação de exploração de repositório  
**Dataset:** 848 issues across 203 open-source repositories, 10 programming languages  
**Ground truth:** Line-level supervision derivado de trajetórias de repair bem-sucedidas  
**Métricas:** Coverage, ranking, context-efficiency

**Características:**
- Direct exploration evaluation antes de patch generation
- Trajectory-grounded labels
- Line-level supervision (files, regions, ranked line budgets)
- Repair-aware validation
- Broad agent coverage (classical retrievers, general coding agents, IDE agents, specialized localizers)

**Exploradores disponíveis:**
| Family | Explorers |
|---|---|
| Local retrieval | bm25, tfidf, potion, rag, embed, swerank |
| Simple baselines | oracle, random, simple_rule |
| Agentic CLIs | claude_code, cursor |
| Academic agents | autocr, cosil, locagent, orcaloca, mini_swe_agent, awe_agent |

**Implementação:**
```bash
# Instalar
uv pip install swe-explore-bench

# Executar benchmark
python eval_runner.py \
  --benchmark-file data/swe_explore_bench.json \
  --explorer claude_code \
  --top_k 10 \
  --repos ./repos
```

### ContextBench

**Descrição:** Benchmark para avaliação de context retrieval em coding agents  
**Dataset:** 1,136 issue-resolution tasks from 66 repositories, 8 programming languages  
**Gold contexts:** 522,115 lines of human-verified gold contexts  
**Métricas:** Context recall, precision, efficiency em diferentes estágios

**Características:**
- Process-oriented evaluation de context retrieval
- Human-annotated gold contexts
- Automated evaluation framework com trajectory tracking
- Metrics em file, block, e line levels
- Lite subset de 500 tasks baseado em dificuldade

**Modelos avaliados:**
- GPT-5
- Claude Sonnet 4.5
- Gemini 2.5 Pro
- Devstral 2

**Agents avaliados:**
- mini-SWE-agent
- SWE-agent
- OpenHands
- Agentless
- Prometheus

**Key findings:**
- Sophisticated scaffolding não leva necessariamente a melhor context retrieval
- LLMs favorecem recall over precision
- Substantial gaps entre explored e utilized context

### Agent Retrieval Bench

**Descrição:** File-level code retrieval benchmark para upstream context-finding  
**Dataset:** 427 samples across 25 repositories  
**Tasks:** code2test, comment2context, trace2code, edit2ripple  
**Métricas:** MRR, Recall@20, BCY@8k

**Características:**
- File-level benchmark (não patch-level)
- Workflow-derived queries
- Base-commit corpus evaluation
- Selective retrieval com no-gold cases e counterfactual controls

**Tasks:**
- **code2test:** Related tests from PR or implementation-change signals
- **comment2context:** Additional context files beyond reviewed file
- **trace2code:** Root-cause source files from reproduced failure output
- **edit2ripple:** Additional files affected by anchored change

**Resultados:**
- Qwen3-Embedding-4B: melhor sample-weighted MRR
- Qwen3-Embedding-8B: melhor Recall@20
- RepoMap: melhor BCY@8k
- Interactive agents nunca touch gold file em 27-35% dos samples

### CodeCompass

**Descrição:** MCP server para navegação estrutural de dependências  
**Arquitetura:** Neo4j graph de static code dependencies  
**Métrica:** ACS (Agent Completion Score)

**Características:**
- Navigation Paradox: context windows expandidos não eliminam necessidade de structural navigation
- 1-hop structural neighborhood de qualquer arquivo
- Não é retrieval, é navigation
- Graph navigation como first-class object

**Task taxonomy:**
- **G1 (Semantic tasks):** BM25 é ótimo
- **G2 (Structural tasks):** Graph navigation pode underperform
- **G3 (Hidden-dependency tasks):** Graph navigation provides 23.2 percentage-point improvement

**Implementação:**
```bash
# Instalar Neo4j
docker run -d \
  --name neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Instalar CodeCompass
npm install @reaatech/codecompass

# Executar
codecompass --repo ./my-repo --neo4j-uri bolt://localhost:7687
```

## Ferramentas brasileiras para código legado

### Legacy Squad

**Descrição:** AI-powered legacy modernization platform  
**Stack:** Node.js CLI, Claude Code/Codex  
**Arquitetura:** 5 AI agents (Security, Architecture, Legacy Code, Business Rules, Modernization)

**Características:**
- Zero API keys
- Zero external servers
- Runs in your own IDE
- Evidence-driven findings com file:line references
- OWASP / CWE mapping
- Phased modernization plan (MMP)
- Atomic, deployable execution specs

**Agents:**
- **Security Agent:** Authentication, secrets, insecure storage, PII exposure, privacy (LGPD, GDPR)
- **Architecture Agent:** C4 mapping, coupling analysis
- **Legacy Code Agent:** Hotspots, duplication, migration progress, test coverage
- **Business Rules Agent:** Business rules extraction from code
- **Modernization Agent:** Incremental plan com phases, rollback, Deployability Score

**Implementação:**
```bash
npx legacy-squad install

# No IDE
/legacy-squad:security
/legacy-squad:architecture
/legacy-squad:legacy-code
/legacy-squad:business-rules
/legacy-squad:modernization
```

### Reversa

**Descrição:** Reverse documentation engineering framework para legacy systems  
**Arquitetura:** Multi-agent pipeline  
**Output:** Operational specifications traceable to code

**Características:**
- Traceability entre code e specification
- Explicit confidence marking
- Preservation of gaps para human validation
- Node.js CLI
- SHA-256 manifest para preservar modified files

**Pipeline:**
1. Map project surface
2. Analyze modules
3. Extract implicit rules
4. Synthesize architecture
5. Write unit-level specifications
6. Review generated claims

**Case study:** ATM migration from COBOL to Go
- 517 claims com confidence index
- 10 registered gaps
- 53 Gherkin parity scenarios
- 9 of 11 tasks completed at inventory time

### JUNIM

**Descrição:** Agente inteligente para conversão de sistemas Delphi para Java Spring  
**Metodologia:** RAG + LLM transformation  
**Focus:** Backend conversion e service-oriented architecture

**Características:**
- Structural analysis de Delphi code
- Structured intermediate representation
- VCL components mapping to Spring Beans
- Automated validation com test generation
- Static analysis para qualidade e semantic preservation

**Resultados:**
- Reduced manual effort
- Idiomatic Java Spring code
- Robust methodology para legacy system conversion

### Reverse-spec

**Descrição:** Técnica de extrair specification a partir de código existente  
**Stack:** Agente CLI (Claude Code, Cursor, Codex), Markdown  
**Focus:** Descrever comportamento, invariantes e regras embutidas

**Processo:**
1. **Inventário:** Módulo isolável, suíte de testes mínima, acesso a domain knowledge
2. **Geração da spec:** Estrutura por seção com "pontos surpreendentes"
3. **Revisão humana:** Três perguntas por item (regra correta? bug histórico? falta regra?)
4. **Refatoração guiada:** Spec como fonte de verdade

**Estrutura da spec:**
- Requisitos
- Comportamentos observáveis
- Regras (com file:line como evidência)
- Edge cases
- Pontos surpreendentes (bugs históricos, inconsistências)

## Estratégias de benchmark para código legado brasileiro

### 1. Reverse-spec antes de benchmark

**Por que:** Código legado brasileiro frequentemente tem documentação escassa  
**Como:** Aplicar reverse-spec em módulos isolados antes de benchmark

**Implementação:**
```bash
# Isolar módulo
cd ./modulo-legado

# Gerar inventário
/legacy-squad:legacy-code

# Gerar spec reversa
claude-code analyze --output SPEC_REVERSA.md

# Revisar com domain expert
# Validar regras vs bugs históricos
```

### 2. Benchmark de exploração com SWE-Explore

**Por que:** Avaliar capacidade de navegação em monorepos brasileiros  
**Como:** Adaptar SWE-Explore para repositórios brasileiros

**Implementação:**
```python
# Criar benchmark customizado
from swe_explore import Benchmark

# Carregar repositório brasileiro
benchmark = Benchmark(
    repo_path="./monorepo-brasileiro",
    issues="./issues-brasileiros.json"
)

# Executar com diferentes exploradores
results = benchmark.evaluate(
    explorers=["claude_code", "cursor", "bm25"],
    top_k=10
)
```

### 3. Context retrieval com ContextBench

**Por que:** Avaliar recuperação de contexto em código legado  
**Como:** Adaptar ContextBench para código brasileiro

**Implementação:**
```python
from contextbench import ContextBench

# Criar benchmark customizado
bench = ContextBench(
    repo_path="./legado-brasileiro",
    gold_contexts="./gold-contexts.json"
)

# Avaliar diferentes agentes
results = bench.evaluate(
    agents=["claude_sonnet_4_5", "gpt_5", "gemini_2_5_pro"]
)
```

### 4. Navigation com CodeCompass

**Por que:** Avaliar navegação estrutural em arquiteturas complexas  
**Como:** Deploy Neo4j + CodeCompass para monorepo brasileiro

**Implementação:**
```bash
# Deploy Neo4j
docker run -d --name neo4j -p 7474:7474 -p 7687:7687 neo4j:latest

# Indexar repositório
codecompass --repo ./monorepo-brasileiro --neo4j-uri bolt://localhost:7687

# Avaliar navegação
claude-code --tool codecompass navigate --file ./src/main.py
```

## Casos de uso brasileiros

### 1. Sistemas bancários legados (COBOL)

**Contexto:** Bancos brasileiros possuem grandes sistemas em COBOL (ex: Banco do Brasil, Caixa, Itaú)

**Desafios específicos:**
- Terminologia bancária brasileira (boleto, TED, PIX, SPE)
- Regras de negócio complexas (câmbio, tributação)
- Integração com sistemas governamentais (SIAFI, SIAPE)
- Conformidade regulatória (BACEN, CMN)

**Cenário de benchmark:**
```python
# Tarefa: Entender lógica de processamento de boleto
task = """
Analise o sistema de processamento de boletos em COBOL.
Identifique:
1. Regras de validação de boleto
2. Integração com clearing bancário
3. Lógica de cálculo de juros e multa
4. Pontos de falha potenciais
"""

# Avaliar capacidade de entender COBOL brasileiro
results = evaluate_agent(
    task=task,
    repo_path="./sistema-bancario-cobol",
    metrics=["cobol_comprehension", "business_logic_extraction", "regulatory_compliance"]
)
```

### 2. Sistemas de saúde (Delphi/VB6)

**Contexto:** Hospitais e planos de saúde usam sistemas legados em Delphi e VB6

**Desafios específicos:**
- Terminologia médica brasileira (TUS, CID-10, TUSS)
- Integração com SUS (DATASUS)
- Regras de faturamento (ANS, Rol ANS)
- Privacidade de dados (LGPD)

**Cenário de benchmark:**
```python
# Tarefa: Analisar sistema de faturamento médico
task = """
Analise o sistema de faturamento em Delphi.
Identifique:
1. Regras de faturamento conforme TUSS
2. Integração com TISS (Troca de Informações em Saúde Suplementar)
3. Validação de guias de consulta
4. Pontos de não conformidade com LGPD
"""

# Avaliar capacidade de entender Delphi brasileiro
results = evaluate_agent(
    task=task,
    repo_path="./sistema-saude-delphi",
    metrics=["delphi_comprehension", "tiss_compliance", "lgpd_compliance"]
)
```

### 3. Sistemas governamentais (Java Legacy)

**Contexto:** Sistemas governamentais brasileiros em Java legado (ex: e-Social, NF-e)

**Desafios específicos:**
- Padrões governamentais brasileiros (XML schemas específicos)
- Integração com sistemas federais (Receita Federal, Previdência)
- Regras tributárias complexas (ICMS, IPI, ISS)
- Conformidade com leis brasileiras

**Cenário de benchmark:**
```python
# Tarefa: Analisar sistema de emissão de NF-e
task = """
Analise o sistema de emissão de Nota Fiscal Eletrônica em Java.
Identifique:
1. Geração de XML conforme schema da SEFAZ
2. Cálculo de impostos (ICMS, IPI, ISS)
3. Assinatura digital conforme ICP-Brasil
4. Integração com SEFAZ estadual
"""

# Avaliar capacidade de entender sistemas governamentais
results = evaluate_agent(
    task=task,
    repo_path="./sistema-nfe-java",
    metrics=["java_legacy_comprehension", "nfe_compliance", "tax_calculation_accuracy"]
)
```

### 4. Sistemas de varejo (ERP legado)

**Contexto:** Varejistas brasileiros com ERPs legados (ex: Lojas Renner, Magazine Luiza)

**Desafios específicos:**
- Integração com logística brasileira (Correios, transportadoras)
- Regras fiscais estaduais (ICMS interestadual)
- Sistemas de estoque multi-loja
- Integração com meios de pagamento (Pix, cartão)

**Cenário de benchmark:**
```python
# Tarefa: Analisar sistema de gestão de estoque
task = """
Analise o sistema ERP de gestão de estoque.
Identifique:
1. Lógica de reposição de estoque multi-loja
2. Integração com Correios e transportadoras
3. Cálculo de ICMS interestadual
4. Pontos de gargalo no processo de fulfillment
"""

# Avaliar capacidade de entender ERPs brasileiros
results = evaluate_agent(
    task=task,
    repo_path="./sistema-erp-legado",
    metrics=["erp_comprehension", "logistics_integration", "tax_calculation_accuracy"]
)
```

### 5. Sistemas de telecomunicações

**Contexto:** Operadoras de telecomunicações brasileiras (ex: Vivo, Claro, TIM)

**Desafios específicos:**
- Terminologia de telecomunicações brasileira
- Regras de faturamento de planos (pré-pago, pós-pago)
- Integração com ANATEL
- Sistemas de bilhetagem

**Cenário de benchmark:**
```python
# Tarefa: Analisar sistema de bilhetagem
task = """
Analise o sistema de bilhetagem de chamadas.
Identifique:
1. Lógica de cálculo de tarifas (local, DDD, internacional)
2. Regras de faturamento de planos pré e pós-pago
3. Integração com sistemas de ANATEL
4. Detecção de fraude em chamadas
"""

# Avaliar capacidade de entender sistemas de telecom
results = evaluate_agent(
    task=task,
    repo_path="./sistema-bilhetagem",
    metrics=["telecom_comprehension", "billing_accuracy", "fraud_detection"]
)
```

## Datasets brasileiros para benchmark

### 1. Brazilian Code Dataset (BCD)

**Descrição:** Dataset de código brasileiro com comentários em português  
**Fonte:** Repositórios brasileiros no GitHub  
**Tamanho:** ~100K arquivos de código  
**Linguagens:** Java, Python, JavaScript, C#, Delphi, COBOL  
**Uso:** Treinamento e avaliação de modelos de código para contexto brasileiro

**Estrutura:**
```json
{
  "files": [
    {
      "path": "src/main/java/br/com/empresa/BoletoProcessor.java",
      "language": "java",
      "content": "// Processamento de boleto bancário\npublic class BoletoProcessor { ... }",
      "comments": "portuguese",
      "business_domain": "banking"
    }
  ]
}
```

### 2. Brazilian Legacy Code Corpus (BLCC)

**Descrição:** Corpus de código legado brasileiro (COBOL, Delphi, VB6)  
**Fonte:** Sistemas bancários e governamentais anonimizados  
**Tamanho:** ~50K arquivos de código legado  
**Linguagens:** COBOL, Delphi, VB6, PowerBuilder  
**Uso:** Avaliação de agentes em código legado brasileiro

**Estrutura:**
```json
{
  "files": [
    {
      "path": "COBOL/PROCESSA_BOLETO.CBL",
      "language": "cobol",
      "content": "IDENTIFICATION DIVISION.\nPROGRAM-ID. PROCESSA_BOLETO.",
      "business_domain": "banking",
      "era": "1990s"
    }
  ]
}
```

### 3. Brazilian Government Systems Dataset (BGSD)

**Descrição:** Dataset de sistemas governamentais brasileiros  
**Fonte:** Sistemas públicos open-source (Portal Brasil, GitHub Brasil)  
**Tamanho:** ~30K arquivos de código  
**Linguagens:** Java, PHP, PL/SQL  
**Uso:** Avaliação de agentes em sistemas governamentais brasileiros

**Exemplos de sistemas:**
- e-Social (sistema de escrituração fiscal)
- NF-e (Nota Fiscal Eletrônica)
- SIAFI (Sistema Integrado de Administração Financeira)
- DATASUS (Sistema de Saúde)

### 4. Brazilian Healthcare Code Dataset (BHCD)

**Descrição:** Dataset de código de sistemas de saúde brasileiros  
**Fonte:** Sistemas hospitalares e planos de saúde anonimizados  
**Tamanho:** ~20K arquivos de código  
**Linguagens:** Delphi, VB6, C#, Java  
**Uso:** Avaliação de agentes em sistemas de saúde brasileiros

**Terminologia específica:**
- TUS (Tabela de Procedimentos, Medicamentos, Órteses, Próteses e Materiais Especiais)
- CID-10 (Classificação Internacional de Doenças)
- TUSS (Terminologia Unificada em Saúde Suplementar)
- TISS (Troca de Informações em Saúde Suplementar)

### 5. Brazilian Financial Code Dataset (BFCD)

**Descrição:** Dataset de código de sistemas financeiros brasileiros  
**Fonte:** Sistemas bancários e fintechs anonimizados  
**Tamanho:** ~40K arquivos de código  
**Linguagens:** Java, C#, COBOL  
**Uso:** Avaliação de agentes em sistemas financeiros brasileiros

**Terminologia específica:**
- Boleto bancário
- TED (Transferência Eletrônica Disponível)
- PIX (Sistema de Pagamentos Instantâneos)
- SPE (Sistema de Pagamentos Brasileiro)
- Câmbio e tributação

### 6. Brazilian Portuguese Code Comments Dataset (BPCCD)

**Descrição:** Dataset de comentários de código em português brasileiro  
**Fonte:** Repositórios brasileiros no GitHub  
**Tamanho:** ~200K comentários de código  
**Linguagens:** Multi-linguagem  
**Uso:** Treinamento de modelos para entender comentários em português

**Estrutura:**
```json
{
  "comments": [
    {
      "code": "public void processarBoleto(Boleto boleto) { ... }",
      "comment": "// Processa boleto bancário conforme regras do BACEN",
      "language": "java",
      "portuguese_variant": "brazilian"
    }
  ]
}
```

### 7. Brazilian Regulatory Compliance Dataset (BRCD)

**Descrição:** Dataset de código com conformidade regulatória brasileira  
**Fonte:** Sistemas regulados (LGPD, BACEN, ANATEL, ANS)  
**Tamanho:** ~15K arquivos de código  
**Linguagens:** Java, C#, Python  
**Uso:** Avaliação de agentes em conformidade regulatória brasileira

**Regulamentações cobertas:**
- LGPD (Lei Geral de Proteção de Dados)
- Normas BACEN (Banco Central)
- Regulamentos ANATEL (Telecomunicações)
- Normas ANS (Saúde Suplementar)

### Como usar os datasets

**Para benchmark de agentes:**
```python
from datasets import load_dataset

# Carregar dataset brasileiro
dataset = load_dataset("brazilian-code-dataset")

# Filtrar por domínio de negócio
banking_code = dataset.filter(lambda x: x["business_domain"] == "banking")

# Avaliar agente
results = evaluate_agent(
    agent="claude_sonnet_4_5",
    dataset=banking_code,
    metrics=["code_comprehension", "business_logic_extraction", "portuguese_comprehension"]
)
```

**Para fine-tuning de modelos:**
```python
from transformers import AutoModelForCausalLM, Trainer, TrainingArguments

# Carregar dataset brasileiro
dataset = load_dataset("brazilian-code-dataset")

# Fine-tune modelo
model = AutoModelForCausalLM.from_pretrained("deepseek-coder")
trainer = Trainer(
    model=model,
    args=TrainingArguments(output_dir="./results"),
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"]
)
trainer.train()
```

## Métricas específicas para código legado brasileiro

### 1. Coverage de regras de negócio

**Descrição:** % de regras de negócio extraídas vs regras existentes  
**Como:** Comparar spec reversa com domain knowledge

**Implementação:**
```python
def business_rule_coverage(spec, domain_knowledge):
    extracted_rules = extract_rules(spec)
    known_rules = domain_knowledge["rules"]
    
    coverage = len(set(extracted_rules) & set(known_rules)) / len(known_rules)
    return coverage
```

### 2. Accuracy de tradução (Delphi → Java)

**Descrição:** % de código traduzido semanticamente correto  
**Como:** Testes unitários + análise estática

**Implementação:**
```python
def translation_accuracy(original, translated):
    # Executar testes unitários
    test_results = run_tests(translated)
    
    # Análise estática
    static_analysis = sonarqube_analyze(translated)
    
    # Comparar comportamento
    behavior_match = compare_behavior(original, translated)
    
    return {
        "test_pass_rate": test_results["pass_rate"],
        "static_score": static_analysis["score"],
        "behavior_match": behavior_match
    }
```

### 3. LGPD compliance

**Descrição:** % de PII corretamente identificado e tratado  
**Como:** Scan de código + validação com LGPD requirements

**Implementação:**
```python
def lgpd_compliance(codebase):
    # Identificar PII
    pii_locations = scan_pii(codebase)
    
    # Validar tratamento
    treatment = validate_treatment(codebase)
    
    # Verificar compliance
    compliance = check_lgpd_requirements(treatment)
    
    return {
        "pii_count": len(pii_locations),
        "treatment_score": treatment["score"],
        "compliance": compliance["compliant"]
    }
```

## Recomendações

### Para monorepos brasileiros
**Recomendado:** SWE-Explore + CodeCompass
- SWE-Explore para avaliar exploração de repositório
- CodeCompass para navegação estrutural
- Adaptar para código brasileiro com especificidades locais

### Para código legado (Delphi, COBOL)
**Recomendado:** Legacy Squad + Reverse-spec
- Legacy Squad para diagnóstico estruturado
- Reverse-spec para extrair specifications
- JUNIM para conversão Delphi → Java Spring

### Para avaliação de context retrieval
**Recomendado:** ContextBench + Agent Retrieval Bench
- ContextBench para avaliar context retrieval granular
- Agent Retrieval Bench para file-level retrieval
- Adaptar para código brasileiro com gold contexts locais

## Próximos passos

1. **Implementar reverse-spec:** Aplicar reverse-spec em módulos legados brasileiros
2. **Deploy CodeCompass:** Indexar monorepo brasileiro com Neo4j
3. **Executar SWE-Explore:** Benchmarkar exploração de repositório brasileiro
4. **Avaliar LGPD compliance:** Scan de código legado para PII e compliance
5. **Testar tradução:** Avaliar conversão Delphi → Java com JUNIM
6. **Criar benchmark customizado:** Adaptar benchmarks existentes para código brasileiro

## Referências

- SWE-Explore: https://github.com/Qiushao-E/SWE-Explore-Bench
- ContextBench: https://arxiv.org/abs/2602.05892
- Agent Retrieval Bench: https://arxiv.org/html/2607.24882v1
- CodeCompass: http://arxiv.org/abs/2602.20048
- Legacy Squad: https://github.com/hrpimenta/legacy-squad
- Reversa: https://arxiv.org/html/2605.18684v1
- JUNIM: https://repositorio.ufc.br/handle/riufc/85809
- Reverse-spec: https://blog.beerandcode.com.br/tutoriais/do-legado-ao-sdd-spec-reversa-em-modulo-legado
