# Fine-Tuning de Modelos para Código

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias e implementação de fine-tuning de modelos para código

## Visão geral

Fine-tuning de modelos para código permite adaptar modelos pré-treinados a convenções específicas da organização, bibliotecas proprietárias e padrões de código. PEFT (Parameter-Efficient Fine-Tuning) torna isso viável com recursos limitados.

## Métodos de PEFT

### 1. LoRA (Low-Rank Adaptation)

**Princípio:** Decompõe uma matriz grande em duas matrizes de menor rank  
**Trainable params:** 0.01-0.5%  
**GPU memory (7B):** ~16-28GB  
**Performance vs Full FT:** 97-100%  
**Latência de inferência:** Sem latência adicional (merge_and_unload)

**Implementação:**
```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load base model
model_name = "codellama/CodeLlama-7b-hf"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# LoRA configuration
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                          # Rank: 8-64
    lora_alpha=32,                 # Scaling factor: 2x rank
    lora_dropout=0.05,             # Dropout: previne overfitting
    target_modules=[               # Módulos para aplicar LoRA
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    bias="none",                   # Treinar bias
)

# Create PEFT model
peft_model = get_peft_model(model, lora_config)
peft_model.print_trainable_parameters()
# prints: trainable params: 3,686,400 || all params: 3,089,625,088 || trainable%: 0.1193
```

**Recomendações de rank:**
- **r=4-8:** Tarefas simples de classificação, análise de sentimento
- **r=16-32:** Recomendado para instruction tuning e modelos conversacionais
- **r=64-128:** Adaptação de domínio complexo (médico, legal) ou datasets grandes

### 2. QLoRA (Quantized LoRA)

**Princípio:** Combina LoRA com quantização 4-bit  
**Trainable params:** 0.01-0.5%  
**GPU memory (7B):** ~12-16GB (4x menos que LoRA)  
**Performance vs Full FT:** 97-100%  
**Técnicas chave:**
- 4-bit NormalFloat (NF4): Tipo de dados otimizado para pesos normalmente distribuídos
- Double Quantization: Re-quantiza constantes de quantização (economiza 0.37 bits/param)
- Paged Optimizers: Pagina estados de optimizer para CPU durante picos de GPU

**Implementação:**
```python
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, prepare_model_for_kbit_training, get_peft_model
from trl import SFTTrainer
import torch

# 4-bit quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",           # NormalFloat4 quantization
    bnb_4bit_compute_dtype=torch.bfloat16, # bfloat16 para computação
    bnb_4bit_use_double_quant=True,       # Double Quantization
)

# Load 4-bit quantized model
model = AutoModelForCausalLM.from_pretrained(
    "codellama/CodeLlama-7b-hf",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# Prepare model for k-bit training
model = prepare_model_for_kbit_training(model)

# LoRA configuration
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
```

### 3. PiSSA (Principal Singular Values and Singular Vectors)

**Princípio:** Inicializa LoRA usando valores singulares principais e vetores singulares  
**Vantagem:** Converge mais rápido que LoRA e performance superior  
**Redução de erro de quantização:** Melhor que QLoRA

**Implementação:**
```python
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    init_lora_weights="pissa",  # Inicialização PiSSA
    task_type="CAUSAL_LM",
)
```

## Modelos base para código

### 1. CodeLlama (Meta)

**Tamanhos:** 7B, 13B, 34B  
**Context window:** 16K tokens  
**Licença:** Llama 2 Community License  
**Performance:** Python 85%, JavaScript 80%, Java 75% (HumanEval)

