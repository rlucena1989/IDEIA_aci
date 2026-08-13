# Fixture de Benchmark

**Data:** 11 de agosto de 2026  
**Status:** Fixture criado, pronto para execução manual

## Estrutura do fixture

```
benchmark_fixture/
├── package.json
├── src/
│   ├── index.js (servidor Express)
│   ├── email-validator.js (BUG: validação incorreta)
│   ├── pagination.js (paginação correta)
│   └── email-validator.test.js (testes)
├── run_t01.js (script para executar T01)
└── results/ (resultados do benchmark)
```

## Tarefas do benchmark

### T01: Compreensão (read-only)
- **Objetivo:** Explicar estrutura e fluxo principal
- **Critério:** Relatório cita arquivos/símbolos corretos; nenhum arquivo alterado
- **Script:** `node run_t01.js`
- **Status:** Script criado, requer execução manual com ferramenta

### T02: Bugfix
- **Objetivo:** Corrigir bug de validação de email
- **Critério:** Teste de regressão falha antes e passa depois
- **Arquivo alvo:** `src/email-validator.js`
- **Bug:** Validação apenas verifica se tem @, não formato completo
- **Status:** Fixture pronto, requer execução manual

### T03: Feature backend
- **Objetivo:** Adicionar endpoint de paginação
- **Critério:** Contrato HTTP, validação, paginação e testes passam
- **Status:** Paginação já implementada, pode ser usada como teste de regressão

### T04-T10: Outras tarefas
- **Status:** Requerem implementação adicional no fixture

## Como executar

### Pré-requisitos
```bash
cd benchmark_fixture
npm install
```

### Executar T01
```bash
node run_t01.js
```

O script irá:
1. Executar testes baseline
2. Registrar hash do commit
3. Aguardar intervenção manual para iniciar ferramenta
4. Registrar métricas em JSON

### Executar T02 manualmente
1. Clonar fixture para diretório temporário
2. Iniciar ferramenta (OpenCode, Freebuff, etc.)
3. Pedir para corrigir bug em `src/email-validator.js`
4. Executar testes: `npm test`
5. Verificar que teste de regressão passa
6. Registrar métricas manualmente

## Limitações de autonomia

O benchmark requer intervenção manual porque:
1. Ferramenta (OpenCode, Freebuff, etc.) precisa ser iniciada manualmente
2. Interação com a ferramenta não pode ser automatizada sem API
3. Validação de critérios de aceite requer revisão humana
4. Custo de API precisa ser monitorado manualmente

## Próximos passos

Para execução completa do benchmark:
1. Instalar ferramenta de benchmark (OpenCode, Freebuff, etc.)
2. Executar T01-T10 sequencialmente
3. Registrar métricas em JSON
4. Validar com `validate_benchmark.mjs`
5. Gerar relatório de resultados
