# Avaliação de Ferramentas de Autenticação

**Data:** 11 de agosto de 2026  
**Status:** Documentação completa  
**Objetivo:** Comparar ferramentas de autenticação (Auth0, Firebase Auth, Supabase Auth) e recomendar a melhor opção

## Visão geral

Autenticação é crítica para sistemas de IA que manipulam dados sensíveis ou requerem controle de acesso. Diferentes ferramentas oferecem abordagens distintas para gerenciar identidade, autorização e segurança.

## Ferramentas comparadas

### 1. Auth0

**Foco:** Plataforma de identidade como serviço (IDaaS)  
**GitHub stars:** ~8k (julho 2026)  
**Licença:** Proprietário (freemium)  
**Primary focus:** Enterprise identity management  
**Language support:** Multi-plataforma (SDKs para todas as linguagens)  
**Auth methods:** Password, Social, SAML, OIDC, MFA, Passwordless  
**Database:** Custom database connections  
**Pricing:** Free tier (7k MAU), paid from $23/mo

**Prós:**
- Suporte a todos os protocolos (OAuth2, OIDC, SAML)
- MFA avançado (SMS, email, TOTP, push, biometria)
- Custom database connections
- Rules e Actions para customização
- Enterprise features (SSO, AD/LDAP integration)
- Compliance (SOC2, HIPAA, GDPR)
- Logs detalhados e auditoria
- Anomaly detection
- Breached password protection

**Contras:**
- Custo para scale (preço por MAU)
- Curva de aprendizado para features avançadas
- Vendor lock-in
- Latência adicional (chamadas de API)
- Complexo para casos simples

**Best for:**
- Enterprise applications
- Aplicações com requisitos de compliance
- Sistemas com múltiplos providers de identidade
- Aplicações com SSO

**Implementação básica:**
```python
from auth0 import Authentication, Management

# Configuração
auth0 = Authentication(
    domain='your-domain.auth0.com',
    client_id='your-client-id',
    client_secret='your-client-secret'
)

# Login
def login(email, password):
    result = auth0.login(
        email=email,
        password=password,
        audience='your-api-audience',
        scope='openid profile email'
    )
    return result['id_token']

# Verificar token
def verify_token(token):
    try:
        payload = auth0.verify(token)
        return payload
    except Exception as e:
        raise InvalidTokenError()
```

**Features avançadas:**
```python
# MFA
auth0.enable_mfa(user_id, methods=['sms', 'totp'])

# Rules (JavaScript)
# auth0/rules/mfa-required.js
function (user, context, callback) {
    if (context.connection === 'Username-Password-Authentication') {
        context.multifactor = {
            provider: 'auth0',
            issuer: 'auth0'
        };
    }
    callback(null, user, context);
}

# Actions (Node.js)
# auth0/actions/post-login.js
exports.executePostLogin = async (event) => {
    const user = event.user;
    
    // Custom logic
    if (user.email.endsWith('@company.com')) {
        event.authorization.roles.push('admin');
    }
    
    return event;
};
```

### 2. Firebase Authentication

**Foco:** Autenticação para aplicações mobile e web  
**GitHub stars:** ~5k (julho 2026)  
**Licença:** Proprietário (freemium)  
**Primary focus:** Google ecosystem integration  
**Language support:** JavaScript, TypeScript, Python, Go, Java, Swift, Kotlin  
**Auth methods:** Email/password, Phone, Social (Google, Facebook, Twitter, GitHub), Anonymous  
**Database:** Firebase Realtime Database, Firestore  
**Pricing:** Free tier (Spark), paid from $25/mo (Blaze)

**Prós:**
- Integração nativa com Firebase (Firestore, Functions, Storage)
- SDKs simples e intuitivos
- Real-time authentication state
- Anonymous auth para testes
- Phone authentication built-in
- Suporte a custom tokens
- Free tier generoso
- Google ecosystem integration

**Contras:**
- Limitado a Google ecosystem
- Menos opções de MFA (apenas SMS)
- Sem SAML (requer Google Cloud Identity Platform)
- Vendor lock-in com Firebase
- Menos customização que Auth0
- Latência para operações complexas

**Best for:**
- Aplicações Firebase
- Mobile apps (iOS, Android)
- Aplicações web simples
- Prototipagem rápida
- Startups usando Google stack

**Implementação básica:**
```python
import firebase_admin
from firebase_admin import auth, credentials

# Inicializar
cred = credentials.Certificate('service-account.json')
firebase_admin.initialize_app(cred)

# Criar usuário
def create_user(email, password):
    user = auth.create_user(
        email=email,
        password=password
    )
    return user.uid

# Verificar token
def verify_token(token):
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise InvalidTokenError()

# Custom claims
def set_custom_claims(uid, claims):
    auth.set_custom_user_claims(uid, claims)
```

