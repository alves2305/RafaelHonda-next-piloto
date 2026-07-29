-- Catálogo Honda 2.0
-- Entrega 19.5
-- Visitas, visitantes anônimos e motos mais acessadas
--
-- Execute no mesmo Supabase usado pelo Catálogo Honda.

begin;

do $$
begin
  if to_regclass('public.clientes') is null then
    raise exception
      'Instalação interrompida: a tabela public.clientes não foi encontrada.';
  end if;

  if to_regclass('public.motos') is null then
    raise exception
      'Instalação interrompida: a tabela public.motos não foi encontrada.';
  end if;

  if to_regclass('public.cliente_motos') is null then
    raise exception
      'Instalação interrompida: a tabela public.cliente_motos não foi encontrada.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'Instalação interrompida: a função public.usuario_e_admin() não foi encontrada.';
  end if;

  if to_regprocedure('public.cliente_id_do_usuario()') is null then
    raise exception
      'Instalação interrompida: a estrutura do painel do vendedor não foi encontrada.';
  end if;
end
$$;

create table if not exists public.catalogo_visitas (
  id bigint generated always as identity primary key,

  cliente_id uuid not null
    references public.clientes(id) on delete cascade,

  visitante_id uuid not null,
  sessao_id uuid not null,

  pagina_inicial text not null default '/'
    check (
      char_length(pagina_inicial) between 1 and 500
    ),

  criado_em timestamptz not null default now(),
  ultima_atividade_em timestamptz not null default now(),

  unique (cliente_id, sessao_id)
);

create table if not exists public.moto_acessos (
  id bigint generated always as identity primary key,

  cliente_id uuid not null
    references public.clientes(id) on delete cascade,

  moto_id uuid not null
    references public.motos(id) on delete cascade,

  visitante_id uuid not null,
  sessao_id uuid not null,

  origem text not null default 'moto'
    check (
      origem in ('moto', 'consorcio', 'financiamento')
    ),

  criado_em timestamptz not null default now(),

  unique (cliente_id, moto_id, sessao_id)
);

create index if not exists catalogo_visitas_cliente_data_idx
  on public.catalogo_visitas (cliente_id, criado_em desc);

create index if not exists catalogo_visitas_cliente_visitante_idx
  on public.catalogo_visitas (cliente_id, visitante_id);

create index if not exists moto_acessos_cliente_data_idx
  on public.moto_acessos (cliente_id, criado_em desc);

create index if not exists moto_acessos_cliente_moto_data_idx
  on public.moto_acessos (cliente_id, moto_id, criado_em desc);

alter table public.catalogo_visitas enable row level security;
alter table public.moto_acessos enable row level security;

drop policy if exists
  "Administradores consultam visitas dos catalogos"
  on public.catalogo_visitas;

create policy
  "Administradores consultam visitas dos catalogos"
  on public.catalogo_visitas
  for select
  to authenticated
  using (
    public.usuario_e_admin()
  );

drop policy if exists
  "Administradores consultam acessos das motos"
  on public.moto_acessos;

create policy
  "Administradores consultam acessos das motos"
  on public.moto_acessos
  for select
  to authenticated
  using (
    public.usuario_e_admin()
  );

revoke all
  on table public.catalogo_visitas
  from public, anon, authenticated;

revoke all
  on table public.moto_acessos
  from public, anon, authenticated;

grant select
  on table public.catalogo_visitas
  to authenticated;

grant select
  on table public.moto_acessos
  to authenticated;

create or replace function public.registrar_acesso_catalogo(
  p_cliente_id uuid,
  p_visitante_id uuid,
  p_sessao_id uuid,
  p_caminho text,
  p_moto_slug text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moto_id uuid;
  v_origem text;
  v_caminho text;
begin
  if p_cliente_id is null
     or p_visitante_id is null
     or p_sessao_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.clientes c
    where c.id = p_cliente_id
      and c.ativo = true
  ) then
    return false;
  end if;

  v_caminho := left(
    coalesce(nullif(btrim(p_caminho), ''), '/'),
    500
  );

  insert into public.catalogo_visitas (
    cliente_id,
    visitante_id,
    sessao_id,
    pagina_inicial,
    ultima_atividade_em
  )
  values (
    p_cliente_id,
    p_visitante_id,
    p_sessao_id,
    v_caminho,
    now()
  )
  on conflict (cliente_id, sessao_id)
  do update set
    ultima_atividade_em = excluded.ultima_atividade_em;

  if nullif(btrim(p_moto_slug), '') is null then
    return true;
  end if;

  select m.id
    into v_moto_id
  from public.motos m
  join public.cliente_motos cm
    on cm.moto_id = m.id
  where cm.cliente_id = p_cliente_id
    and cm.ativo = true
    and m.ativo = true
    and m.slug = lower(btrim(p_moto_slug))
  limit 1;

  if v_moto_id is null then
    return true;
  end if;

  v_origem := case
    when v_caminho like '%/consorcio/%'
      then 'consorcio'
    when v_caminho like '%/financiamento/%'
      then 'financiamento'
    else 'moto'
  end;

  insert into public.moto_acessos (
    cliente_id,
    moto_id,
    visitante_id,
    sessao_id,
    origem
  )
  values (
    p_cliente_id,
    v_moto_id,
    p_visitante_id,
    p_sessao_id,
    v_origem
  )
  on conflict (cliente_id, moto_id, sessao_id)
  do nothing;

  return true;
