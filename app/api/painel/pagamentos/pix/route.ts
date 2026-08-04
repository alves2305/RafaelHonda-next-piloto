import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";

import {
  ClientRequestError,
  requireClientRequest,
} from "@/lib/client-request-auth";
import { createPixCopyPaste } from "@/lib/pix-br-code";
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

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function errorResponse(error: unknown) {
  if (error instanceof ClientRequestError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error("Falha ao gerar Pix:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o Pix.",
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const { access } = await requireClientRequest(request);
    const supabase = getSupabaseServiceClient();

    const { data: subscription, error } = await supabase
      .from("cliente_assinaturas")
      .select("valor_mensal, referencia, status")
      .eq("cliente_id", access.clientId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!subscription) {
      throw new ClientRequestError(
        "A mensalidade deste vendedor ainda não foi configurada.",
        404,
      );
    }

    if (subscription.status === "pago") {
      throw new ClientRequestError(
        "A mensalidade desta referência já está paga.",
        409,
      );
    }

    const amountInCents = Math.round(
      Number(subscription.valor_mensal) * 100,
    );

    if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
      throw new ClientRequestError(
        "O valor da mensalidade precisa ser maior que zero.",
        400,
      );
    }

    const pixKey = process.env.PIX_KEY?.trim() ?? "";
    const receiverName = process.env.PIX_RECEIVER_NAME?.trim() ?? "";
    const receiverCity = process.env.PIX_RECEIVER_CITY?.trim() ?? "";
    const whatsapp = normalizePhone(
      process.env.PIX_PAYMENT_WHATSAPP?.trim() ?? "",
    );

    if (!pixKey || !receiverName || !receiverCity) {
      throw new Error(
        "Pix não configurado. Defina PIX_KEY, PIX_RECEIVER_NAME e PIX_RECEIVER_CITY somente no servidor.",
      );
    }

    const referenceCode = subscription.referencia
      .slice(0, 7)
      .replace("-", "");
    const clientCode = access.clientId.replace(/-/g, "").slice(0, 12);
    const txid = `CAT${clientCode}${referenceCode}`;

    const copyPaste = createPixCopyPaste({
      key: pixKey,
      receiverName,
      receiverCity,
      amountInCents,
      txid,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(copyPaste, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    const amount = amountInCents / 100;
    const referenceLabel = formatReference(subscription.referencia);
    const message = [
      "Olá, Rafael! Realizei o pagamento da mensalidade por Pix.",
      "",
      `Vendedor: ${access.clientName}`,
      `Referência: ${referenceLabel}`,
      `Valor: ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)}`,
      "",
      "Pode confirmar o recebimento, por favor?",
    ].join("\n");

    const whatsappUrl = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
      : null;

    return NextResponse.json({
      success: true,
      amount,
      reference: subscription.referencia,
      copyPaste,
      qrCodeDataUrl,
      whatsappUrl,
      manualConfirmation: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
