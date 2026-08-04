-- Catálogo Honda 2.0
-- Entrega 19.12
-- Pagamentos de mensalidade com InfinitePay
--
-- Execute no SQL Editor do mesmo projeto Supabase utilizado pelo catálogo.
-- Esta estrutura não armazena número de cartão, CVV, senha ou chave Pix.

begin;

do $$
begin
  if to_regclass('public.clientes') is null then
    raise exception
      'Instalação interrompida: a tabela public.clientes não foi encontrada.';
  end if;

  if to_regclass('public.cliente_assinaturas') is null then
    raise exception
      'Instalação interrompida: execute primeiro a Entrega 19.8 de assinaturas.';
  end if;
end
$$;

create table if not exists public.cliente_pagamentos (
  id uuid primary key default gen_random_uuid(),

  cliente_id uuid not null
    references public.clientes(id)
    on delete cascade,

  order_nsu text not null unique
    check (char_length(order_nsu) between 10 and 120),

  referencia date not null,

  valor_centavos integer not null
    check (valor_centavos > 0),

  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'erro', 'cancelado')),

  checkout_url text null,
  invoice_slug text null,
  transaction_nsu text null unique,
  capture_method text null,
  paid_amount_centavos integer null
    check (
      paid_amount_centavos is null
      or paid_amount_centavos >= 0
    ),
  receipt_url text null,
  erro_mensagem text null
    check (
      erro_mensagem is null
      or char_length(erro_mensagem) <= 500
    ),

  pago_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.cliente_pagamentos is
  'Tentativas e confirmações de mensalidades via InfinitePay. Não contém dados sensíveis de cartão ou Pix.';

create index if not exists
  cliente_pagamentos_cliente_referencia_idx
  on public.cliente_pagamentos(cliente_id, referencia desc);

create index if not exists
  cliente_pagamentos_status_idx
  on public.cliente_pagamentos(status);

create or replace function
  public.atualizar_data_cliente_pagamento()
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
  on function public.atualizar_data_cliente_pagamento()
  from public;

drop trigger if exists
  cliente_pagamentos_atualizado_em
  on public.cliente_pagamentos;

create trigger
  cliente_pagamentos_atualizado_em
before update on public.cliente_pagamentos
for each row
execute function public.atualizar_data_cliente_pagamento();

alter table public.cliente_pagamentos
  enable row level security;

revoke all
  on public.cliente_pagamentos
  from public, anon, authenticated;

grant select, insert, update
  on public.cliente_pagamentos
  to service_role;

create or replace function
  public.confirmar_pagamento_infinitepay(
    p_order_nsu text,
    p_transaction_nsu text,
    p_invoice_slug text,
    p_capture_method text,
    p_amount integer,
    p_paid_amount integer,
    p_receipt_url text
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pagamento public.cliente_pagamentos%rowtype;
  v_forma_pagamento text;
begin
  if p_order_nsu is null or btrim(p_order_nsu) = '' then
    raise exception 'O número do pedido é obrigatório.';
  end if;

  if p_transaction_nsu is null or btrim(p_transaction_nsu) = '' then
    raise exception 'A identificação da transação é obrigatória.';
  end if;

  if p_invoice_slug is null or btrim(p_invoice_slug) = '' then
    raise exception 'A identificação da fatura é obrigatória.';
  end if;

  select *
  into v_pagamento
  from public.cliente_pagamentos
  where order_nsu = btrim(p_order_nsu)
  for update;

  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  if v_pagamento.status = 'pago' then
    return jsonb_build_object(
      'paid', true,
      'alreadyConfirmed', true,
      'clientId', v_pagamento.cliente_id
    );
  end if;

  if p_amount is null or p_amount <> v_pagamento.valor_centavos then
    raise exception
      'O valor confirmado não corresponde ao valor registrado.';
  end if;

  v_forma_pagamento :=
    case lower(btrim(coalesce(p_capture_method, '')))
      when 'pix' then 'Pix — InfinitePay'
      when 'credit_card' then 'Cartão — InfinitePay'
      else 'InfinitePay'
    end;

  update public.cliente_pagamentos
  set
    status = 'pago',
    invoice_slug = btrim(p_invoice_slug),
    transaction_nsu = btrim(p_transaction_nsu),
    capture_method = nullif(btrim(coalesce(p_capture_method, '')), ''),
    paid_amount_centavos = greatest(coalesce(p_paid_amount, p_amount), 0),
    receipt_url = nullif(btrim(coalesce(p_receipt_url, '')), ''),
    erro_mensagem = null,
    pago_em = now()
  where id = v_pagamento.id;

  update public.cliente_assinaturas
  set
    status = 'pago',
    forma_pagamento = v_forma_pagamento,
    ultimo_pagamento_em = current_date
  where cliente_id = v_pagamento.cliente_id;

  update public.clientes
  set ativo = true
  where id = v_pagamento.cliente_id;

  return jsonb_build_object(
    'paid', true,
    'alreadyConfirmed', false,
    'clientId', v_pagamento.cliente_id,
    'reference', v_pagamento.referencia,
    'paymentMethod', v_forma_pagamento
  );
end
$$;

revoke all
  on function public.confirmar_pagamento_infinitepay(
    text,
    text,
    text,
    text,
    integer,
    integer,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.confirmar_pagamento_infinitepay(
    text,
    text,
    text,
    text,
    integer,
    integer,
    text
  )
  to service_role;

commit;
