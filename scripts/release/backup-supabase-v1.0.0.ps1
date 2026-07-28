Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @(),
    [Parameter(Mandatory = $true)][string]$ErrorMessage
  )

  & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "$ErrorMessage Codigo de saida: $LASTEXITCODE."
  }
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $projectRoot

Write-Host ""
Write-Host "BACKUP OPCIONAL DO SUPABASE - v1.0.0" -ForegroundColor Cyan
Write-Host ""

$supabaseCommand = Get-Command "supabase" -ErrorAction SilentlyContinue

if (-not $supabaseCommand) {
  Write-Host "O Supabase CLI nao esta instalado ou nao esta disponivel no terminal." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Este passo nao altera o ponto de restauracao do codigo."
  Write-Host "Podemos realizar o backup do banco separadamente quando o CLI estiver instalado."
  exit 0
}

$projectParent = Split-Path $projectRoot -Parent
$backupDirectory = Join-Path $projectParent "backups-catalogo-honda"
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

$schemaFile = Join-Path $backupDirectory "supabase-public-schema-v1.0.0.sql"
$dataFile = Join-Path $backupDirectory "supabase-public-data-v1.0.0.sql"

Write-Host "O projeto precisa estar vinculado anteriormente pelo comando supabase link."
Write-Host "O CLI podera solicitar a senha do banco diretamente no terminal."
Write-Host "Nao envie essa senha pelo chat ou para o GitHub."
Write-Host ""

Invoke-CheckedCommand `
  -Command "supabase" `
  -Arguments @(
    "db",
    "dump",
    "--linked",
    "--schema",
    "public",
    "--file",
    $schemaFile
  ) `
  -ErrorMessage "Nao foi possivel exportar a estrutura publica do banco."

Invoke-CheckedCommand `
  -Command "supabase" `
  -Arguments @(
    "db",
    "dump",
    "--linked",
    "--schema",
    "public",
    "--data-only",
    "--use-copy",
    "--file",
    $dataFile
  ) `
  -ErrorMessage "Nao foi possivel exportar os dados publicos do banco."

Write-Host ""
Write-Host "Backup do Supabase concluido:" -ForegroundColor Green
Write-Host $schemaFile
Write-Host $dataFile
Write-Host ""
Write-Host "Observacao: este dump nao copia arquivos do Storage nem usuarios do Auth."
