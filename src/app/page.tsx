"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Globe, Zap, Layers, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs tracking-tight">XP</span>
            </div>
            <span className="font-semibold text-sm text-foreground">XPayments</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Secure Checkout Platform</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8 sm:space-y-10 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest px-3 py-1.5 rounded-full border border-border/30 bg-muted/20">
              <Zap className="h-3 w-3" />
              Smart Drop-in Checkout
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.15]">
              Universal Checkout
              <br />
              <span className="text-muted-foreground/70">for Modern Commerce</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground/70 leading-relaxed max-w-lg mx-auto">
              A white-label, multi-gateway payment checkout.
              Designed for performance, security, and seamless integration.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {[
              {
                icon: Zap,
                title: "Smart Routing",
                desc: "Automatic gateway selection based on currency, country, and merchant configuration.",
              },
              {
                icon: Globe,
                title: "Multi-Country",
                desc: "PIX, MB WAY, Bizum, Multibanco, Cards — adapted per country and language.",
              },
              {
                icon: Layers,
                title: "White-Label",
                desc: "Your brand, your colors, your logo. No gateway branding visible to customers.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/25 bg-card/60 p-5 text-left space-y-3 hover:bg-card/80 hover:border-border/40 transition-all duration-200"
              >
                <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-foreground/80" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-xs text-muted-foreground/40">
              Visit <span className="text-muted-foreground/60 font-medium">/pay/:sessionId</span> to start a checkout session
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer — sticky */}
      <footer className="mt-auto border-t border-border/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/40">XPayments Checkout Platform</span>
          <span className="text-[11px] text-muted-foreground/30 font-mono">v3.1</span>
        </div>
      </footer>
    </div>
  );
}