# SEC-INC-001 — Potencial chave material em documentação

- Detectado: 2026-08-13
- Severidade provisória: critical até provar invalidação/valor fictício
- Estado: open — contenção documental concluída; rotação externa pendente
- Escopo: documentação de segurança/backup do workspace; histórico e backups ainda não auditados

## Evidência sem republicar o segredo

Foi encontrado um literal com formato de chave de criptografia em dois documentos. O literal foi removido/redigido. Varredura direcionada posterior encontrou zero ocorrência atual desse padrão literal e zero header de private key nos documentos varridos.

Na validação final de 2026-08-13, o workspace atual também apresentou zero match para famílias OpenAI-style, GitHub, AWS access key, Google API key, JWT literal, private-key header, assignment de credencial, bearer literal e connection string com senha. Isso é contenção do estado corrente, não auditoria de histórico/backups nem prova de invalidação.

O valor não é reproduzido neste registro, em log, hash público ou prompt de handoff.

## Ações concluídas

- remoção do literal nos dois documentos atuais;
- quarentena das orientações antigas de backup plaintext;
- inclusão do incidente no threat model e nos gates;
- proibição de tratar cópia/backup de `.env` como estratégia segura.

## Ações obrigatórias do proprietário

1. identificar o sistema/credencial a que o valor pertencia sem colá-lo em chat/log;
2. rotacionar ou invalidar no sistema proprietário;
3. confirmar que aplicações/backup usam a nova credencial via secret store/handle;
4. revisar histórico de versão, exports, backups, caches e logs onde o literal possa persistir;
5. registrar data, responsável e evidência redigida da rotação;
6. só então mudar estado para closed.

## Critério de fechamento

Não basta o literal ter sumido do arquivo atual. Fechamento exige prova de invalidação/rotação e decisão sobre histórico/backups. Se for demonstrado que era fixture sem qualquer vínculo operacional, a reclassificação precisa registrar a origem da fixture e por que não poderia autenticar/decriptar nada real.
