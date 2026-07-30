import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  AdminRequestError,
  requireAdminRequest,
} from "@/lib/admin-request-auth";
import { getSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ClientRow = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

type AccessRow = {
  user_id: string;
  cliente_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
};

type AccessAction = "create" | "link";

type AccessRequestBody = {
  action?: AccessAction;
  email?: string;
  password?: string;
  name?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function handleRouteError(error: unknown) {
  if (error instanceof AdminRequestError) {
    return jsonError(error.message, error.status);
  }

  if (
    error instanceof Error &&
    error.message.includes("Supabase administrativo não configurado")
  ) {
    return jsonError(error.message, 500);
  }

  console.error("Erro na gestão do acesso do vendedor:", error);

  return jsonError(
    "Não foi possível concluir a operação. Tente novamente.",
    500,
  );
}

async function getClient(clientId: string) {
  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from("clientes")
    .select("id,nome,slug,ativo")
    .eq("id", clientId)
    .maybeSingle<ClientRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function getAccessRow(clientId: string) {
  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from("cliente_usuarios")
    .select("user_id,cliente_id,nome,ativo,criado_em")
    .eq("cliente_id", clientId)
    .maybeSingle<AccessRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function buildSnapshot(client: ClientRow) {
  const service = getSupabaseServiceClient();
  const access = await getAccessRow(client.id);

  if (!access) {
    return {
      client,
      access: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await service.auth.admin.getUserById(access.user_id);

  if (userError) {
    throw userError;
  }

  return {
    client,
    access: {
      userId: access.user_id,
      email: user?.email ?? "",
      name: access.nome,
      active: access.ativo,
      createdAt: access.criado_em,
    },
  };
}

async function findUserByEmail(email: string): Promise<User | null> {
  const service = getSupabaseServiceClient();
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const {
      data: { users },
      error,
    } = await service.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const user =
      users.find(
        (candidate) =>
          candidate.email?.trim().toLowerCase() === email,
      ) ?? null;

    if (user) {
      return user;
    }

    if (users.length < perPage) {
      return null;
    }
  }

  throw new Error(
    "A busca de usuários excedeu o limite de páginas configurado.",
  );
}

async function ensureUserCanBeLinked(
  userId: string,
  clientId: string,
) {
  const service = getSupabaseServiceClient();

  const [
    { data: adminAccess, error: adminError },
    { data: currentAccess, error: accessError },
  ] = await Promise.all([
    service
      .from("admin_usuarios")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle<{ user_id: string }>(),
    service
      .from("cliente_usuarios")
      .select("user_id,cliente_id,nome,ativo,criado_em")
      .eq("user_id", userId)
      .maybeSingle<AccessRow>(),
  ]);

  if (adminError) {
    throw adminError;
  }

  if (accessError) {
    throw accessError;
  }

  if (adminAccess) {
    throw new AdminRequestError(
      "Este e-mail pertence a um administrador e não pode ser usado como acesso de vendedor.",
      409,
    );
  }

  if (currentAccess && currentAccess.cliente_id !== clientId) {
    throw new AdminRequestError(
      "Este usuário já está vinculado a outro cliente.",
      409,
    );
  }

  return currentAccess;
}

async function createLink(
  userId: string,
  client: ClientRow,
  name: string,
) {
  const service = getSupabaseServiceClient();
  const { error } = await service.from("cliente_usuarios").insert({
    user_id: userId,
    cliente_id: client.id,
    nome: name,
    ativo: true,
  });

  if (error) {
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdminRequest(request);

    const { id } = await context.params;
    const client = await getClient(id);

    if (!client) {
      return jsonError("Cliente não encontrado.", 404);
    }

    return NextResponse.json(await buildSnapshot(client), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdminRequest(request);

    const { id } = await context.params;
    const client = await getClient(id);

    if (!client) {
      return jsonError("Cliente não encontrado.", 404);
    }

    const existingAccess = await getAccessRow(client.id);

    if (existingAccess) {
      return jsonError(
        "Este cliente já possui um acesso de vendedor.",
        409,
      );
    }

    const body = (await request.json()) as AccessRequestBody;
    const action = body.action;
    const email = normalizeEmail(body.email);
    const name = normalizeName(body.name) || client.nome;

    if (action !== "create" && action !== "link") {
      return jsonError("A ação informada é inválida.", 400);
    }

    if (!EMAIL_PATTERN.test(email)) {
      return jsonError("Informe um e-mail válido.", 400);
    }

    if (name.length < 2 || name.length > 120) {
      return jsonError(
        "O nome do acesso deve ter entre 2 e 120 caracteres.",
        400,
      );
    }

    const service = getSupabaseServiceClient();

    if (action === "link") {
      const existingUser = await findUserByEmail(email);

      if (!existingUser) {
        return jsonError(
          "Nenhum usuário foi encontrado no Supabase Auth com este e-mail.",
          404,
        );
      }

      const currentAccess = await ensureUserCanBeLinked(
        existingUser.id,
        client.id,
      );

      if (!currentAccess) {
        await createLink(existingUser.id, client, name);
      }

      return NextResponse.json(await buildSnapshot(client), {
        status: currentAccess ? 200 : 201,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const password =
      typeof body.password === "string" ? body.password : "";

    if (password.length < 8) {
      return jsonError(
        "A senha inicial precisa ter pelo menos 8 caracteres.",
        400,
      );
    }

    const alreadyRegistered = await findUserByEmail(email);

    if (alreadyRegistered) {
      return jsonError(
        "Este e-mail já existe no Supabase Auth. Use a opção de vincular usuário existente.",
        409,
      );
    }

    const {
      data: createData,
      error: createError,
    } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        client_name: client.nome,
        client_slug: client.slug,
      },
    });

    if (createError || !createData.user) {
      throw (
        createError ??
        new Error("O Supabase não retornou o usuário criado.")
      );
    }

    const createdUserId = createData.user.id;

    try {
      await ensureUserCanBeLinked(createdUserId, client.id);
      await createLink(createdUserId, client, name);
    } catch (linkError) {
      const { error: rollbackError } =
        await service.auth.admin.deleteUser(createdUserId);

      if (rollbackError) {
        console.error(
          "Falha ao remover usuário após erro de vínculo:",
          rollbackError,
        );
      }

      throw linkError;
    }

    return NextResponse.json(await buildSnapshot(client), {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
