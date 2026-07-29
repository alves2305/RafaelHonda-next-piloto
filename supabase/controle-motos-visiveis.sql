-- Catálogo Honda 2.0
-- Entrega 19.7
-- Controle seguro das motos visíveis pelo vendedor
--
-- O administrador continua controlando cliente_motos.ativo.
-- O vendedor controla somente cliente_motos.vendedor_visivel.

begin;

do $$
begin
  if to_regclass('public.cliente_motos') is null then
    raise exception
      'Instalação interrompida: a tabela public.cliente_motos não foi encontrada.';
  end if;

  if to_regclass('public.motos') is null then
    raise exception
      'Instalação interrompida: a tabela public.motos não foi encontrada.';
  end if;

  if to_regprocedure('public.cliente_id_do_usuario()') is null then
    raise exception
      'Instalação interrompida: a estrutura de acesso do vendedor não foi encontrada.';
  end if;
end
$$;

alter table public.cliente_motos
  add column if not exists
    vendedor_visivel boolean
    not null
    default true;

comment on column
  public.cliente_motos.vendedor_visivel
is
  'Permite ao vendedor ocultar uma moto já liberada pelo administrador sem remover a atribuição.';

update public.cliente_motos
set vendedor_visivel = true
where vendedor_visivel is null;

create or replace function
  public.atualizar_visibilidade_minhas_motos(
    p_moto_ids uuid[]
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_moto_ids uuid[];
  v_visiveis integer;
  v_liberadas integer;
  v_resultado jsonb;
begin
  v_cliente_id :=
    public.cliente_id_do_usuario();

  if v_cliente_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Esta conta não possui acesso ativo a um catálogo.';
  end if;

  select coalesce(
    array_agg(distinct item),
    '{}'::uuid[]
  )
  into v_moto_ids
  from unnest(
    coalesce(p_moto_ids, '{}'::uuid[])
  ) as item;

  select count(*)
  into v_liberadas
  from public.cliente_motos cm
  join public.motos m
    on m.id = cm.moto_id
  where cm.cliente_id = v_cliente_id
    and cm.ativo = true
    and m.ativo = true;

  if v_liberadas = 0 then
    raise exception
      'Nenhuma moto ativa foi liberada pelo administrador.';
  end if;

  if cardinality(v_moto_ids) = 0 then
    raise exception
      'Mantenha pelo menos uma moto visível no catálogo.';
  end if;

  if exists (
    select 1
    from unnest(v_moto_ids) as requested(moto_id)
    where not exists (
      select 1
      from public.cliente_motos cm
      join public.motos m
        on m.id = cm.moto_id
      where cm.cliente_id = v_cliente_id
        and cm.moto_id = requested.moto_id
        and cm.ativo = true
        and m.ativo = true
    )
  ) then
    raise exception
      using
        errcode = '42501',
        message = 'Uma ou mais motos informadas não foram liberadas para este catálogo.';
  end if;

  update public.cliente_motos cm
  set vendedor_visivel =
    cm.moto_id = any(v_moto_ids)
  where cm.cliente_id = v_cliente_id
    and cm.ativo = true;

  select count(*)
  into v_visiveis
  from public.cliente_motos cm
  join public.motos m
    on m.id = cm.moto_id
  where cm.cliente_id = v_cliente_id
    and cm.ativo = true
    and cm.vendedor_visivel = true
    and m.ativo = true;

  select jsonb_build_object(
    'clientId',
      v_cliente_id,
    'visibleMotorcycleIds',
      coalesce(
        (
          select jsonb_agg(
            cm.moto_id
            order by cm.ordem, cm.moto_id
          )
          from public.cliente_motos cm
          join public.motos m
            on m.id = cm.moto_id
          where cm.cliente_id = v_cliente_id
            and cm.ativo = true
            and cm.vendedor_visivel = true
            and m.ativo = true
        ),
        '[]'::jsonb
      ),
    'visibleCount',
      v_visiveis,
    'assignedCount',
      v_liberadas
  )
  into v_resultado;

  return v_resultado;
end
$$;

revoke all
  on function
    public.atualizar_visibilidade_minhas_motos(
      uuid[]
    )
  from public, anon, authenticated;

grant execute
  on function
    public.atualizar_visibilidade_minhas_motos(
      uuid[]
    )
  to authenticated;

commit;

select
  recurso,
  status
from (
  values
    (
      'cliente_motos.vendedor_visivel',
      case
        when exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'cliente_motos'
            and column_name =
              'vendedor_visivel'
        )
          then 'OK'
        else 'ERRO'
      end
    ),
    (
      'atualizar_visibilidade_minhas_motos',
      case
        when to_regprocedure(
          'public.atualizar_visibilidade_minhas_motos(uuid[])'
        ) is not null
          then 'OK'
        else 'ERRO'
      end
    )
) as verificacao(recurso, status);
