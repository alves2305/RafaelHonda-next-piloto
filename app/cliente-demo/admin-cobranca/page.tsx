"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_DEMO_BILLING,
  type DemoBillingData,
  type DemoBillingStatus,
  formatDemoCurrency,
  getDemoBillingStatusLabel,
  loadDemoBilling,
  saveDemoBilling,
} from "../billing-demo";

import styles from "../cliente-demo.module.css";

export default function ClientBillingAdminDemoPage() {
  const [billingData, setBillingData] =
    useState<DemoBillingData>(DEFAULT_DEMO_BILLING);
  const [selectedSlug, setSelectedSlug] = useState("gd");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBillingData(loadDemoBilling());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const selectedClient = billingData[selectedSlug] ?? billingData.gd;

  const clients = useMemo(
    () => Object.values(billingData),
    [billingData],
  );

  function updateSelectedClient(
    field:
      | "monthlyAmount"
      | "dueDay"
      | "graceDays"
      | "status"
      | "automaticBlock",
    value: number | boolean | DemoBillingStatus,
  ) {
    setBillingData((current) => ({
      ...current,
      [selectedSlug]: {
        ...current[selectedSlug],
        [field]: value,
      },
    }));
    setSaved(false);
  }

  function handleSave() {
    saveDemoBilling(billingData);
    setSaved(true);
  }

  function resetPrototype() {
    setBillingData(DEFAULT_DEMO_BILLING);
    saveDemoBilling(DEFAULT_DEMO_BILLING);
    setSaved(false);
  }

  return (
    <main className={styles.billingAdminPage}>
      <header className={styles.billingAdminTopbar}>
        <div>
          <span>Protótipo administrativo</span>
          <h1>Assinaturas e mensalidades</h1>
          <p>
            Defina um valor diferente, vencimento e tolerância para cada
            vendedor.
          </p>
        </div>

        <div className={styles.billingAdminTopbarActions}>
          <Link href="/admin/dashboard">Painel principal</Link>
          <Link href="/cliente-demo/assinatura">
            Ver painel do cliente ↗
          </Link>
        </div>
      </header>

      <div className={styles.billingAdminContent}>
        <section className={styles.billingAdminHero}>
          <div>
            <span>Cobrança individual</span>
            <h2>Você decide quanto cada cliente paga.</h2>
            <p>
              Os valores abaixo são apenas uma simulação. Altere a GD Honda,
              troque para outro vendedor e compare as mensalidades.
            </p>
          </div>

          <div>
            <strong>{clients.length}</strong>
            <span>clientes na demonstração</span>
          </div>
        </section>

        <section className={styles.billingClientsGrid}>
          {clients.map((client) => (
            <button
              type="button"
              key={client.slug}
              className={
                selectedSlug === client.slug
                  ? styles.billingClientCardActive
                  : ""
              }
              onClick={() => {
                setSelectedSlug(client.slug);
                setSaved(false);
              }}
            >
              <span>{client.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{client.name}</strong>
                <small>/{client.slug}</small>
              </div>
              <div>
                <strong>{formatDemoCurrency(client.monthlyAmount)}</strong>
                <small>todo dia {client.dueDay}</small>
              </div>
              <i
                className={`${styles.billingStatusBadge} ${
                  client.status === "paid"
                    ? styles.billingStatusPaid
                    : client.status === "overdue"
                      ? styles.billingStatusOverdue
                      : styles.billingStatusPending
                }`}
              >
                {getDemoBillingStatusLabel(client.status)}
              </i>
            </button>
          ))}
        </section>

        <div className={styles.billingAdminColumns}>
          <section className={styles.billingConfigurationPanel}>
            <div className={styles.billingPanelHeading}>
              <div>
                <span>Cliente selecionado</span>
                <h2>{selectedClient.name}</h2>
              </div>

              <strong>/{selectedClient.slug}</strong>
            </div>

            <div className={styles.billingConfigurationFields}>
              <label>
                Valor mensal
                <div className={styles.moneyInput}>
                  <span>R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedClient.monthlyAmount}
                    onChange={(event) =>
                      updateSelectedClient(
                        "monthlyAmount",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </label>

              <div className={styles.billingFieldColumns}>
                <label>
                  Dia do vencimento
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={selectedClient.dueDay}
                    onChange={(event) =>
                      updateSelectedClient(
                        "dueDay",
                        Math.min(
                          28,
                          Math.max(1, Number(event.target.value)),
                        ),
                      )
                    }
                  />
                </label>

                <label>
                  Dias de tolerância
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={selectedClient.graceDays}
                    onChange={(event) =>
                      updateSelectedClient(
                        "graceDays",
                        Math.min(
                          30,
                          Math.max(0, Number(event.target.value)),
                        ),
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Status atual
                <select
                  value={selectedClient.status}
                  onChange={(event) =>
                    updateSelectedClient(
                      "status",
                      event.target.value as DemoBillingStatus,
                    )
                  }
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="overdue">Atrasado</option>
                </select>
              </label>

              <label className={styles.billingSwitchField}>
                <div>
                  <strong>Bloqueio automático</strong>
                  <p>
                    No sistema real, o catálogo poderá ser bloqueado após o
                    prazo de tolerância.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedClient.automaticBlock}
                  className={
                    selectedClient.automaticBlock
                      ? styles.billingSwitchActive
                      : ""
                  }
                  onClick={() =>
                    updateSelectedClient(
                      "automaticBlock",
                      !selectedClient.automaticBlock,
                    )
                  }
                >
                  <span />
                </button>
              </label>
            </div>

            <div className={styles.billingAdminFooter}>
              <button type="button" onClick={resetPrototype}>
                Restaurar demonstração
              </button>

              <div>
                {saved ? <span>Configuração simulada salva.</span> : null}
                <button type="button" onClick={handleSave}>
                  Salvar mensalidade
                </button>
              </div>
            </div>
          </section>

          <aside className={styles.billingPreviewPanel}>
            <span>Prévia para o cliente</span>
            <small>Minha assinatura</small>
            <h2>{formatDemoCurrency(selectedClient.monthlyAmount)}</h2>
            <p>Vencimento todo dia {selectedClient.dueDay}</p>

            <div
              className={`${styles.billingPreviewStatus} ${
                selectedClient.status === "paid"
                  ? styles.billingStatusPaid
                  : selectedClient.status === "overdue"
                    ? styles.billingStatusOverdue
                    : styles.billingStatusPending
              }`}
            >
              {getDemoBillingStatusLabel(selectedClient.status)}
            </div>

            <dl>
              <div>
                <dt>Tolerância</dt>
                <dd>{selectedClient.graceDays} dias</dd>
              </div>
              <div>
                <dt>Bloqueio automático</dt>
                <dd>{selectedClient.automaticBlock ? "Ativo" : "Desativado"}</dd>
              </div>
              <div>
                <dt>Pagamento salvo</dt>
                <dd>{selectedClient.paymentMethod ?? "Nenhum"}</dd>
              </div>
            </dl>

            <Link href="/cliente-demo/assinatura">
              Abrir como GD Honda →
            </Link>
          </aside>
        </div>

        <div className={styles.prototypeWarning}>
          <strong>Esta tela não altera clientes reais.</strong>
          <p>
            As configurações ficam somente no navegador usando localStorage.
            Nenhum SQL, webhook ou pagamento verdadeiro é executado.
          </p>
        </div>
      </div>
    </main>
  );
}
