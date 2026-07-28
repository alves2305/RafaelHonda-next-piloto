import type { SupabaseClient } from "@supabase/supabase-js";

type ClientAccessRow = {
  user_id: string;
  cliente_id: string;
  nome_usuario: string;
  usuario_ativo: boolean;
  cliente_nome: string;
  cliente_slug: string;
  cliente_ativo: boolean;
  acesso_liberado: boolean;
};

export type ClientAccess = {
  userId: string;
  clientId: string;
  userName: string;
  userActive: boolean;
  clientName: string;
  clientSlug: string;
  clientActive: boolean;
  accessAllowed: boolean;
};

export async function loadCurrentClientAccess(
  supabase: SupabaseClient,
): Promise<ClientAccess | null> {
  const { data, error } = await supabase.rpc("meu_acesso_cliente");

  if (error) {
    throw error;
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as ClientAccessRow | null | undefined;

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    clientId: row.cliente_id,
    userName: row.nome_usuario,
    userActive: row.usuario_ativo,
    clientName: row.cliente_nome,
    clientSlug: row.cliente_slug,
    clientActive: row.cliente_ativo,
    accessAllowed: row.acesso_liberado,
  };
}
