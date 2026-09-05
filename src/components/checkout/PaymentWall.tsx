"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Layers3,
  LockKeyhole,
  MapPin,
  Sparkles,
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
    BR: ["card", "stripe_all", "mb_way", "bizum", "multibanco"],
  };
  const order = orders[country] || ["card", "stripe_all", "mb_way", "bizum", "multibanco"];
  const index = order.indexOf(method);
  return index === -1 ? 100 : index;
}

function logoFor(code: string) {
  switch (normalize(code)) {
    case "mb_way": return "/icons/mbway.svg";
    case "bizum": return "/icons/bizum.svg";
    case "multibanco": return "/icons/multibanco.png";
    default: return null;
  }
}

function subtitleFor(code: string, t: (key: string) => string) {
  switch (normalize(code)) {
    case "card": return t("block.payment.cardBrands") || "Visa e Mastercard";
    case "stripe_all": return "Apple Pay, Google Pay, Link e métodos elegíveis";
    case "mb_way": return "Confirme diretamente na aplicação MB WAY";
    case "bizum": return "Autorize na aplicação do seu banco";
    case "multibanco": return "Receba Entidade e Referência de pagamento";
    default: return "Pagamento seguro";
  }
}

function labelFor(method: ApiPaymentMethod, t: (key: string) => string) {
  switch (normalize(method.code)) {
    case "card": return t("method.card") || "Cartão";
    case "stripe_all": return "Outros métodos";
    case "mb_way": return t("method.mbway") || "MB WAY";
    case "bizum": return t("method.bizum") || "Bizum";
    case "multibanco": return t("method.multibanco") || "Multibanco";
    default: return method.label || method.code;
  }
}

function methodTexture(code: string, brandColor: string) {
  switch (normalize(code)) {
    case "mb_way":
      return "radial-gradient(circle at 92% 8%, rgba(237,28,36,.12), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.98), rgba(250,250,250,.88))";
    case "bizum":
      return "radial-gradient(circle at 92% 8%, rgba(0,169,165,.15), transparent 36%), linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,252,252,.9))";
    case "multibanco":
      return "radial-gradient(circle at 92% 8%, rgba(45,85,155,.12), transparent 36%), linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,253,.9))";
    case "card":
      return "radial-gradient(circle at 92% 0%, rgba(63,81,181,.12), transparent 38%), linear-gradient(135deg, rgba(255,255,255,.98), rgba(247,248,252,.92))";
    default:
      return `radial-gradient(circle at 92% 0%, ${brandColor}18, transparent 40%), linear-gradient(135deg, rgba(255,255,255,.98), rgba(250,250,250,.9))`;
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
      className="relative overflow-hidden rounded-[30px] border border-border/55 bg-card/95 shadow-[0_28px_90px_-52px_rgba(15,23,42,.65)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle at 22% 0%, ${brandColor}, transparent 60%)` }}
      />

      <div className="relative flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[17px] border shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_8px_24px_-16px_rgba(15,23,42,.5)]"
            style={{ backgroundColor: `${brandColor}10`, borderColor: `${brandColor}25`, color: brandColor }}
          >
            <WalletCards className="h-[19px] w-[19px]" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("block.payment.title")}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Selecione a opção mais conveniente para este pagamento.
            </p>
          </div>
        </div>

        {effectiveCountry && (
          <div className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-background/65 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm sm:flex">
            <MapPin className="h-3 w-3" />
            {effectiveCountry.toUpperCase()}
          </div>
        )}
      </div>

      <div className="mx-5 h-px bg-border/40 sm:mx-6" />

      <div className="relative p-4 sm:p-5">
        {!enabled && (
          <div className="mb-3 rounded-[18px] border border-border/45 bg-muted/25 px-4 py-3 text-center text-xs text-muted-foreground">
            {t("block.payment.disabledHint")}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/65">
          <Sparkles className="h-3 w-3" />
          Métodos organizados conforme país, moeda e disponibilidade.
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

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -3, scale: 1.004 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={`group relative min-h-[124px] overflow-hidden rounded-[24px] border p-4 text-left transition-[border-color,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        disabled
          ? "cursor-not-allowed border-border/30 bg-muted/20 opacity-45"
          : selected
            ? "border-foreground/20 shadow-[0_24px_55px_-34px_rgba(15,23,42,.72),inset_0_1px_0_rgba(255,255,255,.75)]"
            : "border-border/55 shadow-[0_15px_44px_-34px_rgba(15,23,42,.62),inset_0_1px_0_rgba(255,255,255,.72)] hover:border-foreground/15 hover:shadow-[0_24px_58px_-36px_rgba(15,23,42,.68),inset_0_1px_0_rgba(255,255,255,.8)]"
      }`}
      style={{ background: disabled ? undefined : methodTexture(code, brandColor) }}
      aria-pressed={selected}
      aria-label={label}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(135deg,rgba(15,23,42,.8)_1px,transparent_1px)] [background-size:10px_10px]" />
      <div
        className="pointer-events-none absolute -bottom-12 -right-10 h-28 w-28 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: brandColor }}
      />

      <div className="relative flex h-full items-start gap-3.5">
        <div
          className="grid h-[58px] w-[64px] shrink-0 place-items-center overflow-hidden rounded-[19px] border bg-white/95 shadow-[0_10px_30px_-22px_rgba(15,23,42,.75),inset_0_1px_0_#fff]"
          style={{ borderColor: selected ? `${brandColor}35` : "rgba(148,163,184,.24)" }}
        >
          {isCard ? (
            <div className="flex items-center gap-1.5 px-2">
              <img src="/icons/visa.svg" alt="Visa" className="h-[13px] w-auto" draggable={false} />
              <img src="/icons/mastercard.svg" alt="Mastercard" className="h-[25px] w-auto" draggable={false} />
            </div>
          ) : isMore ? (
            <div className="relative flex items-center gap-1.5 px-2">
              <img src="/icons/apple-pay.svg" alt="Apple Pay" className="h-[19px] w-auto" draggable={false} />
              <Layers3 className="h-5 w-5" style={{ color: brandColor }} strokeWidth={1.6} />
            </div>
          ) : logo ? (
            <img
              src={logo}
              alt={label}
              className={`${code === "multibanco" ? "max-h-10 max-w-[50px]" : "max-h-9 max-w-[50px]"} object-contain`}
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
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.5] text-muted-foreground">{subtitle}</p>
            </div>
            <AnimatePresence>
              {selected && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {isCard && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="rounded-full border border-border/55 bg-white/75 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-zinc-600">3DS</span>
              <span className="rounded-full border border-border/55 bg-white/75 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-zinc-600">PCI</span>
            </div>
          )}

          {isMore && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border/45 bg-white/70 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-500">
              Stripe Dynamic
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
