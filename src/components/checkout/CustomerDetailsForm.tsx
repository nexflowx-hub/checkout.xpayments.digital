"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, User, Mail, Phone, MapPin, Home } from "lucide-react";
import type { CustomerDetails } from "@/types/checkout";
import { useI18n, COUNTRIES, detectCountryCode } from "@/lib/i18n";

interface CustomerDetailsFormProps {
  onSubmit: (details: CustomerDetails) => Promise<void>;
  brandColor: string;
}

export function CustomerDetailsForm({
  onSubmit,
  brandColor,
}: CustomerDetailsFormProps) {
  const { t, locale } = useI18n();
  const countries = COUNTRIES[locale] ?? COUNTRIES.pt;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track whether user has manually changed the country
  const [countryTouched, setCountryTouched] = useState(false);

  // Auto-detect country on mount using shared utility
  useEffect(() => {
    if (!country) {
      setCountry(detectCountryCode());
    }
  }, []);

  // When user manually picks a country, mark as touched
  function handleCountryChange(val: string) {
    setCountryTouched(true);
    setCountry(val);
  }

  // When locale changes and user hasn't manually set country, re-suggest
  useEffect(() => {
    if (!countryTouched && country) {
      const suggested = detectCountryCode();
      if (suggested !== country) {
        setCountry(suggested);
      }
    }
  }, [locale]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t("form.fullNameRequired");
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t("form.fullNameMin");
    }

    if (!email.trim()) {
      newErrors.email = t("form.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("form.emailInvalid");
    }

    if (!country) {
      newErrors.country = t("form.countryRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        country,
        address: address.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        city: city.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">
          {t("form.fullName")} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder={t("form.fullNamePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10 h-11"
            aria-invalid={!!errors.fullName}
            disabled={isSubmitting}
          />
        </div>
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          {t("form.email")} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={t("form.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11"
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Phone + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
            {t("form.phone")}
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder={t("form.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-11"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            {t("form.country")} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Select value={country} onValueChange={handleCountryChange} disabled={isSubmitting}>
              <SelectTrigger className="pl-10 h-11 w-full">
                <SelectValue placeholder={t("form.countryRequired")} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-medium text-muted-foreground">
          {t("form.address")}
        </Label>
        <div className="relative">
          <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            type="text"
            placeholder={t("form.addressPlaceholder")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pl-10 h-11"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Postal Code + City */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="postalCode" className="text-xs font-medium text-muted-foreground">
            {t("form.postalCode")}
          </Label>
          <Input
            id="postalCode"
            type="text"
            placeholder={t("form.postalCodePlaceholder")}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="h-11"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">
            {t("form.city")}
          </Label>
          <Input
            id="city"
            type="text"
            placeholder={t("form.cityPlaceholder")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-11"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-sm font-semibold mt-2 gap-2"
        style={{ backgroundColor: brandColor, color: "#fff" }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("form.processing")}
          </>
        ) : (
          <>
            {t("form.submit")}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground mt-2 leading-relaxed">
        {t("form.terms")}{" "}
        <span className="underline cursor-pointer hover:text-foreground transition-colors">
          {t("form.termsService")}
        </span>
        {" "}{t("form.termsAnd")}{" "}
        <span className="underline cursor-pointer hover:text-foreground transition-colors">
          {t("form.privacyPolicy")}
        </span>
      </p>
    </form>
  );
}