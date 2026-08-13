# Modelos, Preços e Limites por Região

**Data:** 11 de agosto de 2026  
**Status:** Documentação consolidada  
**Objetivo:** Comparar modelos, preços e limites por região para principais providers

## Resumo executivo

| Provider | Modelo principal | Preço input | Preço output | Context window | Regiões | Premium regional |
|---|---|---|---|---|---|---|
| **OpenAI** | GPT-5.6 Sol | $5/MTok | $30/MTok | 1.05M | Global + regional | 10% (regional) |
| **Anthropic** | Claude Sonnet 5 | $2/MTok | $10/MTok | 200K | Global + regional | 10% (US-only) |
| **Google** | Gemini 3.6 Flash | $1.50/MTok | $7.50/MTok | 1M | 230+ países | N/A |
| **DeepSeek** | V4 Flash | $0.14/MTok | $0.28/MTok | 128K | Global | N/A |

## OpenAI

### Modelos disponíveis

| Modelo | Input | Output | Context window | Lançamento |
|---|---|---|---|---|
| GPT-5.6 Sol | $5/MTok | $30/MTok | 1.05M | Fev 2026 |
| GPT-5.6 Terra | $2/MTok | $12/MTok | 1.05M | Fev 2026 |
| GPT-5.6 Luna | $0.20/MTok | $1.20/MTok | 128K | Fev 2026 |

### Preços por região

**Regional processing (data residency):**
- Premium de 10% para modelos lançados após 5 de março de 2026
- Disponível para: Europa (EEA + Suíça), Emirados Árabes Unidos
- Inference residency disponível para Europa e Emirados Árabes Unidos

### Limites por tier

| Tier | RPM (requests per minute) | TPM (tokens per minute) |
|---|---|---|
| Tier 1 | 500 | 500K |
| Tier 2 | 1K | 1M |
| Tier 4 | 2K | 2M |
| Tier 5 | 4K | 4M |
| Tier 5 (Luna) | 40K | 180M |

### Disponibilidade regional
- **Global:** Disponível em todos os países
- **Regional:** Europa (EEA + Suíça), Emirados Árabes Unidos
- **Data residency:** Incluído sem custo adicional para ChatGPT Enterprise/Education

## Anthropic

### Modelos disponíveis

| Modelo | Input | Output | Context window | Lançamento |
|---|---|---|---|---|
| Claude Opus 5 | $5/MTok | $25/MTok | 200K | 2026 |
| Claude Sonnet 5 | $2/MTok | $10/MTok | 200K | 2026 |
| Claude Haiku 4.5 | $1/MTok | $5/MTok | 200K | 2025 |

### Preços por região

**API (first-party):**
- Global: Preços padrão
- US-only (`inference_geo: "us"`): 10% premium
- Premium aplicado a input, output, cache writes, cache reads

**AWS Bedrock:**
- Global Cross Region: Preços padrão
- In-Region Cross Region: 10% premium
- AWS GovCloud (US): 20% premium

**Google Cloud:**
- Global: Preços padrão
- Multi-region: 10% premium
- Regional: 10% premium

### Preços de subscrição por região

| Região | Preço listado | USD equivalente | Diferença vs US |
|---|---|---|---|
| Estados Unidos | $20.00 USD | $20.00 | Baseline |
| União Europeia | ~€20.00 | ~$21.80 | +9% |
| Reino Unido | ~£18.00 | ~$22.70 | +13% |
| Japão | ~¥3.000 | ~$20.50 | +2% |
| Brasil | ~R$120.00 | ~$22.40 | +12% |
| Índia | ~₹1.700 | ~$20.20 | +1% |
| Canadá | ~CA$28.00 | ~$20.60 | +3% |
| Austrália | ~AU$32.00 | ~$21.00 | +5% |

### Disponibilidade regional
- **API:** Disponível em 100+ países
- **Claude.ai:** Disponível em 100+ países
- **Exclusões:** China, Rússia, Irã, Coreia do Norte, Cuba, Síria

## Google

### Modelos disponíveis

| Modelo | Input (Free) | Input (Paid) | Output (Free) | Output (Paid) | Context window |
|---|---|---|---|---|---|
| Gemini 3.6 Flash | Grátis | $1.50/MTok | Grátis | $7.50/MTok | 1M |
| Gemini 3.5 Pro | Grátis | $2.70/MTok | Grátis | $13.50/MTok | 1M |
| Gemini 3.5 Flash-Lite | Grátis | $1.50/MTok | Grátis | $9.00/MTok | 1M |
| Gemini 3.5 Flash-Thinking | Grátis | $2.70/MTok | Grátis | $16.20/MTok | 1M |
| Gemini 3.5 Pro-Audio | Grátis | $3.50/MTok | Grátis | $21.00/MTok | 1M |
| Gemini 3.5 Nano | Grátis | $0.30/MTok | Grátis | $2.50/MTok | 1M |
| Gemini 3.5 Flash-8B | Grátis | $0.25/MTok | Grátis | $1.50/MTok | 1M |

