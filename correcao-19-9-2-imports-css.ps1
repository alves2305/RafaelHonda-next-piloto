$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Correção 19.9.2 - Reparo definitivo dos imports CSS" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path

$dashboardPath =
  Join-Path $projectRoot "components\client-demo\ClientPanelDashboard.tsx"

$subscriptionPath =
  Join-Path $projectRoot "components\client-demo\ClientPanelSubscription.tsx"

if (-not (Test-Path $dashboardPath)) {
  throw "Arquivo não encontrado: $dashboardPath"
}

if (-not (Test-Path $subscriptionPath)) {
  throw "Arquivo não encontrado: $subscriptionPath"
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding($false)

$dashboard =
  [System.IO.File]::ReadAllText($dashboardPath)

$subscription =
  [System.IO.File]::ReadAllText($subscriptionPath)

$dashboardPattern =
  'import\s+dataStyles\s+from\s+"@/app/[^"]*client-panel-data\.module\.css";'

$dashboardReplacement =
  'import dataStyles from "@/app/cliente-demo/dashboard/client-panel-data.module.css";'

$subscriptionPattern =
  'import\s+styles\s+from\s+"@/app/[^"]*subscription-real\.module\.css";'

$subscriptionReplacement =
  'import styles from "@/app/cliente-demo/assinatura/subscription-real.module.css";'

$dashboardFixed =
  [System.Text.RegularExpressions.Regex]::Replace(
    $dashboard,
    $dashboardPattern,
    $dashboardReplacement
  )

$subscriptionFixed =
  [System.Text.RegularExpressions.Regex]::Replace(
    $subscription,
    $subscriptionPattern,
    $subscriptionReplacement
  )

if ($dashboardFixed -eq $dashboard) {
  if (-not $dashboard.Contains($dashboardReplacement)) {
    throw "Não foi possível localizar o import dataStyles no painel."
  }
}

if ($subscriptionFixed -eq $subscription) {
  if (-not $subscription.Contains($subscriptionReplacement)) {
    throw "Não foi possível localizar o import styles na assinatura."
  }
}

[System.IO.File]::WriteAllText(
  $dashboardPath,
  $dashboardFixed,
  $utf8WithoutBom
)

[System.IO.File]::WriteAllText(
  $subscriptionPath,
  $subscriptionFixed,
  $utf8WithoutBom
)

$dashboardCheck =
  Select-String `
    -Path $dashboardPath `
    -Pattern $dashboardReplacement `
    -SimpleMatch `
    -Quiet

$subscriptionCheck =
  Select-String `
    -Path $subscriptionPath `
    -Pattern $subscriptionReplacement `
    -SimpleMatch `
    -Quiet

if (-not $dashboardCheck) {
  throw "A verificação do CSS do painel falhou."
}

if (-not $subscriptionCheck) {
  throw "A verificação do CSS da assinatura falhou."
}

Write-Host "Import do painel corrigido:" -ForegroundColor Green
Write-Host $dashboardReplacement -ForegroundColor DarkGray
Write-Host ""
Write-Host "Import da assinatura corrigido:" -ForegroundColor Green
Write-Host $subscriptionReplacement -ForegroundColor DarkGray
Write-Host ""

$nextPath =
  Join-Path $projectRoot ".next"

if (Test-Path $nextPath) {
  Remove-Item `
    -Recurse `
    -Force `
    $nextPath

  Write-Host "Cache .next removido." -ForegroundColor Green
}

Write-Host ""
Write-Host "Correção concluída." -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host "npm.cmd run dev"
Write-Host ""
