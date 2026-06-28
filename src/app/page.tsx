"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Zap, Palette, Globe, CreditCard, QrCode } from "lucide-react";

export default function Home() {
  return (
    <div className="dark min-h-screen flex flex-col bg-[#09090b]">
      {/* Hero */}
      <header className="border-b border-border/40 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-[#09090b] font-bold text-xs">XP</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">XPayments</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Hosted Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Frontend Client
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              checkout.xpayments.digital
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Plataforma de checkout White-Label Multi-Tenant. Frontend puro que consome o Master Backend (Spaceship) via API REST.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Palette, label: "White-Label", desc: "Branding dinâmico" },
              { icon: Zap, label: "Smart Routing", desc: "Stripe + PIX" },
              { icon: Globe, label: "Multi-Moeda", desc: "EUR, BRL, USD..." },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 text-center p-3 rounded-xl border border-border/40 bg-card">
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Architecture */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Arquitetura</CardTitle>
              <CardDescription className="text-muted-foreground">Frontend Client puro — sem base de dados local.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-foreground" />
                    <p className="text-sm font-medium text-foreground">Stripe</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment Element com theming dinâmico e métodos nativos (MBWay, Multibanco, Apple Pay)
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-foreground" />
                    <p className="text-sm font-medium text-foreground">PIX / MISTIC</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR Code + Copia e Cola com countdown de expiração
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/40 p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Rota de Checkout</p>
                <code className="block text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 font-mono">
                  /pay/:urlCode → fetch Master Backend → renderiza gateway
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Variáveis de Ambiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs font-mono bg-muted/40 rounded-lg p-4">
                <p><span className="text-foreground font-semibold">NEXT_PUBLIC_MASTER_API</span>=<span className="text-muted-foreground">"https://api.xpayments.digital"</span></p>
                <p><span className="text-foreground font-semibold">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>=<span className="text-muted-foreground">"pk_live_..."</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <span>Powered by</span>
          <span className="font-semibold text-muted-foreground">XPayments</span>
          <span>· checkout.xpayments.digital</span>
        </div>
      </footer>
    </div>
  );
}
