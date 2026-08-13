# Estratégias de Deployment de Modelos

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Definir estratégias de deployment de modelos LLM em produção

## Visão geral

Deployment de modelos LLM requer considerações específicas de GPU, scheduling, autoscaling e otimização de inference. As principais engines de serving são vLLM, TensorRT-LLM e SGLang.

## Engines de inference

### vLLM

**Best for:** General production inference, high-throughput batch workloads  
**Setup:** 4/10 (pip install)  
**Hardware lock-in:** Low (ROCm support)  
**Throughput (H100):** 1,800-2,400 tok/s  
**Latency (batch=1):** Baseline  
**MoE support:** Wide EP

**Prós:**
- PagedAttention para efficient KV cache management
- Continuous batching
- Broad quantization support (FP8, FP4, INT8, INT4, GPTQ, AWQ, GGUF)
- OpenAI-compatible server
- Multi-platform (NVIDIA, AMD ROCm, Intel XPU, TPU)
- Highest throughput at saturation
- Lowest cost per token
- Setup mais simples (pip install)

**Contras:**
- Menos hardware-specific optimization que TensorRT-LLM
- Latency consistency pode variar sob certos workloads
- Multi-node scaling complexity aumenta em deployments maiores

**Implementação:**
```bash
pip install vllm

vllm serve meta-llama/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.9
```

### TensorRT-LLM

**Best for:** Large-scale NVIDIA deployments, latency-sensitive APIs  
**Setup:** 8/10 (Docker-driven)  
**Hardware lock-in:** NVIDIA-only  
**Throughput (H100):** 1,600-2,200 tok/s  
**Latency (batch=1):** 20-40% lower que vLLM  
**MoE support:** Native

**Prós:**
- Maximum NVIDIA optimization
- Strong latency performance (20-40% lower que vLLM)
- Efficient tensor parallel execution
- Optimized quantization support
- Excellent performance em H100/H200
- Tight integration com NVIDIA NIM

**Contras:**
- Mais deployment complexity
- Menos hardware flexibility (NVIDIA-only)
- Tighter NVIDIA ecosystem dependency
- Steeper operational learning curve
- Tuning overhead pode aumentar significativamente

**Implementação:**
```bash
# Build engine
trtllm-build --model_dir ./llama_3_1_8b \
  --output_dir ./llama_3_1_8b_trtllm \
  --tp_size 1

# Serve
python3 serve.py --engine_dir ./llama_3_1_8b_trtllm \
  --host 0.0.0.0 \
  --port 8000
```

### SGLang

**Best for:** Agentic and structured generation workflows, prefix-heavy traffic  
**Setup:** 7/10  
**Hardware lock-in:** Low (ROCm support)  
**Throughput (H100):** 1,400-2,000 tok/s  
**Latency (batch=1):** Competitive  
**MoE support:** Expert routing

**Prós:**
- RadixAttention para KV cache reuse (6.4x throughput gain em prefix-heavy workloads)
- Structured output support central
- Efficient scheduling architecture
- Strong para multi-call, structured, programmatic LLM workflows
- Compressed finite-state machines para structured output decoding
- Multi-platform (NVIDIA, AMD, Intel Xeon, TPU, Ascend NPU)

**Contras:**
- Menor mindshare que vLLM em algumas enterprise teams
- Se workload é plain chat completion, pode não usar suas melhores features
- Operational maturity deve ser validada

**Implementação:**
```bash
pip install "sglang[all]"

python -m sglang.launch_server \
  --model-path meta-llama/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --tp 1
```

## Comparativo de engines

| Engine | Throughput (H100) | Latency (batch=1) | Setup | HW lock-in | Best for |
|---|---|---|---|---|---|
| vLLM | 1,800-2,400 tok/s | Baseline | 4/10 | Low | High-throughput batch workloads |
| TensorRT-LLM | 1,600-2,200 tok/s | 20-40% lower | 8/10 | NVIDIA-only | Latency-sensitive APIs |
| SGLang | 1,400-2,000 tok/s | Competitive | 7/10 | Low | Agentic, structured generation |
| TGI | Maintenance mode | - | - | - | Não recomendado (maintenance mode) |

## Estratégias de deployment

### Single-node deployment

**Quando usar:** Modelos que cabem em um único nó (até 70B params)  
**Engine recomendada:** vLLM standalone

**Implementação Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vllm
  template:
    metadata:
      labels:
        app: vllm
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        resources:
          limits:
            nvidia.com/gpu: "1"
            cpu: "8"
            memory: 32Gi
        env:
        - name: MODEL_NAME
          value: "meta-llama/Llama-3.1-8B-Instruct"
        ports:
        - containerPort: 8000
