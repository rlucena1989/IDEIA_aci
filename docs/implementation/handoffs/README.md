# Handoffs prontos para modelos de código

## Snapshot normativo

- contracts/registry: rc.7, 45 schemas JSON, 44 contratos de instância e 33 tipos de evento;
- SQLite DDL: 40 tabelas, 80 triggers, checksum `sha256:cb0ee9f4e21510505ee045ea89700918e9795de6907deee75fc9a65055a9bd84`;
- estado de implementação: diretório `p0` ainda não implementado;
- proteção operacional: este workspace ainda não possui Git; crie snapshot/controle de versão antes da primeira edição por modelo;
- segurança: SEC-INC-001 continua open e bloqueia WP-22/credenciais reais.

Entregue ao modelo o arquivo do WP, os documentos listados nele e nada que contenha credencial. Se qualquer contagem/checksum/assinatura divergir, pare e revalide o freeze em vez de adaptar silenciosamente.

Estes prompts da primeira onda podem ser entregues separadamente a modelos locais ou free tiers:

- [WP-01 — esqueleto isolado](WP-01.md)
- [WP-02A — relógios injetáveis](WP-02A.md)
- [WP-03 — máquina de estados](WP-03.md)
- [WP-06 — gate de limite duro](WP-06.md)
- [WP-10 — alinhamento documental da fixture](WP-10.md)

Depois da primeira base, estes handoffs já possuem contrato, mas pedem revisão mais forte:

- [WP-02B — IDs tipados](WP-02B.md)
- [WP-04 — JSON canônico e fingerprints](WP-04.md)
- [WP-05 — validators JSON Schema](WP-05.md)
- [WP-08 — projeção pura da tarefa](WP-08.md)
- [WP-09A — fixtures de forma](WP-09A.md)
- [WP-05B — tipos das ports](WP-05B.md)
- [WP-07A — fakes de provider/tool/verifier/catalog](WP-07A.md)

Segunda/terceira ondas, condicionadas aos pré-requisitos e ao perfil de autor indicado:

- [WP-07B — fake transacional do CatalogPort](WP-07B.md)
- [WP-07C — fake de ArtifactStore](WP-07C.md)
- [WP-09B — corpus semântico/transacional](WP-09B.md)
- [WP-11 — event store em memória](WP-11.md)
- [WP-12 — catálogo SQLite](WP-12.md)
- [WP-13 — ArtifactStore](WP-13.md)
- [WP-14 — approvals](WP-14.md)
- [WP-15 — policy/capabilities](WP-15.md)
- [WP-15B — admissão de GovernanceBundle](WP-15B.md)
- [WP-15C — budget engine multiunidade](WP-15C.md)
- [WP-16 — slice read-only](WP-16.md)
- [WP-17 — ToolBroker](WP-17.md)
- [WP-18 — filesystem/Git](WP-18.md)
- [WP-19 — process runner](WP-19.md)
- [WP-20 — slice mutável](WP-20.md)
- [WP-21 — faults/recovery/G2](WP-21.md)
- [WP-21B — runner de avaliação](WP-21B.md)
- [WP-22 — provider real](WP-22.md)

## Ordem

1. Execute e revise WP-01.
2. Integre WP-01.
3. WP-02A e WP-03 podem seguir em cópias separadas.
4. Depois de integrar WP-02A, execute WP-06.
5. WP-10 é independente e só altera documentação da fixture.
6. WP-02B segue WP-01.
7. WP-04 pode seguir WP-01 em cópia separada, mas só integra após revisão forte.
8. WP-05 segue WP-02B e requer autorização para instalar Ajv como dependência de runtime exata.
9. WP-08 segue WP-03; sua integração aguarda WP-05.
10. WP-09A só começa depois de WP-05 integrado.
11. WP-05B e WP-07A seguem WP-05; WP-07B só após WP-11; WP-07C segue WP-04/05B/07B.
12. WP-15B exige validação/canonicalização e WP-07C; WP-15C exige gate, fake transacional e event store.
13. WP-16 só fecha o slice read-only depois de WP-15B/15C; WP-17–20 só em fixture isolada.
14. WP-21B materializa EvaluationReport; WP-21 mede faults/G2; WP-22 só após ambos e SEC-INC-001 closed.

## Protocolo do operador

- Crie snapshot, commit ou cópia recuperável antes da primeira execução.
- Dê uma cópia, branch ou worktree exclusiva para cada modelo.
- Use baixa aleatoriedade quando a interface oferecer esse controle.
- Não forneça secrets nem credenciais ao contexto.
- Não permita rede ou shell fora da cópia de trabalho.
- Guarde prompt, identificação do modelo, parâmetros, diff e saída de testes.
- Não integre resposta textual como prova; execute os testes e faça a revisão independente.
- Integre um pacote por vez, na ordem de dependência.

O prompt WP-07 antigo em p0_prompts_primeira_onda.md foi substituído por WP-07A/WP-07B/WP-07C. Use os handoffs versionados deste diretório; WP-08 também deve usar registry rc.7.
