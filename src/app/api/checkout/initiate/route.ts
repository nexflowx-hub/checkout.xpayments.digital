import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_MASTER_API ||
  process.env.API_URL ||
  "https://api.xpayments.digital";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      paymentMethod,
      customer = {},
      returnUrl,
      paymentMethodOptions,
    } = body ?? {};

    if (
      typeof sessionId !== "string" ||
      !UUID_RE.test(sessionId.trim()) ||
      typeof paymentMethod !== "string" ||
      !paymentMethod.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHECKOUT_REQUEST_INVALID",
            message: "Dados incompletos ou sessão inválida.",
          },
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/v1/checkout/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        sessionId: sessionId.trim(),
        paymentMethod: paymentMethod.trim(),
        customer,
        ...(returnUrl ? { returnUrl } : {}),
        ...(paymentMethodOptions ? { paymentMethodOptions } : {}),
      }),
    });

    const text = await response.text();
    let payload: unknown;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = {
        success: false,
        error: {
          code: "UPSTREAM_INVALID_RESPONSE",
          message: "Resposta inválida da API de pagamentos.",
        },
      };
    }

    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[checkout/initiate] proxy error", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CHECKOUT_PROXY_ERROR",
          message: "Não foi possível iniciar o pagamento.",
        },
      },
      { status: 502 }
    );
  }
}
