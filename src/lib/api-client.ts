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

/**
 * Normalise a raw backend payload into a valid CheckoutSession.
 * The backend may omit `sessionId` and `status` — we supply safe defaults
 * so the UI never crashes on a partial response.
 */
function normalizeSession(
  raw: Record<string, unknown>,
  fallbackId: string
): CheckoutSession {
  const session: CheckoutSession = {
    // Backend may return `amount` instead of `amountFiat`
    amountFiat: (raw.amountFiat as number) ?? (raw.amount as number) ?? 0,
    currency: (raw.currency as string) ?? "EUR",
    storeName: (raw.storeName as string) ?? "Store",
    sessionId: (raw.sessionId as string) ?? fallbackId,
    status: ((raw.status as string) ?? "OPEN") as CheckoutSession["status"],
  };

  // Optional fields — only copy if present
  if (raw.storeId != null) session.storeId = raw.storeId as string;
  if (raw.logoUrl != null && raw.logoUrl !== "null") session.logoUrl = raw.logoUrl as string;
  if (raw.primaryColor != null) session.primaryColor = raw.primaryColor as string;

  return session;
}

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

  // Backend may wrap under `data`, `session`, or return directly
  const envelope = (raw.data ?? raw.session ?? raw) as Record<string, unknown>;

  // Minimal validation: must contain an amount field
  if (!envelope || !(envelope.amountFiat || typeof envelope.amount === "number")) {
    console.error("[api-client] Raw response:", JSON.stringify(raw, null, 2));
    throw new Error("Payload recebido não possui as propriedades de valor esperadas.");
  }

  console.log("[api-client] Normalising session:", JSON.stringify(envelope, null, 2));
  return normalizeSession(envelope, sessionId);
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