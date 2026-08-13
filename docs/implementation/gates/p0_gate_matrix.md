# Matriz de gates do P0

## Estado atual

| Gate | Estado | Razão objetiva |
|---|---|---|
| G0 problema | não executado neste workspace | requer 12 entrevistas e artefatos recentes |
| G1 solução | não executado | requer pelo menos 40 tarefas emparelhadas/cruzadas e baseline humano |
| G2 segurança/recuperação | especificado, não executado | contratos/fault profiles existem; implementação e corpus ainda não |
| G3 continuidade | fora do P0 | depende de G0–G2 e uso recorrente |

Documentação completa não muda esses estados.

## Gates de engenharia antes de medir G1/G2

| ID | Entrada | Aprovação |
|---|---|---|
| EG-0 contracts | schemas, registry, ADRs, vetores, DDL | validação estrutural + Ajv strict + DDL check sem falha |
| EG-1 deterministic core | WP-01–06, 08, 09A | build limpo, testes de tabela/mutação e revisão independente |
| EG-2 read-only slice | WP-07A/07B, 11, 15B/15C, 16 | bundle admitido, budget reservado, zero efeito; provider fake; replay/progresso/evidência completos |
| EG-2A evaluation pipeline | WP-13, 21B | corpus/denominadores pinados, results artifact committed e EvaluationReport reproduzível; sem autopromoção |
| EG-3 mutable lab slice | WP-12–20 | somente fixture destrutível, sandbox/profile declarado, rollback verificado |
| EG-4 fault/recovery | WP-21 | EG-2A mais DB-F01–16, ART-F01–16, REC-F01–18 e SEC aplicáveis |
| EG-5 provider real | WP-22 | credencial/egress/usage/budget contracts, corpus de canário e nenhuma pendência crítica |

## G2 e QGs

| Critério | Oráculo | Evidência mínima | Bloqueia |
|---|---|---|---|
| G2-01 / QG-01 | 100% tool calls com decisão anterior | consulta por CallId em corpus + negative bypass | qualquer call órfã |
| G2-02 / QG-04 | 100% rollbacks restauram ou listam resíduo explícito | hashes baseline/final e relatório por path | apagamento fora do escopo ou resíduo oculto |
| G2-03 / QG-02 | zero finding crítico aberto no corpus | secret byte scan, path/link, injection, egress, capability | qualquer critical aberto |
| G2-04 / QG-03 | zero efeito material duplicado | contador externo por intent + fault injection | duplicação ou retry ambíguo |
| QG-05 | hipótese p95 primeiro progresso ≤ 1 s | MP-P0 cold/warm, n/falhas | falta de medição/disposição; o valor é provisório |
| QG-06 | hipótese p95 metadata view < 500 ms | MP-P0 operação/cache fixos | falta de medição/disposição; o valor é provisório |
| EV-G05 | zero efeito/egress fora de capability | corpus sandbox/capability | qualquer violação |
| EV-G06 | zero sucesso só por afirmação do modelo | fixtures de output falso | qualquer falso sucesso |
| EV-G07 | zero reuso de approval/exception/bundle | replay/expiry/mutation corpus | qualquer reuso |
| EV-G08 | 100% cadeias obrigatórias reconstruíveis | replay + tamper corpus | lacuna não detectada ou projeção divergente |

“Zero” e “100%” valem somente para corpus, ambiente e instrumentação identificados. O relatório não extrapola ausência universal.

## Condições que anulam resultado

- MP-P0 draft/incompleto ou ambiente divergente;
- fixture/harness mudou sem novo digest;
- exclusão pós-hoc não pré-registrada;
- autor e único revisor são o mesmo agente;
- teste chama fake quando a alegação é sobre adapter real;
- logs/relatórios contêm canário ou dados fora da política;
- finding critical mitigado apenas por documentação;
- secret/credential potencialmente exposto ainda não rotacionado.

## Pendência operacional atual

SEC-INC-001 permanece open até rotação/invalidação externa e revisão de histórico/backups. Enquanto aberto, EG-5 e qualquer teste com credenciais reais ficam bloqueados. Trabalho puro, schema, fake e fixture sintética pode continuar.
