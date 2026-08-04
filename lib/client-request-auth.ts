import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

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

export type ClientRequestAccess = {
  userId: string;
  clientId: string;
  userName: string;
  userActive: boolean;
  clientName: string;
  clientSlug: string;
  clientActive: boolean;
  accessAllowed: boolean;
};

export class ClientRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ClientRequestError";
    this.status = status;
  }
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function requireClientRequest(
  request: NextRequest,
): Promise<{ user: User; access: ClientRequestAccess }> {
  const token = getBearerToken(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!token) {
    throw new ClientRequestError(
      "Sua sessão de vendedor não foi enviada.",
      401,
    );
  }

  if (!url || !anonKey) {
    throw new ClientRequestError(
      "A conexão pública com o Supabase não está configurada.",
      500,
    );
  }

  const sessionClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser(token);

  if (userError || !user) {
    throw new ClientRequestError(
      "Sua sessão expirou. Entre novamente no painel.",
      401,
    );
  }

  const { data, error } = await sessionClient.rpc("meu_acesso_cliente");

  if (error) {
    console.error("Falha ao validar vendedor:", error);
    throw new ClientRequestError(
      "Não foi possível validar o acesso do vendedor.",
      500,
    );
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as ClientAccessRow | null | undefined;

  if (!row) {
    throw new ClientRequestError(
      "Esta conta não está vinculada a um catálogo.",
      403,
    );
  }

  const access: ClientRequestAccess = {
    userId: row.user_id,
    clientId: row.cliente_id,
    userName: row.nome_usuario,
    userActive: row.usuario_ativo,
    clientName: row.cliente_nome,
    clientSlug: row.cliente_slug,
    clientActive: row.cliente_ativo,
    accessAllowed: row.acesso_liberado,
  };

  if (!access.userActive) {
    throw new ClientRequestError(
      "O acesso deste vendedor está suspenso.",
      403,
    );
  }

  return { user, access };
}
