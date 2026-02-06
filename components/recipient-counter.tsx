"use client";

import { Users, Loader2 } from "lucide-react";

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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <Users className="w-5 h-5 text-primary" />
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Estimated Recipients
        </p>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {loading ? "..." : count !== null ? count.toLocaleString() : "—"}
          </p>
        )}
      </div>
    </div>
  );
}
