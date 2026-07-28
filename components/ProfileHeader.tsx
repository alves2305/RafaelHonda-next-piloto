import Image from "next/image";

import { createGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { canOptimizePublicImage } from "@/lib/public-image";
import type { ClientProfile } from "@/lib/types";

export function ProfileHeader({ client }: { client: ClientProfile }) {
  const desktopPhotoUrl = client.fotoDesktopUrl ?? client.fotoUrl;

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
            sizes="(max-width: 700px) 190px, 16px"
            unoptimized={!canOptimizePublicImage(client.fotoUrl)}
            style={{
              objectPosition: `${client.fotoPosicaoX}% ${client.fotoPosicaoY}%`,
            }}
          />

          <Image
            className="profile-photo profile-photo-desktop"
            src={desktopPhotoUrl}
            alt={`Foto de ${client.nome}`}
            width={560}
            height={440}
            priority
            sizes="(max-width: 700px) 16px, (max-width: 1180px) 42vw, 520px"
            unoptimized={!canOptimizePublicImage(desktopPhotoUrl)}
            style={{
              objectPosition: `${client.fotoDesktopPosicaoX}% ${client.fotoDesktopPosicaoY}%`,
            }}
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
              sizes="184px"
              unoptimized={!canOptimizePublicImage(client.logoUrl)}
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
              href={createGeneralWhatsAppUrl(
                client.whatsapp,
                client.nome,
              )}
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
