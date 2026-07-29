-- Catálogo Honda 2.0
-- Entrega 19.6
-- Verificação da edição segura do perfil

select
  routine_name,
  routine_type,
  security_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'atualizar_meu_perfil_cliente';

select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'atualizar_meu_perfil_cliente'
order by grantee;

select
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'clientes'
order by policyname;
