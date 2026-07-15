"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PhonePaymentProps {
  method: string;
  brandColor: string;
  onSubmit: (phone: string) => void;
  isSubmitting: boolean;
  isWaiting: boolean;
}

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
  const { t, locale } = useI18n();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    const cleaned = phone.replace(/[\s\-()]/g, "").trim();
    if (!cleaned) {
      setError(t("phone.required"));
      return false;
    }
    if (!/^\+?\d{7,15}$/.test(cleaned)) {
      setError(t("phone.invalid"));
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

  const isBizum = method.toLowerCase() === "bizum";
  const placeholder = isBizum && locale === "es"
    ? t("phone.placeholder.es")
    : (METHOD_PLACEHOLDERS[method.toLowerCase()] ?? t("phone.placeholder"));

  // Waiting for approval state
  if (isWaiting) {
    return (
      <motion.div
        className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-6 sm:p-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Animated phone icon */}
          <div className="relative">
            <div
              className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-2xl"
              style={{ backgroundColor: `${brandColor}0D` }}
            >
              <Phone className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: brandColor }} />
            </div>

            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: `1.5px solid ${brandColor}20` }}
              animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: `1.5px solid ${brandColor}12` }}
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-semibold text-foreground">
              {t("phone.waitingTitle")}
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-[260px]">
              {t("phone.waitingDesc")}
            </p>
          </div>

          {/* Indeterminate progress */}
          <div className="w-52 h-1 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: brandColor, width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground/40 max-w-[260px]">
            {t("phone.waitingHint")}
          </p>
        </div>
      </motion.div>
    );
  }

  // Phone input form
  return (
    <motion.div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-xl"
            style={{ backgroundColor: `${brandColor}0D` }}
          >
            <Phone className="h-4 w-4" style={{ color: brandColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("phone.title")}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {isBizum ? "Bizum" : "MB WAY"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor={`phone-${method}`}
              className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase"
            >
              {t("phone.title")} <span className="text-destructive/80">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                id={`phone-${method}`}
                type="tel"
                placeholder={placeholder}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError(null);
                }}
                className="pl-10 h-11 sm:h-12 rounded-xl border-border/30 bg-background text-sm
                  focus-visible:border-foreground/20 focus-visible:ring-1 focus-visible:ring-foreground/10
                  placeholder:text-muted-foreground/40"
                aria-invalid={!!error}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {error && (
              <motion.p
                className="text-[11px] text-destructive/80 pl-1"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-sm font-semibold gap-2 rounded-xl transition-all duration-200"
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
    </motion.div>
  );
}