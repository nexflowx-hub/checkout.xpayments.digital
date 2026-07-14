"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { PaymentMethodType, PaymentMethodOption } from "@/types/checkout";
import { getPaymentMethodsForCurrency } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PaymentWallProps {
  currency: string;
  enabled: boolean;
  selectedMethod: PaymentMethodType | null;
  locked: boolean;
  onSelectMethod: (method: PaymentMethodOption) => void;
  brandColor: string;
}

export function PaymentWall({
  currency,
  enabled,
  selectedMethod,
  locked,
  onSelectMethod,
  brandColor,
}: PaymentWallProps) {
  const { t } = useI18n();

  const methods = useMemo(
    () => getPaymentMethodsForCurrency(currency),
    [currency]
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
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
        <p className="text-xs text-muted-foreground text-center py-1">
          {t("block.payment.disabledHint")}
        </p>
      )}

      {/* Payment Method Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isDisabled = !enabled || locked;

          return (
            <button
              key={method.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectMethod(method)}
              className={`
                relative flex flex-col items-center justify-center gap-2.5
                rounded-xl border-2 p-4 sm:p-5
                transition-all duration-200 cursor-pointer
                ${isDisabled
                  ? "opacity-40 cursor-not-allowed border-border/40 bg-muted/10"
                  : isSelected
                    ? "border-foreground/20 bg-foreground/[0.04] shadow-sm"
                    : "border-border/50 bg-card hover:border-foreground/15 hover:bg-muted/30 hover:shadow-sm active:scale-[0.98]"
                }
              `}
              aria-label={t(method.labelKey)}
              aria-pressed={isSelected}
            >
              {/* Icon */}
              <div
                className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-lg transition-colors ${
                  isSelected ? "bg-foreground/5" : "bg-muted/40"
                }`}
              >
                <img
                  src={method.icon}
                  alt=""
                  className="h-6 w-auto sm:h-7 object-contain"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <span
                className={`text-xs font-semibold tracking-wide ${
                  isDisabled ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {t(method.labelKey)}
              </span>

              {/* Coming Soon badge */}
              {method.comingSoon && (
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 text-[9px] px-1.5 py-0 h-4 font-medium"
                >
                  {t("method.comingSoon")}
                </Badge>
              )}

              {/* Selected indicator */}
              {isSelected && !isDisabled && (
                <div
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: brandColor }}
                >
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}