### Preços de subscrição

| Plano | Preço mensal | Disponibilidade | Limites |
|---|---|---|---|
| Google AI Plus | $4.99/mês | 160+ países | Limites básicos |
| Google AI Pro | $19.99/mês | 150+ países | 5x limites vs Plus |
| Google AI Ultra | $99.99/mês | 150+ países | 5x limites vs Pro |
| Google AI Ultra | $199.99/mês | 150+ países | 20x limites vs Pro |

### Limites por tier

| Tier | Qualificação | Cap |
|---|---|---|
| Free | Projeto ativo ou free trial | N/A |
| Tier 1 | Conta de billing ativa | $250 |
| Tier 2 | Pagou $100 + 3 dias | $2.000 |
| Tier 3 | Pagou $1.000 + 30 dias | $20.000 - $100.000+ |

### Disponibilidade regional
- **Gemini API:** Disponível em 230+ países e territórios
- **Gemini web app:** Disponível em 230+ países e territórios
- **Exclusões:** China, Coreia do Norte, Irã, Rússia, Cuba, Síria

## DeepSeek

### Modelos disponíveis

| Modelo | Input | Output | Context window |
|---|---|---|---|
| DeepSeek V4 Flash | $0.14/MTok | $0.28/MTok | 128K |

### Disponibilidade regional
- **Global:** Disponível em todos os países
- **Preços:** Uniformes por região (sem premium regional)

## Comparativo de preços

### Preço por 1M tokens (input + output)

| Provider | Modelo | Input | Output | Total |
|---|---|---|---|---|
| **DeepSeek** | V4 Flash | $0.14 | $0.28 | $0.42 |
| **Google** | 3.5 Flash-8B | $0.25 | $1.50 | $1.75 |
| **Google** | 3.6 Flash | $1.50 | $7.50 | $9.00 |
| **Anthropic** | Haiku 4.5 | $1.00 | $5.00 | $6.00 |
| **Anthropic** | Sonnet 5 | $2.00 | $10.00 | $12.00 |
| **OpenAI** | Luna | $0.20 | $1.20 | $1.40 |
| **OpenAI** | Terra | $2.00 | $12.00 | $14.00 |
| **Anthropic** | Opus 5 | $5.00 | $25.00 | $30.00 |
| **OpenAI** | Sol | $5.00 | $30.00 | $35.00 |

### Premium regional

| Provider | Premium regional | Quando aplicado |
|---|---|---|
| **OpenAI** | 10% | Data residency (Europa, Emirados) |
| **Anthropic** | 10% | US-only inference (`inference_geo: "us"`) |
| **Anthropic (AWS)** | 10% | In-Region Cross Region |
| **Anthropic (AWS GovCloud)** | 20% | AWS GovCloud (US) |
| **Google** | N/A | Preços uniformes por região |
| **DeepSeek** | N/A | Preços uniformes por região |

## Recomendações por região

### Brasil
- **Mais econômico:** DeepSeek V4 Flash ($0.42/MTok)
- **Melhor qualidade:** OpenAI GPT-5.6 Terra ($14/MTok)
- **Premium regional:** Anthropic (+12% em subscrição), OpenAI (10% em data residency)

### Europa (EEA)
- **Data residency:** OpenAI (disponível), Anthropic (disponível)
- **Premium regional:** 10% (OpenAI), 10% (Anthropic US-only)
- **Mais econômico:** DeepSeek V4 Flash
- **Melhor qualidade:** OpenAI GPT-5.6 Sol

### Estados Unidos
- **Sem premium regional:** Preços padrão
- **Mais econômico:** DeepSeek V4 Flash
- **Melhor qualidade:** OpenAI GPT-5.6 Sol

### Ásia (Japão, Índia, etc.)
- **Sem premium regional:** Preços padrão
- **Mais econômico:** DeepSeek V4 Flash
- **Melhor qualidade:** OpenAI GPT-5.6 Sol

## Próximos passos

Para decisão de provider:
1. **Definir requisitos:** Qualidade vs custo vs data residency
2. **Verificar disponibilidade regional:** Confirmar disponibilidade no país
3. **Calcular custo efetivo:** Incluir premium regional se aplicável
4. **Testar modelos:** Executar benchmark com modelos selecionados
5. **Configurar billing:** Configurar conta de billing e limites

## Referências

- OpenAI Pricing: https://developers.openai.com/api/docs/pricing
- OpenAI Data Residency: https://help.openai.com/en/articles/9903489-data-residency-for-chatgpt
- Anthropic Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Supported Countries: https://www.anthropic.com/supported-countries
- Google Gemini Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Available Regions: https://ai.google.dev/gemini-api/docs/available-regions
- Snapshot providers custos: `ia/snapshot_providers_custos.md`
