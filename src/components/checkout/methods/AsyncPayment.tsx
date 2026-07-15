"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, Smartphone, RefreshCw, Shield, Landmark, X } from "lucide-react";
import type {
  CheckoutSession,
  PixCheckoutData,
  MultibancoCheckoutData,
} from "@/types/checkout";
import { formatCurrency, getPixCode, isQrCodeImage } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

// ── PostMessage helper ──

function notifyParent(status: "SUCCESS" | "CLOSED" | "CANCELLED") {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "XPAYMENTS_STATUS", status }, "*");
  }
}

// ── Copy to clipboard with visual feedback ──

function useCopyToClipboard() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = useCallback(async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return { copiedField, copy };
}

// ── Copy Button ──

function CopyButton({
  field,
  value,
  copiedField,
  onCopy,
  label,
}: {
  field: string;
  value: string;
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
  label?: string;
}) {
  const isCopied = copiedField === field;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 px-2.5 gap-1.5 text-xs shrink-0 rounded-lg"
      onClick={() => onCopy(value, field)}
    >
      {isCopied ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          </motion.div>
          {label && <span className="text-emerald-500">{label}</span>}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-muted-foreground/60" />
          {label && <span className="text-muted-foreground/60">{label}</span>}
        </>
      )}
    </Button>
  );
}

// ── PIX Payment Display ──

function PixDisplay({
  data,
  session,
  brandColor,
}: {
  data: PixCheckoutData;
  session: CheckoutSession;
  brandColor: string;
}) {
  const { t } = useI18n();
  const pixCode = getPixCode(data);
  const { expiresAt, qrCode } = data;
  const { copiedField, copy } = useCopyToClipboard();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasQrImage = isQrCodeImage(qrCode) && !imgError;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    function updateTimer() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="space-y-5">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {hasQrImage ? (
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <QRCodeSVG
                value={pixCode}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#1a1a1a"
                bgColor="#ffffff"
              />
            )}
          </motion.div>

          <AnimatePresence>
            {isExpired && (
              <motion.div
                className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Clock className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {t("pix.qrExpired")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4" style={{ color: brandColor }} />
            <p className="text-sm font-medium text-foreground">
              {t("pix.scanTitle")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60">
            {t("pix.scanSubtitle")}
          </p>
        </div>
      </div>

      {/* Timer & Amount */}
      <div className="flex items-center justify-center gap-3">
        {expiresAt && (
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              isExpired
                ? "text-destructive border-destructive/20 bg-destructive/5"
                : "text-muted-foreground border-border/40 bg-muted/30"
            }`}
          >
            <Clock className="inline h-3 w-3 mr-1" />
            {isExpired ? t("pix.expired") : timeLeft}
          </span>
        )}
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: `${brandColor}0D`,
            color: brandColor,
            borderColor: `${brandColor}18`,
          }}
        >
          {formatCurrency(session.amount, session.currency)}
        </span>
      </div>

      {/* Copy PIX Code */}
      {pixCode && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              {t("pix.copyTitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-3.5 py-2.5 text-[11px] sm:text-xs text-muted-foreground font-mono truncate select-all min-w-0">
              {pixCode}
            </div>
            <CopyButton
              field="pix"
              value={pixCode}
              copiedField={copiedField}
              onCopy={copy}
              label={t("pix.copy")}
            />
          </div>
        </motion.div>
      )}

      {/* Expired retry */}
      {isExpired && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-sm font-semibold gap-2 rounded-xl"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          {t("pix.generateNew")}
        </Button>
      )}

      <div className="flex items-center justify-center gap-1.5 pt-1">
        <Shield className="h-3 w-3 text-muted-foreground/30" />
        <p className="text-[10px] text-muted-foreground/30">
          {t("pix.autoRefresh")}
        </p>
      </div>
    </div>
  );
}

// ── Multibanco Payment Display ──

function MultibancoDisplay({
  data,
  brandColor,
  onClose,
}: {
  data: MultibancoCheckoutData;
  brandColor: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { copiedField, copy } = useCopyToClipboard();

  const handleClose = useCallback(() => {
    notifyParent("CLOSED");
    try { window.close(); } catch {}
    onClose();
  }, [onClose]);

  return (
    <div className="space-y-5">
      <motion.div
        className="flex flex-col items-center text-center gap-3"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="flex items-center justify-center h-12 w-12 rounded-2xl"
          style={{ backgroundColor: `${brandColor}0D` }}
        >
          <Landmark className="h-6 w-6" style={{ color: brandColor }} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t("multibanco.title")}
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          {t("multibanco.hint")}
        </p>
      </motion.div>

      {/* Entity / Reference / Amount */}
      <div className="space-y-2.5">
        {[
          { key: "entity", label: t("multibanco.entity"), value: data.entity, mono: true },
          { key: "ref", label: t("multibanco.reference"), value: data.reference, mono: true },
          { key: "amount", label: t("multibanco.amount"), value: formatCurrency(data.amount, "EUR"), mono: false },
        ].map((item, i) => (
          <motion.div
            key={item.key}
            className="flex items-center justify-between p-3.5 rounded-xl bg-muted/15 border border-border/25"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (i + 1) }}
          >
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                {item.label}
              </p>
              <p className={`text-lg sm:text-xl font-bold text-foreground mt-0.5 tracking-wide ${item.mono ? "font-mono" : ""}`}>
                {item.value}
              </p>
            </div>
            <CopyButton
              field={item.key}
              value={item.value}
              copiedField={copiedField}
              onCopy={copy}
            />
          </motion.div>
        ))}
      </div>

      {/* Close button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 text-sm font-medium gap-2 rounded-xl border-border/30"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
        {t("multibanco.close")}
      </Button>
    </div>
  );
}

// ── Main Async Payment Component ──

interface AsyncPaymentProps {
  data: PixCheckoutData | MultibancoCheckoutData;
  session: CheckoutSession;
  brandColor: string;
  variant: "pix" | "multibanco";
  onClose?: () => void;
}

export function AsyncPayment({
  data,
  session,
  brandColor,
  variant,
  onClose,
}: AsyncPaymentProps) {
  return (
    <motion.div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5 sm:p-6">
        {variant === "pix" ? (
          <PixDisplay
            data={data as PixCheckoutData}
            session={session}
            brandColor={brandColor}
          />
        ) : (
          <MultibancoDisplay
            data={data as MultibancoCheckoutData}
            brandColor={brandColor}
            onClose={onClose ?? (() => {})}
          />
        )}
      </div>
    </motion.div>
  );
}