**Fine-tuning com Axolotl:**
```yaml
base_model: codellama/CodeLlama-7b-hf
base_model_config: codellama/CodeLlama-7b-hf
model_type: LlamaForCausalLM
tokenizer_type: LlamaTokenizer
is_llama_derived_model: true
hub_model_id: MyCodeLlama-7b

load_in_8bit: false
load_in_4bit: true
strict: false

datasets:
    - path: my-custom-code-dataset
    type: alpaca
dataset_prepared_path: last_run_prepared
val_set_size: 0.02
output_dir: ./qlora-out

adapter: qlora
lora_model_dir:

sequence_len: 2048
sample_packing: true

lora_r: 32
lora_alpha: 16
lora_dropout: 0.05
lora_target_linear: true

gradient_accumulation_steps: 1
micro_batch_size: 10
num_epochs: 3
optimizer: paged_adamw_32bit
lr_scheduler: cosine
learning_rate: 0.0002

train_on_inputs: false
group_by_length: false
bf16: true
fp16: false

gradient_checkpointing: true
flash_attention: true
```

### 2. StarCoder2 (BigCode)

**Tamanhos:** 3B, 7B, 15B  
**Context window:** 16K tokens  
**Licença:** OpenRAIL-M  
**Performance:** Python 82%, JavaScript 78%, Java 73% (HumanEval)

### 3. DeepSeek-Coder

**Tamanhos:** 1.3B, 6.7B, 33B  
**Context window:** 16K tokens  
**Licença:** MIT (code) / DeepSeek Model License (weights)  
**Performance:** Python 88%, JavaScript 85%, Java 82% (HumanEval)

**Fine-tuning com DeepSpeed:**
```bash
DATA_PATH="<your_data_path>"
OUTPUT_PATH="<your_output_path>"
MODEL_PATH="deepseek-ai/deepseek-coder-6.7b-instruct"

cd finetune && deepspeed finetune_deepseekcoder.py \
    --model_name_or_path $MODEL_PATH \
    --data_path $DATA_PATH \
    --output_dir $OUTPUT_PATH \
    --num_train_epochs 3 \
    --model_max_length 1024 \
    --per_device_train_batch_size 16 \
    --per_device_eval_batch_size 1 \
    --gradient_accumulation_steps 4 \
    --evaluation_strategy "no" \
    --save_strategy "steps" \
    --save_steps 100 \
    --save_total_limit 100 \
    --learning_rate 2e-5 \
    --warmup_steps 10 \
    --logging_steps 1 \
    --lr_scheduler_type "cosine" \
    --gradient_checkpointing True \
    --report_to "tensorboard" \
    --deepspeed configs/ds_config_zero3.json \
    --bf16 True
```

### 4. Qwen2.5-Coder

**Tamanhos:** 1.5B, 3B, 7B, 14B, 32B  
**Context window:** 32K tokens (repo-level)  
**Licença:** Apache 2.0  
**Performance:** Python 90%, JavaScript 87%, Java 85% (HumanEval)

**Fine-tuning com QLoRA:**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, prepare_model_for_kbit_training, get_peft_model
from trl import SFTTrainer

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
)

model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
```

## Quantização específica para código

### GPTQ (Post-Training Quantization)

**Princípio:** Quantização 4-bit com calibration data para preservar accuracy  
**Trainable params:** Não aplicável (inference-only)  
**GPU memory (7B):** ~8-12GB (vs ~120GB fp16)  
**Performance vs fp16:** 97-99%  
**Latência de inferência:** 2-3x mais lento que fp16

**Implementação com GPTQModel:**
```python
from gptqmodel import GPTQModel, QuantizeConfig

# Configuração de quantização
quantize_config = QuantizeConfig(
    bits=4,                    # 4-bit quantization
    group_size=128,           # Group size para quantização
    damp_percent=0.01,        # Damping para estabilidade
    desc_act=False,           # Descending activation order
    sym=True,                 # Symmetric quantization
    true_sequential=True,     # True sequential quantization
)

# Quantizar modelo
model = GPTQModel.from_pretrained(
    "codellama/CodeLlama-7b-hf",
    quantize_config=quantize_config,
    device_map="auto",
)