**Features avançadas:**
```python
# Phone authentication
auth.create_user(
    phone_number='+15555550100'
)

# Custom tokens
custom_token = auth.create_custom_token(uid)

# Multi-factor authentication (SMS)
auth.update_user(uid, phone_number='+15555550100')
auth.generate_email_verification_link(email)

# Anonymous auth
anonymous_user = auth.create_anonymous_user()
```

### 3. Supabase Auth

**Foco:** Autenticação open-source com PostgreSQL  
**GitHub stars:** ~65k (julho 2026)  
**Licença:** MIT (open source), paid cloud tier  
**Primary focus:** Open-source Firebase alternative  
**Language support:** JavaScript, TypeScript, Python, Go, Dart, Swift  
**Auth methods:** Email, Phone, Social, Magic links, SAML, OIDC  
**Database:** PostgreSQL (via Supabase)  
**Pricing:** Free tier (500MB DB, 2GB API), paid from $25/mo

**Prós:**
- Open-source (self-host possível)
- Integração nativa com PostgreSQL
- Row Level Security (RLS) no banco
- Magic links (passwordless)
- Suporte a SAML e OIDC
- Real-time subscriptions
- API REST e GraphQL
- Menor vendor lock-in
- Preço competitivo

**Contras:**
- Ecossistema menor que Firebase
- Menos documentação que Auth0
- Self-host requer manutenção
- Cloud tier tem limitações
- Menos enterprise features
- MFA limitado (apenas TOTP)

**Best for:**
- Aplicações PostgreSQL
- Projetos open-source
- Self-hosting
- Firebase alternative
- Startups com orçamento limitado

**Implementação básica:**
```python
from supabase import create_client, Client

# Configuração
supabase: Client = create_client(
    'https://your-project.supabase.co',
    'your-anon-key'
)

# Login
def login(email, password):
    response = supabase.auth.sign_in_with_password({
        'email': email,
        'password': password
    })
    return response.session.access_token

# Verificar token
def verify_token(token):
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        raise InvalidTokenError()
```

**Features avançadas:**
```python
# Magic links
supabase.auth.sign_in_with_otp({
    'email': email
})

# Social auth
supabase.auth.sign_in_with_oauth({
    'provider': 'google'
})

# Row Level Security (SQL)
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy para usuários próprios
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

# Custom claims via JWT
-- Supabase usa JWT padrão com custom claims
```

## Comparativo detalhado

### Features

| Feature | Auth0 | Firebase Auth | Supabase Auth |
|---|---|---|---|
| Email/password | ✅ | ✅ | ✅ |
| Social auth | ✅ (20+ providers) | ✅ (Google, Facebook, Twitter, GitHub) | ✅ (10+ providers) |
| Phone auth | ✅ | ✅ | ✅ |
| Magic links | ✅ | ❌ | ✅ |
| SAML | ✅ | ❌ (requer GCP) | ✅ |
| OIDC | ✅ | ✅ | ✅ |
| MFA | ✅ (SMS, email, TOTP, push, biometria) | ⚠️ (SMS apenas) | ⚠️ (TOTP apenas) |
| Custom database | ✅ | ❌ | ✅ (PostgreSQL) |
| RLS | ❌ | ❌ | ✅ |
| Self-host | ❌ | ❌ | ✅ |
| Free tier | ✅ (7k MAU) | ✅ (Spark) | ✅ (500MB DB) |
| Pricing model | Per MAU | Usage-based | Usage-based |

### Segurança

| Feature | Auth0 | Firebase Auth | Supabase Auth |
|---|---|---|---|
| SOC2 compliance | ✅ | ✅ | ⚠️ (self-host) |
| HIPAA compliance | ✅ | ✅ | ⚠️ (self-host) |
| GDPR compliance | ✅ | ✅ | ✅ |
| Anomaly detection | ✅ | ⚠️ | ❌ |
| Breached password protection | ✅ | ❌ | ❌ |
| Custom password policies | ✅ | ⚠️ | ⚠️ |
| Audit logs | ✅ | ✅ | ✅ |

### Performance

| Metric | Auth0 | Firebase Auth | Supabase Auth |
|---|---|---|---|
| Setup time | 30-60 min | 10-20 min | 15-30 min |
| Login latency | 200-500ms | 100-300ms | 150-400ms |
| Token verification | 50-100ms | 20-50ms | 30-80ms |
| Learning curve | Medium | Low | Low-Medium |

### Customização

