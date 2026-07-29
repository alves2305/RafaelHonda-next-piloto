$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.6 - Instalador da edicao segura do perfil" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path
$dashboardPath = Join-Path $projectRoot "app\cliente-demo\dashboard\page.tsx"

if (-not (Test-Path $dashboardPath)) {
  throw "O dashboard nao foi encontrado. Execute este instalador na pasta principal do projeto."
}

try {
  $branch = (git branch --show-current 2>$null).Trim()

  if ($branch -and $branch -ne "feature/painel-clientes") {
    throw "Branch incorreta: $branch. Troque para feature/painel-clientes."
  }
} catch {
  if ($_.Exception.Message -like "Branch incorreta:*") {
    throw
  }

  Write-Host "Nao foi possivel confirmar a branch pelo Git." -ForegroundColor Yellow
}

$content = [System.IO.File]::ReadAllText($dashboardPath)

$accessImport =
  'import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";'

$editorImport =
  'import { ClientProfileEditor } from "@/components/client-demo/ClientProfileEditor";'

if (-not $content.Contains($editorImport)) {
  if (-not $content.Contains($accessImport)) {
    throw "O ponto de importacao do painel nao foi encontrado."
  }

  $content = $content.Replace(
    $accessImport,
    $accessImport + [Environment]::NewLine + $editorImport
  )
}

$instagramFunctionStart =
  $content.IndexOf('function getInstagramLabel(')

if ($instagramFunctionStart -ge 0) {
  $dashboardStart =
    $content.IndexOf(
      'export default function ClientDashboardPage()',
      $instagramFunctionStart
    )

  if ($dashboardStart -lt 0) {
    throw "Nao foi possivel localizar o final da funcao antiga do Instagram."
  }

  $content =
    $content.Substring(0, $instagramFunctionStart) +
    $content.Substring($dashboardStart)
}

$profileStartMarker =
  '              {section === "profile" ? ('

$motorcycleStartMarker =
  '              {section === "motorcycles" ? ('

if (-not $content.Contains('<ClientProfileEditor')) {
  $profileStart =
    $content.IndexOf($profileStartMarker)

  if ($profileStart -lt 0) {
    throw "O bloco antigo de perfil nao foi encontrado."
  }

  $motorcycleStart =
    $content.IndexOf(
      $motorcycleStartMarker,
      $profileStart
    )

  if ($motorcycleStart -lt 0) {
    throw "O inicio da secao de motos nao foi encontrado."
  }

  $replacement = @'
              {section === "profile" ? (
                <ClientProfileEditor
                  profile={profile}
                  onSaved={loadData}
                />
              ) : null}

'@

  $content =
    $content.Substring(0, $profileStart) +
    $replacement +
    $content.Substring($motorcycleStart)
}

$backupPath = "$dashboardPath.backup-19-6"

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
