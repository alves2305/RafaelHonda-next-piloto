Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section {
  param([Parameter(Mandatory = $true)][string]$Text)

  Write-Host ""
  Write-Host "============================================================" -ForegroundColor DarkGray
  Write-Host $Text -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor DarkGray
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @(),
    [Parameter(Mandatory = $true)][string]$ErrorMessage
  )

  & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "$ErrorMessage Codigo de saida: $LASTEXITCODE."
  }
}

function Get-CommandText {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @()
  )

  $result = & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: $Command $($Arguments -join ' ')"
  }

  return ($result | Out-String).Trim()
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $projectRoot

Write-Section "ENTREGA 19.1 - PONTO DE RESTAURACAO v1.0.0"
Write-Host "Projeto: $projectRoot"

if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
  throw "package.json nao encontrado. Extraia o pacote dentro da pasta principal do projeto."
}

if (-not (Test-Path (Join-Path $projectRoot ".git"))) {
  throw "A pasta atual nao e um repositorio Git. A pasta .git nao foi encontrada."
}

$currentBranch = Get-CommandText -Command "git" -Arguments @("branch", "--show-current")

if ($currentBranch -ne "main") {
  throw "A branch atual e '$currentBranch'. Volte para a main antes de criar a versao estavel."
}

$originUrl = Get-CommandText -Command "git" -Arguments @("remote", "get-url", "origin")
Write-Host "Repositorio remoto: $originUrl"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$projectParent = Split-Path $projectRoot -Parent
$backupDirectory = Join-Path $projectParent "backups-catalogo-honda"
$tempDirectory = Join-Path $env:TEMP "catalogo-honda-pre-v1-$timestamp"
$preReleaseZip = Join-Path $backupDirectory "pre-v1.0.0-working-tree-$timestamp.zip"

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

Write-Section "1. BACKUP DE EMERGENCIA DO ESTADO ATUAL"
Write-Host "Criando uma copia antes de alterar versao, commit ou tag..."
Write-Host "Arquivos .env, .git, node_modules e .next nao serao copiados."

if (Test-Path $tempDirectory) {
  Remove-Item -Recurse -Force $tempDirectory
}

New-Item -ItemType Directory -Force -Path $tempDirectory | Out-Null

$robocopyArguments = @(
  $projectRoot,
  $tempDirectory,
  "/E",
  "/XD",
  ".git",
  "node_modules",
  ".next",
  "/XF",
  ".env",
  ".env.*",
  "/R:1",
  "/W:1",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NP"
)

& robocopy @robocopyArguments
$robocopyExitCode = $LASTEXITCODE

if ($robocopyExitCode -ge 8) {
  throw "O backup de emergencia falhou. Codigo do Robocopy: $robocopyExitCode."
}

$global:LASTEXITCODE = 0

if (Test-Path $preReleaseZip) {
  Remove-Item -Force $preReleaseZip
}

Compress-Archive -Path (Join-Path $tempDirectory "*") -DestinationPath $preReleaseZip -CompressionLevel Optimal
Remove-Item -Recurse -Force $tempDirectory

Write-Host "Backup de emergencia criado:" -ForegroundColor Green
Write-Host $preReleaseZip

Write-Section "2. DOCUMENTACAO DA VERSAO ESTAVEL"

$docsDirectory = Join-Path $projectRoot "docs"
$releaseDocsDirectory = Join-Path $docsDirectory "releases"

New-Item -ItemType Directory -Force -Path $releaseDocsDirectory | Out-Null

$prototypeStatus = if (Test-Path (Join-Path $projectRoot "app\cliente-demo")) {
  "Incluido como prototipo visual isolado, sem autenticacao real e sem gravacao no Supabase."
} else {
  "Nao esta presente nesta copia do projeto."
}

$releaseDocument = @"
# Catalogo Honda - versao 1.0.0

Data da estabilizacao: $(Get-Date -Format "dd/MM/yyyy")

## Estado desta versao

Esta versao representa o ponto de restauracao estavel anterior a implementacao
real do painel dos vendedores, pagamentos, cookies analiticos e bloqueios
financeiros automaticos.

## Recursos protegidos

