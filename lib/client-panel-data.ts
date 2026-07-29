import type { SupabaseClient } from "@supabase/supabase-js";

type ClientProfileRow = {
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

type ClientMotorcycleRow = {
  moto_id: string;
  ativo: boolean;
  ordem: number;
};

type MotorcycleRow = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  selo: string | null;
  ativo: boolean;
  ordem: number;
};

export type ClientPanelProfile = {
  id: string;
  name: string;
  slug: string;
  mobilePhotoUrl: string;
  desktopPhotoUrl: string | null;
  mobilePhotoPositionX: number;
  mobilePhotoPositionY: number;
  desktopPhotoPositionX: number;
  desktopPhotoPositionY: number;
  logoUrl: string | null;
  whatsapp: string;
  instagramUrl: string | null;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  watermarkUrl: string | null;
  sellsConsortium: boolean;
  sellsFinancing: boolean;
  active: boolean;
};

export type ClientPanelMotorcycle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  badge: string | null;
  order: number;
};

export type ClientPanelData = {
  profile: ClientPanelProfile;
  motorcycles: ClientPanelMotorcycle[];
};

function normalizePosition(value: number | null | undefined) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value ?? 50)));
}

function toProfile(row: ClientProfileRow): ClientPanelProfile {
  return {
    id: row.id,
    name: row.nome,
    slug: row.slug,
    mobilePhotoUrl: row.foto_url,
    desktopPhotoUrl: row.foto_desktop_url,
    mobilePhotoPositionX: normalizePosition(row.foto_posicao_x),
    mobilePhotoPositionY: normalizePosition(row.foto_posicao_y),
    desktopPhotoPositionX: normalizePosition(
      row.foto_desktop_posicao_x,
    ),
    desktopPhotoPositionY: normalizePosition(
      row.foto_desktop_posicao_y,
    ),
    logoUrl: row.logo_url,
    whatsapp: row.whatsapp,
    instagramUrl: row.instagram_url,
    slogan: row.slogan,
    primaryColor: row.cor_primaria,
    secondaryColor: row.cor_secundaria,
    watermarkUrl: row.marca_dagua_url,
    sellsConsortium: row.vende_consorcio,
    sellsFinancing: row.vende_financiamento,
    active: row.ativo,
  };
}

export async function loadClientPanelData(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientPanelData> {
  const { data: profileData, error: profileError } = await supabase
    .from("clientes")
    .select(
      "id,nome,slug,foto_url,foto_desktop_url,foto_posicao_x,foto_posicao_y,foto_desktop_posicao_x,foto_desktop_posicao_y,logo_url,whatsapp,instagram_url,slogan,cor_primaria,cor_secundaria,marca_dagua_url,vende_consorcio,vende_financiamento,ativo",
    )
    .eq("id", clientId)
    .maybeSingle<ClientProfileRow>();

  if (profileError) {
    throw profileError;
  }

  if (!profileData) {
    throw new Error("O perfil vinculado a esta conta não foi encontrado.");
  }

  const { data: relationData, error: relationError } = await supabase
    .from("cliente_motos")
    .select("moto_id,ativo,ordem")
    .eq("cliente_id", clientId)
    .eq("ativo", true)
    .order("ordem");

  if (relationError) {
    throw relationError;
  }

  const relations = (relationData ?? []) as ClientMotorcycleRow[];
  const motorcycleIds = relations.map((relation) => relation.moto_id);

  if (motorcycleIds.length === 0) {
    return {
      profile: toProfile(profileData),
      motorcycles: [],
    };
  }

  const { data: motorcycleData, error: motorcycleError } = await supabase
    .from("motos")
    .select("id,slug,nome,categoria,imagem_url,selo,ativo,ordem")
    .in("id", motorcycleIds)
    .eq("ativo", true);

  if (motorcycleError) {
    throw motorcycleError;
  }

  const motorcycles = (motorcycleData ?? []) as MotorcycleRow[];
  const relationByMotorcycle = new Map(
    relations.map((relation) => [relation.moto_id, relation]),
  );

  const orderedMotorcycles = motorcycles
    .map<ClientPanelMotorcycle>((motorcycle) => ({
      id: motorcycle.id,
      slug: motorcycle.slug,
      name: motorcycle.nome,
      category: motorcycle.categoria,
      imageUrl: motorcycle.imagem_url,
      badge: motorcycle.selo,
      order:
        relationByMotorcycle.get(motorcycle.id)?.ordem ??
        motorcycle.ordem ??
        0,
    }))
    .sort(
      (first, second) =>
        first.order - second.order ||
        first.name.localeCompare(second.name, "pt-BR"),
    );

  return {
    profile: toProfile(profileData),
    motorcycles: orderedMotorcycles,
  };
}
