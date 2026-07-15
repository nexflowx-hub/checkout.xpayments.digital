"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentMethodType, PaymentMethodOption } from "@/types/checkout";
import { getPaymentMethods } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PaymentWallProps {
  currency: string;
  countryCode?: string;
  enabled: boolean;
  selectedMethod: PaymentMethodType | null;
  locked: boolean;
  onSelectMethod: (method: PaymentMethodOption) => void;
  brandColor: string;
}

export function PaymentWall({
  currency,
  countryCode,
  enabled,
  selectedMethod,
  locked,
  onSelectMethod,
  brandColor,
}: PaymentWallProps) {
  const { t } = useI18n();

  const methods = useMemo(
    () => getPaymentMethods(currency, countryCode),
    [currency, countryCode]
  );

  // Separate "card" from other methods — card gets special treatment
  const cardMethod = methods.find((m) => m.id === "card");
  const otherMethods = methods.filter((m) => m.id !== "card");

  return (
    <motion.div
      className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Lock
            className="h-4 w-4"
            style={{ color: enabled ? brandColor : "var(--muted-foreground)" }}
          />
          <h2 className="text-sm font-semibold text-foreground">
            {t("block.payment.title")}
          </h2>
        </div>
      </div>

      {/* Disabled hint */}
      {!enabled && (
        <motion.p
          className="text-xs text-muted-foreground text-center py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {t("block.payment.disabledHint")}
        </motion.p>
      )}

      {/* Payment Method Grid */}
      <div className={`space-y-2.5 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Card — full width with brand logos */}
        {cardMethod && (
          <MethodButton
            key={cardMethod.id}
            method={cardMethod}
            isSelected={selectedMethod === cardMethod.id}
            disabled={!enabled || locked}
            brandColor={brandColor}
            t={t}
            onClick={() => onSelectMethod(cardMethod)}
            isWide
          />
        )}

        {/* Other methods — 2-column grid */}
        {otherMethods.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {otherMethods.map((method) => (
              <MethodButton
                key={method.id}
                method={method}
                isSelected={selectedMethod === method.id}
                disabled={!enabled || locked}
                brandColor={brandColor}
                t={t}
                onClick={() => onSelectMethod(method)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card brands note */}
      {cardMethod && enabled && (
        <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
          {t("block.payment.cardBrands")}
        </p>
      )}
    </motion.div>
  );
}

// ── Method Button ──

function MethodButton({
  method,
  isSelected,
  disabled,
  brandColor,
  t,
  onClick,
  isWide = false,
}: {
  method: PaymentMethodOption;
  isSelected: boolean;
  disabled: boolean;
  brandColor: string;
  t: (key: string) => string;
  onClick: () => void;
  isWide?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        relative flex items-center gap-3
        rounded-xl border-2 p-3.5 sm:p-4
        transition-all duration-200 cursor-pointer text-left
        ${disabled
          ? "opacity-40 cursor-not-allowed border-border/30 bg-muted/5"
          : isSelected
            ? "border-foreground/20 bg-foreground/[0.04] shadow-sm"
            : "border-border/40 bg-card hover:border-foreground/15 hover:bg-muted/20 hover:shadow-sm active:scale-[0.98]"
        }
        ${isWide ? "" : "flex-col items-center justify-center gap-2.5 text-center"}
      `}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      aria-label={t(method.labelKey)}
      aria-pressed={isSelected}
    >
      {/* Icon (with optional secondary icon for card brands) */}
      <div
        className={`flex items-center justify-center gap-1.5 rounded-lg transition-colors shrink-0 ${
          isSelected ? "bg-foreground/5" : "bg-muted/30"
        } ${isWide ? "h-10 w-10 sm:h-11 sm:w-11" : "h-10 w-10 sm:h-11 sm:w-11"}`}
      >
        <img
          src={method.icon}
          alt=""
          className={`object-contain ${isWide ? "h-5 sm:h-6" : "h-6 sm:h-7"}`}
          loading="lazy"
        />
        {method.iconSecondary && (
          <img
            src={method.iconSecondary}
            alt=""
            className={`object-contain ${isWide ? "h-5 sm:h-6" : "h-6 sm:h-7"}`}
            loading="lazy"
          />
        )}
      </div>

      {/* Label */}
      <span
        className={`text-xs font-semibold tracking-wide ${
          disabled ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {t(method.labelKey)}
      </span>

      {/* Selected indicator */}
      <AnimatePresence>
        {isSelected && !disabled && (
          <motion.div
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: brandColor }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coming Soon badge */}
      {method.comingSoon && (
        <Badge
          variant="secondary"
          className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 h-4 font-medium"
        >
          {t("method.comingSoon")}
        </Badge>
      )}
    </motion.button>
  );
}