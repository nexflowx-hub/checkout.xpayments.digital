"use client";

import {
  Component,
  type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";

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
    <div className="py-10 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          Aguardando configuração do Gateway pelo Lojista
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O Stripe não conseguiu inicializar o pagamento.
          Tente novamente mais tarde.
        </p>
      </div>
    </div>
  );
}
