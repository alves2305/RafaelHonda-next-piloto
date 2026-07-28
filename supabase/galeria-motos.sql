-- Catálogo Honda 2.0
-- Entrega 19.4.3
-- Galeria central de imagens das motos
--
-- Execute no mesmo Supabase usado pelo Catálogo Honda 2.0.

begin;

do $$
begin
  if to_regclass('public.motos') is null then
    raise exception
      'Instalação interrompida: a tabela public.motos não foi encontrada.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'Instalação interrompida: a função public.usuario_e_admin() não foi encontrada.';
  end if;
end
$$;

create table if not exists public.moto_imagens (
  id uuid primary key default gen_random_uuid(),
  moto_id uuid not null
    references public.motos(id) on delete cascade,
  imagem_url text not null
    check (length(btrim(imagem_url)) > 0),
  texto_alternativo text,
  ordem integer not null default 0
    check (ordem >= 0),
  principal boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (moto_id, imagem_url)
);

create index if not exists moto_imagens_moto_ordem_idx
  on public.moto_imagens (moto_id, ativo, ordem, criado_em);

create unique index if not exists moto_imagens_uma_principal_idx
  on public.moto_imagens (moto_id)
  where principal = true;

create or replace function public.atualizar_moto_imagens_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists moto_imagens_atualizado_em
  on public.moto_imagens;

create trigger moto_imagens_atualizado_em
before update on public.moto_imagens
for each row
execute function public.atualizar_moto_imagens_atualizado_em();

create or replace function public.garantir_imagem_principal_unica()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.principal then
    update public.moto_imagens
       set principal = false
     where moto_id = new.moto_id
       and id <> new.id
       and principal = true;
  end if;

  return new;
end;
$$;

drop trigger if exists moto_imagens_principal_unica
  on public.moto_imagens;

create trigger moto_imagens_principal_unica
before insert or update of principal, moto_id
on public.moto_imagens
for each row
execute function public.garantir_imagem_principal_unica();

create or replace function public.sincronizar_imagem_principal_moto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moto_id uuid;
  v_imagem_id uuid;
  v_imagem_url text;
begin
  v_moto_id := case
    when tg_op = 'DELETE' then old.moto_id
    else new.moto_id
  end;

  select
    mi.id,
    mi.imagem_url
  into
    v_imagem_id,
    v_imagem_url
  from public.moto_imagens mi
  where mi.moto_id = v_moto_id
    and mi.ativo = true
  order by
    mi.principal desc,
    mi.ordem asc,
    mi.criado_em asc,
    mi.id asc
  limit 1;

  if v_imagem_id is not null then
    if not exists (
      select 1
      from public.moto_imagens mi
      where mi.id = v_imagem_id
        and mi.principal = true
    ) then
      update public.moto_imagens
         set principal = true
       where id = v_imagem_id;
    end if;

    update public.motos
       set imagem_url = v_imagem_url
     where id = v_moto_id
       and imagem_url is distinct from v_imagem_url;
  end if;

  return null;
end;
$$;

drop trigger if exists moto_imagens_sincronizar_principal
  on public.moto_imagens;

create trigger moto_imagens_sincronizar_principal
after insert or update of imagem_url, principal, ativo, ordem or delete
on public.moto_imagens
for each row
execute function public.sincronizar_imagem_principal_moto();

insert into public.moto_imagens (
  moto_id,
  imagem_url,
  texto_alternativo,
  ordem,
  principal,
  ativo
)
select
  m.id,
  m.imagem_url,
  m.nome,
  1,
  true,
  true
from public.motos m
where not exists (
  select 1
  from public.moto_imagens mi
  where mi.moto_id = m.id
);

alter table public.moto_imagens enable row level security;

drop policy if exists "Leitura publica das imagens ativas das motos"
  on public.moto_imagens;

create policy "Leitura publica das imagens ativas das motos"
  on public.moto_imagens
  for select
  to anon, authenticated
  using (ativo = true);

drop policy if exists "Administradores gerenciam imagens das motos"
  on public.moto_imagens;

create policy "Administradores gerenciam imagens das motos"
  on public.moto_imagens
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

revoke all on table public.moto_imagens from anon, authenticated;

grant select on table public.moto_imagens
  to anon, authenticated;

grant insert, update, delete on table public.moto_imagens
  to authenticated;

commit;

select
  'moto_imagens' as recurso,
  case
    when to_regclass('public.moto_imagens') is not null
      then 'OK'
    else 'ERRO'
  end as status
union all
select
  'imagens_principais_iniciais',
  case
    when not exists (
      select 1
      from public.motos m
      where not exists (
        select 1
        from public.moto_imagens mi
        where mi.moto_id = m.id
          and mi.principal = true
      )
    )
      then 'OK'
    else 'ERRO'
  end;
