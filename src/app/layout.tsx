import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XPayments — Hosted Checkout",
  description: "Plataforma de checkout White-Label Multi-Tenant com Smart Routing para Stripe e PIX.",
  keywords: ["XPayments", "checkout", "payment", "Stripe", "PIX", "white-label"],
  authors: [{ name: "XPayments" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "XPayments — Hosted Checkout",
    description: "Plataforma de checkout White-Label Multi-Tenant",
    siteName: "XPayments",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XPayments — Hosted Checkout",
    description: "Plataforma de checkout White-Label Multi-Tenant",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
