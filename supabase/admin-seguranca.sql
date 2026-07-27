-- Catálogo Honda 2.0
-- Fase 3 / Entrega 3
-- Segurança administrativa e políticas RLS
--
-- ANTES DE EXECUTAR:
-- Troque COLOQUE_SEU_EMAIL_AQUI pelo e-mail criado em Authentication > Users.

begin;

create table if not exists public.admin_usuarios (
  user_id uuid primary key
    references auth.users(id) on delete cascade,
  nome text not null default 'Administrador',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.admin_usuarios enable row level security;

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_usuarios
    where user_id = (select auth.uid())
      and ativo = true
  );
$$;

revoke all on function public.usuario_e_admin() from public;
grant execute on function public.usuario_e_admin() to authenticated;

drop policy if exists "Usuario consulta o proprio acesso administrativo"
  on public.admin_usuarios;

create policy "Usuario consulta o proprio acesso administrativo"
  on public.admin_usuarios
  for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.admin_usuarios to authenticated;

-- As leituras públicas existentes continuam funcionando.
-- As operações de escrita abaixo ficam restritas a administradores ativos.

drop policy if exists "Administradores gerenciam clientes"
  on public.clientes;

create policy "Administradores gerenciam clientes"
  on public.clientes
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "Administradores gerenciam motos"
  on public.motos;

create policy "Administradores gerenciam motos"
  on public.motos
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "Administradores gerenciam motos dos clientes"
  on public.cliente_motos;

create policy "Administradores gerenciam motos dos clientes"
  on public.cliente_motos
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "Administradores gerenciam planos"
  on public.planos_consorcio;

create policy "Administradores gerenciam planos"
  on public.planos_consorcio
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "Administradores gerenciam financiamentos"
  on public.informacoes_financiamento;

create policy "Administradores gerenciam financiamentos"
  on public.informacoes_financiamento
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

grant insert, update, delete on
  public.clientes,
  public.motos,
  public.cliente_motos,
  public.planos_consorcio,
  public.informacoes_financiamento
to authenticated;

-- Autoriza o usuário criado no Supabase Authentication.

do $$
declare
  admin_email text := 'COLOQUE_SEU_EMAIL_AQUI';
  admin_user_id uuid;
begin
  if admin_email = 'COLOQUE_SEU_EMAIL_AQUI' then
    raise exception
      'Substitua COLOQUE_SEU_EMAIL_AQUI pelo e-mail do administrador antes de executar.';
  end if;

  select id
    into admin_user_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  if admin_user_id is null then
    raise exception
      'Nenhum usuário foi encontrado no Supabase Auth com o e-mail: %',
      admin_email;
  end if;

  insert into public.admin_usuarios (
    user_id,
    nome,
    ativo
  )
  values (
    admin_user_id,
    'Rafael Alves',
    true
  )
  on conflict (user_id) do update set
    nome = excluded.nome,
    ativo = true;
end
$$;

commit;

-- Verificação opcional:
-- A consulta abaixo deve retornar o administrador cadastrado.
select
  au.email,
  adm.nome,
  adm.ativo,
  adm.criado_em
from public.admin_usuarios adm
join auth.users au on au.id = adm.user_id;
