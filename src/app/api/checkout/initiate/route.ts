import { NextRequest, NextResponse } from "next/server";

// Mock database of stores for demo purposes
const STORE_GATEWAYS: Record<string, { gateway: string; currency: string }> = {
  store_pt_001: { gateway: "STRIPE_PT_002", currency: "EUR" },
  store_br_001: { gateway: "MISTIC_BR_001", currency: "BRL" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, amountFiat, currency, customerDetails } = body;

    // Validate required fields
    if (!storeId || !amountFiat || !currency || !customerDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: storeId, amountFiat, currency, customerDetails",
        },
        { status: 400 }
      );
    }

    if (!customerDetails.fullName || !customerDetails.email || !customerDetails.country) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer details must include fullName, email, and country",
        },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;

    // If a real API URL is configured, proxy to it
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/v1/checkout/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, amountFiat, currency, customerDetails }),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // ── Mock response for demo ──
    const storeConfig = STORE_GATEWAYS[storeId];
    const gateway = storeConfig?.gateway ?? (currency === "BRL" ? "MISTIC_BR_001" : "STRIPE_PT_002");

    if (gateway.toUpperCase().includes("STRIPE")) {
      return NextResponse.json({
        success: true,
        data: {
          gateway,
          checkoutData: {
            clientSecret: "pi_3MtwBwLkdIwHu7ix0l4t3W8Q_secret_mock123456789",
            providerTxId: `txn_stripe_${Date.now()}`,
            publishableKey: "pk_test_mock",
          },
        },
      });
    }

    // PIX / MISTIC mock
    const pixCode =
      "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890" +
      "5204000053039865802BR5925XPAYMENTS DIGITAL TECNOLOGIA LTDA6009SAO PAULO" +
      "62070503***63041D3D";

    return NextResponse.json({
      success: true,
      data: {
        gateway,
        checkoutData: {
          pixCode,
          providerTxId: `txn_pix_${Date.now()}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[checkout/initiate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}