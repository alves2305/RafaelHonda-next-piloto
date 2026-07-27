"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImagePositionField } from "@/components/admin/ImagePositionField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type NewClientForm = {
  nome: string;
  slug: string;
  foto_url: string;
  foto_desktop_url: string;
  foto_posicao_x: number;
  foto_posicao_y: number;
  foto_desktop_posicao_x: number;
  foto_desktop_posicao_y: number;
  logo_url: string;
  whatsapp: string;
  instagram_url: string;
  slogan: string;
  cor_primaria: string;
  cor_secundaria: string;
  marca_dagua_url: string;
  vende_consorcio: boolean;
  vende_financiamento: boolean;
  ativo: boolean;
};

const INITIAL_FORM: NewClientForm = {
  nome: "",
  slug: "",
  foto_url: "",
  foto_desktop_url: "",
  foto_posicao_x: 50,
  foto_posicao_y: 50,
  foto_desktop_posicao_x: 50,
  foto_desktop_posicao_y: 50,
  logo_url: "",
  whatsapp: "",
  instagram_url: "",
  slogan: "",
  cor_primaria: "#d90000",
  cor_secundaria: "#1d2b45",
  marca_dagua_url: "",
  vende_consorcio: true,
  vende_financiamento: true,
  ativo: true,
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

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return "Este endereço de catálogo já está sendo usado por outro cliente.";
  }

  return "Não foi possível cadastrar o cliente. Confira os dados e tente novamente.";
}

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<NewClientForm>(INITIAL_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasContent = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(INITIAL_FORM),
    [form],
  );

  const previewStyle = {
    "--preview-primary": isHexColor(form.cor_primaria)
      ? form.cor_primaria
      : "#d90000",
    "--preview-secondary": isHexColor(form.cor_secundaria)
      ? form.cor_secundaria
      : "#1d2b45",
  } as CSSProperties;

  function updateField<K extends keyof NewClientForm>(
    field: K,
    value: NewClientForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
  }

  function updateName(value: string) {
    setForm((current) => ({
      ...current,
      nome: value,
      slug: slugManuallyEdited ? current.slug : slugify(value),
    }));
    setError("");
  }

  function updateSlug(value: string) {
    setSlugManuallyEdited(true);
    updateField("slug", slugify(value));
  }

  function updateSalesMode(
    mode: "ambos" | "consorcio" | "financiamento",
  ) {
    setForm((current) => ({
      ...current,
      vende_consorcio: mode !== "financiamento",
      vende_financiamento: mode !== "consorcio",
    }));
    setError("");
  }

  function validateForm() {
    if (!form.nome.trim()) {
      return "Informe o nome do cliente.";
    }

    if (!form.slug.trim()) {
      return "Informe o endereço do catálogo.";
    }

    if (!isValidSlug(form.slug)) {
      return "O endereço deve usar somente letras minúsculas, números e hífens.";
    }

    if (!form.whatsapp.trim()) {
      return "Informe o WhatsApp do cliente.";
    }

    const phoneDigits = form.whatsapp.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      return "Informe um WhatsApp válido, incluindo DDD e código do país.";
    }

    if (!form.slogan.trim()) {
      return "Informe o slogan do cliente.";
    }

    if (!form.vende_consorcio && !form.vende_financiamento) {
      return "Selecione pelo menos uma modalidade comercializada.";
    }

    if (!form.foto_url.trim()) {
      return "Informe a URL da foto mobile.";
    }

    const positions = [
      form.foto_posicao_x,
      form.foto_posicao_y,
      form.foto_desktop_posicao_x,
      form.foto_desktop_posicao_y,
    ];

    if (
      positions.some(
        (position) =>
          !Number.isInteger(position) ||
          position < 0 ||
          position > 100,
      )
    ) {
      return "As posições das fotos precisam estar entre 0 e 100.";
    }

    if (!isHexColor(form.cor_primaria)) {
      return "A cor primária precisa estar no formato hexadecimal, como #d90000.";
    }

    if (!isHexColor(form.cor_secundaria)) {
      return "A cor secundária precisa estar no formato hexadecimal, como #1d2b45.";
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

      const payload = {
        nome: form.nome.trim(),
        slug: form.slug.trim(),
        foto_url: form.foto_url.trim(),
        foto_desktop_url: optionalValue(form.foto_desktop_url),
        foto_posicao_x: form.foto_posicao_x,
        foto_posicao_y: form.foto_posicao_y,
        foto_desktop_posicao_x: form.foto_desktop_posicao_x,
        foto_desktop_posicao_y: form.foto_desktop_posicao_y,
        logo_url: optionalValue(form.logo_url),
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        instagram_url: optionalValue(form.instagram_url),
        slogan: form.slogan.trim(),
        cor_primaria: form.cor_primaria.toLowerCase(),
        cor_secundaria: form.cor_secundaria.toLowerCase(),
        marca_dagua_url: optionalValue(form.marca_dagua_url),
        vende_consorcio: form.vende_consorcio,
        vende_financiamento: form.vende_financiamento,
        ativo: form.ativo,
      };

      const { data, error: insertError } = await supabase
        .from("clientes")
        .insert(payload)
        .select("id")
        .single<{ id: string }>();

      if (insertError) {
        throw insertError;
      }

      router.replace(`/admin/clientes/${data.id}/motos`);
      router.refresh();
    } catch (insertError) {
      console.error(insertError);
      setError(getErrorMessage(insertError));
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (
      hasContent &&
      !window.confirm("Descartar os dados deste novo cliente?")
    ) {
      return;
    }

    router.push("/admin/clientes");
  }

  return (
    <AdminShell
      title="Novo cliente"
      description="Cadastre um novo perfil no catálogo centralizado."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para clientes
        </button>

        <span className={styles.newClientStep}>
          Etapa 1 de 2: dados do perfil
        </span>
      </div>

      <form className={styles.editClientLayout} onSubmit={handleSubmit}>
        <section className={styles.editClientFormPanel}>
          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Novo perfil</span>
            <h2>Informações principais</h2>
            <p>
              Depois do cadastro, você poderá selecionar quais motos este
              cliente vende.
            </p>
          </div>

          <div className={styles.editClientFields}>
            <label>
              Nome do cliente
              <input
                value={form.nome}
                onChange={(event) => updateName(event.target.value)}
                placeholder="Ex.: João Honda"
              />
            </label>

            <label>
              Endereço do catálogo
              <div className={styles.slugInput}>
                <span>/</span>
                <input
                  value={form.slug}
                  onChange={(event) => updateSlug(event.target.value)}
                  placeholder="joao"
                />
              </div>
              <small className={styles.fieldHint}>
                Exemplo: seusite.com/{form.slug || "joao"}
              </small>
            </label>

            <label>
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(event) =>
                  updateField("whatsapp", event.target.value)
                }
                placeholder="5574999999999"
                inputMode="tel"
              />
            </label>

            <label>
              Instagram
              <input
                value={form.instagram_url}
                onChange={(event) =>
                  updateField("instagram_url", event.target.value)
                }
                placeholder="https://instagram.com/usuario"
                type="url"
              />
            </label>

            <label className={styles.fullField}>
              Slogan
              <textarea
                value={form.slogan}
                onChange={(event) =>
                  updateField("slogan", event.target.value)
                }
                placeholder="Mensagem principal do vendedor"
                rows={3}
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
                <strong>Ativar catálogo imediatamente</strong>
                <small>
                  O perfil poderá ser acessado assim que as motos forem
                  selecionadas.
                </small>
              </span>
            </label>
          </div>

          <div className={styles.editClientDivider} />

          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Modalidades de venda</span>
            <h2>O que este vendedor comercializa?</h2>
            <p>
              Esta configuração controla os botões e páginas disponíveis no
              catálogo público.
            </p>
          </div>

          <div className={styles.salesModeGrid}>
            <label
              className={
                form.vende_consorcio && form.vende_financiamento
                  ? styles.salesModeCardActive
                  : ""
              }
            >
              <input
                type="radio"
                name="modalidade"
                checked={form.vende_consorcio && form.vende_financiamento}
                onChange={() => updateSalesMode("ambos")}
              />
              <strong>Consórcio e financiamento</strong>
              <span>Exibe as duas opções em todas as motos.</span>
            </label>

            <label
              className={
                form.vende_consorcio && !form.vende_financiamento
                  ? styles.salesModeCardActive
                  : ""
              }
            >
              <input
                type="radio"
                name="modalidade"
                checked={form.vende_consorcio && !form.vende_financiamento}
                onChange={() => updateSalesMode("consorcio")}
              />
              <strong>Somente consórcio</strong>
              <span>Oculta completamente o financiamento.</span>
            </label>

            <label
              className={
                !form.vende_consorcio && form.vende_financiamento
                  ? styles.salesModeCardActive
                  : ""
              }
            >
              <input
                type="radio"
                name="modalidade"
                checked={!form.vende_consorcio && form.vende_financiamento}
                onChange={() => updateSalesMode("financiamento")}
              />
              <strong>Somente financiamento</strong>
              <span>Oculta tabelas e páginas de consórcio.</span>
            </label>
          </div>

          <div className={styles.editClientDivider} />

          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Identidade visual</span>
            <h2>Cores do perfil</h2>
          </div>

          <div className={styles.colorFields}>
            <label>
              Cor primária
              <div>
                <input
                  type="color"
                  value={
                    isHexColor(form.cor_primaria)
                      ? form.cor_primaria
                      : "#d90000"
                  }
                  onChange={(event) =>
                    updateField("cor_primaria", event.target.value)
                  }
                  aria-label="Selecionar cor primária"
                />

                <input
                  value={form.cor_primaria}
                  onChange={(event) =>
                    updateField("cor_primaria", event.target.value)
                  }
                  placeholder="#d90000"
                />
              </div>
            </label>

            <label>
              Cor secundária
              <div>
                <input
                  type="color"
                  value={
                    isHexColor(form.cor_secundaria)
                      ? form.cor_secundaria
                      : "#1d2b45"
                  }
                  onChange={(event) =>
                    updateField("cor_secundaria", event.target.value)
                  }
                  aria-label="Selecionar cor secundária"
                />

                <input
                  value={form.cor_secundaria}
                  onChange={(event) =>
                    updateField("cor_secundaria", event.target.value)
                  }
                  placeholder="#1d2b45"
                />
              </div>
            </label>
          </div>

          <div className={styles.editClientDivider} />

          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Imagens</span>
            <h2>URLs dos arquivos</h2>
            <p>
              Envie as imagens diretamente pelo painel ou utilize caminhos
              públicos já existentes.
            </p>
          </div>

          <div className={styles.imageUploadGrid}>
            <ImageUploadField
              label="Foto mobile"
              value={form.foto_url}
              onChange={(value) => updateField("foto_url", value)}
              folder={`clientes/novos/${form.slug || "sem-slug"}/foto-mobile`}
              placeholder="/assets/perfis/cliente-mobile.svg"
              help="Foto redonda exibida no celular."
              required
            />

            <ImageUploadField
              label="Foto desktop"
              value={form.foto_desktop_url}
              onChange={(value) =>
                updateField("foto_desktop_url", value)
              }
              folder={`clientes/novos/${form.slug || "sem-slug"}/foto-desktop`}
              placeholder="/assets/perfis/cliente-desktop.svg"
              help="Imagem maior utilizada no computador."
            />

            <ImageUploadField
              label="Logo"
              value={form.logo_url}
              onChange={(value) => updateField("logo_url", value)}
              folder={`clientes/novos/${form.slug || "sem-slug"}/logo`}
              placeholder="/assets/marca/logo.svg"
              help="Prefira PNG ou WebP com fundo transparente."
              previewFit="contain"
            />

            <ImageUploadField
              label="Marca-d'água"
              value={form.marca_dagua_url}
              onChange={(value) =>
                updateField("marca_dagua_url", value)
              }
              folder={`clientes/novos/${form.slug || "sem-slug"}/marca-dagua`}
              placeholder="/assets/marca/marca-dagua.svg"
              help="Aplicada sobre a tabela de consórcio."
              previewFit="contain"
            />
          </div>

          <div className={styles.editClientDivider} />

          <div className={styles.editClientSectionHeading}>
            <span className={styles.sectionEyebrow}>Enquadramento</span>
            <h2>Ajuste o ponto principal das fotos</h2>
            <p>
              Mova os controles até o rosto e as partes importantes ficarem
              centralizados nos formatos usados pelo site.
            </p>
          </div>

          <div className={styles.imagePositionGrid}>
            <ImagePositionField
              label="Foto mobile"
              imageUrl={form.foto_url}
              horizontal={form.foto_posicao_x}
              vertical={form.foto_posicao_y}
              onHorizontalChange={(value) =>
                updateField("foto_posicao_x", value)
              }
              onVerticalChange={(value) =>
                updateField("foto_posicao_y", value)
              }
              shape="circle"
              help="Prévia redonda utilizada em celulares e avatares."
            />

            <ImagePositionField
              label="Foto desktop"
              imageUrl={form.foto_desktop_url || form.foto_url}
              horizontal={form.foto_desktop_posicao_x}
              vertical={form.foto_desktop_posicao_y}
              onHorizontalChange={(value) =>
                updateField("foto_desktop_posicao_x", value)
              }
              onVerticalChange={(value) =>
                updateField("foto_desktop_posicao_y", value)
              }
              shape="rectangle"
              help="Prévia retangular utilizada no cabeçalho do computador."
            />
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
              {saving ? "Cadastrando..." : "Cadastrar cliente"}
            </button>
          </div>
        </section>

        <aside className={styles.clientPreviewPanel}>
          <div className={styles.previewSticky}>
            <div className={styles.editClientSectionHeading}>
              <span className={styles.sectionEyebrow}>Pré-visualização</span>
              <h2>Como ficará o perfil</h2>
            </div>

            <article className={styles.clientProfilePreview} style={previewStyle}>
              <div className={styles.clientPreviewBanner} />

              <div className={styles.clientPreviewCard}>
                <div className={styles.clientPreviewPhoto}>
                  {form.foto_url ? (
                    <img
                      src={form.foto_url}
                      alt={`Prévia da foto de ${form.nome || "cliente"}`}
                      style={{
                        objectPosition: `${form.foto_posicao_x}% ${form.foto_posicao_y}%`,
                      }}
                    />
                  ) : (
                    <span>Sem foto</span>
                  )}
                </div>

                {form.logo_url ? (
                  <img
                    className={styles.clientPreviewLogo}
                    src={form.logo_url}
                    alt="Prévia da logo"
                  />
                ) : null}

                <h3>{form.nome || "Nome do cliente"}</h3>
                <p>{form.slogan || "Slogan do cliente"}</p>

                <div className={styles.clientPreviewModes}>
                  {form.vende_consorcio ? <span>Consórcio</span> : null}
                  {form.vende_financiamento ? (
                    <span>Financiamento</span>
                  ) : null}
                </div>

                <span className={styles.clientPreviewButton}>
                  Falar no WhatsApp
                </span>
              </div>
            </article>

            <div className={styles.previewInfoBox}>
              <strong>Próxima etapa</strong>
              <p>
                Depois do cadastro, vamos liberar a seleção das motos deste
                vendedor.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </AdminShell>
  );
}
