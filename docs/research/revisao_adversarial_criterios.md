# Revisão Adversarial - Critérios de Avaliação

**Data:** 12 de agosto de 2026  
**Status:** Em andamento  
**Objetivo:** Critérios para revisão adversarial de todo o planejamento

## Critérios de Avaliação

### 1. Clareza e Especificidade
- **Critério:** Cada documento deve ser suficientemente específico para implementação direta
- **Teste:** Um desenvolvedor (ou LLM 20B) consegue implementar apenas lendo o documento?
- **Falha:** Conceitos vagos, instruções genéricas, falta de detalhes técnicos

### 2. Completude Técnica
- **Critério:** Cada tema deve cobrir arquitetura, implementação, gaps e referências
- **Teste:** O documento contém todos os elementos necessários para implementação?
- **Falha:** Falta de exemplos de código, arquitetura incompleta, referências insuficientes

### 3. Viabilidade de Implementação
- **Critério:** Cada tema deve ser implementável por LLM 20B com contexto limitado
- **Teste:** A complexidade é adequada para modelos locais 20B?
- **Falha:** Complexidade excessiva, dependências não documentadas, ambiguidade

### 4. Integração entre Componentes
- **Critério:** Dependências e integrações devem estar claramente definidas
- **Teste:** É possível entender como os componentes se conectam?
- **Falha:** Dependências não especificadas, integrações não documentadas

### 5. Priorização e Sequenciamento
- **Critério:** Roadmap deve ter priorização lógica e sequenciamento viável
- **Teste:** A ordem de implementação faz sentido tecnicamente?
- **Falha:** Dependências não respeitadas, sequenciamento ilógico

### 6. Gaps Competitivos
- **Critério:** Gaps devem ser reais e diferenciadores competitivos
- **Teste:** Os gaps identificados realmente diferenciam de Devin/Cursor/Windsurf?
- **Falha:** Gaps genéricos, não diferenciadores, já implementados por concorrentes

### 7. Adequação para LLM 20B
- **Critério:** Documentos devem ser otimizados para LLMs locais 20B
- **Teste:** Um LLM 20B consegue entender e implementar com contexto limitado?
- **Falha:** Contexto excessivo, instruções complexas, falta de modularidade

### 8. Consistência entre Documentos
- **Critério:** Documentos devem ser consistentes entre si
- **Teste:** Não há contradições ou inconsistências entre documentos?
- **Falha:** Contradições, inconsistências, nomenclatura diferente

### 9. Reutilização de Packages
- **Critério:** Packages copiados devem ser adequados e integráveis
- **Teste:** Os packages são realmente úteis e integráveis ao IDEIA_aci?
- **Falha:** Packages inadequados, não integráveis, obsoletos

### 10. Escalabilidade do Roadmap
- **Critério:** Roadmap deve ser escalável e realista
- **Teste:** O timeline é realista considerando recursos disponíveis?
- **Falha:** Timeline irrealista, recursos insuficientes, dependências externas

## Matriz de Avaliação

| Critério | Peso | Nota (1-5) | Observações |
|----------|------|------------|-------------|
| Clareza e Especificidade | 15% | - | - |
| Completude Técnica | 15% | - | - |
| Viabilidade de Implementação | 15% | - | - |
| Integração entre Componentes | 10% | - | - |
| Priorização e Sequenciamento | 10% | - | - |
| Gaps Competitivos | 10% | - | - |
| Adequação para LLM 20B | 10% | - | - |
| Consistência entre Documentos | 5% | - | - |
| Reutilização de Packages | 5% | - | - |
| Escalabilidade do Roadmap | 5% | - | - |

## Processo de Revisão

### Fase 1: Revisão Individual
1. Revisar cada documento P0 (14 temas)
2. Revisar cada documento P1 (9 temas)
3. Revisar cada documento P2 (4 temas)
4. Revisar síntese arquitetural
5. Revisar packages copiados
6. Revisar roadmap de implementação

### Fase 2: Revisão Integrada
1. Verificar consistência entre documentos
2. Verificar dependências e integrações
3. Verificar priorização e sequenciamento
4. Verificar adequação para LLM 20B

### Fase 3: Ajustes e Correções
1. Documentar problemas encontrados
2. Priorizar correções por impacto
3. Implementar correções críticas
4. Validar correções

## Critérios de Aprovação

- **Nota mínima geral:** 4.0/5.0
- **Nota mínima por critério:** 3.5/5.0
- **Zero críticos:** Nenhum problema crítico não resolvido
- **Consistência:** 100% de consistência entre documentos

## Próximos Passos

1. Executar revisão individual de cada documento
2. Preencher matriz de avaliação
3. Identificar problemas críticos
4. Implementar correções
5. Validar adequação para LLM 20B
