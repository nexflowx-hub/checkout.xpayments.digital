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
  if (!sessionId) throw new Error("ID de sessão em falta.");

  const res = await fetch(v1(`/checkout/session/${sessionId}`), {
    cache: "no-store",
  });

  const raw = await res.json();

  if (!res.ok) {
    throw new Error(raw.message || raw.error || `Erro ${res.status} na consulta da API`);
  }

  // Backend may wrap the session under `data`, `session`, or return it directly
  const sessionData: CheckoutSession =
    raw.data ?? raw.session ?? raw;

  // Minimal validation: must contain an amount field
  if (!sessionData || !(sessionData.amountFiat || typeof (sessionData as Record<string, unknown>).amount === "number")) {
    console.error("[api-client] Raw response:", JSON.stringify(raw, null, 2));
    throw new Error("Payload recebido não possui as propriedades de valor esperadas.");
  }

  // Normalise: if backend uses `amount` instead of `amountFiat`, map it
  if (!sessionData.amountFiat && typeof (sessionData as Record<string, unknown>).amount === "number") {
    sessionData.amountFiat = (sessionData as Record<string, unknown>).amount as number;
  }

  return sessionData;
}

// ── Initiate Checkout (POST) — Server decides price/currency ──

export async function initiateCheckout(data: {
  sessionId: string;
  customerDetails: CustomerDetails;
}): Promise<InitiateCheckoutResponse["data"]> {
  if (!data.sessionId) throw new Error("ID de sessão em falta.");

  const res = await fetch(v1("/checkout/initiate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const raw = await res.json();

  if (!res.ok) {
    throw new Error(raw.message || raw.error || `Erro ${res.status} ao iniciar pagamento`);
  }

  const json: InitiateCheckoutResponse = raw.data ?? raw;

  if (!json.success && !(json.gateway && json.checkoutData)) {
    throw new Error(
      raw.message || raw.error || "Erro ao iniciar pagamento"
    );
  }

  return json.data ?? json;
}