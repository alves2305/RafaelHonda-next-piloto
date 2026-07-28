-- Catalogo Honda 2.0
-- Entrega 19.2
-- Estrutura de usuarios dos vendedores e base de seguranca
--
-- OBJETIVO
-- Criar o vinculo entre um usuario do Supabase Auth e exatamente um cliente.
--
-- ESTA MIGRACAO NAO:
-- - cria usuarios no Supabase Auth;
-- - libera login do vendedor;
-- - altera o catalogo publico;
-- - altera precos;
-- - cria pagamentos;
-- - permite escrita direta do vendedor em clientes ou cliente_motos.
--
-- Execute no SQL Editor do mesmo projeto Supabase usado pelo Catalogo Honda.

begin;

do $$
begin
  if to_regclass('public.clientes') is null then
    raise exception
      'Instalacao interrompida: a tabela public.clientes nao foi encontrada.';
  end if;

  if to_regclass('public.admin_usuarios') is null then
    raise exception
      'Instalacao interrompida: a tabela public.admin_usuarios nao foi encontrada.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'Instalacao interrompida: a funcao public.usuario_e_admin() nao foi encontrada.';
  end if;
end
$$;

create table if not exists public.cliente_usuarios (
  user_id uuid primary key
    references auth.users(id) on delete cascade,

  cliente_id uuid not null unique
    references public.clientes(id) on delete cascade,

  nome text not null default 'Vendedor'
    check (
      char_length(btrim(nome)) between 2 and 120
    ),

  ativo boolean not null default true,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.cliente_usuarios is
  'Vincula uma conta do Supabase Auth a um unico catalogo de vendedor.';

comment on column public.cliente_usuarios.user_id is
  'Usuario existente em auth.users.';

comment on column public.cliente_usuarios.cliente_id is
  'Catalogo que o usuario pode administrar. Um catalogo possui uma conta nesta fase.';

comment on column public.cliente_usuarios.ativo is
  'Controla o acesso ao painel do vendedor sem alterar a conta do Supabase Auth.';

create index if not exists cliente_usuarios_ativo_idx
  on public.cliente_usuarios (ativo);

create or replace function public.atualizar_data_cliente_usuario()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end
$$;

revoke all
  on function public.atualizar_data_cliente_usuario()
  from public;

drop trigger if exists cliente_usuarios_atualizado_em
  on public.cliente_usuarios;

create trigger cliente_usuarios_atualizado_em
before update on public.cliente_usuarios
for each row
execute function public.atualizar_data_cliente_usuario();

-- Retorna o cliente do usuario somente quando:
-- - o vinculo esta ativo;
-- - o cliente esta ativo.
--
-- Quando o administrador bloquear o cliente ou o vinculo, retorna null.

create or replace function public.cliente_id_do_usuario()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cu.cliente_id
  from public.cliente_usuarios cu
  join public.clientes c
    on c.id = cu.cliente_id
  where cu.user_id = (select auth.uid())
    and cu.ativo = true
    and c.ativo = true
  limit 1;
$$;

-- Permite verificar se o usuario autenticado possui acesso ativo.
-- Sem parametro: verifica se possui algum vinculo ativo.
-- Com cliente_id: verifica se pertence especificamente ao cliente informado.

create or replace function public.usuario_e_cliente(
  p_cliente_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cliente_usuarios cu
    join public.clientes c
      on c.id = cu.cliente_id
    where cu.user_id = (select auth.uid())
      and cu.ativo = true
      and c.ativo = true
      and (
        p_cliente_id is null
        or cu.cliente_id = p_cliente_id
      )
  );
$$;

-- Retorna o estado do proprio acesso.
-- Diferente de cliente_id_do_usuario(), esta funcao tambem retorna vinculos
-- bloqueados, permitindo que a tela informe o motivo do bloqueio.

create or replace function public.meu_acesso_cliente()
returns table (
  user_id uuid,
  cliente_id uuid,
  nome_usuario text,
  usuario_ativo boolean,
  cliente_nome text,
  cliente_slug text,
  cliente_ativo boolean,
  acesso_liberado boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    cu.user_id,
    cu.cliente_id,
    cu.nome as nome_usuario,
    cu.ativo as usuario_ativo,
    c.nome as cliente_nome,
    c.slug as cliente_slug,
    c.ativo as cliente_ativo,
    (cu.ativo and c.ativo) as acesso_liberado
  from public.cliente_usuarios cu
  join public.clientes c
    on c.id = cu.cliente_id
  where cu.user_id = (select auth.uid())
  limit 1;
$$;

-- Funcao administrativa para vincular uma conta ja criada no Supabase Auth.
--
-- Exemplo futuro:
--
-- select public.vincular_usuario_cliente(
--   'vendedor@exemplo.com',
--   'gd',
--   'GD Honda'
-- );
--
-- Somente um administrador ativo pode executar com sucesso.

create or replace function public.vincular_usuario_cliente(
  p_email text,
  p_cliente_slug text,
  p_nome text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_cliente_id uuid;
  v_nome text;
  v_usuario_atual uuid;
begin
  if not public.usuario_e_admin() then
    raise exception
      using
        errcode = '42501',
        message = 'Somente um administrador ativo pode vincular usuarios a clientes.';
  end if;

  if nullif(btrim(p_email), '') is null then
    raise exception 'Informe o e-mail do usuario.';
  end if;

  if nullif(btrim(p_cliente_slug), '') is null then
    raise exception 'Informe o slug do cliente.';
  end if;

  select au.id
    into v_user_id
  from auth.users au
  where lower(au.email) = lower(btrim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception
      'Nenhum usuario foi encontrado no Supabase Auth com o e-mail: %',
      btrim(p_email);
  end if;

  select c.id
    into v_cliente_id
  from public.clientes c
  where c.slug = lower(btrim(p_cliente_slug))
  limit 1;

  if v_cliente_id is null then
    raise exception
      'Nenhum cliente foi encontrado com o slug: %',
      lower(btrim(p_cliente_slug));
  end if;

  select cu.user_id
    into v_usuario_atual
  from public.cliente_usuarios cu
  where cu.cliente_id = v_cliente_id
  limit 1;

  if v_usuario_atual is not null
     and v_usuario_atual <> v_user_id then
    raise exception
      'O cliente % ja esta vinculado a outro usuario.',
      lower(btrim(p_cliente_slug));
  end if;

  v_nome := coalesce(
    nullif(btrim(p_nome), ''),
    nullif(split_part(lower(btrim(p_email)), '@', 1), ''),
    'Vendedor'
  );

  insert into public.cliente_usuarios (
    user_id,
    cliente_id,
    nome,
    ativo
  )
  values (
    v_user_id,
    v_cliente_id,
    v_nome,
    true
  )
  on conflict (user_id) do update set
    cliente_id = excluded.cliente_id,
    nome = excluded.nome,
    ativo = true;

  return v_cliente_id;
end
$$;

-- Bloqueia ou libera somente o painel do vendedor.
-- O catalogo publico continua obedecendo public.clientes.ativo.

create or replace function public.definir_acesso_painel_cliente(
  p_cliente_id uuid,
  p_ativo boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.usuario_e_admin() then
    raise exception
      using
        errcode = '42501',
        message = 'Somente um administrador ativo pode alterar o acesso ao painel.';
  end if;

  update public.cliente_usuarios
  set ativo = p_ativo
  where cliente_id = p_cliente_id;

  if not found then
    raise exception
      'Nenhum usuario esta vinculado ao cliente informado.';
  end if;

  return true;
end
$$;

alter table public.cliente_usuarios
  enable row level security;

drop policy if exists
  "Usuario consulta o proprio vinculo de cliente"
  on public.cliente_usuarios;

create policy
  "Usuario consulta o proprio vinculo de cliente"
  on public.cliente_usuarios
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
  );

drop policy if exists
  "Administradores gerenciam usuarios dos clientes"
  on public.cliente_usuarios;

create policy
  "Administradores gerenciam usuarios dos clientes"
  on public.cliente_usuarios
  for all
  to authenticated
  using (
    public.usuario_e_admin()
  )
  with check (
    public.usuario_e_admin()
  );

-- Nenhuma permissao e concedida ao visitante anonimo.

revoke all
  on public.cliente_usuarios
  from anon;

-- O papel authenticated recebe privilegios SQL, mas as operacoes continuam
-- bloqueadas pelas politicas RLS acima.
--
-- Um vendedor comum:
-- - consegue selecionar somente o proprio vinculo;
-- - nao consegue inserir;
-- - nao consegue editar;
-- - nao consegue excluir.
--
-- Um administrador ativo consegue gerenciar todos os vinculos.

revoke all
  on public.cliente_usuarios
  from authenticated;

grant select, insert, update, delete
  on public.cliente_usuarios
  to authenticated;

-- Protecao das funcoes.

revoke all
  on function public.cliente_id_do_usuario()
  from public, anon, authenticated;

revoke all
  on function public.usuario_e_cliente(uuid)
  from public, anon, authenticated;

revoke all
  on function public.meu_acesso_cliente()
  from public, anon, authenticated;

revoke all
  on function public.vincular_usuario_cliente(text, text, text)
  from public, anon, authenticated;

revoke all
  on function public.definir_acesso_painel_cliente(uuid, boolean)
  from public, anon, authenticated;

grant execute
  on function public.cliente_id_do_usuario()
  to authenticated;

grant execute
  on function public.usuario_e_cliente(uuid)
  to authenticated;

grant execute
  on function public.meu_acesso_cliente()
  to authenticated;

-- Estas duas funcoes validam usuario_e_admin() internamente.
grant execute
  on function public.vincular_usuario_cliente(text, text, text)
  to authenticated;

grant execute
  on function public.definir_acesso_painel_cliente(uuid, boolean)
  to authenticated;

commit;

-- Resultado resumido da instalacao.

select
  'cliente_usuarios' as recurso,
  case
    when to_regclass('public.cliente_usuarios') is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end as status

union all

select
  'cliente_id_do_usuario',
  case
    when to_regprocedure('public.cliente_id_do_usuario()') is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end

union all

select
  'usuario_e_cliente',
  case
    when to_regprocedure('public.usuario_e_cliente(uuid)') is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end

union all

select
  'meu_acesso_cliente',
  case
    when to_regprocedure('public.meu_acesso_cliente()') is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end

union all

select
  'vincular_usuario_cliente',
  case
    when to_regprocedure(
      'public.vincular_usuario_cliente(text,text,text)'
    ) is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end

union all

select
  'definir_acesso_painel_cliente',
  case
    when to_regprocedure(
      'public.definir_acesso_painel_cliente(uuid,boolean)'
    ) is not null
      then 'OK'
    else 'NAO ENCONTRADO'
  end;
