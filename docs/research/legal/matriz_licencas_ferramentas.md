# Matriz de licenças das ferramentas pesquisadas

**Data:** 11 de agosto de 2026  
**Objetivo:** Consolidar informações de licenciamento para decisões técnicas e legais sobre reuso de componentes

## Matriz de licenças

| Ferramenta | Licença | Tipo | Código público | Uso comercial | Modificação | Redistribuição | Atribuição | Notas |
|---|---|---|---|---|---|---|---|---|
| **Devin** | Proprietária | Closed source | ❌ | ✅ (com contrato) | ❌ | ❌ | N/A | Produto SaaS, sem código público |
| **Cursor** | Proprietária | Closed source | ❌ | ✅ (com contrato) | ❌ | ❌ | N/A | IDE baseado em VS Code, componentes proprietários |
| **Cline** | Apache-2.0 | Open source | ✅ | ✅ | ✅ | ✅ | ✅ | Extensão/CLI/SDK, permissivo |
| **Freebuff** | Apache-2.0 | Open source | ✅ | ✅ | ✅ | ✅ | ✅ | CLI/desktop/web, ad-supported |
| **OpenCode** | MIT | Open source | ✅ | ✅ | ✅ | ✅ | ✅ | CLI/desktop/IDE, muito permissivo |
| **Trae** | Proprietária | Closed source | ❌ | ✅ (com contrato) | ❌ | ❌ | N/A | ByteDance, termos agressivos |
| **Kiro** | Proprietária | Closed source | ❌ | ✅ (com contrato) | ❌ | ❌ | N/A | IDE Code OSS, serviços proprietários |
| **Antigravity** | Proprietária | Closed source | ❌ | ✅ (com contrato) | ❌ | ❌ | N/A | Google, plataforma fechada |
| **OmniRoute** | MIT | Open source | ✅ | ✅ | ✅ | ✅ | ✅ | Gateway local, muito permissivo |
| **IDEIA** | Proprietária | Closed source | ❌ | ❌ | ❌ | ❌ | N/A | Projeto de referência local |

## Detalhes por licença

### Apache-2.0 (Cline, Freebuff)

**Permissões:**
- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Sublicensing
- ✅ Uso privado

**Condições:**
- ⚠️ Incluir licença e copyright
- ⚠️ Indicar alterações (STATE CHANGES)
- ⚠️ NOTICE file para dependências de terceiros

**Limitações:**
- ❌ Responsabilidade por danos
- ❌ Garantia de qualquer tipo
- ❌ Uso de marcas/trademarks

**Recomendação:** Altamente permissiva, adequada para uso comercial e reuso de componentes. Revisar NOTICE file para dependências.

### MIT (OpenCode, OmniRoute)

**Permissões:**
- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Sublicensing
- ✅ Uso privado

**Condições:**
- ⚠️ Incluir licença e copyright

**Limitações:**
- ❌ Responsabilidade por danos
- ❌ Garantia de qualquer tipo

**Recomendação:** Muito permissiva, simples e curta. Ideal para reuso de componentes com mínimo de obrigações.

### Proprietária (Devin, Cursor, Trae, Kiro, Antigravity)

**Permissões:**
- ⚠️ Uso comercial apenas com contrato
- ❌ Modificação
- ❌ Distribuição
- ❌ Acesso ao código

**Condições:**
- ⚠️ Termos de serviço específicos
- ⚠️ Políticas de privacidade
- ⚠️ Limites de uso e quotas

**Limitações:**
- ❌ Engenharia reversa
- ❌ Uso de marcas/trademarks
- ❌ Cópia de funcionalidades

**Recomendação:** Usar apenas como inspiração de UX/workflows. Não copiar implementação ou componentes sem avaliação jurídica.

## Análise de compatibilidade

### Reuso de código

| Ferramenta | Pode reusar código? | Requer atribuição? | Requer NOTICE? | Risco legal |
|---|---|---|---|---|
| Cline | ✅ | ✅ | ⚠️ (dependências) | Baixo |
| Freebuff | ✅ | ✅ | ⚠️ (dependências) | Baixo |
| OpenCode | ✅ | ✅ | ❌ | Baixo |
| OmniRoute | ✅ | ✅ | ❌ | Baixo |
| Devin | ❌ | N/A | N/A | Alto |
| Cursor | ❌ | N/A | N/A | Alto |
| Trae | ❌ | N/A | N/A | Alto |
| Kiro | ❌ | N/A | N/A | Alto |
| Antigravity | ❌ | N/A | N/A | Alto |

### Inspiração de conceitos

Todas as ferramentas podem ser usadas como **inspiração** de:
- UX e workflows
- Padrões de arquitetura
- Funcionalidades e features
- Modelos de interação

**Limitação:** Não copiar implementação específica, nomes de marcas, ou elementos distintivos protegidos por direitos autorais.

## Recomendações por caso de uso

### Para plataforma própria (build)

**Componentes open source recomendados:**
- **OpenCode (MIT):** Core agentic, provider adapters, permissões
- **OmniRoute (MIT):** Gateway de routing, compressão, MCP
- **Cline (Apache-2.0):** Plan/Act pattern, MCP integration, CLI/SDK

**Inspuração de proprietários:**
- **Devin:** Workflow de tarefas longas, frotas de agentes
- **Cursor:** UX de Composer, contexto de codebase
- **Freebuff:** Multi-surface, subagentes especializados

### Para integração com ferramentas existentes

**Open source (baixo risco):**
- OpenCode: integração via CLI/SDK
- OmniRoute: integração como gateway
- Cline: integração via extensão/CLI

**Proprietário (alto risco):**
- Requer contratos e revisão jurídica
- Depende de termos de serviço
- Limitações de privacidade e dados

### Para código sensível/corporativo

**Recomendado:**
- OpenCode (MIT): local-first, código verificável
- OmniRoute (MIT): self-hosted, controle total

**Não recomendado:**
- Trae: retenção 5 anos, ByteDance
- Freebuff: ad-supported, privacidade incerta
- Cursor/Devin: cloud-first, termos proprietários

## Riscos legais por categoria

### Open source (Apache-2.0, MIT)
- **Risco:** Baixo
- **Principal:** Compliance de atribuição e NOTICE
- **Mitigação:** Auditoria de dependências, documentação

### Proprietário (SaaS)
- **Risco:** Alto
- **Principal:** Termos de serviço, privacidade, lock-in
- **Mitigação:** Revisão jurídica, contratos enterprise, backup de dados

## Próximos passos

1. **Auditoria de dependências:** Revisar NOTICE files de Cline e Freebuff
2. **Revisão jurídica:** Avaliar termos de uso de ferramentas proprietárias
3. **Política de reuso:** Definir guidelines internos para uso de código open source
4. **Matriz de proveniência:** Documentar origem de todos os componentes usados

## Referências

- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- MIT License: https://opensource.org/licenses/MIT
- Open Source Initiative: https://opensource.org/licenses
- ChooseALicense: https://choosealicense.com/
