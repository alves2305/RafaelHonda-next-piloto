-- Catálogo Honda 2.0
-- Entrega 19.8
-- Assinaturas reais no Supabase, sem cobrança automática
--
-- O sistema não armazena cartão, CVV, chave Pix ou dados bancários.
-- O bloqueio do catálogo continua manual e controlado pelo administrador.

begin;

do $$
begin
  if to_regclass('public.clientes') is null then
    raise exception
      'Instalação interrompida: a tabela public.clientes não foi encontrada.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'Instalação interrompida: a função public.usuario_e_admin() não foi encontrada.';
  end if;

  if to_regclass('public.cliente_usuarios') is null then
    raise exception
      'Instalação interrompida: a estrutura de usuários dos vendedores não foi encontrada.';
  end if;
end
$$;

create table if not exists public.cliente_assinaturas (
  cliente_id uuid primary key
    references public.clientes(id)
    on delete cascade,

  valor_mensal numeric(10, 2) not null
    default 49.90
    check (valor_mensal >= 0 and valor_mensal <= 99999.99),

  dia_vencimento smallint not null
    default 10
    check (dia_vencimento between 1 and 28),

  dias_tolerancia smallint not null
    default 3
    check (dias_tolerancia between 0 and 30),

  status text not null
    default 'pendente'
    check (status in ('pago', 'pendente', 'atrasado')),

  referencia date not null
    default date_trunc('month', current_date)::date,

  forma_pagamento text null
    check (
      forma_pagamento is null
      or char_length(btrim(forma_pagamento)) between 2 and 80
    ),

  ultimo_pagamento_em date null,

  observacao text null
    check (
      observacao is null
      or char_length(observacao) <= 500
    ),

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.cliente_assinaturas is
  'Configuração e situação manual da mensalidade de cada catálogo. Não contém dados bancários.';

comment on column public.cliente_assinaturas.forma_pagamento is
  'Descrição não sensível, como Pix ou Cartão final 1234. Nunca armazene número completo ou CVV.';

create or replace function
  public.atualizar_data_cliente_assinatura()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end
$$;

revoke all
  on function public.atualizar_data_cliente_assinatura()
  from public;

drop trigger if exists
  cliente_assinaturas_atualizado_em
  on public.cliente_assinaturas;

create trigger
  cliente_assinaturas_atualizado_em
before update on public.cliente_assinaturas
for each row
execute function public.atualizar_data_cliente_assinatura();

insert into public.cliente_assinaturas (
  cliente_id,
  valor_mensal,
  dia_vencimento,
  dias_tolerancia,
  status,
  referencia
)
select
  c.id,
  49.90,
  10,
  3,
  'pendente',
  date_trunc('month', current_date)::date
from public.clientes c
on conflict (cliente_id) do nothing;

alter table public.cliente_assinaturas
  enable row level security;

drop policy if exists
  "Administradores consultam assinaturas"
  on public.cliente_assinaturas;

create policy
  "Administradores consultam assinaturas"
  on public.cliente_assinaturas
  for select
  to authenticated
  using (public.usuario_e_admin());

drop policy if exists
  "Administradores gerenciam assinaturas"
  on public.cliente_assinaturas;

create policy
  "Administradores gerenciam assinaturas"
  on public.cliente_assinaturas
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

revoke all
  on public.cliente_assinaturas
  from public, anon, authenticated;

grant select, insert, update, delete
  on public.cliente_assinaturas
  to authenticated;

create or replace function
  public.minha_assinatura_cliente()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_resultado jsonb;
begin
  select cu.cliente_id
  into v_cliente_id
  from public.cliente_usuarios cu
  where cu.user_id = (select auth.uid())
    and cu.ativo = true
  limit 1;

  if v_cliente_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Esta conta não possui uma assinatura vinculada.';
  end if;

  select jsonb_build_object(
    'clientId', c.id,
    'clientName', c.nome,
    'clientSlug', c.slug,
    'catalogActive', c.ativo,
    'monthlyAmount', coalesce(a.valor_mensal, 49.90),
    'dueDay', coalesce(a.dia_vencimento, 10),
    'graceDays', coalesce(a.dias_tolerancia, 3),
    'status', coalesce(a.status, 'pendente'),
    'reference',
      coalesce(
        a.referencia,
        date_trunc('month', current_date)::date
      ),
    'paymentMethod', a.forma_pagamento,
    'lastPaymentDate', a.ultimo_pagamento_em,
    'note', a.observacao,
    'updatedAt', a.atualizado_em
  )
  into v_resultado
  from public.clientes c
  left join public.cliente_assinaturas a
    on a.cliente_id = c.id
  where c.id = v_cliente_id;

  if v_resultado is null then
    raise exception
      'O catálogo vinculado não foi encontrado.';
  end if;

  return v_resultado;
end
$$;

create or replace function
  public.listar_assinaturas_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if not public.usuario_e_admin() then
    raise exception
      using
        errcode = '42501',
        message = 'Somente administradores podem consultar todas as assinaturas.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'clientId', c.id,
        'clientName', c.nome,
        'clientSlug', c.slug,
        'catalogActive', c.ativo,
        'monthlyAmount', coalesce(a.valor_mensal, 49.90),
        'dueDay', coalesce(a.dia_vencimento, 10),
        'graceDays', coalesce(a.dias_tolerancia, 3),
        'status', coalesce(a.status, 'pendente'),
        'reference',
          coalesce(
            a.referencia,
            date_trunc('month', current_date)::date
          ),
        'paymentMethod', a.forma_pagamento,
        'lastPaymentDate', a.ultimo_pagamento_em,
        'note', a.observacao,
        'updatedAt', a.atualizado_em
      )
      order by c.nome
    ),
    '[]'::jsonb
  )
  into v_resultado
  from public.clientes c
  left join public.cliente_assinaturas a
    on a.cliente_id = c.id;

  return v_resultado;
