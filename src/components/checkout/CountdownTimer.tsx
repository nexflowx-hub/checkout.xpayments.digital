"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  targetDate?: string | number;
  durationSeconds?: number;
  onExpire?: () => void;
  children?: (time: {
    minutes: number;
    seconds: number;
    total: number;
    formatted: string;
    isExpired: boolean;
    ready: boolean;
  }) => React.ReactNode;
  paused?: boolean;
  className?: string;
}

function calculateInitial(targetDate?: string | number, durationSeconds?: number): number {
  if (targetDate) {
    const target = typeof targetDate === "string" ? new Date(targetDate).getTime() : targetDate;
    return Math.max(0, target - Date.now());
  }
  if (durationSeconds) return Math.max(0, durationSeconds * 1000);
  return 0;
}

/**
 * Hydration-safe checkout countdown. The server and the first browser render
 * both use a neutral placeholder; the real remaining time is calculated after
 * mount so SSR never disagrees with the client clock.
 */
export function CountdownTimer({
  targetDate,
  durationSeconds,
  onExpire,
  children,
  paused = false,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    hasExpiredRef.current = false;
    setTimeLeft(calculateInitial(targetDate, durationSeconds));
  }, [targetDate, durationSeconds]);

  useEffect(() => {
    if (paused || timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      if (targetDate) {
        const target = typeof targetDate === "string" ? new Date(targetDate).getTime() : targetDate;
        const next = Math.max(0, target - Date.now());
        setTimeLeft(next);
        if (next <= 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpireRef.current?.();
          clearInterval(interval);
        }
        return;
      }

      setTimeLeft((previous) => {
        if (previous === null) return previous;
        const next = Math.max(0, previous - 1000);
        if (next <= 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpireRef.current?.();
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, targetDate, timeLeft === null, timeLeft !== null && timeLeft <= 0]);

  const ready = timeLeft !== null;
  const totalSeconds = ready ? Math.max(0, Math.ceil(timeLeft / 1000)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = ready
    ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : "--:--";
  const isExpired = ready && timeLeft <= 0;

  if (children) {
    return <>{children({ minutes, seconds, total: totalSeconds, formatted, isExpired, ready })}</>;
  }

  return (
    <span className={className} aria-live="polite">
      {isExpired ? "00:00" : formatted}
    </span>
  );
}

export function CountdownBadge({
  targetDate,
  durationSeconds,
  onExpire,
  variant = "default",
}: {
  targetDate?: string | number;
  durationSeconds?: number;
  onExpire?: () => void;
  variant?: "default" | "urgent";
}) {
  return (
    <CountdownTimer targetDate={targetDate} durationSeconds={durationSeconds} onExpire={onExpire}>
      {({ formatted, isExpired }) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            isExpired || variant === "urgent"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/30 text-muted-foreground"
          }`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          {isExpired ? "00:00" : formatted}
        </span>
      )}
    </CountdownTimer>
  );
}
