"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ShieldCheck,
  Store,
  CreditCard,
  QrCode,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.replace("/");
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  const handleCopyId = useCallback(() => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[10px]">XP</span>
            </div>
            <span className="font-semibold text-sm text-foreground">
              XPayments
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Merchant Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Olá, {user.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {user.tier
                  ? `Plano ${user.tier.replace(/_/g, " ")}`
                  : "Painel do Merchant"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ID: {user.id.slice(0, 8)}…</span>
              <button
                onClick={handleCopyId}
                className="ml-1 p-1 rounded hover:bg-muted/50 transition-colors"
                aria-label="Copy merchant ID"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/40">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Merchant ID
                    </p>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {user.id.slice(0, 12)}…
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Gateways</p>
                    <p className="text-sm font-medium text-foreground">
                      Stripe + PIX
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Checkout</p>
                    <p className="text-sm font-medium text-foreground">Ativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Checkout Link</CardTitle>
              <CardDescription>
                Use este link para abrir o checkout em modo iframe ou redirecionamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/40 p-4 space-y-2">
                <code className="block text-xs text-muted-foreground font-mono break-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/pay/:sessionId?theme=dark`
                    : "/pay/:sessionId?theme=dark"}
                </code>
                <p className="text-[11px] text-muted-foreground">
                  Substitua <code className="font-mono bg-muted px-1 rounded">:sessionId</code> pelo ID da sessão retornado pela API.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" asChild>
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Checkout
                </a>
              </Button>
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