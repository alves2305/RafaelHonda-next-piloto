"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { normalizeSearch } from "@/lib/format";
import type { Motorcycle } from "@/lib/types";

export function MotorcycleCatalog({
  clientSlug,
  motorcycles,
}: {
  clientSlug: string;
  motorcycles: Motorcycle[];
}) {
  const [query, setQuery] = useState("");

  const visibleMotorcycles = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return motorcycles.filter((motorcycle) =>
      normalizeSearch(motorcycle.nome).includes(normalizedQuery),
    );
  }, [motorcycles, query]);

  return (
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="section-heading">
        <p className="eyebrow">Catálogo atualizado</p>
        <h2 id="catalog-title">Escolha sua próxima Honda</h2>
        <p>Consulte detalhes, planos e simulação em um só lugar.</p>
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
                <Link
                  className="button button-light"
                  href={`/${clientSlug}/consorcio/${motorcycle.slug}`}
                >
                  Planos de consórcio
                </Link>
                <Link
                  className="text-link"
                  href={`/${clientSlug}/financiamento/${motorcycle.slug}`}
                >
                  Simular financiamento <span aria-hidden="true">→</span>
                </Link>
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
