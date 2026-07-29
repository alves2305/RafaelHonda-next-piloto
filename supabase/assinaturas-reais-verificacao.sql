-- Catálogo Honda 2.0
-- Entrega 19.8
-- Verificação das assinaturas reais

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cliente_assinaturas'
order by ordinal_position;

select
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'cliente_assinaturas'
order by policyname;

select
  routine_name,
  routine_type,
  security_type,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'minha_assinatura_cliente',
    'listar_assinaturas_admin',
    'salvar_assinatura_cliente'
  )
order by routine_name;

select
  c.slug,
  c.ativo as catalogo_ativo,
  a.valor_mensal,
  a.dia_vencimento,
  a.dias_tolerancia,
  a.status,
  a.referencia,
  a.forma_pagamento,
  a.ultimo_pagamento_em
from public.clientes c
left join public.cliente_assinaturas a
  on a.cliente_id = c.id
order by c.slug;
