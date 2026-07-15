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
 * React Error Boundary that catches render-time crashes from payment elements.
 * Shows a graceful white-label fallback — no gateway names exposed.
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
    console.error("[PaymentElementBoundary] Payment element crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultFallback />;
    }
    return this.props.children;
  }
}

function DefaultFallback() {
  return (
    <div className="py-10 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          Payment method unavailable
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Could not initialize the payment method.
          Please try again later.
        </p>
      </div>
    </div>
  );
}