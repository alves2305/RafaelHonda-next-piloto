-- Catálogo Honda 2.0
-- Fase 3 / Entrega 9.1
-- Modalidades comercializadas por vendedor
--
-- Esta migração preserva todos os clientes atuais como:
-- Consórcio e financiamento.

begin;

alter table public.clientes
  add column if not exists vende_consorcio boolean not null default true;

alter table public.clientes
  add column if not exists vende_financiamento boolean not null default true;

update public.clientes
set
  vende_consorcio = coalesce(vende_consorcio, true),
  vende_financiamento = coalesce(vende_financiamento, true);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_modalidades_check'
      and conrelid = 'public.clientes'::regclass
  ) then
    alter table public.clientes
      add constraint clientes_modalidades_check
      check (vende_consorcio or vende_financiamento);
  end if;
end
$$;

commit;

-- Verificação:
select
  nome,
  slug,
  vende_consorcio,
  vende_financiamento
from public.clientes
order by nome;
