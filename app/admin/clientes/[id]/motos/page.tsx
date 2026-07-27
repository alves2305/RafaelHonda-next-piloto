"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type ClientData = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
};

type MotorcycleRow = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagem_url: string;
  selo: string | null;
  ativo: boolean;
  ordem: number;
};

type ClientMotorcycleRow = {
  moto_id: string;
  ativo: boolean;
  ordem: number;
};

type CategoryFilter = "todas" | string;

function normalizeCategory(value: string) {
  return value
    .split("•")[0]
    ?.trim() || "Outras";
}

export default function ClientMotorcyclesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<ClientData | null>(null);
  const [motorcycles, setMotorcycles] = useState<MotorcycleRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("todas");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: clientData, error: clientError },
        { data: motorcycleData, error: motorcycleError },
        { data: relationData, error: relationError },
      ] = await Promise.all([
        supabase
          .from("clientes")
          .select("id,nome,slug,ativo")
          .eq("id", params.id)
          .maybeSingle<ClientData>(),
        supabase
          .from("motos")
          .select("id,slug,nome,categoria,imagem_url,selo,ativo,ordem")
          .order("ordem")
          .order("nome"),
        supabase
          .from("cliente_motos")
          .select("moto_id,ativo,ordem")
          .eq("cliente_id", params.id),
      ]);

      if (clientError) {
        throw clientError;
      }

      if (!clientData) {
        setError("Cliente não encontrado.");
        return;
      }

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (relationError) {
        throw relationError;
      }

      const relations = (relationData ?? []) as ClientMotorcycleRow[];
      const activeIds = new Set(
        relations
          .filter((relation) => relation.ativo)
          .map((relation) => relation.moto_id),
      );

      setClient(clientData);
      setMotorcycles((motorcycleData ?? []) as MotorcycleRow[]);
      setSelectedIds(activeIds);
      setInitialSelectedIds(new Set(activeIds));
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar as motos deste cliente. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      motorcycles.map((motorcycle) => normalizeCategory(motorcycle.categoria)),
    );

    return Array.from(uniqueCategories).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [motorcycles]);

  const filteredMotorcycles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return motorcycles.filter((motorcycle) => {
      const motorcycleCategory = normalizeCategory(motorcycle.categoria);

      const matchesSearch =
        !normalizedSearch ||
        motorcycle.nome
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        motorcycle.slug
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        motorcycle.categoria
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesCategory =
        category === "todas" || motorcycleCategory === category;

      return matchesSearch && matchesCategory;
    });
  }, [motorcycles, search, category]);

  const selectedCount = selectedIds.size;
  const activeMotorcyclesCount = motorcycles.filter(
    (motorcycle) => motorcycle.ativo,
  ).length;

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== initialSelectedIds.size) {
      return true;
    }

    return Array.from(selectedIds).some(
      (motorcycleId) => !initialSelectedIds.has(motorcycleId),
    );
  }, [selectedIds, initialSelectedIds]);

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

  function selectVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const motorcycle of filteredMotorcycles) {
        if (motorcycle.ativo) {
          next.add(motorcycle.id);
        }
      }

      return next;
    });

    setError("");
    setSuccess("");
  }

  function clearVisible() {
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

  function resetSelection() {
    if (
      hasChanges &&
      !window.confirm("Descartar as alterações na seleção das motos?")
    ) {
      return;
    }

    setSelectedIds(new Set(initialSelectedIds));
    setError("");
    setSuccess("");
  }

  async function saveSelection() {
    if (!client || !hasChanges) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const rows = motorcycles.map((motorcycle, index) => ({
        cliente_id: client.id,
        moto_id: motorcycle.id,
        ativo: selectedIds.has(motorcycle.id),
        ordem: motorcycle.ordem || index + 1,
      }));

      const { error: upsertError } = await supabase
        .from("cliente_motos")
        .upsert(rows, {
          onConflict: "cliente_id,moto_id",
        });

      if (upsertError) {
        throw upsertError;
      }

      const nextInitial = new Set(selectedIds);
      setInitialSelectedIds(nextInitial);
      setSuccess(
        `${selectedIds.size} moto${selectedIds.size === 1 ? "" : "s"} salva${
          selectedIds.size === 1 ? "" : "s"
        } no catálogo de ${client.nome}.`,
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar as motos. Confirme sua permissão administrativa e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
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
      title="Motos do cliente"
      description="Defina quais modelos aparecem no catálogo individual."
    >
      <div className={styles.editClientTopbar}>
        <button type="button" onClick={goBack}>
          ← Voltar para clientes
        </button>

        {client ? (
          <div className={styles.editClientTopbarActions}>
            <Link href={`/admin/clientes/${client.id}`}>
              Editar perfil
            </Link>

            <Link href={`/${client.slug}`} target="_blank">
              Abrir catálogo público ↗
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className={styles.adminListLoading}>
          <span />
          <p>Carregando catálogo...</p>
        </div>
      ) : error === "Cliente não encontrado." ? (
        <div className={styles.adminErrorBox}>
          <p>{error}</p>
          <Link href="/admin/clientes">Voltar para clientes</Link>
        </div>
      ) : client ? (
        <>
          <section className={styles.motorcycleManagerHero}>
            <div>
              <span className={styles.sectionEyebrow}>Catálogo individual</span>
              <h2>{client.nome}</h2>
              <p>
                Marque os modelos que este vendedor comercializa. As motos
                desmarcadas deixam de aparecer somente neste perfil.
              </p>
            </div>

            <div className={styles.motorcycleManagerSummary}>
              <span>Selecionadas</span>
              <strong>{selectedCount}</strong>
              <small>de {activeMotorcyclesCount} motos ativas</small>
            </div>
          </section>

          <section className={styles.motorcycleManagerPanel}>
            <div className={styles.motorcycleManagerToolbar}>
              <label className={styles.adminSearchField}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar modelo, categoria ou endereço"
                  aria-label="Pesquisar motos"
                />
              </label>

              <select
                className={styles.motorcycleCategorySelect}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filtrar motos por categoria"
              >
                <option value="todas">Todas as categorias</option>
                {categories.map((categoryName) => (
                  <option value={categoryName} key={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>

              <div className={styles.motorcycleBulkActions}>
                <button type="button" onClick={selectVisible}>
                  Marcar visíveis
                </button>

                <button type="button" onClick={clearVisible}>
                  Desmarcar visíveis
                </button>
              </div>
            </div>

            {success ? (
              <p className={styles.adminSuccessMessage} role="status">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className={styles.editClientError} role="alert">
                {error}
              </p>
            ) : null}

            {filteredMotorcycles.length > 0 ? (
              <div className={styles.motorcycleSelectionGrid}>
                {filteredMotorcycles.map((motorcycle) => {
                  const selected = selectedIds.has(motorcycle.id);

                  return (
                    <label
                      className={`${styles.motorcycleSelectionCard} ${
                        selected ? styles.motorcycleSelectionCardActive : ""
                      } ${
                        !motorcycle.ativo
                          ? styles.motorcycleSelectionCardDisabled
                          : ""
                      }`}
                      key={motorcycle.id}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMotorcycle(motorcycle.id)}
                        disabled={!motorcycle.ativo}
                      />

                      <span className={styles.motorcycleSelectionCheck}>
                        {selected ? "✓" : ""}
                      </span>

                      <div className={styles.motorcycleSelectionImage}>
                        <Image
                          src={motorcycle.imagem_url}
                          alt={motorcycle.nome}
                          width={230}
                          height={150}
                          unoptimized
                        />
                      </div>

                      <div className={styles.motorcycleSelectionInfo}>
                        <div>
                          <strong>{motorcycle.nome}</strong>
                          <span>{motorcycle.categoria}</span>
                        </div>

                        {motorcycle.selo ? (
                          <small>{motorcycle.selo}</small>
                        ) : null}

                        {!motorcycle.ativo ? (
                          <em>Modelo inativo no catálogo central</em>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className={styles.adminEmptyState}>
                <strong>Nenhuma moto encontrada.</strong>
                <p>Altere a pesquisa ou o filtro de categoria.</p>
              </div>
            )}

            <div className={styles.motorcycleManagerFooter}>
              <div>
                <strong>
                  {selectedCount} moto{selectedCount === 1 ? "" : "s"} selecionada
                  {selectedCount === 1 ? "" : "s"}
                </strong>
                <span>
                  {hasChanges
                    ? "Existem alterações ainda não salvas."
                    : "A seleção está atualizada."}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={resetSelection}
                  disabled={!hasChanges || saving}
                >
                  Descartar
                </button>

                <button
                  className={styles.saveClientButton}
                  type="button"
                  onClick={() => void saveSelection()}
                  disabled={!hasChanges || saving}
                >
                  {saving ? "Salvando..." : "Salvar motos"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
