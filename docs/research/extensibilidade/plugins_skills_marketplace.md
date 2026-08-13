# Plugins, skills e marketplace

## Arquitetura
Plugin = manifesto versionado + tools/resources/prompts + permissões declaradas + entrypoint isolado. SDK deve ter contratos estáveis, schemas e lifecycle.

## Segurança
Instalação exige origem, checksum/assinatura, revisão de dependências e sandbox. Skills comunitárias não recebem rede/secrets por padrão. Registrar versão e hash em cada execução.

## Catálogo
Skills por linguagem (TypeScript, Python, Go), framework (React, FastAPI, Spring), domínio (segurança, dados, DevOps) e organização (privadas). Avaliar por testes, compatibilidade, manutenção e incidentes.

## Marketplace
Começar com registry privado/local e importação manual. Marketplace público somente com scanning, assinatura, reputação, política de remoção e permissões visíveis. MCP deve seguir o mesmo modelo; protocolo não implica confiança.

## Recomendação MVP
Implementar skills locais declarativas e MCP configurado pelo usuário. Adiar marketplace público e execução de código de terceiros até existir sandbox robusto.
