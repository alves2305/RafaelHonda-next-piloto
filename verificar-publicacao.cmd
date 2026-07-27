@echo off
setlocal
title Verificacao final - Catalogo Honda

REM Sempre executa a partir da pasta onde este arquivo esta salvo.
cd /d "%~dp0"

echo.
echo ==============================================
echo   CATALOGO HONDA - VERIFICACAO DE PUBLICACAO
echo ==============================================
echo.
echo Pasta do projeto:
echo %CD%
echo.

if not exist "package.json" (
  echo ERRO: O arquivo package.json nao foi encontrado nesta pasta.
  echo.
  echo Confirme que verificar-publicacao.cmd esta na pasta principal do projeto.
  goto :error
)

if not exist "scripts\preflight-release.mjs" (
  echo ERRO: scripts\preflight-release.mjs nao foi encontrado.
  echo.
  echo Extraia novamente a Entrega 14 na pasta principal do projeto.
  goto :error
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao foi encontrado.
  goto :error
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERRO: Git nao foi encontrado.
  goto :error
)

echo [1/4] Verificando estrutura e segredos...
node "scripts\preflight-release.mjs"
if errorlevel 1 goto :error

echo.
echo [2/4] Verificando TypeScript...
call npm run typecheck
if errorlevel 1 goto :error

echo.
echo [3/4] Executando ESLint...
call npm run lint
if errorlevel 1 goto :error

echo.
echo [4/4] Gerando build de producao...
call npm run build
if errorlevel 1 goto :error

echo.
echo ==============================================
echo   VERIFICACAO CONCLUIDA COM SUCESSO
echo ==============================================
echo.
echo O projeto esta pronto para commit e push.
echo.
git status --short
echo.
echo Proximos comandos:
echo   git add .
echo   git commit -m "Finaliza painel administrativo e catalogo centralizado"
echo   git push origin main
echo.
pause
exit /b 0

:error
echo.
echo ==============================================
echo   PUBLICACAO BLOQUEADA
echo ==============================================
echo.
echo Corrija o erro apresentado acima e execute este arquivo novamente.
echo.
pause
exit /b 1
