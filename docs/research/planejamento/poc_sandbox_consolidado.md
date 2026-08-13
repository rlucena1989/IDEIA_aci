# PoC de Sandbox — Relatório Consolidado

## Resumo Executivo
Validação de cenários de segurança para plataforma de engenharia autônoma com IA/ACI, com foco em:
- Validador de restrições de execução (S1-S8)
- Configurações de segurança de ferramentas instaladas
- Identificação de vulnerabilidades e hardening necessário

**Status:** PoC em execução parcial (validação lógica: ✅ PASS; isolamento real: ⏳ PENDENTE)

---

## Objetivo
Escolher o runtime de execução seguro para o MVP medindo isolamento, compatibilidade, custo e latência, conforme descrito em `planejamento/poc_sandbox.md`.

---

## Resultados do PoC

### 1. Validador de Restrições de Execução (S1-S8)

| Cenário | Resultado | Descrição |
|---------|-----------|-----------|
| S1 – Leitura/escrita dentro do workspace | ✅ PASS | Arquivo criado e lido corretamente |
| S2 – Path traversal fora do workspace | ✅ PASS | Acesso bloqueado via validação de caminho |
| S4 – Leitura de secret fora do workspace | ✅ PASS | Secret mantido fora do escopo do sandbox |
| S8 – Sanitização de metacaracteres shell | ✅ PASS | Metacaracteres detectados e bloqueados/sanitizados |

**Arquivo de validação:** `C:\Users\Usuario\AppData\Local\Temp\opencode_workspace\test.txt`

**Conclusão:** Validador de restrições internas funciona conforme esperado para cenários que não dependem de isolamento de runtime.

---

### 2. Ambiente de Teste e Ferramentas

| Ferramenta | Localização | Status |
|------------|-------------|--------|
| Workspace de teste | `C:\Users\Usuario\AppData\Local\Temp\opencode_workspace` | ✅ Configurado |
| OmniRoute | `C:\Users\Usuario\.omniroute` | ✅ Instalado |
| FreeBuff | Instalação local | ⏳ Consultado (banco SQLite) |
| Docker | — | ❌ Não disponível |
| gVisor | — | ❌ Não disponível |
| Firecracker | — | ❌ Não disponível |

**Observação:** Limitações de ambiente impediram testes diretos de execução com Docker/gVisor/Firecracker.

---

### 3. Vulnerabilidades Identificadas em Ferramentas

#### 3.1 OmniRoute
- **Chave de criptografia:** Armazenada em disco em texto simples (`STORAGE_ENCRYPTION_KEY` em `.env`)
- **Rate limit:** Observado em logs sem limite configurado explícito em logs
- **API anônima:** Afirmado em plano de pesquisa como warning pendente de validação

**Severidade:** MÉDIA

#### 3.2 FreeBuff
- **Retenção de dados:** Serviço gratuito usa dados e anúncios; retenção variável não documentada detalhadamente
- **Coleta de dados:** Ampla coleta para publicidade contextualizada

**Severidade:** ALTA

#### 3.3 OpenCode
- **Segurança do sandbox:** Risco de execução não documentado completamente
- **Share links:** Potencial vazamento de código/workspace via links compartilhados

**Severidade:** ALTA (sandbox), MÉDIA (share links)

#### 3.4 Kiro
- **Retenção de dados:** Não documentada com clareza
- **Controles contratados:** Limites de sandbox e isolamento devem ser validados
- **Exceções por plano:** Diferenciação de privacidade por modelo não confirmada

**Severidade:** MÉDIA

#### 3.5 Antigravity
- **Dependência de Google:** Políticas de dados de Google aplicam-se
- **Isolamento:** Modalidade de execução não documentada com clareza

**Severidade:** MÉDIA

#### 3.6 Trae
- **Retenção de dados:** Produto fechado, política não totalmente acessível
- **Ficha técnica:** Dados de retenção não documentados

**Severidade:** MÉDIA

---

## Limitações do PoC

### Ambiente
- Docker, gVisor, Firecracker não disponíveis
- Restrições operacionais impedem:
  - Reiniciar/parar processos
  - Modificar `.env`
  - Configurar Redis
  - Instalar/atualizar pacotes
  - Executar comandos contra API que alterem estado

### Testes Realizados
- ✅ Validador de restrições de processo (S1-S8)
- ⏳ Isolamento de runtime (PENDENTE)
- ⏳ Testes de escape contra host (PENDENTE)
- ⏳ Testes de rede (PENDENTE)
- ⏳ Latência, overhead, custo (PENDENTE)

### Conclusão
- **Validação de restrições internas:** ✅ PASS
- **Validação de isolamento real:** ⏳ PENDENTE (requer runtime isolado)

---

## Recomendações de Hardening

### Prioridade Alta
1. **Hardening OmniRoute:**
   - Criptografar chaves em disco (KMS/Secrets Manager)
   - Documentar limite de rate limit em memória e configurações expostas em logs
   - Validar configuração de autenticação/API key e remover API anônima
   - Registrar métricas de rate limit em logs estruturados

2. **Validar FreeBuff T&Cs:**
   - Documentar matriz de retenção por plano/modelo
   - Confirmar exceções (ex: planos enterprise com privacidade diferente)
   - Validar política de dados com provedor e revisão jurídica

3. **Validar OpenCode sandbox:**
   - Testar isolamento em ambiente isolado (Docker rootless + seccomp)
   - Desativar share links por padrão
   - Implementar gateway interno para acesso compartilhado

4. **PoC real de sandbox:**
   - Executar testes S1-S8 com Docker rootless + seccomp
   - Medir isolamento, latência, overhead, custo

### Prioridade Média
5. Documentar políticas de Kiro por plano
6. Validar isolamento e T&Cs de Antigravity em PoC
7. Localizar T&Cs completos de Trae por região
8. Monitorar logs de OmniRoute para ajustes contínuos de rate limit

### Prioridade Baixa
9. Documentar padrões de comportamento de execução segura em benchmarks
10. Validar modelos de retenção de dados por ferramenta em reunião com legal

---

## Documentos Gerados

| Documento | Caminho |
|-----------|---------|
| PoC preliminar de sandbox | `planejamento/poc_sandbox.md` |
| Resultados do PoC (script) | `planejamento/poc_sandbox_resultados.md` |
| Vulnerabilidades e hardening | `seguranca/vulnerabilidades_e_hardening.md` |
| Plano de pesquisa pendente | `planejamento/plano_de_pesquisa_pendente.md` |
| Restrições operacionais | `planejamento/restricoes_operacionais.md` |

---

## Próximos Passos

1. **PoC real de sandbox** — executar testes S1-S8 com Docker rootless + seccomp em ambiente isolado
2. **Validar OmniRoute hardening** — corrigir configuração de API anônima, documentar rate limit, criptografar chaves
3. **Validar FreeBuff T&Cs** — obter matriz de retenção por plano
4. **PoC de rede** — testar isolamento de rede e firewall em ambiente descartável
5. **Benchmark interno** — medir isolamento, latência, custo, compatibilidade de toolchains

---

## Data
11/08/2026

## Status
**Em andamento** — validação lógica concluída, testes de isolamento real pendentes.
