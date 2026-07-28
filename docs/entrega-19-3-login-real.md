# Entrega 19.3 — Primeiro login real do vendedor

## Escopo

Esta entrega transforma o login do protótipo em autenticação real utilizando o
Supabase Auth.

O primeiro usuário será vinculado à GD Honda.

## Fluxo

```text
E-mail e senha
→ Supabase Auth
→ meu_acesso_cliente()
→ cliente_usuarios
→ clientes
→ painel liberado ou bloqueado
```

## Sessões separadas

O painel administrativo usa:

```text
rafael-honda-admin-auth
```

O painel do vendedor usa:

```text
rafael-honda-client-panel-auth
```

Isso permite manter a conta administrativa e a conta de teste abertas no mesmo
navegador sem uma sessão substituir a outra.

## Proteção desta etapa

As rotas abaixo passam a exigir uma conta vinculada e ativa:

```text
/cliente-demo/dashboard
/cliente-demo/assinatura
```

A segurança do banco continua sendo garantida por RLS. O guard visual melhora a
experiência, mas não substitui as políticas do Supabase.

## O que já é real

- e-mail e senha;
- sessão persistente;
- logout;
- vínculo entre usuário e cliente;
- validação do cliente correto;
- bloqueio do vínculo;
- bloqueio quando o cliente está inativo;
- redirecionamento sem sessão;
- nome, slug e link público carregados do vínculo.

## O que continua simulado

- edição do perfil;
- alteração de motos;
- mensalidade;
- Pix;
- cartão;
- histórico financeiro.

Essas funções ainda não enviam alterações ao Supabase.
