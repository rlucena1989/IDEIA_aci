# Auditoria de instalações locais — fontes de inspiração

**Escopo:** consulta somente leitura em 2026-08-10. Nenhuma instalação foi alterada.

## Instalações encontradas

| Produto | Local observado | Evidência |
|---|---|---|
| OmniRoute | `C:\Users\Usuario\.omniroute` e npm global | versão local 3.8.49, `package.json`, logs e SQLite |
| OpenCode | npm global e `C:\Users\Usuario\AppData\Local\Programs\@opencode-aidesktop` | CLI `opencode`, pacote `opencode-ai` 1.18.11, Desktop |
| Freebuff | `C:\Users\Usuario\AppData\Local\Programs\@codebufffreebuff-desktop` | `Freebuff.exe`, dados em AppData/Roaming/Freebuff |
| VS Code | `C:\Users\Usuario\AppData\Local\Programs\Microsoft VS Code` | `Code.exe`, CLI `code.cmd` |
| Cursor | `C:\Program Files\cursor` | `Cursor.exe`, pacote Electron/VS Code-like |
| Devin | `C:\Users\Usuario\AppData\Local\Programs\Devin` | `Devin.exe`, CLI embutida, extensão Windsurf/Devin |
| Antigravity | `C:\Users\Usuario\AppData\Local\Programs\Antigravity` e `Antigravity IDE` | executáveis, extensões e pacote IDE |

## Metadados relevantes

- OmniRoute: `MIT`, v3.8.49, Node `>=22.22.2 <23 || >=24.0.0 <27`, repositório `diegosouzapw/OmniRoute`.
- OpenCode CLI: `MIT`, v1.18.11, binário multiplataforma; instalação local via npm.
- OpenCode possui configuração local apontando para OmniRoute:
  - arquivo: `C:\Users\Usuario\AppData\Roaming\opencode\opencode.json`;
  - plugin: `@omniroute/opencode-plugin` v0.2.1;
  - base URL: `http://localhost:20128`.
- Plugin OmniRoute/OpenCode: `MIT`, testes declarados para auth, provider, multi-instance, interceptors, combos, permissões e sincronização.
- Devin Desktop: versão observada no `package.json` local: `1.110.1`; autor de distribuição: Exafunction, Inc.; contém extensão Windsurf/Devin e CLI/ACP documentada localmente.
- Antigravity IDE: versão observada: `1.107.0`; autor: Google; contém extensões de agente, executor, devcontainers, OpenSSH e WSL.
- VS Code e Cursor: componentes Electron/Code OSS e extensões; a aplicação completa é proprietária/redistribuída sob termos próprios. Não copiar binários ou código proprietário.

## Padrões reutilizáveis

### 1. Gateway local OpenAI-compatible
OmniRoute centraliza providers e permite clientes independentes. Aplicação para IDEIA: `ProviderAdapter` + endpoint compatível, sem acoplar agentes à UI.

### 2. Plugin de provider
O plugin OpenCode/OpenRoute separa descoberta, auth, providers e configuração. Aplicação: contratos de plugin versionados e schemas Zod/JSON.

### 3. Configuração declarativa
OpenCode usa configuração JSON para registrar plugins e base URL. Aplicação: configuração por projeto, validada e sem secrets em texto plano.

### 4. Multi-surface
OpenCode, Freebuff, Devin e Antigravity possuem CLI/desktop/IDE/web ou combinações. Aplicação: core único e clientes finos.

### 5. Worktree e workspace
Devin/Antigravity expõem isolamento por projeto/worktree. Aplicação: branch/worktree por tarefa antes de multiagentes.

### 6. Extensões Code OSS
VS Code, Cursor, Devin e Antigravity mostram o valor de editor compatível com extensões. Aplicação: extensão VS Code antes de IDE própria.

### 7. CLI embutida
Devin possui CLI instalada junto do desktop; OpenCode e OmniRoute têm CLIs próprias. Aplicação: comandos headless compartilhando o mesmo core.

### 8. Testes de integração de plugin
O plugin OmniRoute declara testes específicos de auth, schema, provider, múltiplas instâncias e permissões. Aplicação: cada adapter da IDEIA deve ter contract tests.

## Não copiar
- binários instalados;
- código proprietário de Cursor, Devin, Antigravity ou VS Code distribuído;
- dados de usuário, tokens, cookies, logs privados e bases locais;
- prompts, modelos ou assets sem licença explícita.

## Referências locais consultadas
- `C:\Users\Usuario\AppData\Roaming\npm\node_modules\omniroute\package.json`
- `C:\Users\Usuario\AppData\Roaming\npm\node_modules\opencode-ai\package.json`
- `C:\Users\Usuario\AppData\Roaming\opencode\opencode.json`
- `C:\Users\Usuario\AppData\Roaming\opencode\plugins\omniroute\package.json`
- `C:\Users\Usuario\AppData\Local\Programs\Devin\resources\app\package.json`
- `C:\Users\Usuario\AppData\Local\Programs\Antigravity IDE\resources\app\package.json`