# Salvar modelo quantizado
model.save_quantized("./codellama-7b-gptq")
```

### AWQ (Activation-aware Weight Quantization)

**Princípio:** Quantização 4-bit activation-aware com calibration data  
**Trainable params:** Não aplicável (inference-only)  
**GPU memory (7B):** ~8-12GB (vs ~120GB fp16)  
**Performance vs fp16:** 98-99%  
**Latência de inferência:** 1.5-2x mais rápido que GPTQ

**Implementação com llm-awq:**
```python
from awq import AutoAWQForCausalLM
from transformers import AutoTokenizer

# Carregar modelo AWQ quantizado
model = AutoAWQForCausalLM.from_quantized(
    "TheBloke/CodeLlama-7B-AWQ",
    safetensors=True,
    device_map="auto",
)

tokenizer = AutoTokenizer.from_pretrained("TheBloke/CodeLlama-7B-AWQ")

# Gerar
prompt = "def fibonacci(n):"
inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=100)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

**Quantizar modelo com AWQ:**
```bash
python -m awq.entry --quantize \
    --model_path codellama/CodeLlama-7b-hf \
    --w_bit 4 \
    --q_group_size 128 \
    --output_path ./codellama-7b-awq
```

### Comparativo de quantização

| Método | Bits | VRAM (7B) | Perf vs fp16 | Inference speed | Trainable |
|---|---|---|---|---|---|
| FP16 | 16 | ~120GB | Baseline | Baseline | Yes |
| INT8 | 8 | ~60GB | 99% | 1.2x | Yes |
| GPTQ-4 | 4 | ~12GB | 97-99% | 0.5x | No |
| AWQ-4 | 4 | ~12GB | 98-99% | 0.6x | No |
| QLoRA-4 | 4 | ~12GB | 97-100% | Baseline | Yes |

**Recomendações:**
- **Para inference-only:** AWQ é melhor que GPTQ (mais rápido, melhor accuracy)
- **Para fine-tuning:** QLoRA é a única opção que permite training
- **Para produção:** AWQ ou GPTQ pré-quantizados para inference

## DPO/RLHF para código

### DPO (Direct Preference Optimization)

**Princípio:** Otimização direta de preferências sem reward model explícito  
**Vantagem:** Elimina complexidade de RLHF (sem reward model, sem PPO, sem value function)  
**Trainable params:** 0.01-0.5% (com LoRA)  
**GPU memory (7B):** ~16-28GB (com LoRA)  
**Performance vs SFT:** 5-15% improvement em tasks de preferência

**Implementação com TRL:**
```python
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig

# Carregar modelo SFT
model = AutoModelForCausalLM.from_pretrained(
    "./sft-checkpoint",
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained("./sft-checkpoint")

# Configurar LoRA
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)

# Configurar DPO
dpo_config = DPOConfig(
    beta=0.1,                    # Coeficiente de temperatura (0.1-0.5)
    learning_rate=5e-6,          # 10x menor que SFT
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    max_length=1024,
    max_prompt_length=512,
    max_target_length=512,
    bf16=True,
)

# Dataset de preferências (chosen, rejected)
# Formato: {"prompt": "...", "chosen": "...", "rejected": "..."}

# Criar trainer
dpo_trainer = DPOTrainer(
    model=model,
    ref_model=None,              # Usa modelo base como referência
    args=dpo_config,
    beta=0.1,
    train_dataset=train_dataset,
    tokenizer=tokenizer,
    peft_config=peft_config,
)

# Treinar
dpo_trainer.train()
```

### RLHF (Reinforcement Learning from Human Feedback)

**Princípio:** Otimização via PPO com reward model treinado em preferências humanas  
**Vantagem:** Melhor para tasks complexas de raciocínio  
**Desvantagem:** Complexidade 4x maior que SFT, memory footprint alto  
**GPU memory (7B):** ~40-60GB (com PPO)  
**Performance vs SFT:** 10-20% improvement em tasks complexas

**Pipeline RLHF:**
1. **SFT:** Supervised fine-tuning em dataset de instruções
2. **Reward Model:** Treinar reward model em dados de preferência
3. **PPO:** Otimizar policy com reward model + KL penalty

