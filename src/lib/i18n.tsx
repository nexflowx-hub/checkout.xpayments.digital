"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ── Supported Locales ──

export type Locale = "pt" | "en" | "es";

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

// ── Translation Keys ──

const translations: Record<Locale, Record<string, string>> = {
  pt: {
    // Header
    "header.secure": "Checkout Seguro",

    // Step 1
    "step1.title": "Informações de Contacto",
    "step1.subtitle": "Insira os seus dados para prosseguir.",

    // Step 2
    "step2.pix.title": "Pagamento PIX",
    "step2.pix.subtitle": "Escaneie o QR Code ou copie o código.",
    "step2.stripe.title": "Pagamento",
    "step2.stripe.subtitle": "Cartão, MBWay, Multibanco e outros métodos.",
    "step2.preparing": "A preparar o pagamento...",
    "step2.unsupported": "Gateway de pagamento não suportado.",

    // Success
    "success.title": "Pagamento Confirmado!",
    "success.thanks": "Obrigado pela sua compra em",
    "success.email": "Enviámos um email de confirmação com os detalhes do pedido.",
    "success.closeWindow": "Pode fechar esta janela",
    "success.closeDesc": "A transação foi concluída com segurança.",

    // Error
    "error.title": "Ops!",
    "error.notFound": "Link não encontrado",
    "error.loadFailed": "Não foi possível carregar o link de pagamento.",
    "error.serverError": "Erro de ligação ao servidor. Tente novamente.",

    // Form
    "form.fullName": "Nome Completo",
    "form.fullNamePlaceholder": "João Silva",
    "form.fullNameRequired": "Nome completo é obrigatório",
    "form.fullNameMin": "Mínimo 2 caracteres",
    "form.email": "Email",
    "form.emailPlaceholder": "joao@email.com",
    "form.emailRequired": "Email é obrigatório",
    "form.emailInvalid": "Email inválido",
    "form.phone": "Telefone",
    "form.phonePlaceholder": "+351 912 345 678",
    "form.country": "País",
    "form.countryRequired": "Selecione o país",
    "form.address": "Morada",
    "form.addressPlaceholder": "Rua, Número, Andar",
    "form.postalCode": "Código Postal",
    "form.postalCodePlaceholder": "1000-001",
    "form.city": "Cidade",
    "form.cityPlaceholder": "Lisboa",
    "form.submit": "Continuar para Pagamento",
    "form.processing": "A processar...",
    "form.terms": "Ao continuar, concorda com os",
    "form.termsService": "Termos de Serviço",
    "form.termsAnd": "e",
    "form.privacyPolicy": "Política de Privacidade",

    // Stripe
    "stripe.cardTab": "Cartão / Pagamento",
    "stripe.web3Tab": "Web3 / Crypto",
    "stripe.payNow": "Pagar agora",
    "stripe.processing": "A processar pagamento...",
    "stripe.encrypted": "Pagamento encriptado via Stripe",
    "stripe.web3Title": "Pagamento Web3",
    "stripe.web3Subtitle": "Em breve poderá pagar com criptomoedas.\nConecte a sua Wallet Metamask.",
    "stripe.web3ComingSoon": "Em breve",
    "stripe.keyMissing": "Stripe Payment Element",
    "stripe.keyMissingDesc": "A chave pública do Stripe não foi recebida do servidor.",
    "stripe.crashTitle": "Aguardando configuração do Gateway pelo Lojista",
    "stripe.crashDesc": "O Stripe não conseguiu inicializar o pagamento.\nTente novamente mais tarde.",

    // PIX
    "pix.scanTitle": "Escaneie o QR Code",
    "pix.scanSubtitle": "Abra o app do seu banco e escaneie",
    "pix.expired": "Expirado",
    "pix.copyTitle": "Código PIX Copia e Cola",
    "pix.copy": "Copiar",
    "pix.copied": "Copiado",
    "pix.generateNew": "Gerar novo QR Code",
    "pix.autoRefresh": "Após o pagamento, a página será atualizada automaticamente.",
    "pix.qrExpired": "QR Expirado",

    // Order
    "order.secureCheckout": "Checkout seguro",
    "order.payment": "Pagamento",
    "order.unit": "1x Unidade",
    "order.total": "Total",
    "order.securePayment": "Pagamento seguro",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",

    // Back
    "action.back": "Voltar",
  },
  en: {
    // Header
    "header.secure": "Secure Checkout",

    // Step 1
    "step1.title": "Contact Information",
    "step1.subtitle": "Enter your details to proceed.",

    // Step 2
    "step2.pix.title": "PIX Payment",
    "step2.pix.subtitle": "Scan the QR Code or copy the code.",
    "step2.stripe.title": "Payment",
    "step2.stripe.subtitle": "Card, MBWay, Multibanco and other methods.",
    "step2.preparing": "Preparing payment...",
    "step2.unsupported": "Payment gateway not supported.",

    // Success
    "success.title": "Payment Confirmed!",
    "success.thanks": "Thank you for your purchase at",
    "success.email": "We sent a confirmation email with the order details.",
    "success.closeWindow": "You can close this window",
    "success.closeDesc": "The transaction has been completed safely.",

    // Error
    "error.title": "Oops!",
    "error.notFound": "Link not found",
    "error.loadFailed": "Could not load the payment link.",
    "error.serverError": "Server connection error. Please try again.",

    // Form
    "form.fullName": "Full Name",
    "form.fullNamePlaceholder": "John Smith",
    "form.fullNameRequired": "Full name is required",
    "form.fullNameMin": "Minimum 2 characters",
    "form.email": "Email",
    "form.emailPlaceholder": "john@email.com",
    "form.emailRequired": "Email is required",
    "form.emailInvalid": "Invalid email",
    "form.phone": "Phone",
    "form.phonePlaceholder": "+1 555 123 4567",
    "form.country": "Country",
    "form.countryRequired": "Select a country",
    "form.address": "Address",
    "form.addressPlaceholder": "Street, Number, Floor",
    "form.postalCode": "Postal Code",
    "form.postalCodePlaceholder": "10001",
    "form.city": "City",
    "form.cityPlaceholder": "New York",
    "form.submit": "Continue to Payment",
    "form.processing": "Processing...",
    "form.terms": "By continuing, you agree to the",
    "form.termsService": "Terms of Service",
    "form.termsAnd": "and",
    "form.privacyPolicy": "Privacy Policy",

    // Stripe
    "stripe.cardTab": "Card / Payment",
    "stripe.web3Tab": "Web3 / Crypto",
    "stripe.payNow": "Pay now",
    "stripe.processing": "Processing payment...",
    "stripe.encrypted": "Encrypted payment via Stripe",
    "stripe.web3Title": "Web3 Payment",
    "stripe.web3Subtitle": "Crypto payments coming soon.\nConnect your Metamask Wallet.",
    "stripe.web3ComingSoon": "Coming soon",
    "stripe.keyMissing": "Stripe Payment Element",
    "stripe.keyMissingDesc": "The Stripe public key was not received from the server.",
    "stripe.crashTitle": "Waiting for gateway configuration by the merchant",
    "stripe.crashDesc": "Stripe could not initialize the payment.\nPlease try again later.",

    // PIX
    "pix.scanTitle": "Scan the QR Code",
    "pix.scanSubtitle": "Open your bank app and scan",
    "pix.expired": "Expired",
    "pix.copyTitle": "PIX Copy and Paste Code",
    "pix.copy": "Copy",
    "pix.copied": "Copied",
    "pix.generateNew": "Generate new QR Code",
    "pix.autoRefresh": "After payment, the page will refresh automatically.",
    "pix.qrExpired": "QR Expired",

    // Order
    "order.secureCheckout": "Secure checkout",
    "order.payment": "Payment",
    "order.unit": "1x Unit",
    "order.total": "Total",
    "order.securePayment": "Secure payment",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",

    // Back
    "action.back": "Back",
  },
  es: {
    // Header
    "header.secure": "Checkout Seguro",

    // Step 1
    "step1.title": "Información de Contacto",
    "step1.subtitle": "Introduce tus datos para continuar.",

    // Step 2
    "step2.pix.title": "Pago PIX",
    "step2.pix.subtitle": "Escanea el código QR o copia el código.",
    "step2.stripe.title": "Pago",
    "step2.stripe.subtitle": "Tarjeta, Bizum y otros métodos.",
    "step2.preparing": "Preparando el pago...",
    "step2.unsupported": "Gateway de pago no soportado.",

    // Success
    "success.title": "¡Pago Confirmado!",
    "success.thanks": "Gracias por tu compra en",
    "success.email": "Hemos enviado un email de confirmación con los detalles del pedido.",
    "success.closeWindow": "Puede cerrar esta ventana",
    "success.closeDesc": "La transacción se ha completado con seguridad.",

    // Error
    "error.title": "¡Ups!",
    "error.notFound": "Enlace no encontrado",
    "error.loadFailed": "No se pudo cargar el enlace de pago.",
    "error.serverError": "Error de conexión al servidor. Inténtalo de nuevo.",

    // Form
    "form.fullName": "Nombre Completo",
    "form.fullNamePlaceholder": "Juan García",
    "form.fullNameRequired": "El nombre es obligatorio",
    "form.fullNameMin": "Mínimo 2 caracteres",
    "form.email": "Email",
    "form.emailPlaceholder": "juan@email.com",
    "form.emailRequired": "El email es obligatorio",
    "form.emailInvalid": "Email inválido",
    "form.phone": "Teléfono",
    "form.phonePlaceholder": "+34 612 345 678",
    "form.country": "País",
    "form.countryRequired": "Selecciona un país",
    "form.address": "Dirección",
    "form.addressPlaceholder": "Calle, Número, Piso",
    "form.postalCode": "Código Postal",
    "form.postalCodePlaceholder": "28001",
    "form.city": "Ciudad",
    "form.cityPlaceholder": "Madrid",
    "form.submit": "Continuar al Pago",
    "form.processing": "Procesando...",
    "form.terms": "Al continuar, aceptas los",
    "form.termsService": "Términos de Servicio",
    "form.termsAnd": "y",
    "form.privacyPolicy": "Política de Privacidad",

    // Stripe
    "stripe.cardTab": "Tarjeta / Pago",
    "stripe.web3Tab": "Web3 / Crypto",
    "stripe.payNow": "Pagar ahora",
    "stripe.processing": "Procesando pago...",
    "stripe.encrypted": "Pago encriptado vía Stripe",
    "stripe.web3Title": "Pago Web3",
    "stripe.web3Subtitle": "Próximamente podrás pagar con criptomonedas.\nConecta tu Wallet Metamask.",
    "stripe.web3ComingSoon": "Próximamente",
    "stripe.keyMissing": "Stripe Payment Element",
    "stripe.keyMissingDesc": "La clave pública de Stripe no fue recibida del servidor.",
    "stripe.crashTitle": "Esperando configuración del Gateway por el Comerciante",
    "stripe.crashDesc": "Stripe no pudo inicializar el pago.\nInténtalo de nuevo más tarde.",

    // PIX
    "pix.scanTitle": "Escanea el Código QR",
    "pix.scanSubtitle": "Abre la app de tu banco y escanea",
    "pix.expired": "Expirado",
    "pix.copyTitle": "Código PIX Copiar y Pegar",
    "pix.copy": "Copiar",
    "pix.copied": "Copiado",
    "pix.generateNew": "Generar nuevo código QR",
    "pix.autoRefresh": "Después del pago, la página se actualizará automáticamente.",
    "pix.qrExpired": "QR Expirado",

    // Order
    "order.secureCheckout": "Checkout seguro",
    "order.payment": "Pago",
    "order.unit": "1x Unidad",
    "order.total": "Total",
    "order.securePayment": "Pago seguro",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",

    // Back
    "action.back": "Volver",
  },
};

