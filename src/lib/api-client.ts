// ── API Client for Master Backend (Spaceship) ──
// All communication goes through this module.

import type {
  PaymentLinkData,
  CustomerDetails,
  InitiateCheckoutResponse,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// ── Fetch Payment Link by urlCode ──

export async function fetchPaymentLink(
  urlCode: string
): Promise<PaymentLinkData> {
  const res = await fetch(
    `${API_URL}/api/v1/payment-links/${urlCode}`,
    { cache: "no-store" }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "Link de pagamento inválido");
  }

  return json.data;
}

// ── Initiate Checkout (POST) ──

export async function initiateCheckout(
  storeId: string,
  amountFiat: number,
  currency: string,
  customerDetails: CustomerDetails
): Promise<InitiateCheckoutResponse["data"]> {
  const res = await fetch(`${API_URL}/api/v1/checkout/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId, amountFiat, currency, customerDetails }),
  });

  const json: InitiateCheckoutResponse = await res.json();

  if (!json.success) {
    throw new Error(
      (json as unknown as { error: string }).error ||
        "Erro ao iniciar pagamento"
    );
  }

  return json.data;
}