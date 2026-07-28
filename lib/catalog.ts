import { unstable_cache } from "next/cache";
import { cache } from "react";

import { demoCatalog } from "@/lib/demo-data";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  ClientCatalog,
  ClientProfile,
  ConsortiumPlan,
  FinancingInfo,
  Motorcycle,
  MotorcycleBenefit,
  MotorcycleDetail,
} from "@/lib/types";

const CATALOG_REVALIDATE_SECONDS = 30;

type ClientRow = {
  id: string;
  nome: string;
  slug: string;
  foto_url: string;
  foto_desktop_url: string | null;
  foto_posicao_x: number;
  foto_posicao_y: number;
  foto_desktop_posicao_x: number;
  foto_desktop_posicao_y: number;
  logo_url: string | null;
  whatsapp: string;
  instagram_url: string | null;
  slogan: string;
  cor_primaria: string;
  cor_secundaria: string;
  marca_dagua_url: string | null;
  vende_consorcio: boolean;
  vende_financiamento: boolean;
  ativo: boolean;
};

type MotorcycleRow = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  selo: string | null;
  titulo_descricao: string;
  descricao: string;
  detalhes: unknown;
  beneficios: unknown;
  titulo_consorcio: string;
  ativo: boolean;
  ordem: number;
};

type ClientMotorcycleRow = {
  moto_id: string;
  ordem: number;
};

type ConsortiumPlanRow = {
  id: string;
  moto_id: string;
  parcelas: number;
  valor_parcela: number | string;
  destaque: boolean;
  ordem: number;
};

type FinancingInfoRow = {
  id: string;
  moto_id: string;
  titulo: string;
  descricao: string;
  observacao: string;
};

function toClient(row: ClientRow): ClientProfile {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    fotoUrl: row.foto_url,
    fotoDesktopUrl: row.foto_desktop_url,
    fotoPosicaoX: row.foto_posicao_x,
    fotoPosicaoY: row.foto_posicao_y,
    fotoDesktopPosicaoX: row.foto_desktop_posicao_x,
    fotoDesktopPosicaoY: row.foto_desktop_posicao_y,
    logoUrl: row.logo_url,
    whatsapp: row.whatsapp,
    instagramUrl: row.instagram_url,
    slogan: row.slogan,
    corPrimaria: row.cor_primaria,
    corSecundaria: row.cor_secundaria,
    marcaDaguaUrl: row.marca_dagua_url,
    vendeConsorcio: row.vende_consorcio,
    vendeFinanciamento: row.vende_financiamento,
    ativo: row.ativo,
  };
}

function toDetailList(value: unknown): MotorcycleDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is MotorcycleDetail =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as MotorcycleDetail).rotulo === "string" &&
      typeof (item as MotorcycleDetail).valor === "string",
  );
}

function toBenefitList(value: unknown): MotorcycleBenefit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is MotorcycleBenefit =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as MotorcycleBenefit).titulo === "string" &&
      typeof (item as MotorcycleBenefit).descricao === "string" &&
      ["economia", "praticidade", "conforto", "desempenho"].includes(
        (item as MotorcycleBenefit).icone,
      ),
  );
}

function throwQueryError(scope: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`Falha ao carregar ${scope}: ${error.message}`);
  }
}

