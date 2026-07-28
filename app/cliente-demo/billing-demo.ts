export type DemoBillingStatus = "paid" | "pending" | "overdue";

export type DemoBillingClient = {
  slug: string;
  name: string;
  monthlyAmount: number;
  dueDay: number;
  graceDays: number;
  status: DemoBillingStatus;
  automaticBlock: boolean;
  paymentMethod: string | null;
  lastPaymentDate: string | null;
};

export type DemoBillingData = Record<string, DemoBillingClient>;

export const DEMO_BILLING_STORAGE_KEY =
  "catalogo-honda-demo-billing-v1";

export const DEFAULT_DEMO_BILLING: DemoBillingData = {
  gd: {
    slug: "gd",
    name: "GD Honda",
    monthlyAmount: 49.9,
    dueDay: 10,
    graceDays: 3,
    status: "pending",
    automaticBlock: true,
    paymentMethod: null,
    lastPaymentDate: null,
  },
  rafael: {
    slug: "rafael",
    name: "Rafael Honda",
    monthlyAmount: 39.9,
    dueDay: 5,
    graceDays: 5,
    status: "paid",
    automaticBlock: true,
    paymentMethod: "Cartão •••• 4242",
    lastPaymentDate: "05/07/2026",
  },
  icaro: {
    slug: "icaro",
    name: "Ícaro Honda",
    monthlyAmount: 59.9,
    dueDay: 15,
    graceDays: 3,
    status: "overdue",
    automaticBlock: true,
    paymentMethod: "Pix",
    lastPaymentDate: "15/06/2026",
  },
};

function isValidClient(value: unknown): value is DemoBillingClient {
  if (!value || typeof value !== "object") {
    return false;
  }

  const client = value as Partial<DemoBillingClient>;

  return (
    typeof client.slug === "string" &&
    typeof client.name === "string" &&
    typeof client.monthlyAmount === "number" &&
    Number.isFinite(client.monthlyAmount) &&
    typeof client.dueDay === "number" &&
    Number.isInteger(client.dueDay) &&
    typeof client.graceDays === "number" &&
    Number.isInteger(client.graceDays) &&
    (client.status === "paid" ||
      client.status === "pending" ||
      client.status === "overdue") &&
    typeof client.automaticBlock === "boolean" &&
    (client.paymentMethod === null ||
      typeof client.paymentMethod === "string") &&
    (client.lastPaymentDate === null ||
      typeof client.lastPaymentDate === "string")
  );
}

export function loadDemoBilling(): DemoBillingData {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_BILLING;
  }

  try {
    const storedValue = window.localStorage.getItem(
      DEMO_BILLING_STORAGE_KEY,
    );

    if (!storedValue) {
      return DEFAULT_DEMO_BILLING;
    }

    const parsed = JSON.parse(storedValue) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_DEMO_BILLING;
    }

    const entries = Object.entries(parsed).filter(([, value]) =>
      isValidClient(value),
    );

    if (entries.length === 0) {
      return DEFAULT_DEMO_BILLING;
    }

    return {
      ...DEFAULT_DEMO_BILLING,
      ...Object.fromEntries(entries),
    };
  } catch {
    return DEFAULT_DEMO_BILLING;
  }
}

export function saveDemoBilling(data: DemoBillingData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    DEMO_BILLING_STORAGE_KEY,
    JSON.stringify(data),
  );
}

export function formatDemoCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getDemoBillingStatusLabel(status: DemoBillingStatus) {
  if (status === "paid") {
    return "Pago";
  }

  if (status === "overdue") {
    return "Atrasado";
  }

  return "Pendente";
}
