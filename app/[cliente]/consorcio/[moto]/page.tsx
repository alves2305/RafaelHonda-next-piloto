import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsortiumForm } from "@/components/ConsortiumForm";
import { ContactSection } from "@/components/ContactSection";
import { ProfileFrame } from "@/components/ProfileFrame";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SuspendedProfile } from "@/components/SuspendedProfile";
import { getClientMotorcycle } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";
import { canOptimizePublicImage } from "@/lib/public-image";

export const revalidate = 30;

type ConsortiumPageProps = {
  params: Promise<{ cliente: string; moto: string }>;
};

export async function generateMetadata({
  params,
}: ConsortiumPageProps): Promise<Metadata> {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  return {
    title:
      result?.motorcycle &&
      result.client.vendeConsorcio &&
      result.motorcycle.planosConsorcio.length > 0
        ? `Consórcio ${result.motorcycle.nome}`
        : "Plano não encontrado",
  };
}

export default async function ConsortiumPage({
  params,
}: ConsortiumPageProps) {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  if (!result) {
    notFound();
  }

  if (!result.client.ativo) {
    return <SuspendedProfile client={result.client} />;
  }

  if (!result.client.vendeConsorcio || !result.motorcycle) {
    notFound();
  }

  const motorcycle = result.motorcycle;

  if (motorcycle.planosConsorcio.length === 0) {
    notFound();
  }

  const previousMotorcycle = result.previousConsortiumMotorcycle;
  const nextMotorcycle = result.nextConsortiumMotorcycle;

  return (
    <ProfileFrame client={result.client}>
      <main className="page-container subpage-container consortium-page">
        <SubpageHeader
          client={result.client}
          backHref={`/${result.client.slug}/moto/${motorcycle.slug}`}
          backLabel={`Voltar para ${motorcycle.nome}`}
        />

        <section className="plan-layout">
          <div className="plan-intro">
            <p className="eyebrow">Consórcio Honda</p>
            <h1>{motorcycle.nome}</h1>

            <Image
              src={motorcycle.imagemUrl}
              alt={motorcycle.nome}
              width={700}
              height={460}
              priority
              sizes="(max-width: 720px) 92vw, (max-width: 1180px) 48vw, 650px"
              unoptimized={!canOptimizePublicImage(motorcycle.imagemUrl)}
            />
          </div>

          <div className="plan-card">
            {result.client.marcaDaguaUrl ? (
              <div
                className="watermark-pattern"
                style={{
                  backgroundImage: `url("${result.client.marcaDaguaUrl}")`,
                }}
                aria-hidden="true"
              />
            ) : null}

            <div className="plan-card-content">
              <h2>{motorcycle.tituloConsorcio}</h2>

              <div className="installment-list">
                {motorcycle.planosConsorcio.map((plan) => (
                  <div
                    className={`installment-row ${
                      plan.destaque ? "featured" : ""
                    }`}
                    key={plan.id}
                  >
                    <span>{plan.parcelas}x</span>
                    <strong>{formatCurrency(plan.valorParcela)}</strong>
                    {plan.destaque ? <small>Mais leve</small> : null}
                  </div>
                ))}
              </div>

              <p className="plan-note">
                * Os valores podem sofrer alterações conforme a tabela do
                consórcio.
              </p>
            </div>
          </div>
        </section>

        <section className="form-section">
          <ConsortiumForm
            client={result.client}
            motorcycle={motorcycle}
            plans={motorcycle.planosConsorcio}
          />
        </section>

        {previousMotorcycle || nextMotorcycle ? (
          <nav
            className="motorcycle-navigation"
            aria-label="Navegação entre motos"
          >
            {previousMotorcycle ? (
              <Link
                className="motorcycle-nav-card previous"
                href={`/${result.client.slug}/consorcio/${previousMotorcycle.slug}`}
                aria-label={`Ver o consórcio da moto anterior: ${previousMotorcycle.nome}`}
                prefetch={false}
              >
                <span className="motorcycle-nav-arrow" aria-hidden="true">
                  ←
                </span>
                <span className="motorcycle-nav-label">Anterior</span>
                <strong>{previousMotorcycle.nome}</strong>
              </Link>
            ) : null}

            {nextMotorcycle ? (
              <Link
                className="motorcycle-nav-card next"
                href={`/${result.client.slug}/consorcio/${nextMotorcycle.slug}`}
                aria-label={`Ver o consórcio da próxima moto: ${nextMotorcycle.nome}`}
                prefetch={false}
              >
                <span className="motorcycle-nav-label">Próxima</span>
                <strong>{nextMotorcycle.nome}</strong>
                <span className="motorcycle-nav-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        <ContactSection client={result.client} />
      </main>
    </ProfileFrame>
  );
}
