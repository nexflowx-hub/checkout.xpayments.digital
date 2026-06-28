"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Zap, Palette, Globe, CreditCard, QrCode, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs">XP</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">XPayments</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Hosted Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Frontend Client
            </div>
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
              White-Label Multi-Tenant Hosted Checkout. Pure frontend client consuming the Master Backend via REST API.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Palette, label: "White-Label", desc: "Dynamic branding" },
              { icon: Zap, label: "Smart Routing", desc: "Stripe + PIX" },
              { icon: Globe, label: "Multi-Currency", desc: "EUR, BRL, USD..." },
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
              <CardTitle className="text-base">Architecture</CardTitle>
              <CardDescription className="text-muted-foreground">Pure Frontend Client — no local database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-foreground" />
                    <p className="text-sm font-medium text-foreground">Stripe</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment Element with dynamic theming and native methods (MBWay, Multibanco, Apple Pay)
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-foreground" />
                    <p className="text-sm font-medium text-foreground">PIX / MISTIC</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR Code + Copy &amp; Paste with expiration countdown
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/40 p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Checkout Route</p>
                <code className="block text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 font-mono">
                  /pay/:urlCode → fetch Master Backend → render gateway
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs font-mono bg-muted/40 rounded-lg p-4">
                <p><span className="text-foreground font-semibold">NEXT_PUBLIC_MASTER_API</span>=<span className="text-muted-foreground">"https://api.xpayments.digital"</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <span>Powered by</span>
          <span className="font-semibold text-muted-foreground">XPayments</span>
          <span>· checkout.xpayments.digital</span>
        </div>
      </footer>
    </div>
  );
}