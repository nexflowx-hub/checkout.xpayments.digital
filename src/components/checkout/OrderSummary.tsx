"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShieldCheck, Globe } from "lucide-react";
import type { PaymentLinkData } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";

interface OrderSummaryProps {
  paymentLink: PaymentLinkData;
  brandColor: string;
}

export function OrderSummary({ paymentLink, brandColor }: OrderSummaryProps) {
  const { name, amountFiat, currency, branding } = paymentLink;

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          {branding.logo ? (
            <img
              src={branding.logo}
              alt={branding.storeName}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div
              className="flex items-center justify-center h-10 w-10 rounded-lg text-white font-bold text-sm"
              style={{ backgroundColor: brandColor }}
            >
              {branding.storeName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-sm">{branding.storeName}</p>
            <p className="text-xs text-muted-foreground">Checkout seguro</p>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Order Item */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center h-12 w-12 rounded-lg shrink-0"
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <ShoppingBag className="h-6 w-6" style={{ color: brandColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">1x Unidade</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Total & Badges */}
      <div className="p-6 pt-0">
        <Separator className="mb-4" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(amountFiat, currency)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Pagamento seguro
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1.5">
            <Globe className="h-3 w-3" />
            {currency}
          </Badge>
        </div>
      </div>
    </div>
  );
}