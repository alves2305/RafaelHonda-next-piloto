-- Catálogo Honda 2.0
-- Entrega 19.6.2
-- Ajuste seguro do enquadramento das fotos pelo vendedor

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

create or replace function
  public.atualizar_meu_enquadramento_cliente(
    p_foto_posicao_x integer,
    p_foto_posicao_y integer,
    p_foto_desktop_posicao_x integer,
    p_foto_desktop_posicao_y integer
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
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

  if p_foto_posicao_x is null
     or p_foto_posicao_x < 0
     or p_foto_posicao_x > 100 then
    raise exception
      'A posição horizontal da foto mobile precisa estar entre 0 e 100.';
  end if;

  if p_foto_posicao_y is null
     or p_foto_posicao_y < 0
     or p_foto_posicao_y > 100 then
    raise exception
      'A posição vertical da foto mobile precisa estar entre 0 e 100.';
  end if;

  if p_foto_desktop_posicao_x is null
     or p_foto_desktop_posicao_x < 0
     or p_foto_desktop_posicao_x > 100 then
    raise exception
      'A posição horizontal da foto desktop precisa estar entre 0 e 100.';
  end if;

  if p_foto_desktop_posicao_y is null
     or p_foto_desktop_posicao_y < 0
     or p_foto_desktop_posicao_y > 100 then
    raise exception
      'A posição vertical da foto desktop precisa estar entre 0 e 100.';
  end if;

  update public.clientes
  set
    foto_posicao_x =
      p_foto_posicao_x,
    foto_posicao_y =
      p_foto_posicao_y,
    foto_desktop_posicao_x =
      p_foto_desktop_posicao_x,
    foto_desktop_posicao_y =
      p_foto_desktop_posicao_y
  where id = v_cliente_id;

  if not found then
    raise exception
      'O perfil vinculado não foi encontrado.';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'mobilePhotoPositionX',
      c.foto_posicao_x,
    'mobilePhotoPositionY',
      c.foto_posicao_y,
    'desktopPhotoPositionX',
      c.foto_desktop_posicao_x,
    'desktopPhotoPositionY',
      c.foto_desktop_posicao_y
  )
  into v_resultado
  from public.clientes c
  where c.id = v_cliente_id;

  return v_resultado;
end
$$;

revoke all
  on function
    public.atualizar_meu_enquadramento_cliente(
      integer,
      integer,
      integer,
      integer
    )
  from public, anon, authenticated;

grant execute
  on function
    public.atualizar_meu_enquadramento_cliente(
      integer,
      integer,
      integer,
      integer
    )
  to authenticated;

commit;

select
  'atualizar_meu_enquadramento_cliente'
    as recurso,
  case
    when to_regprocedure(
      'public.atualizar_meu_enquadramento_cliente(integer,integer,integer,integer)'
    ) is not null
      then 'OK'
    else 'ERRO'
  end as status;
