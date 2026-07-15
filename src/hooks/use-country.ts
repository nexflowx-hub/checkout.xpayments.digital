"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { detectCountryFromLocale, LANG_TO_COUNTRY } from "@/types/checkout";

/**
 * Hook that provides the detected user country code.
 * Uses the I18n context country code (from browser locale),
 * with a useMemo to keep it stable.
 */
export function useCountry(): string {
  const { countryCode } = useI18n();

  return useMemo(() => {
    // Use the I18n-detected country (set once on mount)
    if (countryCode) return countryCode;
    // Fallback: direct browser detection
    return detectCountryFromLocale();
  }, [countryCode]);
}

/**
 * Check if a country code is EU-based.
 */
export function useIsEU(): boolean {
  const country = useCountry();
  return useMemo(() => {
    const euCountries = [
      "PT", "ES", "FR", "DE", "IT", "NL", "BE", "IE", "LU",
      "AT", "FI", "SE", "DK", "PL", "CZ", "RO", "HU", "GR",
      "SK", "BG", "HR", "SI", "EE", "LV", "LT", "CY", "MT",
    ];
    return euCountries.includes(country.toUpperCase());
  }, [country]);
}