"use client";

import { Receipt, ShieldCheck } from "lucide-react";
import type { CheckoutSession } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";
import { CountdownTimer } from "@/components/checkout/CountdownTimer";
import { motion } from "framer-motion";

interface OrderBlockProps {
  session: CheckoutSession;
  brandColor: string;
  onExpire?: () => void;
}

function formatStableAmount(amount: number, currency: string): string {
  const upper = currency.toUpperCase();
  const locales: Record<string, string> = {
    BRL: "pt-BR",
    EUR: "pt-PT",
    GBP: "en-GB",
    USD: "en-US",
    PLN: "pl-PL",
  };

  return new Intl.NumberFormat(locales[upper] || "en-US", {
    style: "currency",
    currency: upper,
  }).format(amount);
}

export function OrderBlock({ session, brandColor, onExpire }: OrderBlockProps) {
  const { t } = useI18n();
  const { amount, currency, reference, storeName, description, expiresAt, metadata } = session;
  const expiration = expiresAt || metadata?.expiresAt;

  return (
    <motion.div
      className="overflow-hidden rounded-[26px] border border-border/40 bg-card/95 shadow-[0_20px_60px_-46px_rgba(15,23,42,.48)]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="px-5 pb-3 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
              style={{ backgroundColor: `${brandColor}0D`, borderColor: `${brandColor}20` }}
            >
              <Receipt className="h-4 w-4" style={{ color: brandColor }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-none text-foreground">{t("block.order.title")}</h2>
              <p className="mt-1 max-w-[220px] truncate text-[11px] text-muted-foreground/70">{storeName}</p>
            </div>
          </div>

          {expiration && (
            <CountdownTimer targetDate={expiration} onExpire={onExpire}>
              {({ formatted, isExpired }) => (
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    isExpired
                      ? "border-destructive/20 bg-destructive/5 text-destructive"
                      : "border-border/40 bg-muted/25 text-muted-foreground"
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

      <div className="mx-5 h-px bg-border/30 sm:mx-6" />

      <div className="px-5 py-5 sm:px-6">
        {description && (
          <p className="mx-auto mb-3 max-w-[340px] truncate text-center text-xs text-muted-foreground/65">{description}</p>
        )}

        <div className="py-2 text-center sm:py-3">
          <p className="text-3xl font-bold leading-none tracking-tight text-foreground sm:text-[2.35rem]">
            {formatStableAmount(amount, currency)}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground/55">{currency}</p>
        </div>

        {reference && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-[10px] text-muted-foreground/50">{t("block.order.reference")}</span>
            <span className="max-w-[240px] truncate rounded-md bg-muted/35 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground/60">{reference}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-4 sm:px-6">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-muted-foreground/40" />
          <p className="text-[10px] tracking-wide text-muted-foreground/45">{t("block.order.secureBadge")}</p>
        </div>
      </div>
    </motion.div>
  );
}