- catalogos publicos por vendedor;
- perfis personalizados;
- clientes Rafael Honda e GD Honda;
- bloqueio e reativacao manual;
- catalogo central de motos;
- selecao de motos por vendedor;
- planos de consorcio centralizados;
- financiamentos centralizados;
- imagens e enquadramentos mobile e desktop;
- painel administrativo;
- autenticacao administrativa;
- politicas RLS ja existentes;
- otimizacoes de desempenho e cache;
- paginas de consorcio e financiamento.

## Prototipo do painel do vendedor

$prototypeStatus

## Recursos ainda nao considerados producao nesta versao

- login real dos vendedores;
- permissoes RLS individuais para vendedores;
- pagamentos reais;
- Pix e cartao;
- webhooks;
- bloqueio automatico por inadimplencia;
- metricas de visitas e motos mais acessadas;
- consentimento de cookies analiticos.

## Restauracao

A referencia principal desta versao e a tag:

TEXT
v1.0.0


Para abrir uma copia segura da versao sem alterar a main:

POWERSHELL
git switch -c restauracao/v1.0.0 v1.0.0
npm ci
npm run typecheck
npm run lint
npm run build


Nao utilize git reset --hard ou git push --force sem revisar os dados e o
estado do repositorio.
"@

Set-Content `
  -Path (Join-Path $releaseDocsDirectory "v1.0.0.md") `
  -Value $releaseDocument `
  -Encoding utf8

$environmentDocument = @"
# Variaveis de ambiente

A aplicacao utiliza as seguintes variaveis publicas:

ENV
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=


Os valores reais permanecem somente em:

- .env.local no computador;
- configuracoes de Environment Variables da Vercel.

Nunca coloque chaves reais em documentos, commits, prints ou arquivos enviados
para terceiros.

Antes de uma restauracao, confirme que as duas variaveis continuam cadastradas
na Vercel para Production, Preview e Development conforme necessario.
"@

Set-Content `
  -Path (Join-Path $docsDirectory "variaveis-ambiente.md") `
  -Value $environmentDocument `
  -Encoding utf8

Write-Host "Documentacao criada em docs/releases e docs/variaveis-ambiente.md." -ForegroundColor Green

Write-Section "3. ATUALIZACAO DO NUMERO DA VERSAO"

$packageJsonPath = Join-Path $projectRoot "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

if ($packageJson.version -ne "1.0.0") {
  Invoke-CheckedCommand `
    -Command "npm" `
    -Arguments @("version", "1.0.0", "--no-git-tag-version") `
    -ErrorMessage "Nao foi possivel atualizar package.json e package-lock.json para 1.0.0."

  Write-Host "Versao atualizada para 1.0.0." -ForegroundColor Green
} else {
  Write-Host "O projeto ja esta marcado como 1.0.0."
}

Write-Section "4. TESTES OBRIGATORIOS"

Invoke-CheckedCommand `
  -Command "npm" `
  -Arguments @("run", "typecheck") `
  -ErrorMessage "O typecheck encontrou um problema. Nenhum commit ou tag foi criado."

Invoke-CheckedCommand `
  -Command "npm" `
  -Arguments @("run", "lint") `
  -ErrorMessage "O lint encontrou um problema. Nenhum commit ou tag foi criado."

Invoke-CheckedCommand `
  -Command "npm" `
  -Arguments @("run", "build") `
  -ErrorMessage "O build encontrou um problema. Nenhum commit ou tag foi criado."

Write-Host "Typecheck, lint e build aprovados." -ForegroundColor Green

Write-Section "5. COMMIT DA VERSAO ESTAVEL"

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("add", "-A") `
  -ErrorMessage "Nao foi possivel preparar os arquivos para o commit."

& git diff --cached --quiet
$stagedDiffExitCode = $LASTEXITCODE
$global:LASTEXITCODE = 0

if ($stagedDiffExitCode -eq 1) {
  Invoke-CheckedCommand `
    -Command "git" `
    -Arguments @("commit", "-m", "Estabiliza versao 1.0.0") `
    -ErrorMessage "Nao foi possivel criar o commit da versao estavel."
} elseif ($stagedDiffExitCode -eq 0) {
  Write-Host "Nao existem alteracoes novas. A tag sera criada no commit atual."
} else {
  throw "Nao foi possivel verificar as alteracoes preparadas para commit."
}

$stableCommit = Get-CommandText -Command "git" -Arguments @("rev-parse", "HEAD")
Write-Host "Commit estavel: $stableCommit" -ForegroundColor Green

