[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error 'Git nao foi encontrado no PATH.'
    exit 2
}

$repositoryRoot = (git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repositoryRoot)) {
    Write-Error 'O verificador deve ser executado dentro de um repositorio Git.'
    exit 2
}

Set-Location -LiteralPath $repositoryRoot

$stagedFiles = @(git diff --cached --name-only --diff-filter=ACMR --)
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Nao foi possivel listar os arquivos preparados para commit.'
    exit 2
}

$excludedScannerPaths = @(
    '.githooks/pre-commit',
    'scripts/security/scan-staged-secrets.ps1'
)

$forbiddenPathPatterns = @(
    '(?i)(^|/)\.env($|\.)',
    '(?i)(^|/)\.npmrc$',
    '(?i)(^|/)\.pypirc$',
    '(?i)(^|/)\.netrc$',
    '(?i)\.(pem|key|p12|pfx|jks|keystore)$',
    '(?i)(^|/)(id_rsa|id_ed25519)$',
    '(?i)(^|/)(credentials|secrets)\.json$'
)

$secretPatterns = @(
    @{ Name = 'chave privada'; Regex = '-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----' },
    @{ Name = 'token GitHub'; Regex = '(?i)\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b' },
    @{ Name = 'access key AWS'; Regex = '\b(?:AKIA|ASIA)[0-9A-Z]{16}\b' },
    @{ Name = 'chave Google API'; Regex = '\bAIza[0-9A-Za-z_-]{30,}\b' },
    @{ Name = 'chave OpenAI-style'; Regex = '\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b' },
    @{ Name = 'token Slack'; Regex = '\bxox[baprs]-[A-Za-z0-9-]{20,}\b' },
    @{ Name = 'Bearer token literal'; Regex = '(?i)\bAuthorization\s*[:=]\s*["''`]?Bearer\s+[A-Za-z0-9._~-]{12,}' }
)

$assignedCredentialPattern = [regex]'(?i)\b(?:api[_-]?key|client[_-]?secret|secret|token|password|passwd)\s*[:=]\s*["''`](?<value>[^"''`\s]{8,})["''`]'
$obviousPlaceholderPattern = [regex]'(?i)^(?:your(?:[-_][a-z0-9]+)+|test(?:[-_][a-z0-9]+)*|example(?:[-_][a-z0-9]+)*|sample(?:[-_][a-z0-9]+)*|dummy(?:[-_][a-z0-9]+)*|fake(?:[-_][a-z0-9]+)*|x{4,}|<[^>]+>)$'

# Fixtures curtas e sem formato de token operacional, revisadas em 2026-08-13.
# A aprovacao vincula caminho + SHA-256 do valor sem publicar o literal.
$approvedFixtureHashes = @{
    'docs/research/llm_provider_integration.md' = @(
        'dda59792fb6824cc0ee170a9202eb02bd83dacac5ccfa96ba0e8954c5b9246a6'
    )
    'packages/config-engine/__tests__/config-manager.test.ts' = @(
        '3eeee45940fdb39d8e3b5707b5dccbd43909635096c5135b7ea561ba08549a19'
    )
}

function Get-Sha256Hex {
    param([Parameter(Mandatory)][string]$Value)

    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        return [System.BitConverter]::ToString($hasher.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hasher.Dispose()
    }
}

$findings = [System.Collections.Generic.List[string]]::new()

foreach ($path in $stagedFiles) {
    $normalizedPath = $path.Replace('\', '/')

    if ($normalizedPath -notmatch '(?i)\.env\.([^.]+\.)?example$') {
        foreach ($pattern in $forbiddenPathPatterns) {
            if ($normalizedPath -match $pattern) {
                $findings.Add("arquivo sensível: $normalizedPath")
                break
            }
        }
    }

    if ($excludedScannerPaths -contains $normalizedPath) {
        continue
    }

    $diffLines = @(git diff --cached --no-ext-diff --unified=0 --no-color -- $path)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Nao foi possivel examinar o diff preparado de: $normalizedPath"
        exit 2
    }

    foreach ($line in $diffLines) {
        if ($line -notmatch '^\+(?!\+\+)') {
            continue
        }

        if ($line -match '(?i)secret-scan:\s*allow') {
            continue
        }

        $genericSecretFound = $false
        foreach ($pattern in $secretPatterns) {
            if ($line -match $pattern.Regex) {
                $findings.Add("$($pattern.Name): $normalizedPath")
                $genericSecretFound = $true
                break
            }
        }

        if ($genericSecretFound) {
            continue
        }

        foreach ($match in $assignedCredentialPattern.Matches($line)) {
            $candidate = $match.Groups['value'].Value
            if ($obviousPlaceholderPattern.IsMatch($candidate)) {
                continue
            }

            $candidateHash = Get-Sha256Hex -Value $candidate
            $approvedForPath = @($approvedFixtureHashes[$normalizedPath])
            if ($approvedForPath -contains $candidateHash) {
                continue
            }

            $findings.Add("credencial atribuida: $normalizedPath")
            break
        }
    }
}

if ($findings.Count -gt 0) {
    Write-Host 'Commit bloqueado: possivel material sensivel detectado.' -ForegroundColor Red
    $findings | Sort-Object -Unique | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Yellow
    }
    Write-Host 'Remova o segredo do conteudo e do indice antes de tentar novamente.'
    Write-Host 'Use "secret-scan: allow" apenas para fixtures publicas revisadas manualmente.'
    exit 1
}

Write-Host 'Verificacao de segredos staged: OK.' -ForegroundColor Green
exit 0
