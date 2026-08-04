import { NextRequest, NextResponse } from "next/server";

import {
  ClientRequestError,
  requireClientRequest,
} from "@/lib/client-request-auth";
import {
  confirmStoredInfinitePayPayment,
  loadStoredPayment,
} from "@/lib/infinitepay-payment";
import { getSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmationBody = {
  orderNsu?: unknown;
  transactionNsu?: unknown;
  slug?: unknown;
  receiptUrl?: unknown;
};

function readRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ClientRequestError(
      `A confirmação não recebeu ${field}.`,
      400,
    );
  }

  return value.trim();
}

function errorResponse(error: unknown) {
  if (error instanceof ClientRequestError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error("Falha ao confirmar pagamento InfinitePay:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar o pagamento.",
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const { access } = await requireClientRequest(request);
    const body = (await request.json()) as ConfirmationBody;

    const orderNsu = readRequiredString(body.orderNsu, "o número do pedido");
    const transactionNsu = readRequiredString(
      body.transactionNsu,
      "a identificação da transação",
    );
    const invoiceSlug = readRequiredString(
      body.slug,
      "a identificação da fatura",
    );
    const receiptUrl =
      typeof body.receiptUrl === "string" && body.receiptUrl.startsWith("https://")
        ? body.receiptUrl
        : null;

    const supabase = getSupabaseServiceClient();
    const payment = await loadStoredPayment(supabase, orderNsu);

    if (!payment || payment.cliente_id !== access.clientId) {
      throw new ClientRequestError(
        "Este pagamento não pertence ao vendedor autenticado.",
        404,
      );
    }

    const confirmation = await confirmStoredInfinitePayPayment({
      supabase,
      payment,
      transactionNsu,
      invoiceSlug,
      receiptUrl,
    });

    if (!confirmation.paid) {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          message:
            "O pagamento ainda não foi confirmado pela InfinitePay.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      paid: true,
      alreadyConfirmed: confirmation.alreadyConfirmed,
      message: "Pagamento confirmado com sucesso.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
