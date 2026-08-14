# Handoff WP-02B-R — remediação de opacidade dos IDs (P2-R05/R06)

## Registro de entrega (2026-08-14)

Esta remediação foi **implementada e integrada** em 2026-08-14 seguindo este handoff. O conteúdo
abaixo permanece como registro histórico do contrato de delegação; não reexecute sem necessidade nova.

**Entrega:**

- Arquivos (todos dentro da lista autorizada): `p0/src/domain/ids.ts`, `p0/test/domain/ids.test.ts`
  e `p0/test/domain/ids-opacity.test.ts` (novo, prova compile-time).
- Resultado na entrega: `cd p0 && npm test` → **151/151** — a contagem caiu de 166 porque os ~23
  casos manuais do teste antigo (que cobriam só 4 tipos) foram consolidados em 7 testes dirigidos
  por vetores que varrem os **29 tipos × 29 vetores válidos + 10 inválidos** de `id-vectors.json`;
  `npx tsc --noEmit` limpo. Gate naquele momento: **6 PASS / 1 FAIL** — única falha
  `contract-build-policy` (P0-R02, ainda aberto), resolvida depois pelo WP-05-R.
- P2-R05 (opacidade nominal): 29 `declare const xxxBrand: unique symbol;` **não exportados**;
  cada interface usa `readonly [xxxBrand]: "X"` no lugar do `__brand` estrutural — sem acesso aos
  symbols, nenhum código externo fabrica ou intercambia IDs; os `parse*`/`create*` mantêm as mesmas
  assinaturas e retornam `{ value } as X` (cast único dentro do módulo). Zero `__brand` restante em
  `p0/src/`.
- P2-R06 (vetores como fonte de verdade): `ids.test.ts` carrega `id-vectors.json` via
  `readFileSync` + `JSON.parse` (caminho por `import.meta.url`) e despacha tipo → função `parse*`;
  vetores novos entram automaticamente; casos extras (não-string, troca de prefixo) mantidos.
- Prova compile-time: `ids-opacity.test.ts` com `@ts-expect-error` sobre erros reais (TaskId ≠
  ProjectId; objeto bruto ≠ ID opaco) + caso válido; o `npx tsc --noEmit` acusa se um
  `@ts-expect-error` deixar de ser erro.
- Observação histórica: o único consumidor de `ids.ts` na entrega era o próprio teste (risco baixo
  confirmado). O gate só ficou 7/7 depois do WP-05-R; estado atual em
  `docs/implementation/reviews/2026-08-13-p0-snapshot.md`.

## Origem

- `docs/implementation/reviews/2026-08-13-p0-snapshot.md` → **P2-R05** (IDs não são opacos no sistema estrutural do TypeScript) e **P2-R06** (testes não leem os vetores como fonte de verdade).

## Estado verificado (2026-08-14)

- `p0/src/domain/ids.ts` define 29 tipos como `interface X { readonly __brand: "X"; readonly value: string }`. Isso é **estrutural**: qualquer código pode fabricar `{ __brand: "TaskId", value: "tsk_…" }` e passar por `TaskId` sem passar pelo parser.
- Único consumidor atual de `ids.ts`: `p0/test/domain/ids.test.ts` (verificado por busca no repositório). `p0/src/adapters/node-id-generator.ts` implementa somente `UuidV4Generator` de `p0/src/ports/id-generator.ts` e não precisa mudar. O risco da mudança é baixo; se um novo import aparecer, atualize-o também.
- Os testes atuais duplicam casos manualmente e não carregam `docs/implementation/contracts/vectors/id-vectors.json` (29 vetores válidos, 10 inválidos).
- Typecheck disponível e exigido: `cd p0 && npx tsc --noEmit`.

## Arquivos autorizados

- `p0/src/domain/ids.ts`
- `p0/test/domain/ids.test.ts`
- `p0/test/domain/ids-opacity.test.ts` (novo, teste de compilação)

