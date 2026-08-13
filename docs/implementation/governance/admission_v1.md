# Admissão de GovernanceBundle P0 v1

**Estado:** protocolo normativo para implementação futura  
**Limite:** valida e admite um bundle provisionado; não concede autoridade para promovê-lo

## Por que existe

TaskManifest e TaskRun fixam `governance_bundle_id` e `governance_bundle_fingerprint`, mas isso não prova que o bundle é aprovado, vigente ou sustentado pela avaliação declarada. A admissão precisa resolver e verificar toda a cadeia antes de criar a task.

## Provisionamento offline

O P0 usa um governance root local, read-only para o processo de execução, contendo:

- GovernanceBundle aprovado;
- EvaluationReport referenciado;
- MeasurementProfile `baseline_approved` referenciado;
- corpus/runner metadata necessários à verificação;
- results artifact resolvível por `evaluation_task_id` no Catalog/ArtifactStore.

Um operador autorizado provisiona os três JSONs por create-new + flush + rename no mesmo volume, sem overwrite. O runtime não edita, aprova, retira ou escolhe `latest`. Mudança cria versão/fingerprint novos e evidência G0/G1. Credenciais e secrets nunca entram no governance root.

Na inicialização, o loader abre caminhos configurados exatos, limita bytes/profundidade, rejeita duplicate keys, valida JSON Schema e constrói um snapshot em memória. Falha em qualquer item impede o processo de aceitar novas tasks. Depois do snapshot, a admissão não consulta filesystem nem rede.

## Fingerprints sem ciclo

`candidate_fingerprint` usa purpose `governance-candidate` sobre esta projeção, com nomes e arrays preservados exatamente:

~~~text
contract
bundle_id
bundle_version
provider
prompts
policy
tool_catalog_fingerprint
context_strategy
limits_profile_fingerprint
measurement_profile_fingerprint
~~~

Ele exclui status, EvaluationReport, aprovação, vigência, `candidate_fingerprint` e `bundle_fingerprint`. O EvaluationReport aponta esse valor estável.

`bundle_fingerprint` usa purpose `governance-bundle` sobre o GovernanceBundle completo sem apenas o próprio campo. Logo, inclui candidato, status, report, aprovador e vigência sem depender de um report que dependa do fingerprint final.

EvaluationReport e MeasurementProfile calculam seus fingerprints pelos purposes normativos sobre o objeto sem o respectivo campo de fingerprint.

## Algoritmo de admissão

Na ordem, sem pular falhas:

1. validar TaskManifest e comparar id/fingerprint pedidos;
2. resolver exatamente o bundle no snapshot; ausência não cai em versão semelhante;
3. recalcular `candidate_fingerprint` e `bundle_fingerprint`;
4. exigir `status=approved`, `approved_by`, `approved_at` e `effective_at` válidos;
5. exigir `effective_at <= nowUtc < expires_at`, quando houver expiração; relógio inválido bloqueia;
6. resolver EvaluationReport exato e conferir seu fingerprint e `candidate_fingerprint`;
7. exigir verdict `promote`, todos os hard gates `pass`, denominadores completos e timestamps coerentes;
8. resolver MeasurementProfile exato, exigir `baseline_approved` e conferir ambiente/limits/approval/evidence;
9. resolver `results_artifact_id` dentro de `evaluation_task_id`, exigir lifecycle committed, ArtifactRef/tamanho/digest íntegros e classe permitida;
10. comparar provider/model/config/capabilities, prompts, policy, tool catalog, contexto e limits com os componentes efetivamente carregados;
11. só então criar TaskRun e evento `task.created`, fixando o fingerprint final.

O snapshot continua válido para tasks já admitidas. Retirada ou expiração impede novas tasks; cancelamento das existentes é decisão operacional explícita e auditada, nunca efeito colateral silencioso.

## Códigos mínimos

| Falha | Código |
|---|---|
| bundle/report/profile ausente | `governance.reference_missing` |
| schema/duplicate key/limite | `governance.invalid_document` |
| fingerprint divergente | `governance.fingerprint_mismatch` |
| status não aprovado | `governance.not_approved` |
| ainda não vigente, expirado ou retired | `governance.not_effective` |
| verdict/gate/denominador inválido | `governance.evaluation_failed` |
| MP não aprovado ou ambiente divergente | `governance.measurement_invalid` |
| results artifact ausente/não committed/divergente | `governance.evidence_invalid` |
| componente runtime diverge do bundle | `governance.runtime_mismatch` |

Todos usam retry `never` ou `manual`, mensagem redigida e zero trecho do documento.

## Contraprovas obrigatórias

- campos materiais mudam o candidato; campos de aprovação não mudam o candidato, mas mudam o bundle final;
- report para outro candidato, report alterado ou artifact de outra task falham;
- bundle `draft`, `evaluated`, `retired`, futuro ou expirado falha;
- MP draft/exploratory falha;
- provider/config/prompt/policy/tool/context/limits divergentes falham;
- troca de arquivo depois do startup não altera o snapshot admitido;
- loader com arquivo parcial, symlink/junction fora do root, duplicate key ou documento excessivo falha fechado;
- nenhuma operação de admissão cria aprovação ou reescreve o governance root.

## Garantias limitadas

O protocolo prova coerência interna e pinning sob as premissas testadas. Não prova assinatura criptográfica, resistência a administrador do host, legitimidade organizacional do aprovador nem correção dos thresholds. Essas exigem G0/G1 e controles do ambiente.
