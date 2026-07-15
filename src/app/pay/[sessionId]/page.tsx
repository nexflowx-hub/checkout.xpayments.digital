"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  X,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { OrderBlock } from "@/components/checkout/OrderBlock";
import { CustomerBlock } from "@/components/checkout/CustomerBlock";
import { PaymentWall } from "@/components/checkout/PaymentWall";
import { CardPayment } from "@/components/checkout/methods/CardPayment";
import { PhonePayment } from "@/components/checkout/methods/PhonePayment";
import { AsyncPayment } from "@/components/checkout/methods/AsyncPayment";
import { StatusScreen } from "@/components/checkout/StatusScreen";
import { LanguageSelector } from "@/components/checkout/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useCountry } from "@/hooks/use-country";
import { usePolling } from "@/hooks/use-polling";
import { getSession, initiatePayment } from "@/lib/api-client";
import type {
  CheckoutSession,
  PaymentMethodOption,
  PaymentMethodType,
  CheckoutData,
  NormalisedInitiateResult,
  StripeCheckoutData,
  PixCheckoutData,
  MultibancoCheckoutData,
  CheckoutStep,
} from "@/types/checkout";
import {
  formatCurrency,
  isStripeCheckoutData,
  isPixCheckoutData,
  isMultibancoCheckoutData,
  PHONE_METHODS,
  INSTANT_METHODS,
} from "@/types/checkout";

// ── PostMessage helpers ──

function notifyParent(status: "SUCCESS" | "CLOSED" | "CANCELLED") {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, "*");
  }
}

// ── Status from URL query ──

function usePaymentStatus() {
  const searchParams = useSearchParams();
  return useMemo<"success" | "cancelled" | null>(() => {
    const s = searchParams.get("status");
    if (s === "success") return "success";
    if (s === "cancelled") return "cancelled";
    return null;
  }, [searchParams]);
}

// ── Loading Skeleton ──

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        {/* Block A skeleton */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-14 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Block B skeleton */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>

        {/* Block C skeleton */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </main>

      <MinimalFooter />
    </div>
  );
}

// ── Main Checkout Page (inner, uses I18n context) ──

