-- Catálogo Honda 2.0
-- Entrega 19.6.2
-- Verificação do enquadramento seguro

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clientes'
  and column_name in (
    'foto_posicao_x',
    'foto_posicao_y',
    'foto_desktop_posicao_x',
    'foto_desktop_posicao_y'
  )
order by column_name;

select
  routine_name,
  routine_type,
  security_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'atualizar_meu_enquadramento_cliente';

select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name =
    'atualizar_meu_enquadramento_cliente'
order by grantee;
