# Agent Observability e Replay Determinístico

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Definir estratégia de observability e replay determinístico para agentes

## Visão geral

Observability permite monitorar e entender o comportamento de agentes. Replay determinístico permite reproduzir exatamente o comportamento de um agente para debugging e análise.

## Componentes de observability

### 1. Logging estruturado

**Implementação:**
```javascript
const pino = require('pino');

const logger = pino({
  level: 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

function logAgentAction(action, context, result) {
  logger.info({
    type: 'agent_action',
    action,
    context: {
      userId: context.userId,
      sessionId: context.sessionId,
      projectId: context.projectId
    },
    result: {
      status: result.status,
      duration: result.duration,
      tokensUsed: result.tokensUsed
    }
  });
}
```

### 2. Tracing distribuído

**Implementação:**
```javascript
const { trace, context } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry-exporter-jaeger');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

async function executeAgentTask(task) {
  const tracer = trace.getTracer('ideia-agent');
  const span = tracer.startSpan('execute_agent_task', {
    attributes: {
      'task.id': task.id,
      'task.type': task.type
    }
  });
  
  try {
    const result = await task.execute();
    span.setStatus({ code: 1, message: 'Success' });
    return result;
  } catch (error) {
    span.setStatus({ code: 2, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
```

### 3. Métricas

**Implementação:**
```javascript
const { Counter, Histogram, Gauge } = require('prom-client');

const agentActionsCounter = new Counter({
  name: 'ideia_agent_actions_total',
  help: 'Total number of agent actions',
  labelNames: ['action_type', 'status']
});

const agentTaskDuration = new Histogram({
  name: 'ideia_agent_task_duration_seconds',
  help: 'Duration of agent tasks',
  labelNames: ['task_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60]
});

const activeAgentsGauge = new Gauge({
  name: 'ideia_active_agents',
  help: 'Number of active agents'
});

function recordAgentAction(actionType, status) {
  agentActionsCounter.inc({ action_type: actionType, status });
}

function recordTaskDuration(taskType, duration) {
  agentTaskDuration.observe({ task_type: taskType }, duration);
}
```

### 4. Profiling

**Implementação:**
```javascript
const inspector = require('inspector');
const fs = require('fs');

function startProfiling() {
  inspector.open(0, '127.0.0.1');
  inspector.profiler.enable();
  inspector.profiler.start();
}

function stopProfiling(outputPath) {
  const profile = inspector.profiler.stop();
  fs.writeFileSync(outputPath, JSON.stringify(profile));
  inspector.profiler.disable();
}
```

## Replay determinístico

### 1. Captura de estado

**Implementação:**
```javascript
class StateCapture {
  captureInitialState(context) {
    return {
      timestamp: Date.now(),
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        projectId: context.projectId
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      filesystem: this.captureFilesystemState(context.workingDir),
      git: this.captureGitState(context.workingDir)
    };
  }
  
  captureFilesystemState(workingDir) {
    const files = [];
    
    function traverse(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else {
          files.push({
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime,
            hash: calculateFileHash(fullPath)
          });
        }
      }
    }
    
    traverse(workingDir);
    return files;
  }
  
  captureGitState(workingDir) {
    try {
      const branch = execSync('git branch --show-current', { cwd: workingDir }).toString().trim();
      const commit = execSync('git rev-parse HEAD', { cwd: workingDir }).toString().trim();
      
      return {
        branch,
        commit,
        status: execSync('git status --porcelain', { cwd: workingDir }).toString()
      };
    } catch (error) {
      return null;
    }
  }
}
```

### 2. Captura de inputs

**Implementação:**
```javascript
class InputCapture {
  captureInputs(task) {
    return {
      prompt: task.prompt,
      context: task.context,
      tools: task.tools,
      model: task.model,
      parameters: task.parameters
    };
  }
  
  captureLLMRequests(requests) {
    return requests.map(request => ({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      timestamp: request.timestamp
    }));
  }
  
  captureToolCalls(calls) {
    return calls.map(call => ({
      tool: call.tool,
      parameters: call.parameters,
      result: call.result,
      timestamp: call.timestamp
    }));
  }
}
```

### 3. Captura de outputs

**Implementação:**
```javascript
class OutputCapture {
  captureOutputs(result) {
    return {
      response: result.response,
      actions: result.actions,
      filesModified: result.filesModified,
      errors: result.errors,
      duration: result.duration,
      tokensUsed: result.tokensUsed
    };
  }
  
  captureLLMResponses(responses) {
    return responses.map(response => ({
      model: response.model,
      response: response.response,
      tokensUsed: response.tokensUsed,
      duration: response.duration,
      timestamp: response.timestamp
    }));
  }
}
```

### 4. Replay

**Implementação:**
```javascript
class AgentReplay {
  async replayExecution(executionId) {
    const execution = await this.loadExecution(executionId);
    
    // Restaurar estado inicial
    await this.restoreInitialState(execution.initialState);
    
    // Reproduzir inputs
    for (const input of execution.inputs) {
      if (input.type === 'llm_request') {
        await this.replayLLMRequest(input);
      } else if (input.type === 'tool_call') {
        await this.replayToolCall(input);
      }
    }
    
    // Verificar outputs
    const actualOutputs = await this.captureOutputs();
    const outputsMatch = this.compareOutputs(execution.outputs, actualOutputs);
    
    return {
      success: outputsMatch,
      actualOutputs,
      expectedOutputs: execution.outputs
    };
  }
  
  async restoreInitialState(state) {
    // Restaurar filesystem
    await this.restoreFilesystem(state.filesystem);
    
    // Restaurar git state
    if (state.git) {
      await this.restoreGitState(state.git);
    }
  }
  
  compareOutputs(expected, actual) {
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
}
```

## Framework de observability

### 1. Dashboard

**Métricas principais:**
- Taxa de sucesso de tarefas
- Duração média de tarefas
- Tokens usados por tarefa
- Número de agentes ativos
- Erros por tipo

### 2. Alertas

**Alertas configuráveis:**
- Taxa de sucesso < 90%
- Duração média > 5 minutos
- Tokens usados > 100.000/hora
- Erros > 10/hora
- Agentes ativos > 100

### 3. Debugging

**Ferramentas:**
- Replay de execução
- Comparação de estados
- Análise de logs
- Profiling de performance

## Próximos passos

1. **Implementar logging:** Configurar logging estruturado
2. **Implementar tracing:** Configurar tracing distribuído
3. **Implementar métricas:** Configurar métricas e dashboard
4. **Implementar captura:** Criar sistema de captura de estado
5. **Implementar replay:** Criar sistema de replay
6. **Testar replay:** Validar determinismo
7. **Documentar procedimentos:** Criar guia de debugging

## Referências

- OpenTelemetry: https://opentelemetry.io/
- Prometheus: https://prometheus.io/
- Jaeger: https://www.jaegertracing.io/
- Pino: https://getpino.io/
