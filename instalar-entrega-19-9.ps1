$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Entrega 19.9 - Painel definitivo do vendedor" -ForegroundColor Cyan
Write-Host ""

$projectRoot = (Get-Location).Path

$oldLoginPage =
  Join-Path $projectRoot "app\cliente-demo\login\page.tsx"
$oldDashboardPage =
  Join-Path $projectRoot "app\cliente-demo\dashboard\page.tsx"
$oldSubscriptionPage =
  Join-Path $projectRoot "app\cliente-demo\assinatura\page.tsx"

$guardPath =
  Join-Path $projectRoot "components\client-demo\ClientAccessGuard.tsx"
$logoutPath =
  Join-Path $projectRoot "components\client-demo\ClientLogoutButton.tsx"

$sharedDirectory =
  Join-Path $projectRoot "components\client-demo"

$sharedLoginPath =
  Join-Path $sharedDirectory "ClientPanelLogin.tsx"
$sharedDashboardPath =
  Join-Path $sharedDirectory "ClientPanelDashboard.tsx"
$sharedSubscriptionPath =
  Join-Path $sharedDirectory "ClientPanelSubscription.tsx"

$panelLoginDirectory =
  Join-Path $projectRoot "app\painel\login"
$panelProtectedDirectory =
  Join-Path $projectRoot "app\painel\(protegido)"
$panelSubscriptionDirectory =
  Join-Path $panelProtectedDirectory "assinatura"

$panelLoginPage =
  Join-Path $panelLoginDirectory "page.tsx"
$panelProtectedLayout =
  Join-Path $panelProtectedDirectory "layout.tsx"
$panelDashboardPage =
  Join-Path $panelProtectedDirectory "page.tsx"
$panelSubscriptionPage =
  Join-Path $panelSubscriptionDirectory "page.tsx"

$requiredPaths = @(
  $oldLoginPage,
  $oldDashboardPage,
  $oldSubscriptionPage,
  $guardPath,
  $logoutPath,
  (Join-Path $projectRoot "app\admin\assinaturas\page.tsx")
)

