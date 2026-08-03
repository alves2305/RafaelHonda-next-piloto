import { createWhatsAppUrl } from "@/lib/format";

const AI_ENABLED_CLIENT_SLUGS = new Set(["rafael"]);

export function hasWhatsAppAi(clientSlug: string) {
  return AI_ENABLED_CLIENT_SLUGS.has(clientSlug.trim().toLowerCase());
}

export function getWhatsAppCtaLabel(clientSlug: string) {
  return hasWhatsAppAi(clientSlug)
    ? "Conversar com a IA"
    : "Falar no WhatsApp";
}

export function createGeneralWhatsAppUrl(
  phone: string,
  sellerName: string,
) {
  const normalizedSellerName = sellerName.trim();

  const greeting = normalizedSellerName
    ? `Olá, ${normalizedSellerName}!`
    : "Olá!";

  const message = `${greeting} Vim pelo seu catálogo Honda e gostaria de fazer uma simulação. Pode me ajudar?`;

  return createWhatsAppUrl(phone, message);
}
