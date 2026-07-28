import { getSupabaseClient } from "@/lib/supabase";

export type MotorcycleGalleryImage = {
  id: string;
  url: string;
  alt: string;
  order: number;
  principal: boolean;
};

type MotorcycleGalleryRow = {
  id: string;
  imagem_url: string;
  texto_alternativo: string | null;
  ordem: number;
  principal: boolean;
};

function createFallbackImage(
  fallbackUrl: string,
  fallbackAlt: string,
): MotorcycleGalleryImage[] {
  return [
    {
      id: "imagem-principal",
      url: fallbackUrl,
      alt: fallbackAlt,
      order: 1,
      principal: true,
    },
  ];
}

export async function getMotorcycleGallery(
  motorcycleId: string,
  fallbackUrl: string,
  fallbackAlt: string,
): Promise<MotorcycleGalleryImage[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return createFallbackImage(fallbackUrl, fallbackAlt);
  }

  const { data, error } = await supabase
    .from("moto_imagens")
    .select(
      "id,imagem_url,texto_alternativo,ordem,principal",
    )
    .eq("moto_id", motorcycleId)
    .eq("ativo", true)
    .order("principal", { ascending: false })
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true })
    .returns<MotorcycleGalleryRow[]>();

  if (error) {
    console.error(
      "Não foi possível carregar a galeria da moto:",
      error,
    );

    return createFallbackImage(fallbackUrl, fallbackAlt);
  }

  const images = (data ?? [])
    .filter((image) => image.imagem_url.trim())
    .map<MotorcycleGalleryImage>((image) => ({
      id: image.id,
      url: image.imagem_url,
      alt: image.texto_alternativo?.trim() || fallbackAlt,
      order: image.ordem,
      principal: image.principal,
    }));

  return images.length > 0
    ? images
    : createFallbackImage(fallbackUrl, fallbackAlt);
}
