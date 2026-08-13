# ADR-006 — Portas de aplicação e ciclo auditável do provider

- Status: aceita para o P0
- Data: 2026-08-13
- Fecha: OD-AG-01 e o bloqueio documental de WP-07/WP-16
- Relaciona: RF-003, RF-004, RF-005, RF-006, RF-019; RNF-011, RNF-012, RNF-019, RNF-020

## Contexto

Os estudos de contexto, ciclo agentic, governança e custos convergiram na separação entre coordenação, provider, catálogo de tools, policy, execução e verificação. Ainda faltava uma decisão única sobre nomes, autoridade e semântica de falha. Sem ela, fakes e adapters poderiam parecer compatíveis enquanto discordassem sobre cancelamento, tool calls, retries ou persistência.

Também havia três vocabulários concorrentes para a mesma fronteira: `model.*`, `provider.*` e `model.called/responded`. O evento precisa identificar uma tentativa concreta contra um endpoint, não uma capacidade abstrata de um modelo.

## Decisão

### Autoridade

O coordinator é a única autoridade para avançar a tarefa. Cada porta tem autoridade limitada:

| Componente | Pode | Não pode |
|---|---|---|
| ProviderPort | transportar uma requisição congelada e relatar sinais/resultados não confiáveis | executar tool, conceder permissão, alterar plano ou declarar sucesso |
| ToolCatalogPort | resolver definição exata e fingerprint do catálogo | escolher versão `latest`, autorizar ou executar |
| PolicyPort | decidir `allow`, `deny` ou `approval_required` sobre request exata | executar efeito ou forjar aprovação |
| ToolPort | executar intent já preparada e relatar observação/reconciliação | ampliar escopo, reclassificar risco ou repetir efeito ambíguo |
| CatalogPort | garantir fatos e invariantes transacionais locais | tornar efeito externo atômico ou corrigir história por update/delete |
| ArtifactStorePort | armazenar bytes endereçados por conteúdo e aplicar lifecycle | promover conteúdo sem metadata íntegra ou ignorar quarentena |
| VerifierPort | avaliar critério versionado a partir de evidência | substituir critério, executar efeito de produção ou decidir política |

Uma tool call emitida pelo provider é somente uma `ToolProposal` não confiável. O coordinator resolve a definição exata, valida schema e escopo, normaliza, calcula fingerprint, consulta policy, consome aprovação quando exigida, persiste a intent e apenas então chama ToolPort.

### Eventos do provider

O namespace normativo é:

- `provider.capabilities_recorded`;
- `provider.requested`;
- `provider.completed`;
- `provider.failed`.

`model.called`, `model.responded`, `model.requested`, `model.completed` e `model.failed` não são aliases e devem ser rejeitados pelo registry v1. O payload registra `provider_id`, `model_id`, revisão conhecida, endpoint lógico, bundle de governança e fingerprints aplicáveis.

`provider.requested` é persistido antes do I/O. Exatamente um de `provider.completed` ou `provider.failed` encerra a tentativa conhecida. Perda da resposta depois de possível processamento remoto termina como falha com estado ambíguo; ela não autoriza retry automático.

Eventos de governança organizacional, como promoção de bundle, não entram à força no `EventEnvelope` task-scoped. Eles exigirão agregado de auditoria próprio fora do P0 ou uma revisão explícita do envelope.

### Forma das portas

As assinaturas e invariantes normativas estão em `contracts/ports_v1.md`. Tipos wire continuam nos JSON Schemas; tipos de aplicação não ganham compatibilidade implícita só por serem estruturalmente semelhantes.

Operações puras e leituras locais podem ser síncronas. Operações com provider, tool ou verificador são assíncronas, aceitam `AbortSignal` e possuem um retorno terminal único. Streaming usa um sink de sinais não terminais; encerramento continua sendo o valor retornado, evitando dois terminais concorrentes.

Callbacks de transação do CatalogPort são síncronos e não aceitam Promise. Isso acompanha `node:sqlite`, impede uma transação permanecer aberta através de `await` arbitrário e torna o boundary de commit observável.

### Fakes

Fakes obedecem a mesma interface e:

- consomem scripts explícitos em ordem FIFO;
- falham quando a fila está vazia;
- copiam defensivamente entrada, sinais e saída;
- não consultam relógio, rede, filesystem, processo, SQLite ou aleatoriedade global;
- registram chamadas em visão somente leitura;
- nunca executam automaticamente uma `ToolProposal`.

## Consequências

- WP-07 pode ser delegado após WP-05 e o handoff específico passarem pelos gates.
- WP-16 pode montar o slice read-only com provider fake sem inventar autoridade.
- Provider real, credenciais e descoberta dinâmica continuam em WP-22.
- A decisão originou o `rc.2`; o registry task-scoped foi posteriormente ampliado e endurecido e está em `rc.7`.
- Persistência, lifecycle de artifacts e recovery ainda exigem decisões complementares; esta ADR não os declara implementados.

## Alternativas rejeitadas

| Alternativa | Motivo |
|---|---|
| chamar tudo de `model.*` | omite endpoint/provider/tentativa e confunde capacidade lógica com I/O concreto |
| provider executar tool call diretamente | contorna catálogo, policy, aprovação, intent e verificação |
| AsyncIterable com terminal também no retorno | permite dois terminais contraditórios e dificulta cancelamento determinístico |
| transação assíncrona genérica | mantém lock através de I/O e não corresponde ao adapter SQLite escolhido |
| retry automático de falha ambígua | pode duplicar custo ou efeito remoto |

## Condições de reabertura

- provider obrigatório não puder ser representado sem quebrar a semântica terminal;
- `node:sqlite` deixar de ser o adapter P0;
- necessidade provada de coordenação distribuída invalidar o único writer local;
- avaliação demonstrar que o sink impõe perda material de sinais ou backpressure.
