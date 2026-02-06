"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface AssociationCardProps {
  id: string;
  tag: string;
  name: string;
  accent: string;
  memberCount?: number;
  lastSmsDate?: string | null;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string) => void;
  onSendSms?: (id: string) => void;
  compact?: boolean;
}

export function AssociationCard({
  id,
  tag,
  name,
  accent,
  memberCount,
  selected = false,
  selectable = false,
  onSelect,
  onSendSms,
  compact = false,
}: AssociationCardProps) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative rounded-lg border transition-all duration-150",
        selectable && "cursor-pointer",
        selected
          ? "border-border bg-secondary/50"
          : "border-border/40 hover:border-border",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              selected && "ring-4 ring-current/10"
            )}
            style={{ backgroundColor: accent, color: accent }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {tag}
              </span>
              {selected && (
                <span className="text-[10px] text-primary font-medium">
                  Selected
                </span>
              )}
            </div>
            <h3
              className={cn(
                "font-medium leading-tight truncate",
                compact ? "text-sm" : "text-sm"
              )}
            >
              {name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums leading-none">
              {memberCount !== undefined ? memberCount.toLocaleString() : "—"}
            </p>
            {!compact && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                members
              </p>
            )}
          </div>

          {onSendSms && !compact && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendSms(id);
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
