"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  ClientPanelMotorcycle,
  ClientPanelProfile,
} from "@/lib/client-panel-data";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientMotorcycleVisibilityEditor.module.css";

type CategoryFilter = "todas" | string;

type VisibilityResult = {
  clientId: string;
  visibleMotorcycleIds: string[];
  visibleCount: number;
  assignedCount: number;
};

function normalizeCategory(value: string) {
  return value.split("•")[0]?.trim() || "Outras";
}

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "";
}

export function ClientMotorcycleVisibilityEditor({
  profile,
  motorcycles,
  onSaved,
}: {
  profile: ClientPanelProfile;
  motorcycles: ClientPanelMotorcycle[];
  onSaved: () => void | Promise<void>;
}) {
  const initialVisibleIds = useMemo(
    () =>
      new Set(
        motorcycles
          .filter((motorcycle) => motorcycle.visible)
          .map((motorcycle) => motorcycle.id),
      ),
    [motorcycles],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialVisibleIds),
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(initialVisibleIds),
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<CategoryFilter>("todas");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(() => {
    const values = new Set(
      motorcycles.map((motorcycle) =>
        normalizeCategory(motorcycle.category),
      ),
    );

    return Array.from(values).sort((first, second) =>
      first.localeCompare(second, "pt-BR"),
    );
  }, [motorcycles]);

  const filteredMotorcycles = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return motorcycles.filter((motorcycle) => {
      const motorcycleCategory =
        normalizeCategory(motorcycle.category);

      const matchesSearch =
        !normalizedSearch ||
        motorcycle.name
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        motorcycle.slug
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        motorcycle.category
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesCategory =
        category === "todas" ||
        motorcycleCategory === category;

      return matchesSearch && matchesCategory;
    });
  }, [motorcycles, search, category]);

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== savedIds.size) {
      return true;
    }

    return Array.from(selectedIds).some(
      (motorcycleId) => !savedIds.has(motorcycleId),
    );
  }, [selectedIds, savedIds]);

  const visibleCount = selectedIds.size;
  const hiddenCount = Math.max(
    0,
    motorcycles.length - visibleCount,
  );

  function toggleMotorcycle(motorcycleId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(motorcycleId)) {
        next.delete(motorcycleId);
      } else {
        next.add(motorcycleId);
      }

      return next;
    });

    setError("");
    setSuccess("");
  }

  function showFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const motorcycle of filteredMotorcycles) {
        next.add(motorcycle.id);
      }

      return next;
    });

    setError("");
    setSuccess("");
  }

  function hideFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const motorcycle of filteredMotorcycles) {
        next.delete(motorcycle.id);
      }

      return next;
    });

    setError("");
    setSuccess("");
  }

  function discardChanges() {
    if (
      hasChanges &&
      !window.confirm(
        "Descartar as alterações de visibilidade ainda não salvas?",
      )
    ) {
      return;
    }

    setSelectedIds(new Set(savedIds));
    setError("");
    setSuccess("");
  }

  async function saveVisibility() {
    if (!hasChanges || saving) {
      return;
    }

    if (selectedIds.size === 0) {
      setError(
        "Mantenha pelo menos uma moto visível no catálogo.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getClientSupabaseClient();
      const visibleIds = Array.from(selectedIds);

      const { data, error: updateError } =
        await supabase.rpc(
          "atualizar_visibilidade_minhas_motos",
          {
            p_moto_ids: visibleIds,
          },
        );

      if (updateError) {
        throw updateError;
      }

      const result = data as VisibilityResult;

      if (
        !result ||
        result.clientId !== profile.id
      ) {
        throw new Error(
          "A atualização retornada não corresponde ao catálogo autenticado.",
        );
      }

      const confirmedIds = new Set(
        result.visibleMotorcycleIds,
      );

      setSelectedIds(confirmedIds);
      setSavedIds(new Set(confirmedIds));
      setSuccess(
        `${result.visibleCount} moto${
          result.visibleCount === 1 ? "" : "s"
        } publicada${
          result.visibleCount === 1 ? "" : "s"
        }. O catálogo público pode levar até 30 segundos para atualizar.`,
      );

      await onSaved();
    } catch (saveError) {
      console.error(saveError);

      const message = getErrorMessage(saveError);

      setError(
        message &&
          !message.toLowerCase().includes("fetch")
          ? message
          : "Não foi possível salvar a visibilidade das motos. Confira a conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (motorcycles.length === 0) {
    return (
      <section className={styles.emptyState}>
        <strong>Nenhuma moto foi liberada</strong>
        <p>
          O administrador ainda não vinculou modelos ao seu
          catálogo. Quando houver motos liberadas, elas aparecerão
          aqui para você escolher quais serão publicadas.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.manager}>
      <div className={styles.hero}>
        <div>
          <span>Controle do catálogo</span>
          <h2>Motos visíveis para seus clientes</h2>
          <p>
            Você pode mostrar ou ocultar somente os modelos já
            liberados pelo administrador. Preços e informações das
            motos continuam centralizados.
          </p>
        </div>

        <div className={styles.summary}>
          <div>
            <strong>{visibleCount}</strong>
            <span>visíveis</span>
          </div>

          <div>
            <strong>{hiddenCount}</strong>
            <span>ocultas</span>
          </div>

          <small>
            {motorcycles.length} liberada
            {motorcycles.length === 1 ? "" : "s"} pelo administrador
          </small>
        </div>
      </div>

      <div className={styles.securityNotice}>
        <span>✓</span>
        <div>
          <strong>Separação de permissões ativa</strong>
          <p>
            Ocultar uma moto não remove a autorização administrativa.
            Você poderá reativá-la depois nesta mesma tela.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Pesquisar modelo ou categoria"
            aria-label="Pesquisar motos"
          />
        </label>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          aria-label="Filtrar por categoria"
        >
          <option value="todas">Todas as categorias</option>
          {categories.map((categoryName) => (
            <option
              value={categoryName}
              key={categoryName}
            >
              {categoryName}
            </option>
          ))}
        </select>

        <div className={styles.bulkActions}>
          <button
            type="button"
            onClick={showFiltered}
          >
            Mostrar filtradas
          </button>

          <button
            type="button"
            onClick={hideFiltered}
          >
            Ocultar filtradas
          </button>
        </div>
      </div>

      {success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.grid}>
        {filteredMotorcycles.map((motorcycle) => {
          const selected = selectedIds.has(motorcycle.id);

          return (
            <article
              className={`${styles.card} ${
                selected ? styles.cardVisible : styles.cardHidden
              }`}
              key={motorcycle.id}
            >
              <button
                className={styles.visibilityToggle}
                type="button"
                role="switch"
                aria-checked={selected}
                onClick={() =>
                  toggleMotorcycle(motorcycle.id)
                }
              >
                <span />
                {selected ? "Visível" : "Oculta"}
              </button>

              <div className={styles.image}>
                <img
                  src={motorcycle.imageUrl}
                  alt={motorcycle.name}
                />

                {motorcycle.badge ? (
                  <span>{motorcycle.badge}</span>
                ) : null}
              </div>

              <div className={styles.info}>
                <small>{motorcycle.category}</small>
                <h3>{motorcycle.name}</h3>

                <p>
                  {selected
                    ? "Será exibida no catálogo público."
                    : "Continuará liberada, mas não aparecerá ao cliente."}
                </p>
              </div>

              {savedIds.has(motorcycle.id) ? (
                <Link
                  href={`/${profile.slug}/moto/${motorcycle.slug}`}
                  target="_blank"
                >
                  Abrir página ↗
                </Link>
              ) : (
                <span className={styles.hiddenLabel}>
                  Página pública oculta
                </span>
              )}
            </article>
          );
        })}
      </div>

      {filteredMotorcycles.length === 0 ? (
        <div className={styles.noResults}>
          <strong>Nenhuma moto encontrada</strong>
          <p>Altere a pesquisa ou o filtro de categoria.</p>
        </div>
      ) : null}

      <div className={styles.footer}>
        <span>
          As mudanças entram no catálogo depois que você clicar em
          salvar.
        </span>

        <div>
          <button
            type="button"
            onClick={discardChanges}
            disabled={!hasChanges || saving}
          >
            Descartar alterações
          </button>

          <button
            className={styles.saveButton}
            type="button"
            onClick={() => void saveVisibility()}
            disabled={!hasChanges || saving}
          >
            {saving
              ? "Salvando..."
              : `Salvar ${visibleCount} moto${
                  visibleCount === 1 ? "" : "s"
                }`}
          </button>
        </div>
      </div>
    </section>
  );
}
