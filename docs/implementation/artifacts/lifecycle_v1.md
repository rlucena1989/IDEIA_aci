# Contrato operacional do ArtifactStore P0 v1

## Estrutura lógica

~~~text
artifact-root/
  staging/<task-id>/<artifact-id>.<nonce>.tmp
  objects/<task-id>/<artifact-id>/<sha256-hex>
  quarantine/<task-id>/<artifact-id>/<sha256-hex>
~~~

Os segmentos são produzidos somente de IDs/digest já validados. O adapter usa paths absolutos resolvidos, verifica mesmo volume e recusa symlink, junction, mount/reparse inesperado ou arquivo não regular.

## Operações

| Operação | Pré-condição | Pós-condição de sucesso |
|---|---|---|
| stage | limites/classes presentes; task gravável | bytes sincronizados + projeção staged + lifecycle snapshot canônico; não servível |
| commit | staged íntegro; destino ausente; writer lease | destino verificado + metadata committed + lifecycle + evento |
| read | committed + escopo | cópia dos bytes íntegros e limitados |
| verify | metadata conhecida | tamanho/digest/file-kind conferidos |
| quarantine | staged/committed ou divergência | leitura normal bloqueada + lifecycle/evento |
| tombstone | committed/quarantined + retention decision | metadata terminal; delete físico separado |

## Códigos de erro mínimos

| Código | Retry |
|---|---|
| artifact.limit_missing | never |
| artifact.limit_exceeded | never |
| artifact.unsupported_media_type | never |
| artifact.data_class_denied | never |
| artifact.scope_denied | never |
| artifact.cross_volume | never |
| artifact.destination_exists | manual |
| artifact.digest_mismatch | never |
| artifact.missing | manual |
| artifact.quarantined | never |
| artifact.sync_failed | ambiguous |
| artifact.catalog_commit_failed | manual |
| artifact.invalid_transition | never |

Mensagem e evidence ref são redigidas. Path absoluto, bytes e trecho detectado não entram no erro.

## Ordem do commit

~~~text
write/sync/close staging
  -> Catalog: metadata staged
  -> same-volume move to final
  -> reopen + verify
  -> Catalog transaction:
       append artifact_lifecycle com metadata canônica/fingerprint
       artifact projection staged -> committed apontando o novo snapshot
       append artifact.published
       compare-and-set projection/event sequence
  -> return ArtifactRef
~~~

Filesystem final antes do commit cria orphan recuperável. Commit antes do filesystem poderia criar referência committed sem bytes e, portanto, é proibido.

## Contract tests compartilhados

Além de ART-F01–16:

- mesma entrada produz mesmo digest, mas ArtifactIds distintos e sem dedup físico;
- mutação da origem depois de stage não altera bytes já copiados;
- buffer passado pelo chamador pode ser mutado depois sem alterar o artifact;
- leitura retorna cópia defensiva;
- ordem e nomes de diretório não vêm de media type/nome de usuário;
- nenhum caminho temporário aparece em evento ou resposta pública;
- lifecycle row sequence começa em 1 e é contígua;
- toda mudança da projeção possui antes, na mesma transação, lifecycle snapshot com estado/timestamp/fingerprint correspondentes;
- evento published/quarantined corresponde à metadata na mesma transação.
