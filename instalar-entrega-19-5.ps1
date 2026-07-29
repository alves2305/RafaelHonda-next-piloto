$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.5 - Instalador do painel de metricas" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path
$dashboardPath = Join-Path $projectRoot "app\cliente-demo\dashboard\page.tsx"

if (-not (Test-Path $dashboardPath)) {
  throw "O arquivo app\cliente-demo\dashboard\page.tsx nao foi encontrado. Execute este instalador na pasta principal do projeto."
}

try {
  $branch = (git branch --show-current 2>$null).Trim()

  if ($branch -and $branch -ne "feature/painel-clientes") {
    throw "Branch incorreta: $branch. Troque para feature/painel-clientes antes de continuar."
  }
} catch {
  if ($_.Exception.Message -like "Branch incorreta:*") {
    throw
  }

  Write-Host "Nao foi possivel confirmar a branch pelo Git. Continuando a verificacao dos arquivos." -ForegroundColor Yellow
}

$content = [System.IO.File]::ReadAllText($dashboardPath)

$importLine = 'import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";'
$newImportLine = $importLine + [Environment]::NewLine + 'import { ClientAnalyticsPanel } from "@/components/client-demo/ClientAnalyticsPanel";'

if (-not $content.Contains('ClientAnalyticsPanel')) {
  if (-not $content.Contains($importLine)) {
    throw "O ponto de importacao do painel nao foi encontrado. O dashboard pode ter sido alterado manualmente."
  }

  $content = $content.Replace(
    $importLine,
    $newImportLine
  )
}

$startMarker = @'
                  <section
                    className={dataStyles.analyticsPreview}
                  >
'@

$endMarker = @'

                  <div className={styles.overviewColumns}>
'@

if (-not $content.Contains('<ClientAnalyticsPanel />')) {
  $startIndex = $content.IndexOf($startMarker)

  if ($startIndex -lt 0) {
    throw "O bloco antigo de metricas nao foi encontrado. Confirme se a Entrega 19.4 foi instalada."
  }

  $endIndex = $content.IndexOf(
    $endMarker,
    $startIndex
  )

  if ($endIndex -lt 0) {
    throw "O final do bloco antigo de metricas nao foi encontrado."
  }

  $replacement = '                  <ClientAnalyticsPanel />'

  $content =
    $content.Substring(0, $startIndex) +
    $replacement +
    $content.Substring($endIndex)
}

$backupPath = "$dashboardPath.backup-19-5"

if (-not (Test-Path $backupPath)) {
  Copy-Item $dashboardPath $backupPath
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $dashboardPath,
  $content,
  $utf8WithoutBom
)

Write-Host "Dashboard atualizado com sucesso." -ForegroundColor Green
Write-Host "Backup criado em:" -ForegroundColor DarkGray
Write-Host $backupPath -ForegroundColor DarkGray
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
