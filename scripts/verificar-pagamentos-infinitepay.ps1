$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Verificacao da Entrega 19.12 - Pagamentos InfinitePay"
Write-Host ""

$requiredFiles = @(
  "lib\client-request-auth.ts",
  "lib\infinitepay.ts",
  "lib\infinitepay-payment.ts",
  "app\api\painel\pagamentos\infinitepay\checkout\route.ts",
  "app\api\painel\pagamentos\infinitepay\confirmar\route.ts",
  "app\api\webhooks\infinitepay\route.ts",
  "components\client-demo\ClientPanelSubscription.tsx",
  "components\client-demo\ClientAccessGuard.tsx",
  "supabase\pagamentos-infinitepay.sql",
  "docs\entrega-19-12-pagamentos-infinitepay.md"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) {
    throw "Arquivo obrigatorio ausente: $file"
  }

  Write-Host "OK   $file"
}

$envExample = Get-Content ".env.example" -Raw

if ($envExample -notmatch "INFINITEPAY_HANDLE") {
  throw "INFINITEPAY_HANDLE nao foi documentada em .env.example"
}

if ($envExample -notmatch "APP_URL") {
  throw "APP_URL nao foi documentada em .env.example"
}

Write-Host ""
Write-Host "Estrutura da Entrega 19.12: OK"
Write-Host ""
Write-Host "Executando typecheck..."
npm.cmd run typecheck

Write-Host ""
Write-Host "Executando lint..."
npm.cmd run lint

Write-Host ""
Write-Host "Executando build..."
npm.cmd run build

Write-Host ""
Write-Host "Entrega 19.12 verificada com sucesso."
