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
      className="h-8 px-2.5 gap-1.5 text-xs shrink-0"
      onClick={() => onCopy(value, field)}
    >
      {isCopied ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </motion.div>
          {label && <span className="text-green-500">{label}</span>}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          {label && <span className="text-muted-foreground">{label}</span>}
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
            className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-lg dark:shadow-black/30"
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
                className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2"
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
          <p className="text-xs text-muted-foreground">
            {t("pix.scanSubtitle")}
          </p>
        </div>
      </div>

      {/* Timer & Amount */}
      <div className="flex items-center justify-center gap-3">
        {expiresAt && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              isExpired
                ? "text-destructive border-destructive/30 bg-destructive/5"
                : "text-muted-foreground border-border bg-muted/30"
            }`}
          >
            <Clock className="inline h-3 w-3 mr-1" />
            {isExpired ? t("pix.expired") : timeLeft}
          </span>
        )}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: `${brandColor}10`,
            color: brandColor,
            borderColor: `${brandColor}20`,
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
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("pix.copyTitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/30 border border-border/60 rounded-lg px-3 py-2.5 text-[11px] sm:text-xs text-muted-foreground font-mono truncate select-all min-w-0">
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

      <div className="flex items-center justify-center gap-2 pt-1">
        <Shield className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[11px] text-muted-foreground/50">
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
        className="flex flex-col items-center text-center gap-2"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="flex items-center justify-center h-12 w-12 rounded-xl"
          style={{ backgroundColor: `${brandColor}10` }}
        >
          <Landmark className="h-6 w-6" style={{ color: brandColor }} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t("multibanco.title")}
        </p>
      </motion.div>

      {/* Entity / Reference / Amount cards */}
      <div className="space-y-2.5">
        {/* Entity */}
        <motion.div
          className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {t("multibanco.entity")}
            </p>
            <p className="text-xl font-mono font-bold text-foreground mt-0.5 tracking-wide">
              {data.entity}
            </p>
          </div>
          <CopyButton
            field="entity"
            value={data.entity}
            copiedField={copiedField}
            onCopy={copy}
          />
        </motion.div>

        {/* Reference */}
        <motion.div
          className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {t("multibanco.reference")}
            </p>
            <p className="text-xl font-mono font-bold text-foreground mt-0.5 tracking-wide">
              {data.reference}
            </p>
          </div>
          <CopyButton
            field="ref"
            value={data.reference}
            copiedField={copiedField}
            onCopy={copy}
          />
        </motion.div>

        {/* Amount */}
        <motion.div
          className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/40"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {t("multibanco.amount")}
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {formatCurrency(data.amount, "EUR")}
            </p>
          </div>
          <CopyButton
            field="amount"
            value={formatCurrency(data.amount, "EUR")}
            copiedField={copiedField}
            onCopy={copy}
          />
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground/70 text-center">
        {t("multibanco.hint")}
      </p>

      {/* Close button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 text-sm font-medium gap-2 rounded-xl"
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
      className="rounded-2xl border border-foreground/[0.06] bg-muted/20 p-4 sm:p-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
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
    </motion.div>
  );
}