```

### Multi-node deployment

**Quando usar:** Modelos que requerem múltiplos GPUs/nós (70B+)  
**Engine recomendada:** Ray Serve + vLLM ou llm-d

**Implementação Ray Serve:**
```python
from ray import serve
from vllm import LLM, SamplingParams

@serve.deployment(
    ray_actor_options={"num_gpus": 1},
    autoscaling_config={
        "min_replicas": 1,
        "max_replicas": 4,
        "target_num_ongoing_requests_per_replica": 2
    }
)
class VLLMDeployment:
    def __init__(self):
        self.llm = LLM(
            model="meta-llama/Llama-3.1-70B-Instruct",
            tensor_parallel_size=4
        )
    
    async def __call__(self, prompt):
        sampling_params = SamplingParams(temperature=0.7, max_tokens=256)
        return self.llm.generate([prompt], sampling_params)

serve.run(VLLMDeployment.bind())
```

### Disaggregated serving (Prefill-Decode)

**Quando usar:** Workloads com throughput requirements altos  
**Engine recomendada:** llm-d ou NVIDIA Dynamo

**Benefícios:**
- Separa prefill e decode em GPUs/nós diferentes
- Otimiza cada fase independentemente
- Reduz custo de inference
- Melhora throughput

**Implementação llm-d:**
```yaml
apiVersion: serving.kserve.io/v1alpha1
kind: LLMInferenceService
metadata:
  name: llama-3-70b
spec:
  model:
    uri: hf://meta-llama/Llama-3.1-70B-Instruct
  replicas: 3
  template:
    containers:
    - name: main
      image: vllm/vllm-openai:latest
      resources:
        limits:
          nvidia.com/gpu: "1"
  prefill:
    replicas: 1
    containers:
    - name: main
      image: vllm/vllm-openai:latest
      resources:
        limits:
          nvidia.com/gpu: "2"
  parallelism:
    tensorParallelSize: 4
```

## GPU scheduling

### MIG (Multi-Instance GPU)

**Quando usar:** Production multi-tenant workloads onde memory isolation matters  
**Requisitos:** A100 ou newer

**Implementação:**
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      nodeSelector:
        nvidia.com/gpu.product: A100-SXM4-40GB
      containers:
      - name: vllm
        resources:
          limits:
            nvidia.com/mig-1g.5gb: "1"  # 1 MIG instance
```

### Time-slicing

**Quando usar:** Development e testing  
**Requisitos:** Todos NVIDIA GPUs

**Implementação:**
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: vllm
        resources:
          limits:
            nvidia.com/gpu: "1"
        env:
        - name: NVIDIA_VISIBLE_DEVICES
          value: "0"
        - name: NVIDIA_MIG_CONFIG_DEVICES
          value: "0:28672,1:28672"  # Time-slice 2 GPUs
```

### Gang scheduling

**Quando usar:** Multi-GPU jobs que requerem todos GPUs simultaneamente (tensor parallelism)  
**Engine:** Volcano

**Implementação:**
```yaml
apiVersion: scheduling.volcano.sh/v1beta1
kind: PodGroup
metadata:
  name: vllm-tp4
spec:
  minMember: 1
  minResources:
    nvidia.com/gpu: "4"
---
apiVersion: batch/v1
kind: Job
metadata:
  name: vllm-tp4
spec:
  schedulerName: volcano
  template:
    spec:
      schedulerName: volcano
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        resources:
          limits:
            nvidia.com/gpu: "4"
```

## Autoscaling

### HPA com custom metrics

**Metricas vLLM:**
- `vllm:num_requests_running` - Active requests
- `vllm:num_requests_waiting` - Queued requests (best for scaling)
- `vllm:avg_generation_throughput_toks_per_s` - Token throughput
- `vllm:gpu_cache_usage_perc` - KV cache utilization

**Implementação:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-deployment
  minReplicas: 1
  maxReplicas: 4
  metrics:
  - type: Pods
    pods:
      metric:
        name: vllm_num_requests_waiting
      target:
        type: AverageValue
        averageValue: "5"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 300
```

### KEDA (Recomendado)

**Implementação:**
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: vllm-keda
spec:
  scaleTargetRef:
    name: vllm-deployment
  minReplicaCount: 1
  maxReplicaCount: 4
  cooldownPeriod: 300
  pollingInterval: 30
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc.cluster.local:9090
      metricName: vllm_waiting_requests
      query: |
        sum(vllm:num_requests_waiting{namespace="default"})
      threshold: "10"