function CheckoutPageInner() {
  const { t } = useI18n();
  const { setTheme } = useTheme();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const paymentStatus = usePaymentStatus();
  const countryCode = useCountry();

  // ── Step state ──
  const [step, setStep] = useState<CheckoutStep>("loading");

  // ── Session state ──
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Customer state ──
  const [customerValid, setCustomerValid] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "" });

  // ── Payment state ──
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [initiateResult, setInitiateResult] = useState<NormalisedInitiateResult | null>(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);

  // ── Theme: merchant-controlled only ──
  useEffect(() => {
    const forced = searchParams.get("theme");
    if (forced === "dark") { setTheme("dark"); return; }
    if (session?.metadata?.theme) {
      const theme = session.metadata.theme.toLowerCase();
      if (theme === "dark") { setTheme("dark"); return; }
    }
    setTheme("light");
  }, [searchParams, session?.metadata?.theme, setTheme]);

  // ── Fetch session ──
  useEffect(() => {
    async function load() {
      const sid = params?.sessionId;
      if (!sid) return;

      try {
        const data = await getSession(sid);
        setSession(data);
        setStep("checkout");
      } catch (err) {
        console.error("[checkout] Fetch failed:", err);
        setError(err instanceof Error ? err.message : t("error.loadFailed"));
        setStep("error");
      }
    }
    load();
  }, [params?.sessionId, t]);

  // ── Payment status polling (for phone methods + PIX) ──
  const isPollingTarget = step === "awaiting" || (step === "checkout" && initiateResult && (
    selectedMethod?.id === "pix"
  ));

  const handlePollingSuccess = useCallback(() => {
    setStep("success");
  }, []);

  const handlePollingExpired = useCallback(() => {
    setStep("expired");
  }, []);

  usePolling({
    sessionId: params?.sessionId || "",
    interval: 3000,
    maxAttempts: 200,
    onSuccess: handlePollingSuccess,
    onExpired: handlePollingExpired,
  });

  // ── Customer validity callback ──
  const handleCustomerValidityChange = useCallback(
    (isValid: boolean, data: { name: string; email: string }) => {
      setCustomerValid(isValid);
      setCustomerData(data);
    },
    []
  );

  // ── Initiate payment ──
  const doInitiate = useCallback(
    async (methodId: string, phone?: string) => {
      if (!session) return;
      setInitiating(true);
      setInitiateError(null);

      try {
        const payload = {
          sessionId: params.sessionId,
          paymentMethod: methodId,
          customer: {
            name: customerData.name,
            email: customerData.email,
            ...(phone ? { phone } : {}),
          },
        };

        const result = await initiatePayment(payload);
        setInitiateResult(result);

        // Set step based on method type
        if (PHONE_METHODS.includes(methodId as PaymentMethodType)) {
          setStep("awaiting");
        }
        // For card/pix/multibanco, stay in checkout step (gateway UI renders)
      } catch (err) {
        console.error("[checkout] Initiate error:", err);
        setInitiateError(
          err instanceof Error ? err.message : t("error.initiateFailed")
        );
        setSelectedMethod(null);
      } finally {
        setInitiating(false);
      }
    },
    [session, params.sessionId, customerData, t]
  );

  // ── Handle method selection ──
  const handleSelectMethod = useCallback(
    (method: PaymentMethodOption) => {
      if (!customerValid) return;

      setSelectedMethod(method);
      setInitiateResult(null);
      setInitiateError(null);
      setPhoneSubmitted(false);

      if (method.comingSoon) return;

      // Instant methods initiate immediately
      if (INSTANT_METHODS.includes(method.id)) {
        doInitiate(method.id);
      }
      // Phone methods: show phone input (PhonePayment handles submit)
    },
    [customerValid, doInitiate]
  );

  // ── Phone submission ──
  const handlePhoneSubmit = useCallback(
    (phone: string) => {
      if (!selectedMethod) return;
      setPhoneSubmitted(true);
      doInitiate(selectedMethod.id, phone);
    },
    [selectedMethod, doInitiate]
  );

  // ── Reset to method selection ──
  const handleReset = useCallback(() => {
    setSelectedMethod(null);
    setInitiateResult(null);
    setInitiateError(null);
    setPhoneSubmitted(false);
    setStep("checkout");
  }, []);

  // ── Session expire ──
  const handleSessionExpire = useCallback(() => {
    setStep("expired");
  }, []);

  // ── Multibanco close ──
  const handleCloseMultibanco = useCallback(() => {
    handleReset();
  }, [handleReset]);

  // ── Derived values ──
  const brandColor = session?.primaryColor || "#111111";
  const isLocked = initiating || !!initiateResult || phoneSubmitted;
  const amountStr = session ? formatCurrency(session.amount, session.currency) : "";

  const checkoutData: CheckoutData | null = initiateResult?.checkoutData ?? null;
  const stripeData = checkoutData && isStripeCheckoutData(checkoutData) ? checkoutData : null;
  const pixData = checkoutData && isPixCheckoutData(checkoutData) ? checkoutData : null;
  const multibancoData = checkoutData && isMultibancoCheckoutData(checkoutData) ? checkoutData : null;

  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pay/${params.sessionId}?status=success`
    : `/pay/${params.sessionId}?status=success`;

  // ── Render: Loading ──
  if (step === "loading") return <CheckoutSkeleton />;

  // ── Render: Error ──
  if (step === "error" || !session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MinimalHeader />
        <main className="flex-1">
          <StatusScreen
            step="error"
            brandColor={brandColor}
            errorMessage={error || t("error.notFound")}
            onRetry={() => window.location.reload()}
          />
        </main>
        <MinimalFooter />
      </div>
    );
  }

  // ── Render: Expired ──
  if (step === "expired") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CheckoutHeader session={session} brandColor={brandColor} />
        <main className="flex-1 flex items-center justify-center px-4">
          <StatusScreen step="expired" brandColor={brandColor} />
        </main>
        <MinimalFooter />
      </div>
    );
  }

  // ── Render: Success ──
  if (step === "success" || paymentStatus === "success") {
    const merchantReturnUrl =
      session.returnUrl ||
      session.metadata?.returnUrl ||
      searchParams.get("return_url") ||
      undefined;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CheckoutHeader session={session} brandColor={brandColor} />
        <main className="flex-1 flex items-center justify-center px-4">
          <StatusScreen
            step="success"
            brandColor={brandColor}
            storeName={session.storeName}
            returnUrl={merchantReturnUrl}
          />
        </main>
        <MinimalFooter />
      </div>
    );
  }

  // ── Render: Processing / Awaiting (standalone status screens) ──
  if (step === "processing" || step === "awaiting" || step === "cancelled") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CheckoutHeader session={session} brandColor={brandColor} />
        <main className="flex-1 flex items-center justify-center px-4">
          <StatusScreen
            step={step}
            brandColor={brandColor}
            storeName={session.storeName}
            onRetry={handleReset}
          />
        </main>
        <MinimalFooter />
      </div>
    );
  }

  // ── Render: Main Single-Screen Checkout ──
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CheckoutHeader session={session} brandColor={brandColor} />

      <main className="flex-1 px-4 py-5 sm:py-8">
        <div className="max-w-lg mx-auto w-full space-y-4">
          {/* ── Block A: Order Summary ── */}
          <OrderBlock
            session={session}
            brandColor={brandColor}
            onExpire={handleSessionExpire}
          />

          {/* ── Block B: Customer Identification ── */}
          <CustomerBlock
            brandColor={brandColor}
            onValidityChange={handleCustomerValidityChange}
          />

          {/* ── Block C: Payment Wall ── */}
          <PaymentWall
            currency={session.currency}
            countryCode={countryCode}
            enabled={customerValid}
            selectedMethod={selectedMethod?.id ?? null}
            locked={isLocked}
            onSelectMethod={handleSelectMethod}
            brandColor={brandColor}
          />

          {/* ── Initiating state ── */}
          <AnimatePresence>
            {initiating && (
              <motion.div
                className="rounded-2xl border border-border/40 bg-card p-8 flex flex-col items-center justify-center space-y-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${brandColor}40`, borderTopColor: "transparent" }}
                />
                <p className="text-sm text-muted-foreground">
                  {t("initiate.processing")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Initiate Error (resilient) ── */}
          <AnimatePresence>
            {initiateError && !initiating && (
              <motion.div
                className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-destructive">{initiateError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 text-xs gap-1.5"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("error.tryAgain")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Gateway-specific rendering based on initiate response ── */}

          <AnimatePresence>
            {/* CARD → Payment Element (dynamic publicKey from providerAction) */}
            {selectedMethod?.id === "card" && stripeData && !initiating && (
              <motion.div
                key="card-payment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <CardPayment
                  clientSecret={stripeData.clientSecret}
                  publicKey={stripeData.publicKey}
                  returnUrl={returnUrl}
                  brandColor={brandColor}
                  amount={amountStr}
                />
              </motion.div>
            )}

            {/* MBWAY / BIZUM → Phone input → Waiting state */}
            {selectedMethod && PHONE_METHODS.includes(selectedMethod.id) && !initiating && (
              <motion.div
                key="phone-payment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <PhonePayment
                  method={selectedMethod.id}
                  brandColor={brandColor}
                  onSubmit={handlePhoneSubmit}
                  isSubmitting={false}
                  isWaiting={phoneSubmitted}
                />
              </motion.div>
            )}

            {/* PIX → QR Code + Copy/Paste */}
            {selectedMethod?.id === "pix" && pixData && !initiating && (
              <motion.div
                key="pix-payment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <AsyncPayment
                  data={pixData}
                  session={session}
                  brandColor={brandColor}
                  variant="pix"
                />
              </motion.div>
            )}

            {/* MULTIBANCO → Entity + Reference + Close */}
            {selectedMethod?.id === "multibanco" && multibancoData && !initiating && (
              <motion.div
                key="multibanco-payment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <AsyncPayment
                  data={multibancoData}
                  session={session}
                  brandColor={brandColor}
                  variant="multibanco"
                  onClose={handleCloseMultibanco}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MinimalFooter />
    </div>
  );
}

// ── Exported Page ──

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <I18nProvider>
        <CheckoutPageInner />
      </I18nProvider>
    </Suspense>
  );
}

