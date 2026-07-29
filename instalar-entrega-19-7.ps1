$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.7 - Controle seguro das motos visiveis" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path
$dashboardPath =
  Join-Path $projectRoot "app\cliente-demo\dashboard\page.tsx"
$catalogPath =
  Join-Path $projectRoot "lib\catalog.ts"

if (-not (Test-Path $dashboardPath)) {
  throw "O dashboard nao foi encontrado. Execute este instalador na pasta principal do projeto."
}

if (-not (Test-Path $catalogPath)) {
  throw "O arquivo lib\catalog.ts nao foi encontrado."
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

$dashboard =
  [System.IO.File]::ReadAllText(
    $dashboardPath
  )

$positionImport =
  'import { ClientPhotoPositionEditor } from "@/components/client-demo/ClientPhotoPositionEditor";'

$visibilityImport =
  'import { ClientMotorcycleVisibilityEditor } from "@/components/client-demo/ClientMotorcycleVisibilityEditor";'

if (-not $dashboard.Contains($visibilityImport)) {
  if (-not $dashboard.Contains($positionImport)) {
    throw "A Entrega 19.6.2 nao foi encontrada no dashboard."
  }

  $dashboard = $dashboard.Replace(
    $positionImport,
    $positionImport +
      [Environment]::NewLine +
      $visibilityImport
  )
}

$countMarker =
  '  const motorcycles = data?.motorcycles ?? [];'

$countReplacement = @'
  const motorcycles = data?.motorcycles ?? [];
  const visibleMotorcyclesCount = motorcycles.filter(
    (motorcycle) => motorcycle.visible,
  ).length;
'@

if (
  -not $dashboard.Contains(
    'const visibleMotorcyclesCount'
  )
) {
  if (-not $dashboard.Contains($countMarker)) {
    throw "O ponto de contagem das motos nao foi encontrado."
  }

  $dashboard = $dashboard.Replace(
    $countMarker,
    $countReplacement
  )
}

$oldOverview = @'
                        <small>Motos visíveis</small>
                        <strong>{motorcycles.length}</strong>
                        <p>Modelos liberados no catálogo</p>
'@

$newOverview = @'
                        <small>Motos visíveis</small>
                        <strong>{visibleMotorcyclesCount}</strong>
                        <p>Modelos publicados no catálogo</p>
'@

if ($dashboard.Contains($oldOverview)) {
  $dashboard = $dashboard.Replace(
    $oldOverview,
    $newOverview
  )
}

if (
  -not $dashboard.Contains(
    '<ClientMotorcycleVisibilityEditor'
  )
) {
  $sectionStartMarker =
    '              {section === "motorcycles" ? ('

  $sectionEndMarker =
    '            </>'

  $sectionStart =
    $dashboard.IndexOf($sectionStartMarker)

  if ($sectionStart -lt 0) {
    throw "O inicio da secao de motos nao foi encontrado."
  }

  $sectionEnd =
    $dashboard.IndexOf(
      $sectionEndMarker,
      $sectionStart
    )

  if ($sectionEnd -lt 0) {
    throw "O final da secao de motos nao foi encontrado."
  }

  $replacement = @'
              {section === "motorcycles" ? (
                <ClientMotorcycleVisibilityEditor
                  profile={profile}
                  motorcycles={motorcycles}
                  onSaved={loadData}
                />
              ) : null}
'@

  $dashboard =
    $dashboard.Substring(0, $sectionStart) +
    $replacement +
    [Environment]::NewLine +
    $dashboard.Substring($sectionEnd)
}

$catalog =
  [System.IO.File]::ReadAllText(
    $catalogPath
  )

$catalogOld = @'
    .eq("cliente_id", client.id)
    .eq("ativo", true)
    .order("ordem")
'@

$catalogNew = @'
    .eq("cliente_id", client.id)
    .eq("ativo", true)
    .eq("vendedor_visivel", true)
    .order("ordem")
'@

if (
  -not $catalog.Contains(
    '.eq("vendedor_visivel", true)'
  )
) {
  if (-not $catalog.Contains($catalogOld)) {
    throw "O filtro publico de cliente_motos nao foi encontrado."
  }

  $catalog = $catalog.Replace(
    $catalogOld,
    $catalogNew
  )
}

$dashboardBackup =
  "$dashboardPath.backup-19-7"
$catalogBackup =
  "$catalogPath.backup-19-7"

if (-not (Test-Path $dashboardBackup)) {
  Copy-Item $dashboardPath $dashboardBackup
}

if (-not (Test-Path $catalogBackup)) {
  Copy-Item $catalogPath $catalogBackup
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding(
    $false
  )

[System.IO.File]::WriteAllText(
  $dashboardPath,
  $dashboard,
  $utf8WithoutBom
)

[System.IO.File]::WriteAllText(
  $catalogPath,
  $catalog,
  $utf8WithoutBom
)

Write-Host "Dashboard e catalogo publico atualizados com sucesso." -ForegroundColor Green
Write-Host "Backups criados em:" -ForegroundColor DarkGray
Write-Host $dashboardBackup -ForegroundColor DarkGray
Write-Host $catalogBackup -ForegroundColor DarkGray
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
