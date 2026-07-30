"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, ShieldCheck, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderBlock } from "@/components/checkout/OrderBlock";
import { CustomerBlock } from "@/components/checkout/CustomerBlock";
import { PaymentWall } from "@/components/checkout/PaymentWall";
import { CardPayment } from "@/components/checkout/methods/CardPayment";
import { PhonePayment } from "@/components/checkout/methods/PhonePayment";
import { AsyncPayment } from "@/components/checkout/methods/AsyncPayment";
import { StatusScreen } from "@/components/checkout/StatusScreen";
import { LanguageSelector } from "@/components/checkout/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { getSession, initiatePayment } from "@/lib/api-client";
import { usePolling } from "@/hooks/use-polling";
import type {
  ApiPaymentMethod,
  CheckoutData,
  CheckoutSession,
  CheckoutStep,
  NormalisedInitiateResult,
} from "@/types/checkout";
import {
  formatCurrency,
  isInstantMethodCode,
  isMultibancoCheckoutData,
  isPhoneMethodCode,
  isPixCheckoutData,
  isStripeCheckoutData,
} from "@/types/checkout";

function notifyParent(status: "SUCCESS" | "CLOSED" | "CANCELLED") {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, "*");
  }
}

function usePaymentStatus() {
  const searchParams = useSearchParams();

  return useMemo<"success" | "cancelled" | null>(() => {
    const status = searchParams.get("status");
    if (status === "success") return "success";
    if (status === "cancelled") return "cancelled";
    return null;
  }, [searchParams]);
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 space-y-4">
        {["order", "customer", "methods"].map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-border/20 bg-card/60 p-5 sm:p-6 space-y-4"
          >
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ))}
      </main>
    </div>
  );
}

