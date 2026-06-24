"use client";

import { useMemo, useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard } from "lucide-react";
import type { StripeCheckoutData, PaymentLinkData } from "@/types/checkout";

// ── Inner form that uses Stripe hooks ──

interface StripeFormInnerProps {
  clientSecret: string;
  brandColor: string;
  paymentLink: PaymentLinkData;
  onSuccess: () => void;
}

function StripeFormInner({
  clientSecret,
  brandColor,
  paymentLink,
  onSuccess,
}: StripeFormInnerProps) {
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
      confirmParams: {
        return_url: `${window.location.href}?status=success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message ?? "Erro no cartão");
      } else {
        setMessage("Ocorreu um erro inesperado. Tente novamente.");
      }
    } else {
      onSuccess();
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Dados do Cartão</p>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {message && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold"
        style={{ backgroundColor: brandColor, color: "#fff" }}
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            A processar pagamento...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pagar agora
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 pt-1">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          Pagamento encriptado e seguro via Stripe
        </p>
      </div>
    </form>
  );
}

// ── Wrapper: loads Stripe.js + provides Elements ──

interface StripePaymentFormProps {
  checkoutData: StripeCheckoutData;
  brandColor: string;
  paymentLink: PaymentLinkData;
  onSuccess: () => void;
}

export function StripePaymentForm({
  checkoutData,
  brandColor,
  paymentLink,
  onSuccess,
}: StripePaymentFormProps) {
  const { clientSecret } = checkoutData;

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_KEY;
    if (key) return loadStripe(key);
    return null;
  }, []);

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: brandColor,
          colorBackground: "#ffffff",
          colorText: "#1a1a1a",
          colorDanger: "#ef4444",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          borderRadius: "8px",
        },
      },
    }),
    [clientSecret, brandColor]
  );

  // Missing key → show setup notice
  if (!stripePromise) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Dados do Cartão</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Stripe Payment Element</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure a variável <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_STRIPE_KEY</code> no Vercel para ativar o pagamento real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeFormInner
        clientSecret={clientSecret}
        brandColor={brandColor}
        paymentLink={paymentLink}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}