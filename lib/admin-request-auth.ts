import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export class AdminRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminRequestError";
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

export async function requireAdminRequest(
  request: NextRequest,
): Promise<User> {
  const token = getBearerToken(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!token) {
    throw new AdminRequestError(
      "Sua sessão administrativa não foi enviada.",
      401,
    );
  }

  if (!url || !anonKey) {
    throw new AdminRequestError(
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
    throw new AdminRequestError(
      "Sua sessão administrativa expirou. Entre novamente.",
      401,
    );
  }

  const { data: isAdmin, error: adminError } =
    await sessionClient.rpc("usuario_e_admin");

  if (adminError) {
    console.error("Falha ao validar administrador:", adminError);
    throw new AdminRequestError(
      "Não foi possível validar sua permissão administrativa.",
      500,
    );
  }

  if (isAdmin !== true) {
    throw new AdminRequestError(
      "Somente um administrador ativo pode executar esta ação.",
      403,
    );
  }

  return user;
}
