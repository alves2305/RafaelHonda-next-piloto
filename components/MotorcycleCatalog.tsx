"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { normalizeSearch } from "@/lib/format";
import { canOptimizePublicImage } from "@/lib/public-image";

export type MotorcycleCatalogItem = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagemUrl: string;
  hasConsortium: boolean;
  hasFinancing: boolean;
};

type MotorcycleCatalogProps = {
  clientSlug: string;
  motorcycles: MotorcycleCatalogItem[];
};

export function MotorcycleCatalog({
  clientSlug,
  motorcycles,
}: MotorcycleCatalogProps) {
  const [query, setQuery] = useState("");

  const visibleMotorcycles = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return motorcycles.filter((motorcycle) =>
      normalizeSearch(motorcycle.nome).includes(normalizedQuery),
    );
  }, [motorcycles, query]);

  const hasAnyConsortium = motorcycles.some(
    (motorcycle) => motorcycle.hasConsortium,
  );
  const hasAnyFinancing = motorcycles.some(
    (motorcycle) => motorcycle.hasFinancing,
  );

  const catalogDescription =
    hasAnyConsortium && hasAnyFinancing
      ? "Consulte detalhes, planos e simulação em um só lugar."
      : hasAnyConsortium
        ? "Consulte os detalhes e os planos de consórcio disponíveis."
        : hasAnyFinancing
          ? "Consulte os detalhes e solicite sua simulação de financiamento."
          : "Consulte os detalhes dos modelos disponíveis.";

  return (
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="section-heading">
        <p className="eyebrow">Catálogo atualizado</p>
        <h2 id="catalog-title">Escolha sua próxima Honda</h2>
        <p>{catalogDescription}</p>
      </div>

      <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Pesquisar moto</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Qual moto você está procurando?"
        />
      </label>

      {visibleMotorcycles.length > 0 ? (
        <div className="motorcycle-grid">
          {visibleMotorcycles.map((motorcycle) => (
            <article className="motorcycle-card" key={motorcycle.id}>
              <div className="motorcycle-card-heading">
                <p>{motorcycle.categoria.split(" • ")[0]}</p>
                <h3>{motorcycle.nome}</h3>
              </div>

              <Image
                className="motorcycle-card-image"
                src={motorcycle.imagemUrl}
                alt={motorcycle.nome}
                width={560}
                height={340}
                sizes="(max-width: 700px) 88vw, (max-width: 1180px) 44vw, 520px"
                unoptimized={!canOptimizePublicImage(motorcycle.imagemUrl)}
              />

              <div className="motorcycle-card-actions">
                <Link
                  className="button button-primary"
                  href={`/${clientSlug}/moto/${motorcycle.slug}`}
                  prefetch={false}
                >
                  Detalhes da moto
                </Link>

                {motorcycle.hasConsortium ? (
                  <Link
                    className="button button-light"
                    href={`/${clientSlug}/consorcio/${motorcycle.slug}`}
                    prefetch={false}
                  >
                    Planos de consórcio
                  </Link>
                ) : null}

                {motorcycle.hasFinancing ? (
                  <Link
                    className={
                      motorcycle.hasConsortium
                        ? "text-link"
                        : "button button-light"
                    }
                    href={`/${clientSlug}/financiamento/${motorcycle.slug}`}
                    prefetch={false}
                  >
                    Simular financiamento{" "}
                    {motorcycle.hasConsortium ? (
                      <span aria-hidden="true">→</span>
                    ) : null}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhuma moto encontrada.</strong>
          <p>Tente pesquisar por outro nome ou modelo.</p>
        </div>
      )}
    </section>
  );
}
