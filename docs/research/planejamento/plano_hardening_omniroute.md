# Plano de hardening do OmniRoute local

## Escopo
Plano de análise e execução futura para `C:\Users\Usuario\.omniroute`. Nenhuma ação foi executada nesta rodada.

## Pré-condições
- confirmar autorização do usuário;
- identificar processo/versão em execução;
- fazer backup verificável de SQLite, configurações e perfis;
- registrar hash e localização dos backups;
- confirmar como restaurar sem trocar a chave de criptografia;
- garantir acesso local ao dashboard durante a mudança.

## Ordem segura
1. **Segredo da aplicação:** confirmar que a chave de armazenamento não está versionada nem exposta; não trocar sem migração.
2. **Senha de gestão:** substituir `CHANGEME` por senha forte e testar logout/login.
3. **API:** habilitar autenticação obrigatória e testar chamadas válidas/inválidas.
4. **Rede:** manter bind local; só expor por proxy autenticado e TLS se necessário.
5. **Rate limiting:** configurar Redis persistente para uso compartilhado ou documentar limite do modo em memória.
6. **Shell:** auditar o warning `shell: true`, quoting, allowlist e origem dos argumentos.
7. **Logs:** revisar retenção, redaction e permissões de `call_logs`, OAuth, SQLite e backups.
8. **Validação:** testar dashboard, `/v1`, clients, quotas, fallback, backup e restart.

## Critérios de aceite
- senha padrão não aceita;
- bearer inválido recebe rejeição;
- endpoints administrativos exigem autenticação;
- rate limit sobrevive a restart quando Redis é requisito;
- nenhum secret aparece em logs ou prompts;
- comandos com metacaracteres não escapam da política;
- backup restaura em ambiente de teste;
- funcionalidade dos clientes permanece preservada.

## Risco
Trocar a chave de criptografia ou apagar banco sem procedimento pode tornar credenciais e dados ilegíveis. A execução exige confirmação explícita e janela de recuperação.
