# DPIA e Política de Privacidade — Rascunho Técnico

> Documento técnico preliminar. Não substitui revisão jurídica ou DPO.

## 1. Finalidade
A plataforma processa prompts, código, arquivos, logs, métricas, credenciais referenciadas e resultados para executar tarefas de engenharia assistida/agentic.

## 2. Dados pessoais

### Dados coletados
- Identidade e conta (nome, email, ID de usuário)
- Código e documentação enviados pelo usuário
- Prompts, respostas, tool calls, diffs e comandos
- Metadados de projeto, Git, custo e desempenho
- Telemetria, erros e auditoria
- Secrets: não devem ser coletados no prompt; referências podem ser resolvidas por secret manager

### Dados sensíveis (exemplos)
- Chaves de API (AWS, GitHub, etc.)
- Credenciais de banco de dados
- Tokens de autenticação
- Segredos de aplicação
- Informações PII (nomes, emails, endereços)

## 3. Bases legais (LGPD/GDPR)

### Bases aplicáveis
- **Execução de contrato:** Quando o usuário é cliente/pagante
- **Consentimento:** Quando o usuário opta por funcionalidades específicas
- **Interesse legítimo:** Para segurança, prevenção de fraude, melhoria do serviço
- **Obrigação legal:** Para retenção de logs para fins de auditoria

### Minimização
Coletar apenas o necessário para executar e auditar a tarefa. Desativar telemetria não essencial no modo privado.

## 4. Fluxo de dados

### Fluxo proposto
```text
Usuário -> cliente local -> policy/redaction -> provider aprovado
                                   |-> logs redigidos
                                   |-> memória/indexação por projeto
                                   |-> auditoria com retenção configurável
```

### Providers externos
- **OpenAI:** Retenção 30 dias, treinamento opcional (enterprise)
- **Anthropic:** Retenção 30 dias, não treina por default
- **Google:** Paid tier não usa dados para treinamento
- **Freebuff:** Retenção variável, ad-supported, personalização de ads
- **Trae:** Retenção 5 anos, telemetria extensiva
- **Kiro:** Retenção 60 dias (Free Tier) para abuse detection
- **OpenCode:** Não armazena código/contexto (exceto share links)

## 5. Controles técnicos

### Controles de segurança
- Classificação de dados (público, interno, confidencial, restrito)
- Redaction de secrets/PII em logs
- Provider local para dados confidenciais
- Criptografia em trânsito (TLS 1.3)
- Criptografia em repouso (AES-256)
- Isolamento por tenant/projeto
- Retenção configurável por tipo de dado
- Exclusão de prompts, embeddings, snapshots e logs
- Exportação e portabilidade de dados
- Registro de consentimento quando aplicável
- Subprocessadores e transferências documentados

### Controles de acesso
- Autenticação forte (MFA)
- Autorização baseada em roles
- Auditoria de acessos
- Logs de segurança imutáveis

## 6. Riscos identificados

### Riscos de privacidade
- **Código enviado a provider externo:** Risco de retenção e treinamento
- **Memória cross-project:** Risco de vazamento entre projetos
- **Secrets em logs:** Risco de exfiltração
- **Share links públicos:** Risco de exposição não intencional
- **Treinamento/retention do provider:** Risco de uso de dados para treinamento
- **Worker remoto comprometido:** Risco de acesso não autorizado
- **Logs excessivos de atividade humana:** Risco de privacidade

### Riscos específicos por ferramenta
- **Trae:** Retenção 5 anos, telemetria extensiva, ByteDance (China)
- **Freebuff:** Ad-supported, personalização de ads, retenção variável
- **Kiro:** Retenção 60 dias (Free Tier), abuse detection
- **OpenCode:** Share links armazenados em CDN edge
- **OmniRoute:** Chaves de API em storage.sqlite (requer hardening)

## 7. Retenção proposta

### Retenção por tipo de dado
- **Prompts/respostas:** 30 dias, configurável (zero-retention para enterprise)
- **Logs operacionais:** 30–90 dias
- **Auditoria enterprise:** Conforme obrigação contratual/legal
- **Snapshots:** 7–30 dias
- **Embeddings:** Enquanto projeto ativo e até exclusão solicitada
- **Backups:** Política separada com expiração verificável
- **Secrets:** Zero-retenção (não armazenados)

