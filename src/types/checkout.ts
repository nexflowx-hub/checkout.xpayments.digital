// ── Checkout Session (V3 — Payment Orchestration) ──

export interface SessionMetadata {
  theme?: string;
  returnUrl?: string;
  [key: string]: unknown;
}

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
  // Optional metadata (theme control, returnUrl, etc.)
  metadata?: SessionMetadata;
  // Merchant return URL for post-payment redirect
  returnUrl?: string;
}

// ── Payment Method Types ──

export type PaymentMethodType =
  | "card"
  | "mbway"
  | "bizum"
  | "multibanco"
  | "pix"
  | "usdt";

export interface PaymentMethodOption {
  id: PaymentMethodType;
  labelKey: string;        // i18n key for label
  icon: string;            // path to SVG in /icons/
  currencies: string[];    // which currencies show this method
  comingSoon?: boolean;    // placeholder (e.g. USDT)
}

/** All available payment methods */
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "card",
    labelKey: "method.card",
    icon: "/icons/visa.svg",
    currencies: ["EUR", "BRL", "USD"],
  },
  {
    id: "mbway",
    labelKey: "method.mbway",
    icon: "/icons/mbway.svg",
    currencies: ["EUR"],
  },
  {
    id: "bizum",
    labelKey: "method.bizum",
    icon: "/icons/bizum.svg",
    currencies: ["EUR"],
  },
  {
    id: "multibanco",
    labelKey: "method.multibanco",
    icon: "/icons/mastercard.svg",
    currencies: ["EUR"],
  },
  {
    id: "pix",
    labelKey: "method.pix",
    icon: "/icons/pix.svg",
    currencies: ["BRL"],
  },
  {
    id: "usdt",
    labelKey: "method.usdt",
    icon: "/icons/apple-pay.svg",
    currencies: ["USD"],
    comingSoon: true,
  },
];

/** Filter payment methods by currency */
export function getPaymentMethodsForCurrency(
  currency: string
): PaymentMethodOption[] {
  const upper = currency.toUpperCase();
  return PAYMENT_METHODS.filter((m) => m.currencies.includes(upper));
}

// ── Customer (V3 — name + email required; phone optional for MBWAY/Bizum) ──

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
}

// ── V3 Initiate Payment Request ──

export interface InitiatePaymentRequest {
  sessionId: string;
  paymentMethod: string;
  customer: CustomerPayload;
}

// ── Gateway Response Types ──

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

export interface MultibancoCheckoutData {
  entity: string;
  reference: string;
  amount: number;
  providerTxId: string;
}

export interface PhoneCheckoutData {
  providerTxId: string;
  status?: string;
}

export type CheckoutData =
  | StripeCheckoutData
  | PixCheckoutData
  | MultibancoCheckoutData
  | PhoneCheckoutData;

/**
 * V3 Initiate Response — the Master Backend returns:
 * {
 *   success: true,
 *   data: {
 *     gateway: "STRIPE",
 *     providerAction: {
 *       checkoutData: { clientSecret, publicKey, ... }
 *     }
 *   }
 * }
 *
 * We normalise this into { gateway, checkoutData } for the UI layer.
 */
export interface InitiateCheckoutResponse {
  success: boolean;
  data: {
    gateway: GatewayType;
    providerAction?: {
      checkoutData?: CheckoutData;
      [key: string]: unknown;
    };
    // Backwards-compatible: checkoutData directly under data
    checkoutData?: CheckoutData;
    [key: string]: unknown;
  };
}

/** Normalised result returned to the page — always { gateway, checkoutData } */
export interface NormalisedInitiateResult {
  gateway: string;
  checkoutData: CheckoutData;
}

// ── Phone Validation ──

/** Country prefix mapping for phone-based methods */
export const PHONE_COUNTRY_PREFIXES: Record<string, { country: string; prefix: string; digits: number }> = {
  mbway: { country: "PT", prefix: "+351", digits: 9 },
  bizum: { country: "ES", prefix: "+34", digits: 9 },
};

/**
 * Validate phone number for a specific payment method.
 * MBWAY requires PT (+351), BIZUM requires ES (+34).
 * Returns an error key (for i18n) or null if valid.
 */
export function validatePhoneForMethod(
  phone: string,
  method: PaymentMethodType
): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "").trim();
  if (!cleaned) return "phone.required";
  if (!/^\+?\d{7,15}$/.test(cleaned)) return "phone.invalid";

  const rule = PHONE_COUNTRY_PREFIXES[method];
  if (!rule) return null; // No country restriction for unknown methods

  // Check if the phone starts with the required prefix
  const hasPrefix = cleaned.startsWith(rule.prefix);
  // Also accept numbers without prefix that match the expected digit count
  // (e.g., "912345678" for PT without +351)
  const digitsOnly = cleaned.replace(/^\+/, "");
  const digitCount = digitsOnly.replace(/^351|^34/, "").length;

  if (!hasPrefix && digitCount !== rule.digits) {
    return "phone.countryMismatch";
  }
  if (hasPrefix) {
    const afterPrefix = cleaned.slice(rule.prefix.length);
    if (afterPrefix.length !== rule.digits) {
      return "phone.countryMismatch";
    }
  }

  return null; // Valid
}

// ── Type Guards ──

export function isStripeGateway(gateway: GatewayType): boolean {
  return gateway.toUpperCase().includes("STRIPE");
}

export function isPixGateway(gateway: GatewayType): boolean {
  const upper = gateway.toUpperCase();
  return upper.includes("MISTIC") || upper.includes("PIX");
}

export function isMultibancoGateway(gateway: GatewayType): boolean {
  return gateway.toUpperCase().includes("MULTIBANCO");
}

export function isPhoneGateway(gateway: GatewayType): boolean {
  const upper = gateway.toUpperCase();
  return upper.includes("MBWAY") || upper.includes("BIZUM");
}

export function isStripeCheckoutData(
  data: CheckoutData
): data is StripeCheckoutData {
  return "clientSecret" in data;
}

export function isPixCheckoutData(
  data: CheckoutData
): data is PixCheckoutData {
  return "pixString" in data || "pixCode" in data;
}

export function isMultibancoCheckoutData(
  data: CheckoutData
): data is MultibancoCheckoutData {
  return "entity" in data && "reference" in data;
}

export function isPhoneCheckoutData(
  data: CheckoutData
): data is PhoneCheckoutData {
  return !("clientSecret" in data) && !("pixString" in data) && !("pixCode" in data) && !("entity" in data);
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