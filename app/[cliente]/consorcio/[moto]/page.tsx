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

export const dynamic = "force-dynamic";

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

  if (!result.client.vendeConsorcio) {
    notFound();
  }

  if (!result.motorcycle) {
    notFound();
  }

  const motorcycle = result.motorcycle;

  if (motorcycle.planosConsorcio.length === 0) {
    notFound();
  }

  const nextMotorcycle = result.nextConsortiumMotorcycle;

  return (
    <ProfileFrame client={result.client}>
      <main className="page-container subpage-container">
        <SubpageHeader
          client={result.client}
          backHref={`/${result.client.slug}/moto/${motorcycle.slug}`}
          backLabel={`Voltar para ${motorcycle.nome}`}
        />

        <section className="plan-layout">
          <div className="plan-intro">
            <p className="eyebrow">Consórcio Honda</p>
            <h1>{motorcycle.nome}</h1>
            <p>
              Escolha o plano que cabe no seu planejamento e envie diretamente
              para {result.client.nome}.
            </p>
            <Image
              src={motorcycle.imagemUrl}
              alt={motorcycle.nome}
              width={700}
              height={460}
              priority
              unoptimized
            />
          </div>

          <div className="plan-card">
            {result.client.marcaDaguaUrl ? (
              <Image
                className="watermark"
                src={result.client.marcaDaguaUrl}
                alt=""
                width={300}
                height={140}
                unoptimized
              />
            ) : null}

            <div className="plan-card-content">
              <p className="eyebrow">Tabela centralizada</p>
              <h2>{motorcycle.tituloConsorcio}</h2>

              {motorcycle.planosConsorcio.length > 0 ? (
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
              ) : (
                <div className="empty-state">
                  <strong>Tabela em atualização.</strong>
                  <p>Fale com o vendedor para consultar as condições.</p>
                </div>
              )}

              <p className="plan-note">
                * Os valores podem sofrer alterações conforme a tabela do
                consórcio.
              </p>
            </div>
          </div>
        </section>

        {motorcycle.planosConsorcio.length > 0 ? (
          <section className="form-section">
            <ConsortiumForm
              client={result.client}
              motorcycle={motorcycle}
              plans={motorcycle.planosConsorcio}
            />
          </section>
        ) : null}

        {nextMotorcycle ? (
          <nav
            className="motorcycle-navigation"
            aria-label="Navegação entre motos"
          >
            <Link
              className="next-motorcycle-card"
              href={`/${result.client.slug}/consorcio/${nextMotorcycle.slug}`}
              aria-label={`Ver o consórcio da próxima moto: ${nextMotorcycle.nome}`}
            >
              <span>Próxima</span>
              <strong>{nextMotorcycle.nome}</strong>
              <span className="next-motorcycle-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </nav>
        ) : null}

        <ContactSection client={result.client} />
      </main>
    </ProfileFrame>
  );
}
