"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "./subscriptions.module.css";

type SubscriptionStatus = "pago" | "pendente" | "atrasado";

type AdminSubscription = {
  clientId: string;
  clientName: string;
  clientSlug: string;
  catalogActive: boolean;
  monthlyAmount: number;
  dueDay: number;
  graceDays: number;
  status: SubscriptionStatus;
  reference: string;
  paymentMethod: string;
  lastPaymentDate: string;
  note: string;
  updatedAt: string | null;
};

function currentMonthReference() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function normalizeRow(value: unknown): AdminSubscription {
  if (!value || typeof value !== "object") {
    throw new Error("Foi encontrada uma assinatura inválida.");
  }

  const row = value as Partial<AdminSubscription>;

  if (
    typeof row.clientId !== "string" ||
    typeof row.clientName !== "string" ||
    typeof row.clientSlug !== "string"
  ) {
    throw new Error("A assinatura não possui um cliente válido.");
  }

  return {
    clientId: row.clientId,
    clientName: row.clientName,
    clientSlug: row.clientSlug,
    catalogActive: row.catalogActive !== false,
    monthlyAmount: Number(row.monthlyAmount ?? 0),
    dueDay: Number(row.dueDay ?? 10),
    graceDays: Number(row.graceDays ?? 3),
    status:
      row.status === "pago" ||
      row.status === "atrasado" ||
      row.status === "pendente"
        ? row.status
        : "pendente",
    reference:
      typeof row.reference === "string"
        ? row.reference.slice(0, 10)
        : currentMonthReference(),
    paymentMethod:
      typeof row.paymentMethod === "string"
        ? row.paymentMethod
        : "",
    lastPaymentDate:
      typeof row.lastPaymentDate === "string"
        ? row.lastPaymentDate.slice(0, 10)
        : "",
    note:
      typeof row.note === "string"
        ? row.note
        : "",
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : null,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] =
    useState<AdminSubscription[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<AdminSubscription | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSubscriptions(preferredId?: string) {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data, error: loadError } = await supabase.rpc(
        "listar_assinaturas_admin",
      );

      if (loadError) {
        throw loadError;
      }

      if (!Array.isArray(data)) {
        throw new Error("A lista de assinaturas retornada é inválida.");
      }

      const nextRows = data.map(normalizeRow);
      const nextSelectedId =
        preferredId &&
        nextRows.some((item) => item.clientId === preferredId)
          ? preferredId
          : nextRows[0]?.clientId ?? "";

      setSubscriptions(nextRows);
      setSelectedId(nextSelectedId);
      setDraft(
        nextRows.find((item) => item.clientId === nextSelectedId) ?? null,
      );
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar as assinaturas. Confira o SQL da Entrega 19.8.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubscriptions();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    if (!term) {
      return subscriptions;
    }

    return subscriptions.filter(
      (item) =>
        item.clientName
          .toLocaleLowerCase("pt-BR")
          .includes(term) ||
        item.clientSlug
          .toLocaleLowerCase("pt-BR")
          .includes(term),
    );
  }, [subscriptions, search]);

  const totals = useMemo(
    () => ({
      clients: subscriptions.length,
      paid: subscriptions.filter((item) => item.status === "pago").length,
      overdue: subscriptions.filter((item) => item.status === "atrasado")
        .length,
      blocked: subscriptions.filter((item) => !item.catalogActive).length,
    }),
    [subscriptions],
  );

  function selectSubscription(item: AdminSubscription) {
    setSelectedId(item.clientId);
    setDraft({ ...item });
    setError("");
    setSuccess("");
  }

  function updateDraft<K extends keyof AdminSubscription>(
    field: K,
    value: AdminSubscription[K],
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
    setError("");
    setSuccess("");
  }

  function validateDraft() {
    if (!draft) {
      return "Selecione um cliente.";
    }

    if (
      !Number.isFinite(draft.monthlyAmount) ||
      draft.monthlyAmount < 0 ||
      draft.monthlyAmount > 99999.99
    ) {
      return "Informe um valor mensal válido.";
    }

    if (draft.dueDay < 1 || draft.dueDay > 28) {
      return "O vencimento precisa estar entre os dias 1 e 28.";
    }

    if (draft.graceDays < 0 || draft.graceDays > 30) {
      return "A tolerância precisa estar entre 0 e 30 dias.";
    }

    if (!draft.reference) {
      return "Informe o mês de referência.";
    }

    if (draft.paymentMethod.length > 80) {
      return "A forma de pagamento pode ter no máximo 80 caracteres.";
    }

    if (draft.note.length > 500) {
      return "A observação pode ter no máximo 500 caracteres.";
    }

    return "";
  }

  async function saveSubscription() {
    const validationError = validateDraft();

    if (validationError || !draft) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data, error: saveError } = await supabase.rpc(
        "salvar_assinatura_cliente",
        {
          p_cliente_id: draft.clientId,
          p_valor_mensal: Number(draft.monthlyAmount.toFixed(2)),
          p_dia_vencimento: draft.dueDay,
          p_dias_tolerancia: draft.graceDays,
          p_status: draft.status,
          p_referencia: draft.reference,
          p_forma_pagamento: draft.paymentMethod.trim() || null,
          p_ultimo_pagamento_em: draft.lastPaymentDate || null,
          p_observacao: draft.note.trim() || null,
          p_catalogo_ativo: draft.catalogActive,
        },
      );

      if (saveError) {
        throw saveError;
      }

      const savedRow = normalizeRow(data);

      setSubscriptions((current) =>
        current.map((item) =>
          item.clientId === savedRow.clientId ? savedRow : item,
        ),
      );
      setDraft(savedRow);
      setSuccess(
        `Assinatura de ${savedRow.clientName} atualizada com sucesso.`,
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar a assinatura. Confirme sua sessão administrativa.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Assinaturas"
      description="Gerencie mensalidades e bloqueios manuais dos catálogos."
    >
      <div className={styles.page}>
        <section className={styles.summaryGrid}>
          <article>
            <span>Clientes</span>
            <strong>{totals.clients}</strong>
            <p>assinaturas cadastradas</p>
          </article>
          <article>
            <span>Pagas</span>
            <strong>{totals.paid}</strong>
            <p>marcadas como em dia</p>
          </article>
          <article>
            <span>Atrasadas</span>
            <strong>{totals.overdue}</strong>
            <p>aguardando regularização</p>
          </article>
          <article>
            <span>Bloqueadas</span>
            <strong>{totals.blocked}</strong>
            <p>catálogos suspensos manualmente</p>
          </article>
        </section>

        <section className={styles.notice}>
          <span>!</span>
          <div>
            <strong>Sem cobrança automática</strong>
            <p>
              Esta etapa registra somente valor, status e informações não
              sensíveis. O bloqueio é manual e nenhum dado de cartão é salvo.
            </p>
          </div>
        </section>

        {loading ? (
          <section className={styles.loading}>
            <span />
            <p>Carregando assinaturas...</p>
          </section>
        ) : null}

        {!loading && error && subscriptions.length === 0 ? (
          <section className={styles.loading}>
            <strong>Não foi possível carregar</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void loadSubscriptions()}>
              Tentar novamente
            </button>
          </section>
        ) : null}

        {!loading && subscriptions.length > 0 ? (
          <div className={styles.layout}>
            <aside className={styles.clientsPanel}>
              <div className={styles.panelHeading}>
                <div>
                  <span>Clientes</span>
                  <h2>Selecione uma assinatura</h2>
                </div>
              </div>

              <label className={styles.search}>
                <span>⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar cliente ou endereço"
                />
              </label>

              <div className={styles.clientList}>
                {filteredSubscriptions.map((item) => (
                  <button
                    type="button"
                    className={
                      selectedId === item.clientId
                        ? styles.clientActive
                        : ""
                    }
                    onClick={() => selectSubscription(item)}
                    key={item.clientId}
                  >
                    <span>
                      {item.clientName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>{item.clientName}</strong>
                      <small>/{item.clientSlug}</small>
                    </div>

                    <div>
                      <strong>{formatCurrency(item.monthlyAmount)}</strong>
                      <small>{getStatusLabel(item.status)}</small>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {draft ? (
              <section className={styles.editor}>
                <div className={styles.editorHeading}>
                  <div>
                    <span>Cliente selecionado</span>
                    <h2>{draft.clientName}</h2>
                    <p>/{draft.clientSlug}</p>
                  </div>

                  <span
                    className={
                      draft.catalogActive
                        ? styles.catalogActive
                        : styles.catalogBlocked
                    }
                  >
                    {draft.catalogActive
                      ? "Catálogo ativo"
                      : "Catálogo bloqueado"}
                  </span>
                </div>

                <div className={styles.fields}>
                  <label>
                    Valor mensal
                    <div className={styles.moneyInput}>
                      <span>R$</span>
                      <input
                        type="number"
                        min={0}
                        max={99999.99}
                        step={0.01}
                        value={draft.monthlyAmount}
                        onChange={(event) =>
                          updateDraft(
                            "monthlyAmount",
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  </label>

                  <div className={styles.twoColumns}>
                    <label>
                      Dia do vencimento
                      <input
                        type="number"
                        min={1}
                        max={28}
                        value={draft.dueDay}
                        onChange={(event) =>
                          updateDraft(
                            "dueDay",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>

                    <label>
                      Dias de tolerância
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={draft.graceDays}
                        onChange={(event) =>
                          updateDraft(
                            "graceDays",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.twoColumns}>
                    <label>
                      Status atual
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(
                            "status",
                            event.target.value as SubscriptionStatus,
                          )
                        }
                      >
                        <option value="pago">Pago</option>
                        <option value="pendente">Pendente</option>
                        <option value="atrasado">Atrasado</option>
                      </select>
                    </label>

                    <label>
                      Mês de referência
                      <input
                        type="month"
                        value={draft.reference.slice(0, 7)}
                        onChange={(event) =>
                          updateDraft(
                            "reference",
                            `${event.target.value}-01`,
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.twoColumns}>
                    <label>
                      Forma registrada
                      <input
                        value={draft.paymentMethod}
                        onChange={(event) =>
                          updateDraft(
                            "paymentMethod",
                            event.target.value,
                          )
                        }
                        maxLength={80}
                        placeholder="Ex.: Pix ou Cartão final 1234"
                      />
                    </label>

                    <label>
                      Último pagamento
                      <input
                        type="date"
                        value={draft.lastPaymentDate}
                        onChange={(event) =>
                          updateDraft(
                            "lastPaymentDate",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Observação para o vendedor
                    <textarea
                      value={draft.note}
                      onChange={(event) =>
                        updateDraft("note", event.target.value)
                      }
                      maxLength={500}
                      rows={4}
                      placeholder="Mensagem opcional exibida na assinatura."
                    />
                    <small>{draft.note.length}/500 caracteres</small>
                  </label>
                </div>

                <div className={styles.blockControl}>
                  <div>
                    <strong>Catálogo público e painel do vendedor</strong>
                    <p>
                      O bloqueio é manual. Ao desativar, o catálogo e o acesso
                      do vendedor ficam suspensos até nova liberação.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.catalogActive}
                    className={
                      draft.catalogActive ? styles.switchActive : ""
                    }
                    onClick={() =>
                      updateDraft(
                        "catalogActive",
                        !draft.catalogActive,
                      )
                    }
                  >
                    <span />
                    {draft.catalogActive ? "Ativo" : "Bloqueado"}
                  </button>
                </div>

                {error ? (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p className={styles.success} role="status">
                    {success}
                  </p>
                ) : null}

                <div className={styles.footer}>
                  <button
                    type="button"
                    onClick={() => {
                      const original = subscriptions.find(
                        (item) => item.clientId === draft.clientId,
                      );

                      if (original) {
                        setDraft({ ...original });
                        setError("");
                        setSuccess("");
                      }
                    }}
                    disabled={saving}
                  >
                    Descartar alterações
                  </button>

                  <button
                    className={styles.save}
                    type="button"
                    onClick={() => void saveSubscription()}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar assinatura"}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
