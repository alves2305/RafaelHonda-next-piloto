# Ajuste 19.12.1 — Pix Nubank e cartão InfinitePay

## Pix direto

- O vendedor abre um QR Code dentro do painel.
- O código já contém o valor exato da mensalidade.
- O pagamento vai diretamente para a chave Pix configurada.
- O vendedor pode usar o Pix Copia e Cola.
- O botão de aviso abre o WhatsApp com vendedor, referência e valor.
- A confirmação do Pix permanece manual pelo administrador.

## Cartão

- O vendedor é enviado ao checkout da InfinitePay.
- A confirmação continua automática pelo retorno e pelo webhook.
- Para deixar esse checkout somente com cartão, desative o Pix nas configurações da InfinitePay.

## Variáveis de ambiente

Configure em `.env.local` e depois na Vercel:

```env
PIX_KEY=sua-chave-pix
PIX_RECEIVER_NAME=SEU NOME
PIX_RECEIVER_CITY=IRECE
PIX_PAYMENT_WHATSAPP=5574999999999
```

Use preferencialmente uma chave Pix aleatória. Não compartilhe o conteúdo do `.env.local`.

## Dependências

```text
qrcode
@types/qrcode
```
