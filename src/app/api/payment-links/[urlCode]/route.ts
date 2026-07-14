import { NextRequest, NextResponse } from "next/server";

// Mock payment links database for demo
const PAYMENT_LINKS: Record<string, {
  id: string;
  storeId: string;
  name: string;
  amountFiat: number;
  currency: string;
  branding: {
    storeName: string;
    logo?: string;
    color: string;
  };
}> = {
  demo_eur: {
    id: "pl_01",
    storeId: "store_pt_001",
    name: "Sapatilhas Nike Air Max 90",
    amountFiat: 15000,
    currency: "EUR",
    branding: {
      storeName: "Nike Store",
      logo: "",
      color: "#111111",
    },
  },
  demo_brl: {
    id: "pl_02",
    storeId: "store_br_001",
    name: "Camiseta Premium Branca",
    amountFiat: 8990,
    currency: "BRL",
    branding: {
      storeName: "Loja do Brasil",
      logo: "",
      color: "#16a34a",
    },
  },
  demo_red: {
    id: "pl_03",
    storeId: "store_pt_002",
    name: "Aula Particular de Surf",
    amountFiat: 4500,
    currency: "EUR",
    branding: {
      storeName: "Azores Surf School",
      logo: "",
      color: "#dc2626",
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ urlCode: string }> }
) {
  const { urlCode } = await params;

  const apiUrl = process.env.API_URL;

  // If a real API URL is configured, proxy to it
  if (apiUrl) {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/payment-links/${urlCode}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error("[payment-links] Proxy error:", error);
    }
  }

  // Mock response
  const link = PAYMENT_LINKS[urlCode];

  if (!link) {
    return NextResponse.json(
      {
        success: false,
        error: "Payment link not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: link,
  });
}