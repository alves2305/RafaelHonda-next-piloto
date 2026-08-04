"use client";

import Image from "next/image";
import { useState } from "react";

import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./pix-payment.module.css";

type PixPaymentData = {
  amount: number;
  reference: string;
  copyPaste: string;
  qrCodeDataUrl: string;
  whatsappUrl: string | null;
  manualConfirmation: boolean;
};

type ApiResponse = Partial<PixPaymentData> & {
  message?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatReference(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

async function getSessionToken() {
  const supabase = getClientSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente no painel.");
  }

  return session.access_token;
}

export function PixPaymentButton({ disabled }: { disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixPaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function openPix() {
    setLoading(true);
    setCopied(false);
    setError("");

    try {
      const token = await getSessionToken();
      const response = await fetch("/api/painel/pagamentos/pix", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível gerar o Pix.");
      }

      if (
        typeof data.amount !== "number" ||
        typeof data.reference !== "string" ||
        typeof data.copyPaste !== "string" ||
        typeof data.qrCodeDataUrl !== "string"
      ) {
        throw new Error("O Pix retornado é inválido.");
      }

      setPix({
        amount: data.amount,
        reference: data.reference,
        copyPaste: data.copyPaste,
        qrCodeDataUrl: data.qrCodeDataUrl,
        whatsappUrl:
          typeof data.whatsappUrl === "string" ? data.whatsappUrl : null,
        manualConfirmation: data.manualConfirmation === true,
      });
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível gerar o Pix.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!pix) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
    } catch {
      setError(
        "Não foi possível copiar automaticamente. Selecione o código e copie manualmente.",
      );
    }
  }

  return (
    <>
      <button
        className={styles.pixButton}
        type="button"
        disabled={disabled || loading}
        onClick={() => void openPix()}
      >
        {loading ? "Gerando Pix..." : "Pagar com Pix"}
      </button>

      {error ? <p className={styles.inlineError}>{error}</p> : null}

      {pix ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPix(null);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pix-payment-title"
          >
            <button
              className={styles.close}
              type="button"
              aria-label="Fechar Pix"
              onClick={() => setPix(null)}
            >
              ×
            </button>

            <span className={styles.label}>Pix Nubank</span>
            <h2 id="pix-payment-title">
              Pague {formatCurrency(pix.amount)}
            </h2>
            <p>
              Escaneie o QR Code ou copie o código Pix. Depois, avise o
              administrador para ele confirmar o recebimento.
            </p>

            <div className={styles.qr}>
              <Image
                src={pix.qrCodeDataUrl}
                width={300}
                height={300}
                unoptimized
                alt="QR Code Pix da mensalidade"
              />
            </div>

            <label className={styles.codeLabel}>
              Pix Copia e Cola
              <textarea
                readOnly
                value={pix.copyPaste}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>

            <button
              className={styles.copyButton}
              type="button"
              onClick={() => void copyCode()}
            >
              {copied ? "Código copiado ✓" : "Copiar código Pix"}
            </button>

            {pix.whatsappUrl ? (
              <a
                className={styles.whatsappButton}
                href={pix.whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Já paguei — avisar no WhatsApp
              </a>
            ) : (
              <p className={styles.missingWhatsapp}>
                Depois de pagar, envie o comprovante ao administrador.
              </p>
            )}

            <small>Referência: {formatReference(pix.reference)}</small>
          </section>
        </div>
      ) : null}
    </>
  );
}
