"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CustomerDetailsForm } from "@/components/checkout/CustomerDetailsForm";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import { PixPaymentForm } from "@/components/checkout/PixPaymentForm";
import type {
  PaymentLinkData,
  CheckoutStep,
  InitiateCheckoutResponse,
  CustomerDetails,
  GatewayType,
  CheckoutData,
} from "@/types/checkout";
import {
  isStripeGateway,
  isPixGateway,
  isStripeCheckoutData,
  formatCurrency,
} from "@/types/checkout";

// ── Master Backend URL ──
const MASTER_API = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

// ── Status check from URL query ──

function usePaymentStatus() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  return useMemo<"success" | "cancelled" | null>(() => {
    if (statusParam === "success") return "success";
    if (statusParam === "cancelled") return "cancelled";
    return null;
  }, [statusParam]);
}

// ── Step Indicator ──

function StepIndicator({
  currentStep,
  brandColor,
}: {
  currentStep: CheckoutStep;
  brandColor: string;
}) {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "customer_details", label: "Dados" },
    { key: "payment", label: "Pagamento" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const isActive = step.key === currentStep;
        const isCompleted = steps.findIndex((s) => s.key === currentStep) > i;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: isActive || isCompleted
                    ? brandColor
                    : "var(--muted)",
                  color: isActive || isCompleted ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className="h-px w-6"
                style={{
                  backgroundColor: isCompleted ? brandColor : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Success Screen ──

function SuccessScreen({
  brandColor,
  storeName,
}: {
  brandColor: string;
  storeName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div
        className="flex items-center justify-center h-16 w-16 rounded-full"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <CheckCircle2 className="h-8 w-8" style={{ color: brandColor }} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Pagamento Confirmado!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Obrigado pela sua compra em {storeName}.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Enviámos um email de confirmação com os detalhes do pedido.
      </p>
    </div>
  );
}

// ── Error Screen ──

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Ops!</h2>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-24" />
              <Separator />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Main Checkout Page ──

export default function CheckoutPage() {
  const params = useParams<{ urlCode: string }>();
  const paymentStatus = usePaymentStatus();

  // State
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<CheckoutStep>("customer_details");
  const [gateway, setGateway] = useState<GatewayType | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  // PASSO A: Fetch checkout data from Master Backend
  useEffect(() => {
    async function fetchCheckoutData() {
      try {
        const res = await fetch(
          `${MASTER_API}/api/v1/payment-links/${params.urlCode}`
        );
        const json = await res.json();

        if (!json.success) {
          setError(json.error ?? "Link de pagamento não encontrado");
          return;
        }

        setPaymentLink(json.data);
      } catch (err) {
        console.error("[checkout] Failed to fetch payment link:", err);
        setError("Não foi possível carregar o link de pagamento.");
      } finally {
        setLoading(false);
      }
    }

    fetchCheckoutData();
  }, [params.urlCode]);

  // PASSO B: Initiate payment via Master Backend
  const handleCustomerSubmit = useCallback(
    async (customerDetails: CustomerDetails) => {
      if (!paymentLink) return;

      setInitiating(true);
      setInitiateError(null);

      try {
        const res = await fetch(`${MASTER_API}/api/v1/checkout/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: paymentLink.storeId,
            amountFiat: paymentLink.amountFiat,
            currency: paymentLink.currency,
            customerDetails,
          }),
        });

        const result: InitiateCheckoutResponse = await res.json();

        if (!result.success) {
          setInitiateError(
            (result as unknown as { error: string }).error ??
              "Erro ao iniciar checkout"
          );
          return;
        }

        setGateway(result.data.gateway);
        setCheckoutData(result.data.checkoutData);
        setStep("payment");
      } catch (err) {
        console.error("[checkout] Failed to initiate payment:", err);
        setInitiateError("Erro de ligação ao servidor. Tente novamente.");
      } finally {
        setInitiating(false);
      }
    },
    [paymentLink]
  );

  const handlePaymentSuccess = useCallback(() => {
    setStep("payment");
    window.history.replaceState(
      null,
      "",
      `/pay/${params.urlCode}?status=success`
    );
  }, [params.urlCode]);

  const handleGoBack = useCallback(() => {
    setStep("customer_details");
    setGateway(null);
    setCheckoutData(null);
    setInitiateError(null);
  }, []);

  // ── Render states ──

  if (loading) return <CheckoutSkeleton />;
  if (error) return <ErrorScreen message={error} />;
  if (!paymentLink) return <ErrorScreen message="Link não encontrado" />;

  const { branding } = paymentLink;
  const brandColor = branding.color || "#111111";

  // Payment success screen
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex flex-col">
        <CheckoutHeader branding={branding} brandColor={brandColor} />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <SuccessScreen
                brandColor={brandColor}
                storeName={branding.storeName}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CheckoutHeader branding={branding} brandColor={brandColor} />

      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Order Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <Card className="sticky top-6">
              <CardContent className="p-0">
                <OrderSummary
                  paymentLink={paymentLink}
                  brandColor={brandColor}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Checkout Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Step indicator + back */}
                <div className="flex items-center justify-between">
                  <StepIndicator currentStep={step} brandColor={brandColor} />
                  {step === "payment" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGoBack}
                      className="text-xs text-muted-foreground hover:text-foreground -mr-2"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Voltar
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Mobile Order Summary (inline) */}
                <div className="lg:hidden">
                  <MobileOrderSummary
                    paymentLink={paymentLink}
                    brandColor={brandColor}
                  />
                  <Separator className="mt-4" />
                </div>

                {/* Step 1: Customer Details */}
                {step === "customer_details" && (
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Informações de Contacto
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Insira os seus dados para prosseguir com o pagamento.
                    </p>
                    <div className="pt-4">
                      {initiateError && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
                          <p className="text-sm text-destructive">
                            {initiateError}
                          </p>
                        </div>
                      )}
                      <CustomerDetailsForm
                        onSubmit={handleCustomerSubmit}
                        brandColor={brandColor}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Gateway */}
                {step === "payment" && gateway && checkoutData && (
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Pagamento
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isStripeGateway(gateway)
                        ? "Introduza os dados do seu cartão."
                        : "Escaneie o QR Code ou copie o código PIX."}
                    </p>
                    <div className="pt-4">
                      {initiating ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            A preparar o pagamento...
                          </p>
                        </div>
                      ) : isStripeGateway(gateway) && isStripeCheckoutData(checkoutData) ? (
                        <StripePaymentForm
                          checkoutData={checkoutData}
                          brandColor={brandColor}
                          paymentLink={paymentLink}
                          onSuccess={handlePaymentSuccess}
                        />
                      ) : isPixGateway(gateway) ? (
                        <PixPaymentForm
                          checkoutData={checkoutData as import("@/types/checkout").PixCheckoutData}
                          brandColor={brandColor}
                          paymentLink={paymentLink}
                          onSuccess={handlePaymentSuccess}
                        />
                      ) : (
                        <ErrorScreen message="Gateway de pagamento não suportado." />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Powered by</span>
              <span className="font-semibold text-foreground">XPayments</span>
              <span>&middot;</span>
              <span>Checkout Seguro</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ──

function CheckoutHeader({
  branding,
  brandColor,
}: {
  branding: { storeName: string; logo?: string };
  brandColor: string;
}) {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md bg-background/80"
      style={{ borderBottomColor: `${brandColor}20` }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {branding.logo ? (
            <img
              src={branding.logo}
              alt={branding.storeName}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: brandColor }}
              >
                {branding.storeName.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-foreground">
                {branding.storeName}
              </span>
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] font-medium gap-1">
          <ShieldCheck className="h-3 w-3" />
          Checkout Seguro
        </Badge>
      </div>
    </header>
  );
}

function MobileOrderSummary({
  paymentLink,
  brandColor,
}: {
  paymentLink: PaymentLinkData;
  brandColor: string;
}) {
  return (
    <div
      className="rounded-lg border p-4 space-y-3"
      style={{ borderColor: `${brandColor}20` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{paymentLink.name}</p>
        <p className="text-base font-bold text-foreground">
          {formatCurrency(paymentLink.amountFiat, paymentLink.currency)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
          style={{ backgroundColor: brandColor }}
        >
          {paymentLink.branding.storeName.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-xs text-muted-foreground">
          {paymentLink.branding.storeName}
        </span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {paymentLink.currency}
        </Badge>
      </div>
    </div>
  );
}