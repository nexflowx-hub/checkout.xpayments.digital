"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CreditCard,
  Layers3,
  LockKeyhole,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { ApiPaymentMethod } from "@/types/checkout";
import { useI18n } from "@/lib/i18n";

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
    case "mb_way":
      return "/icons/mbway.png";
    case "bizum":
      return "/icons/bizum.svg";
    case "multibanco":
      return "/icons/multibanco.png";
    default:
      return null;
  }
}

function subtitleFor(code: string, t: (key: string) => string) {
  switch (normalize(code)) {
    case "card":
      return t("block.payment.cardBrands") || "Visa, Mastercard, Amex";
    case "stripe_all":
      return "Apple Pay, Google Pay, Link e outros disponíveis";
    case "mb_way":
      return "Confirmação segura na aplicação MB WAY";
    case "bizum":
      return "Confirmação na aplicação do seu banco";
    case "multibanco":
      return "Entidade e referência para pagamento";
    default:
      return "Pagamento seguro";
  }
}

function labelFor(method: ApiPaymentMethod, t: (key: string) => string) {
  switch (normalize(method.code)) {
    case "card": return t("method.card") || "Cartão";
    case "stripe_all": return "Mais opções";
    case "mb_way": return t("method.mbway") || "MB WAY";
    case "bizum": return t("method.bizum") || "Bizum";
    case "multibanco": return t("method.multibanco") || "Multibanco";
    default: return method.label || method.code;
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
  const ordered = [...paymentMethods].sort(
    (a, b) => priority(a.code, countryCode) - priority(b.code, countryCode)
  );

  return (
    <motion.section
      className="relative overflow-hidden rounded-[28px] border border-border/50 bg-card/90 shadow-[0_22px_70px_-42px_rgba(15,23,42,.55)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle at 25% 0%, ${brandColor}, transparent 62%)` }}
      />

      <div className="relative flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border shadow-sm"
            style={{ backgroundColor: `${brandColor}12`, borderColor: `${brandColor}25`, color: brandColor }}
          >
            <LockKeyhole className="h-[18px] w-[18px]" />
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

        {countryCode && (
          <div className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:flex">
            <MapPin className="h-3 w-3" />
            {countryCode.toUpperCase()}
          </div>
        )}
      </div>

      <div className="mx-5 h-px bg-border/40 sm:mx-6" />

      <div className="relative p-4 sm:p-5">
        {!enabled && (
          <div className="mb-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
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

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <Sparkles className="h-3 w-3" />
          Métodos priorizados de acordo com país, moeda e disponibilidade da Store.
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
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={`group relative min-h-[116px] overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        disabled
          ? "cursor-not-allowed border-border/30 bg-muted/20 opacity-45"
          : selected
            ? "border-foreground/20 bg-background shadow-[0_18px_45px_-28px_rgba(15,23,42,.6)]"
            : "border-border/50 bg-background/75 shadow-[0_10px_35px_-30px_rgba(15,23,42,.5)] hover:border-foreground/15 hover:bg-background"
      }`}
      aria-pressed={selected}
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: brandColor }}
      />

      <div className="relative flex h-full items-start gap-3.5">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[18px] border bg-white shadow-sm"
          style={{ borderColor: selected ? `${brandColor}35` : "rgba(148,163,184,.22)" }}
        >
          {isCard ? (
            <CreditCard className="h-7 w-7 text-zinc-800" strokeWidth={1.7} />
          ) : isMore ? (
            <Layers3 className="h-7 w-7" style={{ color: brandColor }} strokeWidth={1.7} />
          ) : logo ? (
            <img src={logo} alt="" className="max-h-9 max-w-[46px] object-contain" draggable={false} />
          ) : (
            <LockKeyhole className="h-6 w-6 text-zinc-700" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-foreground">{label}</p>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.45] text-muted-foreground">{subtitle}</p>
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
              {['VISA', 'MC', 'AMEX'].map((brand) => (
                <span key={brand} className="rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-muted-foreground">
                  {brand}
                </span>
              ))}
            </div>
          )}

          {isMore && (
            <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
              Stripe Dynamic
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
