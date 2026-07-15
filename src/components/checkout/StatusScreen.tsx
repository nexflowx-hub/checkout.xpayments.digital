"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { CheckoutStep } from "@/types/checkout";

// ── PostMessage helper ──

function notifyParent(status: "SUCCESS" | "CLOSED" | "CANCELLED") {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, "*");
  }
}

// ── Animation Variants ──

const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};

const scalePop = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
};

// ── Success Animation ──

function SuccessCheckmark({ brandColor }: { brandColor: string }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial="initial"
      animate="animate"
      variants={scalePop}
    >
      <div
        className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full"
        style={{ backgroundColor: `${brandColor}10` }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <CheckCircle2
            className="h-10 w-10 sm:h-12 sm:w-12"
            style={{ color: brandColor }}
          />
        </motion.div>
      </div>

      {/* Decorative rings */}
      <motion.div
        className="absolute h-28 w-28 sm:h-32 sm:w-32 rounded-full border-2"
        style={{ borderColor: `${brandColor}15` }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      />
      <motion.div
        className="absolute h-36 w-36 sm:h-40 sm:w-40 rounded-full border"
        style={{ borderColor: `${brandColor}08` }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />
    </motion.div>
  );
}

// ── Processing Screen ──

function ProcessingScreen() {
  const { t } = useI18n();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6"
      {...fadeSlideUp}
    >
      <div className="relative">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          {t("status.processing")}
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {t("status.processingDesc")}
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Awaiting Screen (MB WAY / Bizum waiting) ──

function AwaitingScreen({ brandColor }: { brandColor: string }) {
  const { t } = useI18n();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6"
      {...fadeSlideUp}
    >
      <div className="relative">
        <div
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${brandColor}10` }}
        >
          <Smartphone className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: brandColor }} />
        </div>

        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${brandColor}30` }}
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${brandColor}20` }}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          {t("phone.waitingTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("phone.waitingDesc")}
        </p>
      </div>

      {/* Indeterminate progress bar */}
      <div className="w-52 h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: brandColor, width: "40%" }}
          animate={{ x: ["-100%", "350%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <p className="text-xs text-muted-foreground/70 max-w-[260px]">
        {t("phone.waitingHint")}
      </p>
    </motion.div>
  );
}

// ── Expired Screen ──

function ExpiredScreen() {
  const { t } = useI18n();

  const handleNewSession = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6 px-4"
      {...fadeSlideUp}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          {t("status.expiredTitle")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("status.expiredDesc")}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 text-sm font-medium"
        onClick={handleNewSession}
      >
        <RotateCcw className="h-4 w-4" />
        {t("status.newSession")}
      </Button>
    </motion.div>
  );
}

// ── Error Screen ──

function ErrorScreenContent({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-6 px-4"
      {...fadeSlideUp}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          {t("error.title")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 text-sm font-medium"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4" />
          {t("error.tryAgain")}
        </Button>
      )}
    </motion.div>
  );
}

// ── Success Screen ──

function SuccessScreenContent({
  storeName,
  brandColor,
  returnUrl,
}: {
  storeName: string;
  brandColor: string;
  returnUrl?: string;
}) {
  const { t } = useI18n();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    notifyParent("SUCCESS");
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        notifyParent("CLOSED");
        try { window.close(); } catch {}
      }
      return;
    }
    const timer = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, returnUrl]);

  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      try { window.close(); } catch {}
    }
  }, [returnUrl]);

  const progressPct = ((3 - countdown) / 3) * 100;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SuccessCheckmark brandColor={brandColor} />

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t("success.title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("success.thanks")}{" "}
          <span className="text-foreground font-medium">{storeName}</span>.
        </p>
        <p className="text-xs text-muted-foreground/80 mt-2">
          {t("success.email")}
        </p>
      </motion.div>

      <motion.div
        className="w-full max-w-[320px] space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: brandColor }}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>

        {returnUrl && countdown > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("success.redirecting").replace("{s}", String(countdown))}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("success.closeDesc")}</p>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 text-xs font-medium"
          onClick={handleClose}
        >
          {returnUrl ? t("success.returnToMerchant") : t("success.closeWindow")}
        </Button>
      </motion.div>
    </motion.div>
  );
}

import { useState, useEffect } from "react";

// ── Main Status Screen Router ──

interface StatusScreenProps {
  step: CheckoutStep;
  brandColor: string;
  storeName?: string;
  returnUrl?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function StatusScreen({
  step,
  brandColor,
  storeName,
  returnUrl,
  errorMessage,
  onRetry,
}: StatusScreenProps) {
  return (
    <AnimatePresence mode="wait">
      {step === "processing" && (
        <motion.div key="processing" {...fadeSlideUp}>
          <ProcessingScreen />
        </motion.div>
      )}

      {step === "awaiting" && (
        <motion.div key="awaiting" {...fadeSlideUp}>
          <AwaitingScreen brandColor={brandColor} />
        </motion.div>
      )}

      {step === "expired" && (
        <motion.div key="expired" {...fadeSlideUp}>
          <ExpiredScreen />
        </motion.div>
      )}

      {step === "error" && (
        <motion.div key="error" {...fadeSlideUp}>
          <ErrorScreenContent
            message={errorMessage || "An error occurred"}
            onRetry={onRetry}
          />
        </motion.div>
      )}

      {step === "cancelled" && (
        <motion.div key="cancelled" {...fadeSlideUp}>
          <ErrorScreenContent
            message="Payment was cancelled"
            onRetry={onRetry}
          />
        </motion.div>
      )}

      {step === "success" && (
        <motion.div key="success">
          <SuccessScreenContent
            storeName={storeName || "Store"}
            brandColor={brandColor}
            returnUrl={returnUrl}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}