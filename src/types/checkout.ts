// ── Checkout Session (V3 — Payment Orchestration) ──

export interface SessionMetadata {
  theme?: string;
  returnUrl?: string;
  description?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

// ── API Payment Method (dynamic, from backend) ──

export interface ApiPaymentMethod {
  code: string;
  label: string;
  provider?: string;
}

export interface CheckoutSession {
  sessionId: string;
  storeName: string;
  amount: number;
  currency: string;
  reference?: string;
  description?: string;
  // Optional branding
  logoUrl?: string;
  primaryColor?: string;
  storeId?: string;
  // Optional metadata
  metadata?: SessionMetadata;
  // Merchant return URL for post-payment redirect
  returnUrl?: string;
  // Session expiration
  expiresAt?: string;
  // Dynamic payment methods returned by the API
  paymentMethods?: ApiPaymentMethod[];
}

// ── Checkout Flow Steps ──

export type CheckoutStep =
  | "loading"
  | "checkout"
  | "processing"
  | "awaiting"
  | "success"
  | "error"
  | "expired"
  | "cancelled";

// ── Payment Method Types ──

export type PaymentMethodType =
  | "card"
  | "mbway"
  | "bizum"
  | "multibanco"
  | "pix"
  | "usdt"
  | "apple_pay"
  | "google_pay";

export interface PaymentMethodOption {
  id: PaymentMethodType;
  labelKey: string;
  icon: string;
  currencies: string[];
  countries?: string[];       // ISO 3166-1 alpha-2
  comingSoon?: boolean;
  /** Secondary icon (e.g., mastercard alongside visa for "card") */
  iconSecondary?: string;
}

/** All available payment methods — ordered by importance */
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "card",
    labelKey: "method.card",
    icon: "/icons/visa.svg",
    iconSecondary: "/icons/mastercard.svg",
    currencies: ["EUR", "BRL", "USD"],
  },
  {
    id: "mbway",
    labelKey: "method.mbway",
    icon: "/icons/mbway.svg",
    currencies: ["EUR"],
    countries: ["PT"],
  },
  {
    id: "bizum",
    labelKey: "method.bizum",
    icon: "/icons/bizum.svg",
    currencies: ["EUR"],
    countries: ["ES"],
  },
  {
    id: "multibanco",
    labelKey: "method.multibanco",
    icon: "/icons/mastercard.svg",
    currencies: ["EUR"],
    countries: ["PT"],
  },
  {
    id: "pix",
    labelKey: "method.pix",
    icon: "/icons/pix.svg",
    currencies: ["BRL"],
    countries: ["BR"],
  },
  {
    id: "usdt",
    labelKey: "method.usdt",
    icon: "/icons/apple-pay.svg",
    currencies: ["USD"],
    comingSoon: true,
  },
  {
    id: "apple_pay",
    labelKey: "method.applePay",
    icon: "/icons/apple-pay.svg",
    currencies: ["EUR", "USD", "BRL"],
    comingSoon: true,
  },
  {
    id: "google_pay",
    labelKey: "method.googlePay",
    icon: "/icons/apple-pay.svg",
    currencies: ["EUR", "USD", "BRL"],
    comingSoon: true,
  },
];

/**
 * Country → payment method priority order.
 * Used for geolocation-based method filtering and ordering.
 */
export const COUNTRY_METHOD_PRIORITY: Record<string, PaymentMethodType[]> = {
  PT: ["card", "mbway", "multibanco"],
  ES: ["card", "bizum"],
  BR: ["pix", "card"],
  FR: ["card"],
  DE: ["card"],
  IT: ["card"],
  GB: ["card"],
  US: ["card"],
  IE: ["card"],
  NL: ["card"],
  BE: ["card"],
  LU: ["card"],
  CH: ["card"],
  AO: ["card"],
  MZ: ["card"],
  CV: ["card"],
};

