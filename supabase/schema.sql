-- Catálogo Honda centralizado
-- Execute este arquivo no SQL Editor de um projeto novo do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  foto_url text not null,
  foto_desktop_url text,
  logo_url text,
  whatsapp text not null,
  instagram_url text,
  slogan text not null,
  cor_primaria text not null default '#d90000',
  cor_secundaria text not null default '#1d2b45',
  marca_dagua_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.motos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nome text not null,
  categoria text not null,
  imagem_url text not null,
  selo text,
  titulo_descricao text not null,
  descricao text not null,
  detalhes jsonb not null default '[]'::jsonb
    check (jsonb_typeof(detalhes) = 'array'),
  beneficios jsonb not null default '[]'::jsonb
    check (jsonb_typeof(beneficios) = 'array'),
  titulo_consorcio text not null default 'Planos sem emplacamento',
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists public.cliente_motos (
  cliente_id uuid not null
    references public.clientes(id) on delete cascade,
  moto_id uuid not null
    references public.motos(id) on delete cascade,
  ativo boolean not null default true,
  ordem integer not null default 0,
  primary key (cliente_id, moto_id)
);

create table if not exists public.planos_consorcio (
  id uuid primary key default gen_random_uuid(),
  moto_id uuid not null
    references public.motos(id) on delete cascade,
  parcelas integer not null check (parcelas > 0),
  valor_parcela numeric(12, 2) not null check (valor_parcela > 0),
  destaque boolean not null default false,
  ordem integer not null default 0,
  ativo boolean not null default true,
  unique (moto_id, parcelas)
);

create table if not exists public.informacoes_financiamento (
  id uuid primary key default gen_random_uuid(),
  moto_id uuid not null unique
    references public.motos(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  observacao text not null,
  ativo boolean not null default true
);

create index if not exists cliente_motos_cliente_ordem_idx
  on public.cliente_motos (cliente_id, ativo, ordem);

create index if not exists planos_consorcio_moto_ordem_idx
  on public.planos_consorcio (moto_id, ativo, ordem);

alter table public.clientes enable row level security;
alter table public.motos enable row level security;
alter table public.cliente_motos enable row level security;
alter table public.planos_consorcio enable row level security;
alter table public.informacoes_financiamento enable row level security;

drop policy if exists "Leitura publica de clientes" on public.clientes;
create policy "Leitura publica de clientes"
  on public.clientes for select
  to anon, authenticated
  using (true);

drop policy if exists "Leitura publica de motos" on public.motos;
create policy "Leitura publica de motos"
  on public.motos for select
  to anon, authenticated
  using (true);

drop policy if exists "Leitura publica das motos dos clientes"
  on public.cliente_motos;
create policy "Leitura publica das motos dos clientes"
  on public.cliente_motos for select
  to anon, authenticated
  using (true);

drop policy if exists "Leitura publica dos planos"
  on public.planos_consorcio;
create policy "Leitura publica dos planos"
  on public.planos_consorcio for select
  to anon, authenticated
  using (true);

drop policy if exists "Leitura publica do financiamento"
  on public.informacoes_financiamento;
create policy "Leitura publica do financiamento"
  on public.informacoes_financiamento for select
  to anon, authenticated
  using (true);

grant select on
  public.clientes,
  public.motos,
  public.cliente_motos,
  public.planos_consorcio,
  public.informacoes_financiamento
to anon, authenticated;

-- Cliente piloto

insert into public.clientes (
  id,
  nome,
  slug,
  foto_url,
  foto_desktop_url,
  logo_url,
  whatsapp,
  instagram_url,
  slogan,
  cor_primaria,
  cor_secundaria,
  marca_dagua_url,
  ativo
) values (
  '11111111-1111-4111-8111-111111111111',
  'Rafael Honda',
  'rafael',
  '/assets/perfis/rafael-mobile.svg',
  '/assets/perfis/rafael-desktop.svg',
  '/assets/marca/tropical-motos.svg',
  '5574999679596',
  'https://www.instagram.com/rafael.honda.a?igsh=MXA4MGhqN3Fuc2Yzbg==',
  'Não importa o quão alto seja o seu sonho, a gente chega lá!',
  '#d90000',
  '#1d2b45',
  '/assets/marca/tropical-motos.svg',
  true
)
on conflict (slug) do update set
  nome = excluded.nome,
  foto_url = excluded.foto_url,
  foto_desktop_url = excluded.foto_desktop_url,
  logo_url = excluded.logo_url,
  whatsapp = excluded.whatsapp,
  instagram_url = excluded.instagram_url,
  slogan = excluded.slogan,
  cor_primaria = excluded.cor_primaria,
  cor_secundaria = excluded.cor_secundaria,
  marca_dagua_url = excluded.marca_dagua_url;

-- Duas motos do piloto

insert into public.motos (
  id,
  slug,
  nome,
  categoria,
  imagem_url,
  selo,
  titulo_descricao,
  descricao,
  detalhes,
  beneficios,
  ativo,
  ordem
) values
(
  '22222222-2222-4222-8222-222222222221',
  'pop-110i-es',
  'POP 110i ES',
  'Econômica • Urbana • Honda',
  '/assets/motos/pop-110i-es.svg',
  'NOVA LINHA 2027',
  'A moto perfeita para o dia a dia',
  'A Honda POP 110i ES 2027 foi desenvolvida para oferecer economia, praticidade e conforto para quem precisa de mobilidade todos os dias. Com partida elétrica, excelente consumo e manutenção econômica, ela é ideal tanto para trabalho quanto para uso pessoal.',
  '[
    {"rotulo": "Motor", "valor": "109,5 cc"},
    {"rotulo": "Partida", "valor": "Elétrica"},
    {"rotulo": "Combustível", "valor": "Flex"},
    {"rotulo": "Consumo", "valor": "Até 49 km/l"}
  ]'::jsonb,
  '[
    {"titulo": "Super econômica", "descricao": "Consumo de até 49 km/l.", "icone": "economia"},
    {"titulo": "Partida elétrica", "descricao": "Mais praticidade no dia a dia.", "icone": "praticidade"},
    {"titulo": "Ideal para a cidade", "descricao": "Leve, confortável e fácil de pilotar.", "icone": "conforto"}
  ]'::jsonb,
  true,
  1
),
(
  '22222222-2222-4222-8222-222222222222',
  'biz-125-es',
  'BIZ 125 ES',
  'Praticidade • Economia • Honda',
  '/assets/motos/biz-125-es.svg',
  'NOVA LINHA 2027',
  'Mais praticidade para o seu dia',
  'A Honda BIZ 125 ES 2027 combina conforto, economia e praticidade para quem busca mobilidade urbana com estilo. Com excelente consumo, espaço interno e pilotagem confortável, ela é perfeita para o trabalho, estudos e rotina diária.',
  '[
    {"rotulo": "Motor", "valor": "123,9 cc"},
    {"rotulo": "Partida", "valor": "Elétrica"},
    {"rotulo": "Combustível", "valor": "Flex"},
    {"rotulo": "Consumo", "valor": "Até 62 km/l"}
  ]'::jsonb,
  '[
    {"titulo": "Baixo consumo", "descricao": "Economia para o dia a dia.", "icone": "economia"},
    {"titulo": "Porta-objetos", "descricao": "Mais praticidade e espaço.", "icone": "praticidade"},
    {"titulo": "Confortável", "descricao": "Ideal para trajetos urbanos.", "icone": "conforto"}
  ]'::jsonb,
  true,
  2
)
on conflict (slug) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  imagem_url = excluded.imagem_url,
  selo = excluded.selo,
  titulo_descricao = excluded.titulo_descricao,
  descricao = excluded.descricao,
  detalhes = excluded.detalhes,
  beneficios = excluded.beneficios,
  ativo = excluded.ativo,
  ordem = excluded.ordem;

