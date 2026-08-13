# Privacidade de Embeddings e Memória Persistente

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Avaliar riscos e mitigações de privacidade em embeddings e memória persistente

## Visão geral

Embeddings são representações vetoriais de texto usadas para busca semântica. Memória persistente armazena embeddings e metadados para reuso. Ambos podem conter dados sensíveis.

## Riscos identificados

### 1. Embeddings de código sensível
- **Risco:** Embeddings de código proprietário podem ser recuperados
- **Severidade:** Alta
- **Exemplo:** Embeddings de código com segredos hardcoded

### 2. Embeddings de PII
- **Risco:** Embeddings de dados pessoais identificáveis
- **Severidade:** Alta
- **Exemplo:** Embeddings de emails, nomes, endereços

### 3. Cross-project leakage
- **Risco:** Memória de um projeto pode vazar para outro
- **Severidade:** Média
- **Exemplo:** Embeddings do projeto A usados no projeto B

### 4. Exfiltração via embeddings
- **Risco:** Atacante pode recuperar dados sensíveis de embeddings
- **Severidade:** Alta
- **Exemplo:** Ataque de recuperação de texto a partir de embeddings

### 5. Retenção não autorizada
- **Risco:** Embeddings retidos além do período necessário
- **Severidade:** Média
- **Exemplo:** Embeddings retidos após exclusão do projeto

### 6. Compartilhamento não intencional
- **Risco:** Embeddings compartilhados com terceiros sem consentimento
- **Severidade:** Alta
- **Exemplo:** Embeddings enviados para provider externo

## Mitigações

### 1. Redaction antes de embedding

**Implementação:**
```javascript
function redactBeforeEmbedding(text) {
  // Padrões de secrets
  const secretPatterns = [
    /AWS_ACCESS_KEY_ID=[A-Za-z0-9]{20}/g,
    /AWS_SECRET_ACCESS_KEY=[A-Za-z0-9]{40}/g,
    /API_KEY=[A-Za-z0-9]{32}/g,
    /TOKEN=[A-Za-z0-9]{40}/g,
    /password=[^\s]+/gi,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Telefone
    /\b\d{11}\b/g, // CPF
    /\b\d{14}\b/g  // CNPJ
  ];
  
  let redacted = text;
  for (const pattern of secretPatterns) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  
  return redacted;
}
```

### 2. Isolamento por projeto

**Implementação:**
```javascript
class ProjectMemory {
  constructor(projectId) {
    this.projectId = projectId;
    this.embeddings = [];
  }
  
  addEmbedding(text, embedding) {
    // Adicionar apenas se for do mesmo projeto
    this.embeddings.push({
      text: redactBeforeEmbedding(text),
      embedding,
      projectId: this.projectId,
      timestamp: new Date().toISOString()
    });
  }
  
  search(query, k = 10) {
    // Buscar apenas embeddings do mesmo projeto
    const projectEmbeddings = this.embeddings.filter(e => e.projectId === this.projectId);
    // Executar busca semântica
    return semanticSearch(query, projectEmbeddings, k);
  }
}
```

### 3. Criptografia de embeddings

**Implementação:**
```javascript
const crypto = require('crypto');

function encryptEmbedding(embedding, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(embedding))),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptEmbedding(encrypted, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, 'hex')),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString());
}
```

### 4. Retenção configurável

**Implementação:**
```javascript
class RetentionPolicy {
  constructor(retentionDays = 30) {
    this.retentionDays = retentionDays;
  }
  
  shouldDelete(embedding) {
    const age = Date.now() - new Date(embedding.timestamp).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    return ageDays > this.retentionDays;
  }
  
  cleanup(embeddings) {
    return embeddings.filter(e => !this.shouldDelete(e));
  }
}
```

### 5. Exclusão sob demanda

**Implementação:**
```javascript
class MemoryManager {
  constructor() {
    this.memories = new Map(); // projectId -> ProjectMemory
  }
  
  deleteProject(projectId) {
    // Excluir todas as memórias do projeto
    this.memories.delete(projectId);
    
    // Excluir embeddings do banco de dados
    this.deleteEmbeddingsByProject(projectId);
  }
  
  deleteEmbeddingsByProject(projectId) {
    // Implementação depende do banco de dados
    // Exemplo para PostgreSQL:
    // DELETE FROM embeddings WHERE project_id = $1
  }
}
```

### 6. Auditoria de embeddings

**Implementação:**
```javascript
function logEmbeddingOperation(operation, projectId, embeddingId) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation, // 'create', 'read', 'update', 'delete'
    projectId,
    embeddingId,
    userId: getCurrentUserId()
  };
  
  fs.appendFileSync('embeddings_audit.log', JSON.stringify(logEntry) + '\n');
}
```

### 7. Validação de consentimento