Não edite ADRs, schemas, vetores, `packages/` ou documentos normativos.

## Implemente — R05 (opacidade nominal)

Troque o branding estrutural por um `unique symbol` **não exportado** do módulo (não construtível externamente), mantendo a forma pública `{ readonly value: string }` e as assinaturas de `parse*`/`create*` inalteradas:

~~~ts
declare const projectIdBrand: unique symbol;
export interface ProjectId {
  readonly [projectIdBrand]: "ProjectId";
  readonly value: string;
}
~~~

- Não exporte os symbols; sem acesso a eles, o tipo não pode ser fabricado fora do módulo.
- `declare const x: unique symbol` e interfaces são sintaxe apagável (`erasableSyntaxOnly`) — compatível com o `tsconfig.json` atual; **não** use `enum`.
- `create*` continua retornando `{ value: … }`; o symbol é somente de tipo e não existe em runtime.
- Imports e uso (`id.value`, `parseX(value)`) permanecem iguais; nenhuma chamada muda.

## Implemente — R06 (vetores como fonte de verdade)

Em `p0/test/domain/ids.test.ts`:

- carregue `docs/implementation/contracts/vectors/id-vectors.json` com `node:fs` + `JSON.parse`, resolvendo o caminho a partir de `import.meta.url` (relativo de `p0/test/domain/`: `../../../docs/implementation/contracts/vectors/id-vectors.json`). Não use import de JSON do TypeScript (evita fricção de `resolveJsonModule`/`verbatimModuleSyntax`); a leitura é síncrona e o teste roda via `node --test`, sem restrição de leitura;
- monte um dispatch tipo → função `parse*` (todas as 29 funções `parseX` de `ids.ts`);
- cada vetor `valid` deve passar no parse do seu tipo e retornar `value` idêntico ao vetor;
- cada vetor `invalid` deve lançar `InvalidIdError`;
- se o vetor ganhar novos casos, eles entram automaticamente; não duplique os vetores dentro do teste;
- mantenha os casos específicos extras atuais (maiúsculas, prefixo trocado, nil UUID, etc.).

## Implemente — teste de opacidade (compile-time)

Em `p0/test/domain/ids-opacity.test.ts`, prove em tempo de compilação que os tipos não são intercambiáveis. `npx tsc --noEmit` deve passar; cada `@ts-expect-error` deve estar sobre uma linha que **realmente** é erro de tipo (se `tsc` acusar erro em `@ts-expect-error` não usado, a opacidade não foi alcançada):

~~~ts
import { parseProjectId, parseTaskId } from "../../src/domain/ids.ts";

// @ts-expect-error TaskId não é ProjectId
const notProject: ReturnType<typeof parseProjectId> = parseTaskId("tsk_123e4567-e89b-42d3-a456-426614174000");

// @ts-expect-error objeto bruto não é ID opaco
const notTask: ReturnType<typeof parseTaskId> = { value: "tsk_123e4567-e89b-42d3-a456-426614174000" };

// sem erro: tipo do próprio parser é atribuível a si mesmo
const ok: ReturnType<typeof parseTaskId> = parseTaskId("tsk_123e4567-e89b-42d3-a456-426614174000");
~~~

Observação: `@ts-expect-error` é a única forma de comentário de checagem permitida aqui; não use `// @ts-ignore`.

## Critérios de aceite

- `cd p0 && npm test` verde (166 atuais + os novos);
- `cd p0 && npx tsc --noEmit` sem erros;
- os 29 vetores válidos e 10 inválidos de `id-vectors.json` são executados via dispatch por tipo;
- sem `any`, `ts-ignore`, cast duplo, fallback permissivo ou `TODO`;
- nenhuma edição fora dos arquivos autorizados.

## Resposta obrigatória

1. resumo;
2. arquivos alterados;
3. testes executados e resultado;
4. requisitos atendidos (P2-R05, P2-R06);
5. limitações;
6. confirmação de que não editou fora do escopo.
