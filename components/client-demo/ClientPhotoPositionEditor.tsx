"use client";

/* eslint-disable @next/next/no-img-element */

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type { ClientPanelProfile } from "@/lib/client-panel-data";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientPhotoPositionEditor.module.css";

type PositionForm = {
  mobileX: number;
  mobileY: number;
  desktopX: number;
  desktopY: number;
};

type UpdatedPosition = {
  id: string;
  slug: string;
  mobilePhotoPositionX: number;
  mobilePhotoPositionY: number;
  desktopPhotoPositionX: number;
  desktopPhotoPositionY: number;
};

function clampPosition(value: number) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function toForm(profile: ClientPanelProfile): PositionForm {
  return {
    mobileX: clampPosition(profile.mobilePhotoPositionX),
    mobileY: clampPosition(profile.mobilePhotoPositionY),
    desktopX: clampPosition(profile.desktopPhotoPositionX),
    desktopY: clampPosition(profile.desktopPhotoPositionY),
  };
}

function AxisControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.axisControl}>
      <span>
        <strong>{label}</strong>
        <output>{value}%</output>
      </span>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />

      <div className={styles.axisLabels}>
        <small>0%</small>
        <small>50%</small>
        <small>100%</small>
      </div>
    </label>
  );
}

export function ClientPhotoPositionEditor({
  profile,
  onSaved,
}: {
  profile: ClientPanelProfile;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<PositionForm>(
    () => toForm(profile),
  );
  const [savedForm, setSavedForm] = useState<PositionForm>(
    () => toForm(profile),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = useMemo(
    () =>
      JSON.stringify(form) !==
      JSON.stringify(savedForm),
    [form, savedForm],
  );

  const desktopImage =
    profile.desktopPhotoUrl ||
    profile.mobilePhotoUrl;

  function updateField<K extends keyof PositionForm>(
    field: K,
    value: PositionForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: clampPosition(value),
    }));
    setError("");
    setSuccess("");
  }

  function resetMobile() {
    setForm((current) => ({
      ...current,
      mobileX: 50,
      mobileY: 50,
    }));
    setError("");
    setSuccess("");
  }

  function resetDesktop() {
    setForm((current) => ({
      ...current,
      desktopX: 50,
      desktopY: 50,
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
    setSaving(true);

    try {
      const supabase = getClientSupabaseClient();
      const { data, error: updateError } =
        await supabase.rpc(
          "atualizar_meu_enquadramento_cliente",
          {
            p_foto_posicao_x: form.mobileX,
            p_foto_posicao_y: form.mobileY,
            p_foto_desktop_posicao_x:
              form.desktopX,
            p_foto_desktop_posicao_y:
              form.desktopY,
          },
        );

      if (updateError) {
        throw updateError;
      }

      const updated = data as UpdatedPosition;

      if (
        !updated ||
        updated.id !== profile.id ||
        updated.slug !== profile.slug
      ) {
        throw new Error(
          "O perfil retornado não corresponde ao catálogo autenticado.",
        );
      }

      const nextForm: PositionForm = {
        mobileX: clampPosition(
          updated.mobilePhotoPositionX,
        ),
        mobileY: clampPosition(
          updated.mobilePhotoPositionY,
        ),
        desktopX: clampPosition(
          updated.desktopPhotoPositionX,
        ),
        desktopY: clampPosition(
          updated.desktopPhotoPositionY,
        ),
      };

      setForm(nextForm);
      setSavedForm(nextForm);
      setSuccess(
        "Enquadramento salvo. A nova posição já está disponível no catálogo.",
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
          : "Não foi possível salvar o enquadramento. Confira a conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm(
        "Descartar os ajustes de enquadramento ainda não salvos?",
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
      className={styles.editor}
      onSubmit={handleSubmit}
    >
      <div className={styles.heading}>
        <div>
          <span>Ajuste fino</span>
          <h2>Enquadramento das fotos</h2>
          <p>
            Mova os controles até o rosto e as partes
            importantes ficarem centralizados nos formatos
            usados no catálogo.
          </p>
        </div>

        <span className={styles.securityBadge}>
          Somente o próprio perfil
        </span>
      </div>

      <div className={styles.positionGrid}>
        <section className={styles.positionCard}>
          <div className={styles.cardHeading}>
            <div>
              <strong>Foto mobile</strong>
              <p>
                Prévia redonda utilizada no celular e no
                avatar do vendedor.
              </p>
            </div>

            <button
              type="button"
              onClick={resetMobile}
            >
              Centralizar
            </button>
          </div>

          <div className={styles.mobilePreview}>
            <img
              src={profile.mobilePhotoUrl}
              alt={`Prévia mobile de ${profile.name}`}
              style={{
                objectPosition: `${form.mobileX}% ${form.mobileY}%`,
              }}
            />
          </div>

          <div className={styles.controls}>
            <AxisControl
              label="Horizontal"
              value={form.mobileX}
              onChange={(value) =>
                updateField("mobileX", value)
              }
            />

            <AxisControl
              label="Vertical"
              value={form.mobileY}
              onChange={(value) =>
                updateField("mobileY", value)
              }
            />
          </div>
        </section>

        <section className={styles.positionCard}>
          <div className={styles.cardHeading}>
            <div>
              <strong>Foto desktop</strong>
              <p>
                Prévia retangular utilizada no cabeçalho do
                computador.
              </p>
            </div>

            <button
              type="button"
              onClick={resetDesktop}
            >
              Centralizar
            </button>
          </div>

          <div className={styles.desktopPreview}>
            <img
              src={desktopImage}
              alt={`Prévia desktop de ${profile.name}`}
              style={{
                objectPosition: `${form.desktopX}% ${form.desktopY}%`,
              }}
            />
          </div>

          {!profile.desktopPhotoUrl ? (
            <p className={styles.fallbackNotice}>
              Sem foto desktop exclusiva: a prévia está usando
              a foto mobile como alternativa.
            </p>
          ) : null}

          <div className={styles.controls}>
            <AxisControl
              label="Horizontal"
              value={form.desktopX}
              onChange={(value) =>
                updateField("desktopX", value)
              }
            />

            <AxisControl
              label="Vertical"
              value={form.desktopY}
              onChange={(value) =>
                updateField("desktopY", value)
              }
            />
          </div>
        </section>
      </div>

      <div className={styles.tip}>
        <strong>Dica de enquadramento</strong>
        <p>
          Horizontal move a imagem para os lados. Vertical
          move para cima e para baixo. O botão Centralizar
          retorna os dois controles para 50%.
        </p>
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
          Descartar ajustes
        </button>

        <button
          className={styles.saveButton}
          type="submit"
          disabled={!hasChanges || saving}
        >
          {saving
            ? "Salvando..."
            : "Salvar enquadramento"}
        </button>
      </div>
    </form>
  );
}
