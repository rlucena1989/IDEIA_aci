# Conformidade Regulatória em IA (EU AI Act)

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Analisar requisitos de conformidade do EU AI Act e plano de adaptação

## Visão geral

O EU AI Act (Regulation (EU) 2024/1689) é o primeiro framework legal abrangente sobre IA mundial. Segue uma abordagem baseada em risco: quanto maior o risco de causar dano à sociedade, mais estritas são as regras.

## Estrutura do EU AI Act

### Categorias de risco

#### 1. Risco inaceitável (Unacceptable risk)
**Status:** Proibido desde 2 de fevereiro de 2025

**Práticas proibidas (9):**
1. Manipulação e engano baseados em IA prejudiciais
2. Exploração de vulnerabilidades baseadas em IA prejudiciais
3. Social scoring
4. Avaliação ou predição de risco de ofensa criminal individual
5. Scraping não direcionado da internet ou material CCTV para criar ou expandir bancos de dados de reconhecimento facial
6. Reconhecimento de emoções em locais de trabalho e instituições educacionais
7. Categorização biométrica para deduzir certas características protegidas
8. Identificação biométrica remota em tempo real para fins de aplicação da lei em espaços publicamente acessíveis
9. Sistemas de IA que geram conteúdo sexualmente explícito e íntimo não consensual ou material de abuso sexual infantil (CSAM), como apps de 'nudificação' de IA

**Proibições 1-8:** Efetivas desde fevereiro de 2025  
**Proibição 9:** Efetiva desde dezembro de 2026

#### 2. Risco alto (High risk)
**Status:** Aplicável a partir de 2 de dezembro de 2027 (sistemas de IA do Anexo III) ou 2 de agosto de 2028 (sistemas de IA em produtos regulamentados)

**Casos de uso de alto risco:**
- Componentes de segurança de IA em infraestruturas críticas (transporte, etc.)
- Soluções de IA usadas em instituições educacionais (acesso à educação, pontuação de exames)
- Componentes de segurança de IA baseados em produtos (cirurgia robótica assistida por IA)
- Ferramentas de IA para emprego, gestão de trabalhadores e acesso ao autoemprego (classificação de CVs para recrutamento)
- Casos de uso de IA para acesso a serviços privados e públicos essenciais (credit scoring)
- Sistemas de IA usados para identificação biométrica remota, reconhecimento de emoção e categorização biométrica
- Casos de uso de IA em aplicação da lei que podem interferir em direitos fundamentais (avaliação da confiabilidade de evidências)
- Casos de uso de IA em migração, asilo e controle de fronteiras (exame automatizado de vistos)
- Soluções de IA usadas na administração da justiça e processos democráticos (preparação de decisões judiciais)

**Requisitos para sistemas de alto risco:**
- Avaliação de risco e sistemas de mitigação adequados
- Alta qualidade dos datasets que alimentam o sistema para minimizar riscos de resultados discriminatórios
- Logging de atividade para garantir rastreabilidade de resultados
- Documentação detalhada fornecendo todas as informações necessárias sobre o sistema e seu propósito
- Informações claras e adequadas ao deployer
- Medidas apropriadas de supervisão humana
- Alto nível de robustez, cybersecurity e accuracy

#### 3. Risco limitado (Limited risk)
**Status:** Aplicável a partir de 2 de agosto de 2026

**Obrigações de transparência:**
- Chatbots: informar usuários que estão interagindo com uma máquina
- Sistemas que geram conteúdo: informar que o conteúdo foi gerado por IA
- Conteúdo gerado por IA deve ser identificável
- Deep fakes e texto publicado com o propósito de informar o público sobre matérias de interesse público devem ser claramente e visivelmente rotulados

#### 4. Risco mínimo ou nenhum (Minimal or no risk)
**Status:** Sem obrigações específicas

**Exemplos:**
- Jogos habilitados por IA
- Filtros de spam
- Recomendações de produtos personalizadas
- Chatbots de atendimento ao cliente

## Obrigações de providers

### Para sistemas de IA de alto risco

**Artigo 16: Obrigações de providers de sistemas de IA de alto risco**

