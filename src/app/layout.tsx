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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "XPayments — Secure Checkout Platform",
    template: "%s | XPayments Checkout",
  },
  description:
    "XPayments is a white-label, multi-gateway secure payment checkout. Accept PIX, MB WAY, Bizum, Multibanco, and card payments with smart routing and modern UX.",
  keywords: [
    "checkout",
    "payment",
    "secure checkout",
    "PIX",
    "MB WAY",
    "Multibanco",
    "Bizum",
    "white-label checkout",
    "payment gateway",
    "multi-gateway",
    "Stripe",
    "pagamento",
    "gateway de pagamento",
    "checkout seguro",
    "smart routing",
    "drop-in checkout",
    "payment orchestration",
  ],
  authors: [{ name: "NexFlowX Hub", url: "https://xpayments.digital" }],
  creator: "NexFlowX Hub",
  publisher: "NexFlowX Hub",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "XPayments — Secure Checkout Platform",
    description:
      "White-label, multi-gateway secure payment checkout. Smart routing for PIX, MB WAY, Bizum, Multibanco, and card payments.",
    type: "website",
    locale: "pt_PT",
    alternateLocale: ["pt_BR", "en_US", "es_ES", "fr_FR"],
    siteName: "XPayments",
  },
  twitter: {
    card: "summary_large_image",
    title: "XPayments — Secure Checkout Platform",
    description:
      "White-label, multi-gateway secure payment checkout with smart routing.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  metadataBase: new URL("https://checkout.xpayments.digital"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}