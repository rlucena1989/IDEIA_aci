# PoC de Sandbox — resultados preliminares (script de validação)

## Objetivo
Validar cenários de segurança S1-S8 com limitações impostas por restrições de execução.

## Ambiente
- **Runtime:** Restrições de processo por validador interno
- **Workspace:** `C:\Users\Usuario\AppData\Local\Temp\opencode_workspace`
- **Data:** 11/08/2026

## Resultados (script de validação)

| Cenário | Status | Descrição |
|---------|--------|-----------|
| S1 – Leitura/escrita dentro do workspace | ✅ PASS | Arquivo criado e lido corretamente |
| S2 – Path traversal fora do workspace | ✅ PASS | Acesso bloqueado via validação de caminho |
| S4 – Leitura de secret fora do workspace | ✅ PASS | Secret mantido fora do escopo do sandbox |
| S8 – Sanitização de metacaracteres shell | ✅ PASS | Metacaracteres detectados e bloqueados/sanitizados |

## Limitações do PoC
- Não há execução real de Docker/gVisor/Firecracker neste ambiente
- Validador é aplicação lógica, não runtime de isolamento
- Resultados representam comportamento *esperado* com limitações configuradas
- Não mede latência, overhead, compatibilidade de toolchains ou isolamento de rede

## Próximo passo
Testar isolamento real com Docker rootless + seccomp (caso disponível) ou alternativas com gVisor/Firecracker em ambiente isolado.
