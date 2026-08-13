# Auditoria de pendências — 2026-08-10

## Concluído nesta rodada
- Instalações locais de OmniRoute, OpenCode, Freebuff, VS Code, Cursor, Devin e Antigravity localizadas para consulta.
- Metadados de versões, licenças e padrões de integração registrados sem copiar dados privados.
- Identidade canônica do OmniRoute definida pelo usuário.
- Instalação local consultada sem alteração.
- Evidências locais registradas em `ferramentas/omniroute.md`.
- Estudo de runtimes e sandbox criado.
- Protocolo de benchmark interno criado.
- Estratégia de custos/providers/privacidade criada.
- Plano de benchmark de RAG criado.

## Não executado
- Hardening da instalação do OmniRoute: requer autorização explícita e pode alterar autenticação, acesso e disponibilidade.
- PoC real de escape de sandbox: requer ambiente de teste descartável e definição de runtime.
- Benchmark de 40 tarefas: requer dataset/repositórios autorizados.
- Parecer LGPD/GDPR: requer revisão jurídica profissional.
- Tabela de preços: deve ser feita na data de decisão, pois é volátil.

## Próxima ordem recomendada
1. Não alterar OmniRoute enquanto for dependência ativa da pesquisa.
2. Criar protótipo vertical isolado em workspace sintético.
3. Criar benchmark mínimo com 10 tarefas autorizadas.
4. Medir RAG em repositório pequeno/médio.
5. Auditar uso de `shell: true` somente por leitura ou cópia para ambiente de teste.
6. Adiar hardening/configuração do OmniRoute para uma janela independente.
