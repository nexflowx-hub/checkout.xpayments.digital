"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Globe, Zap, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs tracking-tight">XP</span>
            </div>
            <span className="font-semibold text-foreground">XPayments</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Checkout Platform</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Universal Checkout
              <br />
              <span className="text-muted-foreground">for Modern Commerce</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              A white-label, multi-gateway payment checkout.
              Designed for performance, security, and seamless integration.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="rounded-2xl border border-border/40 bg-card p-5 text-left space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Smart Routing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic gateway selection based on currency, country, and merchant configuration.
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card p-5 text-left space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Globe className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Multi-Country</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                PIX, MB WAY, Bizum, Multibanco, Cards — adapted per country and language.
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card p-5 text-left space-y-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Layers className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">White-Label</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your brand, your colors, your logo. No gateway branding visible to customers.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/50">XPayments Checkout Platform</span>
          <span className="text-xs text-muted-foreground/50">v3.0</span>
        </div>
      </footer>
    </div>
  );
}