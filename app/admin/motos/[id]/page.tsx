"use client";

/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MotorcyclePublicPreviewLink } from "@/components/admin/MotorcyclePublicPreviewLink";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleIcon =
  | "economia"
  | "praticidade"
  | "conforto"
  | "desempenho";

type MotorcycleDetail = {
  rotulo: string;
  valor: string;
};

type MotorcycleBenefit = {
  titulo: string;
  descricao: string;
  icone: MotorcycleIcon;
};

type MotorcycleRow = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  selo: string | null;
  titulo_descricao: string;
  descricao: string;
  detalhes: MotorcycleDetail[];
  beneficios: MotorcycleBenefit[];
  titulo_consorcio: string;
  ativo: boolean;
  ordem: number;
};

type MotorcycleForm = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  selo: string;
  titulo_descricao: string;
  descricao: string;
  detalhes: MotorcycleDetail[];
  beneficios: MotorcycleBenefit[];
  titulo_consorcio: string;
  ativo: boolean;
  ordem: number;
};

const ICON_OPTIONS: Array<{
  value: MotorcycleIcon;
  label: string;
}> = [
  { value: "economia", label: "Economia" },
  { value: "praticidade", label: "Praticidade" },
  { value: "conforto", label: "Conforto" },
  { value: "desempenho", label: "Desempenho" },
];

const EMPTY_FORM: MotorcycleForm = {
  id: "",
  slug: "",
  nome: "",
  categoria: "",
  imagem_url: "",
  selo: "",
  titulo_descricao: "",
  descricao: "",
  detalhes: [],
  beneficios: [],
  titulo_consorcio: "Planos sem emplacamento",
  ativo: true,
  ordem: 0,
};

function normalizeDetails(value: unknown): MotorcycleDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const detail =
      typeof item === "object" && item !== null
        ? (item as Partial<MotorcycleDetail>)
        : {};

    return {
      rotulo: typeof detail.rotulo === "string" ? detail.rotulo : "",
      valor: typeof detail.valor === "string" ? detail.valor : "",
    };
  });
}

function normalizeBenefits(value: unknown): MotorcycleBenefit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const benefit =
      typeof item === "object" && item !== null
        ? (item as Partial<MotorcycleBenefit>)
        : {};

    const validIcon = ICON_OPTIONS.some(
      (option) => option.value === benefit.icone,
    )
      ? (benefit.icone as MotorcycleIcon)
      : "desempenho";

    return {
      titulo: typeof benefit.titulo === "string" ? benefit.titulo : "",
      descricao:
        typeof benefit.descricao === "string" ? benefit.descricao : "",
      icone: validIcon,
    };
  });
}

function toForm(row: MotorcycleRow): MotorcycleForm {
  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    categoria: row.categoria,
    imagem_url: row.imagem_url,
    selo: row.selo ?? "",
    titulo_descricao: row.titulo_descricao,
    descricao: row.descricao,
    detalhes: normalizeDetails(row.detalhes),
    beneficios: normalizeBenefits(row.beneficios),
    titulo_consorcio: row.titulo_consorcio,
    ativo: row.ativo,
    ordem: row.ordem,
  };
}

