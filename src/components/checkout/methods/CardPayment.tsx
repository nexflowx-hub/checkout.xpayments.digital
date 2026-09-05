"use client";

import { useMemo, useState } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeErrorBoundary } from "@/components/checkout/StripeErrorBoundary";
import { useI18n } from "@/lib/i18n";

function CheckoutForm({
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
          ? error.message ?? "Payment validation error"
          : "Não foi possível concluir o pagamento. Tente novamente."
      );
    }

    setIsLoading(false);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5"
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="rounded-[20px] border border-border/50 bg-background/70 p-3 sm:p-4">
        <PaymentElement
          options={{
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true,
            },
          }}
        />
      </div>

      {message && (
        <motion.div
          className="rounded-2xl border border-destructive/20 bg-destructive/[0.05] p-3.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-destructive">{message}</p>
        </motion.div>
      )}

      <Button
        type="submit"
        className="h-12 w-full gap-2 rounded-2xl text-sm font-semibold shadow-[0_14px_38px_-20px_rgba(0,0,0,.55)]"
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
            <LockKeyhole className="h-4 w-4" />
            {amount ? t("card.payNowAmount").replace("{amount}", amount) : t("card.payNow")}
          </>
        )}
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 text-[10px] text-muted-foreground/65">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          PCI-secure Stripe Elements
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Métodos elegíveis aparecem automaticamente
        </span>
      </div>
    </motion.form>
  );
}

function KeyMissing() {
  const { t } = useI18n();
  return (
    <div className="py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border/50 bg-muted/30">
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{t("card.keyMissing")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("card.keyMissingDesc")}</p>
    </div>
  );
}

function CrashFallback() {
  const { t } = useI18n();
  return (
    <div className="py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{t("card.crashTitle")}</p>
      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{t("card.crashDesc")}</p>
    </div>
  );
}

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

  const stripePromise = useMemo(
    () => (publicKey ? loadStripe(publicKey) : null),
    [publicKey]
  );

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: isDark ? "night" : "stripe",
        variables: {
          colorPrimary: brandColor || "#111111",
          colorBackground: isDark ? "#0a0a0b" : "#ffffff",
          colorText: isDark ? "#fafafa" : "#18181b",
          colorTextSecondary: isDark ? "#a1a1aa" : "#71717a",
          colorDanger: "#ef4444",
          fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif",
          borderRadius: "14px",
          spacingUnit: "4px",
          spacingBranding: "none",
        },
        rules: {
          ".Label": {
            fontSize: "12px",
            fontWeight: "600",
            color: isDark ? "#d4d4d8" : "#52525b",
          },
          ".Input": {
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            boxShadow: "none",
          },
          ".Input:focus": {
            borderColor: brandColor || "#18181b",
            boxShadow: `0 0 0 1px ${brandColor || "#18181b"}`,
          },
          ".Tab": {
            borderRadius: "14px",
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            boxShadow: "none",
          },
          ".Tab--selected": {
            borderColor: brandColor || "#18181b",
            boxShadow: `0 0 0 1px ${brandColor || "#18181b"}`,
          },
        },
      },
    }),
    [clientSecret, brandColor, isDark]
  );

  if (!publicKey || !stripePromise) return <KeyMissing />;

  return (
    <motion.section
      className="relative overflow-hidden rounded-[28px] border border-border/50 bg-card/90 shadow-[0_24px_70px_-42px_rgba(15,23,42,.6)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: brandColor || "#111111" }}
      />

      <div className="relative border-b border-border/40 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border/50 bg-background shadow-sm">
            <CreditCard className="h-5 w-5 text-foreground" strokeWidth={1.7} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Pagamento seguro</h3>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              Stripe apresenta os métodos disponíveis para este pagamento.
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-5 sm:p-6">
        <StripeErrorBoundary fallback={<CrashFallback />}>
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              returnUrl={returnUrl}
              amount={amount}
              brandColor={brandColor}
            />
          </Elements>
        </StripeErrorBoundary>
      </div>
    </motion.section>
  );
}
