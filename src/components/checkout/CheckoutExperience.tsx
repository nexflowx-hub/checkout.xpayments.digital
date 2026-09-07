"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, ShieldCheck, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderBlock } from "@/components/checkout/OrderBlock";
import { CustomerBlock } from "@/components/checkout/CustomerBlock";
import { PaymentWall } from "@/components/checkout/PaymentWall";
import { StatusScreen } from "@/components/checkout/StatusScreen";
import { LanguageSelector } from "@/components/checkout/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { initiatePayment } from "@/lib/api-client";
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

const CardPayment = dynamic(
  () => import("@/components/checkout/methods/CardPayment").then((mod) => mod.CardPayment),
  { loading: () => <MethodLoading /> }
);

const PhonePayment = dynamic(
  () => import("@/components/checkout/methods/PhonePayment").then((mod) => mod.PhonePayment),
  { loading: () => <MethodLoading /> }
);

const AsyncPayment = dynamic(
  () => import("@/components/checkout/methods/AsyncPayment").then((mod) => mod.AsyncPayment),
  { loading: () => <MethodLoading /> }
);

const PixPaymentForm = dynamic(
  () => import("@/components/checkout/PixPaymentForm").then((mod) => mod.PixPaymentForm),
  { loading: () => <MethodLoading /> }
);

export interface CheckoutQuery {
  embedded?: string;
  return?: string;
  status?: string;
  parent_origin?: string;
  theme?: string;
}

interface CheckoutExperienceProps {
  sessionId: string;
  initialSession: CheckoutSession | null;
  initialError?: string | null;
  query?: CheckoutQuery;
}

