import type { SupabaseClient } from "@supabase/supabase-js";

import {
  checkInfinitePayPayment,
  getInfinitePayHandle,
} from "@/lib/infinitepay";

export type StoredPayment = {
  id: string;
  cliente_id: string;
  order_nsu: string;
  referencia: string;
  valor_centavos: number;
  status: string;
  checkout_url: string | null;
  invoice_slug: string | null;
  transaction_nsu: string | null;
};

export async function loadStoredPayment(
  supabase: SupabaseClient,
  orderNsu: string,
) {
  const { data, error } = await supabase
    .from("cliente_pagamentos")
    .select(
      "id, cliente_id, order_nsu, referencia, valor_centavos, status, checkout_url, invoice_slug, transaction_nsu",
    )
    .eq("order_nsu", orderNsu)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as StoredPayment | null;
}

export async function confirmStoredInfinitePayPayment(input: {
  supabase: SupabaseClient;
  payment: StoredPayment;
  transactionNsu: string;
  invoiceSlug: string;
  receiptUrl?: string | null;
}) {
  if (input.payment.status === "pago") {
    return {
      paid: true,
      alreadyConfirmed: true,
    };
  }

  const verification = await checkInfinitePayPayment({
    handle: getInfinitePayHandle(),
    orderNsu: input.payment.order_nsu,
    transactionNsu: input.transactionNsu,
    slug: input.invoiceSlug,
  });

  if (!verification.success || !verification.paid) {
    return {
      paid: false,
      alreadyConfirmed: false,
    };
  }

  if (
    !Number.isInteger(verification.amount) ||
    verification.amount !== input.payment.valor_centavos
  ) {
    throw new Error(
      "O valor confirmado pela InfinitePay não corresponde à mensalidade.",
    );
  }

  const { data, error } = await input.supabase.rpc(
    "confirmar_pagamento_infinitepay",
    {
      p_order_nsu: input.payment.order_nsu,
      p_transaction_nsu: input.transactionNsu,
      p_invoice_slug: input.invoiceSlug,
      p_capture_method: verification.captureMethod,
      p_amount: verification.amount,
      p_paid_amount: verification.paidAmount,
      p_receipt_url: input.receiptUrl ?? null,
    },
  );

  if (error) {
    throw error;
  }

  return {
    paid: true,
    alreadyConfirmed: false,
    result: data,
  };
}
