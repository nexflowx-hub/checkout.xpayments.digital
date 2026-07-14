"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";

// ── Tab 1: Card / Fiat — wraps the actual Stripe PaymentElement ──

function FiatPaymentTab({
  returnUrl,
  brandColor,
}: {
  returnUrl: string;
  brandColor: string;
}) {
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
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message ?? "Erro no cartão");
      } else {
        setMessage("Ocorreu um erro inesperado. Tente novamente.");
      }
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
        className="[&_.p-PaymentElement]:text-sm"
      />

      {message && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{message}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-sm font-semibold rounded-lg transition-all hover:opacity-90 active:scale-[0.98]"
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
            Pagar Agora
          </>
        )}
      </Button>
    </form>
  );
}

// ── Tab 2: Web3 / Crypto — Placeholder ──

function Web3Placeholder({ brandColor }: { brandColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center space-y-4">
      <div
        className="flex items-center justify-center h-14 w-14 rounded-2xl"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <Wallet className="h-7 w-7" style={{ color: brandColor }} />
      </div>
      <div className="space-y-2 max-w-xs">
        <p className="text-sm font-semibold text-neutral-100">
          Pagamento Web3
        </p>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Em breve poderá pagar com criptomoedas.
          <br />
          Conecte a sua Wallet Metamask.
        </p>
      </div>
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
        style={{ backgroundColor: `${brandColor}12`, color: brandColor }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: brandColor }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: brandColor }}
          />
        </span>
        Em breve
      </div>
    </div>
  );
}

// ── Main Export: Tabbed Payment Interface ──

interface PaymentTabsProps {
  returnUrl: string;
  brandColor: string;
}

export function PaymentTabs({ returnUrl, brandColor }: PaymentTabsProps) {
  return (
    <Tabs defaultValue="fiat" className="w-full">
      <TabsList className="w-full h-12 bg-[#0a0a0a] rounded-lg p-1 mb-6">
        <TabsTrigger
          value="fiat"
          className="flex-1 gap-2 rounded-md data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-neutral-400 transition-all text-xs sm:text-sm font-medium h-10"
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Cartão / </span>
          <span className="sm:hidden">Cartão</span>
          <span className="hidden sm:inline">Fiat</span>
        </TabsTrigger>
        <TabsTrigger
          value="crypto"
          className="flex-1 gap-2 rounded-md data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-neutral-400 transition-all text-xs sm:text-sm font-medium h-10"
        >
          <Wallet className="h-4 w-4" />
          <span>Crypto</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fiat" className="mt-0">
        <FiatPaymentTab returnUrl={returnUrl} brandColor={brandColor} />
      </TabsContent>

      <TabsContent value="crypto" className="mt-0">
        <Web3Placeholder brandColor={brandColor} />
      </TabsContent>
    </Tabs>
  );
}