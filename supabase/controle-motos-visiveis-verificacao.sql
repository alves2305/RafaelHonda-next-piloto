-- Catálogo Honda 2.0
-- Entrega 19.7
-- Verificação do controle de motos visíveis

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cliente_motos'
  and column_name = 'vendedor_visivel';

select
  routine_name,
  routine_type,
  security_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name =
    'atualizar_visibilidade_minhas_motos';

select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name =
    'atualizar_visibilidade_minhas_motos'
order by grantee;

select
  c.slug,
  count(*) filter (
    where cm.ativo = true
  ) as liberadas_admin,
  count(*) filter (
    where cm.ativo = true
      and cm.vendedor_visivel = true
  ) as visiveis_vendedor,
  count(*) filter (
    where cm.ativo = true
      and cm.vendedor_visivel = false
  ) as ocultas_vendedor
from public.clientes c
left join public.cliente_motos cm
  on cm.cliente_id = c.id
group by c.id, c.slug
order by c.slug;
