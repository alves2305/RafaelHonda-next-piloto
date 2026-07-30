# Entrega 19.11 — acesso do vendedor pelo painel administrativo

## Objetivo

Permitir que o administrador crie ou vincule o acesso de um vendedor sem
precisar abrir o Supabase Authentication ou executar SQL manual.

## Fluxo

1. O administrador cria o perfil do cliente.
2. O sistema abre `/admin/clientes/[id]/acesso`.
3. O administrador escolhe:
   - criar um usuário novo com e-mail e senha inicial; ou
   - vincular um usuário já existente no Supabase Auth.
4. O servidor valida a sessão administrativa.
5. O usuário é vinculado à tabela `cliente_usuarios`.
6. O administrador continua para a seleção das motos.

## Segurança

- A chave secreta nunca é enviada ao navegador.
- A rota do servidor exige uma sessão de administrador ativa.
- Um usuário administrador não pode ser vinculado como vendedor.
- Um usuário não pode pertencer a dois clientes.
- Um cliente continua limitado a um usuário nesta fase.
- A senha não é armazenada nas tabelas do catálogo.
- Se a criação do vínculo falhar, o usuário novo é removido automaticamente.

## Variáveis de ambiente

Configure uma destas variáveis somente no servidor:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

ou, para projetos que ainda usam chaves legadas:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Mantenha também:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
```

A variável secreta precisa existir no `.env.local` para testes locais e nas
variáveis de ambiente da Vercel para produção.

## Rotas adicionadas

- `/admin/clientes/[id]/acesso`
- `/api/admin/clientes/[id]/acesso`

## Banco de dados

Esta entrega não exige SQL novo. Ela usa a estrutura existente:

- `auth.users`
- `public.admin_usuarios`
- `public.cliente_usuarios`
- `public.clientes`
- `public.usuario_e_admin()`
