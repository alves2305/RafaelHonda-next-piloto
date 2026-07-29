$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.6.1 - Upload seguro das imagens" -ForegroundColor Cyan
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

$profileImport =
  'import { ClientProfileEditor } from "@/components/client-demo/ClientProfileEditor";'

$imagesImport =
  'import { ClientProfileImagesEditor } from "@/components/client-demo/ClientProfileImagesEditor";'

if (-not $content.Contains($imagesImport)) {
  if (-not $content.Contains($profileImport)) {
    throw "A Entrega 19.6 nao foi encontrada no dashboard."
  }

  $content = $content.Replace(
    $profileImport,
    $profileImport + [Environment]::NewLine + $imagesImport
  )
}

if (-not $content.Contains('<ClientProfileImagesEditor')) {
  $profileStartMarker =
    '              {section === "profile" ? ('

  $motorcycleStartMarker =
    '              {section === "motorcycles" ? ('

  $profileStart =
    $content.IndexOf($profileStartMarker)

  if ($profileStart -lt 0) {
    throw "O inicio da secao de perfil nao foi encontrado."
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
                <>
                  <ClientProfileEditor
                    profile={profile}
                    onSaved={loadData}
                  />

                  <ClientProfileImagesEditor
                    profile={profile}
                    onSaved={loadData}
                  />
                </>
              ) : null}

'@

  $content =
    $content.Substring(0, $profileStart) +
    $replacement +
    $content.Substring($motorcycleStart)
}

$backupPath = "$dashboardPath.backup-19-6-1"

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
