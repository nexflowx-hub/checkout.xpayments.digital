"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CountdownTimerProps {
  /** Target timestamp (ISO string or epoch ms) */
  targetDate?: string | number;
  /** Duration in seconds (alternative to targetDate) */
  durationSeconds?: number;
  /** Called when countdown reaches zero */
  onExpire?: () => void;
  /** Render prop or children */
  children?: (time: { minutes: number; seconds: number; total: number; formatted: string; isExpired: boolean }) => React.ReactNode;
  /** If true, does not start counting */
  paused?: boolean;
  /** Custom className for wrapper */
  className?: string;
}

/**
 * Reusable countdown timer component.
 * Can be used with a target date or a duration.
 */
export function CountdownTimer({
  targetDate,
  durationSeconds,
  onExpire,
  children,
  paused = false,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (targetDate) {
      const target = typeof targetDate === "string" ? new Date(targetDate).getTime() : targetDate;
      return Math.max(0, target - Date.now());
    }
    if (durationSeconds) {
      return durationSeconds * 1000;
    }
    return 0;
  });

  const onExpireRef = useRef(onExpire);

  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Recalculate when target changes
  const computedTarget = useMemo(() => {
    if (!targetDate) return null;
    return typeof targetDate === "string" ? new Date(targetDate).getTime() : targetDate;
  }, [targetDate]);

  useEffect(() => {
    if (paused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, timeLeft <= 0]);

  const totalSeconds = Math.max(0, Math.ceil(timeLeft / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isExpired = timeLeft <= 0;

  if (children) {
    return <>{children({ minutes, seconds, total: totalSeconds, formatted, isExpired })}</>;
  }

  return (
    <span className={className} aria-live="polite">
      {isExpired ? "00:00" : formatted}
    </span>
  );
}

/**
 * Simple display-only countdown badge.
 */
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
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            isExpired || variant === "urgent"
              ? "text-destructive border-destructive/30 bg-destructive/5"
              : "text-muted-foreground border-border bg-muted/30"
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