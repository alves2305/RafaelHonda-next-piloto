"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ClientLogoutButton } from "@/components/client-demo/ClientLogoutButton";
import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./subscription-real.module.css";

type SubscriptionStatus = "pago" | "pendente" | "atrasado";

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

export default function ClientSubscriptionPage() {
  const access = useClientAccess();
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubscription() {
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
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubscription();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

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
          <Link href="/cliente-demo/dashboard">⌂ Visão geral</Link>
          <Link href="/cliente-demo/dashboard">○ Meu perfil</Link>
          <Link href="/cliente-demo/dashboard">◆ Minhas motos</Link>
          <Link className={styles.activeLink} href="/cliente-demo/assinatura">
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
            <p>Acompanhe a configuração real da sua mensalidade.</p>
          </div>

          <div>
            <Link href="/cliente-demo/dashboard">Voltar ao painel</Link>
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
                      : "Bloqueado manualmente"}
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
                      A regularização é confirmada manualmente pelo
                      administrador. Nenhuma cobrança automática foi ativada.
                    </p>
                  </div>
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
                    <h2>Integração ainda desativada</h2>
                  </div>

                  <div className={styles.paymentDisabled}>
                    <span>R$</span>
                    <strong>Sem cobrança automática</strong>
                    <p>
                      Pix e cartão serão integrados somente em uma fase
                      posterior. Não informe dados bancários neste sistema.
                    </p>
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
                <strong>O que está protegido nesta etapa</strong>
                <p>
                  O vendedor não consegue alterar valor, status, vencimento,
                  bloqueio ou dados de outros clientes. Também não há campos
                  para número de cartão, CVV ou chave Pix.
                </p>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
