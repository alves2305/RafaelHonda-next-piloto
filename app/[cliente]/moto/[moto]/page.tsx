import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/ContactSection";
import { ProfileFrame } from "@/components/ProfileFrame";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SuspendedProfile } from "@/components/SuspendedProfile";
import { getClientMotorcycle } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type MotorcyclePageProps = {
  params: Promise<{ cliente: string; moto: string }>;
};

export async function generateMetadata({
  params,
}: MotorcyclePageProps): Promise<Metadata> {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  return {
    title: result?.motorcycle
      ? `${result.motorcycle.nome} — ${result.client.nome}`
      : "Moto não encontrada",
  };
}

export default async function MotorcyclePage({
  params,
}: MotorcyclePageProps) {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  if (!result) {
    notFound();
  }

  if (!result.client.ativo) {
    return <SuspendedProfile client={result.client} />;
  }

  if (!result.motorcycle) {
    notFound();
  }

  const motorcycle = result.motorcycle;

  return (
    <ProfileFrame client={result.client}>
      <main className="page-container subpage-container">
        <SubpageHeader
          client={result.client}
          backHref={`/${result.client.slug}`}
        />

        <section className="motorcycle-hero">
          <div className="motorcycle-hero-copy">
            {motorcycle.selo ? (
              <span className="product-badge">{motorcycle.selo}</span>
            ) : null}
            <p className="eyebrow">{motorcycle.categoria}</p>
            <h1>{motorcycle.nome}</h1>
            <p>{motorcycle.descricao}</p>

            <div className="product-actions">
              {result.client.vendeConsorcio ? (
                <Link
                  className="button button-primary"
                  href={`/${result.client.slug}/consorcio/${motorcycle.slug}`}
                >
                  Ver planos de consórcio
                </Link>
              ) : null}

              {result.client.vendeFinanciamento &&
              motorcycle.financiamento ? (
                <Link
                  className={`button ${
                    result.client.vendeConsorcio
                      ? "button-light"
                      : "button-primary"
                  }`}
                  href={`/${result.client.slug}/financiamento/${motorcycle.slug}`}
                >
                  Simular financiamento
                </Link>
              ) : null}
            </div>
          </div>

          <div className="motorcycle-hero-visual">
            <div className="visual-orbit" aria-hidden="true" />
            <Image
              src={motorcycle.imagemUrl}
              alt={motorcycle.nome}
              width={720}
              height={500}
              priority
              unoptimized
            />
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading left">
            <p className="eyebrow">Conheça o modelo</p>
            <h2>{motorcycle.tituloDescricao}</h2>
          </div>

          <div className="details-grid">
            {motorcycle.detalhes.map((detail) => (
              <div className="detail-card" key={detail.rotulo}>
                <span>{detail.rotulo}</span>
                <strong>{detail.valor}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Destaques</p>
            <h2>Feita para acompanhar sua rotina</h2>
          </div>

          <div className="benefit-grid">
            {motorcycle.beneficios.map((benefit, index) => (
              <article className="benefit-card" key={benefit.titulo}>
                <span className="benefit-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{benefit.titulo}</h3>
                <p>{benefit.descricao}</p>
              </article>
            ))}
          </div>
        </section>

        <ContactSection client={result.client} />
      </main>
    </ProfileFrame>
  );
}
