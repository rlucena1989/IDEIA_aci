# Modelos Locais Especializados em Português e Código

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Avaliar modelos locais especializados em português e código

## Visão geral

Modelos locais permitem execução sem dependência de APIs externas, garantindo privacidade e controle de custos. Modelos especializados em português e código oferecem melhor performance para tarefas específicas.

## Modelos locais disponíveis

### 1. CodeLlama (Meta)

**Especialidade:** Código  
**Tamanhos:** 7B, 13B, 34B  
**Context window:** 16K tokens  
**Licença:** Llama 2 Community License  
**Status:** Disponível

**Performance:**
- Python: 85% accuracy em HumanEval
- JavaScript: 80% accuracy em HumanEval
- Java: 75% accuracy em HumanEval

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("codellama/CodeLlama-7b-hf")
model = AutoModelForCausalLM.from_pretrained("codellama/CodeLlama-7b-hf")

def generate_code(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### 2. StarCoder2 (BigCode)

**Especialidade:** Código  
**Tamanhos:** 3B, 7B, 15B  
**Context window:** 16K tokens  
**Licença:** OpenRAIL-M  
**Status:** Disponível

**Performance:**
- Python: 82% accuracy em HumanEval
- JavaScript: 78% accuracy em HumanEval
- Java: 73% accuracy em HumanEval

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("bigcode/starcoder2-7b")
model = AutoModelForCausalLM.from_pretrained("bigcode/starcoder2-7b")

def generate_code(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### 3. BLOOM (BigScience)

**Especialidade:** Multilíngue (inclui português)  
**Tamanhos:** 560M, 1.1B, 1.7B, 3B, 7.1B, 176B  
**Context window:** 2K tokens (versões menores), 2K tokens (176B)  
**Licença:** BigScience Open RAIL License  
**Status:** Disponível

**Performance:**
- Português: 70% accuracy em tarefas de NLP
- Inglês: 75% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("bigscience/bloom-7b1")
model = AutoModelForCausalLM.from_pretrained("bigscience/bloom-7b1")

def generate_text(prompt, language="pt"):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### 4. GPT-J (EleutherAI)

**Especialidade:** Geral (inclui português)  
**Tamanho:** 6B  
**Context window:** 2K tokens  
**Licença:** Apache-2.0  
**Status:** Disponível

**Performance:**
- Português: 65% accuracy em tarefas de NLP
- Inglês: 70% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("EleutherAI/gpt-j-6b")
model = AutoModelForCausalLM.from_pretrained("EleutherAI/gpt-j-6b")

def generate_text(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### 5. LLaMA 2 (Meta)

**Especialidade:** Geral (inclui português)  
**Tamanhos:** 7B, 13B, 70B  
**Context window:** 4K tokens  
**Licença:** Llama 2 Community License  
**Status:** Disponível

**Performance:**
- Português: 72% accuracy em tarefas de NLP
- Inglês: 78% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")

def generate_text(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### 6. Mistral (Mistral AI)

**Especialidade:** Geral (inclui português)  
**Tamanhos:** 7B, 8x7B (MoE)  
**Context window:** 8K tokens  
**Licença:** Apache-2.0  
**Status:** Disponível

**Performance:**
- Português: 75% accuracy em tarefas de NLP
- Inglês: 80% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")
model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")

def generate_text(prompt):
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.95
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

## Modelos especializados em português

### 1. BERTimbau (Portuguese BERT)

**Especialidade:** NLP (português)  
**Tamanho:** 110M  
**Context window:** 512 tokens  
**Licença:** MIT  
**Status:** Disponível

**Performance:**
- Português: 85% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("neuralmind/bert-base-portuguese-cased")
model = AutoModelForSequenceClassification.from_pretrained("neuralmind/bert-base-portuguese-cased")

def classify_text(text):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)
    return outputs.logits
```

### 2. DeBERTa (Portuguese)

**Especialidade:** NLP (português)  
**Tamanho:** 125M  
**Context window:** 512 tokens  
**Licença:** MIT  
**Status:** Disponível

**Performance:**
- Português: 87% accuracy em tarefas de NLP

**Implementação:**
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v3-base")
model = AutoModelForSequenceClassification.from_pretrained("microsoft/deberta-v3-base")

def classify_text(text):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)
    return outputs.logits
```

## Comparativo de modelos

### Código

| Modelo | Tamanho | Context window | Python | JavaScript | Java | Licença |
|---|---|---|---|---|---|---|
| CodeLlama 7B | 7B | 16K | 85% | 80% | 75% | Llama 2 |
| StarCoder2 7B | 7B | 16K | 82% | 78% | 73% | OpenRAIL-M |
| CodeLlama 34B | 34B | 16K | 90% | 85% | 80% | Llama 2 |

### Português

| Modelo | Tamanho | Context window | Português | Inglês | Licença |
|---|---|---|---|---|---|
| BERTimbau | 110M | 512 | 85% | N/A | MIT |
| DeBERTa | 125M | 512 | 87% | N/A | MIT |
| BLOOM 7B | 7.1B | 2K | 70% | 75% | OpenRAIL |
| LLaMA 2 7B | 7B | 4K | 72% | 78% | Llama 2 |
| Mistral 7B | 7B | 8K | 75% | 80% | Apache-2.0 |

## Requisitos de hardware

### CPU

| Modelo | CPU mínimo | CPU recomendado | RAM mínima |
|---|---|---|---|
| CodeLlama 7B | 8 cores | 16 cores | 16GB |
| CodeLlama 34B | 16 cores | 32 cores | 64GB |
| StarCoder2 7B | 8 cores | 16 cores | 16GB |
| BLOOM 7B | 8 cores | 16 cores | 16GB |
| LLaMA 2 7B | 8 cores | 16 cores | 16GB |
| Mistral 7B | 8 cores | 16 cores | 16GB |

### GPU

| Modelo | GPU mínima | GPU recomendada | VRAM mínima |
|---|---|---|---|
| CodeLlama 7B | RTX 3060 | RTX 4090 | 12GB |
| CodeLlama 34B | RTX 3090 | A100 | 24GB |
| StarCoder2 7B | RTX 3060 | RTX 4090 | 12GB |
| BLOOM 7B | RTX 3060 | RTX 4090 | 12GB |
| LLaMA 2 7B | RTX 3060 | RTX 4090 | 12GB |
| Mistral 7B | RTX 3060 | RTX 4090 | 12GB |

## Recomendações

### Para código
- **Recomendado:** CodeLlama 7B (equilíbrio performance/custo)
- **Alternativa:** StarCoder2 7B (licença mais permissiva)
- **High-end:** CodeLlama 34B (melhor performance)

### Para português
- **Recomendado:** Mistral 7B (melhor performance geral)
- **Alternativa:** LLaMA 2 7B (context window maior)
- **NLP específico:** BERTimbau (melhor para classificação)

## Próximos passos

1. **Avaliar hardware:** Verificar requisitos de hardware
2. **Selecionar modelo:** Escolher modelo baseado em requisitos
3. **Implementar servidor:** Criar servidor de inferência
4. **Otimizar performance:** Usar quantização e pruning
5. **Testar modelo:** Validar performance em tarefas reais
6. **Documentar procedimentos:** Criar guia de deployment

## Referências

- CodeLlama: https://github.com/facebookresearch/codellama
- StarCoder2: https://huggingface.co/bigcode/starcoder2
- BLOOM: https://huggingface.co/bigscience/bloom
- BERTimbau: https://github.com/neuralmind-ai/portuguese-bert
- Mistral: https://huggingface.co/mistralai