function parseOrigin(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function postParent(payload: Record<string, unknown>, targetOrigin: string | null) {
  if (!targetOrigin || typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(payload, targetOrigin);
}

function statusToStep(
  session: CheckoutSession | null,
  initialError: string | null | undefined,
  returnedFromProvider: boolean
): CheckoutStep {
  if (initialError || !session) return "error";

  const status = String(session.metadata?.checkoutStatus ?? "pending").toLowerCase();
  if (["paid", "completed", "succeeded"].includes(status)) return "success";
  if (status === "expired") return "expired";
  if (["failed", "cancelled", "canceled"].includes(status)) return "checkout";
  if (returnedFromProvider) return "processing";
  return "checkout";
}

function MethodLoading() {
  return (
    <div className="rounded-[24px] border border-border/40 bg-card/90 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
      </div>
      <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
    </div>
  );
}

function CheckoutExperienceInner({
  sessionId,
  initialSession: session,
  initialError,
  query = {},
}: CheckoutExperienceProps) {
  const { t } = useI18n();
  const { setTheme } = useTheme();

  const embedded = query.embedded === "1";
  const returnedFromProvider = query.return === "1" || query.status === "success";

  const [step, setStep] = useState<CheckoutStep>(() =>
    statusToStep(session, initialError, returnedFromProvider)
  );
  const [error] = useState<string | null>(initialError || null);
  const [customerValid, setCustomerValid] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "" });
  const [selectedMethod, setSelectedMethod] = useState<ApiPaymentMethod | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(() => {
    const status = String(session?.metadata?.checkoutStatus ?? "pending").toLowerCase();
    return ["failed", "cancelled", "canceled"].includes(status)
      ? "O pagamento anterior não foi concluído. Pode tentar novamente."
      : null;
  });
  const [initiateResult, setInitiateResult] = useState<NormalisedInitiateResult | null>(null);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const successNotified = useRef(false);
  const readyNotified = useRef(false);

  const requestedParentOrigin = useMemo(
    () => parseOrigin(query.parent_origin),
    [query.parent_origin]
  );

  const configuredAllowedOrigin = useMemo(
    () => parseOrigin(session?.metadata?.allowedOrigin),
    [session?.metadata?.allowedOrigin]
  );

  const parentOrigin = useMemo(() => {
    if (configuredAllowedOrigin && requestedParentOrigin !== configuredAllowedOrigin) return null;
    return configuredAllowedOrigin || requestedParentOrigin;
  }, [configuredAllowedOrigin, requestedParentOrigin]);

  useEffect(() => {
    const merchantTheme = String(session?.metadata?.theme ?? "").toLowerCase();
    setTheme(query.theme === "dark" || merchantTheme === "dark" ? "dark" : "light");
  }, [query.theme, session?.metadata?.theme, setTheme]);

  useEffect(() => {
    if (!embedded || !session || readyNotified.current) return;
    if (configuredAllowedOrigin && requestedParentOrigin !== configuredAllowedOrigin) return;

    readyNotified.current = true;
    postParent(
      {
        type: "XPAYMENTS_READY",
        sessionId: session.sessionId,
        storeId: session.storeId || null,
      },
      parentOrigin
    );
  }, [
    embedded,
    session,
    parentOrigin,
    configuredAllowedOrigin,
    requestedParentOrigin,
  ]);

  const handlePollingSuccess = useCallback(() => {
    setStep("success");
    if (!successNotified.current) {
      successNotified.current = true;
      postParent({ type: "XPAYMENTS_STATUS", status: "SUCCESS" }, parentOrigin);
    }
  }, [parentOrigin]);

  const handlePollingExpired = useCallback(() => {
    setStep("expired");
  }, []);

  const selectedCode = selectedMethod?.code?.toLowerCase().replace(/-/g, "_") || "";
  const pollingEnabled =
    step === "awaiting" ||
    step === "processing" ||
    ((selectedCode === "multibanco" || selectedCode === "pix") && Boolean(initiateResult));

  usePolling({
    sessionId,
    enabled: pollingEnabled,
    interval: 3000,
    maxAttempts: 200,
    onSuccess: handlePollingSuccess,
    onExpired: handlePollingExpired,
    onError: (message) => {
      if (!message.startsWith("Status:")) return;
      setInitiateError("Pagamento não concluído. Confirme os dados e tente novamente.");
      setSelectedMethod(null);
      setInitiateResult(null);
      setPhoneSubmitted(false);
      setStep("checkout");
    },
  });

  const handleCustomerValidityChange = useCallback(
    (isValid: boolean, data: { name: string; email: string }) => {
      setCustomerValid(isValid);
      setCustomerData({ name: data.name, email: data.email });
    },
    []
  );

  const checkoutReturnUrl = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const url = new URL(`/pay/${sessionId}`, window.location.origin);
    url.searchParams.set("return", "1");
    if (embedded) url.searchParams.set("embedded", "1");
    if (requestedParentOrigin) url.searchParams.set("parent_origin", requestedParentOrigin);
    return url.toString();
  }, [embedded, requestedParentOrigin, sessionId]);

  const doInitiate = useCallback(
    async (methodCode: string, phone?: string) => {
      if (!session) return;

      setInitiating(true);
      setInitiateError(null);

      try {
        const result = await initiatePayment({
          sessionId,
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
    },
    [checkoutReturnUrl, customerData, session, sessionId, t]
  );

  const handleSelectMethod = useCallback(
    (method: ApiPaymentMethod) => {
      if (!customerValid) return;
      setSelectedMethod(method);
      setInitiateResult(null);
      setInitiateError(null);
      setPhoneSubmitted(false);
      if (isInstantMethodCode(method.code)) void doInitiate(method.code);
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

  const handleClose = useCallback(() => {
    postParent({ type: "XPAYMENTS_STATUS", status: "CLOSED" }, parentOrigin);
  }, [parentOrigin]);

  const brandColor = session?.primaryColor || "#111827";

  if (step === "error" || !session) {
    return (
      <CheckoutFrame embedded={embedded} brandColor={brandColor}>
        {!embedded && <MinimalHeader />}
        <main className="flex-1">
          <StatusScreen
            step="error"
            brandColor={brandColor}
            errorMessage={error || t("error.notFound")}
            onRetry={() => window.location.reload()}
          />
        </main>
        {!embedded && <MinimalFooter />}
      </CheckoutFrame>
    );
  }

  if (step === "expired") {
    return (
      <CheckoutFrame embedded={embedded} brandColor={brandColor}>
        <CheckoutHeader session={session} brandColor={brandColor} embedded={embedded} onClose={handleClose} />
        <main className="flex flex-1 items-center justify-center px-4">
          <StatusScreen step="expired" brandColor={brandColor} />
        </main>
        {!embedded && <MinimalFooter />}
      </CheckoutFrame>
    );
  }

  if (step === "success") {
    const merchantReturnUrl = session.returnUrl || session.metadata?.returnUrl || undefined;
    return (
      <CheckoutFrame embedded={embedded} brandColor={brandColor}>
        <CheckoutHeader session={session} brandColor={brandColor} embedded={embedded} onClose={handleClose} />
        <main className="flex flex-1 items-center justify-center px-4">
          <StatusScreen
            step="success"
            brandColor={brandColor}
            storeName={session.storeName}
            returnUrl={merchantReturnUrl}
          />
        </main>
        {!embedded && <MinimalFooter />}
      </CheckoutFrame>
    );
  }

  if (step === "processing" || step === "awaiting" || step === "cancelled") {
    return (
      <CheckoutFrame embedded={embedded} brandColor={brandColor}>
        <CheckoutHeader session={session} brandColor={brandColor} embedded={embedded} onClose={handleClose} />
        <main className="flex flex-1 items-center justify-center px-4">
          <StatusScreen
            step={step}
            brandColor={brandColor}
            storeName={session.storeName}
            onRetry={handleReset}
          />
        </main>
        {!embedded && <MinimalFooter />}
      </CheckoutFrame>
    );
  }

  const amountText = formatCurrency(session.amount, session.currency);
  const checkoutData: CheckoutData | null = initiateResult?.checkoutData ?? null;
  const stripeData = checkoutData && isStripeCheckoutData(checkoutData) ? checkoutData : null;
  const pixData = checkoutData && isPixCheckoutData(checkoutData) ? checkoutData : null;
  const multibancoData = checkoutData && isMultibancoCheckoutData(checkoutData) ? checkoutData : null;
  const isLocked = initiating || Boolean(initiateResult) || phoneSubmitted;
  const initialName = String(session.metadata?.customerName ?? "");
  const initialEmail = String(session.metadata?.customerEmail ?? "");

  return (
    <CheckoutFrame embedded={embedded} brandColor={brandColor}>
      <CheckoutHeader session={session} brandColor={brandColor} embedded={embedded} onClose={handleClose} />

      <main className={`flex-1 px-4 sm:px-6 ${embedded ? "py-3.5 sm:py-4" : "py-5 sm:py-7"}`}>
        <div className="mx-auto w-full max-w-xl space-y-3.5 sm:space-y-4">
          <OrderBlock session={session} brandColor={brandColor} onExpire={() => setStep("expired")} />

          <CustomerBlock
            key={`${session.sessionId}:${initialName}:${initialEmail}`}
            brandColor={brandColor}
            initialName={initialName}
            initialEmail={initialEmail}
            requireDocument={false}
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

          {initiating && (
            <div className="rounded-[24px] border border-border/35 bg-card/90 p-7 text-center shadow-sm">
              <div
                className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: `${brandColor}2A`, borderTopColor: brandColor }}
              />
              <p className="mt-3 text-sm font-medium text-foreground">{t("initiate.processing")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">A preparar a ligação segura ao método selecionado.</p>
            </div>
          )}

          {initiateError && !initiating && (
            <div className="rounded-[22px] border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5">
              <p className="text-sm text-destructive">{initiateError}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 h-9 gap-1.5 rounded-xl text-xs" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" />
                {t("error.tryAgain")}
              </Button>
            </div>
          )}

          {selectedMethod && isPhoneMethodCode(selectedMethod.code) && !initiating && step === "checkout" && (
            <PhonePayment
              method={selectedMethod.code}
              brandColor={brandColor}
              onSubmit={handlePhoneSubmit}
              isSubmitting={initiating}
              isWaiting={phoneSubmitted}
            />
          )}

          {selectedMethod && stripeData && !initiating && (
            <CardPayment
              clientSecret={stripeData.clientSecret}
              publicKey={stripeData.publicKey}
              returnUrl={checkoutReturnUrl || `https://checkout.xpayments.digital/pay/${session.sessionId}?return=1`}
              brandColor={brandColor}
              amount={amountText}
            />
          )}

          {selectedCode === "pix" && pixData && !initiating && (
            <div className="rounded-[26px] border border-border/45 bg-card/95 p-5 shadow-[0_22px_64px_-46px_rgba(15,23,42,.55)] sm:p-6">
              <PixPaymentForm
                checkoutData={pixData}
                session={session}
                brandColor={brandColor}
                onSuccess={handlePollingSuccess}
              />
            </div>
          )}

          {selectedCode === "multibanco" && multibancoData && !stripeData && !initiating && (
            <AsyncPayment
              data={multibancoData}
              session={session}
              brandColor={brandColor}
              variant="multibanco"
              onClose={handleReset}
            />
          )}
        </div>
      </main>

      {!embedded && <MinimalFooter />}
    </CheckoutFrame>
  );
}

function CheckoutFrame({
  embedded,
  brandColor,
  children,
}: {
  embedded: boolean;
  brandColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${embedded ? "min-h-[100dvh]" : "min-h-screen"} relative flex flex-col overflow-hidden bg-background text-foreground`}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-72 opacity-[.06] blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${brandColor}, transparent 62%)` }}
      />
      <div className="relative flex min-h-[inherit] flex-1 flex-col">{children}</div>
    </div>
  );
}

function MinimalHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-[10px] font-bold tracking-tight text-background">XP</div>
          <span className="text-xs font-semibold tracking-tight text-foreground">XPayments</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="flex items-center gap-1.5 rounded-full border border-border/35 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seguro
          </div>
        </div>
      </div>
    </header>
  );
}

