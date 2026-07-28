# Entrega 19.4 — Painel conectado aos dados reais

## Objetivo

Remover os dados fixos usados no protótipo e carregar as informações do
vendedor diretamente do Supabase.

## Dados carregados

A conta autenticada fornece o `cliente_id` autorizado. A partir dele, o painel
carrega:

- nome;
- slug;
- status;
- foto;
- logo;
- WhatsApp;
- Instagram;
- slogan;
- cores;
- modalidades;
- motos ativas ligadas ao catálogo.

## Proteção

O painel sempre utiliza `access.clientId`, retornado pelo vínculo da sessão.

O navegador não escolhe livremente qual cliente será carregado.

A página também verifica se o perfil retornado possui o mesmo ID do vínculo
autenticado antes de exibir os dados.

## Escrita

Nenhuma permissão nova de escrita foi criada nesta entrega.

Os dados são reais, mas os controles de alteração continuam desabilitados.
Isso evita liberar um `UPDATE` amplo na tabela `clientes`.

## Métricas

O dashboard já possui os espaços para:

- visitas;
- visitantes únicos;
- moto mais acessada.

Eles aparecem como “em preparação” porque a coleta real será implementada na
Entrega 19.5, junto das regras de privacidade e consentimento.
