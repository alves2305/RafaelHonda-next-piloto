"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClientLogoutButton } from "@/components/client-demo/ClientLogoutButton";
import { PixPaymentButton } from "@/components/client-demo/PixPaymentButton";
import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "@/app/cliente-demo/assinatura/subscription-real.module.css";

type SubscriptionStatus = "pago" | "pendente" | "atrasado";
type PaymentFeedback = {
  kind: "success" | "error" | "info";
  message: string;
} | null;

type SubscriptionData = {
  clientId: string;
  clientName: string;
  clientSlug: string;
  catalogActive: boolean;
  monthlyAmount: number;
  dueDay: number;
  graceDays: number;
  status: SubscriptionStatus;
  reference: string;
  paymentMethod: string | null;
  lastPaymentDate: string | null;
  note: string | null;
  updatedAt: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Não registrado";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

function formatReference(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: SubscriptionStatus) {
  if (status === "pago") {
    return "Pago";
  }

  if (status === "atrasado") {
    return "Atrasado";
  }

  return "Pendente";
}

function normalizeSubscription(value: unknown): SubscriptionData {
  if (!value || typeof value !== "object") {
    throw new Error("A assinatura retornada é inválida.");
  }

  const row = value as Partial<SubscriptionData>;

  if (
    typeof row.clientId !== "string" ||
    typeof row.clientName !== "string" ||
    typeof row.clientSlug !== "string"
  ) {
    throw new Error("A assinatura não possui identificação válida.");
  }

  return {
    clientId: row.clientId,
    clientName: row.clientName,
    clientSlug: row.clientSlug,
    catalogActive: row.catalogActive !== false,
    monthlyAmount: Number(row.monthlyAmount ?? 0),
    dueDay: Number(row.dueDay ?? 10),
    graceDays: Number(row.graceDays ?? 0),
    status:
      row.status === "pago" ||
      row.status === "atrasado" ||
      row.status === "pendente"
        ? row.status
        : "pendente",
    reference:
      typeof row.reference === "string"
        ? row.reference
        : new Date().toISOString().slice(0, 10),
    paymentMethod:
      typeof row.paymentMethod === "string"
        ? row.paymentMethod
        : null,
    lastPaymentDate:
      typeof row.lastPaymentDate === "string"
        ? row.lastPaymentDate
        : null,
    note:
      typeof row.note === "string"
        ? row.note
        : null,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : null,
  };
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

async function readApiResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    checkoutUrl?: string;
    paid?: boolean;
  };

  if (!response.ok) {
    throw new Error(
      data.message || "Não foi possível concluir esta operação.",
    );
  }

  return data;
}

