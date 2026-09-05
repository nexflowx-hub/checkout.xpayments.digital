"use client";

import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiPaymentMethod } from "@/types/checkout";
import { getMethodVisual, isCardMethodCode } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PaymentWallProps {
  paymentMethods: ApiPaymentMethod[];
  enabled: boolean;
  selectedMethodCode: string | null;
  locked: boolean;
  onSelectMethod: (method: ApiPaymentMethod) => void;
  brandColor: string;
}

const HOSTED_CHECKOUT_METHODS = new Set([
  "card",
  "mbway",
  "mb_way",
  "bizum",
  "multibanco",
]);

export function PaymentWall({
  paymentMethods,
  enabled,
  selectedMethodCode,
  locked,
  onSelectMethod,
  brandColor,
}: PaymentWallProps) {
  const { t } = useI18n();

  const visibleMethods = paymentMethods.filter((method) =>
    HOSTED_CHECKOUT_METHODS.has(method.code.toLowerCase().replace(/-/g, "_"))
  );
  const cardMethods = visibleMethods.filter((m) => isCardMethodCode(m.code));
  const otherMethods = visibleMethods.filter((m) => !isCardMethodCode(m.code));

  return (
    <motion.div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden shadow-[0_14px_45px_rgba(15,23,42,0.05)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-xl"
            style={{ backgroundColor: `${brandColor}0D` }}
          >
            <Lock className="h-4 w-4" style={{ color: brandColor }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">
              {t("block.payment.title")}
            </h2>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Pagamento processado em ambiente seguro XPayments
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/40 mx-5 sm:mx-6" />

      <div className={`p-4 sm:p-5 space-y-3 ${!enabled ? "opacity-35 pointer-events-none select-none" : ""}`}>
        {!enabled && (
          <motion.p
            className="text-xs text-muted-foreground text-center py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {t("block.payment.disabledHint")}
          </motion.p>
        )}

        {visibleMethods.length === 0 && enabled && (
          <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum método disponível</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Esta Store ainda não possui um método compatível com Hosted Checkout.
            </p>
          </div>
        )}

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

        {otherMethods.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
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
    </motion.div>
  );
}

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
        group relative flex items-center rounded-xl border transition-all duration-200 cursor-pointer text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${isWide ? "gap-4 px-4 py-3.5 sm:py-4" : "flex-col items-center justify-center gap-3 px-3 py-4 sm:py-5"}
        ${disabled
          ? "border-border/20 bg-muted/20 cursor-not-allowed"
          : isSelected
            ? "border-foreground/15 bg-foreground/[0.03] shadow-[0_0_0_1px_var(--foreground),0_2px_8px_rgba(0,0,0,0.04)]"
            : "border-border/30 bg-background hover:border-foreground/10 hover:bg-foreground/[0.02] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98]"
        }
      `}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      aria-label={displayLabel}
      aria-pressed={isSelected}
    >
      <div
        className={`
          flex items-center justify-center rounded-lg shrink-0 transition-all duration-200
          ${isSelected && !disabled ? "bg-foreground/[0.04]" : "bg-muted/40 group-hover:bg-muted/60"}
          ${isWide ? "h-11 w-20 sm:h-12 sm:w-24 gap-1" : "h-12 w-12 sm:h-14 sm:w-14"}
        `}
      >
        {isWide ? (
          <div className="flex items-center gap-1.5">
            <img
              src={visual.icon}
              alt=""
              className="h-6 sm:h-7 w-auto object-contain"
              loading="lazy"
              draggable={false}
            />
            {visual.iconSecondary && (
              <img
                src={visual.iconSecondary}
                alt=""
                className="h-6 sm:h-7 w-auto object-contain"
                loading="lazy"
                draggable={false}
              />
            )}
          </div>
        ) : (
          <img
            src={visual.icon}
            alt=""
            className={`h-8 w-8 sm:h-10 sm:w-10 object-contain transition-transform duration-200 ${!disabled && !isSelected ? "group-hover:scale-105" : ""}`}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      <div className={`min-w-0 ${isWide ? "flex-1" : "text-center"}`}>
        <span className={`block text-[13px] font-medium tracking-tight leading-tight ${disabled ? "text-muted-foreground/50" : "text-foreground/90"}`}>
          {displayLabel}
        </span>
      </div>

      <AnimatePresence>
        {isSelected && !disabled && (
          <motion.div
            className={`absolute rounded-full flex items-center justify-center ${isWide ? "top-2 right-2 h-5 w-5" : "-top-1.5 -right-1.5 h-5 w-5"}`}
            style={{ backgroundColor: brandColor }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {isWide && isSelected && !disabled && (
        <motion.div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ backgroundColor: brandColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      )}
    </motion.button>
  );
}
