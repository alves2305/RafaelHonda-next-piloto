const INFINITEPAY_LINKS_URL =
  "https://api.checkout.infinitepay.io/links";
const INFINITEPAY_PAYMENT_CHECK_URL =
  "https://api.checkout.infinitepay.io/payment_check";

type CheckoutItem = {
  quantity: number;
  price: number;
  description: string;
};

type CreateCheckoutInput = {
  handle: string;
  redirectUrl: string;
  webhookUrl?: string;
  orderNsu: string;
  items: CheckoutItem[];
};

export type InfinitePayPaymentCheck = {
  success: boolean;
  paid: boolean;
  amount: number;
  paidAmount: number;
  installments: number;
  captureMethod: string;
};

function normalizeHandle(value: string) {
  return value.trim().replace(/^\$/, "");
}

export function getInfinitePayHandle() {
  const handle = normalizeHandle(process.env.INFINITEPAY_HANDLE ?? "");

  if (!handle) {
    throw new Error(
      "InfinitePay não configurada. Defina INFINITEPAY_HANDLE somente no servidor.",
    );
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(handle)) {
    throw new Error("A InfiniteTag configurada possui formato inválido.");
  }

  return handle;
}

export function getApplicationBaseUrl(requestOrigin: string) {
  const configuredUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";

  const value = (configuredUrl || requestOrigin).replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(value)) {
    throw new Error(
      "A URL do sistema é inválida. Defina APP_URL com http:// ou https://.",
    );
  }

  return value;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("A InfinitePay retornou uma resposta inválida.");
  }
}

export async function createInfinitePayCheckout(
  input: CreateCheckoutInput,
) {
  const body: Record<string, unknown> = {
    handle: input.handle,
    redirect_url: input.redirectUrl,
    order_nsu: input.orderNsu,
    items: input.items,
  };

  if (input.webhookUrl) {
    body.webhook_url = input.webhookUrl;
  }

  const response = await fetch(INFINITEPAY_LINKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "A InfinitePay recusou a criação do checkout.";

    throw new Error(message);
  }

  const checkoutUrl =
    typeof data.url === "string"
      ? data.url
      : typeof data.checkout_url === "string"
        ? data.checkout_url
        : "";

  if (!checkoutUrl.startsWith("https://")) {
    throw new Error(
      "A InfinitePay não retornou um endereço de checkout válido.",
    );
  }

  return checkoutUrl;
}

export async function checkInfinitePayPayment(input: {
  handle: string;
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<InfinitePayPaymentCheck> {
  const response = await fetch(INFINITEPAY_PAYMENT_CHECK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      handle: input.handle,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
    cache: "no-store",
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Não foi possível confirmar o pagamento na InfinitePay.";

    throw new Error(message);
  }

  return {
    success: data.success === true,
    paid: data.paid === true,
    amount: Number(data.amount ?? 0),
    paidAmount: Number(data.paid_amount ?? 0),
    installments: Number(data.installments ?? 0),
    captureMethod:
      typeof data.capture_method === "string"
        ? data.capture_method
        : "",
  };
}
