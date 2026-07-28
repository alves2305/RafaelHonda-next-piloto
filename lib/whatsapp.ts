import { createWhatsAppUrl } from "@/lib/format";

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
