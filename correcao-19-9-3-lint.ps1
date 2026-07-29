$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Correção 19.9.3 - Limpeza dos avisos do lint" -ForegroundColor Cyan
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

# 1. Remove a diretiva eslint que deixou de ser necessária.
$dashboard =
  $dashboard.Replace(
    "/* eslint-disable @next/next/no-img-element */" +
      [Environment]::NewLine +
      [Environment]::NewLine,
    ""
  )

$dashboard =
  $dashboard.Replace(
    "/* eslint-disable @next/next/no-img-element */" +
      "`n" +
      "`n",
    ""
  )

# 2. Usa visibleMotorcyclesCount no cartão "Motos visíveis".
$visibleBlockPattern =
  '(?s)(<small>Motos visíveis</small>\s*<strong>)\{motorcycles\.length\}(</strong>\s*<p>[^<]*</p>)'

$dashboardFixed =
  [System.Text.RegularExpressions.Regex]::Replace(
    $dashboard,
    $visibleBlockPattern,
    '$1{visibleMotorcyclesCount}$2',
    1
  )

if (
  $dashboardFixed -eq $dashboard -and
  $dashboard.Contains(
    'const visibleMotorcyclesCount'
  )
) {
  $dashboardFixed =
    $dashboard.Replace(
      'const visibleMotorcyclesCount = motorcycles.filter(' +
        [Environment]::NewLine +
        '    (motorcycle) => motorcycle.visible,' +
        [Environment]::NewLine +
        '  ).length;' +
        [Environment]::NewLine,
      ''
    )

  $dashboardFixed =
    $dashboardFixed.Replace(
      'const visibleMotorcyclesCount = motorcycles.filter(' +
        "`n" +
        '    (motorcycle) => motorcycle.visible,' +
        "`n" +
        '  ).length;' +
        "`n",
      ''
    )
}

$dashboard = $dashboardFixed

# 3. Corrige dependência do useEffect da assinatura.
$subscription =
  [System.Text.RegularExpressions.Regex]::Replace(
    $subscription,
    'import\s+\{\s*useEffect,\s*useMemo,\s*useState\s*\}\s+from\s+"react";',
    'import { useCallback, useEffect, useMemo, useState } from "react";'
  )

$functionPattern =
  '(?s)  async function loadSubscription\(\) \{(.*?)\n  \}\n\n  useEffect\(\(\) => \{'

if (
  [System.Text.RegularExpressions.Regex]::IsMatch(
    $subscription,
    $functionPattern
  )
) {
  $subscription =
    [System.Text.RegularExpressions.Regex]::Replace(
      $subscription,
      $functionPattern,
      {
        param($match)

        $body = $match.Groups[1].Value

        return (
          '  const loadSubscription = useCallback(async () => {' +
          $body +
          "`n" +
          '  }, [access.clientId]);' +
          "`n`n" +
          '  useEffect(() => {'
        )
      },
      1
    )
}

$subscription =
  [System.Text.RegularExpressions.Regex]::Replace(
    $subscription,
    '(?s)(useEffect\(\(\) => \{\s*const timeoutId = window\.setTimeout\(\(\) => \{\s*void loadSubscription\(\);\s*\}, 0\);\s*return \(\) => \{\s*window\.clearTimeout\(timeoutId\);\s*\};\s*\}, )\[\](\);)',
    '$1[loadSubscription]$2',
    1
  )

# Validações
if (
  $dashboard.Contains(
    "/* eslint-disable @next/next/no-img-element */"
  )
) {
  throw "A diretiva eslint antiga ainda está presente no painel."
}

if (
  $dashboard.Contains(
    'const visibleMotorcyclesCount'
  ) -and
  -not $dashboard.Contains(
    '{visibleMotorcyclesCount}'
  )
) {
  throw "A variável visibleMotorcyclesCount continua sem uso."
}

if (
  -not $subscription.Contains(
    'useCallback'
  )
) {
  throw "O useCallback não foi inserido na assinatura."
}

if (
  -not $subscription.Contains(
    '[loadSubscription]'
  )
) {
  throw "A dependência do useEffect não foi corrigida."
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

Write-Host "Diretiva eslint desnecessária: removida." -ForegroundColor Green
Write-Host "Contagem de motos visíveis: corrigida." -ForegroundColor Green
Write-Host "Dependência do useEffect: corrigida." -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