```

### GPU metrics

**Metricas DCGM:**
- `DCGM_FI_DEV_GPU_UTIL` - GPU utilization
- `DCGM_FI_DEV_FB_USED` - GPU memory usage

**Implementação:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gpu-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-deployment
  minReplicas: 1
  maxReplicas: 4
  metrics:
  - type: Pods
    pods:
      metric:
        name: DCGM_FI_DEV_GPU_UTIL
      target:
        type: AverageValue
        averageValue: "85"
```

## Estratégias serverless

### AWS Lambda com GPU

**Princípio:** Deploy serverless com GPU para workloads esporádicos

**Implementação com AWS Lambda:**
```python
import json
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Handler Lambda
def lambda_handler(event, context):
    # Carregar modelo (lazy loading)
    model = get_model()
    tokenizer = get_tokenizer()
    
    prompt = event.get("prompt", "")
    inputs = tokenizer(prompt, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=100)
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return {
        "statusCode": 200,
        "body": json.dumps({"response": response})
    }

# Lazy loading do modelo
_model = None
_tokenizer = None

def get_model():
    global _model
    if _model is None:
        _model = AutoModelForCausalLM.from_pretrained(
            "gpt2",
            device_map="auto",
            torch_dtype=torch.float16
        )
    return _model

def get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained("gpt2")
    return _tokenizer
```

**Configuração SAM:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  LLMFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.11
      MemorySize: 4096
      Timeout: 300
      Environment:
        Variables:
          MODEL_NAME: gpt2
      ImageUri: <your-ecr-image>
```

### Azure Functions com GPU

**Princípio:** Serverless functions com GPU para inferência

**Implementação:**
```python
import azure.functions as func
import torch
from transformers import pipeline

app = func.FunctionApp()

# Lazy loading
_generator = None

def get_generator():
    global _generator
    if _generator is None:
        _generator = pipeline(
            "text-generation",
            model="gpt2",
            device=0 if torch.cuda.is_available() else -1
        )
    return _generator

@app.route(route="generate", auth_level=func.AuthLevel.FUNCTION)
def generate_text(req: func.HttpRequest) -> func.HttpResponse:
    prompt = req.params.get('prompt') or req.get_json().get('prompt')
    
    generator = get_generator()
    result = generator(prompt, max_length=100)
    
    return func.HttpResponse(
        json.dumps({"response": result[0]['generated_text']}),
        status_code=200,
        mimetype="application/json"
    )
```

### Google Cloud Functions com GPU

**Princípio:** Serverless com GPU para workloads de baixa frequência

**Implementação:**
```python
import functions_framework
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

@functions_framework.http
def generate_text(request):
    request_json = request.get_json()
    prompt = request_json.get('prompt', '')
    
    # Carregar modelo
    model = AutoModelForCausalLM.from_pretrained(
        "gpt2",
        torch_dtype=torch.float16,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=100)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return {"response": response}
```

### Vercel AI SDK

**Princípio:** Edge functions com streaming para LLMs

**Implementação:**
```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

### Cold start mitigation

**Princípio:** Reduzir cold start em serverless

**Estratégias:**
- **Model caching:** Manter modelo em memória entre invocações
- **Provisioned concurrency:** Manter instâncias aquecidas
- **Layer caching:** Empacotar modelo em container layers

**Implementação com provisioned concurrency:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  LLMFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.11
      MemorySize: 4096
      Timeout: 300
      ProvisionedConcurrency: 2  # Manter 2 instâncias aquecidas
```

**Recomendações:**
- **Para workloads esporádicos:** Serverless (AWS Lambda, Azure Functions)
- **Para baixa latência:** Provisioned concurrency + model caching
- **Para streaming:** Vercel AI SDK ou Edge functions
- **Para modelos grandes:** Self-host com autoscaling (serverless tem limites de memória)

## Edge computing

### Deploy em edge com Cloudflare Workers

**Princípio:** Deploy em edge locations para baixa latência global

**Implementação:**
```typescript
import { OpenAI } from 'openai';

