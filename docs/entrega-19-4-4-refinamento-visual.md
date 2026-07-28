# Entrega 19.4.4 — Refinamento visual das motos

## Ajuste das setas

As setas da navegação mobile deixam de ficar posicionadas sobre o card de
parcelas.

Agora existe uma barra abaixo do card com:

- seta anterior;
- indicação de arraste;
- seta próxima.

Dessa forma, nenhuma parcela, número ou valor fica encoberto.

## Vitrine premium

Foi criado o componente compartilhado:

```text
components/MotorcycleVisualStage.tsx
```

Ele adiciona atrás da moto:

- círculo decorativo;
- brilho suave;
- fundo leve;
- sombra na imagem;
- adaptação às cores de cada vendedor.

O componente é usado nas páginas de consórcio e financiamento.

## Escopo preservado

Não foram alterados:

- valores;
- planos;
- formulários;
- mensagens do WhatsApp;
- banco de dados;
- galeria;
- painel do vendedor;
- métricas.