**Implementação com OpenRLHF:**
```python
from openrlhf.trainer.ppo_trainer import PPOTrainer
from openrlhf.models import Actor, RewardModel

# Configurar actor (policy)
actor = Actor(
    "codellama/CodeLlama-7b-hf",
    lora_rank=16,
    lora_alpha=32,
    load_in_4bit=True,
)

# Configurar reward model
reward_model = RewardModel(
    "codellama/CodeLlama-7b-hf",
    load_in_4bit=True,
)

# Configurar PPO trainer
trainer = PPOTrainer(
    actor=actor,
    reward_model=reward_model,
    learning_rate=1e-5,
    batch_size=128,
    kl_coef=0.02,              # Coeficiente de KL penalty
    clip_range=0.2,           # PPO clipping
    max_epochs=3,
)

# Treinar
trainer.train()
```

### Comparativo de métodos de alinhamento

| Método | Complexidade | Memory (7B) | Perf vs SFT | Trainable | Best for |
|---|---|---|---|---|---|
| SFT | Low | ~16GB | Baseline | 0.01-100% | Instruções básicas |
| DPO | Medium | ~16-28GB | +5-15% | 0.01-0.5% | Preferências simples |
| RLHF/PPO | High | ~40-60GB | +10-20% | 0.01-100% | Raciocínio complexo |
| GRPO | Medium-High | ~20-30GB | +8-18% | 0.01-0.5% | Verificação de código |

**Recomendações:**
- **Para instruções básicas:** SFT é suficiente
- **Para preferências simples:** DPO é mais simples que RLHF
- **Para raciocínio complexo:** RLHF/PPO ou GRPO
- **Para código com verificação:** GRPO (Group Relative Policy Optimization)

**Fine-tuning com TRL:**
```bash
accelerate launch finetune.py \
    --model_id "bigcode/starcoder2-3b" \
    --dataset_name "bigcode/the-stack-smol" \
    --subset "data/python" \
    --dataset_text_field "content" \
    --split "train" \
    --max_seq_length 1024 \
    --max_steps 10000 \
    --micro_batch_size 1 \
    --gradient_accumulation_steps 8 \
    --learning_rate 2e-5 \
    --warmup_steps 20 \
    --num_proc "$(nproc)"
```

**Script Python:**
```python
from peft import LoraConfig
from transformers import (
    AutoModelForCausalLM,
    BitsAndBytesConfig,
)
from trl import SFTTrainer

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

lora_config = LoraConfig(
    r=8,
    target_modules=[
        "q_proj", "o_proj", "k_proj", "v_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    task_type="CAUSAL_LM",
)

model = AutoModelForCausalLM.from_pretrained(
    "bigcode/starcoder2-3b",
    quantization_config=bnb_config,
    device_map="auto",
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    max_seq_length=1024,
    peft_config=lora_config,
    dataset_text_field="content",
)

trainer.train()
```

## Preparação de dados

### Formato de dataset

**Formato Alpaca (JSONL):**
```jsonl
{
  "instruction": "Como faço para criar uma função em Python que soma dois números?",
  "input": "",
  "output": "def soma(a, b):\n    return a + b"
}
```

**Formato para code review:**
```jsonl
{
  "oldf": "... conteúdo do arquivo antigo ...",
  "patch": "@@ -25,13 +25,16 @@ ...",
  "msg": "melhorar legibilidade do código",
  "id": 12959,
  "y": 1
}
```

