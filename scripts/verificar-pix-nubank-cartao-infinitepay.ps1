$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Verificacao do Ajuste 19.12.1"
Write-Host ""

$requiredFiles = @(
  "lib\pix-br-code.ts",
  "app\api\painel\pagamentos\pix\route.ts",
  "components\client-demo\PixPaymentButton.tsx",
  "components\client-demo\pix-payment.module.css",
  "docs\ajuste-19-12-1-pix-nubank.md"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) {
    throw "Arquivo obrigatorio ausente: $file"
  }

  Write-Host "OK   $file"
}

$component = Get-Content ".\components\client-demo\ClientPanelSubscription.tsx" -Raw

if ($component -notmatch "PixPaymentButton") {
  throw "O botao Pix nao foi conectado a pagina de assinatura."
}

$packageJson = Get-Content ".\package.json" -Raw

if ($packageJson -notmatch '"qrcode"') {
  throw "A dependencia qrcode nao foi encontrada."
}

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
Write-Host "Ajuste 19.12.1 verificado com sucesso."
