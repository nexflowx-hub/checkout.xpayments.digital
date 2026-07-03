// ── API Client for XPayments V2 Backend ──
// Strict Server-to-Server Checkout Session architecture.

import type {
  CheckoutSession,
  CustomerDetails,
  InitiateCheckoutResponse,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// All endpoints must include the /api/v1 prefix
const v1 = (endpoint: string) => `${API_URL}/api/v1${endpoint}`;

// ── Get Checkout Session ──

export async function getSession(
  sessionId: string
): Promise<CheckoutSession> {
  const res = await fetch(
    v1(`/checkout/session/${sessionId}`),
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
  const res = await fetch(v1("/checkout/initiate"), {
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