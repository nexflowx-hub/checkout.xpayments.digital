"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { OrderBlock } from "@/components/checkout/OrderBlock";
import { CustomerBlock } from "@/components/checkout/CustomerBlock";
import { PaymentWall } from "@/components/checkout/PaymentWall";
import { CardPayment } from "@/components/checkout/methods/CardPayment";
import { PhonePayment } from "@/components/checkout/methods/PhonePayment";
import { AsyncPayment } from "@/components/checkout/methods/AsyncPayment";
import { LanguageSelector } from "@/components/checkout/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { getSession, initiatePayment } from "@/lib/api-client";
import type {
  CheckoutSession,
  PaymentMethodOption,
  PaymentMethodType,
  CheckoutData,
  StripeCheckoutData,
  PixCheckoutData,
  MultibancoCheckoutData,
} from "@/types/checkout";
import {
  formatCurrency,
  isStripeCheckoutData,
  isPixCheckoutData,
  isMultibancoCheckoutData,
} from "@/types/checkout";

// ── PostMessage helpers (iframe ↔ parent window) ──

function notifyParent(status: "SUCCESS" | "CLOSED" | "CANCELLED") {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, "*");
  }
}

// ── Status from URL query ──

function usePaymentStatus() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  return useMemo<"success" | "cancelled" | null>(() => {
    if (statusParam === "success") return "success";
    if (statusParam === "cancelled") return "cancelled";
    return null;
  }, [statusParam]);
}

// ── Checkout result ──

interface CheckoutResult {
  gateway: string;
  checkoutData: CheckoutData;
}

// ── Methods that require phone input before initiating ──

const PHONE_METHODS: PaymentMethodType[] = ["mbway", "bizum"];

// ── Methods that initiate immediately on click ──

const INSTANT_METHODS: PaymentMethodType[] = ["card", "pix", "multibanco"];