/**
 * Filter and order payment methods for a given currency and country.
 * Country takes priority for ordering. Currency is the hard filter.
 * Falls back to currency-only if country has no mapping.
 */
export function getPaymentMethods(
  currency: string,
  countryCode?: string
): PaymentMethodOption[] {
  const upper = currency.toUpperCase();

  // Step 1: Filter by currency and remove "coming soon"
  const available = PAYMENT_METHODS.filter(
    (m) => m.currencies.includes(upper) && !m.comingSoon
  );

  // Step 2: If country is detected, apply country-based filtering
  if (countryCode) {
    const countryOrder = COUNTRY_METHOD_PRIORITY[countryCode.toUpperCase()];

    if (countryOrder) {
      // Filter to only methods allowed for this country + currency
      const countryMethods = available.filter((m) => {
        // If method has no country restriction, it's available everywhere
        if (!m.countries || m.countries.length === 0) return true;
        return m.countries.includes(countryCode.toUpperCase());
      });

      // Sort by country priority
      const ordered: PaymentMethodOption[] = [];
      for (const methodId of countryOrder) {
        const found = countryMethods.find((m) => m.id === methodId);
        if (found) ordered.push(found);
      }

      // Add any remaining methods not in the priority list
      for (const m of countryMethods) {
        if (!ordered.find((o) => o.id === m.id)) {
          ordered.push(m);
        }
      }

      return ordered.length > 0 ? ordered : available;
    }
  }

  return available;
}

/** Legacy alias for backwards compatibility */
export function getPaymentMethodsForCurrency(
  currency: string
): PaymentMethodOption[] {
  return getPaymentMethods(currency);
}

// ── Customer (V3 — name + email required; phone optional for MBWAY/Bizum) ──

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
}

export interface CustomerForm {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  vatId?: string;
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
  pixKey?: string;
  copyPaste?: string;
  providerTxId: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  expiration?: number;  // seconds until expiration
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
 */
export interface InitiateCheckoutResponse {
  success: boolean;
  data: {
    gateway: GatewayType;
    providerAction?: {
      checkoutData?: CheckoutData;
      [key: string]: unknown;
    };
    checkoutData?: CheckoutData;
    [key: string]: unknown;
  };
}

/** Normalised result returned to the page */
export interface NormalisedInitiateResult {
  gateway: string;
  checkoutData: CheckoutData;
}

// ── Phone Validation ──

export const PHONE_COUNTRY_PREFIXES: Record<string, { country: string; prefix: string; digits: number }> = {
  mbway: { country: "PT", prefix: "+351", digits: 9 },
  bizum: { country: "ES", prefix: "+34", digits: 9 },
};

export function validatePhoneForMethod(
  phone: string,
  method: PaymentMethodType
): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "").trim();
  if (!cleaned) return "phone.required";
  if (!/^\+?\d{7,15}$/.test(cleaned)) return "phone.invalid";

  const rule = PHONE_COUNTRY_PREFIXES[method];
  if (!rule) return null;

  const hasPrefix = cleaned.startsWith(rule.prefix);
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

  return null;
}

// ── Type Guards ──

export function isStripeCheckoutData(
  data: CheckoutData
): data is StripeCheckoutData {
  return "clientSecret" in data;
}

export function isPixCheckoutData(
  data: CheckoutData
): data is PixCheckoutData {
  return "pixString" in data || "pixCode" in data || "copyPaste" in data;
}

export function isMultibancoCheckoutData(
  data: CheckoutData
): data is MultibancoCheckoutData {
  return "entity" in data && "reference" in data;
}

export function isPhoneCheckoutData(
  data: CheckoutData
): data is PhoneCheckoutData {
  return !("clientSecret" in data) && !("pixString" in data) && !("pixCode" in data) && !("copyPaste" in data) && !("entity" in data);
}

export function getPixCode(data: PixCheckoutData): string {
  return data.pixString || data.pixCode || data.copyPaste || "";
}

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

