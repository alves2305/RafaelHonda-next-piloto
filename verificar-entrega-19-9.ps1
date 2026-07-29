$ErrorActionPreference = "Stop"

$projectRoot = (Get-Location).Path

$checks = @(
  @{
    Name = "rota_login"
    Path = "app\painel\login\page.tsx"
    Pattern = "ClientPanelLogin"
  },
  @{
    Name = "rota_painel"
    Path = "app\painel\(protegido)\page.tsx"
    Pattern = "ClientPanelDashboard"
  },
  @{
    Name = "layout_protegido"
    Path = "app\painel\(protegido)\layout.tsx"
    Pattern = "ClientAccessGuard"
  },
  @{
    Name = "rota_assinatura"
    Path = "app\painel\(protegido)\assinatura\page.tsx"
    Pattern = "ClientPanelSubscription"
  },
  @{
    Name = "componente_login"
    Path = "components\client-demo\ClientPanelLogin.tsx"
    Pattern = "/painel"
  },
  @{
    Name = "componente_dashboard"
    Path = "components\client-demo\ClientPanelDashboard.tsx"
    Pattern = "/painel/assinatura"
  },
  @{
    Name = "componente_assinatura"
    Path = "components\client-demo\ClientPanelSubscription.tsx"
    Pattern = "/painel"
  },
  @{
    Name = "logout_definitivo"
    Path = "components\client-demo\ClientLogoutButton.tsx"
    Pattern = "/painel/login"
  },
  @{
    Name = "guard_definitivo"
    Path = "components\client-demo\ClientAccessGuard.tsx"
    Pattern = "/painel/login"
  }
)

$results = foreach ($check in $checks) {
  $fullPath =
    Join-Path $projectRoot $check.Path

  $ok =
    (Test-Path $fullPath) -and
    (
      Select-String `
        -Path $fullPath `
        -Pattern $check.Pattern `
        -SimpleMatch `
        -Quiet
    )

  [PSCustomObject]@{
    Recurso = $check.Name
    Status = if ($ok) { "OK" } else { "ERRO" }
  }
}

$results | Format-Table -AutoSize

$legacyPatterns = @(
  "/cliente-demo/login",
  "/cliente-demo/dashboard",
  "/cliente-demo/assinatura"
)

$sharedFiles = @(
  "components\client-demo\ClientPanelLogin.tsx",
  "components\client-demo\ClientPanelDashboard.tsx",
  "components\client-demo\ClientPanelSubscription.tsx",
  "components\client-demo\ClientLogoutButton.tsx",
  "components\client-demo\ClientAccessGuard.tsx"
)

$legacyFound = $false

foreach ($relativePath in $sharedFiles) {
  $fullPath =
    Join-Path $projectRoot $relativePath

  if (-not (Test-Path $fullPath)) {
    continue
  }

  foreach ($pattern in $legacyPatterns) {
    if (
      Select-String `
        -Path $fullPath `
        -Pattern $pattern `
        -SimpleMatch `
        -Quiet
    ) {
      Write-Host "Referência antiga encontrada em: $relativePath -> $pattern" -ForegroundColor Red
      $legacyFound = $true
    }
  }
}

if ($legacyFound) {
  throw "A verificação encontrou referências antigas dentro dos componentes definitivos."
}

Write-Host ""
Write-Host "Nenhuma referência antiga foi encontrada nos componentes definitivos." -ForegroundColor Green
