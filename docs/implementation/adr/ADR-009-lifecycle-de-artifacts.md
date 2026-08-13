# ADR-009 — Lifecycle, atomicidade e quarentena de artifacts

- Status: aceita como release candidate; promoção depende de fault tests por filesystem
- Data: 2026-08-13
- Fecha documentalmente: OD-DP-03 e parte de OD-DP-08
- Relaciona: WP-13, WP-17, RF-018, RF-019, RNF-011, RNF-013, RNF-020

## Contexto

Eventos não devem carregar prompts, outputs, stdout/stderr ou arquivos grandes. Esses bytes precisam de endereçamento por conteúdo, limites, classificação, redação, escrita recuperável e verificação antes de servir como evidência. Um rename atômico isolado não coordena filesystem e SQLite; o P0 precisa representar explicitamente as janelas de crash.

## Decisão

### Identidade e layout

- ArtifactId identifica o registro/lifecycle; `raw-sha256-v1` digest identifica os bytes.
- Não há deduplicação física entre ArtifactIds no P0. Isso permite quarentena, retenção e classificação por registro sem contaminar outro principal/task que produziu bytes iguais.
- Data root e artifact root são resolvidos por configuração confiável. `storage_key` é gerada internamente a partir de TaskId, ArtifactId e digest; input nunca vira caminho.
- Staging, objects e quarantine ficam no mesmo volume. Adapter recusa promoção cross-volume.
- D5 nunca é artifact. D5 é handle para secret mantido no store proprietário.

### Pipeline de escrita

1. validar task, classe, media type e limites obrigatórios;
2. criar arquivo exclusivo em staging com nome interno imprevisível;
3. escrever em chunks limitados, contando bytes e SHA-256 simultaneamente;
4. executar `FileHandle.sync()`, fechar e conferir tamanho/digest esperado;
5. persistir metadata/lifecycle `staged` no catálogo;
6. mover o arquivo fechado para o caminho final no mesmo volume, sem substituir arquivo existente;
7. reabrir e conferir tamanho/digest do destino;
8. em uma transação, mudar `staged -> committed`, acrescentar lifecycle e evento `artifact.published`;
9. somente depois retornar ArtifactRef servível.

Node expõe `FileHandle.sync()` como pedido de flush dependente de OS/dispositivo e alerta que operações assíncronas de filesystem não são sincronizadas automaticamente ([Node fs oficial](https://nodejs.org/download/release/latest-v24.x/docs/api/fs.html)). No Windows, flush e move também dependem dos contratos do sistema/volume; a documentação distingue flush de buffers e movimentos que podem copiar entre volumes ([FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers), [moving/replacing files](https://learn.microsoft.com/en-us/windows/win32/fileio/moving-and-replacing-files)). Por isso, a alegação é condicionada ao fault profile, não ao nome da syscall.

O single writer do ADR-008 elimina corrida entre dois writers conformes. Se o destino já existe, o adapter não sobrescreve: verifica identidade e bloqueia como colisão/orphan até recovery.

### Leitura

Uma leitura exige:

- ArtifactId existente e lifecycle committed;
- task/principal/escopo compatíveis;
- storage key resolvida ainda dentro do artifact root sem link/reparse escape;
- arquivo regular, tamanho e digest iguais à metadata;
- media/data class permitidos para o consumidor.

Falha move o registro para quarentena quando possível e nunca retorna bytes parciais. Verificação pode usar cache apenas vinculado a `(artifact_id, digest, size, file identity/mtime observada)` e o revalida no gate de evidência.

### Quarentena e tombstone

- `staged -> quarantined`, `committed -> quarantined` e `committed|quarantined -> tombstoned` são as únicas transições além de `staged -> committed`.
- Quarentena bloqueia toda leitura normal. Mover bytes para diretório quarantine é preferível quando seguro no mesmo volume; falha em mover ainda bloqueia via catálogo.
- Evento de quarentena contém reason code e digests, nunca trecho suspeito.
- Tombstone registra decisão de retenção; remoção física é job separado, idempotente e auditado. O P0 não promete secure erase em SSD, WAL, backup ou storage remoto.
- Artifact committed nunca volta a staged; quarantined/tombstoned nunca volta a committed.

### Limites

Toda chamada de stage recebe, sem defaults ocultos:

- `max_single_artifact_bytes`;
- `remaining_task_artifact_bytes`;
- `max_staging_bytes`;
- `max_open_artifacts`;
- deadline monotônico;
- media types e data classes permitidos.

Os números pertencem ao Manifest/MP-P0 e continuam pendentes de medição. Ausência de qualquer limite bloqueia a escrita. Ultrapassagem aborta, fecha e agenda limpeza do temporário; truncar e publicar é proibido.

### Recovery de janelas filesystem/DB

| Estado observado | Disposição |
|---|---|
| arquivo staging sem row | orphan; quarentena/limpeza após grace registrada |
| row staged + staging íntegro | pode retomar promoção sob recovery |
| row staged + destino final íntegro | completar commit/evento após provar causação |
| row staged sem bytes | marcar quarantined/missing |
| row committed sem destino | quarantined/missing; tarefa não verifica sucesso |
| destino sem row | orphan; nunca importar automaticamente |
| digest/tamanho divergente | quarantine e incident signal |
| lifecycle/evento divergente | recovery bloqueado; não inferir por timestamp |

## Fault profile

| ID | Corte/falha | Esperado |
|---|---|---|
| ART-F01 | antes de criar staging | zero arquivo/row |
| ART-F02 | durante chunk | temporário não servível |
| ART-F03 | limite excedido | falha explícita; nada publicado |
| ART-F04 | sync/close falha | nada publicado |
| ART-F05 | após sync, antes da row staged | orphan detectável |
| ART-F06 | após row staged, antes do move | retomável ou quarantine |
| ART-F07 | após move, antes do commit | destino + row staged; não servível |
| ART-F08 | após commit, resposta perdida | consulta por ArtifactId evita duplicação |
| ART-F09 | destino pré-existente | sem overwrite; colisão/orphan bloqueia |
| ART-F10 | cross-volume/reparse | deny.scope |
| ART-F11 | bytes mudam após commit | verify falha e quarantine |
| ART-F12 | arquivo some após commit | missing/quarantine |
| ART-F13 | tentativa de ler quarantined | deny.artifact_quarantined |
| ART-F14 | D5 ou secret detector falha | nenhum artifact/request; redaction.failed |
| ART-F15 | kill durante quarantine move | catálogo continua bloqueando leitura |
| ART-F16 | tombstone job repetido | mesmo estado; sem erro permissivo |

## Não garantias

Esta decisão não prova secure erase, atomicidade conjunta filesystem+SQLite, durabilidade em todos os filesystems, ausência de secret por detector, deduplicação segura ou retenção legal. Esses pontos exigem ambiente/policy e evidência próprios.

## Condições de promoção

- ART-F01–16 em NTFS local e filesystem Linux escolhido;
- corpus de paths, symlink/junction/reparse e alteração concorrente;
- quotas MP-P0 medidas e congeladas;
- recovery drill resolve todas as combinações da tabela sem publicar bytes divergentes;
- backup/restore inclui metadata e objects e detecta ausência.
