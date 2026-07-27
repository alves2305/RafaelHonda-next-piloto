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
  ativo: boolean;
  ordem: number;
};

type FinancingRow = {
  id: string;
  moto_id: string;
  titulo: string;
  descricao: string;
  observacao: string;
  ativo: boolean;
};

type MotorcycleFinancingView = MotorcycleRow & {
  financing: FinancingRow | null;
};

type StatusFilter = "todos" | "ativos" | "inativos" | "sem-cadastro";

export default function AdminFinancingPage() {
  const [motorcycles, setMotorcycles] = useState<MotorcycleFinancingView[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFinancing = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        { data: motorcycleData, error: motorcycleError },
        { data: financingData, error: financingError },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,slug,nome,categoria,imagem_url,ativo,ordem")
          .order("ordem")
          .order("nome"),
        supabase
          .from("informacoes_financiamento")
          .select("id,moto_id,titulo,descricao,observacao,ativo"),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (financingError) {
        throw financingError;
      }

      const financingByMotorcycle = new Map(
        ((financingData ?? []) as FinancingRow[]).map((financing) => [
          financing.moto_id,
          financing,
        ]),
      );

      setMotorcycles(
        ((motorcycleData ?? []) as MotorcycleRow[]).map((motorcycle) => ({
          ...motorcycle,
          financing: financingByMotorcycle.get(motorcycle.id) ?? null,
        })),
      );
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar os financiamentos. Verifique sua conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinancing();
  }, [loadFinancing]);

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
          .includes(normalizedSearch) ||
        motorcycle.financing?.titulo
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && motorcycle.financing?.ativo === true) ||
        (statusFilter === "inativos" &&
          motorcycle.financing !== null &&
          motorcycle.financing.ativo === false) ||
        (statusFilter === "sem-cadastro" && motorcycle.financing === null);

      return matchesSearch && matchesStatus;
    });
  }, [motorcycles, search, statusFilter]);

  const activeCount = motorcycles.filter(
    (motorcycle) => motorcycle.financing?.ativo,
  ).length;

  const inactiveCount = motorcycles.filter(
    (motorcycle) =>
      motorcycle.financing !== null && !motorcycle.financing.ativo,
  ).length;

  const missingCount = motorcycles.filter(
    (motorcycle) => motorcycle.financing === null,
  ).length;

  return (
    <AdminShell
      title="Financiamentos"
      description="Gerencie as informações de simulação de cada moto."
    >
      <section className={styles.financingAdminHero}>
        <div>
          <span className={styles.sectionEyebrow}>Conteúdo centralizado</span>
          <h2>Simulações de financiamento</h2>
          <p>
            Edite uma única informação por moto. Todos os vendedores que
            oferecem financiamento passam a utilizar o mesmo conteúdo.
          </p>
        </div>

        <div className={styles.financingSharedBadge}>
          <span>Atualização central</span>
          <strong>Uma moto, todos os vendedores</strong>
          <small>A modalidade individual do cliente continua respeitada</small>
        </div>
      </section>

      <section
        className={styles.financingAdminStats}
        aria-label="Resumo dos financiamentos"
      >
        <article>
          <span>Ativos</span>
          <strong>{activeCount}</strong>
          <small>motos com simulação disponível</small>
        </article>

        <article>
          <span>Inativos</span>
          <strong>{inactiveCount}</strong>
          <small>informações guardadas e ocultas</small>
        </article>

        <article>
          <span>Sem cadastro</span>
          <strong>{missingCount}</strong>
          <small>motos aguardando configuração</small>
        </article>
      </section>

      <section className={styles.financingAdminPanel}>
        <div className={styles.financingAdminToolbar}>
          <label className={styles.adminSearchField}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar moto, categoria ou título"
              aria-label="Pesquisar financiamentos"
            />
          </label>

          <div className={styles.financingStatusFilters}>
            {(
              [
                ["todos", "Todos"],
                ["ativos", "Ativos"],
                ["inativos", "Inativos"],
                ["sem-cadastro", "Sem cadastro"],
              ] as const
            ).map(([value, label]) => (
              <button
                className={
                  statusFilter === value
                    ? styles.financingStatusFilterActive
                    : ""
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
            <button type="button" onClick={() => void loadFinancing()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.adminListLoading}>
            <span />
            <p>Carregando financiamentos...</p>
          </div>
        ) : filteredMotorcycles.length > 0 ? (
          <div className={styles.financingMotorcycleGrid}>
            {filteredMotorcycles.map((motorcycle) => {
              const financing = motorcycle.financing;

              return (
                <article
                  className={`${styles.financingMotorcycleCard} ${
                    !motorcycle.ativo
                      ? styles.financingMotorcycleCardDisabled
                      : ""
                  }`}
                  key={motorcycle.id}
                >
                  <div className={styles.financingMotorcycleImage}>
                    <Image
                      src={motorcycle.imagem_url}
                      alt={motorcycle.nome}
                      width={280}
                      height={180}
                      unoptimized
                    />

                    <span
                      className={
                        financing?.ativo
                          ? styles.financingActiveBadge
                          : financing
                            ? styles.financingInactiveBadge
                            : styles.financingMissingBadge
                      }
                    >
                      {financing?.ativo
                        ? "Ativo"
                        : financing
                          ? "Inativo"
                          : "Sem cadastro"}
                    </span>
                  </div>

                  <div className={styles.financingMotorcycleContent}>
                    <span>{motorcycle.categoria}</span>
                    <h3>{motorcycle.nome}</h3>

                    <strong>
                      {financing?.titulo ?? "Informação ainda não cadastrada"}
                    </strong>

                    <p>
                      {financing?.descricao ??
                        "Cadastre o texto que será apresentado na página de simulação."}
                    </p>

                    <div className={styles.financingMotorcycleActions}>
                      <Link href={`/admin/financiamentos/${motorcycle.id}`}>
                        {financing ? "Editar financiamento" : "Configurar"}
                        <span aria-hidden="true">→</span>
                      </Link>

                      {financing?.ativo && motorcycle.ativo ? (
                        <Link
                          href={`/rafael/financiamento/${motorcycle.slug}`}
                          target="_blank"
                        >
                          Visualizar ↗
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
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
