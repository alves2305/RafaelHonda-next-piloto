-- Catálogo Honda 2.0
-- Entrega 19.5
-- Verificação das métricas

select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'catalogo_visitas',
    'moto_acessos'
  )
order by table_name, ordinal_position;

select
  routine_name,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'registrar_acesso_catalogo',
    'metricas_catalogo_base',
    'minhas_metricas_catalogo',
    'metricas_catalogo_cliente'
  )
order by routine_name;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'catalogo_visitas',
    'moto_acessos'
  )
order by tablename, policyname;

select
  c.nome,
  count(distinct cv.id) as visitas,
  count(distinct cv.visitante_id) as visitantes_unicos,
  count(distinct ma.id) as acessos_motos
from public.clientes c
left join public.catalogo_visitas cv
  on cv.cliente_id = c.id
left join public.moto_acessos ma
  on ma.cliente_id = c.id
group by c.id, c.nome
order by c.nome;
