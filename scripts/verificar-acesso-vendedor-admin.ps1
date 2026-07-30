$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host ""
Write-Host "Verificação da Entrega 19.11" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

$failures =
  New-Object System.Collections.Generic.List[string]

$requiredFiles = @(
  "lib\supabase-service.ts",
  "lib\admin-request-auth.ts",
  "app\api\admin\clientes\[id]\acesso\route.ts",
  "app\admin\clientes\[id]\acesso\page.tsx",
  "app\admin\clientes\[id]\acesso\access.module.css",
  "docs\entrega-19-11-acesso-vendedor-admin.md"
)

foreach ($relativePath in $requiredFiles) {
  $fullPath = Join-Path $projectRoot $relativePath

  if (Test-Path -LiteralPath $fullPath) {
    Write-Host "OK   $relativePath" -ForegroundColor Green
  } else {
    Write-Host "ERRO $relativePath" -ForegroundColor Red
    $failures.Add("Arquivo ausente: $relativePath")
  }
}

$envExamplePath = Join-Path $projectRoot ".env.example"

if (-not (Test-Path $envExamplePath)) {
  $failures.Add("Arquivo ausente: .env.example")
} else {
  $envExample = [System.IO.File]::ReadAllText($envExamplePath)

  if (
    -not $envExample.Contains("SUPABASE_SECRET_KEY") -and
    -not $envExample.Contains("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    $failures.Add(
      "A chave secreta de servidor não foi documentada no .env.example."
    )
  }
}

$newClientPath =
  Join-Path $projectRoot "app\admin\clientes\novo\page.tsx"

if (Test-Path $newClientPath) {
  $newClient = [System.IO.File]::ReadAllText($newClientPath)

  if (
    -not $newClient.Contains(
      'router.replace(`/admin/clientes/${data.id}/acesso`);'
    )
  ) {
    $failures.Add(
      "O novo cliente não direciona para a etapa de acesso."
    )
  }

  if (-not $newClient.Contains("Etapa 1 de 3")) {
    $failures.Add(
      "A numeração das etapas do novo cliente não foi atualizada."
    )
  }
}

$clientsListPath =
  Join-Path $projectRoot "app\admin\clientes\page.tsx"

if (Test-Path $clientsListPath) {
  $clientsList =
    [System.IO.File]::ReadAllText($clientsListPath)

  if (
    -not $clientsList.Contains(
      '/acesso`}>'
    )
  ) {
    $failures.Add(
      "O atalho de acesso não foi encontrado na lista de clientes."
    )
  }
}

$editClientPath =
  Join-Path $projectRoot "app\admin\clientes\[id]\page.tsx"

if (Test-Path -LiteralPath $editClientPath) {
  $editClient =
    [System.IO.File]::ReadAllText($editClientPath)

  if (
    -not $editClient.Contains(
      '/acesso`}>'
    )
  ) {
    $failures.Add(
      "O atalho de acesso não foi encontrado na edição do cliente."
    )
  }
}

$routePath =
  Join-Path `
    $projectRoot `
    "app\api\admin\clientes\[id]\acesso\route.ts"

if (Test-Path -LiteralPath $routePath) {
  $route = [System.IO.File]::ReadAllText($routePath)

  foreach ($requiredText in @(
    "requireAdminRequest",
    "auth.admin.createUser",
    "email_confirm: true",
    "auth.admin.deleteUser"
  )) {
    if (-not $route.Contains($requiredText)) {
      $failures.Add(
        "Proteção esperada ausente na rota: $requiredText"
      )
    }
  }
}

$publicSecretMatches = @(
  Get-ChildItem `
    -Path (Join-Path $projectRoot "app\admin") `
    -Recurse `
    -File `
    -Include "*.ts","*.tsx" |
    Select-String `
      -Pattern "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE|NEXT_PUBLIC_SUPABASE_SECRET"
)

if ($publicSecretMatches.Count -gt 0) {
  $failures.Add(
    "Foi encontrada uma variável secreta com prefixo NEXT_PUBLIC."
  )
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Problemas encontrados:" -ForegroundColor Red

  $failures |
    Sort-Object -Unique |
    ForEach-Object {
      Write-Host "- $_" -ForegroundColor Red
    }

  exit 1
}

Write-Host ""
Write-Host "Estrutura da Entrega 19.11: OK" -ForegroundColor Green
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
Write-Host "Entrega 19.11 verificada com sucesso." -ForegroundColor Green
Write-Host ""
