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
    default: "Checkout Seguro",
    template: "%s | Checkout",
  },
  description:
    "Secure payment checkout platform. Multi-gateway smart routing.",
  keywords: [
    "checkout",
    "payment",
    "secure",
    "PIX",
    "MB WAY",
    "Bizum",
    "white-label",
    "pagamento",
    "gateway de pagamento",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Secure Checkout",
    description: "Multi-gateway secure payment platform.",
    type: "website",
    locale: "pt_PT",
    alternateLocale: ["pt_BR", "en_US", "es_ES", "fr_FR"],
  },
  twitter: {
    card: "summary",
    title: "Secure Checkout",
    description: "Multi-gateway secure payment platform.",
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