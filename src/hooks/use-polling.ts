"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_MASTER_API || "https://api.xpayments.digital";

interface UsePollingOptions {
  sessionId: string;
  /** How often to poll (ms) */
  interval?: number;
  /** Max number of polls before stopping */
  maxAttempts?: number;
  /** Callback on successful payment */
  onSuccess: () => void;
  /** Callback on failure/error */
  onError?: (err: string) => void;
  /** Callback on expired session */
  onExpired?: () => void;
}

interface UsePollingReturn {
  isPolling: boolean;
  attempts: number;
  stopPolling: () => void;
}

/**
 * Polls the session status until payment is confirmed or timeout.
 * Uses the GET /api/v1/checkout/session/:id endpoint.
 */
export function usePolling({
  sessionId,
  interval = 3000,
  maxAttempts = 100,
  onSuccess,
  onError,
  onExpired,
}: UsePollingOptions): UsePollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const stoppedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    stoppedRef.current = false;
    setIsPolling(true);
    setAttempts(0);

    let count = 0;

    async function poll() {
      if (stoppedRef.current) return;
      count++;
      setAttempts(count);

      if (count > maxAttempts) {
        stopPolling();
        onError?.("Polling timeout");
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/v1/checkout/session/${sessionId}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          // Server error — keep polling
          return;
        }

        const raw = await res.json();
        const envelope = raw.data ?? raw;

        // Check session status
        const status = envelope.status as string | undefined;

        if (status === "paid" || status === "completed" || status === "succeeded") {
          stopPolling();
          onSuccess();
          return;
        }

        if (status === "expired" || status === "cancelled" || status === "failed") {
          stopPolling();
          if (status === "expired") {
            onExpired?.();
          } else {
            onError?.(`Status: ${status}`);
          }
          return;
        }
      } catch (err) {
        // Network error — keep polling, don't crash
        console.warn("[polling] Error:", err);
      }
    }

    // Initial poll
    poll();

    // Subsequent polls
    intervalRef.current = setInterval(poll, interval);

    return () => {
      stopPolling();
    };
  }, [sessionId, interval, maxAttempts, onSuccess, onError, onExpired, stopPolling]);

  return { isPolling, attempts, stopPolling };
}