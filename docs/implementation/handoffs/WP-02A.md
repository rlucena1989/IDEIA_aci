# Handoff WP-02A — relógios injetáveis

Você está implementando um pacote estritamente limitado do P0 do projeto IDEIA.

## Pré-condição

WP-01 deve estar integrado. Se p0 não existir ou o smoke test não passar, pare sem editar.

## Objetivo

Separar tempo UTC de auditoria e tempo monotônico com fakes determinísticos.

## Leia antes de editar

- docs/implementation/adr/ADR-001-runtime-p0.md
- docs/research/arquitetura/tarefas_longas_assincronas.md, seção 9

## Arquivos autorizados

- p0/src/domain/clock.ts
- p0/test/domain/clock.test.ts

## Implemente

- AuditClock com nowUtc;
- MonotonicClock com nowMs não decrescente;
- FakeAuditClock com definição e avanço explícitos;
- FakeMonotonicClock com avanço explícito;
- cópia defensiva de valores Date;
- rejeição de recuo no fake monotônico.

## Critérios de aceite

- os fakes não leem Date.now nem performance.now;
- valores retornados não permitem mutar o estado interno;
- avanço zero e positivo funcionam;
- avanço negativo ou recuo falham explicitamente;
- testes usam node:test e node:assert/strict;
- não implementar identificadores, scheduler ou timeout.

## Regras

- Não edite packages, documentos ou arquivos fora da lista.
- Não acesse a rede e não adicione dependências.
- Use ESM, imports locais com extensão .ts e sintaxe apagável.
- Não use any, ts-ignore, catch vazio, fallback permissivo ou TODO.
- Não leia relógios globais fora de adapters reais, que não pertencem a este pacote.
- Se houver conflito ou ambiguidade relevante, pare sem editar e relate.

## Resposta obrigatória

1. resumo;
2. arquivos alterados;
3. testes executados e resultado;
4. requisitos atendidos;
5. limitações;
6. confirmação de que não editou fora do escopo.