Providers devem:
1. Garantir que seus sistemas de IA de alto risco estejam em conformidade com os requisitos
2. Indicar nome, marca registrada ou marca comercial e endereço de contato
3. Ter um sistema de gestão de qualidade em conformidade com o Artigo 17
4. Manter a documentação referida no Artigo 18
5. Manter os logs automaticamente gerados pelo sistema de IA
6. Garantir que o sistema de IA passe pelo procedimento de avaliação de conformidade relevante
7. Elaborar uma declaração de conformidade da UE
8. Afixar a marcação CE ao sistema de IA
9. Cumprir as obrigações de registro
10. Tomar as ações corretivas necessárias
11. Demonstrar a conformidade mediante solicitação fundamentada de autoridade nacional competente
12. Garantir que o sistema de IA cumpra os requisitos de acessibilidade

### Sistema de gestão de qualidade (Artigo 17)

**Requisitos:**
- Estratégia de conformidade regulatória
- Técnicas de gestão de riscos
- Técnicas de design e desenvolvimento
- Sistema de gestão de dados e dados de treinamento
- Técnicas de registro e rastreamento
- Transparência e fornecimento de informações
- Supervisão humana
- Robustez, accuracy e cybersecurity
- Qualidade do sistema de IA antes e após o lançamento
- Procedimentos de pós-market monitoring

### Documentação (Artigo 18)

**Requisitos:**
- Documentação técnica deve ser elaborada antes do sistema ser colocado no mercado
- Deve ser mantida atualizada
- Deve demonstrar conformidade com os requisitos
- Deve conter elementos mínimos especificados

### Logging (Artigo 19)

**Requisitos:**
- Logs automaticamente gerados devem ser mantidos
- Período apropriado ao propósito do sistema
- Mínimo de 6 meses, salvo disposição em contrário da lei

## Obrigações de deployers

### Para sistemas de IA de alto risco

**Artigo 26: Obrigações de deployers de sistemas de IA de alto risco**

Deployers devem:
1. Tomar medidas técnicas e organizacionais apropriadas para garantir uso conforme instruções
2. Atribuir supervisão humana a pessoas com competência, treinamento e autoridade necessárias
3. Garantir que dados de entrada sejam relevantes e suficientemente representativos
4. Monitorar a operação do sistema de IA
5. Informar providers e autoridades sobre riscos ou incidentes
6. Manter logs automaticamente gerados por pelo menos 6 meses
7. Informar representantes dos trabalhadores e trabalhadores afetados antes do uso no local de trabalho
8. Informar indivíduos sujeitos a decisões assistidas por IA
9. Cooperar com autoridades em ações regulatórias

### Avaliação de impacto em direitos fundamentais (FRIA) (Artigo 27)

**Requisitos:**
- Deve ser conduzida antes do deployment
- Deve incluir descrição do sistema, propósito, categorias de pessoas afetadas
- Deve identificar riscos potenciais para direitos fundamentais
- Deve descrever medidas de mitigação

## Modelos de IA de propósito geral (GPAI)

### Modelos sem risco sistêmico

**Requisitos:**
- Obrigações limitadas, como obrigações de transparência
- Documentação técnica
- Política de conformidade com direitos autorais

### Modelos com risco sistêmico

**Requisitos adicionais:**
- Avaliação e mitigação de riscos sistêmicos
- Garantir cybersecurity adequada
- Relatório de incidentes graves
- Garantir energia computacional eficiente
- Documentação técnica adicional

## Timeline de implementação

### 2025
- **2 de fevereiro:** Proibições 1-8 entram em vigor
- **2 de agosto:** Capítulos I e II (proibições), Capítulo III Seção 4, Capítulo V, Capítulo VII, Capítulo XII

### 2026
- **2 de agosto:** Transparência para sistemas de IA limitados, regras para modelos GPAI
- **2 de dezembro:** Proibição 9 (conteúdo sexualmente explícito não consensual)
- **2 de agosto:** Obrigações de providers de sistemas de alto risco (exceto produtos regulamentados)

### 2027
- **2 de dezembro:** Regras para sistemas de alto risco do Anexo III
- **2 de agosto:** Obrigações de providers de sistemas de alto risco em produtos regulamentados
- **2 de agosto:** Providers de modelos GPAI colocados no mercado antes de 2 de agosto de 2025 devem estar em conformidade

