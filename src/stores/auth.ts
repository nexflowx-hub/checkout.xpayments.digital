// ── Auth Store (Zustand + localStorage persist) ──

import { create } from "zustand";
import { loginRequest } from "@/lib/api/xpApi";
import type { MerchantUser, LoginRequest } from "@/types/auth";

interface AuthState {
  user: MerchantUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "xp_auth";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });

    try {
      const data = await loginRequest(credentials);

      const user: MerchantUser = {
        id: data.merchantId,
        name: data.name,
        role: data.role,
        tier: data.tier,
      };

      // Persist to localStorage
      const payload = { user, token: data.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      set({
        user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao iniciar sessão";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const { user, token } = JSON.parse(raw) as {
        user: MerchantUser;
        token: string;
      };

      if (user?.id && token) {
        set({ user, token, isAuthenticated: true });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));