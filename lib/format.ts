export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function createWhatsAppUrl(phone: string, message?: string) {
  const destination = onlyDigits(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${destination}${query}`;
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
