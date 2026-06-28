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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, CreditCard, AlertTriangle, Wallet, Shield } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="space-y-5">
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
            {t("stripe.processing")}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {t("stripe.payNow")} — {amount}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 pt-1">
        <Shield className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          {t("stripe.encrypted")}
        </p>
      </div>
    </form>
  );
}

// ── Web3 / Crypto Placeholder ──

function Web3Placeholder({ brandColor }: { brandColor?: string }) {
  const { t } = useI18n();

  return (
    <div className="py-10 sm:py-14 flex flex-col items-center text-center space-y-4">
      {/* Glow icon */}
      <div
        className="relative flex items-center justify-center h-16 w-16 rounded-2xl"
        style={{
          backgroundColor: brandColor
            ? `${brandColor}12`
            : "var(--muted, rgba(0,0,0,0.04))",
        }}
      >
        <Wallet
          className="h-7 w-7"
          style={{ color: brandColor || "var(--muted-foreground)" }}
        />
        {/* Subtle glow ring */}
        <div
          className="absolute inset-0 rounded-2xl opacity-40"
          style={{
            border: `1px solid ${brandColor || "var(--border)"}30`,
          }}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          {t("stripe.web3Title")}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] whitespace-pre-line">
          {t("stripe.web3Subtitle")}
        </p>
      </div>

      {/* Metamask-style placeholder badge */}
      <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2">
        <div className="h-5 w-5 rounded-full bg-[#F6851B]/10 flex items-center justify-center">
          <Wallet className="h-3 w-3 text-[#F6851B]" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Metamask
        </span>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider ml-1">
          {t("stripe.web3ComingSoon")}
        </span>
      </div>
    </div>
  );
}

// ── Fallbacks ──

function StripeKeyMissing() {
  const { t } = useI18n();

  return (
    <div className="py-10 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {t("stripe.keyMissing")}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t("stripe.keyMissingDesc")}
        </p>
      </div>
    </div>
  );
}

function StripeCrashFallback() {
  const { t } = useI18n();

  return (
    <div className="py-10 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {t("stripe.crashTitle")}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
          {t("stripe.crashDesc")}
        </p>
      </div>
    </div>
  );
}

// ── Main Wrapper: Tabs (Card/Fiat + Web3) ──

interface StripePaymentFormProps {
  clientSecret: string;
  publicKey: string;
  returnUrl: string;
  brandColor?: string;
  amount?: string;
}

export function StripePaymentForm({
  clientSecret,
  publicKey,
  returnUrl,
  brandColor,
  amount = "",
}: StripePaymentFormProps) {
  const { resolvedTheme } = useTheme();
  const { t } = useI18n();
  const isDark = resolvedTheme === "dark";

  // Dynamic Stripe initialization from backend-provided publicKey
  const stripePromise = useMemo(() => {
    if (!publicKey) return null;
    return loadStripe(publicKey);
  }, [publicKey]);

  // Theme-aware Stripe appearance
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

  // Defensive: no publicKey from backend
  if (!publicKey || !stripePromise) {
    return <StripeKeyMissing />;
  }

  return (
    <Tabs defaultValue="card" className="w-full">
      <TabsList className="w-full h-11 bg-muted/50 p-1">
        <TabsTrigger
          value="card"
          className="flex-1 gap-2 h-9 text-xs font-medium data-[state=active]:bg-card"
        >
          <CreditCard className="h-3.5 w-3.5" />
          {t("stripe.cardTab")}
        </TabsTrigger>
        <TabsTrigger
          value="web3"
          className="flex-1 gap-2 h-9 text-xs font-medium data-[state=active]:bg-card opacity-60 pointer-events-none select-none"
        >
          <Wallet className="h-3.5 w-3.5" />
          {t("stripe.web3Tab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="card" className="mt-5">
        <StripeErrorBoundary fallback={<StripeCrashFallback />}>
          <Elements stripe={stripePromise} options={options}>
            <StripeCheckoutForm
              returnUrl={returnUrl}
              amount={amount}
              brandColor={brandColor}
            />
          </Elements>
        </StripeErrorBoundary>
      </TabsContent>

      <TabsContent value="web3" className="mt-2">
        <Web3Placeholder brandColor={brandColor} />
      </TabsContent>
    </Tabs>
  );
}