-- Catálogo Honda 2.0
-- Entrega 19.4.3
-- Verificação da galeria de motos

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'moto_imagens'
order by ordinal_position;

select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'moto_imagens'
order by policyname;

select
  m.nome,
  count(mi.id) as total_imagens,
  count(mi.id) filter (where mi.ativo) as imagens_ativas,
  count(mi.id) filter (where mi.principal) as imagens_principais,
  max(mi.imagem_url) filter (where mi.principal) as imagem_principal
from public.motos m
left join public.moto_imagens mi
  on mi.moto_id = m.id
group by m.id, m.nome
order by m.ordem, m.nome;
