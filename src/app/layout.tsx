import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export const metadata: Metadata = {
  title: {
    default: "XPayments — Checkout Seguro",
    template: "%s | XPayments",
  },
  description:
    "Plataforma de checkout white-label multi-tenant. Pagamento seguro via Stripe (EUR/USD) e PIX (BRL) com smart routing.",
  keywords: [
    "XPayments",
    "checkout",
    "payment",
    "Stripe",
    "PIX",
    "MISTICPAY",
    "white-label",
    "pagamento",
    "checkout seguro",
    "gateway de pagamento",
  ],
  authors: [{ name: "NexFlowX Hub", url: "https://xpayments.digital" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "XPayments — Checkout Seguro",
    description: "Plataforma de checkout white-label com Stripe e PIX.",
    siteName: "XPayments",
    type: "website",
    locale: "pt_PT",
    alternateLocale: ["pt_BR", "en_US"],
  },
  twitter: {
    card: "summary",
    title: "XPayments — Checkout Seguro",
    description: "Plataforma de checkout white-label com Stripe e PIX.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}