// ── Sub-components ──

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-[10px] tracking-tight">XP</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">{t_global("header.secure")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// Quick access to translation outside I18n context (for MinimalHeader)
function t_global(key: string): string {
  const map: Record<string, Record<string, string>> = {
    "header.secure": { pt: "Checkout Seguro", en: "Secure Checkout", es: "Checkout Seguro", fr: "Paiement Sécurisé" },
  };
  try {
    const lang = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";
    return map[key]?.[lang] ?? map[key]?.en ?? key;
  } catch {
    return map[key]?.en ?? key;
  }
}

function CheckoutHeader({
  session,
  brandColor,
}: {
  session: CheckoutSession;
  brandColor: string;
}) {
  const { t } = useI18n();

  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    try { window.close(); } catch {}
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 mr-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t("header.close")}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Logo or store name (white-label) */}
          {session.logoUrl ? (
            <img
              src={session.logoUrl}
              alt={session.storeName}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {session.storeName.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-foreground truncate">
                {session.storeName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 shrink-0">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">{t("header.secure")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function MinimalFooter() {
  const { t } = useI18n();

  const poweredBy = t("footer.poweredBy");
  const xpayments = t("footer.xpayments");
  const secure = t("footer.secure");

  return (
    <div className="mt-auto flex items-center justify-center gap-1.5 pt-6 pb-3 text-[11px] text-muted-foreground/40">
      {poweredBy && xpayments ? (
        <>
          <span>{poweredBy}</span>
          <span className="font-semibold text-muted-foreground/50">{xpayments}</span>
        </>
      ) : (
        <span>{secure}</span>
      )}
    </div>
  );
}