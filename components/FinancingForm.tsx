"use client";

import type { FormEvent } from "react";

import { createWhatsAppUrl, onlyDigits } from "@/lib/format";
import type { ClientProfile, Motorcycle } from "@/lib/types";

function isValidCpf(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  function calculateDigit(base: string, initialWeight: number) {
    const total = base
      .split("")
      .reduce(
        (sum, digit, index) =>
          sum + Number(digit) * (initialWeight - index),
        0,
      );
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  }

  return (
    calculateDigit(digits.slice(0, 9), 10) === Number(digits[9]) &&
    calculateDigit(digits.slice(0, 10), 11) === Number(digits[10])
  );
}

export function FinancingForm({
  client,
  motorcycle,
}: {
  client: ClientProfile;
  motorcycle: Motorcycle;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const entryValue = String(form.get("valorEntrada") ?? "").trim();
    const cpf = String(form.get("cpf") ?? "").trim();
    const fullName = String(form.get("nomeCompleto") ?? "").trim();
    const phone = String(form.get("telefone") ?? "").trim();
    const birthDate = String(form.get("dataNascimento") ?? "").trim();

    if (!isValidCpf(cpf)) {
      formElement
        .querySelector<HTMLInputElement>('[name="cpf"]')
        ?.setCustomValidity("Informe um CPF válido.");
      formElement.reportValidity();
      return;
    }

    if (!/^\d{10,11}$/.test(onlyDigits(phone))) {
      formElement
        .querySelector<HTMLInputElement>('[name="telefone"]')
        ?.setCustomValidity("Informe um telefone com DDD.");
      formElement.reportValidity();
      return;
    }

    const message = `Olá ${client.nome}, gostaria de fazer uma simulação de financiamento da ${motorcycle.nome}.

Valor da entrada: ${entryValue}

CPF: ${cpf}

Nome completo: ${fullName}

Telefone: ${phone}

Data de nascimento: ${birthDate}`;

    window.open(
      createWhatsAppUrl(client.whatsapp, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  function clearValidity(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <p className="eyebrow">Simulação personalizada</p>
        <h2>Envie seus dados para {client.nome}</h2>
      </div>

      <label>
        Valor da entrada
        <input
          name="valorEntrada"
          type="text"
          inputMode="decimal"
          placeholder="Ex.: R$ 5.000,00"
          required
        />
      </label>

      <label>
        CPF
        <input
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          onInput={clearValidity}
          required
        />
      </label>

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
        Telefone
        <input
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(74) 99999-9999"
          onInput={clearValidity}
          required
        />
      </label>

      <label>
        Data de nascimento
        <input name="dataNascimento" type="date" required />
      </label>

      <button className="button button-whatsapp" type="submit">
        Solicitar simulação
      </button>
    </form>
  );
}