export default function ClientSubscriptionPage() {
  const access = useClientAccess();
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] =
    useState<PaymentFeedback>(null);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getClientSupabaseClient();
      const { data, error: loadError } = await supabase.rpc(
        "minha_assinatura_cliente",
      );

      if (loadError) {
        throw loadError;
      }

      const nextSubscription = normalizeSubscription(data);

      if (nextSubscription.clientId !== access.clientId) {
        throw new Error(
          "A assinatura retornada não corresponde à conta autenticada.",
        );
      }

      setSubscription(nextSubscription);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar sua assinatura. Confira a conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [access.clientId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubscription();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get("order_nsu");
    const transactionNsu = params.get("transaction_nsu");
    const slug = params.get("slug");
    const receiptUrl = params.get("receipt_url");

    if (!orderNsu || !transactionNsu || !slug) {
      return;
    }

    let active = true;

    async function confirmPayment() {
      setConfirmingPayment(true);
      setPaymentFeedback({
        kind: "info",
        message: "Confirmando seu pagamento com a InfinitePay...",
      });

      try {
        const token = await getSessionToken();
        const response = await fetch(
          "/api/painel/pagamentos/infinitepay/confirmar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderNsu,
              transactionNsu,
              slug,
              receiptUrl,
            }),
          },
        );

        const data = await readApiResponse(response);

        if (!active) {
          return;
        }

        setPaymentFeedback({
          kind: "success",
          message:
            data.message ||
            "Pagamento confirmado. Sua assinatura foi atualizada.",
        });

        await loadSubscription();
      } catch (confirmationError) {
        console.error(confirmationError);

        if (active) {
          setPaymentFeedback({
            kind: "error",
            message:
              confirmationError instanceof Error
                ? confirmationError.message
                : "Não foi possível confirmar o pagamento.",
          });
        }
      } finally {
        if (active) {
          setConfirmingPayment(false);
          window.history.replaceState({}, "", "/painel/assinatura");
        }
      }
    }

    void confirmPayment();

    return () => {
      active = false;
    };
  }, [loadSubscription]);

  async function startPayment() {
    setCreatingPayment(true);
    setPaymentFeedback(null);

    try {
      const token = await getSessionToken();
      const response = await fetch(
        "/api/painel/pagamentos/infinitepay/checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await readApiResponse(response);

      if (!data.checkoutUrl?.startsWith("https://")) {
        throw new Error(
          "O endereço de pagamento retornado é inválido.",
        );
      }

      window.location.assign(data.checkoutUrl);
    } catch (paymentError) {
      console.error(paymentError);
      setPaymentFeedback({
        kind: "error",
        message:
          paymentError instanceof Error
            ? paymentError.message
            : "Não foi possível abrir o pagamento.",
      });
      setCreatingPayment(false);
    }
  }

  const statusClass = useMemo(() => {
    if (subscription?.status === "pago") {
      return styles.statusPaid;
    }

    if (subscription?.status === "atrasado") {
      return styles.statusOverdue;
    }

    return styles.statusPending;
  }, [subscription?.status]);

  const initials = access.clientName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const paymentBusy = creatingPayment || confirmingPayment;
  const canPay =
    Boolean(subscription) &&
    subscription?.status !== "pago" &&
    Number(subscription?.monthlyAmount ?? 0) > 0;

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>H</span>
          <div>
            <strong>Painel do vendedor</strong>
            <small>Catálogo Honda</small>
          </div>
        </div>

        <div className={styles.identity}>
          <span>{initials || "H"}</span>
          <div>
            <strong>{access.clientName}</strong>
            <small>Assinatura vinculada</small>
          </div>
        </div>

        <nav>
          <Link href="/painel">⌂ Visão geral</Link>
          <Link href="/painel">○ Meu perfil</Link>
          <Link href="/painel">◆ Minhas motos</Link>
          <Link className={styles.activeLink} href="/painel/assinatura">
            R$ Minha assinatura
          </Link>
        </nav>

        <div className={styles.sidebarNotice}>
          <span>Dados protegidos</span>
          <p>
            Esta tela exibe somente a assinatura vinculada à sua conta.
          </p>
        </div>

        <ClientLogoutButton className={styles.logout} />
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>Minha assinatura</h1>
            <p>Acompanhe e pague a mensalidade do seu catálogo.</p>
          </div>

          <div>
            <Link href="/painel">Voltar ao painel</Link>
            <Link href={`/${access.clientSlug}`} target="_blank">
              Abrir catálogo ↗
            </Link>
          </div>
        </header>

        <main className={styles.content}>
          {loading ? (
            <section className={styles.stateCard}>
              <span className={styles.spinner} />
              <h2>Carregando assinatura</h2>
              <p>Buscando os dados vinculados à sua conta no Supabase.</p>
            </section>
          ) : null}

          {!loading && error ? (
            <section className={styles.stateCard}>
              <span className={styles.errorMark}>!</span>
              <h2>Não foi possível carregar</h2>
              <p>{error}</p>
              <button type="button" onClick={() => void loadSubscription()}>
                Tentar novamente
              </button>
            </section>
          ) : null}

          {!loading && !error && subscription ? (
            <>
              <section
                className={`${styles.hero} ${
                  subscription.status === "atrasado"
                    ? styles.heroOverdue
                    : ""
                }`}
              >
                <div>
                  <span>Plano Catálogo Honda</span>
                  <h2>{formatCurrency(subscription.monthlyAmount)}</h2>
                  <p>
                    Referência: {formatReference(subscription.reference)}
                  </p>

                  <div className={styles.heroMeta}>
                    <div>
                      <small>Vencimento</small>
                      <strong>Todo dia {subscription.dueDay}</strong>
                    </div>

                    <div>
                      <small>Tolerância informativa</small>
                      <strong>{subscription.graceDays} dias</strong>
                    </div>

                    <div>
                      <small>Status</small>
                      <strong className={`${styles.status} ${statusClass}`}>
                        {getStatusLabel(subscription.status)}
                      </strong>
                    </div>
                  </div>
                </div>

                <aside className={styles.catalogCard}>
                  <span>Status do catálogo</span>
                  <strong>
                    {subscription.catalogActive
                      ? "Ativo e publicado"
                      : "Bloqueado"}
                  </strong>
                  <p>/{subscription.clientSlug}</p>
                </aside>
              </section>

              {subscription.status === "atrasado" ? (
                <section className={styles.alert}>
                  <span>!</span>
                  <div>
                    <strong>Mensalidade marcada como atrasada</strong>
                    <p>
                      Cartões são confirmados automaticamente. O Pix direto é
                      confirmado manualmente pelo administrador.
                    </p>
                  </div>
                </section>
              ) : null}

              {paymentFeedback ? (
                <section
                  className={`${styles.paymentFeedback} ${
                    paymentFeedback.kind === "success"
                      ? styles.paymentFeedbackSuccess
                      : paymentFeedback.kind === "error"
                        ? styles.paymentFeedbackError
                        : styles.paymentFeedbackInfo
                  }`}
                >
                  <strong>
                    {paymentFeedback.kind === "success"
                      ? "Pagamento atualizado"
                      : paymentFeedback.kind === "error"
                        ? "Atenção"
                        : "Processando"}
                  </strong>
                  <p>{paymentFeedback.message}</p>
                </section>
              ) : null}

              <div className={styles.columns}>
                <section className={styles.panel}>
                  <div className={styles.panelHeading}>
                    <span>Resumo</span>
                    <h2>Detalhes da mensalidade</h2>
                  </div>

                  <dl className={styles.details}>
                    <div>
                      <dt>Valor mensal</dt>
                      <dd>{formatCurrency(subscription.monthlyAmount)}</dd>
                    </div>
                    <div>
                      <dt>Mês de referência</dt>
                      <dd>{formatReference(subscription.reference)}</dd>
                    </div>
                    <div>
                      <dt>Dia do vencimento</dt>
                      <dd>Dia {subscription.dueDay}</dd>
                    </div>
                    <div>
                      <dt>Último pagamento</dt>
                      <dd>{formatDate(subscription.lastPaymentDate)}</dd>
                    </div>
                    <div>
                      <dt>Forma registrada</dt>
                      <dd>
                        {subscription.paymentMethod ??
                          "Nenhuma forma registrada"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <aside className={styles.panel}>
                  <div className={styles.panelHeading}>
                    <span>Pagamento</span>
                    <h2>
                      {subscription.status === "pago"
                        ? "Mensalidade confirmada"
                        : "Escolha como pagar"}
                    </h2>
                  </div>

                  <div className={styles.paymentBox}>
                    <span className={styles.paymentIcon}>
                      {subscription.status === "pago" ? "✓" : "R$"}
                    </span>
                    <strong>
                      {subscription.status === "pago"
                        ? "Pagamento recebido"
                        : formatCurrency(subscription.monthlyAmount)}
                    </strong>
                    <p>
                      {subscription.status === "pago"
                        ? "Esta referência já está regularizada."
                        : "Pague rapidamente por Pix direto ou use o cartão no checkout seguro da InfinitePay."}
                    </p>

                    <PixPaymentButton
                      disabled={!canPay || paymentBusy}
                    />

                    <button
                      className={styles.paymentButton}
                      type="button"
                      disabled={!canPay || paymentBusy}
                      onClick={() => void startPayment()}
                    >
                      {confirmingPayment
                        ? "Confirmando pagamento..."
                        : creatingPayment
                          ? "Abrindo cartão..."
                          : subscription.status === "pago"
                            ? "Mensalidade paga"
                            : "Pagar com cartão"}
                    </button>

                    {subscription.status !== "pago" ? (
                      <small>
                        Pix: confirmação manual. Cartão: confirmação automática
                        pela InfinitePay.
                      </small>
                    ) : null}
                  </div>

                  {subscription.note ? (
                    <div className={styles.note}>
                      <strong>Observação do administrador</strong>
                      <p>{subscription.note}</p>
                    </div>
                  ) : null}
                </aside>
              </div>

              <section className={styles.security}>
                <strong>Pagamento protegido</strong>
                <p>
                  O valor é definido pelo administrador. Cartão, CVV e dados
                  bancários são preenchidos somente no ambiente da InfinitePay.
                  Antes de marcar como pago, o servidor confirma o pedido, o
                  vendedor e o valor diretamente com a operadora.
                </p>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
