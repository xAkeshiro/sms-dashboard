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
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground">Recipients:</span>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : loading ? (
        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
      ) : (
        <span className="text-sm font-semibold tabular-nums">
          {count !== null ? count.toLocaleString() : "—"}
        </span>
      )}
    </div>
  );
}
