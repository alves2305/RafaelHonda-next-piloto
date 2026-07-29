# Entrega 19.6.2 — Enquadramento seguro das fotos

## O que o vendedor pode alterar

- posição horizontal da foto mobile;
- posição vertical da foto mobile;
- posição horizontal da foto desktop;
- posição vertical da foto desktop.

Cada valor é um número inteiro entre `0` e `100`.

## Segurança

O navegador chama `atualizar_meu_enquadramento_cliente()` sem informar um
`cliente_id`.

A função descobre o cliente pela sessão autenticada através de
`cliente_id_do_usuario()` e atualiza somente quatro colunas de enquadramento.

O vendedor continua sem permissão para alterar:

- slug;
- status;
- preços;
- motos;
- perfil de terceiros;
- demais configurações administrativas.

## Prévia

O painel mostra:

- prévia circular para celular;
- prévia retangular para computador;
- controles horizontal e vertical;
- botão para voltar ao centro em `50% / 50%`.

Quando não existe uma foto desktop exclusiva, a prévia usa a foto mobile como
alternativa, seguindo o comportamento atual do catálogo.
