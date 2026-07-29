# Entrega 19.6.1 — Upload seguro das imagens

## Arquivos liberados

O vendedor pode enviar e publicar:

- foto mobile;
- foto desktop;
- logotipo;
- marca-d'água.

## Pasta exclusiva

Os uploads seguem este formato:

`clientes/<cliente_id>/<tipo>/<arquivo>.webp`

A política do Storage compara `<cliente_id>` com o cliente vinculado à sessão
autenticada.

## Proteção dupla

1. O Storage bloqueia o envio para pastas de outros vendedores.
2. A função `atualizar_minhas_imagens_cliente()` recusa a publicação de novas
   URLs que não contenham a pasta do vendedor autenticado.

O cliente não é recebido como parâmetro em nenhuma dessas verificações.

## Otimização

O navegador reutiliza `optimizeImageForUpload()`:

- aceita JPG, PNG e WebP;
- limita o original a 12 MB;
- converte para WebP;
- limita o resultado final a 5 MB;
- aplica dimensões adequadas ao tipo da imagem.

## Limite desta etapa

O enquadramento horizontal e vertical ainda permanece administrativo. A
liberação desses controles pode ser feita em uma etapa curta e separada.
