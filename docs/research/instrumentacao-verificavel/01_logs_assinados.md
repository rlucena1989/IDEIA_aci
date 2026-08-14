# Estudo 01: logs assinados

**Pergunta:** como o IDEIA_aci deve vincular um evento de agente a uma identidade verificavel, sem fazer de cada evento uma transacao blockchain?
**Decisao informada:** contrato criptografico do evento e estrategia de chaves.
**Hipotese H-LS01:** assinar checkpoints de lotes, e nao cada span, oferece evidencia suficiente para auditoria interna com custo e latencia inferiores a assinatura por evento.
**Refutacao:** se os testes mostrarem que um evento critico pode ficar sem prova dentro do RPO definido, ou que a verificacao nao identifica adulteracao/reordenacao, promover assinatura por evento para essa classe.

## Valor real para a IA

Logs assinados nao aumentam raciocinio, qualidade de resposta ou capacidade do modelo diretamente. Eles tornam confiaveis os dados usados para descobrir por que uma resposta falhou: qual configuracao, ferramenta, contexto, politica e versao produziram o resultado. Esse valor so aparece quando eventos assinados sao ligados a rotulos de resultado, testes e decisao de promover/reverter uma mudanca.

O maior ganho esta em tres cenarios: disputa sobre uma acao autonomica, incidente de seguranca e comparacao de experimentos. Se o projeto for de um unico operador e sem auditoria externa, assinatura de batches ainda e util, mas deve ser justificada pelo custo de diagnostico, nao por compliance generico.

## Topicos centrais

| Topico | Perguntas de pesquisa | Direcionamento para o projeto |
|---|---|---|
| Canonicalizacao | Dois processos geram exatamente os mesmos bytes para o mesmo evento? Campos opcionais, numeros, datas e Unicode foram definidos? | Adotar envelope versionado e canonicalizacao deterministica antes do hash. Nao assinar `JSON.stringify` sem especificacao de serializacao. |
| Identidade | Quem assina: instancia, usuario, servico, pipeline ou ferramenta? Qual identidade pode executar qual acao? | Comecar com identidade de workload por ambiente e registrar `key_id`, emissor, escopo e periodo de validade. |
| Algoritmo e chaves | Qual algoritmo e KMS suportam assinatura, verificacao e rotacao? | Avaliar Ed25519 para assinatura de aplicacao ou chave assimetrica gerenciada em KMS. A escolha depende do ambiente alvo; nao fixar biblioteca antes do spike. |
| Granularidade | Assinar evento, lote, sessao ou decisao critica? | Evento critico: aprovacoes, mudanca de permissao, execucao de escrita, deploy, memoria persistente. Restante: batch curto com raiz Merkle assinada. |
| Verificacao | Como detectar alteracao, insercao, remocao, reordenacao e uso de chave revogada? | Verificador independente deve reconstituir payload canonico, validar assinatura, sequencia, prova de inclusao e cadeia de certificados/estado da chave. |
| Custodia | Como rotacionar e revogar sem invalidar o passado? | Eventos preservam `key_id` e material de verificacao. Revogar impede novas assinaturas; nao reescreve evidencias antigas. |

## Topicos perifericos, mas necessarios

- Carimbo de tempo: relogio local e fraco para disputa; investigar TSA ou ancora externa apenas para lotes criticos.
- Transparencia publica: Rekor ou log equivalente pode provar existencia fora do dominio do projeto, mas pode expor metadados e cria dependencia externa. Nao e requisito P0.
- TEE: somente vale investigar se a ameaca inclui host comprometido e houver hardware/operacao para validar quote real. O atual `TEEProvenanceAttestation` gera valores sinteticos e nao deve ser chamado de attestacao de hardware.
- Assinatura de artefatos: aplicar SLSA/Sigstore a builds, manifestos de ferramentas MCP e conjuntos de avaliacao e uma extensao de alto valor; e diferente de assinar telemetria de runtime.
- Multi-organizacao: exige federacao de identidade, auditoria de acesso e acordo sobre confianca. E prematuro sem caso de uso externo concreto.

## Contrato P0 e extensao de assinatura

O `EventEnvelope v1` P0 ja fixa `event_id`, `task_id`, `sequence`, tempos de ocorrencia/registro, `principal_id`, `project_id`, `step_id`, `event_type`, correlacao, causacao, payload, `payload_digest`, `previous_event_digest`, `fingerprint_profile` e `event_digest`. O perfil `jcs-sha256-v1` valida, redige, canonicaliza em RFC 8785, aplica separacao de dominio e calcula SHA-256. A extensao nao deve criar um segundo envelope nem alterar os bytes historicos: ela assina um objeto de checkpoint que referencia o range de eventos P0.

O payload de evento continua sem segredo, prompt bruto ou output bruto por padrao. Conteudo elegivel para replay fica em ArtifactRef classificado, com controle de acesso e lifecycle separados.

```text
SignedCheckpoint v1
  checkpoint_id        id estavel; nunca reutilizado
  task_id or stream_id stream coberto e dominio de ordenacao
  first_sequence       inicio inclusivo do lote
  last_sequence        fim inclusivo do lote
  first_event_digest   digest P0 do primeiro evento
  last_event_digest    digest P0 do ultimo evento
  tree_algorithm       versao explicita do algoritmo Merkle
  merkle_root          raiz sobre folhas definidas pelo perfil
  previous_checkpoint  checkpoint anterior do mesmo stream, ou null
  created_at           tempo do emissor; nao e prova de tempo externo
  signing_profile      algoritmo, canonicalizacao e separacao de dominio
  key_id               identificador imutavel da chave publica/verificadora
  signer_identity      workload, emissor e escopo autorizado
  signature            assinatura destacada sobre todos os campos anteriores
  timestamp_token      opcional; somente se TSA for requisito formal
```

