# Entrega 19.4.2 — Arraste entre motos no celular

## Escopo

Melhoria isolada da página de consórcio.

No celular, o card de parcelas passa a aceitar o gesto de arraste lateral:

- arrastar para a esquerda abre a próxima moto;
- arrastar para a direita abre a moto anterior.

## Indicação visual

O card mostra:

- seta clicável na lateral esquerda, quando existe uma moto anterior;
- seta clicável na lateral direita, quando existe uma próxima moto;
- texto “Arraste para trocar de moto”.

## Computador

Os links atuais “Anterior” e “Próxima” continuam visíveis no computador.

No celular, esses links inferiores são escondidos para evitar duas navegações
diferentes na mesma tela.

## Proteções de uso

O componente diferencia o gesto horizontal da rolagem vertical.

A rolagem normal da página continua funcionando. Um movimento pequeno também
não troca a moto por acidente.

## Fora do escopo

Esta entrega não modifica:

- formulário de consórcio;
- formulário de financiamento;
- mensagem do WhatsApp;
- preços;
- banco de dados;
- painel do vendedor;
- métricas.
