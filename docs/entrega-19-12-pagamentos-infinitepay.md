# Entrega 19.12 — Pagamentos InfinitePay

## Escopo

- Botão de pagamento na rota `/painel/assinatura`.
- Checkout hospedado pela InfinitePay com Pix ou cartão.
- Uma cobrança pertence somente ao vendedor autenticado.
- Confirmação por webhook e por retorno ao painel.
- Verificação do pedido, da transação e do valor usando `payment_check`.
- Atualização automática da assinatura para `pago`.
- O vendedor bloqueado por catálogo inativo ainda consegue abrir a assinatura.
- Reativação do catálogo após pagamento confirmado.
- Nenhum número de cartão, CVV, senha ou chave Pix é armazenado.

## Variáveis de ambiente

Configure em `.env.local` e na Vercel:

```env
APP_URL=http://localhost:3000
INFINITEPAY_HANDLE=seu-handle-sem-cifrao
```

As variáveis existentes do Supabase continuam obrigatórias.

## Banco de dados

Execute uma única vez no SQL Editor do Supabase:

```text
supabase/pagamentos-infinitepay.sql
```

O arquivo cria:

- `cliente_pagamentos`
- índices de consulta
- função `confirmar_pagamento_infinitepay`
- permissões restritas ao servidor

## Rotas

- `POST /api/painel/pagamentos/infinitepay/checkout`
- `POST /api/painel/pagamentos/infinitepay/confirmar`
- `POST /api/webhooks/infinitepay`

## Observação de desenvolvimento local

Em `http://localhost`, o checkout e o retorno pelo navegador podem ser testados.
O webhook automático exige uma URL pública com HTTPS. Por isso, ele será validado
no deploy da Vercel.

## Segurança

O webhook não é aceito apenas pelo conteúdo recebido. O servidor consulta
`payment_check` na InfinitePay e confere o valor salvo no Supabase antes de
alterar a assinatura.
