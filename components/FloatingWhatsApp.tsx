"use client";

import Image from "next/image";
import { useState } from "react";

import { createGeneralWhatsAppUrl } from "@/lib/whatsapp";
import type { ClientProfile } from "@/lib/types";

export function FloatingWhatsApp({
  client,
}: {
  client: ClientProfile;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="whatsapp-widget">
      <button
        type="button"
        className="whatsapp-widget-close"
        onClick={() => setVisible(false)}
        aria-label="Fechar atalho do WhatsApp"
      >
        ×
      </button>

      <a
        className="whatsapp-widget-link"
        href={createGeneralWhatsAppUrl(
          client.whatsapp,
          client.nome,
        )}
        target="_blank"
        rel="noreferrer"
        aria-label={`Falar com ${client.nome} no WhatsApp`}
      >
        <Image
          className="whatsapp-widget-avatar"
          src={client.fotoUrl}
          alt={`Foto de ${client.nome}`}
          width={50}
          height={50}
          unoptimized
          style={{
            objectPosition: `${client.fotoPosicaoX}% ${client.fotoPosicaoY}%`,
          }}
        />

        <span>Estou online. Fale agora!</span>
      </a>
    </div>
  );
}
