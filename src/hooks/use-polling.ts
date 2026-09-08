"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

interface UsePollingOptions {
  sessionId: string;
  enabled?: boolean;
  /** Base interval after the fast confirmation window. */
  interval?: number;
  maxAttempts?: number;
  onSuccess: () => void;
  onError?: (err: string) => void;
  onExpired?: () => void;
}

interface UsePollingReturn {
  isPolling: boolean;
  attempts: number;
  stopPolling: () => void;
}

function nextDelay(attempt: number, baseInterval: number): number {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return Math.max(baseInterval, 5000);
  }

  if (attempt <= 10) return Math.min(baseInterval, 1500);
  if (attempt <= 30) return Math.min(baseInterval, 2500);
  return Math.max(baseInterval, 3500);
}

/**
 * Polls checkout status without overlapping requests.
 * It checks aggressively during the first confirmation window and then backs
 * off, reducing DB/API pressure while keeping MB WAY/PIX success feedback fast.
 */
export function usePolling({
  sessionId,
  enabled = false,
  interval = 3000,
  maxAttempts = 100,
  onSuccess,
  onError,
  onExpired,
}: UsePollingOptions): UsePollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    setIsPolling(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      stopPolling();
      setAttempts(0);
      return;
    }

    stoppedRef.current = false;
    setIsPolling(true);
    setAttempts(0);

    let count = 0;

    const schedule = () => {
      if (stoppedRef.current) return;
      timerRef.current = setTimeout(() => {
        void poll();
      }, nextDelay(count, interval));
    };

    async function poll() {
      if (stoppedRef.current) return;

      count += 1;
      setAttempts(count);

      if (count > maxAttempts) {
        stopPolling();
        onError?.("Polling timeout");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/v1/checkout/session/${sessionId}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const raw = await res.json();
          const envelope = raw.data ?? raw;
          const status = String(envelope.status ?? "").toLowerCase();

          if (["paid", "completed", "succeeded"].includes(status)) {
            stopPolling();
            onSuccess();
            return;
          }

          if (["expired", "cancelled", "canceled", "failed"].includes(status)) {
            stopPolling();
            if (status === "expired") onExpired?.();
            else onError?.(`Status: ${status}`);
            return;
          }
        }
      } catch (err) {
        // A transient network/DB error must not abort an asynchronous payment.
        console.warn("[polling] Error:", err);
      }

      schedule();
    }

    void poll();

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    enabled,
    sessionId,
    interval,
    maxAttempts,
    onSuccess,
    onError,
    onExpired,
    stopPolling,
  ]);

  return { isPolling, attempts, stopPolling };
}
