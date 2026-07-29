$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.8 - Assinaturas reais no Supabase" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path
$adminShellPath =
  Join-Path $projectRoot "components\admin\AdminShell.tsx"
$sellerPagePath =
  Join-Path $projectRoot "app\cliente-demo\assinatura\page.tsx"

if (-not (Test-Path $adminShellPath)) {
  throw "O AdminShell nao foi encontrado. Execute este instalador na pasta principal do projeto."
}

if (-not (Test-Path $sellerPagePath)) {
  throw "A pagina de assinatura do vendedor nao foi encontrada."
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
    $adminShellPath
  )

if (
  -not $content.Contains(
    'href: "/admin/assinaturas"'
  )
) {
  $clientsBlock = @'
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: "clients" as const,
  },
'@

  $replacement = @'
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: "clients" as const,
  },
  {
    label: "Assinaturas",
    href: "/admin/assinaturas",
    icon: "plans" as const,
  },
'@

  if (-not $content.Contains($clientsBlock)) {
    throw "O ponto de navegacao dos clientes nao foi encontrado no AdminShell."
  }

  $content = $content.Replace(
    $clientsBlock,
    $replacement
  )
}

$backupPath =
  "$adminShellPath.backup-19-8"

if (-not (Test-Path $backupPath)) {
  Copy-Item $adminShellPath $backupPath
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding(
    $false
  )

[System.IO.File]::WriteAllText(
  $adminShellPath,
  $content,
  $utf8WithoutBom
)

Write-Host "Menu administrativo atualizado com sucesso." -ForegroundColor Green
Write-Host "Backup criado em:" -ForegroundColor DarkGray
Write-Host $backupPath -ForegroundColor DarkGray
Write-Host ""
Write-Host "As paginas reais de assinatura foram instaladas pelos arquivos do pacote." -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
