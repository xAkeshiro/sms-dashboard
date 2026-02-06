"use client";

import { Loader2 } from "lucide-react";

interface RecipientCounterProps {
  count: number | null;
  loading: boolean;
  error?: string | null;
}

export function RecipientCounter({
  count,
  loading,
  error,
}: RecipientCounterProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-card border border-border/30 rounded-lg px-3 py-1.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Recipients</span>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : loading ? (
        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
      ) : (
        <span className="text-sm font-bold tabular-nums text-primary">
          {count !== null ? count.toLocaleString() : "—"}
        </span>
      )}
    </div>
  );
}
