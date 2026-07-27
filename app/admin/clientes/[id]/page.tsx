"use client";

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImagePositionField } from "@/components/admin/ImagePositionField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type ClientForm = {
  id: string;
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

type ClientRow = {
  id: string;
  nome: string;
  slug: string;
  foto_url: string;
  foto_desktop_url: string | null;
  foto_posicao_x: number;
  foto_posicao_y: number;
  foto_desktop_posicao_x: number;
  foto_desktop_posicao_y: number;
  logo_url: string | null;
  whatsapp: string;
  instagram_url: string | null;
  slogan: string;
  cor_primaria: string;
  cor_secundaria: string;
  marca_dagua_url: string | null;
  vende_consorcio: boolean;
  vende_financiamento: boolean;
  ativo: boolean;
};

const EMPTY_FORM: ClientForm = {
  id: "",
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

function toForm(row: ClientRow): ClientForm {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    foto_url: row.foto_url,
    foto_desktop_url: row.foto_desktop_url ?? "",
    foto_posicao_x: row.foto_posicao_x,
    foto_posicao_y: row.foto_posicao_y,
    foto_desktop_posicao_x: row.foto_desktop_posicao_x,
    foto_desktop_posicao_y: row.foto_desktop_posicao_y,
    logo_url: row.logo_url ?? "",
    whatsapp: row.whatsapp,
    instagram_url: row.instagram_url ?? "",
    slogan: row.slogan,
    cor_primaria: row.cor_primaria,
    cor_secundaria: row.cor_secundaria,
    marca_dagua_url: row.marca_dagua_url ?? "",
    vende_consorcio: row.vende_consorcio,
    vende_financiamento: row.vende_financiamento,
    ativo: row.ativo,
  };
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ClientForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadClient() {
      setLoading(true);
      setError("");

      try {
        const supabase = getAdminSupabaseClient();
        const { data, error: loadError } = await supabase
          .from("clientes")
          .select(
            "id,nome,slug,foto_url,foto_desktop_url,foto_posicao_x,foto_posicao_y,foto_desktop_posicao_x,foto_desktop_posicao_y,logo_url,whatsapp,instagram_url,slogan,cor_primaria,cor_secundaria,marca_dagua_url,vende_consorcio,vende_financiamento,ativo",
          )
          .eq("id", params.id)
          .maybeSingle<ClientRow>();

        if (loadError) {
          throw loadError;
        }

        if (!data) {
          setError("Cliente não encontrado.");
          return;
        }

        if (!active) {
          return;
        }

        const nextForm = toForm(data);
        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (loadError) {
        console.error(loadError);
        setError(
          "Não foi possível carregar o cliente. Verifique sua conexão com o Supabase.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadClient();

    return () => {
      active = false;
    };
  }, [params.id]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const previewStyle = {
    "--preview-primary": isHexColor(form.cor_primaria)
      ? form.cor_primaria
      : "#d90000",
    "--preview-secondary": isHexColor(form.cor_secundaria)
      ? form.cor_secundaria
      : "#1d2b45",
  } as CSSProperties;

  function updateField<K extends keyof ClientForm>(
    field: K,
    value: ClientForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccess("");
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
    setSuccess("");
  }

  function validateForm() {
    if (!form.nome.trim()) {
      return "Informe o nome do cliente.";
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
    setSuccess("");

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
        foto_url: form.foto_url.trim(),
        foto_desktop_url: normalizeOptionalUrl(form.foto_desktop_url),
        foto_posicao_x: form.foto_posicao_x,
        foto_posicao_y: form.foto_posicao_y,
        foto_desktop_posicao_x: form.foto_desktop_posicao_x,
        foto_desktop_posicao_y: form.foto_desktop_posicao_y,
        logo_url: normalizeOptionalUrl(form.logo_url),
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        instagram_url: normalizeOptionalUrl(form.instagram_url),
        slogan: form.slogan.trim(),
        cor_primaria: form.cor_primaria.toLowerCase(),
        cor_secundaria: form.cor_secundaria.toLowerCase(),
        marca_dagua_url: normalizeOptionalUrl(form.marca_dagua_url),
        vende_consorcio: form.vende_consorcio,
        vende_financiamento: form.vende_financiamento,
      };

      const { data, error: updateError } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", form.id)
        .select(
          "id,nome,slug,foto_url,foto_desktop_url,foto_posicao_x,foto_posicao_y,foto_desktop_posicao_x,foto_desktop_posicao_y,logo_url,whatsapp,instagram_url,slogan,cor_primaria,cor_secundaria,marca_dagua_url,vende_consorcio,vende_financiamento,ativo",
        )
        .single<ClientRow>();

      if (updateError) {
        throw updateError;
      }

      const nextForm = toForm(data);
      setForm(nextForm);
      setInitialForm(nextForm);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível salvar as alterações. Confirme sua permissão administrativa e tente novamente.",
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

    router.push("/admin/clientes");
  }

  return (
    <AdminShell
      title="Editar cliente"
      description="Atualize os dados e a identidade visual do perfil."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para clientes
        </button>

        <div className={styles.editClientTopbarActions}>
          {form.id ? (
            <Link href={`/admin/clientes/${form.id}/motos`}>
              Gerenciar motos
            </Link>
          ) : null}

          {form.slug ? (
            <Link href={`/${form.slug}`} target="_blank">
              Abrir catálogo público ↗
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando perfil...</p>
        </div>
      ) : error === "Cliente não encontrado." ? (
        <div className={styles.adminErrorBox}>
          <p>{error}</p>
          <Link href="/admin/clientes">Voltar para clientes</Link>
        </div>
      ) : (
        <form className={styles.editClientLayout} onSubmit={handleSubmit}>
          <section className={styles.editClientFormPanel}>
            <div className={styles.editClientSectionHeading}>
              <span className={styles.sectionEyebrow}>Informações principais</span>
              <h2>Dados do cliente</h2>
              <p>
                O endereço do catálogo é protegido para evitar links quebrados.
              </p>
            </div>

            <div className={styles.editClientFields}>
              <label>
                Nome do cliente
                <input
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  placeholder="Ex.: Rafael Honda"
                />
              </label>

              <label>
                Endereço do catálogo
                <div className={styles.lockedInput}>
                  <span>/</span>
                  <input value={form.slug} disabled />
                  <small>Protegido</small>
                </div>
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
                  placeholder="Mensagem principal do perfil"
                  rows={3}
                />
              </label>
            </div>

            <div className={styles.editClientDivider} />

            <div className={styles.editClientSectionHeading}>
              <span className={styles.sectionEyebrow}>Modalidades de venda</span>
              <h2>O que este vendedor comercializa?</h2>
              <p>
                As opções desativadas deixam de aparecer no site e suas URLs
                diretas ficam bloqueadas.
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
                  checked={
                    form.vende_consorcio && form.vende_financiamento
                  }
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
                  checked={
                    form.vende_consorcio && !form.vende_financiamento
                  }
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
                  checked={
                    !form.vende_consorcio && form.vende_financiamento
                  }
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
                Envie as imagens diretamente pelo painel ou mantenha um caminho
                público já existente.
              </p>
            </div>

            <div className={styles.imageUploadGrid}>
              <ImageUploadField
                label="Foto mobile"
                value={form.foto_url}
                onChange={(value) => updateField("foto_url", value)}
                folder={`clientes/${form.id}/foto-mobile`}
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
                folder={`clientes/${form.id}/foto-desktop`}
                placeholder="/assets/perfis/cliente-desktop.svg"
                help="Imagem maior utilizada no computador."
              />

              <ImageUploadField
                label="Logo"
                value={form.logo_url}
                onChange={(value) => updateField("logo_url", value)}
                folder={`clientes/${form.id}/logo`}
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
                folder={`clientes/${form.id}/marca-dagua`}
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
                {saving ? "Salvando..." : "Salvar perfil"}
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

                  <span className={styles.clientPreviewButton}>
                    Falar no WhatsApp
                  </span>
                </div>
              </article>

              <div className={styles.previewInfoBox}>
                <strong>Alterações em tempo real</strong>
                <p>
                  Esta prévia serve para conferir cores, foto, logo, nome e
                  slogan antes de salvar.
                </p>
              </div>
            </div>
          </aside>
        </form>
      )}
    </AdminShell>
  );
}
