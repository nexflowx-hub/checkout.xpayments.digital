// ── API Client for XPayments V2 Backend ──
// Strict Server-to-Server Checkout Session architecture.

import type {
  CheckoutSession,
  CustomerDetails,
  InitiateCheckoutResponse,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// ── Get Checkout Session ──

export async function getSession(
  sessionId: string
): Promise<CheckoutSession> {
  const res = await fetch(
    `${API_URL}/checkout/session/${sessionId}`,
    { cache: "no-store" }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "Sessão de checkout inválida");
  }

  return json.data;
}

// ── Initiate Checkout (POST) — Server decides price/currency ──

export async function initiateCheckout(data: {
  sessionId: string;
  customerDetails: CustomerDetails;
}): Promise<InitiateCheckoutResponse["data"]> {
  const res = await fetch(`${API_URL}/checkout/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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