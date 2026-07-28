-- Catalogo Honda 2.0
-- Entrega 19.3
-- Verificacao do primeiro acesso real

select
  au.email,
  cu.user_id,
  cu.cliente_id,
  cu.nome as nome_usuario,
  cu.ativo as usuario_ativo,
  c.nome as cliente_nome,
  c.slug as cliente_slug,
  c.ativo as cliente_ativo,
  (cu.ativo and c.ativo) as acesso_liberado
from public.cliente_usuarios cu
join auth.users au
  on au.id = cu.user_id
join public.clientes c
  on c.id = cu.cliente_id
where c.slug = 'gd';

-- Teste administrativo opcional de bloqueio do painel:
--
-- update public.cliente_usuarios
-- set ativo = false
-- where cliente_id = (
--   select id
--   from public.clientes
--   where slug = 'gd'
-- );
--
-- Depois de testar, libere novamente:
--
-- update public.cliente_usuarios
-- set ativo = true
-- where cliente_id = (
--   select id
--   from public.clientes
--   where slug = 'gd'
-- );
