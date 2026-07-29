# Entrega 19.8 — Assinaturas reais no Supabase

## Objetivo

Substituir a demonstração baseada em `localStorage` por uma configuração real,
vinculada a cada cliente no Supabase.

## Dados armazenados

- valor mensal;
- dia do vencimento;
- dias de tolerância;
- status manual;
- mês de referência;
- descrição não sensível da forma de pagamento;
- data do último pagamento;
- observação administrativa.

## Dados proibidos

O sistema não possui campos para:

- número completo do cartão;
- CVV;
- senha;
- chave Pix;
- dados bancários;
- token de pagamento.

## Bloqueio

O bloqueio continua manual. Ao salvar `catalogActive = false`, a função
administrativa atualiza `clientes.ativo`.

Isso suspende o catálogo público e o acesso normal do vendedor até o
administrador liberar novamente.

## Segurança

- `minha_assinatura_cliente()` retorna somente a assinatura vinculada à conta.
- `listar_assinaturas_admin()` valida `usuario_e_admin()`.
- `salvar_assinatura_cliente()` valida `usuario_e_admin()` e atualiza apenas o
  cliente informado pelo administrador.
- A tabela bruta possui RLS administrativa.
- Visitantes anônimos não recebem acesso.

## Pagamentos

Pix e cartão continuam fora desta entrega. A tela antiga de demonstração
administrativa redireciona para `/admin/assinaturas`.
