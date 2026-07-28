import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/ContactSection";
import { FinancingForm } from "@/components/FinancingForm";
import { MotorcycleVisualStage } from "@/components/MotorcycleVisualStage";
import { ProfileFrame } from "@/components/ProfileFrame";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SuspendedProfile } from "@/components/SuspendedProfile";
import { getClientMotorcycle } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type FinancingPageProps = {
  params: Promise<{ cliente: string; moto: string }>;
};

export async function generateMetadata({
  params,
}: FinancingPageProps): Promise<Metadata> {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  return {
    title:
      result?.motorcycle &&
      result.client.vendeFinanciamento &&
      result.motorcycle.financiamento
        ? `Financiamento ${result.motorcycle.nome}`
        : "Simulação não encontrada",
  };
}

export default async function FinancingPage({
  params,
}: FinancingPageProps) {
  const { cliente, moto } = await params;
  const result = await getClientMotorcycle(cliente, moto);

  if (!result) {
    notFound();
  }

  if (!result.client.ativo) {
    return <SuspendedProfile client={result.client} />;
  }

  if (!result.client.vendeFinanciamento) {
    notFound();
  }

  if (!result.motorcycle) {
    notFound();
  }

  const motorcycle = result.motorcycle;
  const financing = motorcycle.financiamento;

  if (!financing) {
    notFound();
  }

  return (
    <ProfileFrame client={result.client}>
      <main className="page-container subpage-container">
        <SubpageHeader
          client={result.client}
          backHref={`/${result.client.slug}/moto/${motorcycle.slug}`}
          backLabel={`Voltar para ${motorcycle.nome}`}
        />

        <section className="financing-hero">
          <div>
            <p className="eyebrow">Financiamento Honda</p>
            <h1>{motorcycle.nome}</h1>
            <h2>{financing.titulo}</h2>
            <p>{financing.descricao}</p>
          </div>

          <MotorcycleVisualStage
            imageUrl={motorcycle.imagemUrl}
            motorcycleName={motorcycle.nome}
            variant="financing"
            mobileFirst
          />
        </section>

        <section className="steps-section">
          <div className="section-heading">
            <p className="eyebrow">Como funciona</p>
            <h2>Uma solicitação simples e rápida</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span>1</span>
              <h3>Preencha seus dados</h3>
              <p>
                Informe os dados necessários para a consulta.
              </p>
            </div>

            <div className="step-card">
              <span>2</span>
              <h3>Receba a simulação</h3>
              <p>
                O vendedor consulta as condições disponíveis.
              </p>
            </div>

            <div className="step-card">
              <span>3</span>
              <h3>Escolha com calma</h3>
              <p>
                Compare as opções antes de tomar sua decisão.
              </p>
            </div>
          </div>
        </section>

        <section className="form-section">
          <FinancingForm
            client={result.client}
            motorcycle={motorcycle}
          />

          <p className="privacy-note">
            Os dados são usados apenas para montar a mensagem
            no seu dispositivo. O site não armazena este
            formulário.
          </p>

          <p className="analysis-note">
            {financing.observacao}
          </p>
        </section>

        <ContactSection client={result.client} />
      </main>
    </ProfileFrame>
  );
}
