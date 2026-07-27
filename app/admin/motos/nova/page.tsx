"use client";

/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
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

type NewMotorcycleForm = {
  nome: string;
  slug: string;
  categoria: string;
  imagem_url: string;
  selo: string;
  titulo_descricao: string;
  descricao: string;
  detalhes: MotorcycleDetail[];
  beneficios: MotorcycleBenefit[];
  titulo_consorcio: string;
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

const INITIAL_FORM: NewMotorcycleForm = {
  nome: "",
  slug: "",
  categoria: "",
  imagem_url: "",
  selo: "",
  titulo_descricao: "",
  descricao: "",
  detalhes: [
    { rotulo: "Motor", valor: "" },
    { rotulo: "Partida", valor: "" },
    { rotulo: "Combustível", valor: "" },
    { rotulo: "Consumo", valor: "" },
  ],
  beneficios: [
    {
      titulo: "",
      descricao: "",
      icone: "economia",
    },
    {
      titulo: "",
      descricao: "",
      icone: "praticidade",
    },
    {
      titulo: "",
      descricao: "",
      icone: "conforto",
    },
  ],
  titulo_consorcio: "Planos sem emplacamento",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isValidSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function getInsertErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return "Já existe uma moto utilizando este endereço.";
  }

  return "Não foi possível cadastrar a moto. Confira os dados e tente novamente.";
}

export default function NewMotorcyclePage() {
  const router = useRouter();

  const [form, setForm] = useState<NewMotorcycleForm>(INITIAL_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasContent = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(INITIAL_FORM),
    [form],
  );

  function updateField<K extends keyof NewMotorcycleForm>(
    field: K,
    value: NewMotorcycleForm[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setError("");
  }

  function updateName(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      nome: value,
      slug: slugManuallyEdited ? currentForm.slug : slugify(value),
    }));
    setError("");
  }

  function updateSlug(value: string) {
    setSlugManuallyEdited(true);
    updateField("slug", slugify(value));
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
  }

  function addDetail() {
    setForm((currentForm) => ({
      ...currentForm,
      detalhes: [...currentForm.detalhes, { rotulo: "", valor: "" }],
    }));
    setError("");
  }

  function removeDetail(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      detalhes: currentForm.detalhes.filter(
        (_, detailIndex) => detailIndex !== index,
      ),
    }));
    setError("");
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
  }

  function removeBenefit(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      beneficios: currentForm.beneficios.filter(
        (_, benefitIndex) => benefitIndex !== index,
      ),
    }));
    setError("");
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
  }

  function validateForm() {
    if (!form.nome.trim()) {
      return "Informe o nome da moto.";
    }

    if (!form.slug.trim()) {
      return "Informe o endereço da moto.";
    }

    if (!isValidSlug(form.slug)) {
      return "O endereço deve usar somente letras minúsculas, números e hífens.";
    }

    if (!form.categoria.trim()) {
      return "Informe a categoria da moto.";
    }

    if (!form.imagem_url.trim()) {
      return "Envie ou informe a imagem principal da moto.";
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

    if (form.detalhes.length === 0) {
      return "Adicione pelo menos um detalhe técnico.";
    }

    for (const [index, detail] of form.detalhes.entries()) {
      if (!detail.rotulo.trim() || !detail.valor.trim()) {
        return `Preencha o rótulo e o valor do detalhe ${index + 1}.`;
      }
    }

    if (form.beneficios.length === 0) {
      return "Adicione pelo menos um benefício.";
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

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const supabase = getAdminSupabaseClient();

      const { data: lastMotorcycle, error: orderError } = await supabase
        .from("motos")
        .select("ordem")
        .order("ordem", { ascending: false })
        .limit(1)
        .maybeSingle<{ ordem: number }>();

      if (orderError) {
        throw orderError;
      }

      const nextOrder = (lastMotorcycle?.ordem ?? 0) + 1;

      const payload = {
        slug: form.slug.trim(),
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
        ativo: false,
        ordem: nextOrder,
      };

      const { data, error: insertError } = await supabase
        .from("motos")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

      if (insertError) {
        throw insertError;
      }

      router.replace(`/admin/motos/${data.id}/configuracao`);
      router.refresh();
    } catch (insertError) {
      console.error(insertError);
      setError(getInsertErrorMessage(insertError));
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (
      hasContent &&
      !window.confirm("Descartar os dados desta nova moto?")
    ) {
      return;
    }

    router.push("/admin/motos");
  }

  return (
    <AdminShell
      title="Nova moto"
      description="Cadastre um novo modelo no catálogo central."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para motos
        </button>

        <span className={styles.newMotorcycleStep}>
          Etapa 1 de 4: dados do modelo
        </span>
      </div>

      <form
        className={styles.motorcycleEditLayout}
        onSubmit={handleSubmit}
      >
        <section className={styles.motorcycleEditPanel}>
          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Novo modelo</span>
            <h2>Informações principais</h2>
            <p>
              A moto será criada inativa e somente poderá ser publicada depois
              da configuração dos planos e vendedores.
            </p>
          </div>

          <div className={styles.editClientFields}>
            <label>
              Nome da moto
              <input
                value={form.nome}
                onChange={(event) => updateName(event.target.value)}
                placeholder="Ex.: CB 300F Twister ABS"
              />
            </label>

            <label>
              Endereço da moto
              <div className={styles.slugInput}>
                <span>/</span>
                <input
                  value={form.slug}
                  onChange={(event) => updateSlug(event.target.value)}
                  placeholder="cb-300f-twister-abs"
                />
              </div>

              <small className={styles.fieldHint}>
                Exemplo: /moto/{form.slug || "cb-300f-twister-abs"}
              </small>
            </label>

            <label>
              Categoria
              <input
                value={form.categoria}
                onChange={(event) =>
                  updateField("categoria", event.target.value)
                }
                placeholder="Street • Desempenho • Honda"
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
                onChange={(value) => updateField("imagem_url", value)}
                folder={`motos/novas/${form.slug || "sem-slug"}/principal`}
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
                placeholder="Performance e tecnologia para todos os caminhos"
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
                    placeholder="293,5 cc"
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
                    placeholder="Mais desempenho"
                  />
                </label>

                <label className={styles.motorcycleBenefitDescription}>
                  Descrição
                  <input
                    value={benefit.descricao}
                    onChange={(event) =>
                      updateBenefit(index, "descricao", event.target.value)
                    }
                    placeholder="Explique o principal benefício."
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
          </div>

          {error ? (
            <p className={styles.editClientError} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.editClientActions}>
            <button type="button" onClick={goBack} disabled={saving}>
              Cancelar
            </button>

            <button
              className={styles.saveClientButton}
              type="submit"
              disabled={saving}
            >
              {saving ? "Cadastrando..." : "Cadastrar e continuar"}
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
                  <img
                    src={form.imagem_url}
                    alt={form.nome || "Nova moto"}
                  />
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
              <strong>Publicação segura</strong>
              <p>
                A moto será cadastrada inativa. Depois você adicionará os
                planos, financiamento e vendedores antes de publicá-la.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </AdminShell>
  );
}