async function loadCatalogByClientSlug(
  slug: string,
): Promise<ClientCatalog | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return slug === demoCatalog.client.slug ? demoCatalog : null;
  }

  const { data: clientData, error: clientError } = await supabase
    .from("clientes")
    .select(
      "id,nome,slug,foto_url,foto_desktop_url,foto_posicao_x,foto_posicao_y,foto_desktop_posicao_x,foto_desktop_posicao_y,logo_url,whatsapp,instagram_url,slogan,cor_primaria,cor_secundaria,marca_dagua_url,vende_consorcio,vende_financiamento,ativo",
    )
    .eq("slug", slug)
    .maybeSingle<ClientRow>();

  throwQueryError("o perfil", clientError);

  if (!clientData) {
    return null;
  }

  const client = toClient(clientData);

  if (!client.ativo) {
    return { client, motorcycles: [] };
  }

  const { data: linkData, error: linkError } = await supabase
    .from("cliente_motos")
    .select("moto_id,ordem")
    .eq("cliente_id", client.id)
    .eq("ativo", true)
    .order("ordem")
    .returns<ClientMotorcycleRow[]>();

  throwQueryError("as motos do perfil", linkError);

  const links = linkData ?? [];
  const motorcycleIds = links.map((link) => link.moto_id);

  if (motorcycleIds.length === 0) {
    return { client, motorcycles: [] };
  }

  const [
    { data: motorcycleData, error: motorcycleError },
    { data: planData, error: planError },
    { data: financingData, error: financingError },
  ] = await Promise.all([
    supabase
      .from("motos")
      .select(
        "id,slug,nome,categoria,imagem_url,selo,titulo_descricao,descricao,detalhes,beneficios,titulo_consorcio,ativo,ordem",
      )
      .in("id", motorcycleIds)
      .eq("ativo", true)
      .returns<MotorcycleRow[]>(),
    supabase
      .from("planos_consorcio")
      .select("id,moto_id,parcelas,valor_parcela,destaque,ordem")
      .in("moto_id", motorcycleIds)
      .eq("ativo", true)
      .order("ordem")
      .returns<ConsortiumPlanRow[]>(),
    supabase
      .from("informacoes_financiamento")
      .select("id,moto_id,titulo,descricao,observacao")
      .in("moto_id", motorcycleIds)
      .eq("ativo", true)
      .returns<FinancingInfoRow[]>(),
  ]);

  throwQueryError("os dados das motos", motorcycleError);
  throwQueryError("os planos de consórcio", planError);
  throwQueryError("as informações de financiamento", financingError);

  const linkOrder = new Map(
    links.map((link) => [link.moto_id, link.ordem] as const),
  );

  const plansByMotorcycle = new Map<string, ConsortiumPlan[]>();

  for (const row of planData ?? []) {
    const plans = plansByMotorcycle.get(row.moto_id) ?? [];

    plans.push({
      id: row.id,
      parcelas: row.parcelas,
      valorParcela: Number(row.valor_parcela),
      destaque: row.destaque,
      ordem: row.ordem,
    });

    plansByMotorcycle.set(row.moto_id, plans);
  }

  const financingByMotorcycle = new Map<string, FinancingInfo>();

  for (const row of financingData ?? []) {
    financingByMotorcycle.set(row.moto_id, {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      observacao: row.observacao,
    });
  }

  const motorcycles: Motorcycle[] = (motorcycleData ?? [])
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      nome: row.nome,
      categoria: row.categoria,
      imagemUrl: row.imagem_url,
      selo: row.selo,
      tituloDescricao: row.titulo_descricao,
      descricao: row.descricao,
      detalhes: toDetailList(row.detalhes),
      beneficios: toBenefitList(row.beneficios),
      tituloConsorcio: row.titulo_consorcio,
      ativo: row.ativo,
      ordem: linkOrder.get(row.id) ?? row.ordem,
      planosConsorcio: plansByMotorcycle.get(row.id) ?? [],
      financiamento: financingByMotorcycle.get(row.id) ?? null,
    }))
    .sort((first, second) => first.ordem - second.ordem);

  return { client, motorcycles };
}

const getCatalogByClientSlugFromDataCache = unstable_cache(
  loadCatalogByClientSlug,
  ["public-catalog-by-client-slug-v2"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

export const getCatalogByClientSlug = cache((slug: string) =>
  getCatalogByClientSlugFromDataCache(slug),
);

export async function getClientMotorcycle(
  clientSlug: string,
  motorcycleSlug: string,
) {
  const catalog = await getCatalogByClientSlug(clientSlug);

  if (!catalog) {
    return null;
  }

  const motorcycleIndex = catalog.motorcycles.findIndex(
    (item) => item.slug === motorcycleSlug,
  );
  const motorcycle =
    motorcycleIndex >= 0 ? catalog.motorcycles[motorcycleIndex] : null;
  const nextMotorcycle =
    motorcycle && catalog.motorcycles.length > 1
      ? catalog.motorcycles[
          (motorcycleIndex + 1) % catalog.motorcycles.length
        ]
      : null;

  const consortiumMotorcycles = catalog.motorcycles.filter(
    (item) => item.planosConsorcio.length > 0,
  );

  const consortiumMotorcycleIndex = consortiumMotorcycles.findIndex(
    (item) => item.slug === motorcycleSlug,
  );

  const nextConsortiumMotorcycle =
    motorcycle &&
    motorcycle.planosConsorcio.length > 0 &&
    consortiumMotorcycleIndex >= 0 &&
    consortiumMotorcycles.length > 1
      ? consortiumMotorcycles[
          (consortiumMotorcycleIndex + 1) %
            consortiumMotorcycles.length
        ]
      : null;

  return {
    client: catalog.client,
    motorcycle,
    nextMotorcycle,
    nextConsortiumMotorcycle,
  };
}
