# Operação Air-Gapped e Atualização Segura de Modelos/Skills

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Avaliar riscos e mitigações de operação air-gapped e atualização segura de modelos/skills

## Visão geral

Operação air-gapped refere-se a sistemas sem conexão com a internet. Atualização segura de modelos/skills refere-se a processos para atualizar modelos e skills em sistemas air-gapped de forma segura.

## Riscos identificados

### 1. Introdução de malware via atualização
- **Risco:** Atualização maliciosa introduz malware no sistema air-gapped
- **Severidade:** Alta
- **Exemplo:** Modelo de IA contendo backdoor

### 2. Exfiltração de dados via atualização
- **Risco:** Atualização exfiltra dados do sistema air-gapped
- **Severidade:** Alta
- **Exemplo:** Skill que envia dados sensíveis para servidor externo

### 3. Comprometimento de cadeia de suprimentos
- **Risco:** Repositório de atualizações comprometido
- **Severidade:** Alta
- **Exemplo:** Atacante injeta código malicioso em repositório

### 4. Atualização não autorizada
- **Risco:** Atualização não autorizada altera comportamento do sistema
- **Severidade:** Média
- **Exemplo:** Administrador não autorizado instala atualização

### 5. Rollback falho
- **Risco:** Rollback de atualização falha, deixando sistema em estado inconsistente
- **Severidade:** Média
- **Exemplo:** Backup corrompido, rollback não possível

### 6. Assinatura digital não verificada
- **Risco:** Atualização não verificada pode ser adulterada
- **Severidade:** Alta
- **Exemplo:** Atualização com assinatura falsa

## Mitigações

### 1. Assinatura digital de atualizações

**Implementação:**
```javascript
const crypto = require('crypto');

function signUpdate(updateData, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(updateData));
  sign.end();
  
  const signature = sign.sign(privateKey, 'base64');
  
  return {
    data: updateData,
    signature,
    algorithm: 'SHA256'
  };
}

function verifyUpdate(signedUpdate, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(JSON.stringify(signedUpdate.data));
  verify.end();
  
  const isValid = verify.verify(publicKey, signedUpdate.signature, 'base64');
  
  return isValid;
}
```

### 2. Verificação de checksum

**Implementação:**
```javascript
const crypto = require('crypto');

function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = fs.readFileSync(filePath);
  hash.update(fileBuffer);
  
  return hash.digest('hex');
}

function verifyChecksum(filePath, expectedChecksum) {
  const actualChecksum = calculateChecksum(filePath);
  return actualChecksum === expectedChecksum;
}
```

### 3. Sandbox de atualização

**Implementação:**
```javascript
async function testUpdateInSandbox(updatePackage) {
  // Criar container Docker isolado
  const container = await docker.createContainer({
    Image: 'ubuntu:latest',
    NetworkMode: 'none', // Sem rede
    HostConfig: {
      Binds: {
        [updatePackage]: '/update:ro'
      },
      ReadonlyRootfs: true
    }
  });
  
  // Executar atualização no sandbox
  await container.start();
  const result = await container.exec({
    Cmd: ['sh', '/update/install.sh']
  });
  
  // Verificar se atualização foi bem-sucedida
  if (result.exitCode !== 0) {
    throw new Error('Atualização falhou no sandbox');
  }
  
  await container.stop();
  await container.remove();
  
  return true;
}
```

### 4. Backup antes de atualização

**Implementação:**
```javascript
async function createBackupBeforeUpdate() {
  const timestamp = new Date().toISOString();
  const backupPath = `/backups/pre-update-${timestamp}`;
  
  // Criar backup do diretório de modelos
  await fs.copy('/models', `${backupPath}/models`);
  
  // Criar backup do diretório de skills
  await fs.copy('/skills', `${backupPath}/skills`);
  
  // Criar backup do banco de dados
  await fs.copy('/data/storage.sqlite', `${backupPath}/storage.sqlite`);
  
  // Criar checksum do backup
  const checksum = calculateChecksum(backupPath);
  
  return {
    path: backupPath,
    checksum,
    timestamp
  };
}
```

### 5. Rollback automático

**Implementação:**
```javascript
async function rollbackUpdate(backup) {
  // Verificar checksum do backup
  const currentChecksum = calculateChecksum(backup.path);
  if (currentChecksum !== backup.checksum) {
    throw new Error('Backup corrompido');
  }
  
  // Parar serviços
  await stopServices();
  
  // Restaurar modelos
  await fs.copy(`${backup.path}/models`, '/models');
  
  // Restaurar skills
  await fs.copy(`${backup.path}/skills`, '/skills');
  
  // Restaurar banco de dados
  await fs.copy(`${backup.path}/storage.sqlite`, '/data/storage.sqlite');
  
  // Reiniciar serviços
  await startServices();
  
  return true;
}
```

### 6. Transferência segura (air-gap)

**Implementação:**
```javascript
async function transferUpdateAirGap(sourcePath, destinationPath, mediaPath) {
  // Criar mídia criptografada
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(fs.readFileSync(sourcePath)),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Escrever mídia criptografada
  const mediaPackage = {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
    checksum: calculateChecksum(sourcePath)
  };
  
  fs.writeFileSync(mediaPath, JSON.stringify(mediaPackage));
  
  // Transferir chave separadamente (via canal seguro)
  return encryptionKey.toString('hex');
}
```

