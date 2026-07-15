"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Building2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, COUNTRIES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
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

  // Check if any optional field is filled (to show "add details" state)
  const hasOptionalFields = phone || address || city || postalCode || company || vatId;

  // Notify parent only when validity changes
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

  return (
    <motion.div
      className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.03, ease: [0.25, 0.1, 0.25, 1] }}
    >
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </motion.div>
        )}
      </div>

      {/* Required fields: Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-name" className="text-xs font-medium text-muted-foreground">
            {t("block.customer.name")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="customer-name"
              type="text"
              placeholder={t("block.customer.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`pl-10 h-11 rounded-lg transition-colors ${
                touched.name && errors.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : isValid
                    ? "border-green-500/40 focus-visible:ring-green-500/20"
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
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="customer-email"
              type="email"
              placeholder={t("block.customer.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`pl-10 h-11 rounded-lg transition-colors ${
                touched.email && errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : isValid
                    ? "border-green-500/40 focus-visible:ring-green-500/20"
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

      {/* Toggle optional fields */}
      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group w-full"
      >
        <motion.div
          animate={{ rotate: showOptional ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
        <span className="group-hover:underline underline-offset-2">
          {t("block.customer.addDetails")}
        </span>
      </button>

      {/* Optional fields (expandable) */}
      <AnimatePresence>
        {showOptional && (
          <motion.div
            className="space-y-3 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="pt-1 space-y-3">
              {/* Phone + Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("block.customer.phone")}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      type="tel"
                      placeholder={t("block.customer.phonePlaceholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("block.customer.company")}
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      type="text"
                      placeholder={t("block.customer.companyPlaceholder")}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("block.customer.address")}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    type="text"
                    placeholder={t("block.customer.addressPlaceholder")}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>

              {/* City + Postal Code + Country */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("block.customer.city")}
                  </Label>
                  <Input
                    type="text"
                    placeholder={t("block.customer.cityPlaceholder")}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("block.customer.postalCode")}
                  </Label>
                  <Input
                    type="text"
                    placeholder={t("block.customer.postalCodePlaceholder")}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("block.customer.country")}
                  </Label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("block.customer.vatId")}
                </Label>
                <Input
                  type="text"
                  placeholder={t("block.customer.vatIdPlaceholder")}
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  className="h-11 rounded-lg max-w-[200px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}