export default function EditMotorcyclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<MotorcycleForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<MotorcycleForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMotorcycle = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data, error: loadError } = await supabase
        .from("motos")
        .select(
          "id,slug,nome,categoria,imagem_url,selo,titulo_descricao,descricao,detalhes,beneficios,titulo_consorcio,ativo,ordem",
        )
        .eq("id", params.id)
        .maybeSingle<MotorcycleRow>();

      if (loadError) {
        throw loadError;
      }

      if (!data) {
        setError("Moto não encontrada.");
        return;
      }

      const nextForm = toForm(data);
      setForm(nextForm);
      setInitialForm(nextForm);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar a moto. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadMotorcycle();
  }, [loadMotorcycle]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  function updateField<K extends keyof MotorcycleForm>(
    field: K,
    value: MotorcycleForm[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function updateDetail(
    index: number,
    field: keyof MotorcycleDetail,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      detalhes: currentForm.detalhes.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
      ),
    }));

    setError("");
    setSuccess("");
  }

  function addDetail() {
    setForm((currentForm) => ({
      ...currentForm,
      detalhes: [...currentForm.detalhes, { rotulo: "", valor: "" }],
    }));

    setError("");
    setSuccess("");
  }

  function removeDetail(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      detalhes: currentForm.detalhes.filter(
        (_, detailIndex) => detailIndex !== index,
      ),
    }));

    setError("");
    setSuccess("");
  }

  function moveDetail(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= form.detalhes.length) {
      return;
    }

    setForm((currentForm) => {
      const nextDetails = [...currentForm.detalhes];
      const [movedDetail] = nextDetails.splice(index, 1);
      nextDetails.splice(nextIndex, 0, movedDetail);

      return {
        ...currentForm,
        detalhes: nextDetails,
      };
    });

    setError("");
    setSuccess("");
  }

  function updateBenefit<K extends keyof MotorcycleBenefit>(
    index: number,
    field: K,
    value: MotorcycleBenefit[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      beneficios: currentForm.beneficios.map((benefit, benefitIndex) =>
        benefitIndex === index
          ? { ...benefit, [field]: value }
          : benefit,
      ),
    }));

    setError("");
    setSuccess("");
  }

  function addBenefit() {
    setForm((currentForm) => ({
      ...currentForm,
      beneficios: [
        ...currentForm.beneficios,
        {
          titulo: "",
          descricao: "",
          icone: "desempenho",
        },
      ],
    }));

    setError("");
    setSuccess("");
  }

  function removeBenefit(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      beneficios: currentForm.beneficios.filter(
        (_, benefitIndex) => benefitIndex !== index,
      ),
    }));

    setError("");
    setSuccess("");
  }

  function moveBenefit(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= form.beneficios.length) {
      return;
    }

    setForm((currentForm) => {
      const nextBenefits = [...currentForm.beneficios];
      const [movedBenefit] = nextBenefits.splice(index, 1);
      nextBenefits.splice(nextIndex, 0, movedBenefit);

      return {
        ...currentForm,
        beneficios: nextBenefits,
      };
    });

    setError("");
    setSuccess("");
  }

  function validateForm() {
    if (!form.nome.trim()) {
      return "Informe o nome da moto.";
    }

    if (!form.categoria.trim()) {
      return "Informe a categoria da moto.";
    }

    if (!form.imagem_url.trim()) {
      return "Informe a URL da imagem.";
    }

    if (!form.titulo_descricao.trim()) {
      return "Informe o título da descrição.";
    }

    if (!form.descricao.trim()) {
      return "Informe a descrição da moto.";
    }

    if (!form.titulo_consorcio.trim()) {
      return "Informe o título da tabela de consórcio.";
    }

    for (const [index, detail] of form.detalhes.entries()) {
      if (!detail.rotulo.trim() || !detail.valor.trim()) {
        return `Preencha o rótulo e o valor do detalhe ${index + 1}.`;
      }
    }

    for (const [index, benefit] of form.beneficios.entries()) {
      if (!benefit.titulo.trim() || !benefit.descricao.trim()) {
        return `Preencha o título e a descrição do benefício ${index + 1}.`;
      }
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      initialForm.ativo &&
      !form.ativo &&
      !window.confirm(
        `Desativar a ${form.nome}? Ela deixará de aparecer em todos os catálogos.`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const supabase = getAdminSupabaseClient();

      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        imagem_url: form.imagem_url.trim(),
        selo: form.selo.trim() || null,
        titulo_descricao: form.titulo_descricao.trim(),
        descricao: form.descricao.trim(),
        detalhes: form.detalhes.map((detail) => ({
          rotulo: detail.rotulo.trim(),
          valor: detail.valor.trim(),
        })),
        beneficios: form.beneficios.map((benefit) => ({
          titulo: benefit.titulo.trim(),
          descricao: benefit.descricao.trim(),
          icone: benefit.icone,
        })),
        titulo_consorcio: form.titulo_consorcio.trim(),
        ativo: form.ativo,
      };

      const { data, error: updateError } = await supabase
        .from("motos")
        .update(payload)
        .eq("id", form.id)
        .select(
          "id,slug,nome,categoria,imagem_url,selo,titulo_descricao,descricao,detalhes,beneficios,titulo_consorcio,ativo,ordem",
        )
        .single<MotorcycleRow>();

      if (updateError) {
        throw updateError;
      }

      const nextForm = toForm(data);
      setForm(nextForm);
      setInitialForm(nextForm);
      setSuccess(
        "Moto atualizada. Todos os clientes vinculados já utilizam estas informações.",
      );
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível salvar a moto. Confirme sua permissão administrativa e tente novamente.",
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

    router.push("/admin/motos");
  }

  return (
    <AdminShell
      title="Editar moto"
      description="Atualize as informações centrais do modelo."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para motos
        </button>

        {form.id ? (
          <div className={styles.editClientTopbarActions}>
            <Link href={`/admin/motos/${form.id}/configuracao`}>
              Configuração
            </Link>

            <Link href={`/admin/motos/${form.id}/clientes`}>
              Vendedores
            </Link>

            {form.id && form.slug ? (
              <MotorcyclePublicPreviewLink
                motorcycleId={form.id}
                motorcycleSlug={form.slug}
                mode="moto"
                children="Página pública ↗"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando moto...</p>
        </div>
      ) : error === "Moto não encontrada." ? (
        <div className={styles.adminErrorBox}>
          <p>{error}</p>
          <Link href="/admin/motos">Voltar para motos</Link>
        </div>
      ) : (
        <form className={styles.motorcycleEditLayout} onSubmit={handleSubmit}>
          <section className={styles.motorcycleEditPanel}>
            <div className={styles.editClientSectionHeading}>
              <span className={styles.sectionEyebrow}>Informações principais</span>
              <h2>Dados do modelo</h2>
              <p>
                O endereço da moto permanece protegido para evitar páginas
                quebradas.
              </p>
            </div>

            <div className={styles.editClientFields}>
              <label>
                Nome da moto
                <input
                  value={form.nome}
                  onChange={(event) =>
                    updateField("nome", event.target.value)
                  }
                  placeholder="Ex.: POP 110i ES"
                />
              </label>

              <label>
                Endereço da moto
                <div className={styles.lockedInput}>
                  <span>/</span>
                  <input value={form.slug} disabled />
                  <small>Protegido</small>
                </div>
              </label>

              <label>
                Categoria
                <input
                  value={form.categoria}
                  onChange={(event) =>
                    updateField("categoria", event.target.value)
                  }
                  placeholder="Econômica • Urbana • Honda"
                />
              </label>

              <label>
                Selo
                <input
                  value={form.selo}
                  onChange={(event) =>
                    updateField("selo", event.target.value)
                  }
                  placeholder="NOVA LINHA 2027"
                />
              </label>

              <div className={styles.fullField}>
                <ImageUploadField
                  label="Imagem principal da moto"
                  value={form.imagem_url}
                  onChange={(value) =>
                    updateField("imagem_url", value)
                  }
                  folder={`motos/${form.id || form.slug}/principal`}
                  placeholder="/assets/motos/modelo.svg"
                  help="Prefira uma imagem recortada, com fundo transparente ou branco."
                  previewFit="contain"
                  required
                />
              </div>

              <label className={styles.fullField}>
                Título da descrição
                <input
                  value={form.titulo_descricao}
                  onChange={(event) =>
                    updateField("titulo_descricao", event.target.value)
                  }
                  placeholder="A moto perfeita para o dia a dia"
                />
              </label>

              <label className={styles.fullField}>
                Descrição
                <textarea
                  value={form.descricao}
                  onChange={(event) =>
                    updateField("descricao", event.target.value)
                  }
                  rows={6}
                  placeholder="Descrição completa do modelo"
                />
              </label>

              <label className={styles.fullField}>
                Título da tabela de consórcio
                <input
                  value={form.titulo_consorcio}
                  onChange={(event) =>
                    updateField("titulo_consorcio", event.target.value)
                  }
                  placeholder="Planos sem emplacamento"
                />
              </label>

              <label className={styles.clientActiveField}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    updateField("ativo", event.target.checked)
                  }
                />

                <span>
                  <strong>Modelo ativo no catálogo central</strong>
                  <small>
                    Ao desativar, a moto deixa de aparecer para todos os
                    vendedores.
                  </small>
                </span>
              </label>
            </div>

            <div className={styles.editClientDivider} />

            <div className={styles.motorcycleDynamicHeading}>
              <div className={styles.editClientSectionHeading}>
                <span className={styles.sectionEyebrow}>Ficha técnica</span>
                <h2>Detalhes da moto</h2>
              </div>

              <button type="button" onClick={addDetail}>
                + Adicionar detalhe
              </button>
            </div>

            <div className={styles.motorcycleDynamicList}>
              {form.detalhes.map((detail, index) => (
                <article className={styles.motorcycleDynamicRow} key={index}>
                  <div className={styles.motorcycleDynamicOrder}>
                    <span>{index + 1}</span>

                    <div>
                      <button
                        type="button"
                        onClick={() => moveDetail(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover detalhe para cima"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveDetail(index, 1)}
                        disabled={index === form.detalhes.length - 1}
                        aria-label="Mover detalhe para baixo"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <label>
                    Rótulo
                    <input
                      value={detail.rotulo}
                      onChange={(event) =>
                        updateDetail(index, "rotulo", event.target.value)
                      }
                      placeholder="Motor"
                    />
                  </label>

                  <label>
                    Valor
                    <input
                      value={detail.valor}
                      onChange={(event) =>
                        updateDetail(index, "valor", event.target.value)
                      }
                      placeholder="109,5 cc"
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.removeDynamicButton}
                    onClick={() => removeDetail(index)}
                  >
                    Remover
                  </button>
                </article>
              ))}

              {form.detalhes.length === 0 ? (
                <div className={styles.adminEmptyState}>
                  <strong>Nenhum detalhe cadastrado.</strong>
                  <p>Clique em Adicionar detalhe para criar a ficha técnica.</p>
                </div>
              ) : null}
            </div>

            <div className={styles.editClientDivider} />

            <div className={styles.motorcycleDynamicHeading}>
              <div className={styles.editClientSectionHeading}>
                <span className={styles.sectionEyebrow}>Destaques</span>
                <h2>Benefícios da moto</h2>
              </div>

              <button type="button" onClick={addBenefit}>
                + Adicionar benefício
              </button>
            </div>

            <div className={styles.motorcycleBenefitEditor}>
              {form.beneficios.map((benefit, index) => (
                <article className={styles.motorcycleBenefitRow} key={index}>
                  <div className={styles.motorcycleDynamicOrder}>
                    <span>{index + 1}</span>

                    <div>
                      <button
                        type="button"
                        onClick={() => moveBenefit(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover benefício para cima"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveBenefit(index, 1)}
                        disabled={index === form.beneficios.length - 1}
                        aria-label="Mover benefício para baixo"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <label>
                    Ícone
                    <select
                      value={benefit.icone}
                      onChange={(event) =>
                        updateBenefit(
                          index,
                          "icone",
                          event.target.value as MotorcycleIcon,
                        )
                      }
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Título
                    <input
                      value={benefit.titulo}
                      onChange={(event) =>
                        updateBenefit(index, "titulo", event.target.value)
                      }
                      placeholder="Super econômica"
                    />
                  </label>

                  <label className={styles.motorcycleBenefitDescription}>
                    Descrição
                    <input
                      value={benefit.descricao}
                      onChange={(event) =>
                        updateBenefit(index, "descricao", event.target.value)
                      }
                      placeholder="Consumo ideal para o dia a dia."
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.removeDynamicButton}
                    onClick={() => removeBenefit(index)}
                  >
                    Remover
                  </button>
                </article>
              ))}

              {form.beneficios.length === 0 ? (
                <div className={styles.adminEmptyState}>
                  <strong>Nenhum benefício cadastrado.</strong>
                  <p>Clique em Adicionar benefício para começar.</p>
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
                {saving ? "Salvando..." : "Salvar moto"}
              </button>
            </div>
          </section>

          <aside className={styles.motorcyclePreviewPanel}>
            <div className={styles.previewSticky}>
              <div className={styles.editClientSectionHeading}>
                <span className={styles.sectionEyebrow}>Pré-visualização</span>
                <h2>Resumo do modelo</h2>
              </div>

              <article className={styles.motorcycleAdminPreview}>
                <div className={styles.motorcycleAdminPreviewImage}>
                  {form.imagem_url ? (
                    <img src={form.imagem_url} alt={form.nome || "Moto"} />
                  ) : (
                    <span>Sem imagem</span>
                  )}

                  {form.selo ? <small>{form.selo}</small> : null}
                </div>

                <div className={styles.motorcycleAdminPreviewContent}>
                  <span>{form.categoria || "Categoria da moto"}</span>
                  <h3>{form.nome || "Nome da moto"}</h3>
                  <h4>
                    {form.titulo_descricao || "Título da descrição"}
                  </h4>
                  <p>{form.descricao || "Descrição da moto"}</p>

                  <div className={styles.motorcyclePreviewDetails}>
                    {form.detalhes.slice(0, 4).map((detail, index) => (
                      <div key={`${detail.rotulo}-${index}`}>
                        <span>{detail.rotulo || "Detalhe"}</span>
                        <strong>{detail.valor || "Valor"}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <div className={styles.previewInfoBox}>
                <strong>Atualização central</strong>
                <p>
                  Ao salvar, todos os clientes vinculados a esta moto passam a
                  utilizar os novos textos e informações.
                </p>
              </div>
            </div>
          </aside>
        </form>
      )}
    </AdminShell>
  );
}
