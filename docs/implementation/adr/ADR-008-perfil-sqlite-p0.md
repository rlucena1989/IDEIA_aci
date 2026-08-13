# ADR-008 — Perfil SQLite, concorrência e durabilidade do P0

- Status: aceita como release candidate; promoção depende do fault profile
- Data: 2026-08-13
- Fecha documentalmente: OD-DP-02 para WP-11/WP-12
- Relaciona: RF-019, RNF-011, RNF-012, RNF-013, RNF-020

## Contexto

O P0 é local-first, usa um coordinator e precisa comprometer evento, journal e projeção atomicamente. O ambiente possui Node 24.16.0 com `node:sqlite`. A API `DatabaseSync` é síncrona e o módulo está em release candidate na linha Node 24; isso reduz dependências, mas exige feature probe, versão mínima e testes de falha antes de alegar durabilidade.

SQLite oferece transações atômicas dentro do arquivo e WAL permite leitores concorrentes com um writer. Isso não torna efeito externo atômico, não protege contra um operador que reescreva todos os arquivos e não substitui backup verificado.

## Decisão

### Runtime e conexão

- Runtime mínimo do adapter: Node 24.16.0 exato na primeira baseline; upgrade exige CI/fault suite.
- Adapter: `node:sqlite` `DatabaseSync`, uma conexão writer por processo, APIs encapsuladas por CatalogPort.
- `allowExtension: false`, `defensive: true`, timeout de abertura/busy igual a 5000 ms e limites explícitos de SQL/valores.
- Toda entrada dinâmica usa prepared statement com parâmetros. Identificador SQL nunca vem de input.
- O adapter faz feature probe de `DatabaseSync`, `isTransaction`, defensive mode e backup antes de abrir o catálogo real.

`node:sqlite` executa suas APIs sincronicamente e continua marcado como release candidate; a decisão é conscientemente limitada ao P0 e fica atrás da porta ([documentação oficial Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)).

### PRAGMAs obrigatórios

Após abrir cada conexão, o adapter aplica e lê de volta:

~~~text
foreign_keys=ON
journal_mode=WAL
synchronous=FULL
trusted_schema=OFF
recursive_triggers=OFF
read_uncommitted=OFF
locking_mode=NORMAL
temp_store=MEMORY
busy_timeout=5000
wal_autocheckpoint=1000
journal_size_limit=67108864
secure_delete=ON
application_id=1229210945
user_version=1
~~~

