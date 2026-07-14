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

    // Order Block (Block A)
    "block.order.title": "Resumo do Pedido",
    "block.order.reference": "Referência",
    "block.order.amount": "Total a Pagar",

    // Customer Block (Block B)
    "block.customer.title": "Identificação do Pagador",
    "block.customer.subtitle": "Nome e email para confirmação.",
    "block.customer.name": "Nome Completo",
    "block.customer.namePlaceholder": "João Silva",
    "block.customer.nameRequired": "Nome é obrigatório",
    "block.customer.nameMin": "Mínimo 2 caracteres",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "joao@email.com",
    "block.customer.emailRequired": "Email é obrigatório",
    "block.customer.emailInvalid": "Email inválido",

    // Payment Wall (Block C)
    "block.payment.title": "Selecione o Método de Pagamento",
    "block.payment.disabledHint": "Preencha os dados acima para ativar os métodos",

    // Payment Methods
    "method.card": "Cartão",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.comingSoon": "Em breve",

    // Card Payment
    "card.payNow": "Pagar agora",
    "card.processing": "A processar pagamento...",
    "card.encrypted": "Pagamento encriptado via Stripe",
    "card.keyMissing": "Stripe Payment Element",
    "card.keyMissingDesc": "A chave pública do Stripe não foi recebida do servidor.",
    "card.crashTitle": "Aguardando configuração do Gateway",
    "card.crashDesc": "O Stripe não conseguiu inicializar o pagamento.\nTente novamente mais tarde.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Número de Telemóvel",
    "phone.placeholder": "+351 912 345 678",
    "phone.required": "Número de telemóvel é obrigatório",
    "phone.invalid": "Número de telemóvel inválido",
    "phone.submit": "Confirmar Pagamento",
    "phone.submitting": "A submeter...",
    "phone.waitingTitle": "A aguardar aprovação",
    "phone.waitingDesc": "Abra a app e confirme o pagamento.",
    "phone.waitingHint": "Não feche esta janela. Será redirecionado automaticamente.",

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

    // Multibanco
    "multibanco.title": "Dados para Pagamento Multibanco",
    "multibanco.entity": "Entidade",
    "multibanco.reference": "Referência",
    "multibanco.amount": "Montante",
    "multibanco.hint": "Pague na sua banca próxima ou via homebanking.",
    "multibanco.copyEntity": "Copiar Entidade",
    "multibanco.copyRef": "Copiar Referência",
    "multibanco.copied": "Copiado",

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
    "error.initiateFailed": "Não foi possível iniciar o pagamento.",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",
  },
  en: {
    // Header
    "header.secure": "Secure Checkout",

    // Order Block (Block A)
    "block.order.title": "Order Summary",
    "block.order.reference": "Reference",
    "block.order.amount": "Total to Pay",

    // Customer Block (Block B)
    "block.customer.title": "Payer Identification",
    "block.customer.subtitle": "Name and email for confirmation.",
    "block.customer.name": "Full Name",
    "block.customer.namePlaceholder": "John Smith",
    "block.customer.nameRequired": "Name is required",
    "block.customer.nameMin": "Minimum 2 characters",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "john@email.com",
    "block.customer.emailRequired": "Email is required",
    "block.customer.emailInvalid": "Invalid email",

    // Payment Wall (Block C)
    "block.payment.title": "Select Payment Method",
    "block.payment.disabledHint": "Fill in the details above to activate payment methods",

    // Payment Methods
    "method.card": "Card",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.comingSoon": "Coming soon",

    // Card Payment
    "card.payNow": "Pay now",
    "card.processing": "Processing payment...",
    "card.encrypted": "Encrypted payment via Stripe",
    "card.keyMissing": "Stripe Payment Element",
    "card.keyMissingDesc": "The Stripe public key was not received from the server.",
    "card.crashTitle": "Waiting for gateway configuration",
    "card.crashDesc": "Stripe could not initialize the payment.\nPlease try again later.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Phone Number",
    "phone.placeholder": "+351 912 345 678",
    "phone.required": "Phone number is required",
    "phone.invalid": "Invalid phone number",
    "phone.submit": "Confirm Payment",
    "phone.submitting": "Submitting...",
    "phone.waitingTitle": "Waiting for approval",
    "phone.waitingDesc": "Open the app and confirm the payment.",
    "phone.waitingHint": "Do not close this window. You will be redirected automatically.",

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

    // Multibanco
    "multibanco.title": "Multibanco Payment Details",
    "multibanco.entity": "Entity",
    "multibanco.reference": "Reference",
    "multibanco.amount": "Amount",
    "multibanco.hint": "Pay at your nearest ATM or via homebanking.",
    "multibanco.copyEntity": "Copy Entity",
    "multibanco.copyRef": "Copy Reference",
    "multibanco.copied": "Copied",

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
    "error.initiateFailed": "Could not initiate the payment.",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",
  },
  es: {
    // Header
    "header.secure": "Checkout Seguro",

    // Order Block (Block A)
    "block.order.title": "Resumen del Pedido",
    "block.order.reference": "Referencia",
    "block.order.amount": "Total a Pagar",

    // Customer Block (Block B)
    "block.customer.title": "Identificación del Pagador",
    "block.customer.subtitle": "Nombre y email para confirmación.",
    "block.customer.name": "Nombre Completo",
    "block.customer.namePlaceholder": "Juan García",
    "block.customer.nameRequired": "El nombre es obligatorio",
    "block.customer.nameMin": "Mínimo 2 caracteres",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "juan@email.com",
    "block.customer.emailRequired": "El email es obligatorio",
    "block.customer.emailInvalid": "Email inválido",

    // Payment Wall (Block C)
    "block.payment.title": "Selecciona el Método de Pago",
    "block.payment.disabledHint": "Rellena los datos arriba para activar los métodos",

    // Payment Methods
    "method.card": "Tarjeta",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.comingSoon": "Próximamente",

    // Card Payment
    "card.payNow": "Pagar ahora",
    "card.processing": "Procesando pago...",
    "card.encrypted": "Pago encriptado vía Stripe",
    "card.keyMissing": "Stripe Payment Element",
    "card.keyMissingDesc": "La clave pública de Stripe no fue recibida del servidor.",
    "card.crashTitle": "Esperando configuración del Gateway",
    "card.crashDesc": "Stripe no pudo inicializar el pago.\nInténtalo de nuevo más tarde.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Número de Teléfono",
    "phone.placeholder": "+34 612 345 678",
    "phone.required": "El número de teléfono es obligatorio",
    "phone.invalid": "Número de teléfono inválido",
    "phone.submit": "Confirmar Pago",
    "phone.submitting": "Enviando...",
    "phone.waitingTitle": "Esperando aprobación",
    "phone.waitingDesc": "Abre la app y confirma el pago.",
    "phone.waitingHint": "No cierres esta ventana. Serás redirigido automáticamente.",

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

    // Multibanco
    "multibanco.title": "Datos para Pago Multibanco",
    "multibanco.entity": "Entidad",
    "multibanco.reference": "Referencia",
    "multibanco.amount": "Importe",
    "multibanco.hint": "Paga en tu banco más cercano o vía homebanking.",
    "multibanco.copyEntity": "Copiar Entidad",
    "multibanco.copyRef": "Copiar Referencia",
    "multibanco.copied": "Copiado",

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
    "error.initiateFailed": "No se pudo iniciar el pago.",

    // Footer
    "footer.poweredBy": "Powered by",
    "footer.xpayments": "XPayments",
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
    const parts = lang.split("-");
    if (parts.length > 1) {
      const region = parts[1].toUpperCase();
      if (region.length === 2) return region;
    }
    const code = parts[0].toLowerCase();
    const map: Record<string, string> = {
      pt: "PT", en: "US", es: "ES", fr: "FR", de: "DE",
      it: "IT", nl: "NL", be: "BE", ch: "CH", gb: "GB",
      uk: "GB", ie: "IE", lu: "LU", ao: "AO", mz: "MZ", cv: "CV",
    };
    return map[code] || "PT";
  } catch {
    return "PT";
  }
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

const FALLBACK_CONTEXT: I18nContextValue = {
  locale: "pt",
  setLocale: () => {},
  t: (key: string) => translations.pt?.[key] ?? key,
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  return ctx ?? FALLBACK_CONTEXT;
}