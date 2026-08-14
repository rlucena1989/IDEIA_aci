# ADR-011 — Valores exatos, preços, quotas e orçamento multiunidade

- Status: aceita para contratos P0 v1 release candidate
- Data: 2026-08-13
- Fecha: representação decimal aberta no estudo de custos
- Relaciona: RF-020, RNF-021, WP-06, WP-12, WP-22

## Contexto

Um único limite no TaskManifest não representa simultaneamente chamadas, tokens, duração e moeda. Preços por milhão de tokens também podem ser fração da menor unidade monetária por token; float binário ou decimal implícito produz divergência de gate.

## Decisão

### Quantidades

- Uso, limites, reservas e ledger usam inteiros seguros não negativos em unidade explícita.
- Unidades diferentes nunca são somadas. `currency_minor` exige código ISO 4217 maiúsculo; demais unidades usam currency null/`''` apenas na representação SQL.
- BudgetSet contém um ou mais limites independentes. Se qualquer limite aplicável seria alcançado ou excedido pela nova reserva, a operação cobrável não inicia.

### Preço racional

Cada PriceBook entry representa exatamente:

~~~text
price_minor / unit_quantity
~~~

`price_minor` e `unit_quantity` são inteiros; denominator zero é proibido. Exemplo conceitual: 100 unidades monetárias menores por 1.000.000 tokens. Não se usa REAL/number para calcular dinheiro.

Para reservar moeda, a operação calcula a soma racional com aritmética inteira/BigInt e aplica ceiling conservador uma vez no total da chamada. Overflow ou redução impossível bloqueia. Ledger persiste somente o inteiro final em currency_minor e referencia PriceBook; relatório pode preservar numerador/denominador da estimativa em artifact.

Uso faturado/reportado, quando disponível, substitui a reserva por novos fatos `released/confirmed`; não atualiza a estimativa antiga. Diferença tardia pode ser `possible_overage`. Essa classificação é informativa e permanece separada do valor `accounted` usado pelo gate: `accounted = confirmed + reserved`; `possible_overage` não é somado ao limite nem altera a decisão de iniciar operação.

### Free tier e local

- Preço zero não significa capacidade ilimitada.
- Free tier é representado por limites/quota em call/token/duração e um PriceBook snapshot quando houver estimativa monetária.
- Provider local pode ter moeda zero configurada, mas continua sujeito a call/token/duração/recursos.
- Quota cujo saldo não é observável é unknown; o sistema não inventa saldo restante.

### PriceBook snapshot

Snapshot registra provider/model/região, fonte, instante observado, vigência/expiração, entries e fingerprint. Preço lido de documento histórico ou não verificado não entra no runtime. Snapshot expirado bloqueia nova estimativa monetária obrigatória até atualização ou decisão explícita de operar apenas por quotas não monetárias.

### Reserva e ledger

1. estimar máximos conservadores por unidade;
2. dentro da transação, ler ledger + reservations active;
3. comparar cada limite com aritmética segura;
4. gravar BudgetReservation/lines, ledger reserved e evento;
5. iniciar I/O somente após commit;
6. no terminal, registrar usage e ledger confirmed/released/possible_overage;
7. timeout/ambiguidade não libera reserva como zero.

Reservation é grupo multiunidade por CallId. Seu lifecycle parte de active uma única vez para consumed, released, expired ou reconciled. Linhas não mudam. Cada estado completo e fingerprint é acrescentado a `budget_reservation_lifecycle`; a linha principal é uma projeção e só muda quando o journal correspondente já existe na mesma transação.

## Regras de arredondamento

- input medido usa valor reportado quando fornecido; estimador sempre é rotulado estimated;
- max output para reserva usa o limite da request, não média histórica;
- soma racional ocorre antes do ceiling por chamada/moeda;
- número apresentado ao usuário identifica estimated/reported/unknown e PriceBook;
- não converter moeda no P0; moedas diferentes são limites separados.

## Testes obrigatórios

| ID | Caso | Esperado |
|---|---|---|
| CST-X01 | 100/1.000.000 × 1 token | reserva 1 minor por ceiling, com erro conservador visível |
| CST-X02 | múltiplos meters mesma moeda | soma racional antes de ceiling |
| CST-X03 | float/decimal em contrato | rejeitado |
| CST-X04 | denominator zero/overflow | rejeitado |
| CST-X05 | duas unidades, uma cruza limite | nenhuma chamada inicia |
| CST-X06 | exatamente no limite após reserva | hard_limit_reached |
| CST-X07 | usage tardio maior | possible_overage preservado |
| CST-X08 | usage unknown | value null; reserva não vira confirmado zero |
| CST-X09 | PriceBook expirado | estimativa monetária bloqueada |
| CST-X10 | preço zero sem quota | não tratado como ilimitado |
| CST-X11 | moedas diferentes | não somadas/convertidas |
| CST-X12 | retry | nova reservation/call; a anterior reconciliada |

## Consequências

TaskManifest passa a referenciar BudgetSet multiunidade. WP-06 continua podendo implementar o gate puro para uma unidade e depois compô-lo sobre todas as linhas; ele não implementa pricing. WP-12 garante concorrência/ledger e WP-22 fornece usage/price observations.
