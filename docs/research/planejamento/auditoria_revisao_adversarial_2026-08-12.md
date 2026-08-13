# Meta-auditoria da revisão adversarial — 12/08/2026

**Escopo:** `revisao_adversarial_*`, `audit_trail.md`, `sintese_arquitetural_p0_p1.md` e inventário atual de `packages/`  
**Status:** revisão adversarial reprovada como gate de implementação  
**Método:** [Protocolo de pesquisa rigorosa](protocolo_pesquisa_rigorosa.md)  
**Natureza:** inspeção documental e inventário estático; packages não foram compilados ou executados

## 1. Conclusão

A revisão adversarial encontrou problemas reais — stubs não rotulados, dependências pouco documentadas, ausência de testes e nomenclatura inconsistente. Contudo, sua avaliação final não sustenta as notas, a aprovação ou a recomendação de iniciar implementação.

Pelos critérios definidos pela própria revisão, o resultado é **reprovado**: ela exige nota geral mínima 4,0 e nota mínima 3,5 por critério, mas reporta 3,7 no geral e 3,0 em “viabilidade” e “adequação para LLM 20B”. Mesmo a média ponderada dos números publicados é 3,75, que arredondada a uma casa é 3,8, não 3,7. A classificação “APROVADO COM CORREÇÕES” contradiz o gate.

Também não há base para tratar o roadmap de 26 semanas, os gaps competitivos ou os packages como validados. A decisão correta é manter esses artefatos como hipóteses/rascunhos e submeter P0 aos requisitos e gates revisados.

## 2. Achados

| ID | Severidade | Evidência | Problema | Resolução/ação |
|---|---|---|---|---|
| MRA-01 | Crítica | critérios: geral ≥4,0 e cada critério ≥3,5; final: geral 3,7, duas notas 3,0 | O relatório aprova um resultado que falha no próprio gate | Status corrigido para reprovado; não autoriza implementação |
| MRA-02 | Alta | afirma “revisão de 27 documentos”, mas não fornece checklist por arquivo, trechos, contagens ou resultados reproduzíveis | Escopo alegado não é auditável | Criar matriz por documento antes de nova nota |
| MRA-03 | Alta | notas 4,0–4,5 para integração, gaps, packages e roadmap sem método específico | Pontuação é julgamento não calibrado apresentado como avaliação | Remover/rotular notas até definir rubrica e evidência |
| MRA-04 | Alta | “LLM 20B” sem modelo, arquitetura, quantização, contexto, tokenizer, hardware ou benchmark | Adequação não é testável nem comparável | Definir alvo exato e executar tarefas cegas com baseline |
| MRA-05 | Alta | síntese define P0 com multiagentes, LangGraph, RAG, cache, autoscaling e 14 frentes | P0 contradiz a visão e os requisitos revisados, que priorizam executor local verificável | Usar P0 de `requisitos_funcionais.md`; reavaliar temas só após gates |
| MRA-06 | Alta | roadmap de 26 semanas sem equipe, capacidade, estimativas por entrega, dependências validadas ou margem | “Timeline realista” não é sustentado | Tratar cronograma como hipótese; estimar após inventário/build e spike |
| MRA-07 | Alta | 20 manifests; 20 sem versão; 6 com script `test`; 23 arestas de dependência ausentes do workspace | Packages foram copiados, não demonstrados como integráveis | Criar SBOM/inventário, restaurar dependências, compilar e testar isoladamente |
| MRA-08 | Alta | exemplo `AuditEvent(...)` omite `previous_hash` e `current_hash` obrigatórios | Primeiro exemplo de audit trail falha na construção | Não copiar para implementação; substituir por contrato/testes ou código executado |
| MRA-09 | Crítica | `verify_integrity()` só compara `previous_hash` ao hash armazenado anterior | Alterar ator/recurso/detalhes sem tocar links pode continuar retornando `True` | Recalcular hash canônico de cada evento e verificar âncora externa |
| MRA-10 | Alta | dataclasses, dicionários e listas são mutáveis; chain tip está no mesmo objeto | “Imutável” e “garante integridade” são afirmações falsas | Renomear para tamper-evident experimental e definir trust anchor/persistência |
| MRA-11 | Média | stubs em documentos de pesquisa tratados universalmente como bloqueio crítico | Pseudocódigo pode ser válido se rotulado; implementar tudo no documento mistura pesquisa e produto | Classificar bloco como pseudocódigo, exemplo executável ou código normativo |
| MRA-12 | Média | “documento faltante resolvido” apenas pela criação de `audit_trail.md` | Existência foi confundida com qualidade/conclusão | Status do documento alterado para rascunho não validado |

## 3. Inventário reproduzível de packages

Inspeção de `packages/**/package.json` em 12/08/2026:

