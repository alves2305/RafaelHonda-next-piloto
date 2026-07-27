-- Catálogo Honda 2.0
-- Fase 3 / Entrega 11
-- Supabase Storage para imagens do catálogo
--
-- Execute somente no Supabase usado pelo Catálogo Honda 2.0.

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

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'A função public.usuario_e_admin() não foi encontrada. Execute primeiro a Entrega 3 de segurança administrativa.';
  end if;
end
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'catalogo-assets',
  'catalogo-assets',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administradores visualizam arquivos do catalogo"
  on storage.objects;

create policy "Administradores visualizam arquivos do catalogo"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'catalogo-assets'
    and public.usuario_e_admin()
  );

drop policy if exists "Administradores enviam arquivos do catalogo"
  on storage.objects;

create policy "Administradores enviam arquivos do catalogo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'catalogo-assets'
    and public.usuario_e_admin()
  );

drop policy if exists "Administradores atualizam arquivos do catalogo"
  on storage.objects;

create policy "Administradores atualizam arquivos do catalogo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'catalogo-assets'
    and public.usuario_e_admin()
  )
  with check (
    bucket_id = 'catalogo-assets'
    and public.usuario_e_admin()
  );

drop policy if exists "Administradores excluem arquivos do catalogo"
  on storage.objects;

create policy "Administradores excluem arquivos do catalogo"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'catalogo-assets'
    and public.usuario_e_admin()
  );

commit;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'catalogo-assets';
