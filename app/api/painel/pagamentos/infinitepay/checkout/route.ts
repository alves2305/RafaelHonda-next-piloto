import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  ClientRequestError,
  requireClientRequest,
} from "@/lib/client-request-auth";
import {
  createInfinitePayCheckout,
  getApplicationBaseUrl,
  getInfinitePayHandle,
} from "@/lib/infinitepay";
import { getSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatReference(reference: string) {
  const date = new Date(`${reference.slice(0, 10)}T12:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function errorResponse(error: unknown) {
  if (error instanceof ClientRequestError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error("Falha ao criar checkout InfinitePay:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o pagamento.",
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const { access } = await requireClientRequest(request);
    const supabase = getSupabaseServiceClient();

    const { data: subscription, error: subscriptionError } = await supabase
      .from("cliente_assinaturas")
      .select("valor_mensal, referencia, status")
      .eq("cliente_id", access.clientId)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A mensalidade deste vendedor ainda não foi configurada pelo administrador.",
        },
        { status: 404 },
      );
    }

    if (subscription.status === "pago") {
      return NextResponse.json(
        {
          success: false,
          message: "A mensalidade desta referência já está paga.",
        },
        { status: 409 },
      );
    }

    const amountInCents = Math.round(
      Number(subscription.valor_mensal) * 100,
    );

    if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O valor da mensalidade precisa ser maior que zero para gerar o checkout.",
        },
        { status: 400 },
      );
    }

    const reuseAfter = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: reusablePayment, error: reusableError } = await supabase
      .from("cliente_pagamentos")
      .select("checkout_url")
      .eq("cliente_id", access.clientId)
      .eq("referencia", subscription.referencia)
      .eq("valor_centavos", amountInCents)
      .eq("status", "pendente")
      .not("checkout_url", "is", null)
      .gte("criado_em", reuseAfter)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusableError) {
      throw reusableError;
    }

    if (
      reusablePayment?.checkout_url &&
      reusablePayment.checkout_url.startsWith("https://")
    ) {
      return NextResponse.json({
        success: true,
        checkoutUrl: reusablePayment.checkout_url,
        reused: true,
      });
    }

    const orderNsu = `assinatura-${randomUUID()}`;
    const baseUrl = getApplicationBaseUrl(request.nextUrl.origin);
    const redirectUrl = `${baseUrl}/painel/assinatura`;
    const webhookUrl = baseUrl.startsWith("https://")
      ? `${baseUrl}/api/webhooks/infinitepay`
      : undefined;

    const { error: insertError } = await supabase
      .from("cliente_pagamentos")
      .insert({
        cliente_id: access.clientId,
        order_nsu: orderNsu,
        referencia: subscription.referencia,
        valor_centavos: amountInCents,
        status: "pendente",
      });

    if (insertError) {
      throw insertError;
    }

    try {
      const checkoutUrl = await createInfinitePayCheckout({
        handle: getInfinitePayHandle(),
        redirectUrl,
        webhookUrl,
        orderNsu,
        items: [
          {
            quantity: 1,
            price: amountInCents,
            description: `Mensalidade Catálogo Honda — ${formatReference(
              subscription.referencia,
            )}`,
          },
        ],
      });

      const { error: updateError } = await supabase
        .from("cliente_pagamentos")
        .update({
          checkout_url: checkoutUrl,
          erro_mensagem: null,
        })
        .eq("order_nsu", orderNsu);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        checkoutUrl,
        reused: false,
      });
    } catch (checkoutError) {
      await supabase
        .from("cliente_pagamentos")
        .update({
          status: "erro",
          erro_mensagem:
            checkoutError instanceof Error
              ? checkoutError.message.slice(0, 500)
              : "Falha desconhecida ao criar checkout.",
        })
        .eq("order_nsu", orderNsu);

      throw checkoutError;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
