"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Clock, QrCode, Smartphone, RefreshCw } from "lucide-react";
import type { PixCheckoutData, PaymentLinkData } from "@/types/checkout";
import { formatCurrency, getPixCode, isQrCodeImage } from "@/types/checkout";

interface PixPaymentFormProps {
  checkoutData: PixCheckoutData;
  brandColor: string;
  paymentLink: PaymentLinkData;
  onSuccess: () => void;
}

export function PixPaymentForm({
  checkoutData,
  brandColor,
  paymentLink,
  onSuccess,
}: PixPaymentFormProps) {
  const pixCode = getPixCode(checkoutData);
  const { expiresAt, qrCode } = checkoutData;

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  // Determine QR display strategy
  const hasQrImage = isQrCodeImage(qrCode) && !imgError;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    function updateTimer() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
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

  const handleCopy = useCallback(async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
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

  const isExpired = timeLeft === "Expirado";

  return (
    <div className="space-y-5">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="relative">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border shadow-sm">
            {hasQrImage ? (
              // Backend provided QR as image (URL or base64)
              <img
                src={qrCode}
                alt="QR Code PIX"
                className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              // Generate QR locally from pixString
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
            <div className="absolute inset-0 bg-background/80 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">QR Expirado</p>
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4" style={{ color: brandColor }} />
            <p className="text-sm font-medium text-foreground">
              Escaneie o QR Code
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Abra o app do seu banco e escaneie
          </p>
        </div>
      </div>

      {/* Timer & Amount */}
      <div className="flex items-center justify-center gap-3">
        <Badge
          variant="outline"
          className="text-xs gap-1.5 px-3 py-1"
        >
          <Clock className={`h-3 w-3 ${isExpired ? "text-destructive" : ""}`} />
          <span className={isExpired ? "text-destructive font-medium" : ""}>
            {isExpired ? "Expirado" : timeLeft}
          </span>
        </Badge>
        <Badge
          variant="secondary"
          className="text-xs font-semibold px-3 py-1"
        >
          {formatCurrency(paymentLink.amountFiat, paymentLink.currency)}
        </Badge>
      </div>

      {/* Copy PIX Code */}
      {pixCode && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Código PIX Copia e Cola
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2.5 text-[11px] sm:text-xs text-muted-foreground font-mono truncate select-all min-w-0">
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
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copiar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Expired — retry */}
      {isExpired && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-sm font-semibold gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          Gerar novo QR Code
        </Button>
      )}

      <p className="text-[11px] text-center text-muted-foreground">
        Após o pagamento, a página será atualizada automaticamente.
      </p>
    </div>
  );
}