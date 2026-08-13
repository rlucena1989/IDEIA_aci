# Handoff WP-15C — budget engine e reserva multiunidade

## Perfil e pré-condições

Autor S, revisão S independente. O núcleo aritmético puro pode ser delegado a F, mas integração transacional não. Exige WP-06, 07B, 11 e ADR-011; integração SQLite exige WP-12.

## Objetivo

Implementar estimativa racional exata, hard gate composto, reserva transacional antes de I/O e conciliação append-only de usage/ledger sem liberar ambiguidade como zero.

## Leia

- docs/implementation/adr/ADR-011-valores-exatos-precos-e-orcamentos.md
- docs/implementation/contracts/v1/price-book.schema.json
- docs/implementation/contracts/v1/budget-set.schema.json
- docs/implementation/contracts/v1/budget-reservation.schema.json
- docs/implementation/contracts/v1/budget-reservation-lifecycle.schema.json
- docs/implementation/contracts/v1/budget-ledger-entry.schema.json
- docs/implementation/contracts/v1/usage-record.schema.json
- docs/implementation/contracts/ports_v1.md

## Arquivos autorizados

- p0/src/domain/exact-rational.ts
- p0/src/domain/budget-gate.ts
- p0/src/application/budget-service.ts
- p0/test/domain/exact-rational.test.ts
- p0/test/domain/budget-gate.test.ts
- p0/test/application/budget-service.test.ts
- p0/test/fixtures/budget/

## Aceite

- nenhuma aritmética monetária usa Number/float; parse aceita somente inteiros seguros dos contratos e converte internamente a BigInt;
- soma racional por chamada/moeda antecede um único ceiling; overflow/denominator zero falha;
- unidades/moedas não se misturam e todos os limites aplicáveis passam antes do commit;
- accounting é lido por `CatalogTransaction.readBudgetAccounting`; nenhuma leitura pré-transação autoriza reserva;
- reservation + lines + lifecycle snapshot + ledger reserved + evento são um commit; falha deixa zero fato parcial;
- ProviderPort/ToolPort não é chamado antes do commit da reserva;
- terminal confirmado acrescenta lifecycle snapshot/usage/confirmed/released; não atualiza fatos antigos;
- unknown/ambiguous preserva reserva ou possible_overage até reconciliação;
- retry usa CallId/ReservationId novos;
- CST-X01–12, CT-U01–19 e PORT-17 passam contra fake; depois, contra SQLite.

## Pare sem editar se

- for necessário consultar preço/quota online;
- algum requisito pedir conversão cambial, quota organizacional compartilhada ou estimativa sem limite superior;
- a operação composta do CatalogPort não puder preservar atomicidade.
