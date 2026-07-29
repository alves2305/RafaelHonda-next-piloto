"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import {
  optimizeImageForUpload,
  type OptimizedImage,
} from "@/lib/image-optimization";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientProfileImagesEditor.module.css";

const STORAGE_BUCKET = "catalogo-assets";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ClientImageKind =
  | "foto-mobile"
  | "foto-desktop"
  | "logo"
  | "marca-dagua";

type ClientImageUploadFieldProps = {
  clientId: string;
  kind: ClientImageKind;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help: string;
  required?: boolean;
  previewFit?: "cover" | "contain";
};

function createFilePath(
  clientId: string,
  kind: ClientImageKind,
) {
  const uniquePart =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return [
    "clientes",
    clientId,
    kind,
    `${Date.now()}-${uniquePart}.webp`,
  ].join("/");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024))
    .toFixed(1)
    .replace(".", ",")} MB`;
}

function getOptimizationMessage(
  result: OptimizedImage,
) {
  return [
    "Imagem preparada:",
    `${formatFileSize(result.originalSize)} →`,
    `${formatFileSize(result.optimizedSize)} •`,
    `${result.width} × ${result.height}px.`,
    "Clique em Salvar imagens para publicar.",
  ].join(" ");
}

export function ClientImageUploadField({
  clientId,
  kind,
  label,
  value,
  onChange,
  help,
  required = false,
  previewFit = "cover",
}: ClientImageUploadFieldProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);
  const [uploading, setUploading] =
    useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Use uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const folder = [
        "clientes",
        clientId,
        kind,
      ].join("/");

      const optimizedImage =
        await optimizeImageForUpload(
          file,
          folder,
        );

      const supabase =
        getClientSupabaseClient();
      const filePath = createFilePath(
        clientId,
        kind,
      );

      const { error: uploadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(
            filePath,
            optimizedImage.file,
            {
              cacheControl: "31536000",
              contentType: "image/webp",
              upsert: false,
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      setMessage(
        getOptimizationMessage(
          optimizedImage,
        ),
      );
    } catch (uploadError) {
      console.error(uploadError);

      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.";

      setError(
        `${errorMessage} Confirme sua sessão e o SQL da Entrega 19.6.1.`,
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <article className={styles.uploadCard}>
      <div className={styles.uploadHeading}>
        <div>
          <strong>
            {label}
            {required ? " *" : ""}
          </strong>
          <p>{help}</p>
        </div>

        {value && !required ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setMessage("");
              setError("");
            }}
          >
            Remover
          </button>
        ) : null}
      </div>

      <div
        className={`${styles.uploadPreview} ${
          previewFit === "contain"
            ? styles.uploadPreviewContain
            : ""
        } ${
          kind === "foto-mobile"
            ? styles.uploadPreviewCircle
            : ""
        }`}
      >
        {value ? (
          <img
            src={value}
            alt={`Prévia: ${label}`}
          />
        ) : (
          <span>Sem imagem</span>
        )}
      </div>

      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) =>
          void handleFileChange(event)
        }
      />

      <button
        className={styles.selectButton}
        type="button"
        disabled={uploading}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        {uploading
          ? "Otimizando e enviando..."
          : value
            ? "Trocar imagem"
            : "Selecionar imagem"}
      </button>

      <small className={styles.fileHelp}>
        JPG, PNG ou WebP • original de até
        12 MB • otimização automática
      </small>

      {message ? (
        <p
          className={styles.uploadSuccess}
          role="status"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          className={styles.uploadError}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </article>
  );
}
