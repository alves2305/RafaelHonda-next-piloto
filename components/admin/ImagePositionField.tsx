"use client";

/* eslint-disable @next/next/no-img-element */

import styles from "@/app/admin/admin.module.css";

type ImagePositionFieldProps = {
  label: string;
  imageUrl: string;
  horizontal: number;
  vertical: number;
  onHorizontalChange: (value: number) => void;
  onVerticalChange: (value: number) => void;
  shape: "circle" | "rectangle";
  help: string;
};

function clampPosition(value: number) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function ImagePositionField({
  label,
  imageUrl,
  horizontal,
  vertical,
  onHorizontalChange,
  onVerticalChange,
  shape,
  help,
}: ImagePositionFieldProps) {
  const safeHorizontal = clampPosition(horizontal);
  const safeVertical = clampPosition(vertical);
  const centered = safeHorizontal === 50 && safeVertical === 50;

  function resetPosition() {
    onHorizontalChange(50);
    onVerticalChange(50);
  }

  return (
    <article className={styles.imagePositionField}>
      <div className={styles.imagePositionHeading}>
        <div>
          <strong>{label}</strong>
          <span>{help}</span>
        </div>

        <button
          type="button"
          onClick={resetPosition}
          disabled={centered}
        >
          Centralizar
        </button>
      </div>

      <div
        className={`${styles.imagePositionPreview} ${
          shape === "circle"
            ? styles.imagePositionPreviewCircle
            : styles.imagePositionPreviewRectangle
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Prévia do enquadramento: ${label}`}
            style={{
              objectPosition: `${safeHorizontal}% ${safeVertical}%`,
            }}
          />
        ) : (
          <span>Selecione uma imagem para ajustar</span>
        )}

        <i aria-hidden="true" />
      </div>

      <div className={styles.imagePositionControls}>
        <label>
          <span>
            Horizontal
            <strong>{safeHorizontal}%</strong>
          </span>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={safeHorizontal}
            disabled={!imageUrl}
            onChange={(event) =>
              onHorizontalChange(Number(event.target.value))
            }
          />

          <small>
            <span>Esquerda</span>
            <span>Direita</span>
          </small>
        </label>

        <label>
          <span>
            Vertical
            <strong>{safeVertical}%</strong>
          </span>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={safeVertical}
            disabled={!imageUrl}
            onChange={(event) =>
              onVerticalChange(Number(event.target.value))
            }
          />

          <small>
            <span>Topo</span>
            <span>Base</span>
          </small>
        </label>
      </div>
    </article>
  );
}
