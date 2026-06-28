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
import { Loader2, Lock, CreditCard, AlertTriangle } from "lucide-react";
import { StripeErrorBoundary } from "@/components/checkout/StripeErrorBoundary";

// ── Module-level Stripe.js promise ──

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ── Inner form that uses Stripe hooks ──

function CheckoutForm({ returnUrl }: { returnUrl: string }) {
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
        return_url: returnUrl,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message ?? "Erro no cartão");
      } else {
        setMessage("Ocorreu um erro inesperado. Tente novamente.");
      }
    }
    // On success, Stripe redirects to returnUrl automatically

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

// ── Fallback when Stripe key is not configured ──

function StripeKeyMissing() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Dados do Cartão
        </p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-5 sm:p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Stripe Payment Element
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Configure a variável{" "}
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>{" "}
            no ambiente de deploy para ativar o pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Fallback when Stripe Elements crashes at runtime ──

function StripeCrashFallback() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Dados do Cartão
        </p>
      </div>
      <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-5 sm:p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Aguardando configuração da Chave Stripe do Lojista
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            O Stripe não conseguiu inicializar o pagamento.
            Isto geralmente ocorre quando a chave publicável ainda não foi
            configurada para esta loja. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Wrapper: provides Elements context, wrapped in ErrorBoundary ──

interface StripePaymentFormProps {
  clientSecret: string;
  returnUrl: string;
  brandColor?: string;
}

export function StripePaymentForm({
  clientSecret,
  returnUrl,
  brandColor,
}: StripePaymentFormProps) {
  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: brandColor
        ? {
            theme: "stripe",
            variables: {
              colorPrimary: brandColor,
              colorBackground: "#ffffff",
              colorText: "#1a1a1a",
              colorDanger: "#ef4444",
              fontFamily:
                "var(--font-geist-sans), system-ui, sans-serif",
              borderRadius: "8px",
            },
          }
        : undefined,
    }),
    [clientSecret, brandColor]
  );

  // Missing Stripe key → show setup notice (no crash)
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return <StripeKeyMissing />;
  }

  // Stripe key exists but may fail at render time (invalid clientSecret, etc.)
  // → wrap in ErrorBoundary to prevent white screen
  return (
    <StripeErrorBoundary fallback={<StripeCrashFallback />}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm returnUrl={returnUrl} />
      </Elements>
    </StripeErrorBoundary>
  );
}