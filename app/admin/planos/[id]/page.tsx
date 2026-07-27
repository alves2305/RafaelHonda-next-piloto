"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleData = {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  ativo: boolean;
};

type DatabasePlanRow = {
  id: string;
  moto_id: string;
  parcelas: number;
  valor_parcela: number | string;
  destaque: boolean;
  ordem: number;
  ativo: boolean;
};

type EditablePlan = {
  id: string;
  parcelas: string;
  valorParcela: string;
  destaque: boolean;
  ativo: boolean;
  isNew: boolean;
};

function databaseValueToInput(value: number | string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "";
  }

  return numberValue.toFixed(2).replace(".", ",");
}

function parseBrazilianMoney(value: string) {
  const sanitized = value
    .replace(/\s/g, "")
    .replace(/R\$/gi, "");

  if (!sanitized) {
    return Number.NaN;
  }

  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;

  return Number(normalized);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toEditablePlan(plan: DatabasePlanRow): EditablePlan {
  return {
    id: plan.id,
    parcelas: String(plan.parcelas),
    valorParcela: databaseValueToInput(plan.valor_parcela),
    destaque: plan.destaque,
    ativo: plan.ativo,
    isNew: false,
  };
}

function createEmptyPlan(): EditablePlan {
  return {
    id: crypto.randomUUID(),
    parcelas: "",
    valorParcela: "",
    destaque: false,
    ativo: true,
    isNew: true,
  };
}

export default function EditMotorcyclePlansPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [motorcycle, setMotorcycle] = useState<MotorcycleData | null>(null);
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [initialPlans, setInitialPlans] = useState<EditablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: planData, error: planError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,nome,slug,categoria,ativo")
          .eq("id", params.id)
          .maybeSingle<MotorcycleData>(),
        supabase
          .from("planos_consorcio")
          .select(
            "id,moto_id,parcelas,valor_parcela,destaque,ordem,ativo",
          )
          .eq("moto_id", params.id)
          .order("ordem")
          .order("parcelas", { ascending: false }),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (!motorcycleData) {
        setError("Moto não encontrada.");
        return;
      }

      if (planError) {
        throw planError;
      }

      const editablePlans = ((planData ?? []) as DatabasePlanRow[]).map(
        toEditablePlan,
      );

      setMotorcycle(motorcycleData);
      setPlans(editablePlans);
      setInitialPlans(editablePlans);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar os planos desta moto. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const hasChanges = useMemo(
    () => JSON.stringify(plans) !== JSON.stringify(initialPlans),
    [plans, initialPlans],
  );

  const activePlansCount = plans.filter((plan) => plan.ativo).length;

  const lowestInstallment = useMemo(() => {
    const validValues = plans
      .filter((plan) => plan.ativo)
      .map((plan) => parseBrazilianMoney(plan.valorParcela))
      .filter((value) => Number.isFinite(value) && value > 0);

    return validValues.length > 0 ? Math.min(...validValues) : null;
  }, [plans]);

  function updatePlan(
    index: number,
    field: keyof EditablePlan,
    value: string | boolean,
  ) {
    setPlans((currentPlans) =>
      currentPlans.map((plan, planIndex) => {
        if (planIndex !== index) {
          return plan;
        }

        if (field === "ativo" && value === false) {
          return {
            ...plan,
            ativo: false,
            destaque: false,
          };
        }

        return {
          ...plan,
          [field]: value,
        };
      }),
    );

    setError("");
    setSuccess("");
  }

  function toggleHighlight(index: number) {
    setPlans((currentPlans) => {
      const targetPlan = currentPlans[index];

      if (!targetPlan || !targetPlan.ativo) {
        return currentPlans;
      }

      const nextValue = !targetPlan.destaque;

      return currentPlans.map((plan, planIndex) => ({
        ...plan,
        destaque: planIndex === index ? nextValue : false,
      }));
    });

    setError("");
    setSuccess("");
  }

  function addPlan() {
    setPlans((currentPlans) => [...currentPlans, createEmptyPlan()]);
    setError("");
    setSuccess("");
  }

  function removeNewPlan(index: number) {
    const plan = plans[index];

    if (!plan?.isNew) {
      return;
    }

    setPlans((currentPlans) =>
      currentPlans.filter((_, planIndex) => planIndex !== index),
    );

    setError("");
    setSuccess("");
  }

  function movePlan(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= plans.length) {
      return;
    }

    setPlans((currentPlans) => {
      const nextPlans = [...currentPlans];
      const [movedPlan] = nextPlans.splice(index, 1);
      nextPlans.splice(nextIndex, 0, movedPlan);
      return nextPlans;
    });

    setError("");
    setSuccess("");
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm("Descartar todas as alterações ainda não salvas?")
    ) {
      return;
    }

    setPlans(initialPlans);
    setError("");
    setSuccess("");
  }

  function validatePlans() {
    if (plans.length === 0) {
      return "Adicione pelo menos um plano.";
    }

    const installments = new Set<number>();

    for (const [index, plan] of plans.entries()) {
      const installmentCount = Number(plan.parcelas);
      const installmentValue = parseBrazilianMoney(plan.valorParcela);

      if (
        !Number.isInteger(installmentCount) ||
        installmentCount <= 0
      ) {
        return `Informe uma quantidade de parcelas válida na linha ${index + 1}.`;
      }

      if (!Number.isFinite(installmentValue) || installmentValue <= 0) {
        return `Informe um valor válido na linha ${index + 1}.`;
      }

      if (installments.has(installmentCount)) {
        return `Existem dois planos com ${installmentCount} parcelas.`;
      }

      installments.add(installmentCount);
    }

    return "";
  }

  async function savePlans() {
    if (!motorcycle || !hasChanges) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validatePlans();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const supabase = getAdminSupabaseClient();

      const payload = plans.map((plan, index) => ({
        id: plan.id,
        moto_id: motorcycle.id,
        parcelas: Number(plan.parcelas),
        valor_parcela: parseBrazilianMoney(plan.valorParcela),
        destaque: plan.ativo && plan.destaque,
        ordem: index + 1,
        ativo: plan.ativo,
      }));

      const { data, error: upsertError } = await supabase
        .from("planos_consorcio")
        .upsert(payload, {
          onConflict: "id",
        })
        .select(
          "id,moto_id,parcelas,valor_parcela,destaque,ordem,ativo",
        )
        .order("ordem");

      if (upsertError) {
        throw upsertError;
      }

      const savedPlans = ((data ?? []) as DatabasePlanRow[])
        .sort((a, b) => a.ordem - b.ordem)
        .map(toEditablePlan);

      setPlans(savedPlans);
      setInitialPlans(savedPlans);
      setSuccess(
        `Tabela da ${motorcycle.nome} atualizada. Todos os clientes já utilizam estes novos valores.`,
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar os planos. Verifique sua permissão administrativa e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (
      hasChanges &&
      !window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?")
    ) {
      return;
    }

    router.push("/admin/planos");
  }

  return (
    <AdminShell
      title="Editar planos"
      description="Atualize a tabela central de consórcio desta moto."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para planos
        </button>

        {motorcycle ? (
          <Link href={`/rafael/consorcio/${motorcycle.slug}`} target="_blank">
            Visualizar página pública ↗
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando tabela...</p>
        </div>
      ) : error === "Moto não encontrada." ? (
        <div className={styles.adminErrorBox}>
          <p>{error}</p>
          <Link href="/admin/planos">Voltar para planos</Link>
        </div>
      ) : motorcycle ? (
        <>
          <section className={styles.planEditorHero}>
            <div>
              <span className={styles.sectionEyebrow}>Tabela centralizada</span>
              <h2>{motorcycle.nome}</h2>
              <p>{motorcycle.categoria}</p>
            </div>

            <div className={styles.planEditorSummary}>
              <div>
                <span>Planos ativos</span>
                <strong>{activePlansCount}</strong>
              </div>

              <div>
                <span>Menor parcela</span>
                <strong>
                  {lowestInstallment !== null
                    ? formatCurrency(lowestInstallment)
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          <section className={styles.planEditorPanel}>
            <div className={styles.planEditorNotice}>
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Atualização compartilhada</strong>
                <p>
                  Salvar esta tabela atualiza automaticamente todos os clientes
                  que possuem a {motorcycle.nome}.
                </p>
              </div>
            </div>

            <div className={styles.planEditorHeading}>
              <div>
                <span className={styles.sectionEyebrow}>Parcelas disponíveis</span>
                <h3>Edite todos os valores antes de salvar</h3>
              </div>

              <button type="button" onClick={addPlan}>
                + Adicionar plano
              </button>
            </div>

            <div className={styles.planEditorTable}>
              <div className={styles.planEditorTableHeader} aria-hidden="true">
                <span>Ordem</span>
                <span>Parcelas</span>
                <span>Valor da parcela</span>
                <span>Destaque</span>
                <span>Ativo</span>
                <span>Ações</span>
              </div>

              {plans.map((plan, index) => (
                <article
                  className={`${styles.planEditorRow} ${
                    !plan.ativo ? styles.planEditorRowInactive : ""
                  }`}
                  key={plan.id}
                >
                  <div className={styles.planOrderActions}>
                    <span>{index + 1}</span>

                    <div>
                      <button
                        type="button"
                        onClick={() => movePlan(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover plano para cima"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => movePlan(index, 1)}
                        disabled={index === plans.length - 1}
                        aria-label="Mover plano para baixo"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <label>
                    <span>Parcelas</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={plan.parcelas}
                      onChange={(event) =>
                        updatePlan(index, "parcelas", event.target.value)
                      }
                      inputMode="numeric"
                    />
                  </label>

                  <label className={styles.planValueInput}>
                    <span>Valor</span>
                    <div>
                      <strong>R$</strong>
                      <input
                        type="text"
                        value={plan.valorParcela}
                        onChange={(event) =>
                          updatePlan(
                            index,
                            "valorParcela",
                            event.target.value,
                          )
                        }
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </div>
                  </label>

                  <button
                    type="button"
                    className={`${styles.planHighlightButton} ${
                      plan.destaque ? styles.planHighlightButtonActive : ""
                    }`}
                    onClick={() => toggleHighlight(index)}
                    disabled={!plan.ativo}
                  >
                    {plan.destaque ? "★ Destacado" : "☆ Destacar"}
                  </button>

                  <label className={styles.planActiveToggle}>
                    <input
                      type="checkbox"
                      checked={plan.ativo}
                      onChange={(event) =>
                        updatePlan(index, "ativo", event.target.checked)
                      }
                    />

                    <span />
                    <small>{plan.ativo ? "Ativo" : "Inativo"}</small>
                  </label>

                  <div className={styles.planRowActions}>
                    {plan.isNew ? (
                      <button
                        type="button"
                        onClick={() => removeNewPlan(index)}
                      >
                        Remover
                      </button>
                    ) : (
                      <span>Salvo</span>
                    )}
                  </div>
                </article>
              ))}

              {plans.length === 0 ? (
                <div className={styles.adminEmptyState}>
                  <strong>Nenhum plano cadastrado.</strong>
                  <p>Clique em Adicionar plano para começar.</p>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className={styles.editClientError} role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className={styles.editClientSuccess} role="status">
                {success}
              </p>
            ) : null}

            <div className={styles.planEditorFooter}>
              <div>
                <strong>
                  {hasChanges
                    ? "Existem alterações ainda não salvas."
                    : "A tabela está atualizada."}
                </strong>
                <span>
                  Planos inativos ficam guardados, mas não aparecem ao cliente.
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={!hasChanges || saving}
                >
                  Descartar
                </button>

                <button
                  className={styles.saveClientButton}
                  type="button"
                  onClick={() => void savePlans()}
                  disabled={!hasChanges || saving}
                >
                  {saving ? "Salvando..." : "Salvar tabela"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
