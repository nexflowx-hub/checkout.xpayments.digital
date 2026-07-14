"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface CustomerBlockProps {
  brandColor: string;
  onValidityChange: (isValid: boolean, data: { name: string; email: string }) => void;
}

export function CustomerBlock({ onValidityChange }: CustomerBlockProps) {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const prevValidRef = useRef(false);

  // Compute validation errors (pure, no setState)
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!name.trim()) {
      e.name = t("block.customer.nameRequired");
    } else if (name.trim().length < 2) {
      e.name = t("block.customer.nameMin");
    }

    if (!email.trim()) {
      e.email = t("block.customer.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = t("block.customer.emailInvalid");
    }

    return e;
  }, [name, email, t]);

  const isValid = Object.keys(errors).length === 0 && name.trim() !== "" && email.trim() !== "";

  // Notify parent only when validity changes — uses effect for side effect
  useEffect(() => {
    if (isValid !== prevValidRef.current) {
      prevValidRef.current = isValid;
      onValidityChange(isValid, { name: name.trim(), email: email.trim() });
    }
  }, [isValid, name, email, onValidityChange]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {t("block.customer.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("block.customer.subtitle")}
          </p>
        </div>
        {isValid && (
          <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-name" className="text-xs font-medium text-muted-foreground">
            {t("block.customer.name")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="customer-name"
              type="text"
              placeholder={t("block.customer.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`pl-10 h-11 transition-colors ${
                touched.name && errors.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : isValid
                    ? "border-green-500/50 focus-visible:ring-green-500/30"
                    : ""
              }`}
              aria-invalid={touched.name && !!errors.name}
            />
          </div>
          {touched.name && errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-email" className="text-xs font-medium text-muted-foreground">
            {t("block.customer.email")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="customer-email"
              type="email"
              placeholder={t("block.customer.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`pl-10 h-11 transition-colors ${
                touched.email && errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : isValid
                    ? "border-green-500/50 focus-visible:ring-green-500/30"
                    : ""
              }`}
              aria-invalid={touched.email && !!errors.email}
            />
          </div>
          {touched.email && errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}