insert into public.cliente_motos (cliente_id, moto_id, ativo, ordem) values
  (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    true,
    1
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    true,
    2
  )
on conflict (cliente_id, moto_id) do update set
  ativo = excluded.ativo,
  ordem = excluded.ordem;

insert into public.planos_consorcio (
  id,
  moto_id,
  parcelas,
  valor_parcela,
  destaque,
  ordem,
  ativo
) values
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222221', 80, 197.73, true, 1, true),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222221', 60, 256.10, false, 2, true),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222221', 48, 315.44, false, 3, true),
  ('33333333-3333-4333-8333-333333333314', '22222222-2222-4222-8222-222222222221', 36, 415.57, false, 4, true),
  ('33333333-3333-4333-8333-333333333315', '22222222-2222-4222-8222-222222222221', 24, 611.24, false, 5, true),
  ('33333333-3333-4333-8333-333333333316', '22222222-2222-4222-8222-222222222221', 18, 810.27, false, 6, true),
  ('33333333-3333-4333-8333-333333333317', '22222222-2222-4222-8222-222222222221', 12, 1208.34, false, 7, true),
  ('33333333-3333-4333-8333-333333333321', '22222222-2222-4222-8222-222222222222', 80, 251.87, true, 1, true),
  ('33333333-3333-4333-8333-333333333322', '22222222-2222-4222-8222-222222222222', 60, 326.23, false, 2, true),
  ('33333333-3333-4333-8333-333333333323', '22222222-2222-4222-8222-222222222222', 48, 401.83, false, 3, true),
  ('33333333-3333-4333-8333-333333333324', '22222222-2222-4222-8222-222222222222', 36, 529.38, false, 4, true),
  ('33333333-3333-4333-8333-333333333325', '22222222-2222-4222-8222-222222222222', 24, 778.64, false, 5, true),
  ('33333333-3333-4333-8333-333333333326', '22222222-2222-4222-8222-222222222222', 18, 1032.17, false, 6, true),
  ('33333333-3333-4333-8333-333333333327', '22222222-2222-4222-8222-222222222222', 12, 1539.25, false, 7, true)
on conflict (moto_id, parcelas) do update set
  valor_parcela = excluded.valor_parcela,
  destaque = excluded.destaque,
  ordem = excluded.ordem,
  ativo = excluded.ativo;

insert into public.informacoes_financiamento (
  id,
  moto_id,
  titulo,
  descricao,
  observacao,
  ativo
) values
  (
    '44444444-4444-4444-8444-444444444441',
    '22222222-2222-4222-8222-222222222221',
    'Solicite sua simulação',
    'Preencha seus dados abaixo para receber uma simulação personalizada de financiamento.',
    'A aprovação está sujeita à análise de crédito da instituição financeira.',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    '22222222-2222-4222-8222-222222222222',
    'Solicite sua simulação',
    'Preencha seus dados abaixo para receber uma simulação personalizada de financiamento.',
    'A aprovação está sujeita à análise de crédito da instituição financeira.',
    true
  )
on conflict (moto_id) do update set
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  observacao = excluded.observacao,
  ativo = excluded.ativo;

-- Bloqueio manual:
-- update public.clientes set ativo = false where slug = 'rafael';
--
-- Reativação:
-- update public.clientes set ativo = true where slug = 'rafael';
