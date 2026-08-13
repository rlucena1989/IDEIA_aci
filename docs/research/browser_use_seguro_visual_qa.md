# Browser-use Seguro e Visual QA

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Avaliar riscos e mitigações de browser-use seguro e visual QA

## Visão geral

Browser-use permite que agentes interajam com aplicações web para automação e testes. Visual QA permite que agentes validem interfaces visuais. Ambos podem expor dados sensíveis e executar ações não autorizadas.

## Riscos identificados

### 1. Execução de scripts maliciosos
- **Risco:** Agente executa JavaScript malicioso em browser
- **Severidade:** Alta
- **Exemplo:** Script que exfiltra dados para servidor externo

### 2. Exfiltração de dados via browser
- **Risco:** Agente envia dados sensíveis via formulários web
- **Severidade:** Alta
- **Exemplo:** Preencher formulário com credenciais e enviar

### 3. Acesso a cookies e sessões
- **Risco:** Agente acessa cookies de autenticação
- **Severidade:** Alta
- **Exemplo:** Ler cookies de sessão e enviar para atacante

### 4. Clickjacking
- **Risco:** Agente é enganado a clicar em elementos invisíveis
- **Severidade:** Média
- **Exemplo:** Clicar em botão invisível que executa ação não autorizada

### 5. XSS via browser
- **Risco:** Agente executa código via injeção de XSS
- **Severidade:** Alta
- **Exemplo:** Injetar script via parâmetro URL

### 6. Captura de screenshots sensíveis
- **Risco:** Screenshots capturam dados sensíveis
- **Severidade:** Média
- **Exemplo:** Screenshot de dashboard com dados corporativos

## Mitigações

### 1. Sandbox de browser

**Implementação:**
```javascript
const { chromium } = require('playwright');

async function createSecureBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  const context = await browser.newContext({
    // Desabilitar cookies persistentes
    storageState: undefined,
    // Desabilitar cache
    serviceWorkers: 'block',
    // Desabilitar downloads
    acceptDownloads: false,
    // Desabilitar geolocalização
    geolocation: undefined,
    // Desabilitar permissões
    permissions: [],
    // Desabilitar JavaScript (opcional)
    javaScriptEnabled: true
  });
  
  return { browser, context };
}
```

### 2. Validação de URLs

**Implementação:**
```javascript
function validateURL(url) {
  // Lista de domínios permitidos
  const allowedDomains = ['example.com', 'trusted-site.com'];
  
  // Lista de domínios bloqueados
  const blockedDomains = ['attacker.com', 'malicious-site.com'];
  
  try {
    const parsed = new URL(url);
    
    // Verificar protocolo
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocolo não permitido');
    }
    
    // Verificar domínio bloqueado
    if (blockedDomains.some(domain => parsed.hostname.includes(domain))) {
      throw new Error('Domínio bloqueado');
    }
    
    // Verificar domínio permitido (se configurado)
    if (allowedDomains.length > 0 && !allowedDomains.some(domain => parsed.hostname.includes(domain))) {
      throw new Error('Domínio não permitido');
    }
    
    return url;
  } catch (error) {
    throw new Error(`URL inválida: ${error.message}`);
  }
}
```

### 3. Redaction de screenshots

**Implementação:**
```javascript
const sharp = require('sharp');

async function redactScreenshot(screenshotPath, outputPath) {
  // Redactar áreas sensíveis (ex: header, sidebar)
  const image = sharp(screenshotPath);
  const metadata = await image.metadata();
  
  // Redactar header (top 100px)
  await image
    .extract({ left: 0, top: 0, width: metadata.width, height: 100 })
    .blur(10)
    .toFile(outputPath);
  
  return outputPath;
}
```

### 4. Limitação de ações

**Implementação:**
```javascript
class BrowserActionLimiter {
  constructor(maxActions = 100, timeoutMs = 60000) {
    this.maxActions = maxActions;
    this.timeoutMs = timeoutMs;
    this.actions = [];
    this.startTime = Date.now();
  }
  
  canPerformAction() {
    // Verificar limite de ações
    if (this.actions.length >= this.maxActions) {
      return false;
    }
    
    // Verificar timeout
    if (Date.now() - this.startTime > this.timeoutMs) {
      return false;
    }
    
    return true;
  }
  
  recordAction(action) {
    this.actions.push({
      action,
      timestamp: Date.now()
    });
  }
}
```

### 5. Detecção de XSS

**Implementação:**
```javascript
function detectXSS(text) {
  // Padrões de XSS
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /document\.cookie/gi,
    /document\.location/gi,
    /window\.location/gi
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  return false;
}
```

### 6. Auditoria de browser actions

