import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsortiumForm } from "@/components/ConsortiumForm";
import { ContactSection } from "@/components/ContactSection";
import { MobileMotorcycleSwipe } from "@/components/MobileMotorcycleSwipe";
import swipeStyles from "@/components/MobileMotorcycleSwipe.module.css";
import { MotorcycleVisualStage } from "@/components/MotorcycleVisualStage";
import { ProfileFrame } from "@/components/ProfileFrame";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SuspendedProfile } from "@/components/SuspendedProfile";
import { getClientMotorcycle } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";

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

  const previousMotorcycle =
    result.previousConsortiumMotorcycle;
  const nextMotorcycle =
    result.nextConsortiumMotorcycle;

  const previousDirection = previousMotorcycle
    ? {
        href: `/${result.client.slug}/consorcio/${previousMotorcycle.slug}`,
        name: previousMotorcycle.nome,
      }
    : null;

  const nextDirection = nextMotorcycle
    ? {
        href: `/${result.client.slug}/consorcio/${nextMotorcycle.slug}`,
        name: nextMotorcycle.nome,
      }
    : null;

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

            <MotorcycleVisualStage
              imageUrl={motorcycle.imagemUrl}
              motorcycleName={motorcycle.nome}
              variant="consortium"
            />
          </div>

          <MobileMotorcycleSwipe
            previous={previousDirection}
            next={nextDirection}
          >
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
                  {motorcycle.planosConsorcio.map(
                    (plan) => (
                      <div
                        className={`installment-row ${
                          plan.destaque
                            ? "featured"
                            : ""
                        }`}
                        key={plan.id}
                      >
                        <span>{plan.parcelas}x</span>
                        <strong>
                          {formatCurrency(
                            plan.valorParcela,
                          )}
                        </strong>

                        {plan.destaque ? (
                          <small>Mais leve</small>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>

                <p className="plan-note">
                  * Os valores podem sofrer alterações
                  conforme a tabela do consórcio.
                </p>
              </div>
            </div>
          </MobileMotorcycleSwipe>
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
            className={`${swipeStyles.desktopNavigation} motorcycle-navigation`}
            aria-label="Navegação entre motos"
          >
            {previousMotorcycle && previousDirection ? (
              <Link
                className="motorcycle-nav-card previous"
                href={previousDirection.href}
                aria-label={`Ver o consórcio da moto anterior: ${previousMotorcycle.nome}`}
                prefetch={false}
              >
                <span
                  className="motorcycle-nav-arrow"
                  aria-hidden="true"
                >
                  ←
                </span>
                <span className="motorcycle-nav-label">
                  Anterior
                </span>
                <strong>
                  {previousMotorcycle.nome}
                </strong>
              </Link>
            ) : null}

            {nextMotorcycle && nextDirection ? (
              <Link
                className="motorcycle-nav-card next"
                href={nextDirection.href}
                aria-label={`Ver o consórcio da próxima moto: ${nextMotorcycle.nome}`}
                prefetch={false}
              >
                <span className="motorcycle-nav-label">
                  Próxima
                </span>
                <strong>{nextMotorcycle.nome}</strong>
                <span
                  className="motorcycle-nav-arrow"
                  aria-hidden="true"
                >
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
