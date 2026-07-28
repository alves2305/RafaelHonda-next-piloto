# Entrega 19.4.1 — Mensagem automática nos botões gerais

## Objetivo

Adicionar uma mensagem inicial aos atalhos gerais do WhatsApp sem alterar os
formulários de consórcio e financiamento.

## Mensagem

```text
Olá, NOME DO VENDEDOR! Vim pelo seu catálogo Honda e gostaria de fazer uma
simulação. Pode me ajudar?
```

O nome é preenchido automaticamente de acordo com o perfil acessado.

## Botões atualizados

- botão “Falar no WhatsApp” do topo;
- botão “Falar no WhatsApp” da seção final;
- botão flutuante “Estou online. Fale agora!”.

## Fluxos preservados

Não foram modificados:

- formulário de consórcio;
- formulário de financiamento;
- informações da moto;
- plano escolhido;
- dados preenchidos pelo visitante.

Esses formulários continuam gerando suas próprias mensagens detalhadas.

## Centralização

A regra foi criada em:

```text
lib/whatsapp.ts
```

Uma mudança futura no texto precisa ser feita em apenas um arquivo.