end
$$;

create or replace function
  public.salvar_assinatura_cliente(
    p_cliente_id uuid,
    p_valor_mensal numeric,
    p_dia_vencimento integer,
    p_dias_tolerancia integer,
    p_status text,
    p_referencia date,
    p_forma_pagamento text,
    p_ultimo_pagamento_em date,
    p_observacao text,
    p_catalogo_ativo boolean
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_forma_pagamento text;
  v_observacao text;
  v_resultado jsonb;
begin
  if not public.usuario_e_admin() then
    raise exception
      using
        errcode = '42501',
        message = 'Somente administradores podem alterar assinaturas.';
  end if;

  if not exists (
    select 1
    from public.clientes c
    where c.id = p_cliente_id
  ) then
    raise exception
      'O cliente informado não foi encontrado.';
  end if;

  if p_valor_mensal is null
     or p_valor_mensal < 0
     or p_valor_mensal > 99999.99 then
    raise exception
      'O valor mensal precisa estar entre R$ 0,00 e R$ 99.999,99.';
  end if;

  if p_dia_vencimento is null
     or p_dia_vencimento < 1
     or p_dia_vencimento > 28 then
    raise exception
      'O dia do vencimento precisa estar entre 1 e 28.';
  end if;

  if p_dias_tolerancia is null
     or p_dias_tolerancia < 0
     or p_dias_tolerancia > 30 then
    raise exception
      'Os dias de tolerância precisam estar entre 0 e 30.';
  end if;

  v_status := lower(btrim(coalesce(p_status, '')));

  if v_status not in ('pago', 'pendente', 'atrasado') then
    raise exception
      'O status da assinatura é inválido.';
  end if;

  if p_referencia is null then
    raise exception
      'Informe o mês de referência da cobrança.';
  end if;

  v_forma_pagamento := nullif(
    btrim(coalesce(p_forma_pagamento, '')),
    ''
  );

  if v_forma_pagamento is not null
     and char_length(v_forma_pagamento) > 80 then
    raise exception
      'A descrição da forma de pagamento pode ter no máximo 80 caracteres.';
  end if;

  v_observacao := nullif(
    btrim(coalesce(p_observacao, '')),
    ''
  );

  if v_observacao is not null
     and char_length(v_observacao) > 500 then
    raise exception
      'A observação pode ter no máximo 500 caracteres.';
  end if;

  insert into public.cliente_assinaturas (
    cliente_id,
    valor_mensal,
    dia_vencimento,
    dias_tolerancia,
    status,
    referencia,
    forma_pagamento,
    ultimo_pagamento_em,
    observacao
  )
  values (
    p_cliente_id,
    round(p_valor_mensal, 2),
    p_dia_vencimento,
    p_dias_tolerancia,
    v_status,
    date_trunc('month', p_referencia)::date,
    v_forma_pagamento,
    p_ultimo_pagamento_em,
    v_observacao
  )
  on conflict (cliente_id) do update set
    valor_mensal = excluded.valor_mensal,
    dia_vencimento = excluded.dia_vencimento,
    dias_tolerancia = excluded.dias_tolerancia,
    status = excluded.status,
    referencia = excluded.referencia,
    forma_pagamento = excluded.forma_pagamento,
    ultimo_pagamento_em = excluded.ultimo_pagamento_em,
    observacao = excluded.observacao;

  update public.clientes
  set ativo = coalesce(p_catalogo_ativo, ativo)
  where id = p_cliente_id;

  select jsonb_build_object(
    'clientId', c.id,
    'clientName', c.nome,
    'clientSlug', c.slug,
    'catalogActive', c.ativo,
    'monthlyAmount', a.valor_mensal,
    'dueDay', a.dia_vencimento,
    'graceDays', a.dias_tolerancia,
    'status', a.status,
    'reference', a.referencia,
    'paymentMethod', a.forma_pagamento,
    'lastPaymentDate', a.ultimo_pagamento_em,
    'note', a.observacao,
    'updatedAt', a.atualizado_em
  )
  into v_resultado
  from public.clientes c
  join public.cliente_assinaturas a
    on a.cliente_id = c.id
  where c.id = p_cliente_id;

  return v_resultado;
end
$$;

revoke all
  on function public.minha_assinatura_cliente()
  from public, anon, authenticated;

revoke all
  on function public.listar_assinaturas_admin()
  from public, anon, authenticated;

revoke all
  on function public.salvar_assinatura_cliente(
    uuid,
    numeric,
    integer,
    integer,
    text,
    date,
    text,
    date,
    text,
    boolean
  )
  from public, anon, authenticated;

grant execute
  on function public.minha_assinatura_cliente()
  to authenticated;

grant execute
  on function public.listar_assinaturas_admin()
  to authenticated;

grant execute
  on function public.salvar_assinatura_cliente(
    uuid,
    numeric,
    integer,
    integer,
    text,
    date,
    text,
    date,
    text,
    boolean
  )
  to authenticated;

commit;

select
  recurso,
  status
from (
  values
    (
      'cliente_assinaturas',
      case
        when to_regclass('public.cliente_assinaturas') is not null
          then 'OK'
        else 'ERRO'
      end
    ),
    (
      'minha_assinatura_cliente',
      case
        when to_regprocedure(
          'public.minha_assinatura_cliente()'
        ) is not null
          then 'OK'
        else 'ERRO'
      end
    ),
    (
      'listar_assinaturas_admin',
      case
        when to_regprocedure(
          'public.listar_assinaturas_admin()'
        ) is not null
          then 'OK'
        else 'ERRO'
      end
    ),
    (
      'salvar_assinatura_cliente',
      case
        when to_regprocedure(
          'public.salvar_assinatura_cliente(uuid,numeric,integer,integer,text,date,text,date,text,boolean)'
        ) is not null
          then 'OK'
        else 'ERRO'
      end
    )
) as verificacao(recurso, status);