| Medida | Resultado |
|---|---:|
| Manifests encontrados | 20 |
| Manifests com versão declarada | 0 |
| Manifests com script `test` | 6 |
| Arestas de dependência ausentes do workspace | 23 |
| `node_modules` no root/packages | ausente |
| `tsc` disponível no PATH | ausente |

Das 23 arestas ausentes, 21 apontam para packages `@ideia/*` não presentes e duas para dependências externas (`uuid`, `zod`) não instaladas. Isso não prova que os packages sejam imprestáveis; prova apenas que **não é possível classificá-los como integrados ou reutilizáveis sem restauração do grafo e execução**.

O package raiz representa `@ideia/agent-coordinator`, embora não exista diretório `packages/agent-coordinator`. A síntese deve distinguir nome lógico, diretório e origem para evitar falso negativo.

## 4. Falhas concretas do exemplo `audit_trail.md`

1. `AuditEvent` declara oito campos sem defaults, mas as duas instanciações fornecem seis.
2. `event_id` não participa do hash; pode ser alterado sem detecção pelo algoritmo descrito.
3. `verify_integrity` não recalcula `current_hash`, portanto não verifica conteúdo.
4. `details`, `events`, `entries` e as dataclasses permanecem mutáveis.
5. O hash final não é assinado nem ancorado fora do mesmo domínio de escrita.
6. Não há persistência, controle de concorrência, sequência monotônica, canonicalização formal ou política de redação.
7. O exemplo registra `content` em detalhes, contrariando o requisito de redigir secrets/PII antes de persistir.
8. “Event sourcing” é usado como sinônimo de audit log, sem aggregate/version/projection/replay de estado.

Uma hash chain pode evidenciar certas alterações quando corretamente implementada, mas não torna o armazenamento imutável e não identifica adulteração por um atacante capaz de reescrever cadeia e âncora.

## 5. O que permanece aproveitável

- A lista de stubs é uma boa entrada para classificar exemplos.
- O alerta sobre dependências e testes deve entrar na auditoria de packages.
- A preocupação com contexto de modelos locais é válida, desde que o modelo e o benchmark sejam definidos.
- O inventário temático pode servir como backlog P1/P2, não como ordem de implementação.
- Os packages copiados são candidatos a reaproveitamento após build, testes, licença/proveniência e aderência aos contratos P0.

## 6. Gates corretivos

Antes de qualquer package ser aceito como base do P0:

1. origem, commit, licença e modificações registradas;
2. manifest com versão e dependências resolvidas/pinadas;
3. build limpo em ambiente reproduzível;
4. testes existentes executados, com falhas documentadas;
5. contract tests ligados às cláusulas P0 relevantes;
6. threat review para código que executa tools, lida com secrets ou persiste eventos;
7. decisão `adotar`, `adaptar`, `quarentenar` ou `descartar`, com evidência.

Antes de alegar adequação a modelo local:

1. fixar modelo, quantização, runtime, contexto e hardware;
2. definir conjunto cego de tarefas e baseline humano/modelo;
3. medir sucesso verificado, tokens, latência, memória, intervenções e custo;
4. publicar falhas e intervalos, não somente nota subjetiva;
5. repetir após mudança de prompt, ferramenta ou contexto.

## 7. Decisão

- `revisao_adversarial_avaliacao_final.md`: substituída como gate por esta meta-auditoria.
- `audit_trail.md`: rascunho conceitual não executável; não usar como implementação.
- `sintese_arquitetural_p0_p1.md`: backlog arquitetural amplo; não representa o P0 vigente.
- Fonte vigente para escopo funcional: [Requisitos funcionais v2](../produto/requisitos_funcionais.md).
- Próxima ação: revisar requisitos não funcionais e depois auditar packages candidatos contra as cláusulas P0, sem integrá-los automaticamente.

## 8. Registro de evidências

| ID | Afirmação | Classe | Fonte | Confiança |
|---|---|---|---|---|
| MRA-C01 | A avaliação final falha nos limiares publicados por seus próprios critérios | Fato observado | `revisao_adversarial_criterios.md`, `revisao_adversarial_avaliacao_final.md` | Alta |
| MRA-C02 | A média ponderada das notas publicadas é 3,75 | Cálculo reproduzível | tabela da avaliação final | Alta |
| MRA-C03 | O exemplo de EventStore não detecta toda alteração de conteúdo | Análise de código | `audit_trail.md`, linhas 42–107 | Alta |
| MRA-C04 | Os packages copiados ainda não têm integração demonstrada | Inferência | inventário estático da seção 3 | Alta para “não demonstrada”; desconhecida para qualidade intrínseca |
| MRA-C05 | O roadmap de 26 semanas é realista | Hipótese do documento concorrente | `sintese_arquitetural_p0_p1.md` | Baixa |
