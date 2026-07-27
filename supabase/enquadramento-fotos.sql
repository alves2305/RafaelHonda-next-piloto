-- Catálogo Honda 2.0
-- Fase 3 / Entrega 11.1
-- Posição das fotos mobile e desktop
--
-- Execute somente no Supabase do Catálogo Honda.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clientes'
      and column_name = 'slug'
  ) then
    raise exception
      'Instalação interrompida: este não parece ser o Supabase do Catálogo Honda. A tabela public.clientes não possui a coluna slug.';
  end if;
end
$$;

alter table public.clientes
  add column if not exists foto_posicao_x smallint not null default 50;

alter table public.clientes
  add column if not exists foto_posicao_y smallint not null default 50;

alter table public.clientes
  add column if not exists foto_desktop_posicao_x smallint not null default 50;

alter table public.clientes
  add column if not exists foto_desktop_posicao_y smallint not null default 50;

update public.clientes
set
  foto_posicao_x = least(100, greatest(0, coalesce(foto_posicao_x, 50))),
  foto_posicao_y = least(100, greatest(0, coalesce(foto_posicao_y, 50))),
  foto_desktop_posicao_x = least(
    100,
    greatest(0, coalesce(foto_desktop_posicao_x, 50))
  ),
  foto_desktop_posicao_y = least(
    100,
    greatest(0, coalesce(foto_desktop_posicao_y, 50))
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_foto_posicao_x_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_foto_posicao_x_check
      check (foto_posicao_x between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_foto_posicao_y_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_foto_posicao_y_check
      check (foto_posicao_y between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_foto_desktop_posicao_x_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_foto_desktop_posicao_x_check
      check (foto_desktop_posicao_x between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_foto_desktop_posicao_y_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_foto_desktop_posicao_y_check
      check (foto_desktop_posicao_y between 0 and 100);
  end if;
end
$$;

commit;

notify pgrst, 'reload schema';

select
  nome,
  slug,
  foto_posicao_x,
  foto_posicao_y,
  foto_desktop_posicao_x,
  foto_desktop_posicao_y
from public.clientes
order by nome;
