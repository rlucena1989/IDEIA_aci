# Perfil de medição MP-P0

O template é schema-valid como draft, mas não pode sustentar gate enquanto contiver campos null, fixtures/workloads vazios ou status diferente de baseline_approved.

## Ordem de preenchimento

1. capturar ambiente e filesystem exatos;
2. criar fixtures sintéticas e, se necessário, reais autorizadas/minimizadas, cada uma com digest;
3. medir limites por falha controlada, não escolher apenas números confortáveis;
4. pré-registrar workloads, cold/warm runs, concorrência e relógio;
5. executar baseline e guardar dados brutos redigidos;
6. decidir cada hipótese provisória: reter, revisar ou rejeitar;
7. preencher aprovação/evidence, calcular fingerprint com purpose config e marcar baseline_approved.

Valores de limite precisam caber no menor ambiente que será chamado de suportado. Resultado em ambiente divergente é exploratório e recebe novo profile fingerprint.

QG-05/QG-06 mantêm os valores provisórios publicados nos RNFs para teste da hipótese; falhar não autoriza editar retroativamente o threshold. A decisão posterior registra evidência e nova versão.
