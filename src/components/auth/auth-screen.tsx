"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2, Sun, Moon, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";

export function AuthScreen() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch {
      // error is already in the store
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
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
                Merchant Portal
              </p>
            </div>
          </div>
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
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm border-border/40">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50">
              <LogIn className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Iniciar Sessão</CardTitle>
            <CardDescription>
              Aceda ao painel da sua loja
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="loja@exemplo.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? "A autenticar..." : "Entrar"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Ligação encriptada</span>
            </div>
          </CardContent>
        </Card>
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