### Retenção por provider externo
- **OpenAI:** 30 dias (configurável via enterprise)
- **Anthropic:** 30 dias (não treina por default)
- **Google:** Paid tier não retém
- **Freebuff:** Variável (ver contrato)
- **Trae:** 5 anos (não recomendado para dados sensíveis)
- **Kiro:** 60 dias (Free Tier), configurável (enterprise)

## 8. Direitos do titular (LGPD/GDPR)

### Direitos implementados
- **Acesso:** Usuário pode acessar seus dados
- **Retificação:** Usuário pode corrigir dados incorretos
- **Exclusão:** Usuário pode solicitar exclusão (right to be forgotten)
- **Portabilidade:** Usuário pode exportar seus dados
- **Oposição:** Usuário pode opor-se a processamento específico
- **Restrição:** Usuário pode solicitar restrição de processamento
- **Revogação de consentimento:** Usuário pode revogar consentimento

### Processo de solicitação
1. Usuário solicita via portal ou API
2. Sistema valida identidade
3. Sistema processa solicitação (até 30 dias)
4. Sistema notifica usuário
5. Sistema registra solicitação e resultado

## 9. Subprocessadores

### Subprocessadores documentados
- **Providers de LLM:** OpenAI, Anthropic, Google, etc.
- **Infraestrutura cloud:** AWS, GCP, Azure (se aplicável)
- **Serviços de monitoramento:** Datadog, New Relic, etc. (se aplicável)
- **Serviços de autenticação:** Auth0, Okta, etc. (se aplicável)

### Transferências internacionais
- **Para EUA:** Privacy Shield ou SCCs
- **Para China:** Avaliação de risco adicional (não recomendado)
- **Para outros países:** Avaliação de adequação

## 10. Critérios antes de SaaS

### Checklist de conformidade
- [ ] DPIA revisada por DPO/jurídico
- [ ] DPA por provider (Data Processing Agreement)
- [ ] Inventário de subprocessadores
- [ ] Processo de direitos do titular implementado
- [ ] Teste cross-tenant realizado
- [ ] Plano de incidentes de segurança
- [ ] Política de exclusão verificável
- [ ] Criptografia em trânsito e repouso
- [ ] Auditoria de segurança anual
- [ ] Certificação ISO 27001 (opcional)

## 11. Recomendações

### Para desenvolvimento
- Usar providers locais (Ollama, vLLM) para dados sensíveis
- Implementar redaction de secrets em tempo real
- Configurar retenção zero para dados sensíveis
- Evitar Trae para dados corporativos
- Usar OpenCode com share disabled
- Configurar OmniRoute com REQUIRE_API_KEY=true

### Para produção
- Contratar revisão jurídica/DPO
- Implementar DPIA completa
- Assinar DPA com todos os providers
- Configurar retenção configurável por tipo de dado
- Implementar processo de direitos do titular
- Realizar auditoria de segurança anual
- Ter plano de resposta a incidentes

## 12. Próximos passos (requer revisão jurídica)

1. **Revisão jurídica:**
   - Contratar advogado especializado em LGPD/GDPR
   - Revisar DPIA completa
   - Validar bases legais
   - Revisar contratos de providers

2. **Implementação técnica:**
   - Implementar redaction de secrets
   - Configurar retenção configurável
   - Implementar processo de direitos do titular
   - Configurar criptografia em trânsito/repouso

3. **Documentação:**
   - Política de privacidade pública
   - Termos de uso
   - Política de retenção
   - Política de cookies (se aplicável)

## Referências

### Legislação
- LGPD (Lei Geral de Proteção de Dados Pessoais) - Brasil
- GDPR (General Data Protection Regulation) - União Europeia
- CCPA (California Consumer Privacy Act) - Califórnia

### Documentos de pesquisa
- Matriz de licenças: `legal/matriz_licencas_ferramentas.md`
- Freebuff: `ferramentas/freebuff.md`
- Trae: `ferramentas/freebuff_opencode_trae_kiro_antigravity_omniroute.md`
- Kiro: `ferramentas/kiro.md`
- OpenCode: `ferramentas/opencode.md`
- Antigravity: `ferramentas/antigravity.md`
- Hardening OmniRoute: `research/hardening_omniroute.md`