function CheckoutPageInner() {
  const { t } = useI18n();
  const { setTheme } = useTheme();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const paymentStatus = usePaymentStatus();

  const [step, setStep] = useState<CheckoutStep>("loading");
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [customerValid, setCustomerValid] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "" });

  const [selectedMethod, setSelectedMethod] = useState<ApiPaymentMethod | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [initiateResult, setInitiateResult] = useState<NormalisedInitiateResult | null>(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);

  useEffect(() => {
    const forcedTheme = searchParams.get("theme");
    const merchantTheme = String(session?.metadata?.theme ?? "").toLowerCase();
    setTheme(forcedTheme === "dark" || merchantTheme === "dark" ? "dark" : "light");
  }, [searchParams, session?.metadata?.theme, setTheme]);

  useEffect(() => {
    async function load() {
      const sessionId = params?.sessionId;
      if (!sessionId) return;

      try {
        const data = await getSession(sessionId);
        setSession(data);

        const status = String(data.metadata?.checkoutStatus ?? "pending").toLowerCase();
        if (["paid", "completed", "succeeded"].includes(status)) {
          setStep("success");
        } else if (status === "expired") {
          setStep("expired");
        } else {
          setStep("checkout");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error.loadFailed"));
        setStep("error");
      }
    }

    void load();
  }, [params?.sessionId, t]);

  const handlePollingSuccess = useCallback(() => {
    setStep("success");
    notifyParent("SUCCESS");
  }, []);

  const handlePollingExpired = useCallback(() => {
    setStep("expired");
  }, []);

  const pollingEnabled =
    step === "awaiting" ||
    step === "processing";

  usePolling({
    sessionId: params?.sessionId || "",
    enabled: pollingEnabled,
    interval: 3000,
    maxAttempts: 200,
    onSuccess: handlePollingSuccess,
    onExpired: handlePollingExpired,
    onError: (message) => {
      if (!message.startsWith("Status:")) return;
      setInitiateError(message);
      setStep("checkout");
    },
  });

  const handleCustomerValidityChange = useCallback(
    (isValid: boolean, data: { name: string; email: string }) => {
      setCustomerValid(isValid);
      setCustomerData(data);
    },
    []
  );

  const doInitiate = useCallback(
    async (methodCode: string, phone?: string) => {
      if (!session || !params.sessionId) return;

      setInitiating(true);
      setInitiateError(null);

      try {
        const result = await initiatePayment({
          sessionId: params.sessionId,
          paymentMethod: methodCode,
          customer: {
            name: customerData.name,
            email: customerData.email,
            ...(phone ? { phone } : {}),
          },
        });

        setInitiateResult(result);

        if (isPhoneMethodCode(methodCode)) {
          setStep("awaiting");
        }
      } catch (err) {
        setInitiateError(
          err instanceof Error ? err.message : t("error.initiateFailed")
        );
        setSelectedMethod(null);
        setInitiateResult(null);
      } finally {
        setInitiating(false);
      }
    },
    [customerData, params.sessionId, session, t]
  );

  const handleSelectMethod = useCallback(
    (method: ApiPaymentMethod) => {
      if (!customerValid) return;

      setSelectedMethod(method);
      setInitiateResult(null);
      setInitiateError(null);
      setPhoneSubmitted(false);

      if (isInstantMethodCode(method.code)) {
        void doInitiate(method.code);
      }
    },
    [customerValid, doInitiate]
  );

  const handlePhoneSubmit = useCallback(
    (phone: string) => {
      if (!selectedMethod) return;
      setPhoneSubmitted(true);
      void doInitiate(selectedMethod.code, phone);
    },
    [doInitiate, selectedMethod]
  );

  const handleReset = useCallback(() => {
    setSelectedMethod(null);
    setInitiateResult(null);
    setInitiateError(null);
    setPhoneSubmitted(false);
    setStep("checkout");
  }, []);

  if (step === "loading") return <CheckoutSkeleton />;

  const brandColor = session?.primaryColor || "#111111";

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

  const amountText = formatCurrency(session.amount, session.currency);
  const checkoutData: CheckoutData | null = initiateResult?.checkoutData ?? null;
  const stripeData = checkoutData && isStripeCheckoutData(checkoutData) ? checkoutData : null;
  const pixData = checkoutData && isPixCheckoutData(checkoutData) ? checkoutData : null;
  const multibancoData =
    checkoutData && isMultibancoCheckoutData(checkoutData) ? checkoutData : null;
  const isLocked = initiating || Boolean(initiateResult) || phoneSubmitted;
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${params.sessionId}?status=success`
      : `/pay/${params.sessionId}?status=success`;

  const initialName = String(session.metadata?.customerName ?? "");
  const initialEmail = String(session.metadata?.customerEmail ?? "");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CheckoutHeader session={session} brandColor={brandColor} />

      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-8">
        <div className="max-w-xl mx-auto w-full space-y-4 sm:space-y-5">
          <OrderBlock
            session={session}
            brandColor={brandColor}
            onExpire={() => setStep("expired")}
          />

          <CustomerBlock
            key={`${session.sessionId}:${initialName}:${initialEmail}`}
            brandColor={brandColor}
            initialName={initialName}
            initialEmail={initialEmail}
            onValidityChange={handleCustomerValidityChange}
          />

          <PaymentWall
            paymentMethods={session.paymentMethods ?? []}
            enabled={customerValid}
            selectedMethodCode={selectedMethod?.code ?? null}
            locked={isLocked}
            onSelectMethod={handleSelectMethod}
            brandColor={brandColor}
          />

          <AnimatePresence>
            {initiating && (
              <motion.div
                className="rounded-2xl border border-border/20 bg-card/80 backdrop-blur-sm p-8 flex flex-col items-center justify-center space-y-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div
                  className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${brandColor}30`, borderTopColor: "transparent" }}
                />
                <p className="text-sm text-muted-foreground">
                  {t("initiate.processing")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {initiateError && !initiating && (
              <motion.div
                className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="text-sm text-destructive">{initiateError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-9 text-xs gap-1.5 rounded-lg"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("error.tryAgain")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {selectedMethod &&
              isPhoneMethodCode(selectedMethod.code) &&
              !initiating &&
              step === "checkout" && (
                <motion.div
                  key="phone-payment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <PhonePayment
                    method={selectedMethod.code}
                    brandColor={brandColor}
                    onSubmit={handlePhoneSubmit}
                    isSubmitting={initiating}
                    isWaiting={phoneSubmitted}
                  />
                </motion.div>
              )}

            {selectedMethod && stripeData && !initiating && (
              <motion.div
                key={`stripe-${selectedMethod.code}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CardPayment
                  clientSecret={stripeData.clientSecret}
                  publicKey={stripeData.publicKey}
                  returnUrl={returnUrl}
                  brandColor={brandColor}
                  amount={amountText}
                />
              </motion.div>
            )}

            {selectedMethod?.code?.toLowerCase() === "pix" &&
              pixData &&
              !stripeData &&
              !initiating && (
                <motion.div
                  key="pix-payment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AsyncPayment
                    data={pixData}
                    session={session}
                    brandColor={brandColor}
                    variant="pix"
                  />
                </motion.div>
              )}

            {selectedMethod?.code?.toLowerCase() === "multibanco" &&
              multibancoData &&
              !stripeData &&
              !initiating && (
                <motion.div
                  key="multibanco-payment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AsyncPayment
                    data={multibancoData}
                    session={session}
                    brandColor={brandColor}
                    variant="multibanco"
                    onClose={handleReset}
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

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/20">
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
          <span className="text-background font-bold text-[10px] tracking-tight">XP</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
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
    try {
      window.close();
    } catch {
      // Browser may block window.close for regular tabs.
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/20">
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-lg"
            aria-label={t("header.close")}
          >
            <X className="h-4 w-4" />
          </Button>

          {session.logoUrl ? (
            <img
              src={session.logoUrl}
              alt={session.storeName}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 tracking-tight"
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("header.secure")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function MinimalFooter() {
  const { t } = useI18n();

  return (
    <div className="mt-auto flex items-center justify-center gap-1.5 pt-6 pb-4 sm:pb-5 text-[11px] text-muted-foreground/30">
      <span>{t("footer.poweredBy")}</span>
      <span className="font-semibold text-muted-foreground/40">
        {t("footer.xpayments")}
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <I18nProvider>
        <CheckoutPageInner />
      </I18nProvider>
    </Suspense>
  );
}