### 2028
- **2 de agosto:** Regras para sistemas de alto risco em produtos regulamentados

### 2030
- **2 de agosto:** Providers e deployers de sistemas de alto risco usados por autoridades públicas devem estar em conformidade
- **31 de dezembro:** Sistemas de IA componentes de sistemas de TI de grande escala devem estar em conformidade

## Aplicação para agentes de coding

### Classificação de risco

**Provavelmente risco limitado:**
- Agentes de coding que geram código
- Chatbots de assistência técnica
- Sistemas de geração de código

**Poderia ser risco alto se:**
- Usado para decisões de emprego (classificação de CVs)
- Usado em infraestrutura crítica (sistemas de segurança)
- Usado em educação (pontuação de exames)
- Usado para avaliação de evidências em aplicação da lei

### Obrigações aplicáveis

**Para agentes de coding (risco limitado):**
- Transparência: informar usuários que estão interagindo com IA
- Identificação: conteúdo gerado por IA deve ser identificável
- Rotulagem: deep fakes e texto público devem ser rotulados

**Para agentes de coding em contextos de alto risco:**
- Todos os requisitos de sistemas de alto risco
- Sistema de gestão de qualidade
- Documentação técnica
- Logging
- Supervisão humana
- Avaliação de conformidade

## Plano de conformidade

### Fase 1: Avaliação (imediato)

1. **Classificar sistema de IA:**
   - Determinar categoria de risco
   - Identificar se é sistema de alto risco
   - Verificar se é modelo GPAI

2. **Mapear obrigações:**
   - Listar obrigações aplicáveis
   - Identificar prazos de conformidade
   - Priorizar ações

### Fase 2: Implementação (curto prazo)

**Para risco limitado:**
1. Implementar transparência
   - Adicionar aviso de IA em chatbots
   - Adicionar metadados de identificação em código gerado
   - Implementar rotulagem de conteúdo

**Para risco alto:**
1. Implementar sistema de gestão de qualidade
2. Criar documentação técnica
3. Implementar logging
4. Implementar supervisão humana
5. Conduzir avaliação de conformidade
6. Elaborar declaração de conformidade
7. Afixar marcação CE
8. Registrar em banco de dados da UE

### Fase 3: Monitoramento (contínuo)

1. **Monitorar operação:**
   - Monitorar logs
   - Identificar riscos e incidentes
   - Informar autoridades quando necessário

2. **Atualizar documentação:**
   - Manter documentação atualizada
   - Atualizar avaliação de risco
   - Revisar medidas de mitigação

## Recomendações

### Para desenvolvimento

1. **Design para conformidade:**
   - Considerar requisitos do EU AI Act desde o design
   - Implementar transparência por padrão
   - Documentar decisões de design

2. **Testes de conformidade:**
   - Testar contra requisitos de alto risco
   - Validar qualidade de dados
   - Verificar robustez e accuracy

### Para deployment

1. **Transparência:**
   - Informar usuários sobre uso de IA
   - Identificar conteúdo gerado por IA
   - Rotular deep fakes

2. **Supervisão humana:**
   - Implementar supervisão humana adequada
   - Treinar pessoal
   - Definir autoridade e responsabilidade

### Para operação

1. **Logging:**
   - Implementar logging automático
   - Manter logs por pelo menos 6 meses
   - Garantir rastreabilidade

2. **Monitoramento:**
   - Monitorar operação contínua
   - Identificar riscos e incidentes
   - Informar autoridades quando necessário

## Próximos passos

1. **Classificar sistema:** Determinar categoria de risco do IDEIA AI
2. **Mapear obrigações:** Identificar obrigações aplicáveis
3. **Implementar transparência:** Adicionar avisos de IA e identificação
4. **Criar documentação:** Documentar sistema e processos
5. **Implementar logging:** Implementar logging automático
6. **Testar conformidade:** Validar conformidade com requisitos
7. **Registrar:** Registrar em banco de dados da UE se aplicável

## Referências

- EU AI Act: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02024R1689-20260727
- Implementation Guidance: https://futurium.ec.europa.eu/system/files/2026-07/Implementation-Guidance-EU-AI-Act_1.pdf
- AI Act Service Desk: https://ai-act-service-desk.ec.europa.eu/en/faq
- Shaping Europe's Digital Future: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
