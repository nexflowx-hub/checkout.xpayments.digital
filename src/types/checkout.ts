// ── Checkout Session ──

export interface SessionMetadata {
  theme?: string;
  returnUrl?: string;
  description?: string;
  expiresAt?: string;
  checkoutDisplayName?: string;
  autoReturnSeconds?: number;
  allowedOrigin?: string;
  [key: string]: unknown;
}

export interface ApiPaymentMethod {
  code: string;
  label: string;
  provider?: string;
}

export interface CheckoutSession {
  sessionId: string;
  storeName: string;
  internalStoreName?: string;
  amount: number;
  currency: string;
  reference?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  storeId?: string;
  metadata?: SessionMetadata;
  returnUrl?: string;
  expiresAt?: string;
  autoReturnSeconds?: number;
  localeMode?: string;
  paymentMethods?: ApiPaymentMethod[];
}

export type CheckoutStep =
  | "loading"
  | "checkout"
  | "processing"
  | "awaiting"
  | "success"
  | "error"
  | "expired"
  | "cancelled";

// ── Payment Methods ──

export type PaymentMethodType =
  | "card"
  | "stripe_all"
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
  countries?: string[];
  comingSoon?: boolean;
  iconSecondary?: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "card",
    labelKey: "method.card",
    icon: "/icons/card.svg",
    currencies: ["EUR", "BRL", "USD", "GBP", "PLN"],
  },
  {
    id: "mbway",
    labelKey: "method.mbway",
    icon: "/icons/mbway.png",
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
    icon: "/icons/multibanco.png",
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
    icon: "/icons/card.svg",
    currencies: ["USD"],
    comingSoon: true,
  },
  {
    id: "apple_pay",
    labelKey: "method.applePay",
    icon: "/icons/apple-pay.svg",
    currencies: ["EUR", "USD", "BRL", "GBP"],
    comingSoon: true,
  },
  {
    id: "google_pay",
    labelKey: "method.googlePay",
    icon: "/icons/card.svg",
    currencies: ["EUR", "USD", "BRL", "GBP"],
    comingSoon: true,
  },
];

export const COUNTRY_METHOD_PRIORITY: Record<string, PaymentMethodType[]> = {
  PT: ["mbway", "multibanco", "card", "stripe_all"],
  ES: ["bizum", "card", "stripe_all"],
  BR: ["pix", "card", "stripe_all"],
  FR: ["card", "stripe_all"],
  DE: ["card", "stripe_all"],
  IT: ["card", "stripe_all"],
  GB: ["card", "stripe_all"],
  US: ["card", "stripe_all"],
  IE: ["card", "stripe_all"],
  NL: ["card", "stripe_all"],
  BE: ["card", "stripe_all"],
  LU: ["card", "stripe_all"],
  CH: ["card", "stripe_all"],
  AO: ["card", "stripe_all"],
  MZ: ["card", "stripe_all"],
  CV: ["card", "stripe_all"],
};

export function getPaymentMethods(
  currency: string,
  countryCode?: string
): PaymentMethodOption[] {
  const upper = currency.toUpperCase();
  const available = PAYMENT_METHODS.filter(
    (method) => method.currencies.includes(upper) && !method.comingSoon
  );

  if (!countryCode) return available;
  const country = countryCode.toUpperCase();
  const order = COUNTRY_METHOD_PRIORITY[country];
  if (!order) return available;

  const countryMethods = available.filter(
    (method) => !method.countries?.length || method.countries.includes(country)
  );

  return [...countryMethods].sort((a, b) => {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);
    return (aIndex === -1 ? 100 : aIndex) - (bIndex === -1 ? 100 : bIndex);
  });
}

export function getPaymentMethodsForCurrency(currency: string): PaymentMethodOption[] {
  return getPaymentMethods(currency);
}

// ── Customer / API contracts ──

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
  document?: string;
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

export interface InitiatePaymentRequest {
  sessionId: string;
  paymentMethod: string;
  customer: CustomerPayload;
  returnUrl?: string;
  paymentMethodOptions?: Record<string, unknown>;
}

export type GatewayType = string;

export interface StripeCheckoutData {
  clientSecret: string;
  providerTxId: string;
  publicKey: string;
  dynamicMethods?: boolean;
}

export interface PixCheckoutData {
  pixString?: string;
  pixCode?: string;
  pixKey?: string;
  copyPaste?: string;
  providerTxId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  expiration?: number;
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
  actionType?: string | null;
  message?: string | null;
  redirectUrl?: string;
}

export type CheckoutData =
  | StripeCheckoutData
  | PixCheckoutData
  | MultibancoCheckoutData
  | PhoneCheckoutData;

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

export interface NormalisedInitiateResult {
  gateway: string;
  checkoutData: CheckoutData;
}

// ── Phone Validation ──

export const PHONE_COUNTRY_PREFIXES: Record<
  string,
  { country: string; prefix: string; digits: number }
> = {
  mbway: { country: "PT", prefix: "+351", digits: 9 },
  mb_way: { country: "PT", prefix: "+351", digits: 9 },
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

  if (!hasPrefix && digitCount !== rule.digits) return "phone.countryMismatch";
  if (hasPrefix && cleaned.slice(rule.prefix.length).length !== rule.digits) {
    return "phone.countryMismatch";
  }
  return null;
}

