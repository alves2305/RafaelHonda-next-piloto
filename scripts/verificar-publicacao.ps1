$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host ""
Write-Host "VerificaÃ§Ã£o final do CatÃ¡logo Honda" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

$failures =
  New-Object System.Collections.Generic.List[string]

function Test-RequiredFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $fullPath =
    Join-Path $projectRoot $RelativePath

  if (Test-Path $fullPath) {
    Write-Host "OK   $RelativePath" -ForegroundColor Green
  } else {
    Write-Host "ERRO $RelativePath" -ForegroundColor Red
    $failures.Add(
      "Arquivo obrigatÃ³rio ausente: $RelativePath"
    )
  }
}

function Test-LegacyRouteLiteral {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,

    [Parameter(Mandatory = $true)]
    [string]$Route
  )

  $doubleQuoted = '"' + $Route + '"'
  $singleQuoted = "'" + $Route + "'"

  return (
    $Content.Contains($doubleQuoted) -or
    $Content.Contains($singleQuoted)
  )
}

$requiredFiles = @(
  "app\painel\login\page.tsx",
  "app\painel\(protegido)\page.tsx",
  "app\painel\(protegido)\layout.tsx",
  "app\painel\(protegido)\assinatura\page.tsx",
  "components\client-demo\ClientPanelLogin.tsx",
  "components\client-demo\ClientPanelDashboard.tsx",
  "components\client-demo\ClientPanelSubscription.tsx",
  "components\client-demo\ClientAccessGuard.tsx",
  "components\client-demo\ClientLogoutButton.tsx",
  "docs\checklist-publicacao-painel-vendedor.md"
)

foreach ($file in $requiredFiles) {
  Test-RequiredFile $file
}

$trackedFiles = @(git ls-files)

$forbiddenPatterns = @(
  '\.backup-',
  '^instalar-entrega-.*\.ps1$',
  '^correcao-.*\.ps1$',
  '^preparar-entrega-.*\.ps1$',
  '^verificar-entrega-.*\.ps1$',
  '^LEIA-ME-ENTREGA-.*\.txt$',
  '^LEIA-ME-CORRECAO-.*\.txt$'
)

foreach ($trackedFile in $trackedFiles) {
  $physicalPath =
    Join-Path $projectRoot $trackedFile

  if (-not (Test-Path $physicalPath)) {
    continue
  }

  foreach ($pattern in $forbiddenPatterns) {
    if ($trackedFile -match $pattern) {
      $failures.Add(
        "Arquivo temporÃ¡rio ainda presente: $trackedFile"
      )
    }
  }
}

$envTracked =
  $trackedFiles |
    Where-Object {
      $_ -in @(
        ".env",
        ".env.local",
        ".env.production",
        ".env.development"
      )
    }

foreach ($envFile in $envTracked) {
  $failures.Add(
    "Arquivo de ambiente rastreado: $envFile"
  )
}

$componentChecks = @(
  @{
    Path = "components\client-demo\ClientPanelLogin.tsx"
    Routes = @(
      "/cliente-demo/login",
      "/cliente-demo/dashboard",
      "/cliente-demo/assinatura"
    )
  },
  @{
    Path = "components\client-demo\ClientPanelDashboard.tsx"
    Routes = @(
      "/cliente-demo/login",
      "/cliente-demo/dashboard",
      "/cliente-demo/assinatura"
    )
  },
  @{
    Path = "components\client-demo\ClientPanelSubscription.tsx"
    Routes = @(
      "/cliente-demo/login",
      "/cliente-demo/dashboard",
      "/cliente-demo/assinatura"
    )
  },
  @{
    Path = "components\client-demo\ClientAccessGuard.tsx"
    Routes = @(
      "/cliente-demo/login"
    )
  },
  @{
    Path = "components\client-demo\ClientLogoutButton.tsx"
    Routes = @(
      "/cliente-demo/login"
    )
  }
)

foreach ($check in $componentChecks) {
  $fullPath =
    Join-Path $projectRoot $check.Path

  if (-not (Test-Path $fullPath)) {
    continue
  }

  $content =
    [System.IO.File]::ReadAllText($fullPath)

  foreach ($route in $check.Routes) {
    if (
      Test-LegacyRouteLiteral `
        -Content $content `
        -Route $route
    ) {
      $failures.Add(
        "Rota antiga encontrada em $($check.Path): $route"
      )
    }
  }
}

$dashboardPath =
  Join-Path `
    $projectRoot `
    "components\client-demo\ClientPanelDashboard.tsx"

$subscriptionPath =
  Join-Path `
    $projectRoot `
    "components\client-demo\ClientPanelSubscription.tsx"

if (Test-Path $dashboardPath) {
  $dashboard =
    [System.IO.File]::ReadAllText($dashboardPath)

  if (
    $dashboard.Contains(
      '@/app/painel/client-panel-data.module.css'
    )
  ) {
    $failures.Add(
      "Import incorreto do CSS do painel ainda presente."
    )
  }

  if (
    -not $dashboard.Contains(
      '@/app/cliente-demo/dashboard/client-panel-data.module.css'
    )
  ) {
    $failures.Add(
      "Import correto do CSS do painel nÃ£o foi encontrado."
    )
  }
}

if (Test-Path $subscriptionPath) {
  $subscription =
    [System.IO.File]::ReadAllText($subscriptionPath)

  if (
    $subscription.Contains(
      '@/app/painel/assinatura/subscription-real.module.css'
    )
  ) {
    $failures.Add(
      "Import incorreto do CSS da assinatura ainda presente."
    )
  }

  if (
    -not $subscription.Contains(
      '@/app/cliente-demo/assinatura/subscription-real.module.css'
    )
  ) {
    $failures.Add(
      "Import correto do CSS da assinatura nÃ£o foi encontrado."
    )
  }
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "A verificaÃ§Ã£o estrutural encontrou problemas:" -ForegroundColor Red

  $failures |
    Sort-Object -Unique |
    ForEach-Object {
      Write-Host "- $_" -ForegroundColor Red
    }

  exit 1
}

Write-Host ""
Write-Host "Estrutura e limpeza: OK" -ForegroundColor Green
Write-Host ""
Write-Host "Executando typecheck..." -ForegroundColor Cyan
npm.cmd run typecheck

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Executando lint..." -ForegroundColor Cyan
npm.cmd run lint

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Executando build..." -ForegroundColor Cyan
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "VerificaÃ§Ã£o final concluÃ­da com sucesso." -ForegroundColor Green
Write-Host ""
Write-Host "AlteraÃ§Ãµes prontas para o commit:" -ForegroundColor Cyan
git status --short