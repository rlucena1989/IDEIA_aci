# ADR-005 — Validação JSON Schema no build

- Status: aceita provisoriamente para implementação P0
- Data: 2026-08-13
- Desbloqueia: WP-05
- Relaciona: RF-004.1, RF-005.2, RF-006.1–2, RF-019.1; RNF-001, RNF-018

## Contexto

Node 24 não fornece validador JSON Schema. Implementar um subconjunto artesanal e chamá-lo de JSON Schema 2020-12 criaria divergência silenciosa. Carregar e compilar schemas não confiáveis em runtime também amplia a superfície de ataque.

## Decisão

- Usar Ajv 8.20.0 com versão exata como única dependência de runtime desta etapa.
- Usar a entrada específica para draft 2020-12.
- Compilar todos os schemas aprovados em módulos ESM standalone durante o build.
- O runtime importa os validators gerados e somente os helpers necessários de ajv/dist/runtime; não inicializa nem compila Ajv.
- Schemas dinâmicos, remotos ou fornecidos por usuário não são compilados no P0.
- Registry aceita apenas schema_id presente no catálogo gerado.
- Desabilitar fetch de schema e qualquer resolução de rede.
- Não habilitar $data nem keywords customizados.
- Configurar strict true, coerceTypes false, useDefaults false, removeAdditional false e validateFormats false.
- Falha de compilação, warning strict, referência ausente ou ID duplicado quebra o build.
- Arquivos gerados devem ser reproduzíveis; regenerar sem mudança de schema/versão deve produzir os mesmos bytes.

## Formatos

O P0 não depende de ajv-formats:

- timestamps têm regex estrutural e guard semântico próprio para instante UTC válido;
- schema URIs pertencem ao catálogo local e são comparadas por valor exato;
- IDs, digests, currency e nomes têm padrões explícitos.

Isso evita uma segunda dependência e não transforma format, que pode ser apenas annotation conforme configuração, em controle de segurança implícito.

## Segurança e supply chain

- package-lock entra no primeiro commit que instalar Ajv;
- instalação limpa usa npm ci;
- scripts de dependência não são necessários para compilar os validators e devem ser avaliados no lock;
- $data permanece desligado;
- o gerador roda em ambiente de build, nunca sobre schema vindo de modelo, tool ou rede;
- output standalone passa pelos mesmos testes de contrato;
- npm ci --omit=dev precisa executar os validators com os helpers disponíveis;
- upgrade exige diff de código gerado, suite completa e revisão de advisories.

Ajv 8.18.0 corrigiu CVE-2025-69873 relacionado a pattern com $data; 8.19.0 corrigiu prototype pollution via format com $data; 8.20.0 adicionou suporte explícito a Node 22/24. O P0 também desliga $data e formatos.

## Alternativas rejeitadas

| Alternativa | Motivo |
|---|---|
| validator JSON Schema escrito no projeto | alto risco de semântica parcial e manutenção de padrão |
| Ajv em runtime compilando qualquer schema | Function/code generation e schemas não confiáveis ampliam superfície |
| Ajv somente em devDependency, sem bundler | o standalone ainda importa helpers de ajv/dist/runtime |
| bundler só para remover helpers de runtime | adiciona outra dependência e cadeia de transformação sem benefício provado no P0 |
| ignorar JSON Schema e manter apenas tipos TypeScript | tipos não validam bytes externos |
| usar format como controle sem plugin/config explícita | comportamento pode ser apenas annotation ou variar |

## Evidência externa

- [Ajv — JSON Schema 2020-12](https://ajv.js.org/json-schema.html).
- [Ajv — standalone validation code](https://ajv.js.org/standalone.html).
- [Ajv 8.20.0](https://github.com/ajv-validator/ajv/releases/tag/v8.20.0).
- [Ajv 8.19.0](https://github.com/ajv-validator/ajv/releases/tag/v8.19.0).
- [Ajv 8.18.0](https://github.com/ajv-validator/ajv/releases/tag/v8.18.0).

## Condições de reabertura

- advisory afetar a configuração usada;
- standalone ESM não for reprodutível no build;
- bundle gerado exceder custo medido aceitável;
- schemas dinâmicos tornarem-se requisito aprovado;
- outra implementação passar a mesma suite com superfície menor.