**Implementação:**
```javascript
class ConsentManager {
  constructor() {
    this.consents = new Map(); // projectId -> consent
  }
  
  hasConsent(projectId, operation) {
    const consent = this.consents.get(projectId);
    if (!consent) return false;
    
    // Verificar consentimento específico
    if (operation === 'embeddings' && !consent.allowEmbeddings) return false;
    if (operation === 'persistence' && !consent.allowPersistence) return false;
    
    return true;
  }
  
  setConsent(projectId, consent) {
    this.consents.set(projectId, consent);
  }
}
```

## Framework de avaliação

### 1. Testes de privacidade

**Teste 1: Redaction de secrets**
```javascript
test('deve redactar secrets antes de embedding', () => {
  const text = 'API_KEY=abc123def456';
  const redacted = redactBeforeEmbedding(text);
  expect(redacted).not.toContain('abc123def456');
  expect(redacted).toContain('[REDACTED]');
});
```

**Teste 2: Isolamento por projeto**
```javascript
test('deve isolar embeddings por projeto', () => {
  const memoryA = new ProjectMemory('project-a');
  const memoryB = new ProjectMemory('project-b');
  
  memoryA.addEmbedding('secret code from A', embedding);
  memoryB.addEmbedding('secret code from B', embedding);
  
  const resultsA = memoryA.search('secret');
  const resultsB = memoryB.search('secret');
  
  expect(resultsA).toHaveLength(1);
  expect(resultsB).toHaveLength(1);
  expect(resultsA[0].projectId).toBe('project-a');
  expect(resultsB[0].projectId).toBe('project-b');
});
```

**Teste 3: Retenção**
```javascript
test('deve excluir embeddings após período de retenção', () => {
  const policy = new RetentionPolicy(30);
  const oldEmbedding = {
    timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  };
  const newEmbedding = {
    timestamp: new Date().toISOString()
  };
  
  const cleaned = policy.cleanup([oldEmbedding, newEmbedding]);
  
  expect(cleaned).toHaveLength(1);
  expect(cleaned[0]).toBe(newEmbedding);
});
```

### 2. Testes de funcionalidade

**Teste 1: Busca semântica**
```javascript
test('deve executar busca semântica', () => {
  const memory = new ProjectMemory('project-a');
  memory.addEmbedding('function to calculate sum', embedding1);
  memory.addEmbedding('function to calculate product', embedding2);
  
  const results = memory.search('addition');
  
  expect(results).toHaveLength(1);
  expect(results[0].text).toContain('sum');
});
```

## Checklist de privacidade

### Antes de implementar embeddings
- [ ] Implementar redaction de secrets
- [ ] Implementar isolamento por projeto
- [ ] Implementar criptografia de embeddings
- [ ] Implementar retenção configurável
- [ ] Implementar exclusão sob demanda
- [ ] Implementar auditoria de embeddings
- [ ] Implementar validação de consentimento

### Durante desenvolvimento
- [ ] Executar testes de privacidade
- [ ] Executar testes de funcionalidade
- [ ] Revisar logs de auditoria
- [ ] Testar com dados sensíveis
- [ ] Testar exclusão de projeto

### Após implementação
- [ ] Documentar procedimentos de privacidade
- [ ] Treinar equipe em privacidade
- [ ] Configurar alertas de privacidade
- [ ] Revisar logs regularmente
- [ ] Atualizar políticas de retenção

## Recomendações

### Para desenvolvimento
- **Redaction obrigatória:** Sempre redactar secrets antes de embedding
- **Isolamento por projeto:** Nunca compartilhar embeddings entre projetos
- **Criptografia:** Criptografar embeddings em repouso
- **Retenção configurável:** Permitir configuração de retenção por projeto
- **Consentimento:** Obter consentimento explícito para embeddings

### Para produção
- **Criptografia obrigatória:** Criptografar todos os embeddings
- **Auditoria completa:** Registrar todas as operações de embeddings
- **Exclusão sob demanda:** Permitir exclusão imediata de embeddings
- **Alertas em tempo real:** Notificar equipe de atividades suspeitas
- **Revisão regular:** Revisar políticas de retenção regularmente

## Próximos passos

1. **Implementar redaction:** Criar função redactBeforeEmbedding
2. **Implementar isolamento:** Criar classe ProjectMemory
3. **Implementar criptografia:** Criar funções encrypt/decrypt
4. **Implementar retenção:** Criar classe RetentionPolicy
5. **Implementar auditoria:** Criar sistema de logs
6. **Executar testes:** Validar mitigações
7. **Documentar procedimentos:** Criar guia de privacidade

## Referências

- OWASP AI Security: https://owasp.org/www-project-ai-security/
- Privacy-Preserving Machine Learning: https://arxiv.org/abs/2008.07927
- Differential Privacy: https://en.wikipedia.org/wiki/Differential_privacy
- Homomorphic Encryption: https://en.wikipedia.org/wiki/Homomorphic_encryption
- GDPR Article 25 (Data Protection by Design): https://gdpr-info.eu/art-25-gdpr/
