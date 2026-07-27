import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { createWhatsAppUrl } from "@/lib/format";
import type { ClientProfile } from "@/lib/types";

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="contact-button-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20.25 11.55a8.25 8.25 0 0 1-12.17 7.27L4 20l1.22-3.95a8.25 8.25 0 1 1 15.03-4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 7.75c.22-.5.45-.51.68-.52h.58c.18 0 .42.07.53.35l.74 1.78c.08.2.04.38-.08.55l-.53.68c-.14.17-.12.34-.02.5.55.95 1.37 1.7 2.35 2.16.17.08.34.06.47-.1l.64-.78c.16-.2.35-.23.56-.15l1.74.82c.25.12.38.26.33.5-.09.47-.36 1.13-.78 1.49-.4.35-.94.55-1.48.55-.51 0-1.38-.2-2.73-.79-1.63-.72-2.88-1.89-3.75-3.37-.52-.89-.82-1.76-.82-2.4 0-.52.18-.92.57-1.27Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="contact-button-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="3.75" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.25" cy="6.9" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function ContactSection({ client }: { client: ClientProfile }) {
  return (
    <>
      <section className="contact-section">
        <div className="contact-copy">
          <h2>Vamos tirar sua moto do papel?</h2>
          <p>
            Entre em contato agora mesmo e descubra as melhores condições em
            consórcio e financiamento Honda.
          </p>
        </div>

        <div className="contact-actions">
          <a
            className="button contact-button"
            href={createWhatsAppUrl(client.whatsapp)}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            Falar no WhatsApp
          </a>

          {client.instagramUrl ? (
            <a
              className="button contact-button"
              href={client.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              <InstagramIcon />
              Ver Instagram
            </a>
          ) : null}
        </div>
      </section>

      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()} {client.nome}. Todos os direitos
          reservados.
        </p>
      </footer>

      <FloatingWhatsApp client={client} />
    </>
  );
}