/** Format countdown as MM:SS */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ── Country Detection ──

/** Map browser language codes to ISO country codes */
export const LANG_TO_COUNTRY: Record<string, string> = {
  pt: "PT", "pt-pt": "PT", "pt-br": "BR",
  en: "US", "en-us": "US", "en-gb": "GB", "en-ie": "IE",
  es: "ES", "es-es": "ES",
  fr: "FR", "fr-fr": "FR", "fr-be": "BE",
  de: "DE", "de-de": "DE", "de-at": "DE", "de-ch": "CH",
  it: "IT", "it-it": "IT",
  nl: "NL", "nl-nl": "NL", "nl-be": "BE",
  lu: "LU",
  ao: "AO", mz: "MZ", cv: "CV",
};

/**
 * Detect country from browser locale.
 * Returns ISO 3166-1 alpha-2 code.
 */
export function detectCountryFromLocale(): string {
  try {
    const lang = typeof navigator !== "undefined" ? (navigator.language || "pt-PT") : "pt-PT";
    const normalized = lang.toLowerCase().trim();
    return LANG_TO_COUNTRY[normalized] || "PT";
  } catch {
    return "PT";
  }
}

// ── Methods that require phone input before initiating ──

export const PHONE_METHODS: PaymentMethodType[] = ["mbway", "bizum"];

/** Methods that initiate immediately on click */
export const INSTANT_METHODS: PaymentMethodType[] = ["card", "pix", "multibanco"];

// ── String-based method classification (works with any code from API) ──

const PHONE_METHOD_CODES = new Set(["mbway", "bizum", "mb_way", "MB_WAY"]);
const INSTANT_METHOD_CODES = new Set(["card", "pix", "multibanco"]);

/** Check if a method code (from API) requires phone input */
export function isPhoneMethodCode(code: string): boolean {
  const normalized = code.toLowerCase().replace(/-/g, "_");
  return PHONE_METHOD_CODES.has(code.toLowerCase()) || PHONE_METHOD_CODES.has(normalized);
}

/** Check if a method code (from API) initiates immediately on click */
export function isInstantMethodCode(code: string): boolean {
  return INSTANT_METHOD_CODES.has(code.toLowerCase());
}

// ── Visual config map for known method codes ──

export interface MethodVisualConfig {
  labelKey: string;
  icon: string;
  iconSecondary?: string;
  isCard?: boolean;
}

export const METHOD_VISUAL_MAP: Record<string, MethodVisualConfig> = {
  card: { labelKey: "method.card", icon: "/icons/visa.svg", iconSecondary: "/icons/mastercard.svg", isCard: true },
  mbway: { labelKey: "method.mbway", icon: "/icons/mbway.svg" },
  mb_way: { labelKey: "method.mbway", icon: "/icons/mbway.svg" },
  bizum: { labelKey: "method.bizum", icon: "/icons/bizum.svg" },
  multibanco: { labelKey: "method.multibanco", icon: "/icons/mastercard.svg" },
  pix: { labelKey: "method.pix", icon: "/icons/pix.svg" },
  usdt: { labelKey: "method.usdt", icon: "/icons/apple-pay.svg" },
  apple_pay: { labelKey: "method.applePay", icon: "/icons/apple-pay.svg" },
  google_pay: { labelKey: "method.googlePay", icon: "/icons/apple-pay.svg" },
};

/** Get visual config for a method code, with fallback */
export function getMethodVisual(code: string): MethodVisualConfig & { resolvedLabel: string } {
  const known = METHOD_VISUAL_MAP[code.toLowerCase()];
  if (known) return { ...known, resolvedLabel: "" };
  return {
    labelKey: "",
    icon: "/icons/visa.svg",
    resolvedLabel: code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, " "),
  };
}

/** Check if a method code is a card-type method */
export function isCardMethodCode(code: string): boolean {
  return code.toLowerCase() === "card";
}