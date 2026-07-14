"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, Smartphone, CheckCircle2 } from "lucide-react";
import type { PaymentMethodType } from "@/types/checkout";
import { validatePhoneForMethod } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PhonePaymentProps {
  method: PaymentMethodType; // "mbway" | "bizum"
  brandColor: string;
  onSubmit: (phone: string) => void;
  isSubmitting: boolean;
  isWaiting: boolean;
}

/** Method-specific phone placeholders */
const METHOD_PLACEHOLDERS: Record<string, string> = {
  mbway: "+351 912 345 678",
  bizum: "+34 612 345 678",
};

export function PhonePayment({
  method,
  brandColor,
  onSubmit,
  isSubmitting,
  isWaiting,
}: PhonePaymentProps) {
  const { t } = useI18n();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    const errorKey = validatePhoneForMethod(phone, method);
    if (errorKey) {
      setError(t(errorKey));
      return false;
    }
    setError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(phone.trim());
  }

  const placeholder = METHOD_PLACEHOLDERS[method] ?? t("phone.placeholder");

  // Waiting for approval state
  if (isWaiting) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-muted/20 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Animated spinner icon */}
          <div
            className="relative flex items-center justify-center h-16 w-16 rounded-full"
            style={{ backgroundColor: `${brandColor}12` }}
          >
            <Smartphone
              className="h-7 w-7"
              style={{ color: brandColor }}
            />
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: brandColor }}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-semibold text-foreground">
              {t("phone.waitingTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("phone.waitingDesc")}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"
              style={{
                backgroundColor: brandColor,
                width: "40%",
                animation: "indeterminate 1.5s ease-in-out infinite",
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground/80 max-w-[260px]">
            {t("phone.waitingHint")}
          </p>
        </div>

        {/* Inline animation keyframes */}
        <style>{`
          @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    );
  }

  // Phone input form
  return (
    <div className="rounded-xl border border-foreground/10 bg-muted/20 p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone input */}
        <div className="space-y-1.5">
          <Label
            htmlFor={`phone-${method}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {t("phone.title")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`phone-${method}`}
              type="tel"
              placeholder={placeholder}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              className="pl-10 h-11"
              aria-invalid={!!error}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold gap-2"
          style={{ backgroundColor: brandColor, color: "#fff" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("phone.submitting")}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t("phone.submit")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}