foreach ($requiredPath in $requiredPaths) {
  if (-not (Test-Path $requiredPath)) {
    throw "Arquivo obrigatório não encontrado: $requiredPath"
  }
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

  Write-Host "Não foi possível confirmar a branch pelo Git." -ForegroundColor Yellow
}

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding(
    $false
  )

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  $directory =
    Split-Path -Parent $Path

  if (-not (Test-Path $directory)) {
    New-Item `
      -ItemType Directory `
      -Path $directory `
      -Force |
      Out-Null
  }

  [System.IO.File]::WriteAllText(
    $Path,
    $Content,
    $utf8WithoutBom
  )
}

function Backup-File {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $backupPath =
    "$Path.backup-19-9"

  if (
    (Test-Path $Path) -and
    -not (Test-Path $backupPath)
  ) {
    Copy-Item $Path $backupPath
  }

  return $backupPath
}

function Replace-PanelRoutes {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  $nextContent = $Content

  $nextContent =
    $nextContent.Replace(
      "/cliente-demo/dashboard",
      "/painel"
    )

  $nextContent =
    $nextContent.Replace(
      "/cliente-demo/assinatura",
      "/painel/assinatura"
    )

  $nextContent =
    $nextContent.Replace(
      "/cliente-demo/login",
      "/painel/login"
    )

  return $nextContent
}

Backup-File $oldLoginPage | Out-Null
Backup-File $oldDashboardPage | Out-Null
Backup-File $oldSubscriptionPage | Out-Null
Backup-File $guardPath | Out-Null
Backup-File $logoutPath | Out-Null

if (-not (Test-Path $sharedLoginPath)) {
  $loginContent =
    [System.IO.File]::ReadAllText(
      $oldLoginPage
    )

  if (
    -not $loginContent.Contains(
      '"use client";'
    )
  ) {
    throw "A página original de login já foi substituída, mas o componente compartilhado não existe."
  }

  $loginContent =
    $loginContent.Replace(
      'import styles from "../cliente-demo.module.css";',
      'import styles from "@/app/cliente-demo/cliente-demo.module.css";'
    )

  $oldLoginNotice = @'
            <strong>Primeira etapa real</strong>
            <p>
              O login, a sessão e o bloqueio já são reais. As edições internas
              do protótipo ainda não são gravadas no banco.
            </p>
'@

  $newLoginNotice = @'
            <strong>Painel definitivo</strong>
            <p>
              Perfil, imagens, motos, métricas e assinatura já estão conectados
              ao catálogo vinculado à sua conta.
            </p>
'@

  if ($loginContent.Contains($oldLoginNotice)) {
    $loginContent =
      $loginContent.Replace(
        $oldLoginNotice,
        $newLoginNotice
      )
  }

  $loginContent =
    Replace-PanelRoutes $loginContent

  Write-Utf8File `
    -Path $sharedLoginPath `
    -Content $loginContent
}

if (-not (Test-Path $sharedDashboardPath)) {
  $dashboardContent =
    [System.IO.File]::ReadAllText(
      $oldDashboardPage
    )

  if (
    -not $dashboardContent.Contains(
      '"use client";'
    )
  ) {
    throw "A página original do painel já foi substituída, mas o componente compartilhado não existe."
  }

  $dashboardContent =
    $dashboardContent.Replace(
      'import styles from "../cliente-demo.module.css";',
      'import styles from "@/app/cliente-demo/cliente-demo.module.css";'
    )

  $dashboardContent =
    $dashboardContent.Replace(
      'import dataStyles from "./client-panel-data.module.css";',
      'import dataStyles from "@/app/cliente-demo/dashboard/client-panel-data.module.css";'
    )

  $dashboardContent =
    Replace-PanelRoutes $dashboardContent

  Write-Utf8File `
    -Path $sharedDashboardPath `
    -Content $dashboardContent
}

if (-not (Test-Path $sharedSubscriptionPath)) {
  $subscriptionContent =
    [System.IO.File]::ReadAllText(
      $oldSubscriptionPage
    )

  if (
    -not $subscriptionContent.Contains(
      '"use client";'
    )
  ) {
    throw "A página original de assinatura já foi substituída, mas o componente compartilhado não existe."
  }

  $subscriptionContent =
    $subscriptionContent.Replace(
      'import styles from "./subscription-real.module.css";',
      'import styles from "@/app/cliente-demo/assinatura/subscription-real.module.css";'
    )

  $subscriptionContent =
    Replace-PanelRoutes $subscriptionContent

  Write-Utf8File `
    -Path $sharedSubscriptionPath `
    -Content $subscriptionContent
}

foreach (
  $sharedPath in @(
    $sharedLoginPath,
    $sharedDashboardPath,
    $sharedSubscriptionPath
  )
) {
  $sharedContent =
    [System.IO.File]::ReadAllText(
      $sharedPath
    )

  $sharedContent =
    Replace-PanelRoutes $sharedContent

  Write-Utf8File `
    -Path $sharedPath `
    -Content $sharedContent
}

$guardContent =
  [System.IO.File]::ReadAllText(
    $guardPath
  )

$guardContent =
  Replace-PanelRoutes $guardContent

Write-Utf8File `
  -Path $guardPath `
  -Content $guardContent

$logoutContent =
  [System.IO.File]::ReadAllText(
    $logoutPath
  )

$logoutContent =
  Replace-PanelRoutes $logoutContent

Write-Utf8File `
  -Path $logoutPath `
  -Content $logoutContent

$newLoginPageContent = @'
import ClientPanelLogin from "@/components/client-demo/ClientPanelLogin";

export default function PanelLoginPage() {
  return <ClientPanelLogin />;
}
'@

$newProtectedLayoutContent = @'
import type { ReactNode } from "react";

import { ClientAccessGuard } from "@/components/client-demo/ClientAccessGuard";

export default function PanelProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientAccessGuard>{children}</ClientAccessGuard>;
}
'@

$newDashboardPageContent = @'
import ClientPanelDashboard from "@/components/client-demo/ClientPanelDashboard";

export default function PanelDashboardPage() {
  return <ClientPanelDashboard />;
}
'@

$newSubscriptionPageContent = @'
import ClientPanelSubscription from "@/components/client-demo/ClientPanelSubscription";

export default function PanelSubscriptionPage() {
  return <ClientPanelSubscription />;
}
'@

Write-Utf8File `
  -Path $panelLoginPage `
  -Content $newLoginPageContent

Write-Utf8File `
  -Path $panelProtectedLayout `
  -Content $newProtectedLayoutContent

Write-Utf8File `
  -Path $panelDashboardPage `
  -Content $newDashboardPageContent

Write-Utf8File `
  -Path $panelSubscriptionPage `
  -Content $newSubscriptionPageContent

$legacyLoginRedirect = @'
import { redirect } from "next/navigation";

export default function LegacyClientLoginPage() {
  redirect("/painel/login");
}
'@

$legacyDashboardRedirect = @'
import { redirect } from "next/navigation";

export default function LegacyClientDashboardPage() {
  redirect("/painel");
}
'@

$legacySubscriptionRedirect = @'
import { redirect } from "next/navigation";

export default function LegacyClientSubscriptionPage() {
  redirect("/painel/assinatura");
}
'@

Write-Utf8File `
  -Path $oldLoginPage `
  -Content $legacyLoginRedirect

Write-Utf8File `
  -Path $oldDashboardPage `
  -Content $legacyDashboardRedirect

Write-Utf8File `
  -Path $oldSubscriptionPage `
  -Content $legacySubscriptionRedirect

$oldRootPage =
  Join-Path $projectRoot "app\cliente-demo\page.tsx"

if (Test-Path $oldRootPage) {
  Backup-File $oldRootPage | Out-Null

  $legacyRootRedirect = @'
import { redirect } from "next/navigation";

export default function LegacyClientRootPage() {
  redirect("/painel/login");
}
'@

  Write-Utf8File `
    -Path $oldRootPage `
    -Content $legacyRootRedirect
}

Write-Host "Painel definitivo instalado com sucesso." -ForegroundColor Green
Write-Host ""
Write-Host "Novos endereços:" -ForegroundColor Cyan
Write-Host "http://localhost:3000/painel/login"
Write-Host "http://localhost:3000/painel"
Write-Host "http://localhost:3000/painel/assinatura"
Write-Host ""
Write-Host "Os endereços antigos agora redirecionam para os novos." -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Cyan
Write-Host "npm.cmd run typecheck"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host ""
