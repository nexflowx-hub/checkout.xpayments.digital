"use client";

import { ShoppingBag, ShieldCheck, Globe } from "lucide-react";
import type { PaymentLinkData } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";

interface OrderSummaryProps {
  paymentLink: PaymentLinkData;
  brandColor: string;
}

export function OrderSummary({ paymentLink, brandColor }: OrderSummaryProps) {
  const { name, amountFiat, currency, branding, productImage } = paymentLink;

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          {branding.logo ? (
            <img
              src={branding.logo}
              alt={branding.storeName}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-contain bg-white/5 p-1"
            />
          ) : (
            <div
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-white font-bold text-xs sm:text-sm shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              {branding.storeName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {branding.storeName}
            </p>
            <p className="text-[11px] text-muted-foreground">Checkout seguro</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-5" />

        {/* Product */}
        <div className="flex items-start gap-3.5">
          {productImage ? (
            <img
              src={productImage}
              alt={name}
              className="h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-lg object-cover shrink-0 bg-muted"
            />
          ) : (
            <div
              className="flex items-center justify-center h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-lg shrink-0"
              style={{ backgroundColor: `${brandColor}12` }}
            >
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: brandColor }} />
            </div>
          )}
          <div className="flex-1 min-w-0 py-1">
            <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">
              {name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">1x Unidade</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Total */}
      <div className="p-5 sm:p-6 pt-0">
        <div className="h-px bg-border mb-4" />

        <div className="flex items-baseline justify-between mb-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {formatCurrency(amountFiat, currency)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact order summary for mobile — used inline in Step 2 */
export function CompactOrderSummary({
  paymentLink,
  brandColor,
}: {
  paymentLink: PaymentLinkData;
  brandColor: string;
}) {
  const { name, amountFiat, currency, branding, productImage } = paymentLink;

  return (
    <div className="flex items-center gap-3">
      {productImage ? (
        <img
          src={productImage}
          alt={name}
          className="h-10 w-10 rounded-md object-cover shrink-0 bg-muted"
        />
      ) : (
        <div
          className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0"
          style={{ backgroundColor: brandColor }}
        >
          {branding.storeName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {branding.storeName}
        </p>
      </div>
      <p className="text-sm font-bold text-foreground whitespace-nowrap">
        {formatCurrency(amountFiat, currency)}
      </p>
    </div>
  );
}