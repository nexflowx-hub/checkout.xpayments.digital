// ── Auth Types for XPayments Master Backend ──

export interface MerchantUser {
  id: string;
  name: string;
  role: string;
  tier?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    merchantId: string;
    name: string;
    tier: string;
    token: string;
    role: string;
  };
}