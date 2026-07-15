"use client";

import { Receipt, ShieldCheck } from "lucide-react";
import type { CheckoutSession } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";
import { CountdownTimer } from "@/components/checkout/CountdownTimer";
import { motion } from "framer-motion";

interface OrderBlockProps {
  session: CheckoutSession;
  brandColor: string;
  onExpire?: () => void;
}

export function OrderBlock({ session, brandColor, onExpire }: OrderBlockProps) {
  const { t } = useI18n();
  const { amount, currency, reference, storeName, description, expiresAt, metadata } = session;

  const expiration = expiresAt || metadata?.expiresAt;

  return (
    <motion.div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Section header */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-xl"
              style={{ backgroundColor: `${brandColor}0D` }}
            >
              <Receipt className="h-4 w-4" style={{ color: brandColor }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-none">
                {t("block.order.title")}
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-1 truncate max-w-[200px]">
                {storeName}
              </p>
            </div>
          </div>

          {expiration && (
            <CountdownTimer targetDate={expiration} onExpire={onExpire}>
              {({ formatted, isExpired }) => (
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    isExpired
                      ? "text-destructive border-destructive/20 bg-destructive/5"
                      : "text-muted-foreground border-border/40 bg-muted/30"
                  }`}
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  {isExpired ? t("session.expired") : formatted}
                </span>
              )}
            </CountdownTimer>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-5 sm:mx-6" />

      {/* Amount section */}
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground/60 text-center mb-4 truncate max-w-[300px] mx-auto">
            {description}
          </p>
        )}

        {/* Amount display */}
        <div className="text-center py-3 sm:py-4">
          <p className="text-3xl sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2 font-medium tracking-wide uppercase">
            {currency}
          </p>
        </div>

        {/* Reference row */}
        {reference && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[11px] text-muted-foreground/50">
              {t("block.order.reference")}
            </span>
            <span className="text-[11px] font-mono font-medium text-foreground/60 bg-muted/40 px-2 py-0.5 rounded-md">
              {reference}
            </span>
          </div>
        )}
      </div>

      {/* Secure badge */}
      <div className="px-5 sm:px-6 pb-4 pt-0">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground/40 tracking-wide">
            {t("block.order.secureBadge")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}