end
$$;

create or replace function public.metricas_catalogo_base(
  p_cliente_id uuid,
  p_dias integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inicio timestamptz;
  v_total_visitas bigint;
  v_visitantes_unicos bigint;
  v_acessos_motos bigint;
  v_ranking jsonb;
  v_ultima_visita timestamptz;
begin
  if p_cliente_id is null then
    raise exception 'Cliente não informado.';
  end if;

  if p_dias is null or p_dias <= 0 then
    v_inicio := null;
  else
    v_inicio := now() - make_interval(days => p_dias);
  end if;

  select
    count(*)::bigint,
    count(distinct cv.visitante_id)::bigint,
    max(cv.criado_em)
  into
    v_total_visitas,
    v_visitantes_unicos,
    v_ultima_visita
  from public.catalogo_visitas cv
  where cv.cliente_id = p_cliente_id
    and (
      v_inicio is null
      or cv.criado_em >= v_inicio
    );

  select count(*)::bigint
    into v_acessos_motos
  from public.moto_acessos ma
  where ma.cliente_id = p_cliente_id
    and (
      v_inicio is null
      or ma.criado_em >= v_inicio
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'motorcycleId', ranking.moto_id,
        'name', ranking.nome,
        'slug', ranking.slug,
        'imageUrl', ranking.imagem_url,
        'views', ranking.acessos,
        'uniqueVisitors', ranking.visitantes
      )
      order by
        ranking.acessos desc,
        ranking.visitantes desc,
        ranking.nome asc
    ),
    '[]'::jsonb
  )
  into v_ranking
  from (
    select
      m.id as moto_id,
      m.nome,
      m.slug,
      m.imagem_url,
      count(ma.id)::bigint as acessos,
      count(distinct ma.visitante_id)::bigint
        as visitantes
    from public.moto_acessos ma
    join public.motos m
      on m.id = ma.moto_id
    where ma.cliente_id = p_cliente_id
      and (
        v_inicio is null
        or ma.criado_em >= v_inicio
      )
    group by
      m.id,
      m.nome,
      m.slug,
      m.imagem_url
    order by
      acessos desc,
      visitantes desc,
      m.nome asc
    limit 5
  ) ranking;

  return jsonb_build_object(
    'clientId', p_cliente_id,
    'periodDays', coalesce(p_dias, 0),
    'totalVisits', coalesce(v_total_visitas, 0),
    'uniqueVisitors', coalesce(v_visitantes_unicos, 0),
    'motorcycleViews', coalesce(v_acessos_motos, 0),
    'topMotorcycle',
      case
        when jsonb_array_length(v_ranking) > 0
          then v_ranking -> 0
        else null
      end,
    'ranking', v_ranking,
    'lastVisitAt', v_ultima_visita
  );
end
$$;

create or replace function public.minhas_metricas_catalogo(
  p_dias integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
begin
  v_cliente_id := public.cliente_id_do_usuario();

  if v_cliente_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Esta conta não possui acesso ativo a um catálogo.';
  end if;

  return public.metricas_catalogo_base(
    v_cliente_id,
    p_dias
  );
end
$$;

create or replace function public.metricas_catalogo_cliente(
  p_cliente_id uuid,
  p_dias integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.usuario_e_admin() then
    raise exception
      using
        errcode = '42501',
        message = 'Somente administradores podem consultar métricas de outros clientes.';
  end if;

  return public.metricas_catalogo_base(
    p_cliente_id,
    p_dias
  );
end
$$;

revoke all
  on function public.registrar_acesso_catalogo(
    uuid,
    uuid,
    uuid,
    text,
    text
  )
  from public, anon, authenticated;

revoke all
  on function public.metricas_catalogo_base(
    uuid,
    integer
  )
  from public, anon, authenticated;

revoke all
  on function public.minhas_metricas_catalogo(integer)
  from public, anon, authenticated;

revoke all
  on function public.metricas_catalogo_cliente(
    uuid,
    integer
  )
  from public, anon, authenticated;

grant execute
  on function public.registrar_acesso_catalogo(
    uuid,
    uuid,
    uuid,
    text,
    text
  )
  to anon, authenticated;

grant execute
  on function public.minhas_metricas_catalogo(integer)
  to authenticated;

grant execute
  on function public.metricas_catalogo_cliente(
    uuid,
    integer
  )
  to authenticated;

commit;

select
  'catalogo_visitas' as recurso,
  case
    when to_regclass('public.catalogo_visitas') is not null
      then 'OK'
    else 'ERRO'
  end as status

union all

select
  'moto_acessos',
  case
    when to_regclass('public.moto_acessos') is not null
      then 'OK'
    else 'ERRO'
  end

union all

select
  'registrar_acesso_catalogo',
  case
    when to_regprocedure(
      'public.registrar_acesso_catalogo(uuid,uuid,uuid,text,text)'
    ) is not null
      then 'OK'
    else 'ERRO'
  end

union all

select
  'minhas_metricas_catalogo',
  case
    when to_regprocedure(
      'public.minhas_metricas_catalogo(integer)'
    ) is not null
      then 'OK'
    else 'ERRO'
  end

union all

select
  'metricas_catalogo_cliente',
  case
    when to_regprocedure(
      'public.metricas_catalogo_cliente(uuid,integer)'
    ) is not null
      then 'OK'
    else 'ERRO'
  end;
