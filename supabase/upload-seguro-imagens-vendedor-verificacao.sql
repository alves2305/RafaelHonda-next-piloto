-- Catálogo Honda 2.0
-- Entrega 19.6.1
-- Verificação do upload seguro

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'catalogo-assets';

select
  policyname,
  roles,
  cmd,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Administradores enviam arquivos do catalogo',
    'Vendedores enviam imagens do proprio perfil'
  )
order by policyname;

select
  routine_name,
  routine_type,
  security_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'atualizar_minhas_imagens_cliente';

select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name =
    'atualizar_minhas_imagens_cliente'
order by grantee;
