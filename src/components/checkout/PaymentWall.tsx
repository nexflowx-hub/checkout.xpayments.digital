"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiPaymentMethod } from "@/types/checkout";
import { getMethodVisual, isCardMethodCode } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PaymentWallProps {
  /** Payment methods from the API — rendered dynamically via .map() */
  paymentMethods: ApiPaymentMethod[];
  enabled: boolean;
  selectedMethodCode: string | null;
  locked: boolean;
  onSelectMethod: (method: ApiPaymentMethod) => void;
  brandColor: string;
}

export function PaymentWall({
  paymentMethods,
  enabled,
  selectedMethodCode,
  locked,
  onSelectMethod,
  brandColor,
}: PaymentWallProps) {
  const { t } = useI18n();

  // Separate card from other methods for layout (card = full width, others = 2-col grid)
  const cardMethods = paymentMethods.filter((m) => isCardMethodCode(m.code));
  const otherMethods = paymentMethods.filter((m) => !isCardMethodCode(m.code));

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

      {/* Payment Method Grid — fully dynamic from API */}
      <div className={`space-y-2.5 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Card methods — full width */}
        {cardMethods.map((method) => (
          <MethodButton
            key={method.code}
            method={method}
            isSelected={selectedMethodCode === method.code}
            disabled={!enabled || locked}
            brandColor={brandColor}
            t={t}
            onClick={() => onSelectMethod(method)}
            isWide
          />
        ))}

        {/* Other methods — 2-column grid */}
        {otherMethods.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {otherMethods.map((method) => (
              <MethodButton
                key={method.code}
                method={method}
                isSelected={selectedMethodCode === method.code}
                disabled={!enabled || locked}
                brandColor={brandColor}
                t={t}
                onClick={() => onSelectMethod(method)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card brands note — only if card is present */}
      {cardMethods.length > 0 && enabled && (
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
  method: ApiPaymentMethod;
  isSelected: boolean;
  disabled: boolean;
  brandColor: string;
  t: (key: string) => string;
  onClick: () => void;
  isWide?: boolean;
}) {
  // Get visual config (icon, labelKey) from our local map; fallback to API label
  const visual = getMethodVisual(method.code);
  const displayLabel = visual.labelKey
    ? t(visual.labelKey)
    : (visual.resolvedLabel || method.label);

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
      aria-label={displayLabel}
      aria-pressed={isSelected}
    >
      {/* Icon */}
      <div
        className={`flex items-center justify-center gap-1.5 rounded-lg transition-colors shrink-0 ${
          isSelected ? "bg-foreground/5" : "bg-muted/30"
        } ${isWide ? "h-10 w-10 sm:h-11 sm:w-11" : "h-10 w-10 sm:h-11 sm:w-11"}`}
      >
        <img
          src={visual.icon}
          alt=""
          className={`object-contain ${isWide ? "h-5 sm:h-6" : "h-6 sm:h-7"}`}
          loading="lazy"
        />
        {visual.iconSecondary && (
          <img
            src={visual.iconSecondary}
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
        {displayLabel}
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
    </motion.button>
  );
}