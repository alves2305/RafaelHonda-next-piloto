import Image from "next/image";

import { createWhatsAppUrl } from "@/lib/format";
import type { ClientProfile } from "@/lib/types";

export function ProfileHeader({ client }: { client: ClientProfile }) {
  return (
    <header className="profile-header">
      <div className="brand-banner" aria-hidden="true" />

      <div className="profile-hero">
        <div className="profile-photo-area">
          <Image
            className="profile-photo profile-photo-mobile"
            src={client.fotoUrl}
            alt={`Foto de ${client.nome}`}
            width={240}
            height={240}
            priority
            unoptimized
          />

          <Image
            className="profile-photo profile-photo-desktop"
            src={client.fotoDesktopUrl ?? client.fotoUrl}
            alt={`Foto de ${client.nome}`}
            width={560}
            height={440}
            priority
            unoptimized
          />
        </div>

        <div className="profile-info">
          {client.logoUrl ? (
            <Image
              className="store-logo"
              src={client.logoUrl}
              alt="Logo da concessionária"
              width={230}
              height={90}
              unoptimized
            />
          ) : null}

          <p className="eyebrow">Especialista Honda</p>
          <h1>
            {client.nome}
            <span className="verified" aria-label="Perfil verificado">
              ✓
            </span>
          </h1>
          <p className="profile-slogan">{client.slogan}</p>

          <div className="profile-actions">
            <a
              className="button button-primary"
              href={createWhatsAppUrl(client.whatsapp)}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>

            {client.instagramUrl ? (
              <a
                className="button button-secondary"
                href={client.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver Instagram
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