function CheckoutHeader({
  session,
  brandColor,
  embedded,
  onClose,
}: {
  session: CheckoutSession;
  brandColor: string;
  embedded: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  const handleClose = useCallback(() => {
    if (embedded) {
      onClose();
      return;
    }
    if (session.returnUrl) {
      window.location.assign(session.returnUrl);
      return;
    }
    if (window.history.length > 1) window.history.back();
  }, [embedded, onClose, session.returnUrl]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 shrink-0 rounded-xl p-0 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
            aria-label={t("header.close")}
          >
            <X className="h-4 w-4" />
          </Button>

          {session.logoUrl ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-9 min-w-9 place-items-center overflow-hidden rounded-xl border border-border/30 bg-white px-1.5 shadow-sm">
                <img src={session.logoUrl} alt={session.storeName} className="max-h-7 max-w-[112px] object-contain" />
              </div>
              <span className="hidden max-w-[150px] truncate text-sm font-semibold text-foreground sm:block">{session.storeName}</span>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[10px] font-bold tracking-tight text-white shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {session.storeName.slice(0, 2).toUpperCase()}
              </div>
              <span className="max-w-[150px] truncate text-sm font-semibold text-foreground">{session.storeName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/35 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
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
    <footer className="mt-auto flex items-center justify-center gap-2 px-4 pb-5 pt-7 text-[10px] text-muted-foreground/55">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{t("footer.secure")}</span>
      <span aria-hidden="true">·</span>
      <span className="font-semibold text-muted-foreground/75">XPayments</span>
    </footer>
  );
}

export function CheckoutExperience(props: CheckoutExperienceProps) {
  return (
    <I18nProvider>
      <CheckoutExperienceInner {...props} />
    </I18nProvider>
  );
}
