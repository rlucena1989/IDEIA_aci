# Integrações Prioritárias para Primeiros Usuários

**Data:** 11 de agosto de 2026  
**Status:** Documentação de estratégia  
**Objetivo:** Definir integrações prioritárias para primeiros usuários da plataforma IDEIA

## Visão geral

Primeiros usuários precisam de integrações que reduzam fricção e aumentem produtividade imediatamente. Integrações devem ser fáceis de configurar, amplamente usadas e oferecer valor claro.

## Integrações prioritárias

### 1. GitHub (Essencial)

**Prioridade:** Alta  
**Complexidade:** Baixa  
**Valor:** Alto

**Funcionalidades:**
- Clonar repositórios
- Criar branches
- Commit e push
- Pull requests
- Issue tracking
- Code review

**Implementação:**
```javascript
const { Octokit } = require('@octokit/rest');

class GitHubIntegration {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }
  
  async cloneRepo(owner, repo) {
    const { data } = await this.octokit.repos.get({
      owner,
      repo
    });
    
    return {
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch
    };
  }
  
  async createBranch(owner, repo, branchName) {
    const { data } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch: 'main'
    });
    
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: data.commit.sha
    });
  }
  
  async createPR(owner, repo, title, head, base) {
    const { data } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base
    });
    
    return data;
  }
}
```

**Configuração:**
- Token de acesso pessoal (PAT)
- Escopo: repo, gist, workflow

### 2. GitLab (Essencial)

**Prioridade:** Alta  
**Complexidade:** Baixa  
**Valor:** Alto

**Funcionalidades:**
- Clonar repositórios
- Criar branches
- Commit e push
- Merge requests
- Issue tracking
- CI/CD

**Implementação:**
```javascript
const { Gitlab } = require('@gitbeaker/node');

class GitLabIntegration {
  constructor(token, url) {
    this.api = new Gitlab({
      token,
      host: url
    });
  }
  
  async cloneRepo(projectId) {
    const project = await this.api.Projects.show(projectId);
    
    return {
      cloneUrl: project.http_url_to_repo,
      defaultBranch: project.default_branch
    };
  }
  
  async createBranch(projectId, branchName, ref) {
    await this.api.Branches.create(projectId, branchName, ref);
  }
  
  async createMR(projectId, source, target, title) {
    const mr = await this.api.MergeRequests.create(projectId, source, target, title);
    
    return mr;
  }
}
```

**Configuração:**
- Token de acesso pessoal
- URL do GitLab (self-hosted ou gitlab.com)

### 3. VS Code (Essencial)

**Prioridade:** Alta  
**Complexidade:** Média  
**Valor:** Alto

**Funcionalidades:**
- Extensão de IDE
- Autocomplete assistido por IA
- Refatoração automática
- Geração de testes
- Documentação automática

**Implementação:**
```typescript
import * as vscode from 'vscode';

class IDEIAExtension implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  
  activate(context: vscode.ExtensionContext) {
    // Registrar comando de autocomplete
    const autocompleteCommand = vscode.commands.registerCommand(
      'ideia.autocomplete',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        const position = editor.selection.active;
        
        // Chamar API do IDEIA
        const suggestion = await this.getSuggestion(document, position);
        
        // Inserir sugestão
        editor.edit(editBuilder => {
          editBuilder.insert(position, suggestion);
        });
      }
    );
    
    this.disposables.push(autocompleteCommand);
  }
  
  async getSuggestion(document: vscode.TextDocument, position: vscode.Position) {
    // Implementar chamada à API do IDEIA
    return '';
  }
  
  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
```

**Configuração:**
- API key do IDEIA
- Endpoint da API

### 4. Jira (Importante)

**Prioridade:** Média  
**Complexidade:** Média  
**Valor:** Médio

**Funcionalidades:**
- Criar tickets
- Atualizar status
- Adicionar comentários
- Anexar arquivos
- Integrar com commits

**Implementação:**
```javascript
const axios = require('axios');

class JiraIntegration {
  constructor(baseUrl, email, apiToken) {
    this.baseUrl = baseUrl;
    this.email = email;
    this.apiToken = apiToken;
  }
  
  async createIssue(projectKey, summary, description) {
    const response = await axios.post(
      `${this.baseUrl}/rest/api/3/issue`,
      {
        fields: {
          project: { key: projectKey },
          summary,
          description,
          issuetype: { name: 'Task' }
        }
      },
      {
        auth: {
          username: this.email,
          password: this.apiToken
        }
      }
    );
    
    return response.data;
  }
  
  async updateIssue(issueId, status) {
    const response = await axios.put(
      `${this.baseUrl}/rest/api/3/issue/${issueId}`,
      {
        fields: {
          status: { name: status }
        }
      },
      {
        auth: {
          username: this.email,
          password: this.apiToken
        }
      }
    );
    
    return response.data;
  }
}
```

