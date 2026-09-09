"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentWall } from "@/components/checkout/PaymentWall";
import { CardPayment } from "@/components/checkout/methods/CardPayment";
import { PhonePayment } from "@/components/checkout/methods/PhonePayment";
import { AsyncPayment } from "@/components/checkout/methods/AsyncPayment";
import { StatusScreen } from "@/components/checkout/StatusScreen";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { getSession, initiatePayment } from "@/lib/api-client";
import { usePolling } from "@/hooks/use-polling";
import type { ApiPaymentMethod, CheckoutData, CheckoutSession, CheckoutStep, NormalisedInitiateResult } from "@/types/checkout";
import { formatCurrency, isInstantMethodCode, isMultibancoCheckoutData, isPhoneMethodCode, isStripeCheckoutData } from "@/types/checkout";

function safeTargetOrigin(value: string | null): string {
  if (!value) return "*";
  try { return new URL(value).origin; } catch { return "*"; }
}

function postParent(status: "SUCCESS" | "CLOSED" | "CANCELLED", targetOrigin: string) {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, targetOrigin);
  }
}

function EmbeddedSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-5">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="rounded-2xl border border-border/20 bg-card/60 p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function EmbeddedPaymentInner() {
  const { t } = useI18n();
  const { setTheme } = useTheme();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const parentOrigin = useMemo(() => safeTargetOrigin(searchParams.get("parent_origin")), [searchParams]);

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [step, setStep] = useState<CheckoutStep>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ApiPaymentMethod | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [initiateResult, setInitiateResult] = useState<NormalisedInitiateResult | null>(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "" });
  const successNotified = useRef(false);

  useEffect(() => {
    async function load() {
      if (!params?.sessionId) return;
      try {
        const data = await getSession(params.sessionId);
        setSession(data);
        setCustomerData({
          name: String(data.metadata?.customerName ?? ""),
          email: String(data.metadata?.customerEmail ?? ""),
        });
        const forcedTheme = searchParams.get("theme");
        const merchantTheme = String(data.metadata?.theme ?? "").toLowerCase();
        setTheme(forcedTheme === "dark" || merchantTheme === "dark" ? "dark" : "light");
        const status = String(data.metadata?.checkoutStatus ?? "pending").toLowerCase();
        if (["paid", "completed", "succeeded"].includes(status)) setStep("success");
        else if (status === "expired") setStep("expired");
        else setStep("checkout");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error.loadFailed"));
        setStep("error");
      }
    }
    void load();
  }, [params?.sessionId, searchParams, setTheme, t]);

  const selectedCode = selectedMethod?.code?.toLowerCase().replace(/-/g, "_") || "";
  const pollingEnabled = step === "awaiting" || step === "processing" || (selectedCode === "multibanco" && Boolean(initiateResult));

  const handleSuccess = useCallback(() => {
    setStep("success");
    if (!successNotified.current) {
      successNotified.current = true;
      postParent("SUCCESS", parentOrigin);
    }
  }, [parentOrigin]);

  usePolling({
    sessionId: params?.sessionId || "",
    enabled: pollingEnabled,
    interval: 3000,
    maxAttempts: 200,
    onSuccess: handleSuccess,
    onExpired: () => setStep("expired"),
    onError: (message) => {
      if (!message.startsWith("Status:")) return;
      setInitiateError("Pagamento não concluído. Confirme os dados e tente novamente.");
      setSelectedMethod(null);
      setInitiateResult(null);
      setPhoneSubmitted(false);
      setStep("checkout");
    },
  });

  const checkoutReturnUrl = useMemo(() => {
    if (typeof window === "undefined" || !params?.sessionId) return undefined;
    const url = new URL(`/embed/${params.sessionId}`, window.location.origin);
    url.searchParams.set("return", "1");
    const requestedParentOrigin = searchParams.get("parent_origin");
    if (requestedParentOrigin) url.searchParams.set("parent_origin", requestedParentOrigin);
    const requestedTheme = searchParams.get("theme");
    if (requestedTheme) url.searchParams.set("theme", requestedTheme);
    return url.toString();
  }, [params?.sessionId, searchParams]);

  const doInitiate = useCallback(async (methodCode: string, phone?: string) => {
    if (!session || !params?.sessionId) return;
    setInitiating(true);
    setInitiateError(null);
    try {
      const result = await initiatePayment({
        sessionId: params.sessionId,
        paymentMethod: methodCode,
        returnUrl: checkoutReturnUrl,
        customer: {
          name: customerData.name,
          email: customerData.email,
          ...(phone ? { phone } : {}),
        },
      });
      setInitiateResult(result);
      if (isPhoneMethodCode(methodCode)) setStep("awaiting");
    } catch (err) {
      setInitiateError(err instanceof Error ? err.message : t("error.initiateFailed"));
      setSelectedMethod(null);
      setInitiateResult(null);
      setPhoneSubmitted(false);
    } finally {
      setInitiating(false);
    }
  }, [checkoutReturnUrl, customerData, params?.sessionId, session, t]);

  const handleSelectMethod = useCallback((method: ApiPaymentMethod) => {
    setSelectedMethod(method);
    setInitiateResult(null);
    setInitiateError(null);
    setPhoneSubmitted(false);
    if (isInstantMethodCode(method.code)) void doInitiate(method.code);
  }, [doInitiate]);

  const handleReset = useCallback(() => {
    setSelectedMethod(null);
    setInitiateResult(null);
    setInitiateError(null);
    setPhoneSubmitted(false);
    setStep("checkout");
  }, []);

  if (step === "loading") return <EmbeddedSkeleton />;

  const brandColor = session?.primaryColor || "#111111";
  if (step === "error" || !session) {
    return <div className="min-h-[100dvh] bg-background"><StatusScreen step="error" brandColor={brandColor} errorMessage={error || t("error.notFound")} onRetry={() => window.location.reload()} /></div>;
  }
  if (step === "expired") {
    return <div className="min-h-[100dvh] bg-background"><StatusScreen step="expired" brandColor={brandColor} /></div>;
  }
  if (step === "success") {
    return <div className="min-h-[100dvh] bg-background"><StatusScreen step="success" brandColor={brandColor} storeName={session.storeName} /></div>;
  }
  if (step === "processing" || step === "awaiting" || step === "cancelled") {
    return <div className="min-h-[100dvh] bg-background"><StatusScreen step={step} brandColor={brandColor} storeName={session.storeName} onRetry={handleReset} /></div>;
  }

  const amountText = formatCurrency(session.amount, session.currency);
  const checkoutData: CheckoutData | null = initiateResult?.checkoutData ?? null;
  const stripeData = checkoutData && isStripeCheckoutData(checkoutData) ? checkoutData : null;
  const multibancoData = checkoutData && isMultibancoCheckoutData(checkoutData) ? checkoutData : null;
  const isLocked = initiating || Boolean(initiateResult) || phoneSubmitted;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground px-3 sm:px-4 py-3 sm:py-5">
      <main className="max-w-xl mx-auto w-full space-y-4">
        <PaymentWall
          paymentMethods={session.paymentMethods ?? []}
          enabled
          selectedMethodCode={selectedMethod?.code ?? null}
          locked={isLocked}
          onSelectMethod={handleSelectMethod}
          brandColor={brandColor}
        />

        <AnimatePresence>
          {initiating && (
            <motion.div className="rounded-2xl border border-border/20 bg-card/80 p-8 flex flex-col items-center justify-center space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${brandColor}30`, borderTopColor: "transparent" }} />
              <p className="text-sm text-muted-foreground">{t("initiate.processing")}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {initiateError && !initiating && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4">
            <p className="text-sm text-destructive">{initiateError}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3 h-9 text-xs gap-1.5 rounded-lg" onClick={handleReset}>
              <RotateCcw className="h-3 w-3" />{t("error.tryAgain")}
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedMethod && isPhoneMethodCode(selectedMethod.code) && !initiating && step === "checkout" && (
            <motion.div key="phone-payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PhonePayment method={selectedMethod.code} brandColor={brandColor} onSubmit={(phone) => { setPhoneSubmitted(true); void doInitiate(selectedMethod.code, phone); }} isSubmitting={initiating} isWaiting={phoneSubmitted} />
            </motion.div>
          )}

          {selectedMethod && stripeData && !initiating && (
            <motion.div key={`stripe-${selectedMethod.code}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <CardPayment clientSecret={stripeData.clientSecret} publicKey={stripeData.publicKey} returnUrl={checkoutReturnUrl || window.location.href} brandColor={brandColor} amount={amountText} />
            </motion.div>
          )}

          {selectedCode === "multibanco" && multibancoData && !stripeData && !initiating && (
            <motion.div key="multibanco-payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AsyncPayment data={multibancoData} session={session} brandColor={brandColor} variant="multibanco" onClose={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function EmbeddedCheckoutEntry() {
  return (
    <Suspense fallback={<EmbeddedSkeleton />}>
      <I18nProvider><EmbeddedPaymentInner /></I18nProvider>
    </Suspense>
  );
}
