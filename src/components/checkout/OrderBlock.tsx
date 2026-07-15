"use client";

import { Receipt, ShieldCheck } from "lucide-react";
import type { CheckoutSession } from "@/types/checkout";
import { formatCurrency } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";
import { CountdownTimer } from "@/components/checkout/CountdownTimer";

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
      className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <Receipt className="h-4 w-4" style={{ color: brandColor }} />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("block.order.title")}
          </h2>
        </div>

        {/* Session countdown */}
        {expiration && (
          <CountdownTimer targetDate={expiration} onExpire={onExpire}>
            {({ formatted, isExpired }) => (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                  isExpired
                    ? "text-destructive border-destructive/30 bg-destructive/5"
                    : "text-muted-foreground border-border/60 bg-muted/30"
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

      {/* Store name + description */}
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{storeName}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 truncate">{description}</p>
        )}
      </div>

      {/* Amount */}
      <div className="rounded-xl bg-muted/30 border border-border/20 p-4 sm:p-5 text-center">
        <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          {formatCurrency(amount, currency)}
        </p>
      </div>

      {/* Reference */}
      {reference && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {t("block.order.reference")}
          </span>
          <span className="text-xs font-mono font-medium text-foreground/80">
            {reference}
          </span>
        </div>
      )}

      {/* Secure badge */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="h-3 w-3 text-muted-foreground/60" />
        <p className="text-[11px] text-muted-foreground/60">
          {t("block.order.secureBadge")}
        </p>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";