// ── Country names per locale ──

export const COUNTRIES: Record<Locale, { value: string; label: string }[]> = {
  pt: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brasil" },
    { value: "ES", label: "Espanha" },
    { value: "FR", label: "França" },
    { value: "DE", label: "Alemanha" },
    { value: "IT", label: "Itália" },
    { value: "GB", label: "Reino Unido" },
    { value: "US", label: "Estados Unidos" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Moçambique" },
    { value: "CV", label: "Cabo Verde" },
    { value: "CH", label: "Suíça" },
    { value: "NL", label: "Holanda" },
    { value: "BE", label: "Bélgica" },
    { value: "IE", label: "Irlanda" },
    { value: "LU", label: "Luxemburgo" },
    { value: "OTHER", label: "Outro" },
  ],
  en: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brazil" },
    { value: "ES", label: "Spain" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "IT", label: "Italy" },
    { value: "GB", label: "United Kingdom" },
    { value: "US", label: "United States" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Mozambique" },
    { value: "CV", label: "Cape Verde" },
    { value: "CH", label: "Switzerland" },
    { value: "NL", label: "Netherlands" },
    { value: "BE", label: "Belgium" },
    { value: "IE", label: "Ireland" },
    { value: "LU", label: "Luxembourg" },
    { value: "OTHER", label: "Other" },
  ],
  es: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brasil" },
    { value: "ES", label: "España" },
    { value: "FR", label: "Francia" },
    { value: "DE", label: "Alemania" },
    { value: "IT", label: "Italia" },
    { value: "GB", label: "Reino Unido" },
    { value: "US", label: "Estados Unidos" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Mozambique" },
    { value: "CV", label: "Cabo Verde" },
    { value: "CH", label: "Suiza" },
    { value: "NL", label: "Países Bajos" },
    { value: "BE", label: "Bélgica" },
    { value: "IE", label: "Irlanda" },
    { value: "LU", label: "Luxemburgo" },
    { value: "OTHER", label: "Otro" },
  ],
};

