"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

const STORAGE_BUCKET = "catalogo-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: string;
  placeholder: string;
  help?: string;
  required?: boolean;
  previewFit?: "cover" | "contain";
};

function sanitizePathPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeFolder(folder: string) {
  return folder
    .split("/")
    .map(sanitizePathPart)
    .filter(Boolean)
    .join("/");
}

function createFilePath(folder: string, extension: string) {
  const safeFolder = normalizeFolder(folder) || "outros";
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${safeFolder}/${Date.now()}-${uniquePart}.${extension}`;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  placeholder,
  help,
  required = false,
  previewFit = "cover",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    const extension = ACCEPTED_TYPES.get(file.type);

    if (!extension) {
      setError("Use uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("A imagem precisa ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const supabase = getAdminSupabaseClient();
      const filePath = createFilePath(folder, extension);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      setMessage("Imagem enviada. Salve o formulário para concluir.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        "Não foi possível enviar a imagem. Confirme o SQL do Storage e sua sessão administrativa.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className={styles.imageUploadField}>
      <div className={styles.imageUploadHeading}>
        <div>
          <strong>
            {label}
            {required ? " *" : ""}
          </strong>

          {help ? <span>{help}</span> : null}
        </div>

        {value ? (
          <button type="button" onClick={() => onChange("")}>
            Limpar
          </button>
        ) : null}
      </div>

      <div className={styles.imageUploadContent}>
        <div
          className={`${styles.imageUploadPreview} ${
            previewFit === "contain"
              ? styles.imageUploadPreviewContain
              : ""
          }`}
        >
          {value ? (
            <img src={value} alt={`Prévia: ${label}`} />
          ) : (
            <span>Sem imagem</span>
          )}
        </div>

        <div className={styles.imageUploadControls}>
          <input
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setMessage("");
              setError("");
            }}
            placeholder={placeholder}
            required={required}
          />

          <input
            ref={inputRef}
            className={styles.imageUploadFileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleFileChange(event)}
          />

          <button
            className={styles.imageUploadButton}
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Enviando..." : "Selecionar imagem"}
          </button>

          <small>JPG, PNG ou WebP • máximo de 5 MB</small>
        </div>
      </div>

      {message ? (
        <p className={styles.imageUploadSuccess} role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className={styles.imageUploadError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