### 7. Auditoria de atualizações

**Implementação:**
```javascript
function logUpdate(update, userId, status) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    updateId: update.id,
    updateVersion: update.version,
    userId,
    status, // 'started', 'completed', 'failed', 'rolled_back'
    checksum: update.checksum,
    signature: update.signature
  };
  
  fs.appendFileSync('updates_audit.log', JSON.stringify(logEntry) + '\n');
}
```

### 8. Validação de dependências

**Implementação:**
```javascript
function validateDependencies(update) {
  // Verificar dependências do modelo
  for (const dep of update.dependencies) {
    // Verificar se dependência está instalada
    if (!isInstalled(dep.name, dep.version)) {
      throw new Error(`Dependência não encontrada: ${dep.name}@${dep.version}`);
    }
    
    // Verificar se dependência é segura
    if (!isSecure(dep.name, dep.version)) {
      throw new Error(`Dependência insegura: ${dep.name}@${dep.version}`);
    }
  }
  
  return true;
}
```

## Framework de avaliação

### 1. Testes de segurança

**Teste 1: Assinatura digital**
```javascript
test('deve verificar assinatura digital', () => {
  const privateKey = fs.readFileSync('private_key.pem');
  const publicKey = fs.readFileSync('public_key.pem');
  
  const update = { version: '1.0.0', data: '...' };
  const signed = signUpdate(update, privateKey);
  
  expect(verifyUpdate(signed, publicKey)).toBe(true);
  
  // Modificar dados
  signed.data.version = '2.0.0';
  
  expect(verifyUpdate(signed, publicKey)).toBe(false);
});
```

**Teste 2: Verificação de checksum**
```javascript
test('deve verificar checksum', () => {
  const filePath = 'test.txt';
  fs.writeFileSync(filePath, 'test data');
  
  const checksum = calculateChecksum(filePath);
  expect(verifyChecksum(filePath, checksum)).toBe(true);
  
  // Modificar arquivo
  fs.writeFileSync(filePath, 'modified data');
  
  expect(verifyChecksum(filePath, checksum)).toBe(false);
});
```

**Teste 3: Rollback**
```javascript
test('deve fazer rollback de atualização', async () => {
  const backup = await createBackupBeforeUpdate();
  
  // Simular atualização falha
  await rollbackUpdate(backup);
  
  // Verificar se backup foi restaurado
  expect(fs.existsSync('/models')).toBe(true);
});
```

### 2. Testes de funcionalidade

**Teste 1: Atualização segura**
```javascript
test('deve atualizar modelo com segurança', async () => {
  const update = {
    id: 'model-1',
    version: '2.0.0',
    data: '...',
    checksum: 'abc123',
    signature: '...'
  };
  
  const backup = await createBackupBeforeUpdate();
  
  await applyUpdate(update);
  
  // Verificar se atualização foi aplicada
  expect(getModelVersion()).toBe('2.0.0');
  
  // Limpar
  await rollbackUpdate(backup);
});
```

## Checklist de segurança

### Antes de atualização
- [ ] Verificar assinatura digital
- [ ] Verificar checksum
- [ ] Validar dependências
- [ ] Testar em sandbox
- [ ] Criar backup
- [ ] Notificar usuários
- [ ] Agendar janela de manutenção

### Durante atualização
- [ ] Executar em sandbox
- [ ] Monitorar logs
- [ ] Verificar integridade
- [ ] Testar funcionalidade
- [ ] Preparar rollback

### Após atualização
- [ ] Verificar versão
- [ ] Executar testes
- [ ] Monitorar logs
- [ ] Documentar mudanças
- [ ] Limpar backup (após período de retenção)

## Recomendações

### Para desenvolvimento
- **Assinatura obrigatória:** Sempre assinar atualizações
- **Verificação de checksum:** Sempre verificar checksum
- **Sandbox de teste:** Sempre testar em sandbox
- **Backup antes:** Sempre criar backup antes de atualizar
- **Rollback automático:** Implementar rollback automático em caso de falha

### Para produção
- **Air-gap completo:** Sistema completamente isolado
- **Atualização manual:** Transferência manual via mídia criptografada
- **Assinatura digital:** Verificar assinatura antes de aplicar
- **Auditoria completa:** Registrar todas as atualizações
- **Alertas em tempo real:** Notificar equipe de falhas de atualização

## Próximos passos

1. **Implementar assinatura:** Criar funções sign/verify
2. **Implementar checksum:** Criar função calculateChecksum
3. **Implementar sandbox:** Criar função testUpdateInSandbox
4. **Implementar backup:** Criar função createBackupBeforeUpdate
5. **Implementar rollback:** Criar função rollbackUpdate
6. **Implementar auditoria:** Criar sistema de logs
7. **Executar testes:** Validar mitigações
8. **Documentar procedimentos:** Criar guia de atualização

## Referências

- NIST SP 800-53 (Security Controls): https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- CIS Controls: https://www.cisecurity.org/controls/cis-controls-navigator
- Air-Gapped Security: https://en.wikipedia.org/wiki/Air_gap_(computing)
- Supply Chain Security: https://www.cisa.gov/news-events/news/supply-chain-security