**ConstantLengthDataset para código:**
```python
class ConstantLengthDataset(IterableDataset):
    def __init__(
        self,
        tokenizer,
        dataset,
        infinite=False,
        seq_length=1024,
        num_of_sequences=1024,
        chars_per_token=3.6,
        fim_rate=0.0,
        fim_spm_rate=0.5,
        seed=0,
    ):
        self.tokenizer = tokenizer
        self.dataset = dataset
        self.infinite = infinite
        self.seq_length = seq_length
        self.num_of_sequences = num_of_sequences
        self.chars_per_token = chars_per_token
        self.fim_rate = fim_rate
        self.fim_spm_rate = fim_spm_rate
        self.seed = seed
        
    def __iter__(self):
        iterator = self.dataset
        iterator = self._shuffle(iterator)
        
        buffer = []
        for text in iterator:
            buffer.append(text)
            buffer_len = sum(len(t) for t in buffer)
            
            if buffer_len >= self.seq_length * self.chars_per_token * self.num_of_sequences:
                tokenized = self.tokenizer(
                    "".join(buffer),
                    return_tensors="pt",
                    truncation=True,
                    max_length=self.seq_length * self.num_of_sequences,
                )
                
                input_ids = tokenized["input_ids"].squeeze()
                
                for i in range(0, len(input_ids), self.seq_length):
                    yield input_ids[i:i + self.seq_length]
                
                buffer = []
```

## Configuração de treinamento

### Learning rate

**Regra geral:** LoRA requer learning rate 10x maior que full fine-tuning

| Trainer | Full Fine-Tuning | With LoRA (10x) |
|---|---|---|
| SFT | 2.0e-5 | 2.0e-4 |
| DPO | 5.0e-7 | 5.0e-6 |
| GRPO | 1.0e-6 | 1.0e-5 |

### Batch size e gradient accumulation

**Para GPU com 16GB VRAM:**
```python
training_args = TrainingArguments(
    per_device_train_batch_size=1,      # Micro batch size
    gradient_accumulation_steps=16,    # Effective batch size = 16
    learning_rate=2.0e-4,              # 10x para LoRA
    num_train_epochs=3,
    bf16=True,
    logging_steps=10,
    save_strategy="epoch",
    output_dir="./output",
)
```

### Gradient checkpointing

**Habilita gradient checkpointing para economizar VRAM:**
```python
model.gradient_checkpointing_enable()
```

## Comparativo de métodos

| Método | Trainable Param % | GPU Memory (7B) | Perf vs Full FT | Latência |
|---|---|---|---|---|
| Full Fine-tuning | 100% | ~120GB | Baseline | N/A |
| Adapter | 0.5-3% | ~30GB | 95-98% | Pequena |
| LoRA | 0.01-0.5% | ~16-28GB | 97-100% | Nenhuma (merge) |
| QLoRA | 0.01-0.5% | ~12-16GB | 97-100% | Nenhuma (merge) |
| Selective | 0.05-1% | ~25GB | 90-95% | Nenhuma |

## Recomendações

### Para desenvolvimento local (GPU 16GB)
**Recomendado:** QLoRA
- 4-bit quantization reduz VRAM
- Performance comparável a full fine-tuning
- Adequado para modelos até 7B

### Para produção (GPU 40GB+)
**Recomendado:** LoRA
- Melhor estabilidade de treinamento
- Sem overhead de quantização
- Adequado para modelos até 34B

### Para datasets pequenos (<10k exemplos)
**Recomendado:** LoRA com r=8-16
- Menor rank suficiente para datasets pequenos
- Reduz overfitting

### Para datasets grandes (>100k exemplos)
**Recomendado:** LoRA com r=32-64
- Maior rank captura mais complexidade
- Melhor adaptação de domínio

## Próximos passos

1. **Selecionar modelo base:** Escolher CodeLlama ou StarCoder2 baseado em requisitos
2. **Preparar dataset:** Formatar dados em JSONL com instruções e código
3. **Configurar PEFT:** Escolher LoRA ou QLoRA baseado em VRAM disponível
4. **Treinar modelo:** Executar fine-tuning com learning rate 10x
5. **Avaliar performance:** Testar em HumanEval ou benchmarks internos
6. **Deploy:** Merge adapter e deploy para produção

## Referências

- PEFT: https://github.com/huggingface/peft
- LoRA: https://huggingface.co/docs/peft/package_reference/lora
- CodeLlama: https://github.com/facebookresearch/codellama
- StarCoder2: https://github.com/bigcode-project/starcoder2
- TRL: https://github.com/huggingface/trl