Write-Section "6. TAG v1.0.0"

$existingTag = (& git tag --list "v1.0.0" | Out-String).Trim()

if ($existingTag) {
  throw "A tag v1.0.0 ja existe. Nao foi criada uma segunda tag."
}

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @(
    "tag",
    "-a",
    "v1.0.0",
    "-m",
    "Versao estavel do Catalogo Honda antes do painel real dos vendedores"
  ) `
  -ErrorMessage "Nao foi possivel criar a tag v1.0.0."

Write-Host "Tag v1.0.0 criada." -ForegroundColor Green

Write-Section "7. ENVIO DA MAIN E DA TAG AO GITHUB"

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("push", "origin", "main") `
  -ErrorMessage "Nao foi possivel enviar a main ao GitHub."

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("push", "origin", "v1.0.0") `
  -ErrorMessage "Nao foi possivel enviar a tag v1.0.0 ao GitHub."

Write-Host "Main e tag enviadas ao GitHub." -ForegroundColor Green

Write-Section "8. BRANCH DO PAINEL DOS CLIENTES"

$featureBranch = "feature/painel-clientes"

& git show-ref --verify --quiet "refs/heads/$featureBranch"
$localBranchExitCode = $LASTEXITCODE
$global:LASTEXITCODE = 0

if ($localBranchExitCode -eq 0) {
  Invoke-CheckedCommand `
    -Command "git" `
    -Arguments @("switch", $featureBranch) `
    -ErrorMessage "Nao foi possivel abrir a branch $featureBranch."
} else {
  & git ls-remote --exit-code --heads origin $featureBranch | Out-Null
  $remoteBranchExitCode = $LASTEXITCODE
  $global:LASTEXITCODE = 0

  if ($remoteBranchExitCode -eq 0) {
    Invoke-CheckedCommand `
      -Command "git" `
      -Arguments @("fetch", "origin", $featureBranch) `
      -ErrorMessage "Nao foi possivel baixar a branch remota."

    Invoke-CheckedCommand `
      -Command "git" `
      -Arguments @("switch", "-c", $featureBranch, "--track", "origin/$featureBranch") `
      -ErrorMessage "Nao foi possivel criar a branch local acompanhando a branch remota."
  } else {
    Invoke-CheckedCommand `
      -Command "git" `
      -Arguments @("switch", "-c", $featureBranch, "v1.0.0") `
      -ErrorMessage "Nao foi possivel criar a branch $featureBranch."
  }
}

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("push", "-u", "origin", $featureBranch) `
  -ErrorMessage "Nao foi possivel enviar a branch do painel dos clientes ao GitHub."

Write-Host "Branch ativa: $featureBranch" -ForegroundColor Green

Write-Section "9. BACKUPS DEFINITIVOS"

$sourceZip = Join-Path $backupDirectory "catalogo-honda-v1.0.0-codigo.zip"
$repositoryBundle = Join-Path $backupDirectory "catalogo-honda-v1.0.0-repositorio.bundle"

if (Test-Path $sourceZip) {
  Remove-Item -Force $sourceZip
}

if (Test-Path $repositoryBundle) {
  Remove-Item -Force $repositoryBundle
}

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("archive", "--format=zip", "--output=$sourceZip", "v1.0.0") `
  -ErrorMessage "Nao foi possivel criar o ZIP definitivo da versao."

Invoke-CheckedCommand `
  -Command "git" `
  -Arguments @("bundle", "create", $repositoryBundle, "--all") `
  -ErrorMessage "Nao foi possivel criar o backup completo do repositorio."

Write-Host "Codigo da versao:" -ForegroundColor Green
Write-Host $sourceZip
Write-Host ""
Write-Host "Historico completo, branches e tags:" -ForegroundColor Green
Write-Host $repositoryBundle

Write-Section "PROCESSO CONCLUIDO"

Write-Host "Versao estavel: v1.0.0" -ForegroundColor Green
Write-Host "Commit: $stableCommit"
Write-Host "Branch de desenvolvimento: $featureBranch"
Write-Host "Backups: $backupDirectory"
Write-Host ""
Write-Host "O proximo desenvolvimento deve acontecer nesta branch."
Write-Host ""

git status --short --branch
