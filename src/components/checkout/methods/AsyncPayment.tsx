"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, Smartphone, RefreshCw, Shield, Landmark } from "lucide-react";
import type {
  CheckoutSession,
  PixCheckoutData,
  MultibancoCheckoutData,
} from "@/types/checkout";
import { formatCurrency, getPixCode, isQrCodeImage } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

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

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  const hasQrImage = isQrCodeImage(qrCode) && !imgError;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    function updateTimer() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(t("pix.expired"));
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
  }, [expiresAt, t]);

  const handleCopy = useCallback(async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pixCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [pixCode]);

  const isExpired = timeLeft === t("pix.expired");

  return (
    <div className="space-y-5">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-lg dark:shadow-black/20">
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
          </div>
          {isExpired && (
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {t("pix.qrExpired")}
              </p>
            </div>
          )}
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
          <div
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              isExpired
                ? "text-destructive border-destructive/30 bg-destructive/5"
                : "text-muted-foreground border-border bg-muted/30"
            }`}
          >
            <Clock className={`inline h-3 w-3 mr-1 ${isExpired ? "" : ""}`} />
            {isExpired ? t("pix.expired") : timeLeft}
          </div>
        )}
        <div
          className="text-xs font-semibold px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: `${brandColor}12`,
            color: brandColor,
            borderColor: `${brandColor}25`,
          }}
        >
          {formatCurrency(session.amount, session.currency)}
        </div>
      </div>

      {/* Copy PIX Code */}
      {pixCode && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("pix.copyTitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-[11px] sm:text-xs text-muted-foreground font-mono truncate select-all min-w-0">
              {pixCode}
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              className="shrink-0"
              onClick={handleCopy}
              disabled={isExpired}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 hidden sm:inline">
                    {t("pix.copied")}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("pix.copy")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Expired retry */}
      {isExpired && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-sm font-semibold gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          {t("pix.generateNew")}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 pt-1">
        <Shield className="h-3 w-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
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
}: {
  data: MultibancoCheckoutData;
  brandColor: string;
}) {
  const { t } = useI18n();

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className="flex items-center justify-center h-12 w-12 rounded-xl"
          style={{ backgroundColor: `${brandColor}12` }}
        >
          <Landmark className="h-6 w-6" style={{ color: brandColor }} />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t("multibanco.title")}
        </p>
      </div>

      {/* Entity / Reference / Amount */}
      <div className="space-y-3">
        {/* Entity */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {t("multibanco.entity")}
            </p>
            <p className="text-lg font-mono font-bold text-foreground mt-0.5">
              {data.entity}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleCopy(data.entity, "entity")}
          >
            {copiedField === "entity" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Reference */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {t("multibanco.reference")}
            </p>
            <p className="text-lg font-mono font-bold text-foreground mt-0.5">
              {data.reference}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleCopy(data.reference, "ref")}
          >
            {copiedField === "ref" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {t("multibanco.amount")}
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {formatCurrency(data.amount, "EUR")}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("multibanco.hint")}
      </p>
    </div>
  );
}

// ── Main Async Payment Component ──

interface AsyncPaymentProps {
  data: PixCheckoutData | MultibancoCheckoutData;
  session: CheckoutSession;
  brandColor: string;
  variant: "pix" | "multibanco";
}

export function AsyncPayment({
  data,
  session,
  brandColor,
  variant,
}: AsyncPaymentProps) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-muted/20 p-4 sm:p-5">
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
        />
      )}
    </div>
  );
}