// ── Auto-detect locale from browser ──

function detectLocale(): Locale {
  try {
    const lang = typeof navigator !== "undefined" ? (navigator.language || "pt-PT") : "pt-PT";
    const code = lang.split("-")[0].toLowerCase();
    if (code === "pt") return "pt";
    if (code === "en") return "en";
    if (code === "es") return "es";
    return "pt";
  } catch {
    return "pt";
  }
}

/** Auto-detect country from browser locale. Returns ISO 3166-1 alpha-2 code. */
export function detectCountryCode(): string {
  try {
    const lang = typeof navigator !== "undefined" ? (navigator.language || "pt-PT") : "pt-PT";
    // 1. Try region from full locale (e.g. "pt-BR" → "BR")
    const parts = lang.split("-");
    if (parts.length > 1) {
      const region = parts[1].toUpperCase();
      if (region.length === 2) return region;
    }
    // 2. Fallback: infer country from language code
    const code = parts[0].toLowerCase();
    const map: Record<string, string> = {
      pt: "PT",
      en: "US",
      es: "ES",
      fr: "FR",
      de: "DE",
      it: "IT",
      nl: "NL",
      be: "BE",
      ch: "CH",
      gb: "GB",
      uk: "GB",
      ie: "IE",
      lu: "LU",
      ao: "AO",
      mz: "MZ",
      cv: "CV",
    };
    return map[code] || "PT";
  } catch {
    return "PT";
  }
}

/** Suggested country based on current locale (used as initial hint). */
export function suggestCountryForLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    pt: "PT",
    en: "US",
    es: "ES",
  };
  return map[locale] || "PT";
}

// ── Context ──

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Provider ──

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [mounted, setMounted] = useState(false);

  // Detect on mount + load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("xpayments-locale") as Locale | null;
    const detected = stored || detectLocale();
    if (!stored) {
      localStorage.setItem("xpayments-locale", detected);
    }
    const id = requestAnimationFrame(() => {
      setLocaleState(detected);
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("xpayments-locale", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations.pt?.[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  // Prevent hydration mismatch — render default locale until mounted
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: "pt", setLocale, t: (k) => translations.pt[k] ?? k }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hook ──

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}