**Implementação:**
```javascript
function logBrowserAction(action, url, result) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action, // 'click', 'type', 'navigate', 'screenshot'
    url: redactURL(url),
    result: redactResult(result),
    userId: getCurrentUserId()
  };
  
  fs.appendFileSync('browser_actions.log', JSON.stringify(logEntry) + '\n');
}

function redactURL(url) {
  // Remover parâmetros sensíveis
  const parsed = new URL(url);
  parsed.searchParams.delete('token');
  parsed.searchParams.delete('api_key');
  parsed.searchParams.delete('password');
  return parsed.toString();
}

function redactResult(result) {
  // Redactar dados sensíveis do resultado
  return result.replace(/token=[^\s]+/gi, 'token=[REDACTED]');
}
```

### 7. Isolamento de contexto

**Implementação:**
```javascript
class BrowserContextManager {
  constructor() {
    this.contexts = new Map(); // userId -> browser context
  }
  
  getContext(userId) {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, this.createContext());
    }
    return this.contexts.get(userId);
  }
  
  createContext() {
    // Criar contexto isolado
    return {
      cookies: new Map(),
      localStorage: new Map(),
      sessionStorage: new Map()
    };
  }
  
  clearContext(userId) {
    this.contexts.delete(userId);
  }
}
```

## Framework de avaliação

### 1. Testes de segurança

**Teste 1: Validação de URL**
```javascript
test('deve bloquear URL maliciosa', () => {
  expect(() => validateURL('http://attacker.com')).toThrow('Domínio bloqueado');
});
```

**Teste 2: Detecção de XSS**
```javascript
test('deve detectar XSS', () => {
  expect(detectXSS('<script>alert("XSS")</script>')).toBe(true);
});
```

**Teste 3: Limitação de ações**
```javascript
test('deve limitar número de ações', () => {
  const limiter = new BrowserActionLimiter(2);
  
  expect(limiter.canPerformAction()).toBe(true);
  limiter.recordAction('click');
  
  expect(limiter.canPerformAction()).toBe(true);
  limiter.recordAction('click');
  
  expect(limiter.canPerformAction()).toBe(false);
});
```

### 2. Testes de funcionalidade

**Teste 1: Navegação segura**
```javascript
test('deve navegar para URL permitida', async () => {
  const { browser, context } = await createSecureBrowser();
  const page = await context.newPage();
  
  const url = validateURL('https://example.com');
  await page.goto(url);
  
  expect(page.url()).toBe(url);
  
  await browser.close();
});
```

**Teste 2: Click seguro**
```javascript
test('deve clicar em elemento permitido', async () => {
  const { browser, context } = await createSecureBrowser();
  const page = await context.newPage();
  
  await page.goto('https://example.com');
  await page.click('#safe-button');
  
  expect(await page.title()).toBe('Success');
  
  await browser.close();
});
```

## Checklist de segurança

### Antes de implementar browser-use
- [ ] Implementar sandbox de browser
- [ ] Implementar validação de URLs
- [ ] Implementar redaction de screenshots
- [ ] Implementar limitação de ações
- [ ] Implementar detecção de XSS
- [ ] Implementar auditoria de browser actions
- [ ] Implementar isolamento de contexto

### Durante desenvolvimento
- [ ] Executar testes de segurança
- [ ] Executar testes de funcionalidade
- [ ] Revisar logs de auditoria
- [ ] Testar com URLs maliciosas
- [ ] Testar com XSS

### Após implementação
- [ ] Documentar procedimentos de segurança
- [ ] Treinar equipe em segurança
- [ ] Configurar alertas de segurança
- [ ] Revisar logs regularmente
- [ ] Atualizar lista de domínios bloqueados

## Recomendações

### Para desenvolvimento
- **Sandbox obrigatório:** Sempre usar sandbox de browser
- **Validação de URLs:** Nunca confiar em URLs do usuário
- **Redaction de screenshots:** Sempre redactar áreas sensíveis
- **Limitação de ações:** Limitar número de ações por sessão
- **Detecção de XSS:** Validar todos os inputs contra XSS

### Para produção
- **Sandbox isolado:** Usar browser em container isolado
- **Auditoria completa:** Registrar todas as ações de browser
- **Alertas em tempo real:** Notificar equipe de atividades suspeitas
- **Revisão regular:** Revisar logs de segurança regularmente
- **Atualização de padrões:** Atualizar lista de domínios bloqueados regularmente

## Próximos passos

1. **Implementar sandbox:** Criar função createSecureBrowser
2. **Implementar validação:** Criar função validateURL
3. **Implementar redaction:** Criar função redactScreenshot
4. **Implementar limitação:** Criar classe BrowserActionLimiter
5. **Implementar detecção:** Criar função detectXSS
6. **Implementar auditoria:** Criar sistema de logs
7. **Executar testes:** Validar mitigações
8. **Documentar procedimentos:** Criar guia de segurança

## Referências

- OWASP Browser Security: https://owasp.org/www-community/attacks/Browser_Exploitation_Framework
- Playwright Security: https://playwright.dev/docs/security
- XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- Clickjacking Defense: https://owasp.org/www-community/attacks/Clickjacking
