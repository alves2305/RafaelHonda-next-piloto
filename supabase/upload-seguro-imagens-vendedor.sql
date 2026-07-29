-- Catálogo Honda 2.0
-- Entrega 19.6.1
-- Upload seguro das imagens do próprio vendedor
--
-- Execute somente no Supabase usado pelo Catálogo Honda 2.0.

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

  if not exists (
    select 1
    from storage.buckets
    where id = 'catalogo-assets'
  ) then
    raise exception
      'Instalação interrompida: o bucket catalogo-assets não foi encontrado. Execute primeiro o SQL do Storage administrativo.';
  end if;
end
$$;

drop policy if exists
  "Vendedores enviam imagens do proprio perfil"
  on storage.objects;

create policy
  "Vendedores enviam imagens do proprio perfil"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'catalogo-assets'
    and public.cliente_id_do_usuario() is not null
    and array_length(
      storage.foldername(name),
      1
    ) = 3
    and (
      storage.foldername(name)
    )[1] = 'clientes'
    and (
      storage.foldername(name)
    )[2] = public.cliente_id_do_usuario()::text
    and (
      storage.foldername(name)
    )[3] in (
      'foto-mobile',
      'foto-desktop',
      'logo',
      'marca-dagua'
    )
    and lower(
      storage.extension(name)
    ) = 'webp'
  );

create or replace function
  public.atualizar_minhas_imagens_cliente(
    p_foto_url text,
    p_foto_desktop_url text,
    p_logo_url text,
    p_marca_dagua_url text
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_atual public.clientes%rowtype;
  v_foto_url text;
  v_foto_desktop_url text;
  v_logo_url text;
  v_marca_dagua_url text;
  v_base text;
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

  select c.*
  into v_atual
  from public.clientes c
  where c.id = v_cliente_id;

  if not found then
    raise exception
      'O perfil vinculado não foi encontrado.';
  end if;

  v_foto_url := nullif(
    btrim(coalesce(p_foto_url, '')),
    ''
  );

  v_foto_desktop_url := nullif(
    btrim(
      coalesce(p_foto_desktop_url, '')
    ),
    ''
  );

  v_logo_url := nullif(
    btrim(coalesce(p_logo_url, '')),
    ''
  );

  v_marca_dagua_url := nullif(
    btrim(
      coalesce(p_marca_dagua_url, '')
    ),
    ''
  );

  if v_foto_url is null then
    raise exception
      'A foto mobile é obrigatória.';
  end if;

  v_base :=
    '/storage/v1/object/public/catalogo-assets/clientes/'
    || v_cliente_id::text
    || '/';

  if v_foto_url is distinct from
       v_atual.foto_url
     and position(
       v_base || 'foto-mobile/'
       in v_foto_url
     ) = 0 then
    raise exception
      'A foto mobile precisa pertencer à pasta deste vendedor.';
  end if;

  if v_foto_desktop_url is not null
     and v_foto_desktop_url
       is distinct from
       v_atual.foto_desktop_url
     and position(
       v_base || 'foto-desktop/'
       in v_foto_desktop_url
     ) = 0 then
    raise exception
      'A foto desktop precisa pertencer à pasta deste vendedor.';
  end if;

  if v_logo_url is not null
     and v_logo_url is distinct from
       v_atual.logo_url
     and position(
       v_base || 'logo/'
       in v_logo_url
     ) = 0 then
    raise exception
      'O logotipo precisa pertencer à pasta deste vendedor.';
  end if;

  if v_marca_dagua_url is not null
     and v_marca_dagua_url
       is distinct from
       v_atual.marca_dagua_url
     and position(
       v_base || 'marca-dagua/'
       in v_marca_dagua_url
     ) = 0 then
    raise exception
      'A marca-d''água precisa pertencer à pasta deste vendedor.';
  end if;

  update public.clientes
  set
    foto_url = v_foto_url,
    foto_desktop_url =
      v_foto_desktop_url,
    logo_url = v_logo_url,
    marca_dagua_url =
      v_marca_dagua_url
  where id = v_cliente_id;

  select jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'mobilePhotoUrl', c.foto_url,
    'desktopPhotoUrl',
      c.foto_desktop_url,
    'logoUrl', c.logo_url,
    'watermarkUrl',
      c.marca_dagua_url
  )
  into v_resultado
  from public.clientes c
  where c.id = v_cliente_id;

  return v_resultado;
end
$$;

revoke all
  on function
    public.atualizar_minhas_imagens_cliente(
      text,
      text,
      text,
      text
    )
  from public, anon, authenticated;

grant execute
  on function
    public.atualizar_minhas_imagens_cliente(
      text,
      text,
      text,
      text
    )
  to authenticated;

commit;

select
  recurso,
  status
from (
  values
    (
      'politica_upload_vendedor',
      case
        when exists (
          select 1
          from pg_policies
          where schemaname = 'storage'
            and tablename = 'objects'
            and policyname =
              'Vendedores enviam imagens do proprio perfil'
        )
          then 'OK'
        else 'ERRO'
      end
    ),
    (
      'atualizar_minhas_imagens_cliente',
      case
        when to_regprocedure(
          'public.atualizar_minhas_imagens_cliente(text,text,text,text)'
        ) is not null
          then 'OK'
        else 'ERRO'
      end
    )
) as verificacao(recurso, status);
