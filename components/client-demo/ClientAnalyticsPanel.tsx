"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useClientAccess } from "@/components/client-demo/ClientAccessGuard";
import { getClientSupabaseClient } from "@/lib/client-supabase";

import styles from "./ClientAnalyticsPanel.module.css";

type PeriodDays = 7 | 30 | 90 | 0;

type MotorcycleMetric = {
  motorcycleId: string;
  name: string;
  slug: string;
  imageUrl: string;
  views: number;
  uniqueVisitors: number;
};

type CatalogMetrics = {
  clientId: string;
  periodDays: number;
  totalVisits: number;
  uniqueVisitors: number;
  motorcycleViews: number;
  topMotorcycle: MotorcycleMetric | null;
  ranking: MotorcycleMetric[];
  lastVisitAt: string | null;
};

const PERIODS: Array<{
  value: PeriodDays;
  label: string;
}> = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 0, label: "Todo período" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function periodDescription(period: PeriodDays) {
  if (period === 0) {
    return "desde a ativação das métricas";
  }

  return `nos últimos ${period} dias`;
}

function normalizeMetrics(
  value: unknown,
): CatalogMetrics {
  const data =
    typeof value === "object" && value !== null
      ? (value as Partial<CatalogMetrics>)
      : {};

  const ranking = Array.isArray(data.ranking)
    ? data.ranking
    : [];

  return {
    clientId:
      typeof data.clientId === "string"
        ? data.clientId
        : "",
    periodDays:
      typeof data.periodDays === "number"
        ? data.periodDays
        : 30,
    totalVisits:
      typeof data.totalVisits === "number"
        ? data.totalVisits
        : 0,
    uniqueVisitors:
      typeof data.uniqueVisitors === "number"
        ? data.uniqueVisitors
        : 0,
    motorcycleViews:
      typeof data.motorcycleViews === "number"
        ? data.motorcycleViews
        : 0,
    topMotorcycle:
      data.topMotorcycle &&
      typeof data.topMotorcycle === "object"
        ? (data.topMotorcycle as MotorcycleMetric)
        : null,
    ranking,
    lastVisitAt:
      typeof data.lastVisitAt === "string"
        ? data.lastVisitAt
        : null,
  };
}

export function ClientAnalyticsPanel() {
  const access = useClientAccess();
  const [period, setPeriod] =
    useState<PeriodDays>(30);
  const [metrics, setMetrics] =
    useState<CatalogMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const description = useMemo(
    () => periodDescription(period),
    [period],
  );

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getClientSupabaseClient();
      const { data, error: metricsError } =
        await supabase.rpc(
          "minhas_metricas_catalogo",
          {
            p_dias: period,
          },
        );

      if (metricsError) {
        throw metricsError;
      }

      const nextMetrics = normalizeMetrics(data);

      if (
        nextMetrics.clientId &&
        nextMetrics.clientId !== access.clientId
      ) {
        throw new Error(
          "As métricas retornadas não pertencem ao catálogo autenticado.",
        );
      }

      setMetrics(nextMetrics);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar as métricas. Confirme se o SQL da Entrega 19.5 foi executado.",
      );
    } finally {
      setLoading(false);
    }
  }, [access.clientId, period]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMetrics();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMetrics]);

  const topMotorcycle =
    metrics?.topMotorcycle ?? null;

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span>Desempenho real</span>
          <h2>Visitas e motos mais acessadas</h2>
          <p>
            Dados anônimos autorizados pelos visitantes,
            separados exclusivamente para o seu catálogo.
          </p>
        </div>

        <div
          className={styles.periods}
          aria-label="Período das métricas"
        >
          {PERIODS.map((option) => (
            <button
              className={
                period === option.value
                  ? styles.periodActive
                  : ""
              }
              type="button"
              key={option.value}
              onClick={() => setPeriod(option.value)}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <span />
          <p>Carregando métricas...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <strong>Métricas indisponíveis</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadMetrics()}
          >
            Tentar novamente
          </button>
        </div>
      ) : metrics ? (
        <>
          <div className={styles.cards}>
            <article>
              <small>Visitas ao catálogo</small>
              <strong>
                {formatNumber(metrics.totalVisits)}
              </strong>
              <p>{description}</p>
            </article>

            <article>
              <small>Visitantes únicos</small>
              <strong>
                {formatNumber(metrics.uniqueVisitors)}
              </strong>
              <p>Identificadores anônimos autorizados</p>
            </article>

            <article className={styles.topCard}>
              <small>Moto mais acessada</small>

              {topMotorcycle ? (
                <div>
                  <img
                    src={topMotorcycle.imageUrl}
                    alt={topMotorcycle.name}
                  />

                  <span>
                    <strong>{topMotorcycle.name}</strong>
                    <p>
                      {formatNumber(
                        topMotorcycle.views,
                      )}{" "}
                      acessos
                    </p>
                  </span>
                </div>
              ) : (
                <>
                  <strong>Ainda sem acessos</strong>
                  <p>
                    O ranking aparecerá após os primeiros
                    visitantes autorizarem as métricas.
                  </p>
                </>
              )}
            </article>
          </div>

          <div className={styles.details}>
            <div className={styles.rankingHeading}>
              <div>
                <span>Ranking de interesse</span>
                <h3>Motos mais acessadas</h3>
              </div>

              <small>
                {formatNumber(metrics.motorcycleViews)}{" "}
                acessos a motos {description}
              </small>
            </div>

            {metrics.ranking.length > 0 ? (
              <div className={styles.ranking}>
                {metrics.ranking.map(
                  (motorcycle, index) => (
                    <article
                      key={motorcycle.motorcycleId}
                    >
                      <span className={styles.position}>
                        {index + 1}
                      </span>

                      <img
                        src={motorcycle.imageUrl}
                        alt={motorcycle.name}
                      />

                      <div>
                        <strong>{motorcycle.name}</strong>
                        <p>
                          {formatNumber(
                            motorcycle.uniqueVisitors,
                          )}{" "}
                          visitantes interessados
                        </p>
                      </div>

                      <span className={styles.views}>
                        <strong>
                          {formatNumber(
                            motorcycle.views,
                          )}
                        </strong>
                        <small>acessos</small>
                      </span>

                      <Link
                        href={`/${access.clientSlug}/moto/${motorcycle.slug}`}
                        target="_blank"
                      >
                        Abrir ↗
                      </Link>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className={styles.empty}>
                <strong>
                  O ranking ainda está vazio
                </strong>
                <p>
                  Abra o catálogo em uma janela anônima,
                  permita as métricas e visite uma moto
                  para realizar o primeiro teste.
                </p>
              </div>
            )}
          </div>

          <p className={styles.privacy}>
            Nenhum nome, telefone, CPF ou conteúdo de
            mensagem aparece neste painel. Uma visita é
            contada por sessão e cada moto é contada uma
            vez por sessão.
          </p>
        </>
      ) : null}
    </section>
  );
}
