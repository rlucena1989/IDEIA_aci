# Validação dos contratos — 2026-08-13

## Escopo

Validação documental e executável dos assets antes de qualquer implementação em p0.

## Ambiente

- Node.js 24.16.0
- Ajv 8.20.0 instalado em diretório temporário com scripts desabilitados
- JSON Schema draft 2020-12
- strict true
- coerceTypes false
- useDefaults false
- removeAdditional false
- validateFormats false
- sem resolução remota

## Resultados

| Verificação | Resultado |
|---|---:|
| schemas JSON carregados | 45 |
| schemas de instância compilados | 44 |
| referências locais verificadas | 540 |
| tipos no event registry | 33 |
| vetores JCS verificados | 33 (inclui separação de domínio de todos os purposes) |
| vetores de ID verificados | 39 |
| rejeições JCS catalogadas | 21 |
| instâncias representativas atuais persistidas e aceitas | 1 (MP-P0 draft) |
| mutações condicionais negativas executadas na primeira onda | 3; precisam ser regeradas para rc.7 |
| standalone ESM da primeira onda | 295535 bytes / 17 exports; não regenerado para rc.7 e não conta como evidência atual |
| helpers/Function constructor na primeira onda | equal e ucs2length / ausente; precisa ser repetido por WP-05 |
| warnings/falhas strict após correção | 0 |
| links locais quebrados | 0 em 63 Markdown de implementation; 0 em 307 Markdown de docs |
| DDL SQLite em memória | 40 tabelas, 80 triggers; 36 tabelas imutáveis com guards estruturais |
| smoke de imutabilidade/transição | TaskRun update/delete; evento fora de ordem; projeção órfã; transições órfãs de artifact/reservation; gap de ledger — todos rejeitados; caminhos journaled aceitos |
| foreign_key_check / integrity_check | 0 erros / ok |
| checksum atual dos bytes de p0_v1.sql | sha256:cb0ee9f4e21510505ee045ea89700918e9795de6907deee75fc9a65055a9bd84 |

## Defeito encontrado e corrigido

A primeira compilação Ajv strict rejeitou a forma abreviada type com múltiplos tipos em jsonValue. A definição foi substituída por ramos oneOf explícitos. O verificador estrutural isolado não detectava essa divergência, justificando a compilação com o engine real antes do handoff WP-05.

A inspeção do standalone também refutou a hipótese de Ajv apenas como devDependency: o output importou ajv/dist/runtime/equal e ajv/dist/runtime/ucs2length. A ADR-005 foi corrigida para manter Ajv 8.20.0 como dependência de runtime exata, sem inicialização do compilador no runtime.

A revisão adversarial transversal encontrou e corrigiu quatro inconsistências documentais antes da implementação:

- dependência circular entre o fingerprint final do GovernanceBundle e o EvaluationReport; agora existe `candidate_fingerprint` com purpose próprio;
- invariantes condicionais de eventos apenas em prosa; o registry rc.7 agora carrega e valida `payload_constraints`;
- Manifest canônico e EffectReconciliation sem autoridade persistente suficiente; o DDL agora preserva o primeiro e impõe uma reconciliação por intent;
- projeções de artifact/reservation sobrescreviam o fingerprint corrente sem snapshot histórico correspondente; agora cada estado fica em journal append-only e a projeção exige esse row.
- relações task/call/principal/request de provider, policy, approval, intent, artifact, contexto e budget dependiam demais da aplicação; FKs compostas agora rejeitam trocas de escopo representáveis no DDL.

## Casos negativos executados

- PolicyDecision approval_required com approval_requirements null;
- UsageRecord unknown com value numérico;
- ApprovalRevocation all_pending mantendo approval_id específico.

Todos foram rejeitados.

Essas três mutações usavam fixtures efêmeras da primeira onda. Como TaskManifest, ToolRequest e EffectIntent evoluíram no release candidate, elas não contam como corpus rc.7; WP-09A/09B deve materializar e reexecutar o conjunto atual.

## Ampliação rc.7

Foram adicionados contratos de contexto, provider, plano, artifacts, recovery, preço/orçamento, sandbox/capability, governança, avaliação e medição. O registry avançou de 12 para 33 tipos. Todos os 45 schemas foram carregados e os 44 schemas de instância compilaram com Ajv 8.20.0 em strict mode, sem resolução remota.

O template `measurement/MP-P0.template.json` validou contra MeasurementProfile. Isso prova apenas forma draft; os campos null e arrays vazios impedem uso como gate.

O DDL `persistence/p0_v1.sql` executou dentro de `BEGIN IMMEDIATE` em `node:sqlite`, recebeu registro de migração por prepared statement, passou por `foreign_key_check` e `integrity_check`. O validador também conferiu nome, tabela, operação e código de 72 guards UPDATE/DELETE sobre 36 tabelas, além de oito guards de cadeia/projeção/lifecycle/ledger e smoke tests selecionados. Isso não executa WAL/`synchronous=FULL` em arquivo nem os faults DB-F.

## Contraprovas ainda pendentes

- suite integral matriz_testes_contrato_v1.md;
- parser de duplicate keys e todos os casos JCS-R em implementação WP-04;
- geração standalone ESM e teste de reprodutibilidade WP-05;
- segunda implementação independente do canonicalizer;
- limites de bytes/profundidade de OD-DP-08;
- invariantes transacionais WP-11 a WP-17;
- fixtures válidas/negativas representativas para os 44 contratos atuais;
- implementação runtime que aplique `payload_constraints` depois do schema;
- PRAGMAs em catálogo file-backed e DB/ART/REC fault profiles;
- SandboxProfile contra controles reais por SO;
- MP-P0 preenchido e aprovado;
- corpus de timestamps e paths por SO.

Esta validação prova consistência inicial dos schemas e vetores. Não prova P0 implementado, segurança do runtime ou conformidade integral com RF/RNF.
