$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.6.2 - Enquadramento seguro das fotos" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path
$dashboardPath =
  Join-Path $projectRoot "app\cliente-demo\dashboard\page.tsx"

if (-not (Test-Path $dashboardPath)) {
  throw "O dashboard nao foi encontrado. Execute este instalador na pasta principal do projeto."
}

try {
  $branch =
    (git branch --show-current 2>$null).Trim()

  if (
    $branch -and
    $branch -ne "feature/painel-clientes"
  ) {
    throw "Branch incorreta: $branch. Troque para feature/painel-clientes."
  }
} catch {
  if (
    $_.Exception.Message -like
      "Branch incorreta:*"
  ) {
    throw
  }

  Write-Host "Nao foi possivel confirmar a branch pelo Git." -ForegroundColor Yellow
}

$content =
  [System.IO.File]::ReadAllText(
    $dashboardPath
  )

$imagesImport =
  'import { ClientProfileImagesEditor } from "@/components/client-demo/ClientProfileImagesEditor";'

$positionImport =
  'import { ClientPhotoPositionEditor } from "@/components/client-demo/ClientPhotoPositionEditor";'

if (-not $content.Contains($positionImport)) {
  if (-not $content.Contains($imagesImport)) {
    throw "A Entrega 19.6.1 nao foi encontrada no dashboard."
  }

  $content = $content.Replace(
    $imagesImport,
    $imagesImport +
      [Environment]::NewLine +
      $positionImport
  )
}

if (
  -not $content.Contains(
    '<ClientPhotoPositionEditor'
  )
) {
  $imagesBlock = @'
                  <ClientProfileImagesEditor
                    profile={profile}
                    onSaved={loadData}
                  />
'@

  if (-not $content.Contains($imagesBlock)) {
    throw "O bloco das imagens da Entrega 19.6.1 nao foi encontrado."
  }

  $replacement = @'
                  <ClientProfileImagesEditor
                    profile={profile}
                    onSaved={loadData}
                  />

                  <ClientPhotoPositionEditor
                    profile={profile}
                    onSaved={loadData}
                  />
'@

  $content = $content.Replace(
    $imagesBlock,
    $replacement
  )
}

$backupPath =
  "$dashboardPath.backup-19-6-2"

if (-not (Test-Path $backupPath)) {
  Copy-Item $dashboardPath $backupPath
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding(
    $false
  )

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
