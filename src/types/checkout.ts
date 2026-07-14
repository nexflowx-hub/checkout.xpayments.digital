// ── Checkout Session (V3 — Payment Orchestration) ──

export interface CheckoutSession {
  sessionId: string;
  storeName: string;
  amount: number;
  currency: string;
  reference?: string;
  // Optional branding (may not be returned by V3)
  logoUrl?: string;
  primaryColor?: string;
  storeId?: string;
}

// ── Customer (V3 — only name + email sent to backend) ──

export interface CustomerPayload {
  name: string;
  email: string;
}

/** Full customer details collected in the form (UI only — not all sent to API) */
export interface CustomerDetails {
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

// ── V3 Initiate Payment Request ──

export interface InitiatePaymentRequest {
  sessionId: string;
  paymentMethod: string;
  customer: CustomerPayload;
}

// ── Gateway Response (unchanged — backend still returns gateway-specific data) ──

export type GatewayType = string;

export interface StripeCheckoutData {
  clientSecret: string;
  providerTxId: string;
  publicKey: string;
}

export interface PixCheckoutData {
  pixString?: string;
  pixCode?: string;
  providerTxId: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
}

export type CheckoutData = StripeCheckoutData | PixCheckoutData;

export interface InitiateCheckoutResponse {
  success: boolean;
  data: {
    gateway: GatewayType;
    checkoutData: CheckoutData;
  };
}

// ── Helpers ──

export function isStripeGateway(gateway: GatewayType): boolean {
  return gateway.toUpperCase().includes("STRIPE");
}

export function isPixGateway(gateway: GatewayType): boolean {
  const upper = gateway.toUpperCase();
  return upper.includes("MISTIC") || upper.includes("PIX");
}

export function isStripeCheckoutData(
  data: CheckoutData
): data is StripeCheckoutData {
  return "clientSecret" in data;
}

export function isPixCheckoutData(
  data: CheckoutData
): data is PixCheckoutData {
  return !("clientSecret" in data);
}

/** Get the PIX string from either pixString or pixCode field */
export function getPixCode(data: PixCheckoutData): string {
  return data.pixString || data.pixCode || "";
}

/** Check if the qrCode field looks like a URL or data URI (image) */
export function isQrCodeImage(qrCode: string | undefined): boolean {
  if (!qrCode) return false;
  return qrCode.startsWith("http") || qrCode.startsWith("data:");
}

/** Smart routing: BRL → PIX, else → STRIPE */
export function resolvePaymentMethod(currency: string): string {
  return currency.toUpperCase() === "BRL" ? "PIX" : "STRIPE";
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}