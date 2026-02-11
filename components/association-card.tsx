"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface AssociationCardProps {
  id: string;
  name: string;
  accent: string;
  memberCount?: number;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string) => void;
  onSendSms?: (id: string) => void;
  compact?: boolean;
}

export function AssociationCard({
  id,
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
        "group relative rounded-xl border transition-all duration-200",
        selectable && "cursor-pointer",
        selected
          ? "border-border bg-card shadow-sm"
          : "border-border/30 bg-card/50 hover:bg-card hover:border-border/60 hover:shadow-sm",
        compact ? "p-4" : "p-5"
      )}
      style={{
        boxShadow: selected
          ? `0 0 20px ${accent}08, 0 1px 3px rgba(0,0,0,0.2)`
          : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0 transition-shadow duration-200",
              selected ? "shadow-[0_0_8px_currentColor]" : "group-hover:shadow-[0_0_6px_currentColor]"
            )}
            style={{ backgroundColor: accent, color: accent }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium leading-tight truncate">
                {name}
              </h3>
              {selected && (
                <span className="text-[10px] text-primary font-medium">
                  Selected
                </span>
              )}
            </div>
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
              className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-0.5"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
