"use client";

import { Loader2 } from "lucide-react";

interface RecipientCounterProps {
  count: number | null;
  totalAudienceCount?: number | null;
  loading: boolean;
  error?: string | null;
}

export function RecipientCounter({
  count,
  totalAudienceCount,
  loading,
  error,
}: RecipientCounterProps) {
  const excluded =
    totalAudienceCount != null && count != null
      ? totalAudienceCount - count
      : null;

  return (
    <div className="inline-flex items-center gap-3 bg-card border border-border/30 rounded-lg px-3 py-1.5">
      <div className="inline-flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Sending to</span>
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

      {excluded != null && excluded > 0 && !loading && !error && (
        <>
          <div className="w-px h-3.5 bg-border/40" />
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Excluded</span>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">
              {excluded.toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
