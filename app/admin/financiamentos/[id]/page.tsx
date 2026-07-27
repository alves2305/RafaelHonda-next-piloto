"use client";

/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { MotorcyclePublicPreviewLink } from "@/components/admin/MotorcyclePublicPreviewLink";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleData = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  ativo: boolean;
};

type FinancingData = {
  id: string;
  moto_id: string;
  titulo: string;
  descricao: string;
  observacao: string;
  ativo: boolean;
};

type FinancingForm = {
  titulo: string;
  descricao: string;
  observacao: string;
  ativo: boolean;
};

const DEFAULT_FORM: FinancingForm = {
  titulo: "Solicite sua simulação",
  descricao:
    "Preencha seus dados abaixo para receber uma simulação personalizada de financiamento.",
  observacao:
    "A aprovação está sujeita à análise de crédito da instituição financeira.",
  ativo: true,
};

function toForm(financing: FinancingData | null): FinancingForm {
  if (!financing) {
    return DEFAULT_FORM;
  }

  return {
    titulo: financing.titulo,
    descricao: financing.descricao,
    observacao: financing.observacao,
    ativo: financing.ativo,
  };
}

export default function EditFinancingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [motorcycle, setMotorcycle] = useState<MotorcycleData | null>(null);
  const [financingId, setFinancingId] = useState<string | null>(null);
  const [form, setForm] = useState<FinancingForm>(DEFAULT_FORM);
  const [initialForm, setInitialForm] =
    useState<FinancingForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFinancing = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: financingData, error: financingError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,slug,nome,categoria,imagem_url,ativo")
          .eq("id", params.id)
          .maybeSingle<MotorcycleData>(),
        supabase
          .from("informacoes_financiamento")
          .select("id,moto_id,titulo,descricao,observacao,ativo")
          .eq("moto_id", params.id)
          .maybeSingle<FinancingData>(),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (!motorcycleData) {
        setError("Moto não encontrada.");
        return;
      }

      if (financingError) {
        throw financingError;
      }

      const nextForm = toForm(financingData ?? null);

      setMotorcycle(motorcycleData);
      setFinancingId(financingData?.id ?? null);
      setForm(nextForm);
      setInitialForm(nextForm);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar o financiamento. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFinancing();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFinancing]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  function updateField<K extends keyof FinancingForm>(
    field: K,
    value: FinancingForm[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function validateForm() {
    if (!form.titulo.trim()) {
      return "Informe o título da simulação.";
    }

    if (!form.descricao.trim()) {
      return "Informe a descrição da simulação.";
    }

    if (!form.observacao.trim()) {
      return "Informe a observação sobre análise de crédito.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!motorcycle) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      initialForm.ativo &&
      !form.ativo &&
      !window.confirm(
        `Desativar o financiamento da ${motorcycle.nome}? O botão e a página de simulação deixarão de aparecer para todos os vendedores.`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const supabase = getAdminSupabaseClient();

      const payload = {
        moto_id: motorcycle.id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        observacao: form.observacao.trim(),
        ativo: form.ativo,
      };

      const { data, error: upsertError } = await supabase
        .from("informacoes_financiamento")
        .upsert(payload, {
          onConflict: "moto_id",
        })
        .select("id,moto_id,titulo,descricao,observacao,ativo")
        .single<FinancingData>();

      if (upsertError) {
        throw upsertError;
      }

      const nextForm = toForm(data);
      setFinancingId(data.id);
      setForm(nextForm);
      setInitialForm(nextForm);
      setSuccess(
        data.ativo
          ? "Financiamento atualizado e disponível para os vendedores habilitados."
          : "Financiamento salvo como inativo e removido do catálogo público.",
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar o financiamento. Confirme sua permissão administrativa.",
      );
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm("Descartar todas as alterações ainda não salvas?")
    ) {
      return;
    }

    setForm(initialForm);
    setError("");
    setSuccess("");
  }

  function goBack() {
    if (
      hasChanges &&
      !window.confirm("Existem alterações não salvas. Deseja sair mesmo assim?")
    ) {
      return;
    }

    router.push("/admin/financiamentos");
  }

  return (
    <AdminShell
      title="Editar financiamento"
      description="Atualize as informações centrais da simulação."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para financiamentos
        </button>

        {motorcycle && form.ativo && financingId ? (
          <MotorcyclePublicPreviewLink
            motorcycleId={motorcycle.id}
            motorcycleSlug={motorcycle.slug}
            mode="financiamento"
          />
        ) : null}
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando financiamento...</p>
        </div>
      ) : error === "Moto não encontrada." ? (
        <div className={styles.adminErrorBox}>
          <p>{error}</p>
          <Link href="/admin/financiamentos">
            Voltar para financiamentos
          </Link>
        </div>
      ) : motorcycle ? (
        <form
          className={styles.financingEditLayout}
          onSubmit={handleSubmit}
        >
          <section className={styles.financingEditPanel}>
            <div className={styles.editClientSectionHeading}>
              <span className={styles.sectionEyebrow}>
                Informação centralizada
              </span>
              <h2>{motorcycle.nome}</h2>
              <p>
                Este conteúdo será usado pelos vendedores que possuem a moto e
                estão habilitados para vender financiamento.
              </p>
            </div>

            <div className={styles.financingEditFields}>
              <label>
                Título da simulação
                <input
                  value={form.titulo}
                  onChange={(event) =>
                    updateField("titulo", event.target.value)
                  }
                  placeholder="Solicite sua simulação"
                />
              </label>

              <label>
                Descrição
                <textarea
                  value={form.descricao}
                  onChange={(event) =>
                    updateField("descricao", event.target.value)
                  }
                  rows={5}
                  placeholder="Explique como o cliente receberá a simulação."
                />
              </label>

              <label>
                Observação
                <textarea
                  value={form.observacao}
                  onChange={(event) =>
                    updateField("observacao", event.target.value)
                  }
                  rows={4}
                  placeholder="Informe as condições da análise de crédito."
                />
              </label>

              <label className={styles.financingActiveField}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    updateField("ativo", event.target.checked)
                  }
                />

                <span>
                  <strong>Financiamento ativo para esta moto</strong>
                  <small>
                    Quando inativo, o botão e a página de simulação são
                    removidos de todos os catálogos.
                  </small>
                </span>
              </label>
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

            <div className={styles.editClientActions}>
              <button
                type="button"
                onClick={discardChanges}
                disabled={!hasChanges || saving}
              >
                Descartar alterações
              </button>

              <button
                className={styles.saveClientButton}
                type="submit"
                disabled={!hasChanges || saving}
              >
                {saving ? "Salvando..." : "Salvar financiamento"}
              </button>
            </div>
          </section>

          <aside className={styles.financingPreviewPanel}>
            <div className={styles.previewSticky}>
              <div className={styles.editClientSectionHeading}>
                <span className={styles.sectionEyebrow}>Pré-visualização</span>
                <h2>Página de simulação</h2>
              </div>

              <article className={styles.financingAdminPreview}>
                <div className={styles.financingAdminPreviewImage}>
                  <img
                    src={motorcycle.imagem_url}
                    alt={motorcycle.nome}
                  />
                </div>

                <div className={styles.financingAdminPreviewContent}>
                  <span>Financiamento Honda</span>
                  <h3>{motorcycle.nome}</h3>
                  <h4>{form.titulo || "Título da simulação"}</h4>
                  <p>{form.descricao || "Descrição da simulação"}</p>

                  <div>
                    <strong>Solicitar simulação</strong>
                    <small>
                      {form.ativo
                        ? "Disponível no catálogo"
                        : "Página atualmente inativa"}
                    </small>
                  </div>
                </div>
              </article>

              <div className={styles.previewInfoBox}>
                <strong>Observação exibida ao cliente</strong>
                <p>
                  {form.observacao ||
                    "A observação sobre análise de crédito aparecerá aqui."}
                </p>
              </div>
            </div>
          </aside>
        </form>
      ) : null}
    </AdminShell>
  );
}
