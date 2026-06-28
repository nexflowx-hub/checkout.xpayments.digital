// ── Payment Link (PASSO A) ──

export interface Branding {
  storeName: string;
  logo?: string;
  color: string;
  successUrl?: string;
}

export interface PaymentLinkData {
  id: string;
  storeId: string;
  name: string;
  amountFiat: number;
  currency: string;
  branding: Branding;
}

export interface PaymentLinkResponse {
  success: boolean;
  data: PaymentLinkData;
}

// ── Customer Details (PASSO B) ──

export interface CustomerDetails {
  fullName: string;
  email: string;
  country: string;
}

export interface InitiateCheckoutRequest {
  storeId: string;
  amountFiat: number;
  currency: string;
  customerDetails: CustomerDetails;
}

// ── Gateway Response (PASSO C) ──

export type GatewayType = string;

export interface StripeCheckoutData {
  clientSecret: string;
  providerTxId: string;
  publishableKey?: string;
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

// ── Checkout Steps ──

export type CheckoutStep = "customer_details" | "payment";

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