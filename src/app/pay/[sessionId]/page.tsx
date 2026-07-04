"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  QrCode,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { OrderSummary, CompactOrderSummary } from "@/components/checkout/OrderSummary";
import { CustomerDetailsForm } from "@/components/checkout/CustomerDetailsForm";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import { PixPaymentForm } from "@/components/checkout/PixPaymentForm";
import { ThemeToggle } from "@/components/checkout/ThemeToggle";
import { LanguageSelector } from "@/components/checkout/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { getSession, initiateCheckout } from "@/lib/api-client";
import type {
  CheckoutSession,
  CustomerDetails,
  CheckoutData,
} from "@/types/checkout";
import {
  formatCurrency,
  isStripeGateway,
  isPixGateway,
  isStripeCheckoutData,
  isPixCheckoutData,
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

// ── Minimal Header (no session data needed) ──

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-[10px] sm:text-xs">XP</span>
          </div>
          <span className="font-semibold text-xs sm:text-sm text-foreground">
            XPayments
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Loading Skeleton ──

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MinimalHeader />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-24" />
            <div className="h-px bg-border" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full mt-2" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Success Screen ──

const REDIRECT_SECONDS = 3;

function SuccessScreen({
  storeName,
}: {
  storeName: string;
}) {
  const { t } = useI18n();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  // Notify parent iframe that payment succeeded
  useEffect(() => {
    notifyParent("SUCCESS");
  }, []);

  // Close window / notify parent
  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    try { window.close(); } catch {}
  }, []);

  const progressPct = ((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-6">
      {/* Animated checkmark */}
      <div
        className="relative flex items-center justify-center h-20 w-20 rounded-full animate-[success-pop_0.5s_ease-out]"
        style={{ backgroundColor: "#22c55e15" }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color: "#22c55e" }} />
      </div>

      {/* Title + store name */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t("success.title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("success.thanks")}{" "}
          <span className="text-foreground font-medium">{storeName}</span>.
        </p>
      </div>

      {/* Email confirmation note */}
      <p className="text-xs text-muted-foreground max-w-[300px]">
        {t("success.email")}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-[320px] space-y-3 pt-1">
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progressPct}%`,
              backgroundColor: "#22c55e",
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {t("success.closeDesc")}
        </p>

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
    <div className="min-h-screen flex flex-col bg-background">
      <MinimalHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">{t("error.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
      <CheckoutFooter />
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

  // ── Feature 1: Force theme from URL param (?theme=light|dark) ──
  useEffect(() => {
    const forced = searchParams.get("theme");
    if (forced === "light" || forced === "dark") {
      setTheme(forced);
    }
  }, [searchParams, setTheme]);

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step management
  const [step, setStep] = useState<"customer_details" | "payment">("customer_details");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  // Fetch session — defensive: guard against undefined params
  useEffect(() => {
    async function load() {
      const sid = params?.sessionId;
      if (!sid) {
        console.warn("[checkout] sessionId is undefined — router not ready");
        return;
      }

      try {
        console.log("[checkout] 1. Fetching session:", sid);
        const data = await getSession(sid);
        console.log("[checkout] 2. Normalised session:", JSON.stringify(data, null, 2));
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

  // Submit customer details — CRITICAL: only sessionId + customerDetails, NO price/currency
  const handleCustomerSubmit = useCallback(
    async (customerDetails: CustomerDetails) => {
      if (!session) return;
      setInitiating(true);
      setInitiateError(null);

      try {
        const result = await initiateCheckout({
          sessionId: params.sessionId,
          customerDetails,
        });
        setCheckoutResult(result);
        setStep("payment");
      } catch (err) {
        console.error("[checkout] initiate error:", err);
        setInitiateError(
          err instanceof Error ? err.message : t("error.serverError")
        );
      } finally {
        setInitiating(false);
      }
    },
    [session, params.sessionId, t]
  );

  const handleGoBack = useCallback(() => {
    setStep("customer_details");
    setCheckoutResult(null);
    setInitiateError(null);
  }, []);

  const handlePixSuccess = useCallback(() => {
    window.location.href = `/pay/${params.sessionId}?status=success`;
  }, [params.sessionId]);

  // ── Render states ──

  if (loading) return <CheckoutSkeleton />;
  if (error) return <ErrorScreen message={error} />;
  if (!session) return <ErrorScreen message={t("error.notFound")} />;

  // Block access if session is explicitly not OPEN (tolerates missing status — normalised to OPEN)
  if (session.status && session.status !== "OPEN" && paymentStatus !== "success") {
    return <ErrorScreen message={t("error.notFound")} />;
  }

  const brandColor = session.primaryColor || "#111111";

  // Success screen
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

  // Gateway resolution
  const gateway = checkoutResult?.gateway ?? "";
  const isStripe = isStripeGateway(gateway);
  const isPix = isPixGateway(gateway);
  const stripeData =
    checkoutResult && isStripeCheckoutData(checkoutResult.checkoutData)
      ? checkoutResult.checkoutData
      : null;
  const pixData =
    checkoutResult && isPixCheckoutData(checkoutResult.checkoutData)
      ? checkoutResult.checkoutData
      : null;

  const returnUrl = `${window.location.origin}/pay/${params.sessionId}?status=success`;
  const amountStr = formatCurrency(session.amountFiat, session.currency);

  // ── STEP 1: Lead Capture ──
  if (step === "customer_details") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CheckoutHeader session={session} brandColor={brandColor} />

        <main className="flex-1 px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
            {/* Left: Order Summary (desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="rounded-xl border border-border/50 bg-card sticky top-20">
                <OrderSummary session={session} brandColor={brandColor} />
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3 w-full">
              <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 lg:p-8">
                {/* Mobile order summary */}
                <div className="lg:hidden mb-6 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <CompactOrderSummary
                    session={session}
                    brandColor={brandColor}
                  />
                </div>

                <div className="space-y-1 mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    {t("step1.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("step1.subtitle")}
                  </p>
                </div>

                {initiateError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-5">
                    <p className="text-sm text-destructive">{initiateError}</p>
                  </div>
                )}

                <CustomerDetailsForm
                  onSubmit={handleCustomerSubmit}
                  brandColor={brandColor}
                />
              </div>

              <CheckoutFooter />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── STEP 2: Payment ──
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CheckoutHeader
        session={session}
        brandColor={brandColor}
        onBack={handleGoBack}
        showBack
      />

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto w-full">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Compact order bar */}
            <div className="px-5 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
              <CompactOrderSummary
                session={session}
                brandColor={brandColor}
              />
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              {/* Gateway icon + label */}
              <div className="flex items-center gap-2.5 mb-5">
                {isPix ? (
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-lg"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <QrCode className="h-4 w-4" style={{ color: brandColor }} />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-lg"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <CreditCard className="h-4 w-4" style={{ color: brandColor }} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isPix ? t("step2.pix.title") : t("step2.stripe.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPix
                      ? t("step2.pix.subtitle")
                      : t("step2.stripe.subtitle")}
                  </p>
                </div>
              </div>

              <Separator className="mb-5" />

              {/* Payment content */}
              {initiating ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("step2.preparing")}
                  </p>
                </div>
              ) : isStripe && stripeData ? (
                <StripePaymentForm
                  clientSecret={stripeData.clientSecret}
                  publicKey={stripeData.publicKey}
                  returnUrl={returnUrl}
                  brandColor={brandColor}
                  amount={amountStr}
                />
              ) : isPix && pixData ? (
                <PixPaymentForm
                  checkoutData={pixData}
                  brandColor={brandColor}
                  session={session}
                  onSuccess={handlePixSuccess}
                />
              ) : (
                <ErrorScreen message={t("step2.unsupported")} />
              )}
            </div>
          </div>

          <CheckoutFooter />
        </div>
      </main>
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

function CheckoutHeader({
  session,
  brandColor,
  onBack,
  showBack,
}: {
  session: CheckoutSession;
  brandColor: string;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const { t } = useI18n();

  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    try { window.close(); } catch {}
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Close button — visible when inside iframe or as overlay */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 mr-1 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {session.logoUrl ? (
            <img
              src={session.logoUrl}
              alt={session.storeName}
              className="h-6 w-auto sm:h-7 max-w-[120px] sm:max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-md flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {session.storeName.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                {session.storeName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Language selector */}
          <LanguageSelector />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Secure badge */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-1">
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">
              {t("header.secure")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function CheckoutFooter() {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6 pb-2 text-[11px] text-muted-foreground/60">
      <span>{t("footer.poweredBy")}</span>
      <span className="font-semibold text-muted-foreground">
        {t("footer.xpayments")}
      </span>
    </div>
  );
}