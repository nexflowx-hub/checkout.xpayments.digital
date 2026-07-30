// ── API Client for XPayments V3 Backend ──
// Payment Orchestration architecture.

import type {
  CheckoutSession,
  SessionMetadata,
  InitiatePaymentRequest,
  CheckoutData,
  NormalisedInitiateResult,
} from "@/types/checkout";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// All endpoints must include the /api/v1 prefix
const v1 = (endpoint: string) => `${API_URL}/api/v1${endpoint}`;

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== "null" ? trimmed : undefined;
}

/**
 * Normalise a raw V3 payload into a CheckoutSession.
 * V3 returns { sessionId, storeName, amount, currency, reference }.
 * Branding fields and customer prefill are optional extras.
 */
function normalizeSession(
  raw: Record<string, unknown>,
  fallbackId: string
): CheckoutSession {
  const rawMetadata =
    raw.metadata && typeof raw.metadata === "object"
      ? (raw.metadata as Record<string, unknown>)
      : {};

  const rawCustomer =
    raw.customer && typeof raw.customer === "object"
      ? (raw.customer as Record<string, unknown>)
      : {};

  const customerName =
    optionalString(rawCustomer.name) ??
    optionalString(raw.customerName) ??
    optionalString(rawMetadata.customerName);

  const customerEmail =
    optionalString(rawCustomer.email) ??
    optionalString(raw.customerEmail) ??
    optionalString(rawMetadata.customerEmail);

  const metadata: SessionMetadata = {
    ...rawMetadata,
    ...(customerName ? { customerName } : {}),
    ...(customerEmail ? { customerEmail } : {}),
    ...(optionalString(raw.status)
      ? { checkoutStatus: optionalString(raw.status) }
      : {}),
  };

  const session: CheckoutSession = {
    sessionId: optionalString(raw.sessionId) ?? fallbackId,
    storeName: optionalString(raw.storeName) ?? "Store",
    amount: typeof raw.amount === "number" ? raw.amount : Number(raw.amount ?? 0),
    currency: optionalString(raw.currency) ?? "EUR",
    metadata,
  };

  const reference = optionalString(raw.reference);
  const storeId = optionalString(raw.storeId);
  const logoUrl = optionalString(raw.logoUrl);
  const primaryColor = optionalString(raw.primaryColor);
  const returnUrl = optionalString(raw.returnUrl) ?? optionalString(metadata.returnUrl);
  const expiresAt = optionalString(raw.expiresAt) ?? optionalString(metadata.expiresAt);

  if (reference) session.reference = reference;
  if (storeId) session.storeId = storeId;
  if (logoUrl) session.logoUrl = logoUrl;
  if (primaryColor) session.primaryColor = primaryColor;
  if (returnUrl) session.returnUrl = returnUrl;
  if (expiresAt) session.expiresAt = expiresAt;

  // Dynamic payment methods from API (V3 contract)
  if (Array.isArray(raw.paymentMethods) && raw.paymentMethods.length > 0) {
    session.paymentMethods = raw.paymentMethods
      .filter(
        (method: unknown) =>
          method &&
          typeof method === "object" &&
          "code" in (method as Record<string, unknown>)
      )
      .map((method: unknown) => {
        const item = method as Record<string, unknown>;
        return {
          code: String(item.code ?? ""),
          label: String(item.label ?? ""),
          ...(item.provider ? { provider: String(item.provider) } : {}),
        };
      });
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

  if (!envelope || !Number.isFinite(Number(envelope.amount))) {
    throw new Error("Payload recebido não possui as propriedades de valor esperadas.");
  }

  return normalizeSession(envelope, sessionId);
}

// ── Initiate Payment (V3) — NO auth headers, sessionId-only validation ──

export async function initiatePayment(
  data: InitiatePaymentRequest
): Promise<NormalisedInitiateResult> {
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

  const envelope = raw.data ?? raw;
  const gateway = envelope.gateway as string | undefined;
  const checkoutData = (
    envelope.providerAction?.checkoutData ?? envelope.checkoutData
  ) as CheckoutData | undefined;

  if (!gateway || !checkoutData) {
    throw new Error(
      raw.message || raw.error || "Erro ao iniciar pagamento — resposta inválida do gateway."
    );
  }

  return { gateway, checkoutData };
}