export default {
  async fetch(request: Request): Promise<Response> {
    const { prompt } = await request.json();
    
    // Usar modelo menor para edge
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1'
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Modelo menor para edge
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });
    
    return new Response(JSON.stringify(completion.choices[0].message), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Deploy em edge com Vercel Edge Functions

**Princípio:** Edge functions com modelos quantizados

**Implementação:**
```typescript
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_API_KEY);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { prompt } = await req.json();
  
  // Usar modelo quantizado para edge
  const response = await hf.textGeneration({
    model: 'TheBloke/Llama-2-7B-Chat-GPTQ',  // Modelo quantizado 4-bit
    inputs: prompt,
    parameters: {
      max_new_tokens: 250,
      temperature: 0.7
    }
  });
  
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### On-device inference com ONNX Runtime

**Princípio:** Inferência local em dispositivos edge

**Implementação:**
```python
import onnxruntime as ort
from transformers import AutoTokenizer
import numpy as np

# Carregar modelo ONNX quantizado
session = ort.InferenceSession("llama-2-7b-quantized.onnx")
tokenizer = AutoTokenizer.from_pretrained("llama-2-7b")

def generate_on_device(prompt: str, max_tokens: int = 100):
    """Gera texto em dispositivo edge"""
    inputs = tokenizer(prompt, return_tensors="np")
    
    # Rodar inferência
    outputs = session.run(
        output_names=["logits"],
        input_feed={
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"]
        }
    )
    
    # Sample next token
    logits = outputs[0][0, -1, :]
    next_token_id = np.argmax(logits)
    
    return tokenizer.decode(next_token_id)
```

### Edge com TinyML

**Princípio:** Modelos ultra-leves para microcontroladores

**Implementação com TensorFlow Lite Micro:**
```python
import tensorflow as tf
from tensorflow.lite.micro.python.interpreter import Interpreter

# Carregar modelo TFLite
interpreter = Interpreter(model_path="tiny_llm.tflite")
interpreter.allocate_tensors()

# Obter detalhes de input/output
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def generate_tinyml(prompt: str):
    """Gera texto em microcontrolador"""
    # Tokenizar (simplificado)
    input_data = tokenize(prompt)
    
    # Set input
    interpreter.set_tensor(input_details[0]['index'], input_data)
    
    # Inferência
    interpreter.invoke()
    
    # Obter output
    output_data = interpreter.get_tensor(output_details[0]['index'])
    
    return detokenize(output_data)
```

### Hybrid edge-cloud deployment

**Princípio:** Roteamento inteligente entre edge e cloud

**Implementação:**
```python
def route_request(prompt: str, model_size: str = "small"):
    """Roteia entre edge e cloud baseado em complexidade"""
    
    # Se prompt simples e modelo pequeno, usar edge
    if len(prompt) < 500 and model_size == "small":
        return generate_on_edge(prompt)
    
    # Caso contrário, usar cloud
    return generate_on_cloud(prompt)

def generate_on_edge(prompt: str):
    """Gera em edge (baixa latência, modelo menor)"""
    # Usar modelo quantizado em edge
    response = edge_model.generate(prompt, max_tokens=100)
    return response

def generate_on_cloud(prompt: str):
    """Gera em cloud (alta latência, modelo maior)"""
    # Usar modelo maior em cloud
    response = cloud_model.generate(prompt, max_tokens=500)
    return response
```

**Recomendações:**
- **Para baixa latência global:** Edge computing (Cloudflare Workers, Vercel Edge)
- **Para dispositivos IoT:** ONNX Runtime ou TensorFlow Lite Micro
- **Para workloads mistos:** Hybrid edge-cloud routing
- **Para privacidade de dados:** On-device inference (dados não saem do dispositivo)

## Recomendações

### Para simplicidade
**Recomendado:** vLLM standalone
- Setup mais simples (pip install)
- OpenAI-compatible server
- Multi-platform
- Melhor throughput-per-dollar

### Para latência crítica
**Recomendado:** TensorRT-LLM
- 20-40% lower latency que vLLM
- Maximum NVIDIA optimization
- Melhor para latency-sensitive APIs

### Para agentes/structured generation
**Recomendado:** SGLang
- RadixAttention para prefix caching
- Structured output support central
- Melhor para multi-call workflows

### Para multi-node/multi-model
**Recomendado:** Ray Serve + vLLM ou llm-d
- Automatic placement groups
- Native multi-node inference
- Shared infrastructure

## Próximos passos

1. **Escolher engine:** Selecionar baseado em requisitos (throughput vs latency vs multi-node)
2. **Implementar deployment:** Usar vLLM standalone para single-node
3. **Configurar autoscaling:** Implementar KEDA com queue depth metric
4. **Otimizar GPU scheduling:** Usar MIG para multi-tenant, gang scheduling para TP
5. **Monitorar performance:** Track TTFT, TPS, GPU utilization
6. **Escalar para multi-node:** Migrar para Ray Serve ou llm-d quando necessário

## Referências

- vLLM: https://github.com/vllm-project/vllm
- TensorRT-LLM: https://github.com/NVIDIA/TensorRT-LLM
- SGLang: https://github.com/sgl-project/sglang
- Ray Serve: https://docs.ray.io/en/latest/serve/index.html
- llm-d: https://github.com/llm-d/llm-d
- NVIDIA Dynamo: https://github.com/NVIDIA/dynamo
