"use client";

import {
  Component,
  type ReactNode,
} from "react";
import { CreditCard, AlertTriangle } from "lucide-react";

interface StripeErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface StripeErrorBoundaryState {
  hasError: boolean;
}

/**
 * React Error Boundary that catches render-time crashes from Stripe <Elements>.
 * When Stripe SDK rejects an invalid clientSecret or publishableKey,
 * instead of a white screen, we show a graceful fallback.
 */
export class StripeErrorBoundary extends Component<
  StripeErrorBoundaryProps,
  StripeErrorBoundaryState
> {
  constructor(props: StripeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): StripeErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[StripeErrorBoundary] Stripe Elements crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultStripeFallback />;
    }
    return this.props.children;
  }
}

function DefaultStripeFallback() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Dados do Cartão
        </p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Aguardando configuração da Chave Stripe
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O lojista ainda não configurou a chave Stripe publicável.
            Por favor, contacte o suporte ou tente novamente mais tarde.
          </p>
        </div>
      </div>
    </div>
  );
}