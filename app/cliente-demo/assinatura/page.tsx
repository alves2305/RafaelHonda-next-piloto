"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_DEMO_BILLING,
  type DemoBillingClient,
  type DemoBillingData,
  formatDemoCurrency,
  getDemoBillingStatusLabel,
  loadDemoBilling,
  saveDemoBilling,
} from "../billing-demo";

import styles from "../cliente-demo.module.css";

type PaymentModal = "pix" | "card" | null;

const PIX_DEMO_CODE =
  "00020126580014BR.GOV.BCB.PIX0136catalogo-honda-demo-gd520400005303986540549.905802BR5920CATALOGO HONDA DEMO6008IRECE-BA62070503***6304DEMO";

function getTodayPtBr() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

export default function ClientSubscriptionDemoPage() {
  const [billingData, setBillingData] =
    useState<DemoBillingData>(DEFAULT_DEMO_BILLING);
  const [modal, setModal] = useState<PaymentModal>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardName, setCardName] = useState("GD HONDA");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [cardCvv, setCardCvv] = useState("123");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBillingData(loadDemoBilling());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const billing = billingData.gd ?? DEFAULT_DEMO_BILLING.gd;

  const statusClass =
    billing.status === "paid"
      ? styles.billingStatusPaid
      : billing.status === "overdue"
        ? styles.billingStatusOverdue
        : styles.billingStatusPending;

  const blockRule = useMemo(() => {
    if (!billing.automaticBlock) {
      return "Bloqueio automático desativado";
    }

    if (billing.graceDays === 0) {
      return "Bloqueio previsto após o vencimento";
    }

    return `Bloqueio previsto após ${billing.graceDays} dias de atraso`;
  }, [billing.automaticBlock, billing.graceDays]);

  function updateBilling(nextBilling: DemoBillingClient) {
    const nextData = {
      ...billingData,
      gd: nextBilling,
    };

    setBillingData(nextData);
    saveDemoBilling(nextData);
  }

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(PIX_DEMO_CODE);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function simulatePixPayment() {
    updateBilling({
      ...billing,
      status: "paid",
      paymentMethod: "Pix",
      lastPaymentDate: getTodayPtBr(),
    });
    setModal(null);
    setMessage("Pagamento Pix simulado e assinatura atualizada para Pago.");
  }

  function saveDemoCard() {
    const digits = cardNumber.replace(/\D/g, "");
    const lastFour = digits.slice(-4) || "4242";

    updateBilling({
      ...billing,
      status: "paid",
      paymentMethod: `Cartão •••• ${lastFour}`,
      lastPaymentDate: getTodayPtBr(),
    });
    setModal(null);
    setMessage(
      `Cartão final ${lastFour} cadastrado na demonstração. Nenhum dado real foi enviado.`,
    );
  }

  return (
    <div className={styles.subscriptionApp}>
      <aside className={styles.subscriptionSidebar}>
        <div className={styles.sidebarBrand}>
          <span>H</span>
          <div>
            <strong>Painel do vendedor</strong>
            <small>Catálogo Honda</small>
          </div>
        </div>

        <div className={styles.clientIdentity}>
          <span>GD</span>
          <div>
            <strong>GD Honda</strong>
            <small>Catálogo ativo</small>
          </div>
        </div>

        <nav className={styles.subscriptionNavigation}>
          <Link href="/cliente-demo/dashboard">⌂ Visão geral</Link>
          <Link href="/cliente-demo/dashboard">○ Meu perfil</Link>
          <Link href="/cliente-demo/dashboard">◆ Minhas motos</Link>
          <Link
            className={styles.subscriptionNavigationActive}
            href="/cliente-demo/assinatura"
          >
            R$ Minha assinatura
          </Link>
        </nav>

        <div className={styles.sidebarRestriction}>
          <span>Pagamento protegido</span>
          <p>
            No sistema real, cartão e Pix serão processados por uma plataforma
            de pagamentos. O catálogo não armazenará os dados completos do
            cartão.
          </p>
        </div>

        <Link className={styles.logoutLink} href="/cliente-demo/login">
          <span>↩</span>
          Sair
        </Link>
      </aside>

      <div className={styles.subscriptionMain}>
        <header className={styles.subscriptionTopbar}>
          <div>
            <h1>Minha assinatura</h1>
            <p>Acompanhe sua mensalidade e escolha como pagar.</p>
          </div>

          <div>
            <Link href="/cliente-demo/admin-cobranca">
              Simular valor no admin
            </Link>
            <Link href="/gd" target="_blank">
              Abrir catálogo ↗
            </Link>
          </div>
        </header>

        <main className={styles.subscriptionContent}>
          <section
            className={`${styles.subscriptionHero} ${
              billing.status === "overdue"
                ? styles.subscriptionHeroOverdue
                : ""
            }`}
          >
            <div>
              <span>Plano Catálogo Honda</span>
              <h2>{formatDemoCurrency(billing.monthlyAmount)}</h2>
              <p>Mensalidade definida individualmente pelo administrador.</p>

              <div className={styles.subscriptionHeroMeta}>
                <div>
                  <small>Vencimento</small>
                  <strong>Todo dia {billing.dueDay}</strong>
                </div>
                <div>
                  <small>Tolerância</small>
                  <strong>{billing.graceDays} dias</strong>
                </div>
                <div>
                  <small>Status</small>
                  <strong className={`${styles.billingStatusBadge} ${statusClass}`}>
                    {getDemoBillingStatusLabel(billing.status)}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.subscriptionPaymentCard}>
              <span>Próxima cobrança</span>
              <strong>Dia {billing.dueDay}</strong>
              <p>{blockRule}</p>

              <button type="button" onClick={() => setModal("pix")}>
                Pagar com Pix
              </button>
              <button type="button" onClick={() => setModal("card")}>
                {billing.paymentMethod?.startsWith("Cartão")
                  ? "Trocar cartão"
                  : "Cadastrar cartão"}
              </button>
            </div>
          </section>

          {message ? (
            <div className={styles.subscriptionSuccess}>
              <strong>Pronto!</strong>
              <p>{message}</p>
              <button type="button" onClick={() => setMessage("")}>
                Fechar
              </button>
            </div>
          ) : null}

          {billing.status === "overdue" ? (
            <div className={styles.subscriptionAlert}>
              <div>
                <span>!</span>
                <div>
                  <strong>Mensalidade em atraso</strong>
                  <p>
                    Regularize o pagamento para evitar o bloqueio automático
                    após o prazo de tolerância.
                  </p>
                </div>
              </div>

              <button type="button" onClick={() => setModal("pix")}>
                Regularizar agora
              </button>
            </div>
          ) : null}

          <div className={styles.subscriptionColumns}>
            <section className={styles.subscriptionPanel}>
              <div className={styles.subscriptionPanelHeading}>
                <div>
                  <span>Formas de pagamento</span>
                  <h2>Escolha a opção mais prática</h2>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <button type="button" onClick={() => setModal("pix")}>
                  <span className={styles.paymentMethodIcon}>PIX</span>
                  <div>
                    <strong>Pix</strong>
                    <p>QR Code e Pix Copia e Cola para pagamento imediato.</p>
                  </div>
                  <i>→</i>
                </button>

                <button type="button" onClick={() => setModal("card")}>
                  <span className={styles.paymentMethodIcon}>CARD</span>
                  <div>
                    <strong>Cartão de crédito</strong>
                    <p>
                      Cadastre o cartão para cobrança automática da mensalidade.
                    </p>
                  </div>
                  <i>→</i>
                </button>
              </div>

              <div className={styles.savedPaymentMethod}>
                <span>Forma cadastrada</span>
                <strong>{billing.paymentMethod ?? "Nenhuma forma cadastrada"}</strong>
                <p>
                  No sistema real, apenas identificadores seguros, bandeira e
                  últimos dígitos serão exibidos.
                </p>
              </div>
            </section>

            <aside className={styles.subscriptionPanel}>
              <div className={styles.subscriptionPanelHeading}>
                <div>
                  <span>Resumo</span>
                  <h2>Regras da assinatura</h2>
                </div>
              </div>

              <dl className={styles.subscriptionRules}>
                <div>
                  <dt>Mensalidade</dt>
                  <dd>{formatDemoCurrency(billing.monthlyAmount)}</dd>
                </div>
                <div>
                  <dt>Vencimento</dt>
                  <dd>Dia {billing.dueDay}</dd>
                </div>
                <div>
                  <dt>Tolerância</dt>
                  <dd>{billing.graceDays} dias</dd>
                </div>
                <div>
                  <dt>Bloqueio automático</dt>
                  <dd>{billing.automaticBlock ? "Ativo" : "Desativado"}</dd>
                </div>
                <div>
                  <dt>Último pagamento</dt>
                  <dd>{billing.lastPaymentDate ?? "Ainda não registrado"}</dd>
                </div>
              </dl>
            </aside>
          </div>

          <section className={styles.subscriptionPanel}>
            <div className={styles.subscriptionPanelHeading}>
              <div>
                <span>Histórico</span>
                <h2>Últimos pagamentos</h2>
              </div>
            </div>

            <div className={styles.paymentHistory}>
              <div className={styles.paymentHistoryHeader}>
                <span>Referência</span>
                <span>Forma</span>
                <span>Valor</span>
                <span>Status</span>
              </div>

              <div>
                <span>Julho de 2026</span>
                <span>{billing.paymentMethod ?? "Pix"}</span>
                <span>{formatDemoCurrency(billing.monthlyAmount)}</span>
                <strong className={`${styles.billingStatusBadge} ${statusClass}`}>
                  {getDemoBillingStatusLabel(billing.status)}
                </strong>
              </div>

              <div>
                <span>Junho de 2026</span>
                <span>Pix</span>
                <span>{formatDemoCurrency(billing.monthlyAmount)}</span>
                <strong
                  className={`${styles.billingStatusBadge} ${styles.billingStatusPaid}`}
                >
                  Pago
                </strong>
              </div>

              <div>
                <span>Maio de 2026</span>
                <span>Cartão •••• 4242</span>
                <span>{formatDemoCurrency(billing.monthlyAmount)}</span>
                <strong
                  className={`${styles.billingStatusBadge} ${styles.billingStatusPaid}`}
                >
                  Pago
                </strong>
              </div>
            </div>
          </section>

          <div className={styles.prototypeWarning}>
            <strong>Protótipo sem cobrança real.</strong>
            <p>
              Os botões apenas simulam Pix, cartão e confirmação de pagamento.
              Não use dados verdadeiros nesta demonstração.
            </p>
          </div>
        </main>
      </div>

      {modal ? (
        <div className={styles.paymentModalBackdrop}>
          <section
            className={styles.paymentModal}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "pix"
                ? "Pagamento Pix simulado"
                : "Cadastro de cartão simulado"
            }
          >
            <button
              className={styles.paymentModalClose}
              type="button"
              onClick={() => {
                setModal(null);
                setCopied(false);
              }}
              aria-label="Fechar"
            >
              ×
            </button>

            {modal === "pix" ? (
              <>
                <span className={styles.paymentModalEyebrow}>
                  Pagamento por Pix
                </span>
                <h2>{formatDemoCurrency(billing.monthlyAmount)}</h2>
                <p>
                  Escaneie o QR Code ou copie o código. Este conteúdo é apenas
                  visual e não representa uma cobrança verdadeira.
                </p>

                <div className={styles.fakeQrCode} aria-label="QR Code simulado">
                  {Array.from({ length: 81 }).map((_, index) => (
                    <i key={index} />
                  ))}
                </div>

                <div className={styles.pixCopyField}>
                  <span>{PIX_DEMO_CODE}</span>
                  <button type="button" onClick={copyPixCode}>
                    {copied ? "Copiado" : "Copiar código"}
                  </button>
                </div>

                <button
                  className={styles.paymentModalPrimary}
                  type="button"
                  onClick={simulatePixPayment}
                >
                  Simular pagamento aprovado
                </button>
              </>
            ) : (
              <>
                <span className={styles.paymentModalEyebrow}>
                  Cartão de crédito
                </span>
                <h2>Cobrança automática</h2>
                <p>
                  Use somente os dados fictícios já preenchidos. O protótipo não
                  envia nem armazena o número completo.
                </p>

                <div className={styles.demoCardPreview}>
                  <small>CATÁLOGO HONDA</small>
                  <strong>{cardNumber || "•••• •••• •••• ••••"}</strong>
                  <div>
                    <span>{cardName || "NOME DO CLIENTE"}</span>
                    <span>{cardExpiry || "MM/AA"}</span>
                  </div>
                </div>

                <div className={styles.cardDemoFields}>
                  <label>
                    Nome no cartão
                    <input
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                    />
                  </label>

                  <label>
                    Número fictício
                    <input
                      value={cardNumber}
                      inputMode="numeric"
                      onChange={(event) => setCardNumber(event.target.value)}
                    />
                  </label>

                  <div>
                    <label>
                      Validade
                      <input
                        value={cardExpiry}
                        onChange={(event) => setCardExpiry(event.target.value)}
                      />
                    </label>

                    <label>
                      CVV fictício
                      <input
                        value={cardCvv}
                        inputMode="numeric"
                        onChange={(event) => setCardCvv(event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <button
                  className={styles.paymentModalPrimary}
                  type="button"
                  onClick={saveDemoCard}
                >
                  Cadastrar cartão fictício
                </button>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
