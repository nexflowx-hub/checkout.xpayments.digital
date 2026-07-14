"use client";

import { useMemo, useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, AlertTriangle, CreditCard } from "lucide-react";
import { StripeErrorBoundary } from "@/components/checkout/StripeErrorBoundary";
import { useI18n } from "@/lib/i18n";

// ── Inner Stripe Checkout Form ──

function StripeCheckoutForm({
  returnUrl,
  amount,
  brandColor,
}: {
  returnUrl: string;
  amount: string;
  brandColor?: string;
}) {
  const { t } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      setMessage(
        error.type === "card_error" || error.type === "validation_error"
          ? error.message ?? "Card error"
          : "An unexpected error occurred. Please try again."
      );
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {message && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-sm font-semibold gap-2"
        style={brandColor ? { backgroundColor: brandColor, color: "#fff" } : undefined}
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("card.processing")}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {t("card.payNow")} — {amount}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 pt-1">
        <Shield className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          {t("card.encrypted")}
        </p>
      </div>
    </form>
  );
}

// ── Fallbacks ──

function StripeKeyMissing() {
  const { t } = useI18n();

  return (
    <div className="py-8 text-center space-y-3">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{t("card.keyMissing")}</p>
      <p className="text-xs text-muted-foreground">{t("card.keyMissingDesc")}</p>
    </div>
  );
}

function StripeCrashFallback() {
  const { t } = useI18n();

  return (
    <div className="py-8 text-center space-y-3">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </div>
      <p className="text-sm font-medium text-foreground">{t("card.crashTitle")}</p>
      <p className="text-xs text-muted-foreground whitespace-pre-line">{t("card.crashDesc")}</p>
    </div>
  );
}

// ── Main Card Payment Component ──

interface CardPaymentProps {
  clientSecret: string;
  publicKey: string;
  returnUrl: string;
  brandColor?: string;
  amount: string;
}

export function CardPayment({
  clientSecret,
  publicKey,
  returnUrl,
  brandColor,
  amount,
}: CardPaymentProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const stripePromise = useMemo(() => {
    if (!publicKey) return null;
    return loadStripe(publicKey);
  }, [publicKey]);

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: isDark ? "night" : "stripe",
        variables: {
          colorPrimary: brandColor || "#6366f1",
          colorBackground: isDark ? "#09090b" : "#ffffff",
          colorText: isDark ? "#fafafa" : "#1a1a1a",
          colorTextSecondary: isDark ? "#a1a1aa" : "#6b7280",
          colorDanger: "#ef4444",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          borderRadius: "8px",
          spacingBranding: "none",
        },
        ...(isDark && {
          rules: {
            ".Label": { color: "#a1a1aa", fontSize: "12px", fontWeight: "500" },
            ".Input": { backgroundColor: "#09090b", borderColor: "#27272a" },
            ".Input:focus": { borderColor: brandColor || "#6366f1" },
            ".Tab": { color: "#a1a1aa" },
            ".Tab:hover": { color: "#fafafa" },
            ".Tab--selected": { color: "#fafafa", borderColor: brandColor || "#6366f1" },
          },
        }),
      },
    }),
    [clientSecret, brandColor, isDark]
  );

  if (!publicKey || !stripePromise) {
    return <StripeKeyMissing />;
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-muted/20 p-4 sm:p-5">
      <StripeErrorBoundary fallback={<StripeCrashFallback />}>
        <Elements stripe={stripePromise} options={options}>
          <StripeCheckoutForm
            returnUrl={returnUrl}
            amount={amount}
            brandColor={brandColor}
          />
        </Elements>
      </StripeErrorBoundary>
    </div>
  );
}