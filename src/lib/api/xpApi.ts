// ── XPayments Master Backend API Client ──

import type { LoginRequest, LoginResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";
const v1 = (endpoint: string) => `${API_URL}/api/v1${endpoint}`;

// ── Auth ──

export async function loginRequest(
  credentials: LoginRequest
): Promise<LoginResponse["data"]> {
  const res = await fetch(v1("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const json: LoginResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      (json as unknown as { error?: string; message?: string }).error ||
        (json as unknown as { error?: string; message?: string }).message ||
        "Credenciais inválidas"
    );
  }

  return json.data;
}

// ── V3 Initiate Payment (re-exports api-client for unified access) ──

export { getSession, initiatePayment } from "@/lib/api-client";
export type { InitiatePaymentRequest, NormalisedInitiateResult } from "@/types/checkout";