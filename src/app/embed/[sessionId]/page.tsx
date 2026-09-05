"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function EmbeddedCheckoutEntry() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = params?.sessionId;
    if (!sessionId) return;

    const next = new URLSearchParams(searchParams.toString());
    next.set("embedded", "1");
    window.location.replace(`/pay/${sessionId}?${next.toString()}`);
  }, [params?.sessionId, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        <span>A abrir checkout seguro…</span>
      </div>
    </div>
  );
}
