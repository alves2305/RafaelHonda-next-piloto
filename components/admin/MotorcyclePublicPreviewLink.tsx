"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAdminSupabaseClient } from "@/lib/admin-supabase";

type PreviewMode = "moto" | "consorcio" | "financiamento";

type ClientRelation = {
  cliente_id: string;
};

type ClientPreview = {
  id: string;
  slug: string;
  ativo: boolean;
  vende_consorcio: boolean;
  vende_financiamento: boolean;
};

function clientSupportsMode(
  client: ClientPreview,
  mode: PreviewMode,
) {
  if (mode === "consorcio") {
    return client.vende_consorcio;
  }

  if (mode === "financiamento") {
    return client.vende_financiamento;
  }

  return true;
}

export function MotorcyclePublicPreviewLink({
  motorcycleId,
  motorcycleSlug,
  mode,
  children = "Visualizar página pública ↗",
}: {
  motorcycleId: string;
  motorcycleSlug: string;
  mode: PreviewMode;
  children?: string;
}) {
  const [clientSlug, setClientSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreviewClient() {
      try {
        const supabase = getAdminSupabaseClient();

        const { data: relationData, error: relationError } =
          await supabase
            .from("cliente_motos")
            .select("cliente_id")
            .eq("moto_id", motorcycleId)
            .eq("ativo", true);

        if (relationError) {
          throw relationError;
        }

        const clientIds = (
          (relationData ?? []) as ClientRelation[]
        ).map((relation) => relation.cliente_id);

        if (clientIds.length === 0) {
          return;
        }

        const { data: clientData, error: clientError } = await supabase
          .from("clientes")
          .select(
            "id,slug,ativo,vende_consorcio,vende_financiamento",
          )
          .in("id", clientIds)
          .eq("ativo", true)
          .order("nome");

        if (clientError) {
          throw clientError;
        }

        const eligibleClient = (
          (clientData ?? []) as ClientPreview[]
        ).find((client) => clientSupportsMode(client, mode));

        if (active) {
          setClientSlug(eligibleClient?.slug ?? null);
        }
      } catch (previewError) {
        console.error(
          "Não foi possível localizar um catálogo para pré-visualização:",
          previewError,
        );
      }
    }

    void loadPreviewClient();

    return () => {
      active = false;
    };
  }, [mode, motorcycleId]);

  if (!clientSlug) {
    return null;
  }

  return (
    <Link
      href={`/${clientSlug}/${mode}/${motorcycleSlug}`}
      target="_blank"
    >
      {children}
    </Link>
  );
}
