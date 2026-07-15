"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Building2, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, COUNTRIES } from "@/lib/i18n";
import { useCountry } from "@/hooks/use-country";

interface CustomerBlockProps {
  brandColor: string;
  onValidityChange: (isValid: boolean, data: { name: string; email: string }) => void;
}

export function CustomerBlock({ brandColor, onValidityChange }: CustomerBlockProps) {
  const { t, locale } = useI18n();
  const detectedCountry = useCountry();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showOptional, setShowOptional] = useState(false);
  const prevValidRef = useRef(false);

  // Optional fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState(detectedCountry);
  const [company, setCompany] = useState("");
  const [vatId, setVatId] = useState("");

  // Validate required fields only
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

  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (isValid !== prevValidRef.current) {
      prevValidRef.current = isValid;
      onValidityChange(isValid, { name: name.trim(), email: email.trim() });
    }
  }, [isValid, name, email, onValidityChange]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const countryList = COUNTRIES[locale] || COUNTRIES.en;

  const inputClasses = (field: string) =>
    `h-11 sm:h-12 rounded-xl border-border/30 bg-background px-4 text-sm transition-all duration-200
    focus-visible:border-foreground/20 focus-visible:ring-1 focus-visible:ring-foreground/10 focus-visible:ring-offset-1
    placeholder:text-muted-foreground/40
    ${touched[field] && errors[field]
      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
      : isValid
        ? "border-green-500/30 focus-visible:border-green-500/40"
        : ""
    }`;

  return (
    <motion.div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.03, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Section header */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-xl"
              style={{ backgroundColor: `${brandColor}0D` }}
            >
              <User className="h-4 w-4" style={{ color: brandColor }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-none">
                {t("block.customer.title")}
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                {t("block.customer.subtitle")}
              </p>
            </div>
          </div>
          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="h-px bg-border/30 mx-5 sm:mx-6" />

      {/* Form fields */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-name" className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
              {t("block.customer.name")} <span className="text-destructive/80">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                id="customer-name"
                type="text"
                placeholder={t("block.customer.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur("name")}
                className={`${inputClasses("name")} pl-10`}
                aria-invalid={touched.name && !!errors.name}
              />
            </div>
            {touched.name && errors.name && (
              <motion.p
                className="text-[11px] text-destructive/80 pl-1"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-email" className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
              {t("block.customer.email")} <span className="text-destructive/80">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                id="customer-email"
                type="email"
                placeholder={t("block.customer.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`${inputClasses("email")} pl-10`}
                aria-invalid={touched.email && !!errors.email}
              />
            </div>
            {touched.email && errors.email && (
              <motion.p
                className="text-[11px] text-destructive/80 pl-1"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.email}
              </motion.p>
            )}
          </div>
        </div>

        {/* Toggle optional fields */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors group w-full pt-1"
        >
          <motion.div
            animate={{ rotate: showOptional ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          <span className="group-hover:underline underline-offset-2">
            {t("block.customer.addDetails")}
          </span>
        </button>

        {/* Optional fields */}
        <AnimatePresence>
          {showOptional && (
            <motion.div
              className="space-y-3 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="pt-2 space-y-3">
                {/* Phone + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                      {t("block.customer.phone")}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        type="tel"
                        placeholder={t("block.customer.phonePlaceholder")}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputClasses("phone")} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                      {t("block.customer.company")}
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      <Input
                        type="text"
                        placeholder={t("block.customer.companyPlaceholder")}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={`${inputClasses("company")} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                    {t("block.customer.address")}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                      type="text"
                      placeholder={t("block.customer.addressPlaceholder")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`${inputClasses("address")} pl-10`}
                    />
                  </div>
                </div>

                {/* City + Postal Code + Country */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                      {t("block.customer.city")}
                    </Label>
                    <Input
                      type="text"
                      placeholder={t("block.customer.cityPlaceholder")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClasses("city")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                      {t("block.customer.postalCode")}
                    </Label>
                    <Input
                      type="text"
                      placeholder={t("block.customer.postalCodePlaceholder")}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className={inputClasses("postalCode")}
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                      {t("block.customer.country")}
                    </Label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`${inputClasses("country")} appearance-none`}
                    >
                      {countryList.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* VAT */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                    {t("block.customer.vatId")}
                  </Label>
                  <Input
                    type="text"
                    placeholder={t("block.customer.vatIdPlaceholder")}
                    value={vatId}
                    onChange={(e) => setVatId(e.target.value)}
                    className={`${inputClasses("vatId")} max-w-[200px]`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}