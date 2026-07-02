"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Clock, QrCode, Smartphone, RefreshCw, Shield } from "lucide-react";
import type { PixCheckoutData, CheckoutSession } from "@/types/checkout";
import { formatCurrency, getPixCode, isQrCodeImage } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

interface PixPaymentFormProps {
  checkoutData: PixCheckoutData;
  brandColor: string;
  session: CheckoutSession;
  onSuccess: () => void;
}

export function PixPaymentForm({
  checkoutData,
  brandColor,
  session,
  onSuccess,
}: PixPaymentFormProps) {
  const { t } = useI18n();
  const pixCode = getPixCode(checkoutData);
  const { expiresAt, qrCode } = checkoutData;

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
    <div className="space-y-6">
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
        <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1">
          <Clock className={`h-3 w-3 ${isExpired ? "text-destructive" : ""}`} />
          <span className={isExpired ? "text-destructive font-medium" : ""}>
            {isExpired ? t("pix.expired") : timeLeft}
          </span>
        </Badge>
        <Badge
          className="text-xs font-semibold px-3 py-1"
          style={{ backgroundColor: `${brandColor}18`, color: brandColor, borderColor: `${brandColor}30` }}
          variant="outline"
        >
          {formatCurrency(session.amountFiat, session.currency)}
        </Badge>
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