// ── Type Guards ──

export function isStripeCheckoutData(data: CheckoutData): data is StripeCheckoutData {
  return "clientSecret" in data;
}

export function isPixCheckoutData(data: CheckoutData): data is PixCheckoutData {
  return "pixString" in data || "pixCode" in data || "copyPaste" in data;
}

export function isMultibancoCheckoutData(
  data: CheckoutData
): data is MultibancoCheckoutData {
  return "entity" in data && "reference" in data;
}

export function isPhoneCheckoutData(data: CheckoutData): data is PhoneCheckoutData {
  return !isStripeCheckoutData(data) && !isPixCheckoutData(data) && !isMultibancoCheckoutData(data);
}

export function getPixCode(data: PixCheckoutData): string {
  return data.pixString || data.pixCode || data.copyPaste || "";
}

export function isQrCodeImage(qrCode: string | undefined): boolean {
  return Boolean(qrCode && (qrCode.startsWith("http") || qrCode.startsWith("data:")));
}

export function formatCurrency(amount: number, currency: string): string {
  const locale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : currency.toUpperCase() === "BRL"
        ? "pt-BR"
        : "pt-PT";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ── Country Detection ──

export const LANG_TO_COUNTRY: Record<string, string> = {
  pt: "PT", "pt-pt": "PT", "pt-br": "BR",
  en: "US", "en-us": "US", "en-gb": "GB", "en-ie": "IE",
  es: "ES", "es-es": "ES",
  fr: "FR", "fr-fr": "FR", "fr-be": "BE",
  de: "DE", "de-de": "DE", "de-at": "AT", "de-ch": "CH",
  it: "IT", "it-it": "IT",
  nl: "NL", "nl-nl": "NL", "nl-be": "BE",
  pl: "PL", "pl-pl": "PL",
  ao: "AO", mz: "MZ", cv: "CV",
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Europe/Lisbon": "PT",
  "Atlantic/Madeira": "PT",
  "Europe/Madrid": "ES",
  "America/Sao_Paulo": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Manaus": "BR",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Warsaw": "PL",
};

export function detectCountryFromLocale(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && TIMEZONE_TO_COUNTRY[timezone]) return TIMEZONE_TO_COUNTRY[timezone];

    const lang = typeof navigator !== "undefined" ? navigator.language || "pt-PT" : "pt-PT";
    const normalized = lang.toLowerCase().trim();
    return LANG_TO_COUNTRY[normalized] || LANG_TO_COUNTRY[normalized.split("-")[0]] || "PT";
  } catch {
    return "PT";
  }
}

// ── Method classification ──

export const PHONE_METHODS: PaymentMethodType[] = ["mbway", "bizum"];
export const INSTANT_METHODS: PaymentMethodType[] = ["card", "stripe_all", "pix", "multibanco"];

const PHONE_METHOD_CODES = new Set(["mbway", "bizum", "mb_way"]);
const INSTANT_METHOD_CODES = new Set(["card", "stripe_all", "pix", "multibanco"]);

export function isPhoneMethodCode(code: string): boolean {
  const normalized = code.toLowerCase().replace(/-/g, "_");
  return PHONE_METHOD_CODES.has(normalized);
}

export function isInstantMethodCode(code: string): boolean {
  return INSTANT_METHOD_CODES.has(code.toLowerCase().replace(/-/g, "_"));
}

// ── Visual config ──

export interface MethodVisualConfig {
  labelKey: string;
  icon: string;
  iconSecondary?: string;
  isCard?: boolean;
}

export const METHOD_VISUAL_MAP: Record<string, MethodVisualConfig> = {
  card: { labelKey: "method.card", icon: "/icons/card.svg", isCard: true },
  stripe_all: { labelKey: "", icon: "/icons/card.svg" },
  mbway: { labelKey: "method.mbway", icon: "/icons/mbway.png" },
  mb_way: { labelKey: "method.mbway", icon: "/icons/mbway.png" },
  bizum: { labelKey: "method.bizum", icon: "/icons/bizum.svg" },
  multibanco: { labelKey: "method.multibanco", icon: "/icons/multibanco.png" },
  pix: { labelKey: "method.pix", icon: "/icons/pix.svg" },
  usdt: { labelKey: "method.usdt", icon: "/icons/card.svg" },
  apple_pay: { labelKey: "method.applePay", icon: "/icons/apple-pay.svg" },
  google_pay: { labelKey: "method.googlePay", icon: "/icons/card.svg" },
};

export function getMethodVisual(
  code: string
): MethodVisualConfig & { resolvedLabel: string } {
  const normalized = code.toLowerCase().replace(/-/g, "_");
  const known = METHOD_VISUAL_MAP[normalized];
  if (known) {
    return {
      ...known,
      resolvedLabel: normalized === "stripe_all" ? "Mais opções" : "",
    };
  }

  return {
    labelKey: "",
    icon: "/icons/card.svg",
    resolvedLabel: code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, " "),
  };
}

export function isCardMethodCode(code: string): boolean {
  return code.toLowerCase().replace(/-/g, "_") === "card";
}
