$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Correção 19.9.1 - Caminhos dos estilos do painel" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path

$dashboardPath =
  Join-Path $projectRoot "components\client-demo\ClientPanelDashboard.tsx"

$subscriptionPath =
  Join-Path $projectRoot "components\client-demo\ClientPanelSubscription.tsx"

if (-not (Test-Path $dashboardPath)) {
  throw "Arquivo não encontrado: components\client-demo\ClientPanelDashboard.tsx"
}

if (-not (Test-Path $subscriptionPath)) {
  throw "Arquivo não encontrado: components\client-demo\ClientPanelSubscription.tsx"
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding($false)

$dashboard =
  [System.IO.File]::ReadAllText($dashboardPath)

$dashboardWrong =
  'import dataStyles from "@/app/painel/client-panel-data.module.css";'

$dashboardCorrect =
  'import dataStyles from "@/app/cliente-demo/dashboard/client-panel-data.module.css";'

if ($dashboard.Contains($dashboardWrong)) {
  $dashboard =
    $dashboard.Replace(
      $dashboardWrong,
      $dashboardCorrect
    )
} elseif (-not $dashboard.Contains($dashboardCorrect)) {
  throw "O caminho do CSS do painel não foi localizado."
}

$subscription =
  [System.IO.File]::ReadAllText($subscriptionPath)

$subscriptionWrong =
  'import styles from "@/app/painel/assinatura/subscription-real.module.css";'

$subscriptionCorrect =
  'import styles from "@/app/cliente-demo/assinatura/subscription-real.module.css";'

if ($subscription.Contains($subscriptionWrong)) {
  $subscription =
    $subscription.Replace(
      $subscriptionWrong,
      $subscriptionCorrect
    )
} elseif (-not $subscription.Contains($subscriptionCorrect)) {
  throw "O caminho do CSS da assinatura não foi localizado."
}

[System.IO.File]::WriteAllText(
  $dashboardPath,
  $dashboard,
  $utf8WithoutBom
)

[System.IO.File]::WriteAllText(
  $subscriptionPath,
  $subscription,
  $utf8WithoutBom
)

Write-Host "Caminho do CSS do painel: corrigido." -ForegroundColor Green
Write-Host "Caminho do CSS da assinatura: corrigido." -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