### Perfis de assinatura a comparar

| Perfil | Quando usar | Vantagem | Limitacao |
|---|---|---|---|
| Local assimetrico | P0/local sem KMS | simples, sem rede | protecao da chave depende do host |
| KMS por workload | ambiente cloud/hibrido com identidade | rotacao, autorizacao e trilha de uso centralizadas | dependencia de provedor e disponibilidade |
| Keyless/OIDC com bundle | CI, artefatos e checkpoints de release | identidade de workload e verificacao offline por bundle | nao resolve autenticidade do host de runtime |
| TSA RFC 3161 | disputa sobre data/hora ou evidencia de longo prazo | prova temporal por terceiro | custo, disponibilidade e politica de confianca |

O formato de assinatura, algoritmo, cadeia de certificados e KMS nao devem ser escolhidos por preferencia. O spike deve avaliar compatibilidade do runtime, latencia, rotacao, exportacao de chave publica, verificacao offline e procedimento de incidente. NIST SP 800-57 e referencia para o ciclo de vida de chaves; RFC 3161 so entra se houver requisito de tempo independente.

### Regras de verificacao

1. Validar schema e versao do checkpoint antes de qualquer operacao criptografica.
2. Recalcular os digests P0 dos eventos, a cadeia de `previous_event_digest`, o range e a raiz Merkle pelo perfil declarado.
3. Validar assinatura, algoritmo permitido, `key_id`, cadeia/issuer e periodo de validade de acordo com a politica historica.
4. Verificar que a identidade do assinante tinha escopo para aquele stream na data declarada.
5. Validar encadeamento entre checkpoints e detectar buraco, sobreposicao, encolhimento ou fork.
6. Se houver TSA ou transparencia, validar o token/prova separadamente; falha nao deve ser escondida por assinatura local valida.

## Gaps verificados no repositorio

| ID | Observacao | Impacto | Proximo passo |
|---|---|---|---|
| LS-G01 | O P0 ja possui `EventEnvelope v1` e ADR-004 com RFC 8785, separacao de dominio e vetores; os packages legados continuam com cadeia sem assinatura. | O contrato P0 deve ser a unica base de extensao; duplicar canonicalizacao reintroduz divergencia. | Implementar checkpoint assinado apenas sobre digests P0 validados. |
| LS-G02 | Ainda nao ha contrato de `SignedCheckpoint`, `key_id`, identidade, algoritmo, revogacao ou verificacao historica no P0. | A cadeia P0 detecta divergencia no dominio declarado, mas nao produz autoria ou nao repudio. | Criar ADR, schema, vetores e verificador independente na onda posterior. |
| LS-G03 | `TEEProvenanceAttestation` produz hash e quote locais sinteticos. | Pode induzir a falsa alegacao de attestation de hardware. | Renomear/quarentenar como stub ou substituir por integracao real apos decisao de ameaca. |
| LS-G04 | A meta-auditoria existente registra dependencias e integracao nao demonstradas para packages. | Nao ha base para acoplar o novo contrato diretamente aos packages. | Executar gate de build, testes e proveniencia antes de reuso. |

## Metricas e gates

| Metrica | Definicao | Gate inicial |
|---|---|---|
| Cobertura de assinatura critica | eventos criticos com assinatura verificavel / eventos criticos emitidos | 100% em teste de integracao |
| Falha de verificacao | envelopes invalidos aceitos / casos invalidos | 0 em suite de adulteracao |
| Tempo de verificacao | p95 para validar um envelope ou checkpoint | definir baseline no spike; nao bloquear fluxo interativo sem medida |
| Janela sem ancora | maior intervalo entre evento critico e checkpoint verificavel | <= RPO decidido no experimento |
| Rotacao testada | chaves rotacionadas com evidencias antigas verificadas | 100% dos cenarios de rotacao/revogacao |
| Exposicao de dados | eventos assinados contendo secret/PII proibido | 0 em corpus de canarios e testes de redacao |

## Evidencias e limites

| ID | Afirmacao | Classe | Evidencia | Confianca |
|---|---|---|---|---|
| LS-E01 | Um log de transparencia pode oferecer promessa assinada de inclusao e verificacao offline a partir de bundle. | Fato | [Sigstore](https://docs.sigstore.dev/cosign/verifying/verify/) | Alta para Cosign; aplicacao ao IDEIA e inferencia |
| LS-E02 | Proveniencia deve ser vinculada ao artefato e distribuida com ele. | Fato | [SLSA](https://slsa.dev/spec/v1.2/) | Alta para supply chain; nao prova adequacao para runtime |
| LS-E03 | Checkpoint por lote e melhor que assinatura por evento para o IDEIA_aci. | Hipotese | ainda sem medicao local | Baixa; requer experimento IV-EXP02 |

## Perguntas em aberto

1. Qual provedor de chaves e identidade o ambiente de implantacao realmente oferece?
2. Quais eventos sao legal ou operacionalmente criticos e qual RPO de evidencia cada classe requer?
3. O projeto precisa provar eventos para terceiros, ou apenas detectar adulteracao e apoiar investigacao interna?