**Configuração:**
- URL do Jira
- Email
- API token

### 5. Slack (Importante)

**Prioridade:** Média  
**Complexidade:** Baixa  
**Valor:** Médio

**Funcionalidades:**
- Notificações de build
- Alertas de erro
- Resumo de commits
- Interação com bot

**Implementação:**
```javascript
const axios = require('axios');

class SlackIntegration {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }
  
  async sendMessage(message, channel) {
    await axios.post(this.webhookUrl, {
      text: message,
      channel
    });
  }
  
  async sendBuildNotification(buildStatus, repo, branch) {
    const message = `Build ${buildStatus}: ${repo}#${branch}`;
    await this.sendMessage(message, '#builds');
  }
}
```

**Configuração:**
- Webhook URL do Slack

### 6. Docker (Importante)

**Prioridade:** Média  
**Complexidade:** Média  
**Valor:** Médio

**Funcionalidades:**
- Gerar Dockerfile
- Gerar docker-compose
- Otimizar imagens
- Gerenciar containers

**Implementação:**
```javascript
class DockerIntegration {
  generateDockerfile(runtime, dependencies) {
    const dockerfile = `FROM ${runtime}
    
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
    
    return dockerfile;
  }
  
  generateDockerCompose(services) {
    const compose = {
      version: '3.8',
      services: {}
    };
    
    for (const service of services) {
      compose.services[service.name] = {
        build: service.build,
        ports: service.ports,
        environment: service.environment
      };
    }
    
    return compose;
  }
}
```

**Configuração:**
- Docker instalado
- Acesso ao Docker daemon

### 7. npm/yarn (Importante)

**Prioridade:** Média  
**Complexidade:** Baixa  
**Valor:** Médio

**Funcionalidades:**
- Gerar package.json
- Gerenciar dependências
- Executar scripts
- Publicar pacotes

**Implementação:**
```javascript
const { execSync } = require('child_process');

class NpmIntegration {
  initPackageJson(name, version) {
    const packageJson = {
      name,
      version,
      description: '',
      main: 'index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'MIT'
    };
    
    return JSON.stringify(packageJson, null, 2);
  }
  
  installDependencies(dependencies) {
    execSync(`npm install ${dependencies.join(' ')}`);
  }
  
  runScript(scriptName) {
    execSync(`npm run ${scriptName}`);
  }
}
```

**Configuração:**
- npm ou yarn instalado

### 8. AWS (Opcional)

**Prioridade:** Baixa  
**Complexidade:** Alta  
**Valor:** Alto

**Funcionalidades:**
- Gerar CloudFormation
- Gerar Terraform
- Gerenciar recursos
- Deploy de aplicações

**Implementação:**
```javascript
const AWS = require('aws-sdk');

class AWSIntegration {
  constructor(region, accessKeyId, secretAccessKey) {
    this.ec2 = new AWS.EC2({
      region,
      accessKeyId,
      secretAccessKey
    });
  }
  
  async createInstance(imageId, instanceType) {
    const params = {
      ImageId: imageId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1
    };
    
    const result = await this.ec2.runInstances(params).promise();
    return result.Instances[0];
  }
}
```

**Configuração:**
- AWS credentials
- Region

## Roadmap de integrações

### Fase 1 (MVP - 1-2 meses)
- GitHub (essencial)
- GitLab (essencial)
- VS Code (essencial)

### Fase 2 (V1 - 3-4 meses)
- Jira (importante)
- Slack (importante)
- Docker (importante)
- npm/yarn (importante)

### Fase 3 (V2 - 5-6 meses)
- AWS (opcional)
- Azure (opcional)
- Google Cloud (opcional)
- Kubernetes (opcional)

## Próximos passos

1. **Implementar GitHub:** Criar integração com GitHub
2. **Implementar GitLab:** Criar integração com GitLab
3. **Implementar VS Code:** Criar extensão de VS Code
4. **Documentar integrações:** Criar guias de configuração
5. **Testar integrações:** Validar funcionalidades
6. **Coletar feedback:** Obter feedback de usuários

## Referências

- GitHub API: https://docs.github.com/en/rest
- GitLab API: https://docs.gitlab.com/ee/api/
- VS Code API: https://code.visualstudio.com/api
- Jira API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- Slack API: https://api.slack.com/
- Docker API: https://docs.docker.com/engine/api/
