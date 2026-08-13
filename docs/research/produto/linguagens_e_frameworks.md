# Linguagens e frameworks

## Matriz de prioridade
| Tecnologia | Prioridade | Ferramentas | Riscos |
|---|---|---|---|
| TypeScript/JavaScript | Alta | tsserver, ESLint, npm, Jest | monorepos |
| Python | Alta | Pyright, Ruff, pytest, uv/pip | ambientes |
| Java/Kotlin | Média | JDTLS/Kotlin LSP, Maven/Gradle, JUnit | build lento |
| C#/.NET | Média | OmniSharp/Roslyn, dotnet, xUnit | Windows/licença |
| Go | Média | gopls, go test, modules | concorrência |
| Rust | Média | rust-analyzer, cargo test | curva |
| SQL/Shell/YAML/Markdown | Alta | parsers, runners, linters | efeitos externos |
| PHP/Ruby/Swift/C/C++ | Baixa inicial | LSP/toolchains nativos | toolchains diversos |
| Terraform | Média | terraform, tflint, checkov | custo cloud |

## Frameworks
Priorizar React, Next.js, Node.js, Express/NestJS, FastAPI/Django, Spring, .NET. Vue/Angular, Flask, Laravel/Rails, Flutter/React Native na versão 1 conforme demanda.

## Regra
Suporte significa: parser/LSP, descoberta de dependências, runner, formatter/linter, templates e testes. Não prometer geração confiável sem benchmark por stack.
