import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/ContactSection";
import { MotorcycleCatalog } from "@/components/MotorcycleCatalog";
import { ProfileFrame } from "@/components/ProfileFrame";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SuspendedProfile } from "@/components/SuspendedProfile";
import { getCatalogByClientSlug } from "@/lib/catalog";

export const revalidate = 30;

type ClientPageProps = {
  params: Promise<{ cliente: string }>;
};

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const { cliente } = await params;
  const catalog = await getCatalogByClientSlug(cliente);

  if (!catalog) {
    return { title: "Perfil não encontrado" };
  }

  return {
    title: catalog.client.nome,
    description: catalog.client.slogan,
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { cliente } = await params;
  const catalog = await getCatalogByClientSlug(cliente);

  if (!catalog) {
    notFound();
  }

  if (!catalog.client.ativo) {
    return <SuspendedProfile client={catalog.client} />;
  }

  const motorcycleCards = catalog.motorcycles.map((motorcycle) => ({
    id: motorcycle.id,
    slug: motorcycle.slug,
    nome: motorcycle.nome,
    categoria: motorcycle.categoria,
    imagemUrl: motorcycle.imagemUrl,
    hasConsortium:
      catalog.client.vendeConsorcio &&
      motorcycle.planosConsorcio.length > 0,
    hasFinancing:
      catalog.client.vendeFinanciamento &&
      motorcycle.financiamento !== null,
  }));

  return (
    <ProfileFrame client={catalog.client}>
      <main className="page-container">
        <ProfileHeader client={catalog.client} />

        <MotorcycleCatalog
          clientSlug={catalog.client.slug}
          motorcycles={motorcycleCards}
        />

        <ContactSection client={catalog.client} />
      </main>
    </ProfileFrame>
  );
}
