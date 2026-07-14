// ── API Client for XPayments V3 Backend ──
// Payment Orchestration architecture.

import type {
  CheckoutSession,
  SessionMetadata,
  InitiatePaymentRequest,
  InitiateCheckoutResponse,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// All endpoints must include the /api/v1 prefix
const v1 = (endpoint: string) => `${API_URL}/api/v1${endpoint}`;

/**
 * Normalise a raw V3 payload into a CheckoutSession.
 * V3 returns { sessionId, storeName, amount, currency, reference }.
 * Branding fields (logoUrl, primaryColor) are optional extras.
 */
function normalizeSession(
  raw: Record<string, unknown>,
  fallbackId: string
): CheckoutSession {
  const session: CheckoutSession = {
    sessionId: (raw.sessionId as string) ?? fallbackId,
    storeName: (raw.storeName as string) ?? "Store",
    amount: (raw.amount as number) ?? 0,
    currency: (raw.currency as string) ?? "EUR",
  };

  // Optional fields — only copy if present and valid
  if (raw.reference != null) session.reference = raw.reference as string;
  if (raw.storeId != null) session.storeId = raw.storeId as string;
  if (raw.logoUrl != null && raw.logoUrl !== "null") session.logoUrl = raw.logoUrl as string;
  if (raw.primaryColor != null) session.primaryColor = raw.primaryColor as string;

  // Optional metadata (e.g. theme control)
  if (raw.metadata != null && typeof raw.metadata === "object") {
    session.metadata = raw.metadata as SessionMetadata;
  }

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

  // Backend wraps under `data`
  const envelope = (raw.data ?? raw) as Record<string, unknown>;

  // Minimal validation: must contain amount
  if (!envelope || typeof envelope.amount !== "number") {
    console.error("[api-client] Raw response:", JSON.stringify(raw, null, 2));
    throw new Error("Payload recebido não possui as propriedades de valor esperadas.");
  }

  console.log("[api-client] Normalising V3 session:", JSON.stringify(envelope, null, 2));
  return normalizeSession(envelope, sessionId);
}

// ── Initiate Payment (V3) — NO auth headers, sessionId-only validation ──

export async function initiatePayment(
  data: InitiatePaymentRequest
): Promise<InitiateCheckoutResponse["data"]> {
  if (!data.sessionId) throw new Error("ID de sessão em falta.");

  const res = await fetch(v1("/checkout/initiate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // NO Authorization header — V3 validates via sessionId only
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