"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Layers3,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { ApiPaymentMethod } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";
import { useCountry } from "@/hooks/use-country";

interface PaymentWallProps {
  paymentMethods: ApiPaymentMethod[];
  enabled: boolean;
  selectedMethodCode: string | null;
  locked: boolean;
  onSelectMethod: (method: ApiPaymentMethod) => void;
  brandColor: string;
  countryCode?: string;
}

const normalize = (code: string) => code.toLowerCase().replace(/-/g, "_");

function priority(code: string, countryCode?: string) {
  const country = String(countryCode || "").toUpperCase();
  const method = normalize(code);
  const orders: Record<string, string[]> = {
    PT: ["mb_way", "multibanco", "card", "stripe_all", "bizum"],
    ES: ["bizum", "card", "stripe_all", "mb_way", "multibanco"],
    BR: ["pix", "card", "stripe_all"],
  };
  const order =
    orders[country] || ["card", "stripe_all", "mb_way", "bizum", "multibanco", "pix"];
  const index = order.indexOf(method);
  return index === -1 ? 100 : index;
}

function logoFor(code: string) {
  switch (normalize(code)) {
    // Restore the previous raster asset here. The SVG in the repository is
    // the negative (white-lettering) MB WAY variant and becomes illegible
    // inside the checkout's white method tile.
    case "mb_way":
      return "/icons/mbway.png";
    case "bizum":
      return "/icons/bizum.svg";
    case "multibanco":
      return "/icons/multibanco.png";
    case "pix":
      return "/icons/pix.svg";
    default:
      return null;
  }
}

function subtitleFor(code: string, t: (key: string) => string) {
  switch (normalize(code)) {
    case "card":
      return t("block.payment.cardBrands") || "Cartões e wallets compatíveis";
    case "stripe_all":
      return "Wallets e métodos elegíveis para este pagamento";
    case "mb_way":
      return "Confirme diretamente na aplicação MB WAY";
    case "bizum":
      return "Autorize na aplicação do seu banco";
    case "multibanco":
      return "Receba Entidade e Referência de pagamento";
    case "pix":
      return "QR Code e PIX Copia e Cola com confirmação automática";
    default:
      return "Pagamento protegido e processado de forma segura";
  }
}

function labelFor(method: ApiPaymentMethod, t: (key: string) => string) {
  switch (normalize(method.code)) {
    case "card":
      return t("method.card") || "Cartão";
    case "stripe_all":
      return "Mais opções";
    case "mb_way":
      return t("method.mbway") || "MB WAY";
    case "bizum":
      return t("method.bizum") || "Bizum";
    case "multibanco":
      return t("method.multibanco") || "Multibanco";
    case "pix":
      return t("method.pix") || "PIX";
    default:
      return method.label || method.code;
  }
}

function methodTexture(code: string, brandColor: string) {
  switch (normalize(code)) {
    case "mb_way":
      return "radial-gradient(circle at 92% 8%, rgba(229,0,23,.10), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(250,250,250,.94))";
    case "bizum":
      return "radial-gradient(circle at 92% 8%, rgba(0,169,165,.12), transparent 36%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(248,252,252,.95))";
    case "multibanco":
      return "radial-gradient(circle at 92% 8%, rgba(45,85,155,.10), transparent 36%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(248,250,253,.95))";
    case "pix":
      return "radial-gradient(circle at 92% 8%, rgba(50,188,173,.14), transparent 36%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(247,253,252,.95))";
    case "card":
      return "radial-gradient(circle at 92% 0%, rgba(63,81,181,.09), transparent 38%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(247,248,252,.95))";
    default:
      return `radial-gradient(circle at 92% 0%, ${brandColor}14, transparent 40%), linear-gradient(135deg, rgba(255,255,255,.99), rgba(250,250,250,.95))`;
  }
}