| Feature | Auth0 | Firebase Auth | Supabase Auth |
|---|---|---|---|
| Custom UI | ✅ | ⚠️ | ✅ |
| Custom claims | ✅ | ✅ | ✅ |
| Rules/Actions | ✅ | ⚠️ (Cloud Functions) | ⚠️ (Database triggers) |
| Webhooks | ✅ | ⚠️ (Cloud Functions) | ✅ |
| API extensibility | ✅ | ⚠️ | ✅ |

## Recomendações por caso de uso

### Enterprise applications
**Recomendado:** Auth0
- Enterprise features (SSO, AD/LDAP)
- Compliance (SOC2, HIPAA)
- Advanced MFA
- Custom database connections
- Audit logs detalhados

### Firebase applications
**Recomendado:** Firebase Authentication
- Integração nativa com Firebase
- SDKs simples
- Real-time auth state
- Phone authentication
- Free tier generoso

### PostgreSQL applications
**Recomendado:** Supabase Auth
- Row Level Security
- Integração nativa com PostgreSQL
- Open-source
- Self-host possível
- Magic links

### Open-source projects
**Recomendado:** Supabase Auth
- Open-source (MIT)
- Self-host possível
- Comunidade ativa
- Preço competitivo

### Startups com orçamento limitado
**Recomendado:** Supabase Auth
- Free tier generoso
- Preço competitivo
- Features completas
- Menor vendor lock-in

### Mobile apps
**Recomendado:** Firebase Authentication
- SDKs nativos (iOS, Android)
- Real-time auth state
- Phone authentication
- Google ecosystem integration

## Arquitetura híbrida

**Padrão recomendado:** Supabase Auth para autenticação + Custom authorization layer

**Implementação:**
```python
from supabase import create_client
import jwt

# Supabase para autenticação
supabase = create_client(url, key)

# Custom authorization layer
class AuthorizationLayer:
    def __init__(self, supabase):
        self.supabase = supabase
    
    def check_permission(self, user_id, resource, action):
        # Verificar permissões customizadas
        query = self.supabase.table('permissions').select('*').eq(
            'user_id', user_id
        ).eq('resource', resource).eq('action', action)
        
        result = query.execute()
        return len(result.data) > 0
    
    def add_permission(self, user_id, resource, action):
        self.supabase.table('permissions').insert({
            'user_id': user_id,
            'resource': resource,
            'action': action
        }).execute()
```

## Estratégia de implementação

### Fase 1: Escolha e setup
- Selecionar ferramenta baseado em caso de uso
- Criar projeto/conta
- Configurar providers de autenticação
- Implementar login básico

### Fase 2: Customização
- Configurar custom claims
- Implementar RLS (Supabase) ou Rules (Auth0)
- Configurar MFA
- Customizar UI

### Fase 3: Integração
- Integrar com aplicação
- Configurar webhooks
- Implementar refresh tokens
- Adicionar audit logging

### Fase 4: Monitoramento
- Configurar alertas
- Monitorar tentativas de login
- Detectar anomalias
- Revisar logs regularmente

## Checklist de implementação

### Para Auth0
- [ ] Criar conta Auth0
- [ ] Criar application
- [ ] Configurar providers de autenticação
- [ ] Implementar login/logout
- [ ] Configurar Rules/Actions
- [ ] Habilitar MFA
- [ ] Configurar custom database (se necessário)
- [ ] Implementar token verification
- [ ] Configurar webhooks
- [ ] Testar fluxo completo

### Para Firebase Auth
- [ ] Criar projeto Firebase
- [ ] Habilitar Authentication
- [ ] Configurar providers
- [ ] Implementar SDK
- [ ] Configurar custom claims
- [ ] Implementar token verification
- [ ] Configurar Cloud Functions (se necessário)
- [ ] Testar fluxo completo

### Para Supabase Auth
- [ ] Criar projeto Supabase
- [ ] Habilitar Authentication
- [ ] Configurar providers
- [ ] Implementar SDK
- [ ] Configurar RLS
- [ ] Implementar custom claims
- [ ] Configurar database triggers
- [ ] Testar fluxo completo

## Próximos passos

1. **Escolher ferramenta:** Selecionar baseado em caso de uso
2. **Implementar protótipo:** Criar proof-of-concept
3. **Configurar segurança:** MFA, RLS, Rules
4. **Testar fluxo:** Validar login/logout
5. **Integrar aplicação:** Conectar com sistema
6. **Monitorar:** Configurar alertas e logs

## Referências

- Auth0: https://auth0.com/docs
- Firebase Authentication: https://firebase.google.com/docs/auth
- Supabase Auth: https://supabase.com/docs/guides/auth
- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
