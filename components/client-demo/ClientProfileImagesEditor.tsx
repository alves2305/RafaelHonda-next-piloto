"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import {
  ClientImageUploadField,
} from "@/components/client-demo/ClientImageUploadField";
import type { ClientPanelProfile } from "@/lib/client-panel-data";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientProfileImagesEditor.module.css";

type ImagesForm = {
  mobilePhotoUrl: string;
  desktopPhotoUrl: string;
  logoUrl: string;
  watermarkUrl: string;
};

type UpdatedImages = {
  id: string;
  slug: string;
  mobilePhotoUrl: string;
  desktopPhotoUrl: string | null;
  logoUrl: string | null;
  watermarkUrl: string | null;
};

function toForm(
  profile: ClientPanelProfile,
): ImagesForm {
  return {
    mobilePhotoUrl:
      profile.mobilePhotoUrl,
    desktopPhotoUrl:
      profile.desktopPhotoUrl ?? "",
    logoUrl: profile.logoUrl ?? "",
    watermarkUrl:
      profile.watermarkUrl ?? "",
  };
}

export function ClientProfileImagesEditor({
  profile,
  onSaved,
}: {
  profile: ClientPanelProfile;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] =
    useState<ImagesForm>(() =>
      toForm(profile),
    );
  const [savedForm, setSavedForm] =
    useState<ImagesForm>(() =>
      toForm(profile),
    );
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const hasChanges = useMemo(
    () =>
      JSON.stringify(form) !==
      JSON.stringify(savedForm),
    [form, savedForm],
  );

  function updateField<
    K extends keyof ImagesForm,
  >(
    field: K,
    value: ImagesForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.mobilePhotoUrl.trim()) {
      setError(
        "A foto mobile é obrigatória.",
      );
      return;
    }

    setSaving(true);

    try {
      const supabase =
        getClientSupabaseClient();

      const { data, error: updateError } =
        await supabase.rpc(
          "atualizar_minhas_imagens_cliente",
          {
            p_foto_url:
              form.mobilePhotoUrl.trim(),
            p_foto_desktop_url:
              form.desktopPhotoUrl.trim() ||
              null,
            p_logo_url:
              form.logoUrl.trim() || null,
            p_marca_dagua_url:
              form.watermarkUrl.trim() ||
              null,
          },
        );

      if (updateError) {
        throw updateError;
      }

      const updated =
        data as UpdatedImages;

      if (
        !updated ||
        updated.id !== profile.id ||
        updated.slug !== profile.slug
      ) {
        throw new Error(
          "O perfil retornado não corresponde ao catálogo autenticado.",
        );
      }

      const nextForm: ImagesForm = {
        mobilePhotoUrl:
          updated.mobilePhotoUrl,
        desktopPhotoUrl:
          updated.desktopPhotoUrl ?? "",
        logoUrl:
          updated.logoUrl ?? "",
        watermarkUrl:
          updated.watermarkUrl ?? "",
      };

      setForm(nextForm);
      setSavedForm(nextForm);
      setSuccess(
        "Imagens publicadas com sucesso no seu catálogo.",
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
          !message
            .toLowerCase()
            .includes("fetch")
          ? message
          : "Não foi possível salvar as imagens. Confira a conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm(
        "Descartar as imagens ainda não publicadas?",
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
      className={styles.imagesEditor}
      onSubmit={handleSubmit}
    >
      <div className={styles.imagesHeading}>
        <div>
          <span>Arquivos do perfil</span>
          <h2>Fotos e identidade visual</h2>
          <p>
            Cada arquivo é otimizado antes do
            envio e salvo somente na pasta do
            seu próprio catálogo.
          </p>
        </div>

        <span className={styles.securityBadge}>
          Pasta exclusiva
        </span>
      </div>

      <div className={styles.securityPath}>
        <small>Pasta protegida</small>
        <strong>
          clientes/{profile.id}/
        </strong>
        <p>
          Outra conta não consegue enviar ou
          vincular arquivos nesta pasta.
        </p>
      </div>

      <div className={styles.uploadGrid}>
        <ClientImageUploadField
          clientId={profile.id}
          kind="foto-mobile"
          label="Foto mobile"
          value={form.mobilePhotoUrl}
          onChange={(value) =>
            updateField(
              "mobilePhotoUrl",
              value,
            )
          }
          help="Foto redonda exibida no celular e no perfil."
          required
        />

        <ClientImageUploadField
          clientId={profile.id}
          kind="foto-desktop"
          label="Foto desktop"
          value={form.desktopPhotoUrl}
          onChange={(value) =>
            updateField(
              "desktopPhotoUrl",
              value,
            )
          }
          help="Imagem retangular usada no cabeçalho do computador."
        />

        <ClientImageUploadField
          clientId={profile.id}
          kind="logo"
          label="Logotipo"
          value={form.logoUrl}
          onChange={(value) =>
            updateField("logoUrl", value)
          }
          help="Prefira PNG ou WebP com fundo transparente."
          previewFit="contain"
        />

        <ClientImageUploadField
          clientId={profile.id}
          kind="marca-dagua"
          label="Marca-d'água"
          value={form.watermarkUrl}
          onChange={(value) =>
            updateField(
              "watermarkUrl",
              value,
            )
          }
          help="Imagem aplicada sobre as tabelas de consórcio."
          previewFit="contain"
        />
      </div>

      <div className={styles.notice}>
        <strong>
          O envio e a publicação são etapas
          diferentes
        </strong>
        <p>
          Depois de selecionar as imagens,
          clique em Salvar imagens. Até esse
          momento, o catálogo continua usando
          os arquivos anteriores.
        </p>
      </div>

      {error ? (
        <p
          className={styles.formError}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className={styles.formSuccess}
          role="status"
        >
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
          className={styles.saveButton}
          type="submit"
          disabled={!hasChanges || saving}
        >
          {saving
            ? "Salvando..."
            : "Salvar imagens"}
        </button>
      </div>
    </form>
  );
}
