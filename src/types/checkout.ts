// ── Checkout Session (Server-to-Server V2) ──

export type SessionStatus = "OPEN" | "COMPLETED" | "EXPIRED";

export interface CheckoutSession {
  sessionId: string;
  storeId?: string;
  amountFiat: number;
  currency: string;
  storeName: string;
  logoUrl?: string;
  primaryColor?: string;
  status: SessionStatus;
}

// ── Customer Details ──

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

// ── Gateway Response ──

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

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}