# Revisão documental do benchmark

## Escopo revisado
- Índice geral: `00_indice_geral.md`.
- Benchmark: `benchmarks/README.md`.
- Arquivos de resultados, comparações e instruções T01–T10.

## Verificações
- Os links do bloco Benchmark no índice apontam para arquivos presentes em `benchmarks/`.
- Todas as tarefas T01–T10 possuem resultado OpenCode, instrução Freebuff, resultado Freebuff e comparação.
- `consolidacao_open_code_vs_freebuff.md` está referenciado no índice.
- O status do `benchmarks/README.md` foi atualizado de “preparação” para “execução e consolidação concluídas”.
- O índice foi reorganizado em ordem T01–T10.

## Correções aplicadas
1. Atualização do status e das fases no README do benchmark.
2. Inclusão explícita do resultado consolidado no README.
3. Reordenação do bloco Benchmark no índice geral.
4. Remoção de duplicação de entradas T01 no índice.

## Pendências documentais remanescentes
- Nem todas as execuções possuem JSON estruturado para ambos os agentes; os resultados narrativos existem, mas a consolidação quantitativa completa exigiria preencher os campos ausentes.
- Modelo, versão, tokens, custo e tempo não foram capturados de forma consistente.
- A validação foi feita por inventário e leitura dos arquivos; não há ainda um validador automatizado de links Markdown no repositório.

## Resultado
A documentação de navegação e status está consistente para consulta humana. As limitações de telemetria permanecem explicitamente documentadas e não devem ser tratadas como dados medidos.
