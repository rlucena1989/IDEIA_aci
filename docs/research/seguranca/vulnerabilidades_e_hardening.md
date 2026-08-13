# Vulnerabilidades e Hardening — Relatório Preliminar

> **QUARENTENA DOCUMENTAL (13/08/2026):** este relatório mistura observações locais, lembranças não confirmadas, claims de terceiros e conclusões sem artefatos reproduzíveis. Ele NÃO É evidência de vulnerabilidade, conformidade ou segurança dos produtos citados. Um secret literal que aparecia numa versão local deste arquivo foi removido; trate a chave correspondente como exposta e faça rotação no sistema proprietário. Reexecutar qualquer investigação somente com autorização, evidência redigida e o [protocolo rigoroso](../planejamento/protocolo_pesquisa_rigorosa.md).

## Resumo
Validação de segurança em ambiente de pesquisa para plataforma de engenharia autônoma com IA/ACI. Limitações de acesso operacional impediram testes diretos de execução de código (Docker, gVisor, Firecracker).

## Ambiente de Validação
- **Workspace de teste:** `C:\Users\Usuario\AppData\Local\Temp\opencode_workspace`
- **Data:** 11/08/2026
- **Observação:** Restrições operacionais impedem reiniciar serviços, modificar `.env`, configurar Redis ou alterar certificados.

## Vulnerabilidades Identificadas

### 1. OmniRoute — Configuração de Armazenamento e Rate Limit

| Item | Local | Problema | Severidade |
|------|-------|----------|------------|
| Chave de criptografia | `C:\Users\Usuario\.omniroute\.env` | Chave em texto simples, armazenada em disco (secreto de 64 chars) | MÉDIA |
| Rate limit em memória | Logs `app.log` | Mensagens de erro de rate limit sem limite configurado explícito em logs | MÉDIA |
| API anônima | Afirmado em plano de pesquisa | Warning de senha padrão/API anônima observado em memória (sem confirmação no disco) | BAIXA (verificação incompleta) |

#### Detalhes
- Chave de criptografia armazenada: `[REDACTED — valor removido em 13/08/2026; rotação necessária]`
- Rate limit observado via logs sem detalhes de limiar configurado
- API anônima referenciada em plano de pesquisa pendente de validação

#### Recomendações de Hardening
- Criptografar chaves em disco (KMS/Secrets Manager)
- Documentar limite de rate limit em memória e configurações expostas em logs
- Validar configuração de autenticação/API key e remover anônima
- Registrar métricas de rate limit em logs estruturados

---

### 2. FreeBuff — Política de Dados e Retenção

| Item | Fonte | Problema | Severidade |
|------|-------|----------|------------|
| Retenção por plano | Política oficial (pendente de validação) | Serviço gratuito usa dados e anúncios; retenção variável não documentada detalhadamente | ALTA |
| Coleta de dados | Política oficial (pendente) | Ampla coleta para publicidade contextualizada | ALTA |

#### Detalhes
- Afirmado em resumo executivo: FreeBuff coleta ampla de dados, usa anúncios e possui retenção variável
- Validação de retenção por plano/região pendente

#### Recomendações de Hardening
- Documentar matriz de retenção por plano/modelo
- Confirmar exceções (ex: planos enterprise com privacidade diferente)
- Validar política de dados com provedor e revisão jurídica

---

### 3. OpenCode — SandBox e Share Links

| Item | Fonte | Problema | Severidade |
|------|-------|----------|------------|
| Segurança do sandbox | Docs oficiais | Risco de execução não documentado completamente | MÉDIA |
| Share links | Docs oficiais | Potencial vazamento de código/workspace via links compartilhados | ALTA |

#### Detalhes
- Dados indicam uso de sandbox, mas nível de isolamento não validado
- Share links podem permitir acesso não autorizado a workspaces

#### Recomendações de Hardening
- Validar isolamento do sandbox (seccomp, rede bloqueada)
- Desativar share links por padrão
- Implementar gateway interno para acesso compartilhado

---

### 4. Kiro — T&Cs, Créditos e Retenção

| Item | Fonte | Problema | Severidade |
|------|-------|----------|------------|
| Retenção de dados | Docs de segurança/sandbox | Dados e retenção não documentados com clareza | MÉDIA |
| Controles contratados | Docs oficiais | Limites de sandbox e isolamento devem ser validados | MÉDIA |
| Exceções por plano | Política oficial (pendente) | Diferenciação de privacidade por modelo não confirmada | MÉDIA |

#### Recomendações de Hardening
- Documentar retenção de dados e controle de logs
- Confirmar termos enterprise por região/plano
- Validar isolamento de sandbox em PoC

---

### 5. Antigravity — SDK, Modelos e Isolamento

| Item | Fonte | Problema | Severidade |
|------|-------|----------|------------|
| Dependência de Google | Docs oficiais | Políticas de dados de Google aplicam-se | MÉDIA |
| Isolamento | Docs oficiais | Modalidade de execução não documentada com clareza | MÉDIA |
| Limites documentados | Docs oficiais | Validar em PoC | MÉDIA |

#### Recomendações de Hardening
- Validar termos/API e modo de execução em PoC
- Documentar limites de uso e custos
- Validar controle de dados com provedor

---

### 6. Trae — Modelos, Dados e Retenção

| Item | Fonte | Problema | Severidade |
|------|-------|----------|------------|
| Retenção de dados | Política oficial (pendente) | Produto fechado, política de dados não totalmente acessível | MÉDIA |
| Ficha técnica | Política oficial (pendente) | Dados de retenção não documentados | MÉDIA |

#### Recomendações de Hardening
- Localizar política/termos por região e plano
- Obter ficha técnica com retenção e controle de dados

---

## PoC de Sandbox — Limitações

### O que foi validado
- **S1-S8:** Script de validação de restrições operacionais
- **Resultados:** Bloqueio de path traversal, sanitização de metacaracteres, isolamento de secret
- **Resultado:** ✅ Pass em cenários que não dependem de runtime de isolamento

### O que não foi testado (limitações de ambiente)
- Execução real de código dentro de Docker/gVisor/Firecracker
- Testes de escape contra host
- Testes de rede (firewall, isolation)
- Testes de isolamento de filesystem (seccomp, namespaces)
- Latência, overhead e custo operacional real

### Conclusão do PoC
- Validação de restrições internas: ✅ PASS
- Validação de isolamento real: ⏳ PENDENTE (exige runtime isolado)

---

## Próximos Passos de Hardening

### Prioridade Alta
1. **Hardening OmniRoute:** Criptografar chaves em disco, documentar rate limit, remover API anônima
2. **Validar FreeBuff T&Cs:** Obter matriz de retenção por plano, confirmar exceções
3. **Validar OpenCode sandbox:** Testar isolamento em ambiente isolado
4. **PoC real de sandbox:** Executar testes S1-S8 com Docker rootless + seccomp

### Prioridade Média
5. Documentar políticas de Kiro por plano
6. Validar isolamento e T&Cs de Antigravity em PoC
7. Localizar T&Cs completos de Trae por região

### Prioridade Baixa
8. Monitorar logs de OmniRoute para ajustes contínuos de rate limit
9. Documentar padrões de comportamento de execução segura em benchmarks

---

## Licença e Aviso Legal
- Validação realizada sob restrições operacionais descritas em `planejamento/restricoes_operacionais.md`
- Código de terceiros copiado apenas conforme licença e avisos legais
- Segredos/tokens não devem ser copiados para documentação
