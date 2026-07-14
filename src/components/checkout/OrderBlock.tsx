"use client";

import { Receipt, ShieldCheck } from "lucide-react";
import type { CheckoutSession } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface OrderBlockProps {
  session: CheckoutSession;
  brandColor: string;
}

export function OrderBlock({ session, brandColor }: OrderBlockProps) {
  const { t } = useI18n();
  const { amount, currency, reference, storeName } = session;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg"
          style={{ backgroundColor: `${brandColor}12` }}
        >
          <Receipt className="h-4 w-4" style={{ color: brandColor }} />
        </div>
        <h2 className="text-sm font-semibold text-foreground">
          {t("block.order.title")}
        </h2>
      </div>

      {/* Store name */}
      <p className="text-xs text-muted-foreground">{storeName}</p>

      {/* Amount */}
      <div className="rounded-lg bg-muted/30 border border-border/30 p-4 text-center">
        <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {formatCurrency(amount, currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{currency}</p>
      </div>

      {/* Reference */}
      {reference && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {t("block.order.reference")}
          </span>
          <span className="text-xs font-mono font-medium text-foreground">
            {reference}
          </span>
        </div>
      )}

      {/* Secure badge */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          {t("block.order.amount")}
        </p>
      </div>
    </div>
  );
}