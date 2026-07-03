"use client";

import { ShoppingBag, ShieldCheck, Globe } from "lucide-react";
import type { CheckoutSession } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface OrderSummaryProps {
  session: CheckoutSession;
  brandColor: string;
}

export function OrderSummary({ session, brandColor }: OrderSummaryProps) {
  const { t } = useI18n();
  const { storeName, logoUrl, amountFiat, currency } = session;

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-contain bg-muted p-1"
            />
          ) : (
            <div
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-white font-bold text-xs sm:text-sm shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              {storeName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {storeName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("order.secureCheckout")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-5" />

        {/* Product line */}
        <div className="flex items-start gap-3.5">
          <div
            className="flex items-center justify-center h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-lg shrink-0"
            style={{ backgroundColor: `${brandColor}12` }}
          >
            <ShoppingBag
              className="h-6 w-6 sm:h-7 sm:w-7"
              style={{ color: brandColor }}
            />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <p className="font-medium text-sm text-foreground leading-snug">
              {t("order.payment")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("order.unit")}
            </p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Total */}
      <div className="p-5 sm:p-6 pt-0">
        <div className="h-px bg-border mb-4" />

        <div className="flex items-baseline justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t("order.total")}</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {formatCurrency(amountFiat, currency)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>{t("order.securePayment")}</span>
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
  session,
  brandColor,
}: {
  session: CheckoutSession;
  brandColor: string;
}) {
  const { t } = useI18n();
  const { storeName, logoUrl, amountFiat, currency } = session;

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={storeName}
          className="h-10 w-10 rounded-md object-contain shrink-0 bg-muted p-0.5"
        />
      ) : (
        <div
          className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0"
          style={{ backgroundColor: brandColor }}
        >
          {storeName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{storeName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {t("order.payment")}
        </p>
      </div>
      <p className="text-sm font-bold text-foreground whitespace-nowrap">
        {formatCurrency(amountFiat, currency)}
      </p>
    </div>
  );
}