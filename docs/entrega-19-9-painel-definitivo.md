# Entrega 19.9 — Painel definitivo do vendedor

## Objetivo

Retirar o nome técnico `cliente-demo` dos endereços usados pelo vendedor sem
perder as páginas e funções desenvolvidas nas entregas anteriores.

## Rotas finais

- `/painel/login`
- `/painel`
- `/painel/assinatura`

## Compatibilidade

Os endereços antigos continuam existindo como redirecionamentos:

- `/cliente-demo/login` → `/painel/login`
- `/cliente-demo/dashboard` → `/painel`
- `/cliente-demo/assinatura` → `/painel/assinatura`

## Preservação das alterações

O instalador lê as páginas locais atuais antes de substituí-las e cria três
componentes compartilhados:

- `ClientPanelLogin.tsx`
- `ClientPanelDashboard.tsx`
- `ClientPanelSubscription.tsx`

Isso preserva as métricas, edição de perfil, upload de imagens, enquadramento,
controle de motos e assinatura real já instalados no computador do usuário.

## Proteção

A rota `/painel/login` fica pública para autenticação.

As rotas `/painel` e `/painel/assinatura` ficam dentro de um layout protegido
por `ClientAccessGuard`.

O logout e os redirecionamentos de sessão passam a usar `/painel/login`.

## Banco de dados

Esta entrega não altera tabelas, funções, políticas ou dados do Supabase.
