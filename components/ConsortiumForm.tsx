"use client";

import type { FormEvent } from "react";

import { createWhatsAppUrl, formatCurrency } from "@/lib/format";
import type { ClientProfile, ConsortiumPlan, Motorcycle } from "@/lib/types";

export function ConsortiumForm({
  client,
  motorcycle,
  plans,
}: {
  client: ClientProfile;
  motorcycle: Motorcycle;
  plans: ConsortiumPlan[];
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("nomeCompleto") ?? "").trim();
    const city = String(form.get("cidade") ?? "").trim();
    const planId = String(form.get("plano") ?? "");
    const selectedPlan = plans.find((plan) => plan.id === planId);

    if (!fullName || !city || !selectedPlan) {
      return;
    }

    const planLabel = `${selectedPlan.parcelas}x de ${formatCurrency(
      selectedPlan.valorParcela,
    )}`;
    const message = `Olá ${client.nome}, gostaria de fazer agora meu consórcio da ${motorcycle.nome}.

Nome completo: ${fullName}

Cidade: ${city}

Plano escolhido: ${planLabel}`;

    window.open(
      createWhatsAppUrl(client.whatsapp, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <p className="eyebrow">Fazer agora</p>
        <h2>Envie seu plano para {client.nome}</h2>
      </div>

      <label>
        Nome completo
        <input
          name="nomeCompleto"
          type="text"
          autoComplete="name"
          placeholder="Digite seu nome completo"
          required
        />
      </label>

      <label>
        Cidade
        <input
          name="cidade"
          type="text"
          autoComplete="address-level2"
          placeholder="Digite sua cidade"
          required
        />
      </label>

      <label>
        Plano
        <select name="plano" defaultValue="" required>
          <option value="" disabled>
            Escolha o plano
          </option>
          {plans.map((plan) => (
            <option value={plan.id} key={plan.id}>
              {plan.parcelas}x de {formatCurrency(plan.valorParcela)}
            </option>
          ))}
        </select>
      </label>

      <button className="button button-whatsapp" type="submit">
        Enviar no WhatsApp
      </button>
    </form>
  );
}
