"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  QrCode,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Palette,
  Globe,
} from "lucide-react";

const DEMO_LINKS = [
  {
    urlCode: "demo_eur",
    label: "Stripe (EUR)",
    description: "Nike Store — Sapatilhas Nike Air Max 90",
    amount: "€150.00",
    color: "#111111",
    icon: CreditCard,
  },
  {
    urlCode: "demo_brl",
    label: "PIX (BRL)",
    description: "Loja do Brasil — Camiseta Premium Branca",
    amount: "R$89.90",
    color: "#16a34a",
    icon: QrCode,
  },
  {
    urlCode: "demo_red",
    label: "Stripe (EUR)",
    description: "Azores Surf School — Aula Particular de Surf",
    amount: "€45.00",
    color: "#dc2626",
    icon: CreditCard,
  },
];

export default function Home() {
  const [customCode, setCustomCode] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs">XP</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">
                XPayments
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Hosted Checkout
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-medium gap-1">
            <ShieldCheck className="h-3 w-3" />
            Sandbox
          </Badge>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              checkout.xpayments.digital
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Plataforma de checkout White-Label Multi-Tenant com Smart Routing
              para Stripe e PIX.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Palette, label: "White-Label", desc: "Branding dinâmico" },
              { icon: Zap, label: "Smart Routing", desc: "Gateway automático" },
              { icon: Globe, label: "Multi-Moeda", desc: "EUR, BRL, USD..." },
            ].map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center gap-2 text-center p-3"
              >
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Demo Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Demonstrações</CardTitle>
              <CardDescription>
                Clique num link para testar o checkout com branding dinâmico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_LINKS.map((demo) => (
                <Link
                  key={demo.urlCode}
                  href={`/pay/${demo.urlCode}`}
                  className="block"
                >
                  <div className="group flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${demo.color}15` }}
                    >
                      <demo.icon
                        className="h-5 w-5"
                        style={{ color: demo.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {demo.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {demo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {demo.amount}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Custom URL Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Código Personalizado</CardTitle>
              <CardDescription>
                Introduza um código de link de pagamento para testar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customCode.trim()) {
                    window.location.href = `/pay/${customCode.trim()}`;
                  }
                }}
                className="flex gap-2"
              >
                <div className="flex-1">
                  <Label htmlFor="urlCode" className="sr-only">
                    Código do link
                  </Label>
                  <Input
                    id="urlCode"
                    placeholder="Ex: demo_eur, demo_brl, demo_red"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Button type="submit" variant="outline" className="h-10 shrink-0">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Abrir
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          <span>Powered by</span>
          <span className="font-semibold text-foreground">XPayments</span>
          <span>&middot; checkout.xpayments.digital</span>
        </div>
      </footer>
    </div>
  );
}