# Validação de links Markdown

## Escopo
Validação de links relativos em `docs/research/**/*.md`, ignorando URLs externas e âncoras.

## Resultado inicial
- Arquivos Markdown: 139.
- Links analisados: 116.
- Links quebrados: 1.
- Problema: `00_indice_geral.md` apontava para `planejamento/checklist_pesquisa_nao_destrutiva.md`, arquivo inexistente.

## Correção
O item foi substituído por `planejamento/restricoes_operacionais.md`, arquivo existente e semanticamente relacionado às regras da pesquisa.
Também foi removida uma entrada duplicada de `Restrições operacionais` no bloco Planejamento.

## Revalidação
- Arquivos Markdown: 139.
- Links relativos analisados: 115.
- Links existentes: 115.
- Links quebrados: 0.
- Itens de Planejamento: 14 destinos únicos.
- Itens de Benchmark: 47 destinos únicos.

## Conclusão
O índice e os links relativos da documentação de pesquisa estão consistentes após a correção.