export function PaymentWall({
  paymentMethods,
  enabled,
  selectedMethodCode,
  locked,
  onSelectMethod,
  brandColor,
  countryCode,
}: PaymentWallProps) {
  const { t } = useI18n();
  const detectedCountry = useCountry();
  const effectiveCountry = countryCode || detectedCountry;
  const ordered = [...paymentMethods].sort(
    (a, b) => priority(a.code, effectiveCountry) - priority(b.code, effectiveCountry)
  );

  return (
    <motion.section
      className="relative overflow-hidden rounded-[26px] border border-border/50 bg-card/95 shadow-[0_24px_72px_-48px_rgba(15,23,42,.55)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-[.12] blur-3xl"
        style={{ background: `radial-gradient(circle at 22% 0%, ${brandColor}, transparent 60%)` }}
      />

      <div className="relative flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
            style={{
              backgroundColor: `${brandColor}0D`,
              borderColor: `${brandColor}20`,
              color: brandColor,
            }}
          >
            <WalletCards className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("block.payment.title")}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Escolha a forma de pagamento mais conveniente.
            </p>
          </div>
        </div>

        {effectiveCountry && (
          <div className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:flex">
            <MapPin className="h-3 w-3" />
            {effectiveCountry.toUpperCase()}
          </div>
        )}
      </div>

      <div className="mx-5 h-px bg-border/35 sm:mx-6" />

      <div className="relative p-4 sm:p-5">
        {!enabled && (
          <div className="mb-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
            {t("block.payment.disabledHint")}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ordered.map((method) => (
            <MethodCard
              key={method.code}
              method={method}
              selected={normalize(selectedMethodCode || "") === normalize(method.code)}
              disabled={!enabled || locked}
              brandColor={brandColor}
              label={labelFor(method, t)}
              subtitle={subtitleFor(method.code, t)}
              onClick={() => onSelectMethod(method)}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ligação segura e métodos disponíveis para este pagamento.
        </div>
      </div>
    </motion.section>
  );
}

function MethodCard({
  method,
  selected,
  disabled,
  brandColor,
  label,
  subtitle,
  onClick,
}: {
  method: ApiPaymentMethod;
  selected: boolean;
  disabled: boolean;
  brandColor: string;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  const code = normalize(method.code);
  const logo = logoFor(code);
  const isCard = code === "card";
  const isMore = code === "stripe_all";
  const isMbWay = code === "mb_way";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.988 }}
      transition={{ duration: 0.12 }}
      className={`group relative min-h-[112px] overflow-hidden rounded-[21px] border p-4 text-left transition-[border-color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        disabled
          ? "cursor-not-allowed border-border/30 bg-muted/20 opacity-45"
          : selected
            ? "border-foreground/20 shadow-[0_20px_48px_-34px_rgba(15,23,42,.62)]"
            : "border-border/50 shadow-[0_12px_34px_-30px_rgba(15,23,42,.52)] hover:border-foreground/15 hover:shadow-[0_20px_48px_-34px_rgba(15,23,42,.6)]"
      }`}
      style={{ background: disabled ? undefined : methodTexture(code, brandColor) }}
      aria-pressed={selected}
      aria-label={label}
    >
      <div className="relative flex h-full items-start gap-3.5">
        <div
          className={`grid h-[54px] shrink-0 place-items-center overflow-hidden rounded-[17px] border bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,.6)] ${
            isMbWay ? "w-[78px]" : "w-[60px]"
          }`}
          style={{ borderColor: selected ? `${brandColor}30` : "rgba(148,163,184,.22)" }}
        >
          {isCard ? (
            <div className="flex items-center gap-1.5 px-2">
              <img src="/icons/visa.svg" alt="Visa" className="h-[13px] w-auto" draggable={false} />
              <img
                src="/icons/mastercard.svg"
                alt="Mastercard"
                className="h-[24px] w-auto"
                draggable={false}
              />
            </div>
          ) : isMore ? (
            <div className="flex items-center gap-1.5 px-2">
              <img src="/icons/apple-pay.svg" alt="Wallet" className="h-[18px] w-auto" draggable={false} />
              <Layers3 className="h-5 w-5" style={{ color: brandColor }} strokeWidth={1.6} />
            </div>
          ) : logo ? (
            <img
              src={logo}
              alt={label}
              className={
                isMbWay
                  ? "max-h-[38px] max-w-[68px] object-contain"
                  : code === "multibanco"
                    ? "max-h-9 max-w-[48px] object-contain"
                    : "max-h-8 max-w-[48px] object-contain"
              }
              draggable={false}
            />
          ) : (
            <LockKeyhole className="h-6 w-6 text-zinc-700" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-foreground">{label}</p>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.5] text-muted-foreground">
                {subtitle}
              </p>
            </div>
            <AnimatePresence>
              {selected && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {isCard && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="rounded-full border border-border/50 bg-white/80 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-zinc-600">
                3DS
              </span>
              <span className="rounded-full border border-border/50 bg-white/80 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-zinc-600">
                PCI
              </span>
            </div>
          )}

          {isMore && (
            <div className="mt-2.5 inline-flex items-center rounded-full border border-border/45 bg-white/75 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-500">
              Métodos inteligentes
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