// ── Loading Skeleton ──

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        {/* Block A skeleton */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40 mx-auto" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Block B skeleton */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        {/* Block C skeleton */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}

// ── Success Screen ──

const REDIRECT_SECONDS = 3;

function SuccessScreen({ storeName }: { storeName: string }) {
  const { t } = useI18n();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    notifyParent("SUCCESS");
  }, []);

  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    try { window.close(); } catch {}
  }, []);

  const progressPct = ((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-6">
      <div
        className="relative flex items-center justify-center h-20 w-20 rounded-full animate-[success-pop_0.5s_ease-out]"
        style={{ backgroundColor: "#22c55e15" }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color: "#22c55e" }} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t("success.title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("success.thanks")}{" "}
          <span className="text-foreground font-medium">{storeName}</span>.
        </p>
      </div>

      <p className="text-xs text-muted-foreground max-w-[300px]">
        {t("success.email")}
      </p>

      <div className="w-full max-w-[320px] space-y-3 pt-1">
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%`, backgroundColor: "#22c55e" }}
          />
        </div>

        <p className="text-xs text-muted-foreground">{t("success.closeDesc")}</p>

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 text-xs font-medium"
          onClick={handleClose}
        >
          {t("success.closeWindow")}
        </Button>
      </div>
    </div>
  );
}

// ── Error Screen ──

function ErrorScreen({ message }: { message: string }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-5 px-4">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-xl font-bold text-foreground">{t("error.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
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

  // ── Session state ──
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Customer state (Block B) ──
  const [customerValid, setCustomerValid] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "" });

  // ── Payment state (Block C) ──
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);

  // ── Theme control: URL param > session.metadata.theme === 'dark' > default "light" ──
  // Dark mode is ONLY activated when the API returns theme: 'dark' or ?theme=dark is set.
  // No user toggle. No system preference. Merchant-controlled.
  useEffect(() => {
    const forced = searchParams.get("theme");
    if (forced === "dark") {
      setTheme("dark");
      return; // URL param takes precedence
    }
    // Check session metadata for theme preference
    if (session?.metadata?.theme) {
      const theme = session.metadata.theme.toLowerCase();
      if (theme === "dark") {
        setTheme("dark");
        return;
      }
    }
    // No dark preference — always reset to light (merchant default)
    setTheme("light");
  }, [searchParams, session?.metadata?.theme, setTheme]);

  // ── Fetch session ──
  useEffect(() => {
    async function load() {
      const sid = params?.sessionId;
      if (!sid) {
        console.warn("[checkout] sessionId is undefined — router not ready");
        return;
      }

      try {
        console.log("[checkout] Fetching session:", sid);
        const data = await getSession(sid);
        console.log("[checkout] Normalised session:", JSON.stringify(data, null, 2));
        setSession(data);
      } catch (err) {
        console.error("[checkout] Fetch failed:", err);
        setError(err instanceof Error ? err.message : t("error.loadFailed"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params?.sessionId, t]);

  // ── Customer validity callback ──
  const handleCustomerValidityChange = useCallback(
    (isValid: boolean, data: { name: string; email: string }) => {
      setCustomerValid(isValid);
      setCustomerData(data);
    },
    []
  );

  // ── Initiate payment (for instant methods and phone methods) ──
  const doInitiate = useCallback(
    async (methodId: string, phone?: string) => {
      if (!session) return;
      setInitiating(true);
      setInitiateError(null);

      try {
        const payload: {
          sessionId: string;
          paymentMethod: string;
          customer: { name: string; email: string; phone?: string };
        } = {
          sessionId: params.sessionId,
          paymentMethod: methodId,
          customer: {
            name: customerData.name,
            email: customerData.email,
          },
        };

        // Add phone for MBWAY/Bizum
        if (phone) {
          payload.customer.phone = phone;
        }

        console.log("[checkout] Initiating payment:", JSON.stringify(payload, null, 2));
        const result = await initiatePayment(payload);
        console.log("[checkout] Initiate result:", JSON.stringify(result, null, 2));
        setCheckoutResult(result);
      } catch (err) {
        console.error("[checkout] Initiate error:", err);
        setInitiateError(
          err instanceof Error ? err.message : t("error.initiateFailed")
        );
        // On error, allow re-selection
        setSelectedMethod(null);
      } finally {
        setInitiating(false);
      }
    },
    [session, params.sessionId, customerData, t]
  );

  // ── Handle payment method selection ──
  const handleSelectMethod = useCallback(
    (method: PaymentMethodOption) => {
      if (!customerValid) return;

      setSelectedMethod(method);
      setCheckoutResult(null);
      setInitiateError(null);
      setPhoneSubmitted(false);

      // Coming soon — just select visually, no action
      if (method.comingSoon) return;

      // Instant methods: initiate immediately
      if (INSTANT_METHODS.includes(method.id)) {
        doInitiate(method.id);
      }
      // Phone methods (MBWAY/Bizum): show phone input, wait for submission
      // No action here — PhonePayment component handles the submit
    },
    [customerValid, doInitiate]
  );

  // ── Handle phone submission (for MBWAY/Bizum) ──
  const handlePhoneSubmit = useCallback(
    (phone: string) => {
      if (!selectedMethod) return;
      setPhoneSubmitted(true);
      doInitiate(selectedMethod.id, phone);
    },
    [selectedMethod, doInitiate]
  );

  // ── PIX success callback ──
  const handlePixSuccess = useCallback(() => {
    window.location.href = `/pay/${params.sessionId}?status=success`;
  }, [params.sessionId]);

  // ── Derived state ──
  const brandColor = session?.primaryColor || "#111111";
  const isLocked = initiating || !!checkoutResult || phoneSubmitted;
  const amountStr = session ? formatCurrency(session.amount, session.currency) : "";

  // Type-narrowed checkout data
  const stripeData =
    checkoutResult && isStripeCheckoutData(checkoutResult.checkoutData)
      ? checkoutResult.checkoutData
      : null;
  const pixData =
    checkoutResult && isPixCheckoutData(checkoutResult.checkoutData)
      ? checkoutResult.checkoutData
      : null;
  const multibancoData =
    checkoutResult && isMultibancoCheckoutData(checkoutResult.checkoutData)
      ? checkoutResult.checkoutData
      : null;

  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pay/${params.sessionId}?status=success`
    : `/pay/${params.sessionId}?status=success`;

  // ── Render: Loading ──
  if (loading) return <CheckoutSkeleton />;

  // ── Render: Error ──
  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MinimalHeader />
        <main className="flex-1">
          <ErrorScreen message={error || t("error.notFound")} />
        </main>
        <CheckoutFooter />
      </div>
    );
  }

  // ── Render: Success ──
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CheckoutHeader session={session} brandColor={brandColor} />
        <main className="flex-1 flex items-center justify-center px-4">
          <SuccessScreen storeName={session.storeName} />
        </main>
        <CheckoutFooter />
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
          <OrderBlock session={session} brandColor={brandColor} />

          {/* ── Block B: Customer Identification ── */}
          <CustomerBlock
            brandColor={brandColor}
            onValidityChange={handleCustomerValidityChange}
          />

          {/* ── Block C: Payment Wall ── */}
          <PaymentWall
            currency={session.currency}
            enabled={customerValid}
            selectedMethod={selectedMethod?.id ?? null}
            locked={isLocked}
            onSelectMethod={handleSelectMethod}
            brandColor={brandColor}
          />

          {/* ── Initiate Error ── */}
          {initiateError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{initiateError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8 text-xs"
                onClick={() => {
                  setInitiateError(null);
                  setSelectedMethod(null);
                  setCheckoutResult(null);
                  setPhoneSubmitted(false);
                }}
              >
                {t("error.serverError").includes("Tente") ? "Tentar novamente" : "Try again"}
              </Button>
            </div>
          )}

          {/* ── Initiating Spinner ── */}
          {initiating && (
            <div className="rounded-xl border border-border/50 bg-card p-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("block.payment.title")}...
              </p>
            </div>
          )}

          {/* ── Method-Specific Expanders ── */}
          {/* Card: Stripe Payment Element */}
          {selectedMethod?.id === "card" && stripeData && !initiating && (
            <CardPayment
              clientSecret={stripeData.clientSecret}
              publicKey={stripeData.publicKey}
              returnUrl={returnUrl}
              brandColor={brandColor}
              amount={amountStr}
            />
          )}

          {/* MBWAY / Bizum: Phone input or waiting state */}
          {selectedMethod && PHONE_METHODS.includes(selectedMethod.id) && !initiating && (
            <PhonePayment
              method={selectedMethod.id}
              brandColor={brandColor}
              onSubmit={handlePhoneSubmit}
              isSubmitting={false}
              isWaiting={phoneSubmitted}
            />
          )}

          {/* PIX: QR Code + Copy/Paste */}
          {selectedMethod?.id === "pix" && pixData && !initiating && (
            <AsyncPayment
              data={pixData}
              session={session}
              brandColor={brandColor}
              variant="pix"
            />
          )}

          {/* Multibanco: Entity + Reference */}
          {selectedMethod?.id === "multibanco" && multibancoData && !initiating && (
            <AsyncPayment
              data={multibancoData}
              session={session}
              brandColor={brandColor}
              variant="multibanco"
            />
          )}
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}

// ── Exported Page with I18n Provider ──

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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-xs">XP</span>
          </div>
          <span className="font-semibold text-sm text-foreground">XPayments</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 mr-1 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Logo or store name */}
          {session.logoUrl ? (
            <img
              src={session.logoUrl}
              alt={session.storeName}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0"
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

        <div className="flex items-center gap-1">
          <LanguageSelector />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 ml-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">{t("header.secure")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function CheckoutFooter() {
  const { t } = useI18n();

  return (
    <div className="mt-auto flex items-center justify-center gap-1.5 pt-6 pb-3 text-[11px] text-muted-foreground/60">
      <span>{t("footer.poweredBy")}</span>
      <span className="font-semibold text-muted-foreground">
        {t("footer.xpayments")}
      </span>
    </div>
  );
}