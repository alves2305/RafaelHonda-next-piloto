"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { normalizeSearch } from "@/lib/format";
import type { Motorcycle } from "@/lib/types";

type MotorcycleCatalogProps = {
  clientSlug: string;
  motorcycles: Motorcycle[];
  vendeConsorcio: boolean;
  vendeFinanciamento: boolean;
};

export function MotorcycleCatalog({
  clientSlug,
  motorcycles,
  vendeConsorcio,
  vendeFinanciamento,
}: MotorcycleCatalogProps) {
  const [query, setQuery] = useState("");

  const visibleMotorcycles = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return motorcycles.filter((motorcycle) =>
      normalizeSearch(motorcycle.nome).includes(normalizedQuery),
    );
  }, [motorcycles, query]);

  const catalogDescription =
    vendeConsorcio && vendeFinanciamento
      ? "Consulte detalhes, planos e simulação em um só lugar."
      : vendeConsorcio
        ? "Consulte os detalhes e os planos de consórcio disponíveis."
        : "Consulte os detalhes e solicite sua simulação de financiamento.";

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
                unoptimized
              />

              <div className="motorcycle-card-actions">
                <Link
                  className="button button-primary"
                  href={`/${clientSlug}/moto/${motorcycle.slug}`}
                >
                  Detalhes da moto
                </Link>

                {vendeConsorcio ? (
                  <Link
                    className="button button-light"
                    href={`/${clientSlug}/consorcio/${motorcycle.slug}`}
                  >
                    Planos de consórcio
                  </Link>
                ) : null}

                {vendeFinanciamento && motorcycle.financiamento ? (
                  <Link
                    className={
                      vendeConsorcio ? "text-link" : "button button-light"
                    }
                    href={`/${clientSlug}/financiamento/${motorcycle.slug}`}
                  >
                    Simular financiamento{" "}
                    {vendeConsorcio ? (
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
