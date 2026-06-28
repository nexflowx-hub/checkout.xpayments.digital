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
import { detectCountry } from "@/types/checkout";

interface CustomerDetailsFormProps {
  onSubmit: (details: CustomerDetails) => Promise<void>;
  brandColor: string;
}

const COUNTRIES = [
  { value: "PT", label: "Portugal" },
  { value: "BR", label: "Brasil" },
  { value: "ES", label: "Espanha" },
  { value: "FR", label: "França" },
  { value: "DE", label: "Alemanha" },
  { value: "IT", label: "Itália" },
  { value: "GB", label: "Reino Unido" },
  { value: "US", label: "Estados Unidos" },
  { value: "AO", label: "Angola" },
  { value: "MZ", label: "Moçambique" },
  { value: "CV", label: "Cabo Verde" },
  { value: "CH", label: "Suíça" },
  { value: "NL", label: "Holanda" },
  { value: "BE", label: "Bélgica" },
  { value: "IE", label: "Irlanda" },
  { value: "LU", label: "Luxemburgo" },
  { value: "OTHER", label: "Outro" },
];

export function CustomerDetailsForm({
  onSubmit,
  brandColor,
}: CustomerDetailsFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect country on mount
  useEffect(() => {
    setCountry(detectCountry());
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Mínimo 2 caracteres";
    }

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    if (!country) {
      newErrors.country = "Selecione o país";
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
          Nome Completo <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder="João Silva"
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
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="joao@email.com"
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
            Telefone
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+351 912 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-11"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            País <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Select value={country} onValueChange={setCountry} disabled={isSubmitting}>
              <SelectTrigger className="pl-10 h-11 w-full">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
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
          Morada
        </Label>
        <div className="relative">
          <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            type="text"
            placeholder="Rua, Número, Andar"
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
            Código Postal
          </Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="1000-001"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="h-11"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">
            Cidade
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="Lisboa"
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
            A processar...
          </>
        ) : (
          <>
            Continuar para Pagamento
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground mt-2 leading-relaxed">
        Ao continuar, concorda com os{" "}
        <span className="underline cursor-pointer hover:text-foreground transition-colors">Termos de Serviço</span>
        {" "}e{" "}
        <span className="underline cursor-pointer hover:text-foreground transition-colors">Política de Privacidade</span>
      </p>
    </form>
  );
}