Valor diferente do requerido bloqueia escrita. `synchronous=FULL` foi escolhido porque WAL com NORMAL pode perder transação já reportada como commit após queda de energia, embora mantenha consistência; o P0 prioriza evidência sobre throughput ([PRAGMA oficial](https://www.sqlite.org/pragma.html)). `secure_delete` é defesa secundária: conteúdo secreto deve ser impedido antes do banco e WAL/backups não são considerados sanitizados apenas por esse flag.

### Writer e transações

- Há um writer lógico por data root. Um lease singleton com nonce e heartbeat é adquirido dentro de `BEGIN IMMEDIATE`.
- Segundo writer falha com `catalog.writer_busy`; não espera indefinidamente nem toma lease ainda válido.
- Lease expirado não é roubado se recovery detectar transação/efeito ambíguo ou relógio incoerente; requer reconciliação.
- Transação CatalogPort usa `BEGIN IMMEDIATE`, callback síncrono, `COMMIT`; throw/erro executa `ROLLBACK`.
- Nenhum provider, tool, verifier, filesystem ou callback assíncrono roda dentro da transação.
- Event append e compare-and-set da projeção usam `expected_last_sequence`; zero rows updated é conflito, não retry silencioso.
- Guards SQLite exigem que a projeção inicial corresponda a `task.created` sequence 1 e que cada update avance exatamente uma sequence para o evento id/digest existente. Evento não mutador preserva estado; `task.transitioned` precisa repetir from/to e uma aresta normativa.
- Event insert exige cadeia contínua, previous digest exato, correlation da TaskRun e causation anterior da mesma task; budget ledger possui sequence contínua e escopo relacional equivalente.

SQLite serializa writes; WAL melhora a coexistência com readers, mas não cria múltiplos writers simultâneos ([isolamento oficial](https://www.sqlite.org/isolation.html)).

### DDL e mutabilidade

O DDL normativo é `persistence/p0_v1.sql`.

- Tabelas usam `STRICT`, FKs, CHECKs básicos e índices explícitos.
- Contratos completos permanecem em JSON canônico validado; colunas relacionais indexam identidade, vínculo, estado e invariantes concorrentes.
- Events, decisões, usos, intents, resultados, usage, ledger e journals de lifecycle são append-only por API e triggers defensivos.
- Projeções, lease, reservation e artifact correntes são mutáveis apenas por transições declaradas; reservation/artifact exigem antes o snapshot canônico correspondente no journal da mesma transação.
- Nenhuma tabela usa `INSERT OR REPLACE`, upsert permissivo ou cascade delete de evidência.
- IDs/digests são revalidados na aplicação; CHECK de prefixo/tamanho no DDL é defesa adicional, não parser normativo.

### Migrações

- Cada migração possui número crescente, nome, SHA-256 dos bytes e transação exclusiva.
- Antes de aplicar: backup verificado, `foreign_key_check`, `quick_check`, versão conhecida e nenhum recovery ativo.
- Checksum divergente para versão aplicada bloqueia abertura.
- Migração não reescreve evento; nova projeção é construída em tabela/versionamento novo e comparada antes da troca.
- Downgrade automático é proibido. Restore usa backup compatível ou migração forward ensaiada.

### Backup e restore

- Backup usa a API de backup do SQLite para arquivo novo; copiar apenas `.db` enquanto WAL está ativo é proibido.
- Após backup, uma conexão separada read-only executa `quick_check`, `foreign_key_check`, confere migrations/application_id e reprocessa a cadeia de eventos amostrada ou integral conforme gate.
- Manifest de backup registra digest dos bytes, versão, data root lógico, última sequence por task e ausência/presença de recovery pendente. Secret material não entra nele.
- Restore ocorre offline para caminho novo. Fecha conexões, verifica digest/integridade/schema/cadeia/artifacts, então troca o ponteiro de data root. Nunca sobrescreve o catálogo vivo como primeira etapa.
- Um restore tecnicamente íntegro mas com artifacts ausentes ou effects ambíguos abre em modo recovery read-only.

O mecanismo de commit é robusto dentro das suposições de filesystem/OS, mas pode ser contornado por filesystem quebrado ou adversário com controle do storage; a documentação do SQLite explicita esse limite ([atomic commit](https://www.sqlite.org/atomiccommit.html)).

## Fault profile obrigatório

| ID | Corte/falha | Invariante esperada |
|---|---|---|
| DB-F01 | antes de BEGIN | zero mudança |
| DB-F02 | após BEGIN IMMEDIATE | rollback ao fechar/crash |
| DB-F03 | após insert do record, antes do evento | zero fato parcial após recovery |
| DB-F04 | após evento, antes da projeção | zero fato parcial após recovery |
| DB-F05 | após projeção, antes de COMMIT | zero fato parcial após recovery |
| DB-F06 | retorno de COMMIT perdido | reabrir e consultar IDs/sequence; nunca reaplicar por suposição |
| DB-F07 | SQLITE_BUSY | erro estável; sem loop ilimitado |
| DB-F08 | disco cheio em write/WAL/checkpoint | rollback ou catálogo bloqueado; nunca sucesso textual |
| DB-F09 | corrupção de página | quick/integrity check falha; modo read-only/recovery |
| DB-F10 | WAL/truncamento inesperado | abertura falha ou recovery SQLite; cadeia revalidada |
| DB-F11 | kill durante migration | versão antiga íntegra ou migração inteira; checksum obrigatório |
| DB-F12 | kill durante backup | backup temporário não promovido |
| DB-F13 | backup íntegro com artifact ausente | restore recovery read-only |
| DB-F14 | dois writers | um lease; outro recebe writer_busy |
| DB-F15 | update/delete direto de evento | trigger aborta |
| DB-F16 | FK/integrity divergence | promoção/restore bloqueados |

Testes DB-F08–10 dependem de harness destrutível isolado; não são executados contra dados reais.

## Garantias e não garantias

Podemos alegar após a suite: atomicidade dos fatos dentro de uma transação SQLite, detecção de conflitos cobertos, replay determinístico e restore verificado no ambiente testado.

Não podemos alegar: exactly-once de efeitos externos, resistência a administrador malicioso, zero perda em qualquer hardware/filesystem, backup de secrets seguro, HA, multi-host ou recuperação sem perda antes dos faults passarem.

## Condições de promoção

- DDL executa em memória e arquivo no Node baseline;
- contract tests do CatalogPort passam contra fake e SQLite;
- DB-F01–16 passam nas matrizes Windows e Linux escolhidas;
- benchmark confirma que FULL atende ao orçamento de latência ou uma exceção explícita é aprovada;
- backup/restore drill produz catálogo e artifacts verificáveis.

## Condições de reabertura

- throughput exigir worker dedicado ou adapter assíncrono;
- `node:sqlite` mudar API/stability ou faltar feature necessária;
- múltiplos processos writers se tornarem requisito;
- filesystem alvo não sustentar as garantias testadas de lock/fsync/rename.
