"use client";

import { useState } from "react";
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
import { Loader2, ArrowRight, User, Mail, MapPin } from "lucide-react";
import type { CustomerDetails } from "@/types/checkout";

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
  { value: "OTHER", label: "Outro" },
];

export function CustomerDetailsForm({
  onSubmit,
  brandColor,
}: CustomerDetailsFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Nome deve ter pelo menos 2 caracteres";
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
      await onSubmit({ fullName: fullName.trim(), email: email.trim(), country });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">
          Nome Completo
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
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
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

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-sm font-medium">
          País
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

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold mt-2"
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

      <p className="text-[11px] text-center text-muted-foreground mt-3">
        Ao continuar, concorda com os{" "}
        <span className="underline cursor-pointer">Termos de Serviço</span>
        {" "}e{" "}
        <span className="underline cursor-pointer">Política de Privacidade</span>
      </p>
    </form>
  );
}