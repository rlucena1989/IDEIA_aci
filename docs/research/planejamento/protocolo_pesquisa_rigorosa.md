# Protocolo de pesquisa rigorosa

**Versão:** 1.0  
**Criado em:** 12 de agosto de 2026  
**Aplica-se a:** revisões e novos estudos em `docs/research/`  
**Status:** normativo para a pesquisa; os limiares podem ser revisados com justificativa

## 1. Objetivo

Tornar cada conclusão rastreável, contestável e útil para decisão. O protocolo reduz quatro falhas recorrentes: tratar material de marketing como prova de resultado, confundir opinião com fato, omitir evidência contrária e manter fatos voláteis sem data de validade.

## 2. Unidade de análise

Antes de buscar fontes, o estudo deve declarar:

1. pergunta de pesquisa e decisão que ela informa;
2. escopo, população, cenário e data de corte;
3. hipóteses e resultados que as refutariam;
4. métricas primárias e secundárias;
5. critérios de inclusão e exclusão;
6. conflitos de interesse e limitações conhecidas.

Uma frase que possa alterar produto, arquitetura, risco, custo ou prioridade é uma **afirmação material** e precisa de ID no registro de evidências.

## 3. Classes de afirmação

| Classe | Significado | Tratamento obrigatório |
|---|---|---|
| Fato observado | Dado diretamente verificável na fonte ou em artefato reproduzível | Citação, escopo e data |
| Resultado empírico | Associação ou efeito medido | Método, amostra, incerteza e limites de generalização |
| Inferência | Conclusão derivada de um ou mais fatos | Premissas explícitas e alternativa plausível |
| Hipótese | Proposição ainda não validada | Teste, métrica e condição de refutação |
| Decisão | Escolha normativa do projeto | Critérios, alternativas e responsável |
| Desconhecido | Lacuna relevante | Consequência e próximo passo |

Termos como “melhor”, “seguro”, “escalável” e “mais produtivo” não são aceitos sem comparador, métrica, cenário e horizonte temporal.

## 4. Hierarquia de fontes

| Nível | Fonte | Uso adequado | Não prova por si só |
|---|---|---|---|
| A | Norma, lei, especificação oficial, artigo/dataset primário com método auditável | Requisitos normativos e resultados medidos | Aplicabilidade fora do escopo estudado |
| B | Documentação oficial, repositório e changelog do fornecedor | Capacidade, configuração, versão e política declarada | Superioridade, segurança efetiva ou ganho de produtividade |
| C | Revisão sistemática, relatório técnico independente ou fonte secundária especializada | Triangulação e descoberta de fontes primárias | Fato volátil que a fonte primária contradiz |
| D | Issue, fórum, postagem, demonstração e relato individual | Hipótese, falha possível e pista de investigação | Frequência, causalidade ou representatividade |

Preferir a fonte primária mais próxima do fato. Para afirmações materiais e contestáveis, buscar ao menos duas evidências independentes; quando isso não existir, reduzir a confiança e declarar a dependência. Conteúdo patrocinado pode descrever o próprio produto, mas não sustenta comparação de desempenho.

## 5. Inclusão, exclusão e busca

### Incluir

- versão e data identificáveis;
- método ou procedimento suficientemente descrito;
- população e cenário compatíveis com a pergunta;
- fonte oficial para capacidade, preço, política e licença;
- evidência contrária relevante, mesmo que enfraqueça a tese.

### Excluir como sustentação principal

- página sem data para fato volátil;
- snippet de busca quando a página completa está disponível;
- benchmark do fornecedor sem artefatos ou protocolo;
- comparação que altera simultaneamente modelo, prompt, hardware e tarefa;
- número autorreferido usado como produtividade causal;
- conteúdo gerado por IA sem fontes verificadas.

### Registro mínimo da busca

Registrar no próprio estudo ou em anexo: data de consulta, consultas principais, bases/domínios, filtros, fontes incluídas, fontes excluídas com motivo e lacunas. A busca termina pelo critério da seção 9, não porque a conclusão desejada apareceu.

## 6. Avaliação de confiança

O escore abaixo é uma triagem de qualidade, não uma probabilidade estatística.

| Dimensão | 0 | 1 | 2 |
|---|---|---|---|
| Proximidade | relato indireto | fonte oficial ou secundária próxima | dado/artefato primário |
| Método | ausente | parcial | auditável/reproduzível |
| Adequação | cenário diferente | parcialmente comparável | população e cenário alinhados |
| Corroboração | fonte única dependente | múltiplas, mas dependentes | fontes independentes convergentes |
| Atualidade | vencida/incerta | aceitável | verificada dentro da janela |

- **Alta (8–10):** pode orientar decisão reversível; decisão irreversível ainda exige validação específica.
- **Média (5–7):** orienta hipótese ou experimento, não compromisso definitivo.
- **Baixa (0–4):** apenas sinal; não deve sustentar decisão material sozinha.

Uma limitação grave de método, conflito não tratado ou contradição forte impede confiança alta, independentemente da soma.

## 7. Registro de evidências

Cada estudo deve manter uma tabela com:

| Campo | Conteúdo |
|---|---|
| ID | Identificador estável, por exemplo `VP-C03` |
| Afirmação exata | Uma proposição, sem juntar fatos diferentes |
| Classe | Fato, resultado, inferência, hipótese, decisão ou desconhecido |
| Fonte(s) | Link/artefato e seção ou página quando possível |
| Escopo | População, versão, ambiente e período |
| Evidência contrária | Fonte ou `não encontrada` |
| Confiança | Alta, média ou baixa, com breve razão |
| Validade | Data de consulta e condição de revalidação |
| Impacto | Decisão afetada |

Ausência de evidência não deve ser reescrita como evidência de ausência.

## 8. Volatilidade e revalidação

| Tipo de dado | Janela máxima sugerida | Regra adicional |
|---|---:|---|
| Preço, limite, modelo disponível | 7 dias | Revalidar no dia da compra/decisão |
| Funcionalidade SaaS, política de dados, preview | 30 dias | Registrar plano, região e status beta/GA |
| Biblioteca, protocolo e integração ativa | 90 dias | Fixar versão ou commit |
| Pesquisa empírica | 12 meses | Procurar replicação, correção ou estudo posterior |
| Lei, norma e orientação regulatória | 90 dias | Confirmar vigência e jurisdição antes de uso jurídico |

A janela não transforma um fato em verdadeiro; apenas define quando ele deve ser checado novamente.

## 9. Critério de encerramento

Um estudo pode ser marcado como concluído quando:

- perguntas e decisão estão explícitas;
- toda afirmação material tem classe e fonte;
- fontes primárias e evidência contrária foram procuradas;
- limitações e desconhecidos estão registrados;
- hipóteses têm teste e condição de refutação;
- fatos voláteis têm data de consulta;
- recomendação decorre da matriz de evidências;
- uma pessoa que não participou consegue reproduzir a busca ou o experimento.

Encerrar por **saturação** exige duas rodadas de busca com consultas diferentes sem nova evidência material. Encerrar por **limite** exige declarar a restrição de tempo, acesso, amostra ou ferramenta.

## 10. Revisão e mudança de conclusão

Nova evidência não deve ser encaixada silenciosamente na narrativa. Registrar:

1. afirmação afetada;
2. evidência nova;
3. mudança de confiança;
4. decisão mantida, alterada ou suspensa;
5. data e responsável pela revisão.

Decisões arquiteturais e de produto devem apontar para o estudo que as sustenta; estudos não devem apresentar decisão do projeto como se fosse fato externo.
