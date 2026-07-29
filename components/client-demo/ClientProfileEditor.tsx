"use client";

/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type { ClientPanelProfile } from "@/lib/client-panel-data";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientProfileEditor.module.css";

type ProfileForm = {
  name: string;
  whatsapp: string;
  instagram: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  sellsConsortium: boolean;
  sellsFinancing: boolean;
};

type UpdatedProfile = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  instagramUrl: string | null;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  sellsConsortium: boolean;
  sellsFinancing: boolean;
  active: boolean;
};

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function normalizeInstagram(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
      .replace(/^http:\/\//i, "https://")
      .replace(/\/+$/, "");
  }

  const username = trimmed
    .replace(/^@/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^www\.instagram\.com\//i, "")
    .replace(/\/+$/, "");

  return username
    ? `https://instagram.com/${username}`
    : "";
}

function toForm(
  profile: ClientPanelProfile,
): ProfileForm {
  return {
    name: profile.name,
    whatsapp: profile.whatsapp,
    instagram: profile.instagramUrl ?? "",
    slogan: profile.slogan,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    sellsConsortium: profile.sellsConsortium,
    sellsFinancing: profile.sellsFinancing,
  };
}

function salesModeLabel(form: ProfileForm) {
  if (
    form.sellsConsortium &&
    form.sellsFinancing
  ) {
    return "Consórcio e financiamento";
  }

  if (form.sellsFinancing) {
    return "Somente financiamento";
  }

  return "Somente consórcio";
}

export function ClientProfileEditor({
  profile,
  onSaved,
}: {
  profile: ClientPanelProfile;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<ProfileForm>(
    () => toForm(profile),
  );
  const [savedForm, setSavedForm] =
    useState<ProfileForm>(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = useMemo(
    () =>
      JSON.stringify(form) !==
      JSON.stringify(savedForm),
    [form, savedForm],
  );

  const previewPrimary = isHexColor(
    form.primaryColor,
  )
    ? form.primaryColor
    : "#d90000";

  const previewSecondary = isHexColor(
    form.secondaryColor,
  )
    ? form.secondaryColor
    : "#1d2b45";

  function updateField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  }

  function updateSalesMode(
    mode:
      | "both"
      | "consortium"
      | "financing",
  ) {
    setForm((current) => ({
      ...current,
      sellsConsortium: mode !== "financing",
      sellsFinancing: mode !== "consortium",
    }));
    setError("");
    setSuccess("");
  }

  function validateForm() {
    const normalizedName = form.name.trim();
    const phoneDigits =
      form.whatsapp.replace(/\D/g, "");
    const normalizedInstagram =
      normalizeInstagram(form.instagram);

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 120
    ) {
      return "O nome precisa ter entre 2 e 120 caracteres.";
    }

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 13
    ) {
      return "Informe um WhatsApp válido com DDD e código do país.";
    }

    if (
      form.slogan.trim().length < 2 ||
      form.slogan.trim().length > 500
    ) {
      return "O slogan precisa ter entre 2 e 500 caracteres.";
    }

    if (
      normalizedInstagram &&
      !/^https:\/\/(www\.)?instagram\.com\/[a-z0-9._]+\/?$/i.test(
        normalizedInstagram,
      )
    ) {
      return "Informe um usuário ou endereço válido do Instagram.";
    }

    if (!isHexColor(form.primaryColor)) {
      return "A cor principal precisa estar no formato #d90000.";
    }

    if (!isHexColor(form.secondaryColor)) {
      return "A cor secundária precisa estar no formato #1d2b45.";
    }

    if (
      !form.sellsConsortium &&
      !form.sellsFinancing
    ) {
      return "Selecione pelo menos uma modalidade.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
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
      const supabase = getClientSupabaseClient();
      const { data, error: updateError } =
        await supabase.rpc(
          "atualizar_meu_perfil_cliente",
          {
            p_nome: form.name.trim(),
            p_whatsapp:
              form.whatsapp.replace(/\D/g, ""),
            p_instagram_url:
              normalizeInstagram(form.instagram) ||
              null,
            p_slogan: form.slogan.trim(),
            p_cor_primaria:
              form.primaryColor.toLowerCase(),
            p_cor_secundaria:
              form.secondaryColor.toLowerCase(),
            p_vende_consorcio:
              form.sellsConsortium,
            p_vende_financiamento:
              form.sellsFinancing,
          },
        );

      if (updateError) {
        throw updateError;
      }

      const updated = data as UpdatedProfile;

      if (
        updated.id !== profile.id ||
        updated.slug !== profile.slug
      ) {
        throw new Error(
          "O perfil retornado não corresponde ao catálogo autenticado.",
        );
      }

      const nextForm: ProfileForm = {
        name: updated.name,
        whatsapp: updated.whatsapp,
        instagram: updated.instagramUrl ?? "",
        slogan: updated.slogan,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        sellsConsortium:
          updated.sellsConsortium,
        sellsFinancing:
          updated.sellsFinancing,
      };

      setForm(nextForm);
      setSavedForm(nextForm);
      setSuccess(
        "Perfil atualizado. As mudanças já estão disponíveis no catálogo.",
      );

      await onSaved();
    } catch (saveError) {
      console.error(saveError);

      const message =
        saveError instanceof Error
          ? saveError.message
          : "";

      setError(
        message &&
          !message.toLowerCase().includes("fetch")
          ? message
          : "Não foi possível salvar o perfil. Confira a conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm(
        "Descartar as alterações ainda não salvas?",
      )
    ) {
      return;
    }

    setForm(savedForm);
    setError("");
    setSuccess("");
  }

  return (
    <form
      className={styles.layout}
      onSubmit={handleSubmit}
    >
      <section className={styles.editor}>
        <div className={styles.heading}>
          <div>
            <span>Edição segura</span>
            <h2>Informações do perfil</h2>
            <p>
              As alterações afetam somente o seu catálogo.
              Preços, slug e configurações administrativas
              continuam bloqueados.
            </p>
          </div>

          <span className={styles.securityBadge}>
            Conta protegida
          </span>
        </div>

        <div className={styles.lockedSummary}>
          <div>
            <small>Endereço do catálogo</small>
            <strong>/{profile.slug}</strong>
            <span>Protegido pelo administrador</span>
          </div>

          <div>
            <small>Status</small>
            <strong>
              {profile.active
                ? "Ativo e publicado"
                : "Bloqueado"}
            </strong>
            <span>Não pode ser alterado aqui</span>
          </div>
        </div>

        <div className={styles.fields}>
          <label>
            Nome exibido
            <input
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              maxLength={120}
              autoComplete="name"
            />
          </label>

          <div className={styles.twoColumns}>
            <label>
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(event) =>
                  updateField(
                    "whatsapp",
                    event.target.value,
                  )
                }
                inputMode="tel"
                placeholder="5574999999999"
                autoComplete="tel"
              />
              <small>
                Inclua código do país e DDD.
              </small>
            </label>

            <label>
              Instagram
              <input
                value={form.instagram}
                onChange={(event) =>
                  updateField(
                    "instagram",
                    event.target.value,
                  )
                }
                placeholder="@usuario"
                autoComplete="url"
              />
              <small>
                Pode informar apenas @usuario.
              </small>
            </label>
          </div>

          <label>
            Slogan
            <textarea
              value={form.slogan}
              onChange={(event) =>
                updateField(
                  "slogan",
                  event.target.value,
                )
              }
              rows={4}
              maxLength={500}
            />
            <small>
              {form.slogan.length}/500 caracteres
            </small>
          </label>
        </div>

        <div className={styles.divider} />

        <fieldset className={styles.salesModes}>
          <legend>Modalidades comercializadas</legend>
          <p>
            Ao desativar uma modalidade, seus botões e
            páginas deixam de aparecer no catálogo.
          </p>

          <div>
            <label
              className={
                form.sellsConsortium &&
                form.sellsFinancing
                  ? styles.modeActive
                  : ""
              }
            >
              <input
                type="radio"
                name="seller-mode"
                checked={
                  form.sellsConsortium &&
                  form.sellsFinancing
                }
                onChange={() =>
                  updateSalesMode("both")
                }
              />
              <strong>
                Consórcio e financiamento
              </strong>
              <span>Exibe as duas modalidades.</span>
            </label>

            <label
              className={
                form.sellsConsortium &&
                !form.sellsFinancing
                  ? styles.modeActive
                  : ""
              }
            >
              <input
                type="radio"
                name="seller-mode"
                checked={
                  form.sellsConsortium &&
                  !form.sellsFinancing
                }
                onChange={() =>
                  updateSalesMode("consortium")
                }
              />
              <strong>Somente consórcio</strong>
              <span>Oculta o financiamento.</span>
            </label>

            <label
              className={
                !form.sellsConsortium &&
                form.sellsFinancing
                  ? styles.modeActive
                  : ""
              }
            >
              <input
                type="radio"
                name="seller-mode"
                checked={
                  !form.sellsConsortium &&
                  form.sellsFinancing
                }
                onChange={() =>
                  updateSalesMode("financing")
                }
              />
              <strong>Somente financiamento</strong>
              <span>Oculta o consórcio.</span>
            </label>
          </div>
        </fieldset>

        <div className={styles.divider} />

        <div className={styles.colors}>
          <div>
            <span>Identidade visual</span>
            <h3>Cores do catálogo</h3>
          </div>

          <div className={styles.colorGrid}>
            <label>
              Cor principal
              <span>
                <input
                  type="color"
                  value={previewPrimary}
                  onChange={(event) =>
                    updateField(
                      "primaryColor",
                      event.target.value,
                    )
                  }
                  aria-label="Selecionar cor principal"
                />

                <input
                  value={form.primaryColor}
                  onChange={(event) =>
                    updateField(
                      "primaryColor",
                      event.target.value,
                    )
                  }
                  maxLength={7}
                  placeholder="#d90000"
                />
              </span>
            </label>

            <label>
              Cor secundária
              <span>
                <input
                  type="color"
                  value={previewSecondary}
                  onChange={(event) =>
                    updateField(
                      "secondaryColor",
                      event.target.value,
                    )
                  }
                  aria-label="Selecionar cor secundária"
                />

                <input
                  value={form.secondaryColor}
                  onChange={(event) =>
                    updateField(
                      "secondaryColor",
                      event.target.value,
                    )
                  }
                  maxLength={7}
                  placeholder="#1d2b45"
                />
              </span>
            </label>
          </div>
        </div>

        <div className={styles.imagesNotice}>
          <div className={styles.profileImage}>
            <img
              src={profile.mobilePhotoUrl}
              alt={`Foto de ${profile.name}`}
            />
          </div>

          <div>
            <strong>Fotos e logotipo protegidos</strong>
            <p>
              As imagens continuam sob controle administrativo
              até a criação das permissões de upload por
              vendedor.
            </p>
          </div>
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

        <div className={styles.actions}>
          <button
            type="button"
            onClick={discardChanges}
            disabled={!hasChanges || saving}
          >
            Descartar alterações
          </button>

          <button
            className={styles.save}
            type="submit"
            disabled={!hasChanges || saving}
          >
            {saving
              ? "Salvando..."
              : "Salvar meu perfil"}
          </button>
        </div>
      </section>

      <aside
        className={styles.preview}
        style={{
          background: `linear-gradient(145deg, ${previewPrimary}, ${previewSecondary})`,
        }}
      >
        <small>Prévia antes de salvar</small>

        <span className={styles.avatar}>
          <img src={profile.mobilePhotoUrl} alt="" />
        </span>

        {profile.logoUrl ? (
          <img
            className={styles.logo}
            src={profile.logoUrl}
            alt=""
          />
        ) : null}

        <h2>{form.name || "Nome do vendedor"}</h2>
        <p>{form.slogan || "Slogan do catálogo"}</p>

        <div>
          <span>WhatsApp</span>
          <span>
            {form.instagram.trim()
              ? "Instagram"
              : "Sem Instagram"}
          </span>
        </div>

        <strong>{salesModeLabel(form)}</strong>
      </aside>
    </form>
  );
}
