import { NextRequest, NextResponse } from "next/server";

import {
  confirmStoredInfinitePayPayment,
  loadStoredPayment,
} from "@/lib/infinitepay-payment";
import { getSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookBody = {
  invoice_slug?: unknown;
  order_nsu?: unknown;
  transaction_nsu?: unknown;
  receipt_url?: unknown;
};

function successResponse(message: string | null = null) {
  return NextResponse.json(
    {
      success: true,
      message,
    },
    { status: 200 },
  );
}

function errorResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookBody;
    const orderNsu =
      typeof body.order_nsu === "string" ? body.order_nsu.trim() : "";
    const transactionNsu =
      typeof body.transaction_nsu === "string"
        ? body.transaction_nsu.trim()
        : "";
    const invoiceSlug =
      typeof body.invoice_slug === "string"
        ? body.invoice_slug.trim()
        : "";
    const receiptUrl =
      typeof body.receipt_url === "string" &&
      body.receipt_url.startsWith("https://")
        ? body.receipt_url
        : null;

    if (!orderNsu || !transactionNsu || !invoiceSlug) {
      return errorResponse("Notificação incompleta.");
    }

    const supabase = getSupabaseServiceClient();
    const payment = await loadStoredPayment(supabase, orderNsu);

    if (!payment) {
      return errorResponse("Pedido não encontrado.");
    }

    const confirmation = await confirmStoredInfinitePayPayment({
      supabase,
      payment,
      transactionNsu,
      invoiceSlug,
      receiptUrl,
    });

    if (!confirmation.paid) {
      return errorResponse("Pagamento ainda não confirmado.");
    }

    return successResponse(null);
  } catch (error) {
    console.error("Falha no webhook InfinitePay:", error);

    return errorResponse(
      error instanceof Error
        ? error.message.slice(0, 300)
        : "Falha ao processar a notificação.",
    );
  }
}
