"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "@/app/admin/admin.module.css";

type MotorcycleRow = {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
};

type PlanRow = {
  id: string;
  moto_id: string;
  parcelas: number;
  valor_parcela: number | string;
  destaque: boolean;
  ativo: boolean;
};

type MotorcycleView = MotorcycleRow & {
  plansCount: number;
  activePlansCount: number;
  lowestInstallment: number | null;
};

type StatusFilter = "todas" | "ativas" | "inativas";

function parseNumericValue(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function AdminPlansPage() {
  const [motorcycles, setMotorcycles] = useState<MotorcycleView[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: planData, error: planError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,nome,slug,categoria,imagem_url,ativo,ordem")
          .order("ordem")
          .order("nome"),
        supabase
          .from("planos_consorcio")
          .select("id,moto_id,parcelas,valor_parcela,destaque,ativo"),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (planError) {
        throw planError;
      }

      const plans = (planData ?? []) as PlanRow[];
      const plansByMotorcycle = new Map<string, PlanRow[]>();

      for (const plan of plans) {
        const currentPlans = plansByMotorcycle.get(plan.moto_id) ?? [];
        currentPlans.push(plan);
        plansByMotorcycle.set(plan.moto_id, currentPlans);
      }

      const nextMotorcycles = ((motorcycleData ?? []) as MotorcycleRow[]).map(
        (motorcycle) => {
          const motorcyclePlans = plansByMotorcycle.get(motorcycle.id) ?? [];
          const activePlans = motorcyclePlans.filter((plan) => plan.ativo);

          const lowestInstallment =
            activePlans.length > 0
              ? Math.min(
                  ...activePlans.map((plan) =>
                    parseNumericValue(plan.valor_parcela),
                  ),
                )
              : null;

          return {
            ...motorcycle,
            plansCount: motorcyclePlans.length,
            activePlansCount: activePlans.length,
            lowestInstallment,
          };
        },
      );

      setMotorcycles(nextMotorcycles);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar as tabelas de planos. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlans]);

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

  const plansTotal = motorcycles.reduce(
    (total, motorcycle) => total + motorcycle.plansCount,
    0,
  );

  const activePlansTotal = motorcycles.reduce(
    (total, motorcycle) => total + motorcycle.activePlansCount,
    0,
  );

  const motorcyclesWithoutPlans = motorcycles.filter(
    (motorcycle) => motorcycle.plansCount === 0,
  ).length;

  return (
    <AdminShell
      title="Planos"
      description="Atualize as parcelas de consórcio em uma única tabela central."
    >
      <section className={styles.plansHero}>
        <div>
          <span className={styles.sectionEyebrow}>Valores centralizados</span>
          <h2>Tabelas de consórcio</h2>
          <p>
            Escolha uma moto e altere seus planos. A atualização será usada
            automaticamente por todos os vendedores que possuem esse modelo.
          </p>
        </div>

        <div className={styles.centralUpdateBadge}>
          <span>Uma alteração</span>
          <strong>Todos os clientes</strong>
          <small>Sem repetir tabela por vendedor</small>
        </div>
      </section>

      <section className={styles.planStatsGrid} aria-label="Resumo dos planos">
        <article>
          <span>Motos</span>
          <strong>{motorcycles.length}</strong>
          <small>modelos cadastrados</small>
        </article>

        <article>
          <span>Planos</span>
          <strong>{plansTotal}</strong>
          <small>{activePlansTotal} planos ativos</small>
        </article>

        <article>
          <span>Sem tabela</span>
          <strong>{motorcyclesWithoutPlans}</strong>
          <small>motos sem planos cadastrados</small>
        </article>
      </section>

      <section className={styles.plansPanel}>
        <div className={styles.clientsToolbar}>
          <label className={styles.adminSearchField}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar moto, categoria ou endereço"
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
        </div>

        {error ? (
          <div className={styles.adminErrorBox} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadPlans()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.adminListLoading}>
            <span />
            <p>Carregando tabelas...</p>
          </div>
        ) : filteredMotorcycles.length > 0 ? (
          <div className={styles.planMotorcycleGrid}>
            {filteredMotorcycles.map((motorcycle) => (
              <article
                className={`${styles.planMotorcycleCard} ${
                  !motorcycle.ativo
                    ? styles.planMotorcycleCardInactive
                    : ""
                }`}
                key={motorcycle.id}
              >
                <div className={styles.planMotorcycleImage}>
                  <Image
                    src={motorcycle.imagem_url}
                    alt={motorcycle.nome}
                    width={280}
                    height={180}
                    unoptimized
                  />

                  <span
                    className={
                      motorcycle.ativo
                        ? styles.planMotoActiveBadge
                        : styles.planMotoInactiveBadge
                    }
                  >
                    {motorcycle.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className={styles.planMotorcycleContent}>
                  <span>{motorcycle.categoria}</span>
                  <h3>{motorcycle.nome}</h3>

                  <div className={styles.planMotorcycleNumbers}>
                    <div>
                      <strong>{motorcycle.activePlansCount}</strong>
                      <span>planos ativos</span>
                    </div>

                    <div>
                      <strong>
                        {motorcycle.lowestInstallment !== null
                          ? formatCurrency(motorcycle.lowestInstallment)
                          : "—"}
                      </strong>
                      <span>menor parcela</span>
                    </div>
                  </div>

                  <Link href={`/admin/planos/${motorcycle.id}`}>
                    Editar tabela
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.adminEmptyState}>
            <strong>Nenhuma moto encontrada.</strong>
            <p>Altere a busca ou o filtro selecionado.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
