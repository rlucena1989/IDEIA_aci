# Estratégia de testes

- Unitários: gerar e executar testes de funções alteradas.
- Integração: APIs, banco, filas e providers falsos.
- E2E: fluxos críticos em ambiente isolado.
- Regressão: suite existente antes/depois; rollback se limiar excedido.
- Mutation testing: validar força dos testes em módulos críticos.
- Segurança: SAST, secrets, dependências, prompt/tool injection.
- Performance: latência, memória, concorrência e custo.
- Agentes/tools/plugins: contratos, schemas, timeouts e sandbox.
- Prompts: dataset fixo, outputs estruturados e avaliações cegas.

Critério de aceite: lint/typecheck passam, testes relevantes passam, zero findings críticos e diff revisado. Flaky tests devem ser classificados, não simplesmente ignorados.
