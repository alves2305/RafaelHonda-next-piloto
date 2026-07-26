import Image from "next/image";
import Link from "next/link";

import type { ClientProfile } from "@/lib/types";

export function SubpageHeader({
  client,
  backHref,
  backLabel = "Voltar ao catálogo",
}: {
  client: ClientProfile;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <header className="subpage-header">
      <Link className="back-link" href={backHref}>
        <span aria-hidden="true">←</span> {backLabel}
      </Link>

      <Link className="mini-brand" href={`/${client.slug}`}>
        {client.logoUrl ? (
          <Image
            src={client.logoUrl}
            alt=""
            width={110}
            height={44}
            unoptimized
          />
        ) : null}
        <span>{client.nome}</span>
      </Link>
    </header>
  );
}
