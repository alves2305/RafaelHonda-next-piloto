# Entrega 19.4.3 — Galeria de fotos das motos

## Objetivo

Permitir várias imagens por moto sem quebrar o campo `motos.imagem_url` já
utilizado no catálogo.

## Estrutura

A tabela `moto_imagens` guarda:

- moto;
- URL;
- texto alternativo;
- ordem;
- foto principal;
- status ativo.

A migração cria uma imagem inicial para cada moto utilizando a foto principal
já cadastrada.

## Sincronização

Quando o administrador escolhe outra foto principal, o banco atualiza
automaticamente `motos.imagem_url`.

Isso mantém funcionando:

- cards da página inicial;
- páginas de consórcio;
- páginas de financiamento;
- painel administrativo existente.

## Carrossel público

O carrossel aparece somente na página de detalhes da moto.

Ele possui:

- setas;
- bolinhas;
- miniaturas;
- contador;
- arraste lateral no celular;
- retorno automático para a imagem atual caso a tabela ainda não esteja
  disponível.

## Administração

A rota é:

```text
/admin/motos/ID_DA_MOTO/galeria
```

O link “Galeria de fotos” aparece na tela de edição da moto, ao lado do link da
página pública.

Somente administradores ativos podem adicionar, ordenar, ocultar, excluir e
escolher a foto principal.

## Centralização

A galeria pertence à moto, não ao vendedor. Uma atualização é compartilhada por
todos os clientes que utilizam o modelo.
