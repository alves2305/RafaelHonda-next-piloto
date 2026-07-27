"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

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
};

type PlanRow = {
  moto_id: string;
  ativo: boolean;
};

type MotorcycleView = MotorcycleRow & {
  clientsCount: number;
  plansCount: number;
};

type StatusFilter = "todas" | "ativas" | "inativas";

export default function AdminMotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<MotorcycleView[]>([]);
  const [initialOrder, setInitialOrder] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadMotorcycles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: relationData, error: relationError },
        { data: planData, error: planError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,slug,nome,categoria,imagem_url,selo,ativo,ordem")
          .order("ordem")
          .order("nome"),
        supabase.from("cliente_motos").select("moto_id,ativo"),
        supabase.from("planos_consorcio").select("moto_id,ativo"),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (relationError) {
        throw relationError;
      }

      if (planError) {
        throw planError;
      }

      const clientCountByMotorcycle = new Map<string, number>();
      const planCountByMotorcycle = new Map<string, number>();

      for (const relation of (relationData ?? []) as ClientMotorcycleRow[]) {
        if (!relation.ativo) {
          continue;
        }

        clientCountByMotorcycle.set(
          relation.moto_id,
          (clientCountByMotorcycle.get(relation.moto_id) ?? 0) + 1,
        );
      }

      for (const plan of (planData ?? []) as PlanRow[]) {
        if (!plan.ativo) {
          continue;
        }

        planCountByMotorcycle.set(
          plan.moto_id,
          (planCountByMotorcycle.get(plan.moto_id) ?? 0) + 1,
        );
      }

      const nextMotorcycles = ((motorcycleData ?? []) as MotorcycleRow[]).map(
        (motorcycle) => ({
          ...motorcycle,
          clientsCount: clientCountByMotorcycle.get(motorcycle.id) ?? 0,
          plansCount: planCountByMotorcycle.get(motorcycle.id) ?? 0,
        }),
      );

      setMotorcycles(nextMotorcycles);
      setInitialOrder(nextMotorcycles.map((motorcycle) => motorcycle.id));
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar as motos. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMotorcycles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMotorcycles]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const filteredMotorcycles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return motorcycles.filter((motorcycle) => {
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

      const matchesStatus =
        statusFilter === "todas" ||
        (statusFilter === "ativas" && motorcycle.ativo) ||
        (statusFilter === "inativas" && !motorcycle.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [motorcycles, search, statusFilter]);

  const activeCount = motorcycles.filter((motorcycle) => motorcycle.ativo).length;
  const inactiveCount = motorcycles.length - activeCount;

  const currentOrder = motorcycles.map((motorcycle) => motorcycle.id);
  const hasOrderChanges =
    currentOrder.length !== initialOrder.length ||
    currentOrder.some((id, index) => id !== initialOrder[index]);

  const canReorder = !search.trim() && statusFilter === "todas";

  function moveMotorcycle(index: number, direction: -1 | 1) {
    if (!canReorder) {
      return;
    }

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= motorcycles.length) {
      return;
    }

    setMotorcycles((currentMotorcycles) => {
      const nextMotorcycles = [...currentMotorcycles];
      const [movedMotorcycle] = nextMotorcycles.splice(index, 1);
      nextMotorcycles.splice(nextIndex, 0, movedMotorcycle);
      return nextMotorcycles;
    });

    setFeedback("");
    setError("");
  }

  async function saveOrder() {
    if (!hasOrderChanges) {
      return;
    }

    setSavingOrder(true);
    setError("");
    setFeedback("");

    try {
      const supabase = getAdminSupabaseClient();

      for (const [index, motorcycle] of motorcycles.entries()) {
        const { error: updateError } = await supabase
          .from("motos")
          .update({ ordem: index + 1 })
          .eq("id", motorcycle.id);

        if (updateError) {
          throw updateError;
        }
      }

      setMotorcycles((currentMotorcycles) =>
        currentMotorcycles.map((motorcycle, index) => ({
          ...motorcycle,
          ordem: index + 1,
        })),
      );

      setInitialOrder(motorcycles.map((motorcycle) => motorcycle.id));
      setFeedback("Ordem central das motos atualizada com sucesso.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        "Não foi possível salvar a ordem. Confirme sua permissão administrativa.",
      );
    } finally {
      setSavingOrder(false);
    }
  }

  function discardOrder() {
    if (!hasOrderChanges) {
      return;
    }

    const orderMap = new Map(
      initialOrder.map((motorcycleId, index) => [motorcycleId, index]),
    );

    setMotorcycles((currentMotorcycles) =>
      [...currentMotorcycles].sort(
        (a, b) =>
          (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      ),
    );

    setFeedback("");
    setError("");
  }

  async function toggleStatus(motorcycle: MotorcycleView) {
    const nextStatus = !motorcycle.ativo;

    if (
      !nextStatus &&
      !window.confirm(
        `Desativar a ${motorcycle.nome}? Ela deixará de aparecer nos catálogos de todos os clientes até ser reativada.`,
      )
    ) {
      return;
    }

    setUpdatingId(motorcycle.id);
    setError("");
    setFeedback("");

    try {
      const supabase = getAdminSupabaseClient();
      const { data, error: updateError } = await supabase
        .from("motos")
        .update({ ativo: nextStatus })
        .eq("id", motorcycle.id)
        .select("id,ativo")
        .single<{ id: string; ativo: boolean }>();

      if (updateError) {
        throw updateError;
      }

      setMotorcycles((currentMotorcycles) =>
        currentMotorcycles.map((currentMotorcycle) =>
          currentMotorcycle.id === data.id
            ? { ...currentMotorcycle, ativo: data.ativo }
            : currentMotorcycle,
        ),
      );

      setFeedback(
        nextStatus
          ? `${motorcycle.nome} foi reativada.`
          : `${motorcycle.nome} foi desativada para todos os catálogos.`,
      );
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível alterar o status da moto. Confirme sua permissão administrativa.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminShell
      title="Motos"
      description="Gerencie os modelos do catálogo centralizado."
    >
      <section className={styles.motorcyclesAdminHero}>
        <div>
          <span className={styles.sectionEyebrow}>Catálogo central</span>
          <h2>Modelos Honda</h2>
          <p>
            As alterações feitas aqui são compartilhadas por todos os
            vendedores que possuem a moto selecionada.
          </p>
        </div>

        <Link
          className={styles.primaryAdminButton}
          href="/admin/motos/nova"
        >
          <span aria-hidden="true">+</span>
          Nova moto
          <small>Cadastrar modelo</small>
        </Link>
      </section>

      <section
        className={styles.motorcycleAdminStats}
        aria-label="Resumo das motos"
      >
        <article>
          <span>Total</span>
          <strong>{motorcycles.length}</strong>
          <small>modelos cadastrados</small>
        </article>

        <article>
          <span>Ativas</span>
          <strong>{activeCount}</strong>
          <small>visíveis no catálogo central</small>
        </article>

        <article>
          <span>Inativas</span>
          <strong>{inactiveCount}</strong>
          <small>ocultas de todos os clientes</small>
        </article>
      </section>

      <section className={styles.motorcyclesAdminPanel}>
        <div className={styles.motorcyclesAdminToolbar}>
          <label className={styles.adminSearchField}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por moto, categoria ou endereço"
              aria-label="Pesquisar motos"
            />
          </label>

          <div className={styles.statusFilters} aria-label="Filtrar motos">
            {(
              [
                ["todas", "Todas"],
                ["ativas", "Ativas"],
                ["inativas", "Inativas"],
              ] as const
            ).map(([value, label]) => (
              <button
                className={
                  statusFilter === value ? styles.statusFilterActive : ""
                }
                type="button"
                key={value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.motorcycleOrderActions}>
            <button
              type="button"
              onClick={discardOrder}
              disabled={!hasOrderChanges || savingOrder}
            >
              Descartar ordem
            </button>

            <button
              type="button"
              className={styles.saveMotorcycleOrderButton}
              onClick={() => void saveOrder()}
              disabled={!hasOrderChanges || savingOrder}
            >
              {savingOrder ? "Salvando..." : "Salvar ordem"}
            </button>
          </div>
        </div>

        {!canReorder ? (
          <p className={styles.motorcycleOrderNotice}>
            Limpe a pesquisa e selecione “Todas” para reorganizar os modelos.
          </p>
        ) : null}

        {feedback ? (
          <p className={styles.adminSuccessMessage} role="status">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <div className={styles.adminErrorBox} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadMotorcycles()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.adminListLoading}>
            <span />
            <p>Carregando motos...</p>
          </div>
        ) : filteredMotorcycles.length > 0 ? (
          <div className={styles.motorcycleAdminTable}>
            <div className={styles.motorcycleAdminTableHeader} aria-hidden="true">
              <span>Ordem</span>
              <span>Moto</span>
              <span>Utilização</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {filteredMotorcycles.map((motorcycle) => {
              const globalIndex = motorcycles.findIndex(
                (currentMotorcycle) => currentMotorcycle.id === motorcycle.id,
              );

              return (
                <article
                  className={styles.motorcycleAdminRow}
                  key={motorcycle.id}
                >
                  <div className={styles.motorcycleAdminOrder}>
                    <strong>{globalIndex + 1}</strong>

                    <div>
                      <button
                        type="button"
                        onClick={() => moveMotorcycle(globalIndex, -1)}
                        disabled={
                          !canReorder ||
                          globalIndex <= 0 ||
                          savingOrder
                        }
                        aria-label={`Mover ${motorcycle.nome} para cima`}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveMotorcycle(globalIndex, 1)}
                        disabled={
                          !canReorder ||
                          globalIndex >= motorcycles.length - 1 ||
                          savingOrder
                        }
                        aria-label={`Mover ${motorcycle.nome} para baixo`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div className={styles.motorcycleAdminIdentity}>
                    <Image
                      src={motorcycle.imagem_url}
                      alt={motorcycle.nome}
                      width={100}
                      height={74}
                      unoptimized
                    />

                    <div>
                      {motorcycle.selo ? <small>{motorcycle.selo}</small> : null}
                      <strong>{motorcycle.nome}</strong>
                      <span>{motorcycle.categoria}</span>
                    </div>
                  </div>

                  <div className={styles.motorcycleAdminUsage}>
                    <div>
                      <strong>{motorcycle.clientsCount}</strong>
                      <span>clientes</span>
                    </div>

                    <div>
                      <strong>{motorcycle.plansCount}</strong>
                      <span>planos ativos</span>
                    </div>
                  </div>

                  <span
                    className={
                      motorcycle.ativo
                        ? styles.clientStatusActive
                        : styles.clientStatusInactive
                    }
                  >
                    <i />
                    {motorcycle.ativo ? "Ativa" : "Inativa"}
                  </span>

                  <div className={styles.motorcycleAdminRowActions}>
                    <Link href={`/admin/motos/${motorcycle.id}`}>
                      Editar
                    </Link>

                    <Link
                      href={`/rafael/moto/${motorcycle.slug}`}
                      target="_blank"
                    >
                      Visualizar
                    </Link>

                    <button
                      type="button"
                      className={
                        motorcycle.ativo
                          ? styles.blockClientButton
                          : styles.activateClientButton
                      }
                      onClick={() => void toggleStatus(motorcycle)}
                      disabled={updatingId === motorcycle.id}
                    >
                      {updatingId === motorcycle.id
                        ? "Salvando..."
                        : motorcycle.ativo
                          ? "Desativar"
                          : "Reativar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.adminEmptyState}>
            <strong>Nenhuma moto encontrada.</strong>
            <p>Altere a pesquisa ou o filtro selecionado.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
