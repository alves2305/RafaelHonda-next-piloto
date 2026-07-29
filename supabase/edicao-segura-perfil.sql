-- Catálogo Honda 2.0
-- Entrega 19.6
-- Edição segura do próprio perfil pelo vendedor
--
-- Esta função permite alterar somente campos públicos autorizados.
-- Não libera UPDATE direto na tabela clientes.

begin;

do $$
begin
  if to_regclass('public.clientes') is null then
    raise exception
      'Instalação interrompida: a tabela public.clientes não foi encontrada.';
  end if;

  if to_regprocedure('public.cliente_id_do_usuario()') is null then
    raise exception
      'Instalação interrompida: a estrutura de acesso do vendedor não foi encontrada.';
  end if;
end
$$;

create or replace function public.atualizar_meu_perfil_cliente(
  p_nome text,
  p_whatsapp text,
  p_instagram_url text,
  p_slogan text,
  p_cor_primaria text,
  p_cor_secundaria text,
  p_vende_consorcio boolean,
  p_vende_financiamento boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_nome text;
  v_whatsapp text;
  v_instagram_url text;
  v_slogan text;
  v_cor_primaria text;
  v_cor_secundaria text;
  v_resultado jsonb;
begin
  v_cliente_id := public.cliente_id_do_usuario();

  if v_cliente_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Esta conta não possui acesso ativo a um catálogo.';
  end if;

  v_nome := btrim(coalesce(p_nome, ''));
  v_whatsapp := regexp_replace(
    coalesce(p_whatsapp, ''),
    '[^0-9]',
    '',
    'g'
  );
  v_instagram_url := nullif(
    btrim(coalesce(p_instagram_url, '')),
    ''
  );
  v_slogan := btrim(coalesce(p_slogan, ''));
  v_cor_primaria := lower(
    btrim(coalesce(p_cor_primaria, ''))
  );
  v_cor_secundaria := lower(
    btrim(coalesce(p_cor_secundaria, ''))
  );

  if char_length(v_nome) < 2
     or char_length(v_nome) > 120 then
    raise exception
      'O nome precisa ter entre 2 e 120 caracteres.';
  end if;

  if char_length(v_whatsapp) < 10
     or char_length(v_whatsapp) > 13 then
    raise exception
      'Informe um WhatsApp válido com DDD e código do país.';
  end if;

  if char_length(v_slogan) < 2
     or char_length(v_slogan) > 500 then
    raise exception
      'O slogan precisa ter entre 2 e 500 caracteres.';
  end if;

  if v_instagram_url is not null
     and v_instagram_url !~* '^https://(www\.)?instagram\.com/[a-z0-9._]+/?$' then
    raise exception
      'Informe um endereço válido do Instagram.';
  end if;

  if v_cor_primaria !~ '^#[0-9a-f]{6}$' then
    raise exception
      'A cor primária precisa estar no formato hexadecimal.';
  end if;

  if v_cor_secundaria !~ '^#[0-9a-f]{6}$' then
    raise exception
      'A cor secundária precisa estar no formato hexadecimal.';
  end if;

  if not coalesce(p_vende_consorcio, false)
     and not coalesce(p_vende_financiamento, false) then
    raise exception
      'Selecione pelo menos uma modalidade comercializada.';
  end if;

  update public.clientes
  set
    nome = v_nome,
    whatsapp = v_whatsapp,
    instagram_url = v_instagram_url,
    slogan = v_slogan,
    cor_primaria = v_cor_primaria,
    cor_secundaria = v_cor_secundaria,
    vende_consorcio = coalesce(
      p_vende_consorcio,
      false
    ),
    vende_financiamento = coalesce(
      p_vende_financiamento,
      false
    )
  where id = v_cliente_id;

  if not found then
    raise exception
      'O perfil vinculado não foi encontrado.';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'name', c.nome,
    'slug', c.slug,
    'whatsapp', c.whatsapp,
    'instagramUrl', c.instagram_url,
    'slogan', c.slogan,
    'primaryColor', c.cor_primaria,
    'secondaryColor', c.cor_secundaria,
    'sellsConsortium', c.vende_consorcio,
    'sellsFinancing', c.vende_financiamento,
    'active', c.ativo
  )
  into v_resultado
  from public.clientes c
  where c.id = v_cliente_id;

  return v_resultado;
end
$$;

revoke all
  on function public.atualizar_meu_perfil_cliente(
    text,
    text,
    text,
    text,
    text,
    text,
    boolean,
    boolean
  )
  from public, anon, authenticated;

grant execute
  on function public.atualizar_meu_perfil_cliente(
    text,
    text,
    text,
    text,
    text,
    text,
    boolean,
    boolean
  )
  to authenticated;

commit;

select
  'atualizar_meu_perfil_cliente' as recurso,
  case
    when to_regprocedure(
      'public.atualizar_meu_perfil_cliente(text,text,text,text,text,text,boolean,boolean)'
    ) is not null
      then 'OK'
    else 'ERRO'
  end as status;
