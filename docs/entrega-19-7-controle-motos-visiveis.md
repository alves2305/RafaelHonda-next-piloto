# Entrega 19.7 — Controle seguro das motos visíveis

## Separação entre liberação e visibilidade

A coluna existente `cliente_motos.ativo` continua representando a decisão do
administrador: a moto está ou não liberada para aquele vendedor.

A nova coluna `cliente_motos.vendedor_visivel` representa a escolha do
vendedor: entre as motos liberadas, quais aparecem no catálogo público.

## O vendedor pode

- visualizar todas as motos ativas liberadas pelo administrador;
- ocultar uma moto do próprio catálogo;
- reativar uma moto anteriormente ocultada;
- pesquisar e filtrar as motos;
- aplicar ações em lote;
- manter pelo menos uma moto publicada.

## O vendedor não pode

- cadastrar motos;
- liberar uma moto que o administrador não atribuiu;
- editar preços, parcelas ou informações centrais;
- alterar relações de outros vendedores;
- remover a autorização administrativa.

## Segurança

A função `atualizar_visibilidade_minhas_motos(uuid[])`:

1. identifica o cliente pela sessão autenticada;
2. não recebe `cliente_id`;
3. valida se cada moto solicitada está ativa e liberada pelo administrador;
4. atualiza somente `vendedor_visivel`;
5. rejeita listas vazias.

## Catálogo público

`lib/catalog.ts` passa a exigir simultaneamente:

- `cliente_motos.ativo = true`;
- `cliente_motos.vendedor_visivel = true`;
- `motos.ativo = true`.

A atualização pública pode levar até 30 segundos devido ao cache já existente
no catálogo.
